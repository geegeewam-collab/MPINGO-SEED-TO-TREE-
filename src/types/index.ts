export type UserRole = 'admin' | 'coordinator' | 'nursery_operator' | 'grower' | 'verifier' | 'sponsor' | 'pending';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MotherTree {
  id: string;
  reference: string;
  species: string;
  general_location: string;
  county?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  capture_method?: 'gps' | 'manual';
  capture_timestamp?: string;
  date_recorded: string;
  collector_name?: string;
  observation_notes?: string;
  verification_status: 'pending' | 'verified' | 'requires_review';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SeedLot {
  id: string;
  reference: string;
  public_token: string;
  species: string;
  collection_date: string;
  collection_location: string;
  provenance_notes?: string;
  initial_quantity: number;
  unit_of_measurement: string;
  quality_certification?: string;
  processing_notes?: string;
  status: 'collected' | 'processed' | 'sown' | 'distributed' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Nursery {
  id: string;
  reference: string;
  name: string;
  responsible_operator: string;
  general_location: string;
  county?: string;
  country?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  verification_status: 'unverified' | 'verified';
  created_at: string;
  updated_at: string;
}

export interface NurseryBatch {
  id: string;
  reference: string;
  nursery_id: string;
  seed_lot_id?: string;
  seeds_sown: number;
  seedlings_produced: number;
  current_stock: number;
  propagation_stage?: string;
  creation_date: string;
  last_inspection?: string;
  responsible_operator: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Distribution {
  id: string;
  reference: string;
  recipient_id: string;
  source_nursery_id: string;
  source_batch_id: string;
  quantity: number;
  unit: string;
  destination_site_id?: string;
  intended_purpose?: string;
  request_date: string;
  dispatch_date?: string;
  receipt_date?: string;
  status: 'draft' | 'approved' | 'dispatched' | 'received' | 'cancelled';
  created_by: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PlantingSite {
  id: string;
  reference: string;
  name: string;
  general_location: string;
  county?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  capture_method?: 'gps' | 'manual';
  capture_timestamp?: string;
  responsible_grower: string;
  habitat_notes?: string;
  status: 'active' | 'inactive' | 'archived';
  visibility_classification: 'private' | 'restricted' | 'public';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PlantingEvent {
  id: string;
  reference: string;
  site_id: string;
  distribution_id?: string;
  source_batch_id?: string;
  planting_date: string;
  species: string;
  quantity_planted: number;
  responsible_grower: string;
  recorder_id: string;
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  capture_method?: 'gps' | 'manual';
  capture_timestamp?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SurvivalCheck {
  id: string;
  reference: string;
  planting_event_id: string;
  inspection_date: string;
  observer_id: string;
  confirmed_alive: number;
  confirmed_dead: number;
  unresolved: number;
  uninspected: number;
  sample_size: number;
  inspection_method: string;
  latitude?: number;
  longitude?: number;
  location_accuracy?: number;
  capture_method?: 'gps' | 'manual';
  capture_timestamp?: string;
  photographs?: string[];
  notes?: string;
  submission_status: 'submitted' | 'verified' | 'rejected' | 'requires_correction';
  verifier_id?: string;
  verification_date?: string;
  verification_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  title: string;
  category?: string;
  content_type: 'article' | 'guide' | 'pdf' | 'video' | 'external';
  body?: string;
  file_url?: string;
  external_url?: string;
  source_reference?: string;
  approval_status: 'draft' | 'approved';
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Grove {
  id: string;
  slug: string;
  title: string;
  description?: string;
  sponsor_name?: string;
  planting_site_id?: string;
  primary_planting_event_id?: string;
  is_published: boolean;
  published_at?: string;
  approved_photos?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroveUpdate {
  id: string;
  grove_id: string;
  update_date: string;
  title: string;
  content: string;
  photo_url?: string;
  is_public: boolean;
  created_at: string;
}
