-- 0010_planting_event_guard.sql
-- Trees planted from a distribution can never exceed what was dispatched, whichever way the record arrives
-- (web form, API, or the offline queue). SECURITY DEFINER because growers cannot read distributions directly.
CREATE OR REPLACE FUNCTION public.planting_event_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_qty INTEGER; v_status TEXT; v_batch UUID; v_used INTEGER;
BEGIN
  IF NEW.distribution_id IS NULL THEN RETURN NEW; END IF;
  SELECT quantity, status, source_batch_id INTO v_qty, v_status, v_batch
    FROM distributions WHERE id = NEW.distribution_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'That distribution does not exist'; END IF;
  IF v_status NOT IN ('dispatched', 'received') THEN
    RAISE EXCEPTION 'That distribution has not been dispatched yet';
  END IF;
  SELECT COALESCE(SUM(quantity_planted), 0) INTO v_used FROM planting_events
    WHERE distribution_id = NEW.distribution_id AND id <> NEW.id;
  IF v_used + NEW.quantity_planted > v_qty THEN
    RAISE EXCEPTION 'Only % seedlings from this distribution are left to plant', v_qty - v_used;
  END IF;
  NEW.source_batch_id := COALESCE(NEW.source_batch_id, v_batch);
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.planting_event_guard() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS planting_event_guard ON planting_events;
CREATE TRIGGER planting_event_guard BEFORE INSERT OR UPDATE ON planting_events
  FOR EACH ROW EXECUTE FUNCTION public.planting_event_guard();
