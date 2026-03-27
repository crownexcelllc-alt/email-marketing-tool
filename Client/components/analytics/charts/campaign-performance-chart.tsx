'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyticsTimelinePoint } from '@/lib/types/analytics';

interface CampaignPerformanceChartProps {
  data: AnalyticsTimelinePoint[];
}

export function CampaignPerformanceChart({ data }: CampaignPerformanceChartProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100">
      <CardHeader>
        <CardTitle className="text-base">Campaign Performance Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="label" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
              <YAxis stroke="#a1a1aa" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fafafa' }}
              />
              <Legend />
              <Line type="monotone" dataKey="sent" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="delivered" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="opens" stroke="#38bdf8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="clicks" stroke="#a78bfa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

