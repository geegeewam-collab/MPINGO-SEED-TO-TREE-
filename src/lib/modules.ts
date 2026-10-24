export interface Opt { value: string; label: string }
export type FieldType = 'text' | 'textarea' | 'url' | 'int' | 'number' | 'date' | 'select' | 'relation';
export interface FieldDef {
  name: string; label: string; type: FieldType; required?: boolean; options?: Opt[]; relation?: string;
  hint?: string; defaultValue?: string; min?: number;
}
export interface Transition { from: string[]; to: string; label: string; roles: string[]; needsNotes?: boolean; danger?: boolean }
export interface ModuleDef {
  slug: string; title: string; singular: string; table: string; basePath: string;
  createRoles: string[]; fields: FieldDef[]; coords?: boolean; sources?: boolean;
  statusColumn?: string; notesColumn?: string; reviewerColumn?: string; transitions?: Transition[];
  editRoles?: string[]; lockedOnEdit?: string[]; editWhen?: string[];
}

export const RELATIONS: Record<string, { table: string; select: string; label: string[]; person?: string }> = {
  growers: { table: '', select: '', label: [], person: 'grower' },
  operators: { table: '', select: '', label: [], person: 'nursery_operator' },
  'mother-trees': { table: 'mother_trees', select: 'id, reference, county', label: ['reference', 'county'] },
  'seed-lots': { table: 'seed_lots', select: 'id, reference, species', label: ['reference', 'species'] },
  nurseries: { table: 'nurseries', select: 'id, reference, name', label: ['reference', 'name'] },
  batches: { table: 'nursery_batches', select: 'id, reference, current_stock', label: ['reference', 'current_stock'] },
  distributions: { table: 'distributions', select: 'id, reference, quantity, status', label: ['reference', 'quantity', 'status'] },
  sites: { table: 'planting_sites', select: 'id, reference, name', label: ['reference', 'name'] },
  events: { table: 'planting_events', select: 'id, reference, species, quantity_planted', label: ['reference', 'species', 'quantity_planted'] },
};

const STAFF = ['admin', 'coordinator'];
const METHODS: Opt[] = [{ value: 'full_census', label: 'Full census' }, { value: 'random_sample', label: 'Sample (some trees not checked)' }, { value: 'other', label: 'Other' }];
const SPECIES = 'Dalbergia melanoxylon';

export const MODULES: ModuleDef[] = [
  { slug: 'mother-trees', title: 'Mother Trees', singular: 'mother tree', table: 'mother_trees', basePath: '/provenance/mother-trees', createRoles: STAFF, coords: true,
    statusColumn: 'verification_status',
    transitions: [
      { from: ['pending', 'requires_review'], to: 'verified', label: 'Mark verified', roles: STAFF },
      { from: ['pending', 'verified'], to: 'requires_review', label: 'Needs review', roles: STAFF },
    ],
    fields: [
      { name: 'species', label: 'Species', type: 'text', required: true, defaultValue: SPECIES },
      { name: 'general_location', label: 'General location', type: 'text', required: true, hint: 'A place name the public could see. Exact coordinates stay private.' },
      { name: 'county', label: 'County', type: 'text' },
      { name: 'date_recorded', label: 'Date recorded', type: 'date' },
      { name: 'collector_name', label: 'Recorded by', type: 'text' },
      { name: 'observation_notes', label: 'Observations', type: 'textarea' },
    ] },
  { slug: 'seed-lots', title: 'Seed Lots', singular: 'seed lot', table: 'seed_lots', basePath: '/provenance/seed-lots', createRoles: STAFF, sources: true,
    fields: [
      { name: 'species', label: 'Species', type: 'text', required: true, defaultValue: SPECIES },
      { name: 'collection_date', label: 'Collection date', type: 'date', required: true },
      { name: 'collection_location', label: 'Collection place', type: 'text', required: true, hint: 'Internal only. The public trace page does not show this.' },
      { name: 'initial_quantity', label: 'Quantity', type: 'int', required: true, min: 1 },
      { name: 'unit_of_measurement', label: 'Unit', type: 'select', required: true, options: [{ value: 'kg', label: 'kg of seed' }, { value: 'seeds', label: 'number of seeds' }] },
      { name: 'quality_certification', label: 'Quality checks', type: 'text' },
      { name: 'provenance_notes', label: 'Provenance notes', type: 'textarea' },
      { name: 'processing_notes', label: 'Processing notes', type: 'textarea' },
    ] },
  { slug: 'nurseries', title: 'Nurseries', singular: 'nursery', table: 'nurseries', basePath: '/production/nurseries', createRoles: STAFF, statusColumn: 'approval_status',
    transitions: [
      { from: ['pending', 'rejected'], to: 'approved', label: 'Approve nursery', roles: STAFF },
      { from: ['pending', 'approved'], to: 'rejected', label: 'Reject', roles: STAFF, danger: true },
    ],
    fields: [
      { name: 'name', label: 'Nursery name', type: 'text', required: true },
      { name: 'general_location', label: 'General location', type: 'text', required: true },
      { name: 'county', label: 'County', type: 'text' },
      { name: 'responsible_operator', label: 'Nursery operator', type: 'relation', relation: 'operators', hint: 'The person who runs this nursery. They can then record batches and stock for it.' },
    ] },
  { slug: 'batches', title: 'Nursery Batches', singular: 'nursery batch', table: 'nursery_batches', basePath: '/production/batches', createRoles: [...STAFF, 'nursery_operator'], lockedOnEdit: ['nursery_id', 'seed_lot_id'],
    fields: [
      { name: 'nursery_id', label: 'Nursery', type: 'relation', relation: 'nurseries', required: true },
      { name: 'seed_lot_id', label: 'Seed lot', type: 'relation', relation: 'seed-lots', required: true },
      { name: 'seeds_sown', label: 'Seeds sown', type: 'int', required: true, min: 1 },
      { name: 'creation_date', label: 'Sown on', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ] },
  { slug: 'distributions', title: 'Distributions', singular: 'distribution', table: 'distributions', basePath: '/production/distributions', createRoles: STAFF, statusColumn: 'status', editWhen: ['draft'], lockedOnEdit: ['source_batch_id'],
    transitions: [
      { from: ['draft'], to: 'approved', label: 'Approve', roles: STAFF },
      { from: ['approved'], to: 'dispatched', label: 'Dispatch and deduct stock', roles: ['admin', 'coordinator', 'nursery_operator'] },
      { from: ['dispatched'], to: 'received', label: 'Mark received', roles: STAFF },
      { from: ['draft', 'approved'], to: 'cancelled', label: 'Cancel', roles: STAFF, danger: true },
    ],
    fields: [
      { name: 'source_batch_id', label: 'Nursery batch', type: 'relation', relation: 'batches', required: true, hint: 'Shows each batch with its current stock.' },
      { name: 'quantity', label: 'Seedlings', type: 'int', required: true, min: 1 },
      { name: 'recipient_id', label: 'Recipient grower', type: 'relation', relation: 'growers', hint: 'Growers see distributions addressed to them.' },
      { name: 'destination_site_id', label: 'Planting site', type: 'relation', relation: 'sites' },
      { name: 'intended_purpose', label: 'Purpose', type: 'text' },
      { name: 'request_date', label: 'Request date', type: 'date' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ] },
  { slug: 'sites', title: 'Planting Sites', singular: 'planting site', table: 'planting_sites', basePath: '/restoration/sites', createRoles: [...STAFF, 'grower'], coords: true,
    fields: [
      { name: 'name', label: 'Site name', type: 'text', required: true },
      { name: 'general_location', label: 'General location', type: 'text', required: true },
      { name: 'county', label: 'County', type: 'text' },
      { name: 'visibility_classification', label: 'Who may see this site', type: 'select', required: true, defaultValue: 'private',
        options: [{ value: 'private', label: 'Private (staff only)' }, { value: 'restricted', label: 'County shown publicly' }, { value: 'public', label: 'Public' }] },
      { name: 'habitat_notes', label: 'Habitat notes', type: 'textarea' },
    ] },
  { slug: 'events', title: 'Planting Events', singular: 'planting event', table: 'planting_events', basePath: '/restoration/events', createRoles: [...STAFF, 'grower'], coords: true, lockedOnEdit: ['site_id', 'distribution_id'],
    fields: [
      { name: 'site_id', label: 'Planting site', type: 'relation', relation: 'sites', required: true },
      { name: 'distribution_id', label: 'Distribution (optional)', type: 'relation', relation: 'distributions', hint: 'If chosen, the trees planted cannot exceed what was dispatched.' },
      { name: 'planting_date', label: 'Planting date', type: 'date', required: true },
      { name: 'species', label: 'Species', type: 'text', required: true, defaultValue: SPECIES },
      { name: 'quantity_planted', label: 'Trees planted', type: 'int', required: true, min: 1 },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ] },
  { slug: 'survival', title: 'Survival Checks', singular: 'survival check', table: 'survival_checks', basePath: '/restoration/survival', createRoles: [...STAFF, 'verifier'], editRoles: [...STAFF, 'verifier'], lockedOnEdit: ['planting_event_id'], editWhen: ['submitted', 'requires_correction'],
    statusColumn: 'submission_status', notesColumn: 'verification_notes',
    transitions: [
      { from: ['submitted'], to: 'verified', label: 'Verify', roles: ['admin', 'verifier'] },
      { from: ['submitted'], to: 'requires_correction', label: 'Ask for correction', roles: ['admin', 'verifier'], needsNotes: true },
      { from: ['submitted'], to: 'rejected', label: 'Reject', roles: ['admin', 'verifier'], needsNotes: true, danger: true },
    ],
    fields: [
      { name: 'planting_event_id', label: 'Planting event', type: 'relation', relation: 'events', required: true },
      { name: 'inspection_date', label: 'Inspection date', type: 'date', required: true },
      { name: 'confirmed_alive', label: 'Confirmed alive', type: 'int', required: true, min: 0 },
      { name: 'confirmed_dead', label: 'Confirmed dead', type: 'int', required: true, min: 0 },
      { name: 'unresolved', label: 'Could not be confirmed', type: 'int', required: true, min: 0, hint: 'Not counted as alive or dead.' },
      { name: 'uninspected', label: 'Not inspected', type: 'int', required: true, min: 0, hint: 'If you checked only a sample, count every tree you did not check here. The four counts must add up to the number planted.' },
      { name: 'inspection_method', label: 'Method', type: 'select', required: true, options: METHODS },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ] },
  { slug: 'requests', title: 'Seed Requests', singular: 'seed request', table: 'seed_requests', basePath: '/network/requests', createRoles: [],
    statusColumn: 'status', notesColumn: 'review_notes', reviewerColumn: 'reviewed_by',
    transitions: [
      { from: ['submitted'], to: 'under_review', label: 'Start review', roles: STAFF },
      { from: ['under_review'], to: 'approved', label: 'Approve', roles: STAFF },
      { from: ['under_review'], to: 'rejected', label: 'Reject', roles: STAFF, needsNotes: true, danger: true },
      { from: ['approved'], to: 'fulfilled', label: 'Mark fulfilled', roles: STAFF },
      { from: ['submitted', 'under_review', 'approved'], to: 'cancelled', label: 'Cancel', roles: STAFF, needsNotes: true, danger: true },
    ], fields: [] },
  { slug: 'members', title: 'Network Members', singular: 'application', table: 'member_applications', basePath: '/management/members', createRoles: [],
    statusColumn: 'status', notesColumn: 'review_notes', reviewerColumn: 'reviewed_by',
    transitions: [
      { from: ['pending'], to: 'approved', label: 'Approve', roles: STAFF },
      { from: ['pending'], to: 'rejected', label: 'Reject', roles: STAFF, needsNotes: true, danger: true },
    ], fields: [] },
  { slug: 'groves', title: 'Sponsor Groves', singular: 'grove', table: 'groves', basePath: '/impact/groves', createRoles: STAFF, statusColumn: 'is_published',
    transitions: [
      { from: ['draft'], to: 'published', label: 'Publish grove', roles: STAFF },
      { from: ['published'], to: 'draft', label: 'Unpublish', roles: STAFF, danger: true },
    ],
    fields: [
      { name: 'slug', label: 'Public address', type: 'text', required: true, hint: 'Lowercase letters, numbers and hyphens, for example my-mpingo-grove-1' },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'sponsor_name', label: 'Sponsor', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'planting_site_id', label: 'Planting site', type: 'relation', relation: 'sites' },
      { name: 'primary_planting_event_id', label: 'Planting event shown', type: 'relation', relation: 'events', hint: 'Only verified results from this planting are shown publicly.' },
    ] },
];

MODULES.push({ slug: 'resources', title: 'Resources', singular: 'resource', table: 'resources', basePath: '/management/resources', createRoles: STAFF,
  statusColumn: 'approval_status', reviewerColumn: 'reviewed_by',
  transitions: [
    { from: ['draft'], to: 'approved', label: 'Publish to the library', roles: STAFF },
    { from: ['approved'], to: 'draft', label: 'Take down', roles: STAFF, danger: true },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'category', label: 'Category', type: 'text', hint: 'For example seed collection, nursery, planting, monitoring.' },
    { name: 'content_type', label: 'Type', type: 'select', required: true, options: [{ value: 'article', label: 'Article' }, { value: 'guide', label: 'Guide' }, { value: 'pdf', label: 'PDF' }, { value: 'video', label: 'Video' }, { value: 'external', label: 'External link' }] },
    { name: 'language', label: 'Language', type: 'select', required: true, defaultValue: 'en', options: [{ value: 'en', label: 'English' }, { value: 'sw', label: 'Kiswahili' }] },
    { name: 'body', label: 'Text', type: 'textarea', hint: 'For articles and guides.' },
    { name: 'external_url', label: 'Link', type: 'url', hint: 'A web address starting with https://' },
    { name: 'source_reference', label: 'Who reviewed or produced this', type: 'text', hint: 'Only publish guidance that MRI or a named expert has reviewed.' },
  ] });

export const getModule = (slug: string) => MODULES.find((m) => m.slug === slug);
export const COORD_BOX = { latMin: -12, latMax: 6, lngMin: 28, lngMax: 43 };
