import { Card, CardContent } from '@/components/ui/card';

interface QuickStatCardProps {
  label: string;
  value: string;
  helper: string;
}

export function QuickStatCard({ label, value, helper }: QuickStatCardProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100">
      <CardContent className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
        <p className="text-xl font-semibold text-zinc-100">{value}</p>
        <p className="text-xs text-zinc-500">{helper}</p>
      </CardContent>
    </Card>
  );
}

