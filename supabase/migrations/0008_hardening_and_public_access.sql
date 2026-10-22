-- 0008_hardening_and_public_access.sql
-- Fixes found while auditing 0001-0007 against a real Postgres:
--  * "profiles" admin policy referred to itself (infinite recursion on every profile read)
--  * records required a reference number but nothing generated one
--  * stock functions ran with full power and trusted the caller (callable by anyone)
--  * public QR trace and sponsor grove pages had no safe way to read data
--  * survival checks could be reviewed by their own submitter and did not have to add up to the number planted
--  * public forms could insert rows with any status

-- 1. Role helpers (SECURITY DEFINER so they can read profiles without triggering its policies)
CREATE OR REPLACE FUNCTION public.current_app_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT role::text FROM public.profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.can_manage_batch(p_batch UUID) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT CASE public.current_app_role()
     WHEN 'admin' THEN true
     WHEN 'coordinator' THEN true
     WHEN 'nursery_operator' THEN EXISTS (SELECT 1 FROM public.nursery_batches b WHERE b.id = p_batch AND b.responsible_operator = auth.uid())
     ELSE false END $$;

REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_batch(UUID) FROM PUBLIC, anon;
-- anon needs EXECUTE because profile policies call it while other tables' policies are checked; it returns NULL for anon
GRANT EXECUTE ON FUNCTION public.current_app_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_batch(UUID) TO authenticated;

DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL
  USING (public.current_app_role() = 'admin') WITH CHECK (public.current_app_role() = 'admin');

-- 2. Reference numbers (MT-000001, SL-000001, ...)
CREATE OR REPLACE FUNCTION public.set_reference() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := TG_ARGV[0] || '-' || lpad(nextval('public.ref_seq_' || lower(TG_ARGV[0]))::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.set_reference() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('mother_trees','MT'),('seed_lots','SL'),('nurseries','NUR'),('nursery_batches','BATCH'),
    ('distributions','DIST'),('planting_sites','SITE'),('planting_events','PLANT'),
    ('survival_checks','SURV'),('member_applications','APP'),('seed_requests','REQ')) AS t(tbl, prefix)
  LOOP
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.ref_seq_%s', lower(r.prefix));
    EXECUTE format('DROP TRIGGER IF EXISTS set_reference ON public.%I', r.tbl);
    EXECUTE format('CREATE TRIGGER set_reference BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_reference(%L)', r.tbl, r.prefix);
  END LOOP;
END $$;

-- 3. Public forms may only create new, un-reviewed rows
DROP POLICY IF EXISTS "Public can submit membership applications" ON member_applications;
CREATE POLICY "Public can submit membership applications" ON member_applications FOR INSERT
  WITH CHECK (status = 'pending' AND reviewed_by IS NULL AND review_notes IS NULL AND consent_to_data_handling IS TRUE);
DROP POLICY IF EXISTS "Public can submit seed requests" ON seed_requests;
CREATE POLICY "Public can submit seed requests" ON seed_requests FOR INSERT
  WITH CHECK (status = 'submitted' AND reviewed_by IS NULL AND review_notes IS NULL);

-- 4. Stock functions: authenticated callers only, role-checked, identity taken from the session
CREATE OR REPLACE FUNCTION public.dispatch_nursery_batch(p_distribution_id UUID, p_responsible_user UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_batch UUID; v_qty INTEGER; v_stock INTEGER; v_status TEXT;
BEGIN
  IF auth.uid() IS NULL OR p_responsible_user IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  SELECT source_batch_id, quantity, status INTO v_batch, v_qty, v_status
    FROM distributions WHERE id = p_distribution_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Distribution not found'; END IF;
  IF v_batch IS NULL THEN RAISE EXCEPTION 'Distribution has no source batch'; END IF;
  IF NOT public.can_manage_batch(v_batch) THEN RAISE EXCEPTION 'Not authorised to dispatch from this batch'; END IF;
  IF v_status <> 'approved' THEN
    RAISE EXCEPTION 'Only approved distributions can be dispatched. Current status: %', v_status;
  END IF;
  SELECT current_stock INTO v_stock FROM nursery_batches WHERE id = v_batch FOR UPDATE;
  IF v_stock < v_qty THEN
    RAISE EXCEPTION 'Insufficient stock in batch. Available: %, Requested: %', v_stock, v_qty;
  END IF;
  UPDATE nursery_batches SET current_stock = current_stock - v_qty WHERE id = v_batch;
  INSERT INTO nursery_inventory_movements (batch_id, movement_type, quantity, responsible_user, related_distribution_id, notes)
    VALUES (v_batch, 'dispatch', -v_qty, auth.uid(), p_distribution_id, 'Automatic deduction upon dispatch');
  UPDATE distributions SET status = 'dispatched', dispatch_date = now() WHERE id = p_distribution_id;
  RETURN TRUE;
END $$;

CREATE OR REPLACE FUNCTION public.record_nursery_production(p_batch_id UUID, p_quantity INTEGER, p_responsible_user UUID, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR p_responsible_user IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero'; END IF;
  IF NOT public.can_manage_batch(p_batch_id) THEN RAISE EXCEPTION 'Not authorised for this batch'; END IF;
  PERFORM 1 FROM nursery_batches WHERE id = p_batch_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Batch not found'; END IF;
  UPDATE nursery_batches SET current_stock = current_stock + p_quantity WHERE id = p_batch_id;
  INSERT INTO nursery_inventory_movements (batch_id, movement_type, quantity, responsible_user, notes)
    VALUES (p_batch_id, 'production', p_quantity, auth.uid(), p_notes);
  RETURN TRUE;
END $$;

CREATE OR REPLACE FUNCTION public.record_nursery_loss(p_batch_id UUID, p_quantity INTEGER, p_responsible_user UUID, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_stock INTEGER;
BEGIN
  IF auth.uid() IS NULL OR p_responsible_user IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero'; END IF;
  IF NOT public.can_manage_batch(p_batch_id) THEN RAISE EXCEPTION 'Not authorised for this batch'; END IF;
  SELECT current_stock INTO v_stock FROM nursery_batches WHERE id = p_batch_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Batch not found'; END IF;
  IF v_stock < p_quantity THEN RAISE EXCEPTION 'Cannot record loss greater than current stock'; END IF;
  UPDATE nursery_batches SET current_stock = current_stock - p_quantity WHERE id = p_batch_id;
  INSERT INTO nursery_inventory_movements (batch_id, movement_type, quantity, responsible_user, notes)
    VALUES (p_batch_id, 'loss', -p_quantity, auth.uid(), p_notes);
  RETURN TRUE;
END $$;

REVOKE ALL ON FUNCTION public.dispatch_nursery_batch(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_nursery_production(UUID, INTEGER, UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_nursery_loss(UUID, INTEGER, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dispatch_nursery_batch(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_nursery_production(UUID, INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_nursery_loss(UUID, INTEGER, UUID, TEXT) TO authenticated;

-- 5. Survival checks: counts must add up to the number planted; nobody reviews their own submission;
--    verified checks are final.
CREATE OR REPLACE FUNCTION public.survival_check_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_planted INTEGER; v_total INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.submission_status := 'submitted'; NEW.verifier_id := NULL; NEW.verification_date := NULL;
    NEW.observer_id := COALESCE(auth.uid(), NEW.observer_id); NEW.created_by := COALESCE(auth.uid(), NEW.created_by);
  ELSE
    IF OLD.submission_status = 'verified' THEN RAISE EXCEPTION 'A verified survival check cannot be changed'; END IF;
    IF NEW.submission_status IS DISTINCT FROM OLD.submission_status
       AND NEW.submission_status IN ('verified', 'rejected', 'requires_correction') THEN
      IF public.current_app_role() NOT IN ('admin', 'verifier') THEN
        RAISE EXCEPTION 'Only verifiers and admins can review survival checks';
      END IF;
      IF auth.uid() IS NOT DISTINCT FROM OLD.observer_id THEN
        RAISE EXCEPTION 'You cannot review a survival check you submitted';
      END IF;
      NEW.verifier_id := auth.uid(); NEW.verification_date := now();
    END IF;
  END IF;
  SELECT quantity_planted INTO v_planted FROM planting_events WHERE id = NEW.planting_event_id;
  IF v_planted IS NULL THEN RAISE EXCEPTION 'A survival check must belong to a planting event'; END IF;
  v_total := NEW.confirmed_alive + NEW.confirmed_dead + NEW.unresolved + NEW.uninspected;
  IF v_total <> v_planted THEN
    RAISE EXCEPTION 'Alive + dead + unresolved + uninspected (%) must equal the number planted (%)', v_total, v_planted;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS survival_check_guard ON survival_checks;
CREATE TRIGGER survival_check_guard BEFORE INSERT OR UPDATE ON survival_checks
  FOR EACH ROW EXECUTE FUNCTION public.survival_check_guard();

-- 6. Audit trail (personal details and coordinates are stripped from the stored copy)
CREATE OR REPLACE FUNCTION public.audit_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  strip TEXT[] := ARRAY['email','phone','full_name','requester_name','latitude','longitude','location_accuracy'];
  v_old JSONB; v_new JSONB;
BEGIN
  IF TG_OP <> 'INSERT' THEN v_old := to_jsonb(OLD) - strip; END IF;
  IF TG_OP <> 'DELETE' THEN v_new := to_jsonb(NEW) - strip; END IF;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
  VALUES (auth.uid(), lower(TG_OP), TG_TABLE_NAME, COALESCE((to_jsonb(NEW)->>'id'), (to_jsonb(OLD)->>'id'))::uuid, v_old, v_new);
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.audit_change() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['mother_trees','seed_lots','nursery_batches','distributions','planting_events','survival_checks','groves','profiles'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_change ON public.%I', t);
    EXECUTE format('CREATE TRIGGER audit_change AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_change()', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['member_applications','seed_requests'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_change ON public.%I', t);
    EXECUTE format('CREATE TRIGGER audit_change AFTER UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_change()', t);
  END LOOP;
END $$;

-- 7. Public, read-only views of approved data (no coordinates, no collection location, no personal details)
CREATE OR REPLACE FUNCTION public.public_trace(p_token UUID) RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'reference', s.reference, 'species', s.species, 'collection_date', s.collection_date,
    'quantity', s.initial_quantity, 'unit', s.unit_of_measurement, 'status', s.status,
    'source_tree_count', (SELECT count(*) FROM seed_lot_sources x WHERE x.seed_lot_id = s.id),
    'source_counties', (SELECT COALESCE(jsonb_agg(DISTINCT m.county) FILTER (WHERE m.county IS NOT NULL), '[]'::jsonb)
                        FROM seed_lot_sources x JOIN mother_trees m ON m.id = x.mother_tree_id WHERE x.seed_lot_id = s.id))
  FROM seed_lots s WHERE s.public_token = p_token AND s.status <> 'archived' $$;

CREATE OR REPLACE FUNCTION public.public_grove(p_slug TEXT) RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'title', g.title, 'description', g.description, 'sponsor_name', g.sponsor_name,
    'published_at', g.published_at, 'photos', to_jsonb(g.approved_photos),
    'site_county', CASE WHEN ps.visibility_classification IN ('restricted', 'public') THEN ps.county END,
    'planting', CASE WHEN pe.id IS NULL THEN NULL ELSE jsonb_build_object('date', pe.planting_date, 'species', pe.species, 'quantity', pe.quantity_planted) END,
    'latest_verified_check', (SELECT jsonb_build_object('inspection_date', sc.inspection_date, 'alive', sc.confirmed_alive, 'dead', sc.confirmed_dead,
                                     'unresolved', sc.unresolved, 'uninspected', sc.uninspected)
                              FROM survival_checks sc WHERE sc.planting_event_id = pe.id AND sc.submission_status = 'verified'
                              ORDER BY sc.inspection_date DESC, sc.created_at DESC LIMIT 1),
    'updates', (SELECT COALESCE(jsonb_agg(jsonb_build_object('date', u.update_date, 'title', u.title, 'content', u.content, 'photo_url', u.photo_url)
                                          ORDER BY u.update_date DESC), '[]'::jsonb)
                FROM grove_updates u WHERE u.grove_id = g.id AND u.is_public))
  FROM groves g
  LEFT JOIN planting_events pe ON pe.id = g.primary_planting_event_id
  LEFT JOIN planting_sites ps ON ps.id = g.planting_site_id
  WHERE g.slug = p_slug AND g.is_published $$;

REVOKE ALL ON FUNCTION public.public_trace(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_grove(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_trace(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_grove(TEXT) TO anon, authenticated;

-- 8. MRI works in Kenya; the original defaults said Tanzania
ALTER TABLE mother_trees ALTER COLUMN country SET DEFAULT 'Kenya';
ALTER TABLE nurseries ALTER COLUMN country SET DEFAULT 'Kenya';
ALTER TABLE planting_sites ALTER COLUMN country SET DEFAULT 'Kenya';
