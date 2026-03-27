import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, helper, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn('border-zinc-800 bg-zinc-900/70 text-zinc-100', className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">{label}</CardTitle>
        <div className="rounded-md border border-zinc-800 bg-zinc-900 p-2 text-zinc-300">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight text-zinc-100">{value}</div>
        {helper && <p className="mt-1 text-xs text-zinc-500">{helper}</p>}
      </CardContent>
    </Card>
  );
}

