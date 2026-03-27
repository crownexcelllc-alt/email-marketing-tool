import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { HistoryEventTypeFilter } from '@/lib/types/history';

interface HistoryFiltersProps {
  campaignId: string;
  contactId: string;
  eventType: HistoryEventTypeFilter;
  onCampaignIdChange: (value: string) => void;
  onContactIdChange: (value: string) => void;
  onEventTypeChange: (value: HistoryEventTypeFilter) => void;
}

export function HistoryFilters({
  campaignId,
  contactId,
  eventType,
  onCampaignIdChange,
  onContactIdChange,
  onEventTypeChange,
}: HistoryFiltersProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.75fr]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          className="border-zinc-800 bg-zinc-900 pl-9 text-zinc-100"
          placeholder="Filter by campaign ID"
          value={campaignId}
          onChange={(event) => onCampaignIdChange(event.target.value)}
        />
      </div>

      <Input
        className="border-zinc-800 bg-zinc-900 text-zinc-100"
        placeholder="Filter by contact ID"
        value={contactId}
        onChange={(event) => onContactIdChange(event.target.value)}
      />

      <select
        className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
        value={eventType}
        onChange={(event) => onEventTypeChange(event.target.value as HistoryEventTypeFilter)}
      >
        <option value="all">All types</option>
        <option value="sent">Sent</option>
        <option value="opened">Opened</option>
        <option value="clicked">Clicked</option>
        <option value="failed">Failed</option>
      </select>
    </div>
  );
}
