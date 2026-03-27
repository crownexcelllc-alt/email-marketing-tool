import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function StatSkeleton() {
  return (
    <Card className="border-zinc-800 bg-zinc-900/70">
      <CardHeader className="space-y-2 pb-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

export function AnalyticsLoadingSkeleton() {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>

      <Card className="border-zinc-800 bg-zinc-900/70">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900/70">
          <CardHeader>
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/70">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

