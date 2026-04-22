import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ContactsFiltersProps {
  search: string;
  status: string;
  category: string;
  categoryOptions: string[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export function ContactsFilters({
  search,
  status,
  category,
  categoryOptions,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
}: ContactsFiltersProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1.2fr_0.6fr_0.8fr]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          className="border-zinc-800 bg-zinc-900 pl-9 text-zinc-100"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <select
        className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
      >
        <option value="">All Statuses</option>
        <option value="subscribed">Subscribed</option>
        <option value="unsubscribed">Unsubscribed</option>
        <option value="pending">Pending</option>
        <option value="suppressed">Suppressed</option>
      </select>

      <select
        className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
      >
        <option value="">All Categories</option>
        {categoryOptions.map((categoryOption) => (
          <option key={categoryOption} value={categoryOption}>
            {categoryOption}
          </option>
        ))}
      </select>
    </div>
  );
}
