'use client';

import { RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { HistoryFilters } from '@/components/history/history-filters';
import { HistoryTimeline } from '@/components/history/history-timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HttpClientError } from '@/lib/api/errors';
import { getHistory } from '@/lib/api/history';
import type {
  HistoryEvent,
  HistoryEventTypeFilter,
  HistoryPagination,
} from '@/lib/types/history';

const DEFAULT_PAGINATION: HistoryPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Failed to load history events.';
}

export function HistoryDashboard() {
  const [items, setItems] = useState<HistoryEvent[]>([]);
  const [pagination, setPagination] = useState<HistoryPagination>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);

  const [campaignId, setCampaignId] = useState('');
  const [contactId, setContactId] = useState('');
  const [eventType, setEventType] = useState<HistoryEventTypeFilter>('all');

  const [debouncedCampaignId, setDebouncedCampaignId] = useState('');
  const [debouncedContactId, setDebouncedContactId] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCampaignId(campaignId.trim());
      setDebouncedContactId(contactId.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [campaignId, contactId]);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  }, [debouncedCampaignId, debouncedContactId, eventType]);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getHistory({
        page: pagination.page,
        limit: pagination.limit,
        campaignId: debouncedCampaignId || undefined,
        contactId: debouncedContactId || undefined,
        eventType,
      });

      setItems(response.items);
      setPagination(response.pagination);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [debouncedCampaignId, debouncedContactId, eventType, pagination.limit, pagination.page]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const clearFilters = () => {
    setCampaignId('');
    setContactId('');
    setEventType('all');
  };

  const hasActiveFilters =
    debouncedCampaignId.length > 0 || debouncedContactId.length > 0 || eventType !== 'all';

  const goToPreviousPage = () => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(1, prev.page - 1),
    }));
  };

  const goToNextPage = () => {
    setPagination((prev) => ({
      ...prev,
      page: Math.min(prev.totalPages || 1, prev.page + 1),
    }));
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">History</h2>
        <p className="text-sm text-zinc-400">
          Review sent, opened, clicked, and failed events in a unified activity timeline.
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-100">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Timeline Filters</CardTitle>
            <Button
              type="button"
              variant="outline"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          </div>

          <HistoryFilters
            campaignId={campaignId}
            contactId={contactId}
            eventType={eventType}
            onCampaignIdChange={setCampaignId}
            onContactIdChange={setContactId}
            onEventTypeChange={setEventType}
          />
        </CardHeader>

        <CardContent className="space-y-4">
          <HistoryTimeline events={items} isLoading={isLoading} />

          <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              Page {pagination.page} of {pagination.totalPages} | {pagination.total} total events
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                onClick={goToPreviousPage}
                disabled={!pagination.hasPrevious || isLoading}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                onClick={goToNextPage}
                disabled={!pagination.hasNext || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
