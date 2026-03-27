import { Mail, MessageCircleMore, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardActivityItem, DashboardActivityChannel } from '@/lib/types/dashboard';

interface RecentActivityCardProps {
  items: DashboardActivityItem[];
}

function getChannelBadgeStyles(channel: DashboardActivityChannel): string {
  switch (channel) {
    case 'email':
      return 'border-cyan-700/40 bg-cyan-500/10 text-cyan-300';
    case 'whatsapp':
      return 'border-emerald-700/40 bg-emerald-500/10 text-emerald-300';
    default:
      return 'border-violet-700/40 bg-violet-500/10 text-violet-300';
  }
}

function getChannelIcon(channel: DashboardActivityChannel) {
  switch (channel) {
    case 'email':
      return Mail;
    case 'whatsapp':
      return MessageCircleMore;
    default:
      return Sparkles;
  }
}

export function RecentActivityCard({ items }: RecentActivityCardProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-zinc-100">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const Icon = getChannelIcon(item.channel);

          return (
            <article
              key={item.id}
              className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium text-zinc-100">{item.title}</h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${getChannelBadgeStyles(
                    item.channel,
                  )}`}
                >
                  <Icon className="h-3 w-3" />
                  {item.channel}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
              <p className="mt-2 text-[11px] text-zinc-500">{item.timestamp}</p>
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}

