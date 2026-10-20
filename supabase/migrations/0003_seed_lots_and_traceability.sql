-- Migration for Seed Lots and Traceability
-- 0003_seed_lots_and_traceability.sql

-- 1. Create Seed Lots Table
CREATE TABLE seed_lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL, -- e.g., SL-000001
  public_token UUID DEFAULT uuid_generate_v4(), -- For QR trace pages
  species TEXT NOT NULL,
  collection_date DATE NOT NULL,
  collection_location TEXT NOT NULL,
  provenance_notes TEXT,
  initial_quantity INTEGER NOT NULL CHECK (initial_quantity >= 0),
  unit_of_measurement TEXT NOT NULL, -- e.g., 'kg', 'count'
  quality_certification TEXT,
  processing_notes TEXT,
  status TEXT DEFAULT 'collected' CHECK (status IN ('collected', 'processed', 'sown', 'distributed', 'archived')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Join Table for Mother Tree Sources
-- A seed lot can come from multiple source trees
CREATE TABLE seed_lot_sources (
  seed_lot_id UUID REFERENCES seed_lots(id) ON DELETE CASCADE,
  mother_tree_id UUID REFERENCES mother_trees(id) ON DELETE CASCADE,
  contribution_notes TEXT,
  PRIMARY KEY (seed_lot_id, mother_tree_id)
);

-- 3. Create Seed Lot Movements (Inventory History)
CREATE TABLE seed_lot_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seed_lot_id UUID REFERENCES seed_lots(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('collected', 'sown', 'distributed', 'lost', 'adjusted')),
  quantity INTEGER NOT NULL, -- Positive for additions, negative for deductions
  movement_date TIMESTAMPTZ DEFAULT now(),
  responsible_user UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes
CREATE INDEX idx_seed_lots_reference ON seed_lots(reference);
CREATE INDEX idx_seed_lots_token ON seed_lots(public_token);
CREATE INDEX idx_seed_lot_movements_lot ON seed_lot_movements(seed_lot_id);

-- 5. Row Level Security (RLS)
ALTER TABLE seed_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_lot_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_lot_movements ENABLE ROW LEVEL SECURITY;

-- Policies for seed_lots
CREATE POLICY "Authorized roles can view seed lots"
  ON seed_lots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'verifier')
    )
  );

CREATE POLICY "Coordinators and admins can manage seed lots"
  ON seed_lots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator')
    )
  );

-- Policies for seed_lot_sources
CREATE POLICY "Authorized roles can view sources"
  ON seed_lot_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'verifier')
    )
  );

CREATE POLICY "Coordinators and admins can manage sources"
  ON seed_lot_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator')
    )
  );

-- Policies for seed_lot_movements
CREATE POLICY "Authorized roles can view movements"
  ON seed_lot_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'verifier')
    )
  );

CREATE POLICY "Coordinators and admins can manage movements"
  ON seed_lot_movements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator')
    )
  );

-- 6. Trigger for updating seed_lots.updated_at
CREATE TRIGGER update_seed_lots_updated_at
  BEFORE UPDATE ON seed_lots
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();
