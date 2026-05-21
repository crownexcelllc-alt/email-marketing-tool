import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getTemplateCategoryLabel } from '@/lib/constants/template-categories';
import type { MarketingTemplate } from '@/lib/types/template';

interface TemplatesTableProps {
  templates: MarketingTemplate[];
  isLoading?: boolean;
  onCardClick: (template: MarketingTemplate) => void;
}

function LoadingCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
          <Skeleton className="h-56 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

function toPreviewDocument(html: string): string {
  if (/<html[\s>]/i.test(html)) {
    return html;
  }

  return `<!doctype html><html><head><meta charset="utf-8" /><style>body{margin:0;padding:0;}</style></head><body>${html}</body></html>`;
}

export function TemplatesTable({
  templates,
  isLoading = false,
  onCardClick,
}: TemplatesTableProps) {
  if (isLoading) {
    return <LoadingCards />;
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-10 text-center">
        <p className="text-sm font-medium text-zinc-200">No templates found</p>
        <p className="mt-1 text-xs text-zinc-500">Create your first template to start campaign messaging.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <article
          key={template.id}
          role="button"
          tabIndex={0}
          aria-label={`Open template ${template.name}`}
          className="cursor-pointer overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 transition hover:border-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:outline-none"
          onClick={() => onCardClick(template)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onCardClick(template);
            }
          }}
        >
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{getTemplateCategoryLabel(template.category)}</span>
            </div>
            {template.isCopy ? (
              <Badge variant="warning" className="text-[10px] px-1.5 py-0 font-semibold uppercase tracking-wider">
                Copy {template.copyNumber ?? 1}
              </Badge>
            ) : (
              <Badge variant="success" className="text-[10px] px-1.5 py-0 font-semibold uppercase tracking-wider">
                Original
              </Badge>
            )}
          </div>
          <div className="mb-3 h-48 overflow-hidden rounded-md border border-zinc-800 bg-white">
            <div className="h-[200%] w-[200%] origin-top-left scale-50">
              <iframe
                title={`${template.name} preview`}
                className="h-full w-full pointer-events-none"
                sandbox=""
                srcDoc={toPreviewDocument(template.body)}
              />
            </div>
          </div>
          <h3 className="line-clamp-1 text-sm font-semibold text-zinc-100">{template.name}</h3>
          <p className="mt-1 text-xs text-zinc-500 line-clamp-1">
            <span className="font-semibold text-zinc-400">Subject:</span>{' '}
            {template.subject || 'No subject line defined'}
          </p>
          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              {template.editorType === 'layout' ? 'Layout editor' : 'Custom editor'}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                onCardClick(template);
              }}
            >
              Preview
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
