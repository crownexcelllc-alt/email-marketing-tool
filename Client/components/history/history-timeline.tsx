import { Badge } from '@/components/ui/badge';
import { HistoryEventBadge } from '@/components/history/history-event-badge';
import { HistoryTimelineSkeleton } from '@/components/history/history-timeline-skeleton';
import type { HistoryEvent } from '@/lib/types/history';

interface HistoryTimelineProps {
  events: HistoryEvent[];
  isLoading?: boolean;
}

interface TimelineGroup {
  key: string;
  label: string;
  items: HistoryEvent[];
}

function parseDate(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function toDateKey(value: string): string {
  const date = parseDate(value);
  if (!date) {
    return 'unknown';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string): string {
  const date = parseDate(value);
  if (!date) {
    return 'Unknown Date';
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value: string): string {
  const date = parseDate(value);
  if (!date) {
    return '--:--';
  }

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeEventType(value: string): string {
  return value.trim().toLowerCase();
}

function toEventTitle(value: string): string {
  const normalized = normalizeEventType(value);

  if (normalized === 'sent') {
    return 'Message sent';
  }

  if (normalized === 'open' || normalized === 'opened') {
    return 'Message opened';
  }

  if (normalized === 'click' || normalized === 'clicked') {
    return 'Link clicked';
  }

  if (normalized === 'failed') {
    return 'Delivery failed';
  }

  if (normalized === 'delivered') {
    return 'Message delivered';
  }

  if (normalized === 'read') {
    return 'Message read';
  }

  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function toSourceLabel(source: string): string {
  switch (source) {
    case 'send_event':
      return 'Send Event';
    case 'tracking_event':
      return 'Tracking';
    case 'whatsapp_webhook':
      return 'WhatsApp Webhook';
    case 'contact_activity':
      return 'Contact Activity';
    default:
      return source.replace(/_/g, ' ');
  }
}

function shortenId(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (value.length <= 10) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function toContextLine(event: HistoryEvent): string {
  const parts: string[] = [];

  const campaign = shortenId(event.campaignId);
  if (campaign) {
    parts.push(`Campaign ${campaign}`);
  }

  const contact = shortenId(event.contactId);
  if (contact) {
    parts.push(`Contact ${contact}`);
  }

  if (event.address) {
    parts.push(event.address);
  }

  if (parts.length === 0) {
    parts.push(`Source: ${toSourceLabel(event.source)}`);
  }

  return parts.join(' | ');
}

function groupHistoryEvents(events: HistoryEvent[]): TimelineGroup[] {
  const sorted = [...events].sort((left, right) => {
    const leftTime = parseDate(left.timestamp)?.getTime() ?? 0;
    const rightTime = parseDate(right.timestamp)?.getTime() ?? 0;
    return rightTime - leftTime;
  });

  const groups: TimelineGroup[] = [];
  const indexByKey = new Map<string, number>();

  for (const event of sorted) {
    const key = toDateKey(event.timestamp);
    const existingIndex = indexByKey.get(key);

    if (existingIndex === undefined) {
      indexByKey.set(key, groups.length);
      groups.push({
        key,
        label: formatDateLabel(event.timestamp),
        items: [event],
      });
      continue;
    }

    groups[existingIndex].items.push(event);
  }

  return groups;
}

export function HistoryTimeline({ events, isLoading = false }: HistoryTimelineProps) {
  if (isLoading) {
    return <HistoryTimelineSkeleton />;
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 py-14 text-center">
        <p className="text-sm font-medium text-zinc-200">No history events found</p>
        <p className="mt-1 text-xs text-zinc-500">
          Adjust filters or wait for campaign activity to appear.
        </p>
      </div>
    );
  }

  const groups = groupHistoryEvents(events);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          <div className="sticky top-0 z-10 bg-zinc-900/90 py-1 backdrop-blur">
            <h3 className="text-sm font-medium text-zinc-300">{group.label}</h3>
          </div>

          <div className="space-y-3">
            {group.items.map((event, index) => (
              <div key={event.id} className="relative pl-6">
                {index < group.items.length - 1 ? (
                  <span className="absolute left-[5px] top-4 h-[calc(100%+0.75rem)] w-px bg-zinc-800" />
                ) : null}
                <span className="absolute left-0 top-3 h-2.5 w-2.5 rounded-full bg-zinc-500" />

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <HistoryEventBadge eventType={event.eventType} />
                    {event.channel ? (
                      <Badge variant="outline" className="border-zinc-700 text-zinc-300 capitalize">
                        {event.channel}
                      </Badge>
                    ) : null}
                    <Badge variant="neutral">{toSourceLabel(event.source)}</Badge>
                    <span className="text-xs text-zinc-500">{formatTime(event.timestamp)}</span>
                  </div>

                  <p className="mt-2 text-sm font-medium text-zinc-100">
                    {toEventTitle(event.eventType)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{toContextLine(event)}</p>

                  {event.failureMessage ? (
                    <p className="mt-2 text-xs text-rose-300">
                      Reason: {event.failureMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
