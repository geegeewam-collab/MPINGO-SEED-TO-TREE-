-- Migration for Nursery and Distribution System
-- 0004_nursery_and_distribution.sql

-- 1. Nurseries Table
CREATE TABLE nurseries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL, -- e.g., NUR-000001
  name TEXT NOT NULL,
  responsible_operator UUID REFERENCES profiles(id),
  general_location TEXT NOT NULL,
  county TEXT,
  country TEXT DEFAULT 'Tanzania',
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Nursery Batches Table
CREATE TABLE nursery_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL, -- e.g., BATCH-000001
  nursery_id UUID REFERENCES nurseries(id) ON DELETE CASCADE,
  seed_lot_id UUID REFERENCES seed_lots(id) ON DELETE SET NULL,
  seeds_sown INTEGER NOT NULL CHECK (seeds_sown >= 0),
  seedlings_produced INTEGER DEFAULT 0 CHECK (seedlings_produced >= 0),
  current_stock INTEGER DEFAULT 0 CHECK (current_stock >= 0),
  propagation_stage TEXT,
  creation_date DATE DEFAULT CURRENT_DATE,
  last_inspection TIMESTAMPTZ,
  responsible_operator UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Nursery Inventory Movements Table
CREATE TABLE nursery_inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES nursery_batches(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('production', 'loss', 'dispatch', 'return', 'adjustment')),
  quantity INTEGER NOT NULL, -- Positive for additions, negative for deductions
  movement_date TIMESTAMPTZ DEFAULT now(),
  responsible_user UUID REFERENCES profiles(id),
  related_distribution_id UUID, -- Optional link to distribution
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Distributions Table
CREATE TABLE distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL, -- e.g., DIST-000001
  recipient_id UUID REFERENCES profiles(id),
  source_nursery_id UUID REFERENCES nurseries(id),
  source_batch_id UUID REFERENCES nursery_batches(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit TEXT DEFAULT 'seedlings',
  destination_site_id UUID, -- Will be linked to planting_sites after creation
  intended_purpose TEXT,
  request_date DATE DEFAULT CURRENT_DATE,
  dispatch_date TIMESTAMPTZ,
  receipt_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'dispatched', 'received', 'cancelled')),
  created_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Planting Sites Table
CREATE TABLE planting_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL, -- e.g., SITE-000001
  name TEXT NOT NULL,
  general_location TEXT NOT NULL,
  county TEXT,
  country TEXT DEFAULT 'Tanzania',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_accuracy DOUBLE PRECISION,
  capture_method TEXT CHECK (capture_method IN ('gps', 'manual')),
  capture_timestamp TIMESTAMPTZ,
  responsible_grower UUID REFERENCES profiles(id),
  habitat_notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  visibility_classification TEXT DEFAULT 'private' CHECK (visibility_classification IN ('private', 'restricted', 'public')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- 6. Planting Events Table
CREATE TABLE planting_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL, -- e.g., PLANT-000001
  site_id UUID REFERENCES planting_sites(id) ON DELETE CASCADE,
  distribution_id UUID REFERENCES distributions(id) ON DELETE SET NULL,
  source_batch_id UUID REFERENCES nursery_batches(id) ON DELETE SET NULL,
  planting_date DATE DEFAULT CURRENT_DATE,
  species TEXT NOT NULL,
  quantity_planted INTEGER NOT NULL CHECK (quantity_planted > 0),
  responsible_grower UUID REFERENCES profiles(id),
  recorder_id UUID REFERENCES profiles(id),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_accuracy DOUBLE PRECISION,
  capture_method TEXT CHECK (capture_method IN ('gps', 'manual')),
  capture_timestamp TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_nurseries_reference ON nurseries(reference);
CREATE INDEX idx_nursery_batches_ref ON nursery_batches(reference);
CREATE INDEX idx_nursery_inv_batch ON nursery_inventory_movements(batch_id);
CREATE INDEX idx_distributions_ref ON distributions(reference);
CREATE INDEX idx_planting_sites_ref ON planting_sites(reference);
CREATE INDEX idx_planting_events_ref ON planting_events(reference);

-- RLS Policies
ALTER TABLE nurseries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursery_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursery_inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE planting_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE planting_events ENABLE ROW LEVEL SECURITY;

-- Policies: Nurseries
CREATE POLICY "Authorized roles can view nurseries" ON nurseries FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'verifier')));

CREATE POLICY "Coordinators and admins can manage nurseries" ON nurseries FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator')));

-- Policies: Nursery Batches
CREATE POLICY "Authorized roles can view batches" ON nursery_batches FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'verifier')));

CREATE POLICY "Operators and coordinators can manage their batches" ON nursery_batches FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator')) OR
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'nursery_operator') AND responsible_operator = auth.uid())
);

-- Policies: Inventory Movements
CREATE POLICY "Authorized roles can view inventory" ON nursery_inventory_movements FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'verifier')));

-- Policies: Distributions
CREATE POLICY "Authorized roles can view distributions" ON distributions FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'verifier')) OR recipient_id = auth.uid());

CREATE POLICY "Coordinators and admins can manage distributions" ON distributions FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator')));

-- Policies: Planting Sites
CREATE POLICY "Authorized roles can view sites" ON planting_sites FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'verifier')) OR responsible_grower = auth.uid());

CREATE POLICY "Growers and coordinators can manage sites" ON planting_sites FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator')) OR
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'grower') AND responsible_grower = auth.uid())
);

-- Policies: Planting Events
CREATE POLICY "Authorized roles can view planting events" ON planting_events FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'verifier')) OR responsible_grower = auth.uid());

CREATE POLICY "Growers and coordinators can manage planting events" ON planting_events FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator')) OR
  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'grower') AND responsible_grower = auth.uid())
);

-- Triggers for updated_at
CREATE TRIGGER update_nurseries_updated_at BEFORE UPDATE ON nurseries FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_nursery_batches_updated_at BEFORE UPDATE ON nursery_batches FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_distributions_updated_at BEFORE UPDATE ON distributions FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_planting_sites_updated_at BEFORE UPDATE ON planting_sites FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_planting_events_updated_at BEFORE UPDATE ON planting_events FOR EACH ROW EXECUTE FUNCTION update_modified_column();
