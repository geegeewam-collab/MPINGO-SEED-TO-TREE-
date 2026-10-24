import { Registry } from '@/components/modules/Registry';

export default function Page() {
  return <Registry title="Audit Log" description="A read-only history of changes. Personal details and coordinates are not stored here." table="audit_logs"
    columns={[{ key: 'action', label: 'Action' }, { key: 'entity_type', label: 'Record type' }, { key: 'created_at', label: 'When', date: true }]} />;
}

export const instant = false;
