-- Migration for Mother Tree Registry
-- 0002_mother_trees_registry.sql

-- 1. Create Mother Trees Table
CREATE TABLE mother_trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL, -- e.g., MT-000001
  species TEXT NOT NULL DEFAULT 'Dalbergia melanoxylon',
  general_location TEXT NOT NULL,
  county TEXT,
  country TEXT DEFAULT 'Tanzania',

  -- Precise location data (restricted access)
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_accuracy DOUBLE PRECISION, -- in meters
  capture_method TEXT CHECK (capture_method IN ('gps', 'manual')),
  capture_timestamp TIMESTAMPTZ,

  date_recorded DATE DEFAULT CURRENT_DATE,
  collector_name TEXT,
  observation_notes TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'requires_review')),

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- 2. Indexes for performance
CREATE INDEX idx_mother_trees_reference ON mother_trees(reference);
CREATE INDEX idx_mother_trees_species ON mother_trees(species);
CREATE INDEX idx_mother_trees_verification ON mother_trees(verification_status);

-- 3. Row Level Security (RLS)
ALTER TABLE mother_trees ENABLE ROW LEVEL SECURITY;

-- Policy: Authorized roles can read general tree information
-- (Coordiantors, Admins, Verifiers)
CREATE POLICY "Authorized roles can view mother trees"
  ON mother_trees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'verifier')
    )
  );

-- Policy: Only coordinators and admins can create/edit mother trees
CREATE POLICY "Coordinators and admins can manage mother trees"
  ON mother_trees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator')
    )
  );

-- 4. Update timestamp trigger
CREATE TRIGGER update_mother_trees_updated_at
  BEFORE UPDATE ON mother_trees
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 5. View for restricted coordinates
-- We create a view that only provides precise coordinates to authorized users.
-- This prevents accidental exposure of coordinates in broad SELECT * queries.
CREATE VIEW mother_tree_locations AS
SELECT
  id,
  reference,
  latitude,
  longitude,
  location_accuracy,
  capture_method
FROM mother_trees
WHERE EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role IN ('admin', 'coordinator')
);
