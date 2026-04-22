'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { EmailTemplateBuilder } from '@/components/templates/email-template-builder';
import { TemplatePreviewPanel } from '@/components/templates/template-preview-panel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MarketingTemplate, TemplateType } from '@/lib/types/template';
import { templateFormSchema, type TemplateFormValues } from '@/lib/validators/template';

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: MarketingTemplate | null;
  defaultType: TemplateType;
  isSubmitting?: boolean;
  onSubmit: (values: TemplateFormValues) => Promise<void>;
}

function getDefaultValues(
  template: MarketingTemplate | null | undefined,
  defaultType: TemplateType,
): TemplateFormValues {
  return {
    type: template?.type ?? defaultType,
    name: template?.name ?? '',
    subject: template?.subject ?? '',
    body: template?.body ?? '',
    status: template?.status ?? 'active',
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-rose-400">{message}</p>;
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  defaultType,
  isSubmitting = false,
  onSubmit,
}: TemplateFormDialogProps) {
  const isEdit = Boolean(template);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema) as never,
    defaultValues: getDefaultValues(template, defaultType),
  });

  useEffect(() => {
    form.reset(getDefaultValues(template, defaultType));
  }, [defaultType, form, open, template]);

  const watchedType = useWatch({
    control: form.control,
    name: 'type',
  }) ?? defaultType;

  const watchedSubject = useWatch({
    control: form.control,
    name: 'subject',
  }) ?? '';

  const watchedBody = useWatch({
    control: form.control,
    name: 'body',
  }) ?? '';

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[96vw] max-w-[1200px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription>
            Build reusable email and WhatsApp template content with variables.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                disabled={isEdit}
                {...form.register('type')}
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                {...form.register('status')}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
                placeholder="Welcome Sequence V1"
                {...form.register('name')}
              />
              <FieldError message={form.formState.errors.name?.message} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="subject">
                {watchedType === 'email' ? 'Subject' : 'Template Subject'}
              </Label>
              <Input
                id="subject"
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
                placeholder="Hello {{name}}, your offer is ready"
                {...form.register('subject')}
              />
              <FieldError message={form.formState.errors.subject?.message} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="body">Body</Label>
              {watchedType === 'email' ? (
                <Controller
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <EmailTemplateBuilder
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              ) : (
                <textarea
                  id="body"
                  rows={8}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  placeholder="Hi {{name}}, we have a new update for {{company}}."
                  {...form.register('body')}
                />
              )}
              <FieldError message={form.formState.errors.body?.message} />
            </div>
          </div>

          <TemplatePreviewPanel
            type={watchedType}
            subject={watchedSubject}
            body={watchedBody}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
