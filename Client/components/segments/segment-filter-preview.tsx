import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SegmentFormValues } from '@/lib/validators/segment';

interface SegmentFilterPreviewProps {
  values: Pick<SegmentFormValues, 'filterTags' | 'filterStatus' | 'type'>;
}

export function SegmentFilterPreview({ values }: SegmentFilterPreviewProps) {
  const tagSummary =
    values.filterTags.length > 0 ? values.filterTags.join(', ') : 'Any tags';
  const statusSummary =
    values.filterStatus.length > 0 ? values.filterStatus.join(', ') : 'Any status';

  const payloadPreview = {
    type: values.type,
    filters: {
      tags: values.filterTags,
      status: values.filterStatus,
    },
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100">
      <CardHeader>
        <CardTitle className="text-sm">Dynamic Filter Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-zinc-300">
          Matching contacts where <span className="text-zinc-100">tags = {tagSummary}</span> and{' '}
          <span className="text-zinc-100">status = {statusSummary}</span>.
        </p>
        <pre className="overflow-x-auto rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
          {JSON.stringify(payloadPreview, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

