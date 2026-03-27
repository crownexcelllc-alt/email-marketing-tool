import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TemplatePreviewPanel } from '@/components/templates/template-preview-panel';
import type { MarketingTemplate, TemplatePreviewResult } from '@/lib/types/template';

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: MarketingTemplate | null;
  isLoading?: boolean;
  preview?: TemplatePreviewResult | null;
}

export function TemplatePreviewDialog({
  open,
  onOpenChange,
  template,
  isLoading = false,
  preview,
}: TemplatePreviewDialogProps) {
  if (!template) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview Template</DialogTitle>
          <DialogDescription>
            {template.name}
          </DialogDescription>
        </DialogHeader>

        <TemplatePreviewPanel
          type={template.type}
          subject={preview?.subject ?? template.subject}
          body={preview?.body ?? template.body}
        />

        {preview?.unresolvedVariables?.length ? (
          <div className="rounded-md border border-amber-700/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            Unresolved variables: {preview.unresolvedVariables.join(', ')}
          </div>
        ) : null}

        <DialogFooter>
          {isLoading ? <p className="text-xs text-zinc-500">Loading preview...</p> : null}
          <Button
            type="button"
            variant="outline"
            className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
