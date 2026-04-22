import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  extractTemplateVariablesFromParts,
  renderTemplateWithSampleData,
} from '@/lib/template-utils';
import type { TemplateType } from '@/lib/types/template';

interface TemplatePreviewPanelProps {
  type: TemplateType;
  subject: string;
  body: string;
}

export function TemplatePreviewPanel({ type, subject, body }: TemplatePreviewPanelProps) {
  const variables = extractTemplateVariablesFromParts([subject, body]);
  const previewSubject = renderTemplateWithSampleData(subject || '(no subject)');
  const previewBody = renderTemplateWithSampleData(body || '(no body)');
  const previewDocument = useMemo(() => {
    if (type !== 'email') {
      return '';
    }

    if (/<html[\s>]/i.test(previewBody)) {
      return previewBody;
    }

    return `<!doctype html><html><head><meta charset="utf-8" /></head><body>${previewBody}</body></html>`;
  }, [previewBody, type]);

  return (
    <Card className="border-zinc-800 bg-zinc-900/70 text-zinc-100">
      <CardHeader>
        <CardTitle className="text-sm">Preview ({type})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Variables</p>
          {variables.length === 0 ? (
            <p className="text-sm text-zinc-500">No variables found</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {variables.map((variable) => (
                <span
                  key={variable}
                  className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-[11px] text-zinc-300"
                >
                  {`{{${variable}}}`}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Rendered Subject</p>
          <p className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
            {previewSubject}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Rendered Body</p>
          {type === 'email' ? (
            <iframe
              title="Email template preview"
              className="h-[360px] w-full rounded-md border border-zinc-800 bg-white"
              sandbox=""
              srcDoc={previewDocument}
            />
          ) : (
            <pre className="whitespace-pre-wrap rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
              {previewBody}
            </pre>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
