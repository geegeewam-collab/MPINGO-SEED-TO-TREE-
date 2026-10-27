-- 0014: "Seedlings produced" now counts what a batch has actually produced.
--
-- Until now, recording production raised current_stock but left seedlings_produced at 0,
-- so the Nursery Batches list showed "Seedlings produced: 0" next to a non-zero stock.
-- Losses and dispatches change current_stock only. seedlings_produced is a running total of production.

CREATE OR REPLACE FUNCTION public.record_nursery_production(p_batch_id UUID, p_quantity INTEGER, p_responsible_user UUID, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR p_responsible_user IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero'; END IF;
  IF NOT public.can_manage_batch(p_batch_id) THEN RAISE EXCEPTION 'Not authorised for this batch'; END IF;
  PERFORM 1 FROM nursery_batches WHERE id = p_batch_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Batch not found'; END IF;
  UPDATE nursery_batches
     SET current_stock = current_stock + p_quantity,
         seedlings_produced = COALESCE(seedlings_produced, 0) + p_quantity
   WHERE id = p_batch_id;
  INSERT INTO nursery_inventory_movements (batch_id, movement_type, quantity, responsible_user, notes)
    VALUES (p_batch_id, 'production', p_quantity, auth.uid(), p_notes);
  RETURN TRUE;
END $$;

REVOKE ALL ON FUNCTION public.record_nursery_production(UUID, INTEGER, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_nursery_production(UUID, INTEGER, UUID, TEXT) TO authenticated;

-- Backfill batches that already have production recorded. Never lowers a value that someone set by hand.
UPDATE nursery_batches b
   SET seedlings_produced = m.total
  FROM (
    SELECT batch_id, SUM(quantity)::INTEGER AS total
      FROM nursery_inventory_movements
     WHERE movement_type = 'production'
     GROUP BY batch_id
  ) m
 WHERE m.batch_id = b.id
   AND COALESCE(b.seedlings_produced, 0) < m.total;
