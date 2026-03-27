import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SegmentsFiltersProps {
  search: string;
  tag: string;
  status: string;
  onSearchChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function SegmentsFilters({
  search,
  tag,
  status,
  onSearchChange,
  onTagChange,
  onStatusChange,
}: SegmentsFiltersProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          className="border-zinc-800 bg-zinc-900 pl-9 text-zinc-100"
          placeholder="Search segment name..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <Input
        className="border-zinc-800 bg-zinc-900 text-zinc-100"
        placeholder="Tag filter"
        value={tag}
        onChange={(event) => onTagChange(event.target.value)}
      />

      <select
        className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
      >
        <option value="">All statuses</option>
        <option value="subscribed">Subscribed</option>
        <option value="pending">Pending</option>
        <option value="unsubscribed">Unsubscribed</option>
        <option value="suppressed">Suppressed</option>
      </select>
    </div>
  );
}
