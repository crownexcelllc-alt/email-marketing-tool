'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  MousePointerClick,
  EyeOff,
  Users,
} from 'lucide-react';
import { getCampaignRecipientDetails } from '@/lib/api/campaigns';
import type { Campaign, CampaignRecipientDetail, CampaignRecipientDetailsResult } from '@/lib/types/campaign';
import { toast } from 'sonner';

interface CampaignHistoryDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
}

export function CampaignHistoryDetailsPanel({
  open,
  onOpenChange,
  campaign,
}: CampaignHistoryDetailsPanelProps) {
  const [data, setData] = useState<CampaignRecipientDetailsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const loadDetails = useCallback(async () => {
    if (!campaign?.id || !open) return;
    setIsLoading(true);
    try {
      const response = await getCampaignRecipientDetails(campaign.id, {
        page,
        limit: 10,
        filter,
        search: debouncedSearch.trim() || undefined,
      });
      setData(response);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load history details');
    } finally {
      setIsLoading(false);
    }
  }, [campaign?.id, open, page, filter, debouncedSearch]);

  useEffect(() => {
    if (open) {
      loadDetails();
    } else {
      setData(null);
      setFilter('all');
      setPage(1);
      setSearch('');
      setDebouncedSearch('');
    }
  }, [open, loadDetails]);

  // Reset page when filter changes
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return '-';
    }
  };

  const renderStatusBadge = (item: CampaignRecipientDetail) => {
    if (item.clickedAt) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 animate-fade-in">
          <MousePointerClick className="h-3.5 w-3.5" /> Clicks
        </span>
      );
    }
    if (item.openedAt) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 animate-fade-in">
          <Eye className="h-3.5 w-3.5" /> Opens
        </span>
      );
    }
    if (item.status === 'sent') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-500/10 px-2 py-1 text-xs font-medium text-zinc-400 animate-fade-in">
          <CheckCircle2 className="h-3.5 w-3.5" /> Sent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400 animate-fade-in">
        <Clock className="h-3.5 w-3.5" /> Remaining
      </span>
    );
  };

  const renderActivityTime = (item: CampaignRecipientDetail) => {
    if (item.clickedAt) {
      return (
        <div className="text-xs text-zinc-350">
          <div className="font-semibold text-emerald-400">Clicked at:</div>
          <div>{formatDateTime(item.clickedAt)}</div>
        </div>
      );
    }
    if (item.openedAt) {
      return (
        <div className="text-xs text-zinc-350">
          <div className="font-semibold text-blue-400">Opened at:</div>
          <div>{formatDateTime(item.openedAt)}</div>
        </div>
      );
    }
    if (item.sentAt) {
      return (
        <div className="text-xs text-zinc-350">
          <div className="font-semibold text-zinc-400">Sent at:</div>
          <div>{formatDateTime(item.sentAt)}</div>
        </div>
      );
    }
    return <span className="text-zinc-500 text-xs">-</span>;
  };

  const summary = data?.summary || {
    sent: 0,
    pending: 0,
    opened: 0,
    clicked: 0,
    notOpened: 0,
  };

  const items = data?.items || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-none md:max-w-3xl lg:max-w-4xl border-zinc-800 bg-zinc-950 text-zinc-100 p-6 overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-bold tracking-tight">
            History Details - <span className="text-blue-400">{campaign?.name}</span>
          </SheetTitle>
        </SheetHeader>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <button
            onClick={() => handleFilterChange('all')}
            className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${
              filter === 'all'
                ? 'border-blue-500 bg-blue-950/20 text-zinc-100 shadow-lg shadow-blue-950/10'
                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className={`h-5 w-5 mb-2 ${filter === 'all' ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className="text-xs font-medium uppercase tracking-wider">Recipients</span>
            <span className={`text-2xl font-extrabold mt-1 ${filter === 'all' ? 'text-blue-400' : 'text-zinc-100'}`}>
              {summary.sent + summary.pending}
            </span>
          </button>

          <button
            onClick={() => handleFilterChange('sent')}
            className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${
              filter === 'sent'
                ? 'border-blue-500 bg-blue-950/20 text-zinc-100 shadow-lg shadow-blue-950/10'
                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className={`h-5 w-5 mb-2 ${filter === 'sent' ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className="text-xs font-medium uppercase tracking-wider">Sent</span>
            <span className={`text-2xl font-extrabold mt-1 ${filter === 'sent' ? 'text-blue-400' : 'text-zinc-100'}`}>
              {summary.sent}
            </span>
          </button>

          <button
            onClick={() => handleFilterChange('pending')}
            className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${
              filter === 'pending'
                ? 'border-blue-500 bg-blue-950/20 text-zinc-100 shadow-lg shadow-blue-950/10'
                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className={`h-5 w-5 mb-2 ${filter === 'pending' ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className="text-xs font-medium uppercase tracking-wider">Remaining</span>
            <span className={`text-2xl font-extrabold mt-1 ${filter === 'pending' ? 'text-blue-400' : 'text-zinc-100'}`}>
              {summary.pending}
            </span>
          </button>

          <button
            onClick={() => handleFilterChange('opened')}
            className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${
              filter === 'opened'
                ? 'border-blue-500 bg-blue-950/20 text-zinc-100 shadow-lg shadow-blue-950/10'
                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className={`h-5 w-5 mb-2 ${filter === 'opened' ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className="text-xs font-medium uppercase tracking-wider">Opens</span>
            <span className={`text-2xl font-extrabold mt-1 ${filter === 'opened' ? 'text-blue-400' : 'text-zinc-100'}`}>
              {summary.opened}
            </span>
          </button>

          <button
            onClick={() => handleFilterChange('clicked')}
            className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${
              filter === 'clicked'
                ? 'border-blue-500 bg-blue-950/20 text-zinc-100 shadow-lg shadow-blue-950/10'
                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MousePointerClick className={`h-5 w-5 mb-2 ${filter === 'clicked' ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className="text-xs font-medium uppercase tracking-wider">Clicks</span>
            <span className={`text-2xl font-extrabold mt-1 ${filter === 'clicked' ? 'text-blue-400' : 'text-zinc-100'}`}>
              {summary.clicked}
            </span>
          </button>

          <button
            onClick={() => handleFilterChange('notOpened')}
            className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${
              filter === 'notOpened'
                ? 'border-blue-500 bg-blue-950/20 text-zinc-100 shadow-lg shadow-blue-950/10'
                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <EyeOff className={`h-5 w-5 mb-2 ${filter === 'notOpened' ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className="text-xs font-medium uppercase tracking-wider">Not Opened</span>
            <span className={`text-2xl font-extrabold mt-1 ${filter === 'notOpened' ? 'text-blue-400' : 'text-zinc-100'}`}>
              {summary.notOpened}
            </span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus-visible:ring-blue-500"
            />
          </div>
          <div className="text-xs text-zinc-400">
            Showing contacts for status: <span className="font-semibold text-zinc-200">{filter === 'all' ? 'Recipients' : filter === 'sent' ? 'Sent' : filter === 'pending' ? 'Remaining' : filter === 'opened' ? 'Opens' : filter === 'clicked' ? 'Clicks' : filter === 'notOpened' ? 'Not Opened' : filter}</span>
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden min-h-[300px] relative">
          {isLoading && (
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[2px] flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="text-sm text-zinc-400">Loading contacts...</span>
              </div>
            </div>
          )}

          <Table>
            <TableHeader className="bg-zinc-100 border-b border-zinc-800">
              <TableRow className="bg-zinc-100 hover:bg-zinc-100">
                <TableHead className="w-1/3 text-zinc-700 font-semibold">Name</TableHead>
                <TableHead className="w-1/3 text-zinc-700 font-semibold">Email</TableHead>
                <TableHead className="w-1/6 text-zinc-700 font-semibold">Status</TableHead>
                <TableHead className="w-1/6 text-zinc-700 font-semibold">Activity Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-zinc-500">
                    No contacts found in this list.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="border-b border-zinc-850 hover:bg-zinc-900/30 transition-colors">
                    <TableCell className="font-medium text-zinc-200">{item.name || '-'}</TableCell>
                    <TableCell className="text-zinc-450">{item.email}</TableCell>
                    <TableCell>{renderStatusBadge(item)}</TableCell>
                    <TableCell>{renderActivityTime(item)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Section */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-400">
          <div>
            Page {pagination.page} of {pagination.totalPages} | {pagination.total} total contacts
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevious || isLoading}
              className="border-zinc-850 bg-zinc-900 hover:bg-zinc-850 text-zinc-350 disabled:opacity-50"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNext || isLoading}
              className="border-zinc-850 bg-zinc-900 hover:bg-zinc-850 text-zinc-350 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
