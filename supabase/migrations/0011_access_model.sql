-- 0011_access_model.sql
-- Who can see and do what. Everyone signed in (any role except "pending") sees the shared network overview,
-- the directory and the resource library. Staff roles see and change operational records. Only admins manage people.

-- 1. Policies call these helpers, so every API role must be able to execute them (they return false/NULL for anon).
GRANT EXECUTE ON FUNCTION public.can_manage_batch(UUID) TO anon;

-- 2. There must always be an administrator.
CREATE OR REPLACE FUNCTION public.protect_last_admin() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.role = 'admin' AND (TG_OP = 'DELETE' OR NEW.role <> 'admin') THEN
    IF (SELECT count(*) FROM profiles WHERE role = 'admin' AND id <> OLD.id) = 0 THEN
      RAISE EXCEPTION 'There must always be at least one administrator';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;
REVOKE ALL ON FUNCTION public.protect_last_admin() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS protect_last_admin ON profiles;
CREATE TRIGGER protect_last_admin BEFORE UPDATE OR DELETE ON profiles FOR EACH ROW EXECUTE FUNCTION public.protect_last_admin();

-- 3. Shared company-wide views (aggregates and approved directory entries only)
ALTER TABLE member_applications ADD COLUMN IF NOT EXISTS directory_opt_in BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'sw'));

CREATE OR REPLACE FUNCTION public.network_summary() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role TEXT := public.current_app_role();
BEGIN
  IF v_role IS NULL OR v_role = 'pending' THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'seed_lots', (SELECT count(*) FROM seed_lots WHERE status <> 'archived'),
    'nurseries', (SELECT count(*) FROM nurseries WHERE approval_status = 'approved'),
    'seedlings_in_stock', (SELECT COALESCE(sum(current_stock), 0) FROM nursery_batches),
    'trees_planted', (SELECT COALESCE(sum(quantity_planted), 0) FROM planting_events),
    'verified_checks', (SELECT count(*) FROM survival_checks WHERE submission_status = 'verified'),
    'survival', (SELECT jsonb_build_object('planted', COALESCE(sum(pe.quantity_planted), 0), 'alive', COALESCE(sum(c.confirmed_alive), 0),
                        'dead', COALESCE(sum(c.confirmed_dead), 0), 'unresolved', COALESCE(sum(c.unresolved), 0), 'uninspected', COALESCE(sum(c.uninspected), 0))
                 FROM planting_events pe
                 JOIN LATERAL (SELECT * FROM survival_checks sc WHERE sc.planting_event_id = pe.id AND sc.submission_status = 'verified'
                               ORDER BY sc.inspection_date DESC, sc.created_at DESC LIMIT 1) c ON true));
END $$;

CREATE OR REPLACE FUNCTION public.staff_directory() RETURNS TABLE (kind TEXT, name TEXT, organisation TEXT, county TEXT, detail TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_role TEXT := public.current_app_role();
BEGIN
  IF v_role IS NULL OR v_role = 'pending' THEN RETURN; END IF;
  RETURN QUERY
    SELECT 'nursery'::TEXT, n.name, NULL::TEXT, n.county, n.general_location FROM nurseries n WHERE n.approval_status = 'approved'
    UNION ALL
    SELECT m.applicant_type, m.full_name, m.organisation_name, m.county, NULL::TEXT FROM member_applications m WHERE m.status = 'approved' AND m.directory_opt_in
    ORDER BY 1, 2;
END $$;

-- 4. Pick-lists for forms, so people can choose without being given access to whole tables
CREATE OR REPLACE FUNCTION public.lot_options() RETURNS TABLE (id UUID, reference TEXT, species TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.reference, s.species FROM seed_lots s
  WHERE public.current_app_role() IN ('admin', 'coordinator', 'verifier', 'nursery_operator') AND s.status <> 'archived' ORDER BY s.created_at DESC $$;
CREATE OR REPLACE FUNCTION public.person_options(p_role TEXT) RETURNS TABLE (id UUID, full_name TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, COALESCE(p.full_name, p.email) FROM profiles p
  WHERE public.current_app_role() IN ('admin', 'coordinator') AND p.role::text = p_role AND p_role IN ('nursery_operator', 'grower') ORDER BY 2 $$;

REVOKE ALL ON FUNCTION public.network_summary(), public.staff_directory(), public.lot_options(), public.person_options(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.network_summary(), public.staff_directory(), public.lot_options(), public.person_options(TEXT) TO authenticated;

-- 5. Nursery operators and growers see what they need for their own work
DROP POLICY IF EXISTS "Operators can view their nurseries" ON nurseries;
CREATE POLICY "Operators can view their nurseries" ON nurseries FOR SELECT USING (responsible_operator = auth.uid());
DROP POLICY IF EXISTS "Operators can view distributions from their batches" ON distributions;
CREATE POLICY "Operators can view distributions from their batches" ON distributions FOR SELECT
  USING (source_batch_id IS NOT NULL AND public.can_manage_batch(source_batch_id));
DROP POLICY IF EXISTS "Recipients can view their distributions" ON distributions;
CREATE POLICY "Recipients can view their distributions" ON distributions FOR SELECT USING (recipient_id = auth.uid());
DROP POLICY IF EXISTS "Operators can view movements of their batches" ON nursery_inventory_movements;
CREATE POLICY "Operators can view movements of their batches" ON nursery_inventory_movements FOR SELECT
  USING (batch_id IS NOT NULL AND public.can_manage_batch(batch_id));

CREATE OR REPLACE FUNCTION public.batch_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.current_app_role() = 'nursery_operator' THEN
    IF NOT EXISTS (SELECT 1 FROM nurseries WHERE id = NEW.nursery_id AND responsible_operator = auth.uid()) THEN
      RAISE EXCEPTION 'You can only create batches for a nursery you run';
    END IF;
    NEW.responsible_operator := auth.uid();
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.batch_guard() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS batch_guard ON nursery_batches;
CREATE TRIGGER batch_guard BEFORE INSERT OR UPDATE OF nursery_id ON nursery_batches FOR EACH ROW EXECUTE FUNCTION public.batch_guard();

-- 6. The person who submitted a survival check may correct it while it is waiting or was sent back (never verify it)
DROP POLICY IF EXISTS "Observers can correct their own checks" ON survival_checks;
CREATE POLICY "Observers can correct their own checks" ON survival_checks FOR UPDATE
  USING (observer_id = auth.uid() AND submission_status IN ('submitted', 'requires_correction'))
  WITH CHECK (observer_id = auth.uid() AND submission_status = 'submitted');

-- 7. Public form throttle: callers pass a salted hash of their address; no personal data is stored here
CREATE TABLE IF NOT EXISTS public.submission_log (id BIGSERIAL PRIMARY KEY, key TEXT NOT NULL, kind TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_submission_log_lookup ON submission_log (key, kind, created_at);
ALTER TABLE submission_log ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.allow_submission(p_key TEXT, p_kind TEXT, p_limit INT, p_window INTERVAL) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INT;
BEGIN
  DELETE FROM submission_log WHERE created_at < now() - interval '2 days';
  SELECT count(*) INTO n FROM submission_log WHERE key = p_key AND kind = p_kind AND created_at > now() - p_window;
  IF n >= p_limit THEN RETURN FALSE; END IF;
  INSERT INTO submission_log (key, kind) VALUES (p_key, p_kind);
  RETURN TRUE;
END $$;
REVOKE ALL ON FUNCTION public.allow_submission(TEXT, TEXT, INT, INTERVAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.allow_submission(TEXT, TEXT, INT, INTERVAL) TO anon, authenticated;
