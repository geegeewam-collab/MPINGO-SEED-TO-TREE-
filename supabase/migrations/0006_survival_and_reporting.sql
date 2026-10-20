-- Migration for Survival Verification and Sponsor Reporting
-- 0006_survival_and_reporting.sql

-- 1. Survival Checks Table
CREATE TABLE survival_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL, -- e.g., SURV-000001
  planting_event_id UUID REFERENCES planting_events(id) ON DELETE CASCADE,
  inspection_date DATE DEFAULT CURRENT_DATE,
  observer_id UUID REFERENCES profiles(id),

  -- Observation Counts
  confirmed_alive INTEGER NOT NULL CHECK (confirmed_alive >= 0),
  confirmed_dead INTEGER NOT NULL CHECK (confirmed_dead >= 0),
  unresolved INTEGER NOT NULL CHECK (unresolved >= 0),
  uninspected INTEGER NOT NULL CHECK (uninspected >= 0),

  -- Inspection Metadata
  sample_size INTEGER NOT NULL CHECK (sample_size >= 0),
  inspection_method TEXT, -- e.g., 'full_census', 'random_sample'

  -- Location of the check (if different from site)
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_accuracy DOUBLE PRECISION,
  capture_method TEXT CHECK (capture_method IN ('gps', 'manual')),
  capture_timestamp TIMESTAMPTZ,

  photographs TEXT[], -- Array of storage URLs
  notes TEXT,

  -- Verification Workflow
  submission_status TEXT DEFAULT 'submitted' CHECK (submission_status IN ('submitted', 'verified', 'rejected', 'requires_correction')),
  verifier_id UUID REFERENCES profiles(id),
  verification_date TIMESTAMPTZ,
  verification_notes TEXT,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Sponsor Groves Table
CREATE TABLE groves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL, -- For public URL: /groves/my-mpingo-grove-1
  title TEXT NOT NULL,
  description TEXT,
  sponsor_name TEXT,

  -- Link to the internal operational data
  planting_site_id UUID REFERENCES planting_sites(id),
  primary_planting_event_id UUID REFERENCES planting_events(id),

  -- Publication Controls
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  approved_photos TEXT[], -- Hand-picked photos for the public page

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Grove Updates Table (for the public timeline)
CREATE TABLE grove_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grove_id UUID REFERENCES groves(id) ON DELETE CASCADE,
  update_date DATE DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  photo_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_survival_event ON survival_checks(planting_event_id);
CREATE INDEX idx_survival_status ON survival_checks(submission_status);
CREATE INDEX idx_groves_slug ON groves(slug);

-- RLS Policies
ALTER TABLE survival_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE groves ENABLE ROW LEVEL SECURITY;
ALTER TABLE grove_updates ENABLE ROW LEVEL SECURITY;

-- Survival Checks Policies
CREATE POLICY "Authorized roles can view survival checks" ON survival_checks FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'verifier')));

CREATE POLICY "Verifiers and coordinators can submit checks" ON survival_checks FOR INSERT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'verifier')));

CREATE POLICY "Only verifiers and admins can verify checks" ON survival_checks FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'verifier')));

-- Groves Policies
CREATE POLICY "Anyone can view published groves" ON groves FOR SELECT
USING (is_published = true);

CREATE POLICY "Authorized roles can manage groves" ON groves FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator')));

-- Grove Updates Policies
CREATE POLICY "Anyone can view public grove updates" ON grove_updates FOR SELECT
USING (is_public = true);

CREATE POLICY "Authorized roles can manage grove updates" ON grove_updates FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator')));

-- Triggers for updated_at
CREATE TRIGGER update_survival_checks_updated_at BEFORE UPDATE ON survival_checks FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_groves_updated_at BEFORE UPDATE ON groves FOR EACH ROW EXECUTE FUNCTION update_modified_column();
