import type { ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';

interface SenderAccountStatusBadgeProps {
  value?: string;
}

function toVariant(value?: string): ComponentProps<typeof Badge>['variant'] {
  const normalized = value?.toLowerCase() ?? '';

  if (['active', 'connected', 'healthy', 'online', 'good'].includes(normalized)) {
    return 'success';
  }

  if (['testing', 'pending', 'degraded', 'warning', 'paused'].includes(normalized)) {
    return 'warning';
  }

  if (['inactive', 'disabled', 'failed', 'error', 'blocked'].includes(normalized)) {
    return 'danger';
  }

  return 'neutral';
}

export function SenderAccountStatusBadge({ value }: SenderAccountStatusBadgeProps) {
  return <Badge variant={toVariant(value)}>{value ?? 'unknown'}</Badge>;
}
