import { cn } from '@/lib/utils';

const GOOD = ['verified', 'approved', 'active', 'received', 'published', 'accepted', 'completed'];
const WARN = ['submitted', 'pending', 'draft', 'requires_correction', 'in_review', 'dispatched'];
const BAD = ['rejected', 'suspended', 'cancelled', 'failed'];

export function StatusBadge({ value }: { value: string }) {
  const tone = GOOD.includes(value) ? 'bg-success/10 text-success'
    : WARN.includes(value) ? 'bg-warning/15 text-warning'
    : BAD.includes(value) ? 'bg-error/10 text-error'
    : 'bg-muted text-muted-foreground';
  return <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', tone)}>{value.replace(/_/g, ' ')}</span>;
}
