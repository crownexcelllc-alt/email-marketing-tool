'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SenderPerformanceMetric } from '@/lib/types/analytics';

interface SenderPerformanceChartProps {
  data: SenderPerformanceMetric[];
}

export function SenderPerformanceChart({ data }: SenderPerformanceChartProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100">
      <CardHeader>
        <CardTitle className="text-base">Sender Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="senderName" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
              <YAxis stroke="#a1a1aa" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fafafa' }}
              />
              <Bar dataKey="deliveryRate" fill="#22c55e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="openRate" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="clickRate" fill="#a78bfa" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

