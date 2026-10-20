-- Migration for Public Entry and Network Administration
-- 0007_public_entry_and_admin.sql

-- 1. Member Applications Table
CREATE TABLE member_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL, -- e.g., APP-000001
  applicant_type TEXT NOT NULL CHECK (applicant_type IN ('grower', 'nursery', 'researcher', 'organisation', 'student', 'other')),
  full_name TEXT NOT NULL,
  organisation_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  county TEXT NOT NULL,
  location_details TEXT,
  experience_notes TEXT,
  participation_goal TEXT,
  consent_to_data_handling BOOLEAN DEFAULT false,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  review_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Seed Requests Table
CREATE TABLE seed_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL, -- e.g., REQ-000001
  requester_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_organisation BOOLEAN DEFAULT false,
  organisation_name TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN ('seeds', 'seedlings')),
  requested_quantity INTEGER NOT NULL CHECK (requested_quantity > 0),
  unit TEXT NOT NULL,
  intended_use TEXT,
  county TEXT NOT NULL,
  destination_details TEXT,
  desired_date DATE,
  nursery_details TEXT,
  notes TEXT,

  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'fulfilled', 'cancelled')),
  reviewed_by UUID REFERENCES profiles(id),
  review_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Resources Table
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT,
  content_type TEXT CHECK (content_type IN ('article', 'guide', 'pdf', 'video', 'external')),
  body TEXT,
  file_url TEXT,
  external_url TEXT,
  source_reference TEXT,

  approval_status TEXT DEFAULT 'draft' CHECK (approval_status IN ('draft', 'approved')),
  reviewed_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_member_apps_status ON member_applications(status);
CREATE INDEX idx_seed_reqs_status ON seed_requests(status);
CREATE INDEX idx_resources_status ON resources(approval_status);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- RLS Policies
ALTER TABLE member_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Member Applications Policies
CREATE POLICY "Public can submit membership applications" ON member_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Authorized roles can manage membership applications" ON member_applications FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator')));

-- Seed Requests Policies
CREATE POLICY "Public can submit seed requests" ON seed_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Authorized roles can manage seed requests" ON seed_requests FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator')));

-- Resources Policies
CREATE POLICY "Anyone can view approved resources" ON resources FOR SELECT
USING (approval_status = 'approved');

CREATE POLICY "Authorized roles can manage resources" ON resources FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator')));

-- Audit Logs Policies
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_member_apps_updated_at BEFORE UPDATE ON member_applications FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_seed_reqs_updated_at BEFORE UPDATE ON seed_requests FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_modified_column();
