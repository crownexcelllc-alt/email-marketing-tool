import { Skeleton } from '@/components/ui/skeleton';

function EventCardSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="mt-2 space-y-2">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-72" />
      </div>
    </div>
  );
}

export function HistoryTimelineSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, groupIndex) => (
        <div key={groupIndex} className="space-y-3">
          <Skeleton className="h-5 w-36" />
          <div className="space-y-3">
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        </div>
      ))}
    </div>
  );
}
