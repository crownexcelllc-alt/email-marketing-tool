import { BarChart3, CheckCircle2, MousePointerClick, MailOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CampaignStatMetrics } from '@/lib/types/analytics';
import { formatNumber } from '@/lib/utils';

interface AnalyticsKpiCardsProps {
  stats: CampaignStatMetrics;
}

function KpiCard({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
        <div className="rounded-md border border-zinc-800 bg-zinc-950 p-2 text-zinc-300">{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-zinc-100">{value}</p>
        <p className="mt-1 text-xs text-zinc-500">{helper}</p>
      </CardContent>
    </Card>
  );
}

export function AnalyticsKpiCards({ stats }: AnalyticsKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Delivery Rate"
        value={`${stats.deliveryRate.toFixed(2)}%`}
        helper={`${formatNumber(stats.delivered)} delivered`}
        icon={<CheckCircle2 className="h-4 w-4" />}
      />
      <KpiCard
        title="Open Rate"
        value={`${stats.openRate.toFixed(2)}%`}
        helper={`${formatNumber(stats.opens)} opens`}
        icon={<MailOpen className="h-4 w-4" />}
      />
      <KpiCard
        title="Click Rate"
        value={`${stats.clickRate.toFixed(2)}%`}
        helper={`${formatNumber(stats.clicks)} clicks`}
        icon={<MousePointerClick className="h-4 w-4" />}
      />
      <KpiCard
        title="Total Sent"
        value={formatNumber(stats.sent)}
        helper={`${formatNumber(stats.failed)} failed`}
        icon={<BarChart3 className="h-4 w-4" />}
      />
    </div>
  );
}

