import { Eye, Edit3, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MarketingTemplate } from '@/lib/types/template';

interface TemplatesTableProps {
  templates: MarketingTemplate[];
  isLoading?: boolean;
  deletingId?: string | null;
  onPreview: (template: MarketingTemplate) => void;
  onEdit: (template: MarketingTemplate) => void;
  onDelete: (template: MarketingTemplate) => void;
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, idx) => (
        <TableRow key={idx}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-52" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-32" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function formatDate(value?: string): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function truncate(value: string, length: number): string {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length)}...`;
}

function toSummaryText(body: string): string {
  const stripped = body
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return stripped || '(empty body)';
}

export function TemplatesTable({
  templates,
  isLoading = false,
  deletingId,
  onPreview,
  onEdit,
  onDelete,
}: TemplatesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Variables</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <LoadingRows />
        ) : templates.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-14 text-center">
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-200">No templates found</p>
                <p className="text-xs text-zinc-500">
                  Create your first template to start campaign messaging.
                </p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium text-zinc-100">{template.name}</p>
                  <p className="line-clamp-1 text-xs text-zinc-500">
                    {truncate(toSummaryText(template.body), 65)}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={template.type === 'email' ? 'neutral' : 'warning'}>
                  {template.type}
                </Badge>
              </TableCell>
              <TableCell className="text-zinc-200">{truncate(template.subject, 40)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {template.variables.length === 0 ? (
                    <span className="text-xs text-zinc-500">No variables</span>
                  ) : (
                    template.variables.slice(0, 3).map((variable) => (
                      <span
                        key={variable}
                        className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[11px] text-zinc-300"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))
                  )}
                </div>
              </TableCell>
              <TableCell className="text-xs text-zinc-500">{formatDate(template.updatedAt)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                    onClick={() => onPreview(template)}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    Preview
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                    onClick={() => onEdit(template)}
                  >
                    <Edit3 className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(template)}
                    disabled={deletingId === template.id}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    {deletingId === template.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
