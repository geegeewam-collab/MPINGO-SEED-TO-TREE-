-- 0012_evidence_photos.sql
-- Photo evidence for plantings and survival checks (private bucket), and approved public photos for sponsor groves.
CREATE TABLE IF NOT EXISTS public.evidence_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('planting_event', 'survival_check')),
  entity_id UUID NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  caption TEXT,
  uploaded_by UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evidence_photos_entity ON evidence_photos (entity_type, entity_id);
ALTER TABLE evidence_photos ENABLE ROW LEVEL SECURITY;

-- The subqueries below run under the caller's own rules, so a photo is visible only if its record is.
CREATE POLICY "See photos of records you can see" ON evidence_photos FOR SELECT USING (
  (entity_type = 'planting_event' AND EXISTS (SELECT 1 FROM planting_events e WHERE e.id = entity_id))
  OR (entity_type = 'survival_check' AND EXISTS (SELECT 1 FROM survival_checks c WHERE c.id = entity_id)));
CREATE POLICY "Add photos to records you can see" ON evidence_photos FOR INSERT WITH CHECK (
  uploaded_by = auth.uid() AND public.current_app_role() NOT IN ('pending', 'sponsor')
  AND ((entity_type = 'planting_event' AND EXISTS (SELECT 1 FROM planting_events e WHERE e.id = entity_id))
    OR (entity_type = 'survival_check' AND EXISTS (SELECT 1 FROM survival_checks c WHERE c.id = entity_id AND c.submission_status <> 'verified'))));
CREATE POLICY "Remove your photos until the check is verified" ON evidence_photos FOR DELETE USING (
  (uploaded_by = auth.uid() OR public.current_app_role() = 'admin')
  AND NOT (entity_type = 'survival_check' AND EXISTS (SELECT 1 FROM survival_checks c WHERE c.id = entity_id AND c.submission_status = 'verified')));

DROP TRIGGER IF EXISTS audit_change ON evidence_photos;
CREATE TRIGGER audit_change AFTER INSERT OR DELETE ON evidence_photos FOR EACH ROW EXECUTE FUNCTION public.audit_change();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('evidence', 'evidence', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('grove-photos', 'grove-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Upload evidence with a working role" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence' AND public.current_app_role() NOT IN ('pending', 'sponsor'));
CREATE POLICY "Read evidence when its record is visible" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidence' AND EXISTS (SELECT 1 FROM public.evidence_photos p WHERE p.storage_path = name));
CREATE POLICY "Remove evidence files you uploaded" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'evidence' AND (owner_id = auth.uid()::text OR public.current_app_role() = 'admin'));
CREATE POLICY "Staff upload grove photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'grove-photos' AND public.current_app_role() IN ('admin', 'coordinator'));
CREATE POLICY "Staff remove grove photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'grove-photos' AND public.current_app_role() IN ('admin', 'coordinator'));
