import type { ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';

interface SubscriptionStatusBadgeProps {
  value?: string;
}

function getVariant(value?: string): ComponentProps<typeof Badge>['variant'] {
  const normalized = value?.toLowerCase() ?? '';

  if (normalized === 'subscribed' || normalized === 'active') {
    return 'success';
  }

  if (normalized === 'pending') {
    return 'warning';
  }

  if (normalized === 'unsubscribed' || normalized === 'inactive' || normalized === 'blocked') {
    return 'danger';
  }

  return 'neutral';
}

export function SubscriptionStatusBadge({ value }: SubscriptionStatusBadgeProps) {
  return <Badge variant={getVariant(value)}>{value ?? 'unknown'}</Badge>;
}
