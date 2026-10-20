-- Atomic Function for Seedling Dispatch
-- 0005_inventory_functions.sql

CREATE OR REPLACE FUNCTION public.dispatch_nursery_batch(
  p_distribution_id UUID,
  p_responsible_user UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_batch_id UUID;
  v_quantity INTEGER;
  v_current_stock INTEGER;
  v_status TEXT;
BEGIN
  -- 1. Get distribution details and lock the batch row to prevent concurrent overdraw
  SELECT source_batch_id, quantity, status
  INTO v_batch_id, v_quantity, v_status
  FROM distributions
  WHERE id = p_distribution_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Distribution not found';
  END IF;

  IF v_status != 'approved' THEN
    RAISE EXCEPTION 'Only approved distributions can be dispatched. Current status: %', v_status;
  END IF;

  -- 2. Get and lock current stock in the batch
  SELECT current_stock INTO v_current_stock
  FROM nursery_batches
  WHERE id = v_batch_id
  FOR UPDATE;

  IF v_current_stock < v_quantity THEN
    RAISE EXCEPTION 'Insufficient stock in batch. Available: %, Requested: %', v_current_stock, v_quantity;
  END IF;

  -- 3. Deduct stock from batch
  UPDATE nursery_batches
  SET current_stock = current_stock - v_quantity
  WHERE id = v_batch_id;

  -- 4. Create inventory movement record
  INSERT INTO nursery_inventory_movements (
    batch_id,
    movement_type,
    quantity,
    responsible_user,
    related_distribution_id,
    notes
  ) VALUES (
    v_batch_id,
    'dispatch',
    -v_quantity,
    p_responsible_user,
    p_distribution_id,
    'Automatic deduction upon dispatch'
  );

  -- 5. Update distribution status
  UPDATE distributions
  SET status = 'dispatched',
      dispatch_date = now()
  WHERE id = p_distribution_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record production (adding stock)
CREATE OR REPLACE FUNCTION public.record_nursery_production(
  p_batch_id UUID,
  p_quantity INTEGER,
  p_responsible_user UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Increase stock
  UPDATE nursery_batches
  SET current_stock = current_stock + p_quantity
  WHERE id = p_batch_id;

  -- 2. Create movement record
  INSERT INTO nursery_inventory_movements (
    batch_id,
    movement_type,
    quantity,
    responsible_user,
    notes
  ) VALUES (
    p_batch_id,
    'production',
    p_quantity,
    p_responsible_user,
    p_notes
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record loss
CREATE OR REPLACE FUNCTION public.record_nursery_loss(
  p_batch_id UUID,
  p_quantity INTEGER,
  p_responsible_user UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  SELECT current_stock INTO v_current_stock FROM nursery_batches WHERE id = p_batch_id FOR UPDATE;

  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Cannot record loss greater than current stock';
  END IF;

  UPDATE nursery_batches
  SET current_stock = current_stock - p_quantity
  WHERE id = p_batch_id;

  INSERT INTO nursery_inventory_movements (
    batch_id,
    movement_type,
    quantity,
    responsible_user,
    notes
  ) VALUES (
    p_batch_id,
    'loss',
    -p_quantity,
    p_responsible_user,
    p_notes
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
