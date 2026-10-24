-- 0009_create_seed_lot_function.sql
-- Creates a seed lot and its source trees in one transaction. SECURITY INVOKER, so the caller's row-level
-- security rules apply (only coordinators and admins can write seed lots).
CREATE OR REPLACE FUNCTION public.create_seed_lot(p_lot JSONB, p_sources UUID[])
RETURNS UUID LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF COALESCE(array_length(p_sources, 1), 0) = 0 THEN
    RAISE EXCEPTION 'A seed lot needs at least one source mother tree';
  END IF;
  INSERT INTO seed_lots (species, collection_date, collection_location, provenance_notes, initial_quantity,
                         unit_of_measurement, quality_certification, processing_notes, created_by)
  VALUES (p_lot->>'species', (p_lot->>'collection_date')::date, p_lot->>'collection_location', p_lot->>'provenance_notes',
          (p_lot->>'initial_quantity')::int, p_lot->>'unit_of_measurement', p_lot->>'quality_certification',
          p_lot->>'processing_notes', auth.uid())
  RETURNING id INTO v_id;
  INSERT INTO seed_lot_sources (seed_lot_id, mother_tree_id) SELECT v_id, s.src FROM (SELECT DISTINCT unnest(p_sources) AS src) s;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.create_seed_lot(JSONB, UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_seed_lot(JSONB, UUID[]) TO authenticated;
