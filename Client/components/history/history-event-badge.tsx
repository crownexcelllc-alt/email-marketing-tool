import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HistoryEventBadgeProps {
  eventType: string;
  className?: string;
}

function normalizeEventType(value: string): string {
  return value.trim().toLowerCase();
}

function toBadgeVariant(eventType: string): 'neutral' | 'success' | 'warning' | 'danger' {
  const normalized = normalizeEventType(eventType);

  if (
    normalized === 'failed' ||
    normalized.includes('bounce') ||
    normalized.includes('error') ||
    normalized.includes('invalid')
  ) {
    return 'danger';
  }

  if (normalized === 'clicked' || normalized === 'click') {
    return 'warning';
  }

  if (
    normalized === 'opened' ||
    normalized === 'open' ||
    normalized === 'delivered' ||
    normalized === 'read' ||
    normalized === 'sent'
  ) {
    return 'success';
  }

  return 'neutral';
}

function toDisplayLabel(eventType: string): string {
  const normalized = normalizeEventType(eventType);

  if (normalized === 'open') {
    return 'opened';
  }

  if (normalized === 'click') {
    return 'clicked';
  }

  return normalized.replace(/_/g, ' ');
}

export function HistoryEventBadge({ eventType, className }: HistoryEventBadgeProps) {
  return (
    <Badge variant={toBadgeVariant(eventType)} className={cn('capitalize', className)}>
      {toDisplayLabel(eventType)}
    </Badge>
  );
}
