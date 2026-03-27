'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { getCampaignAnalytics } from '@/lib/api/analytics';
import type { CampaignAnalytics } from '@/lib/types/analytics';
import { AnalyticsKpiCards } from '@/components/analytics/analytics-kpi-cards';
import { AnalyticsLoadingSkeleton } from '@/components/analytics/analytics-loading-skeleton';
import { CampaignPerformanceChart } from '@/components/analytics/charts/campaign-performance-chart';
import { DeliveryBreakdownChart } from '@/components/analytics/charts/delivery-breakdown-chart';
import { SenderPerformanceChart } from '@/components/analytics/charts/sender-performance-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { HttpClientError } from '@/lib/api/errors';

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load analytics data.';
}

export function AnalyticsDashboard() {
  const [campaignIdInput, setCampaignIdInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);

  const handleLoadAnalytics = async () => {
    const campaignId = campaignIdInput.trim();
    if (!campaignId) {
      toast.error('Enter a campaign ID to load analytics.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await getCampaignAnalytics(campaignId);
      setAnalytics(result);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-base">Campaign Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-400">
            Load campaign analytics using campaign ID.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                className="border-zinc-800 bg-zinc-900 pl-9 text-zinc-100"
                placeholder="Enter campaign ID"
                value={campaignIdInput}
                onChange={(event) => setCampaignIdInput(event.target.value)}
              />
            </div>
            <Button onClick={() => void handleLoadAnalytics()} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Load Analytics'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <AnalyticsLoadingSkeleton />
      ) : analytics ? (
        <section className="space-y-5">
          <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-100">
            <CardContent className="pt-6">
              <p className="text-sm text-zinc-500">Campaign</p>
              <h3 className="text-xl font-semibold text-zinc-100">{analytics.campaignName}</h3>
              <p className="mt-1 text-xs text-zinc-500">
                ID: {analytics.campaignId} | Channel: {analytics.channel}
              </p>
            </CardContent>
          </Card>

          <AnalyticsKpiCards stats={analytics.stats} />

          <CampaignPerformanceChart data={analytics.timeline} />

          <div className="grid gap-4 xl:grid-cols-2">
            <SenderPerformanceChart data={analytics.senderPerformance} />
            <DeliveryBreakdownChart data={analytics.delivery} />
          </div>
        </section>
      ) : (
        <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-100">
          <CardContent className="py-12 text-center">
            <p className="text-sm font-medium text-zinc-200">No analytics loaded yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              Enter a campaign ID above to view campaign stats and charts.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

