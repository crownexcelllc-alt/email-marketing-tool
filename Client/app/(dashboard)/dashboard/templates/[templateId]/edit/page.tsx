'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { EmailTemplateHtmlEditor } from '@/components/templates/email-template-html-editor';
import { LayoutTemplateEditor } from '@/components/templates/layout-template-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { HttpClientError } from '@/lib/api/errors';
import { createTemplate, getTemplateById, updateTemplate } from '@/lib/api/templates';
import { cn } from '@/lib/utils';
import type {
  MarketingTemplate,
  TemplateType,
} from '@/lib/types/template';
import { templateFormSchema, type TemplateFormValues } from '@/lib/validators/template';

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-rose-500">{message}</p>;
}

function getDefaultValues(
  template: MarketingTemplate | null | undefined,
  defaultType: TemplateType,
): TemplateFormValues {
  return {
    type: template?.type ?? defaultType,
    editorType: template?.editorType ?? 'html',
    layoutPreset: template?.layoutPreset ?? null,
    designJson: template?.designJson ?? null,
    mjmlBody: template?.mjmlBody ?? null,
    category: template?.category ?? 'general',
    name: template?.name ?? '',
    subject: template?.subject ?? '',
    body: template?.body ?? '',
    status: template?.status ?? 'active',
  };
}

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams<{ templateId: string }>();
  const templateId = useMemo(() => decodeURIComponent(params.templateId ?? ''), [params.templateId]);

  const [template, setTemplate] = useState<MarketingTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [pendingSaveValues, setPendingSaveValues] = useState<TemplateFormValues | null>(null);
  const [isSaveOptionsOpen, setIsSaveOptionsOpen] = useState(false);

  const handleBackClick = () => {
    setIsLeaveConfirmOpen(true);
  };

  const handleConfirmLeave = () => {
    setIsLeaveConfirmOpen(false);
    router.push(
      template
        ? `/dashboard/templates/${encodeURIComponent(template.id)}`
        : '/dashboard/templates',
    );
  };

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema) as never,
    defaultValues: getDefaultValues(template, 'email'),
  });

  useEffect(() => {
    form.register('designJson');
    form.register('mjmlBody');
    form.register('name');
    form.register('subject');
  }, [form]);

  useEffect(() => {
    if (!templateId) {
      setIsLoading(false);
      setLoadError('Invalid template id.');
      return;
    }

    let cancelled = false;

    async function loadTemplate() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const item = await getTemplateById(templateId);
        if (!cancelled) {
          setTemplate(item);
          form.reset(getDefaultValues(item, item.type));
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setTemplate(null);
          setLoadError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTemplate();

    return () => {
      cancelled = true;
    };
  }, [form, templateId]);

  const watchedType = useWatch({ control: form.control, name: 'type' }) ?? 'email';
  const watchedEditorType = useWatch({ control: form.control, name: 'editorType' }) ?? 'html';
  const watchedLayoutPreset = useWatch({ control: form.control, name: 'layoutPreset' });
  const watchedDesignJson = useWatch({ control: form.control, name: 'designJson' });
  const watchedMjmlBody = useWatch({ control: form.control, name: 'mjmlBody' }) ?? null;
  const useFullPageEditor = !isLoading && !loadError && watchedType === 'email';

  const handleSubmit = form.handleSubmit((values) => {
    if (!template) {
      return;
    }
    setPendingSaveValues(values);
    setIsSaveOptionsOpen(true);
  });

  const handleSaveUpdateOriginal = async () => {
    if (!template || !pendingSaveValues) return;
    setIsSaveOptionsOpen(false);
    setIsSubmitting(true);
    try {
      await updateTemplate(template.id, pendingSaveValues);
      form.reset(pendingSaveValues); // Clear dirty state
      toast.success('Template updated successfully.');
      router.push('/dashboard/templates');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setPendingSaveValues(null);
    }
  };

  const handleSaveAsCopy = async () => {
    if (!template || !pendingSaveValues) return;
    setIsSaveOptionsOpen(false);
    setIsSubmitting(true);
    try {
      const newTemplate = await createTemplate(pendingSaveValues);
      form.reset(pendingSaveValues); // Clear dirty state
      toast.success(`Template copy "${newTemplate.name}" created successfully.`);
      router.push('/dashboard/templates');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setPendingSaveValues(null);
    }
  };

  return (
    <section
      className={cn(
        useFullPageEditor
          ? 'flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden p-3 md:p-4'
          : 'mx-auto w-full max-w-6xl space-y-5 p-4 md:p-8',
      )}
    >
      {isLoading ? (
        <Skeleton className="h-[60vh] min-h-[420px] w-full rounded-md" />
      ) : loadError ? (
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">
          {loadError}
        </div>
      ) : (
        <form className={cn(useFullPageEditor ? 'flex h-full min-h-0 flex-col gap-3 overflow-hidden' : 'space-y-4')} onSubmit={handleSubmit}>
          <input type="hidden" {...form.register('type')} />
          <input type="hidden" {...form.register('editorType')} />
          <input type="hidden" {...form.register('category')} />
          <input type="hidden" {...form.register('status')} />
          <input type="hidden" {...form.register('layoutPreset')} />

          {useFullPageEditor ? (
            <>
              <div className="flex flex-1 min-h-0 flex-col overflow-hidden space-y-2">
                {watchedEditorType === 'layout' ? (
                  <Controller
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <LayoutTemplateEditor
                        key={`layout-editor-${template?.id ?? `preset-${watchedLayoutPreset ?? 'none'}`}`}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        designJson={
                          watchedDesignJson && typeof watchedDesignJson === 'object'
                            ? watchedDesignJson
                            : null
                        }
                        onDesignChange={(design) => {
                          form.setValue('designJson', design, {
                            shouldDirty: true,
                          });
                        }}
                        mjmlValue={watchedMjmlBody}
                        onMjmlChange={(mjml) => {
                          form.setValue('mjmlBody', mjml, {
                            shouldDirty: true,
                          });
                        }}
                        headerActions={(
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-medium text-white/70">Name:</span>
                              <input
                                type="text"
                                className="h-8 w-44 rounded-md border border-[#1d718d] bg-[#0f5b76]/50 px-2.5 text-xs text-white placeholder-white/40 outline-none focus:border-[#2bb1dc] focus:bg-[#0f5b76]/80 focus:ring-1 focus:ring-[#2bb1dc]"
                                placeholder="Template Name"
                                {...form.register('name')}
                                onKeyDown={(e) => e.stopPropagation()}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 border-[#1d718d] bg-[#0f5b76] px-3 text-xs font-semibold text-white hover:bg-[#0c6784] hover:text-white"
                              onClick={handleBackClick}
                              disabled={isSubmitting}
                            >
                              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                              Back
                            </Button>
                            <Button
                              type="submit"
                              className="h-8 bg-white px-3 text-xs font-semibold text-[#0a4f68] hover:bg-slate-100"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        )}
                        fullHeight
                      />
                    )}
                  />
                ) : (
                  <Controller
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <EmailTemplateHtmlEditor
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        designJson={
                          watchedDesignJson && typeof watchedDesignJson === 'object'
                            ? watchedDesignJson
                            : null
                        }
                        onDesignChange={(design) => {
                          form.setValue('designJson', design, {
                            shouldDirty: true,
                          });
                        }}
                        mjmlValue={watchedMjmlBody}
                        onMjmlChange={(mjml) => {
                          form.setValue('mjmlBody', mjml, {
                            shouldDirty: true,
                          });
                        }}
                        headerActions={(
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-medium text-zinc-500">Name:</span>
                              <input
                                type="text"
                                className="h-8 w-44 rounded-md border border-zinc-300 bg-white px-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                                placeholder="Template Name"
                                {...form.register('name')}
                                onKeyDown={(e) => e.stopPropagation()}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100"
                              onClick={handleBackClick}
                              disabled={isSubmitting}
                            >
                              <ArrowLeft className="mr-1 h-4 w-4" />
                              Back
                            </Button>
                            <Button type="submit" className="h-8" disabled={isSubmitting}>
                              {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        )}
                        fullHeight
                      />
                    )}
                  />
                )}
                <FieldError message={form.formState.errors.body?.message} />
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Edit Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input id="name" placeholder="Welcome Sequence V1" {...form.register('name')} />
                    <FieldError message={form.formState.errors.name?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Hello {{name}}, your offer is ready"
                      {...form.register('subject')}
                    />
                    <FieldError message={form.formState.errors.subject?.message} />
                  </div>
                </div>

                <textarea
                  id="body"
                  rows={8}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  placeholder="Hi {{name}}, we have a new update for {{company}}."
                  {...form.register('body')}
                />
                <FieldError message={form.formState.errors.body?.message} />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-zinc-300"
                    onClick={handleBackClick}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      )}
      <Dialog open={isLeaveConfirmOpen} onOpenChange={setIsLeaveConfirmOpen}>
        <DialogContent className="w-[96vw] sm:max-w-md bg-zinc-950 text-zinc-100 border-zinc-800" showClose={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Leave Editor?</DialogTitle>
            <DialogDescription className="text-zinc-400 mt-2">
              {form.formState.isDirty
                ? 'You have unsaved changes. If you leave now, your changes will be lost.'
                : "You haven't made any changes. You are returning to the preview page."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLeaveConfirmOpen(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white w-full sm:w-auto"
            >
              Stay Here
            </Button>
            <Button
              type="button"
              variant={form.formState.isDirty ? 'destructive' : 'default'}
              onClick={handleConfirmLeave}
              className="w-full sm:w-auto"
            >
              {form.formState.isDirty ? 'Leave Editor' : 'Go to Preview'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isSaveOptionsOpen} onOpenChange={setIsSaveOptionsOpen}>
        <DialogContent className="w-[96vw] sm:max-w-2xl bg-zinc-950 text-zinc-100 border-zinc-800" showClose={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Save Template</DialogTitle>
            <DialogDescription className="text-zinc-400 mt-2">
              Would you like to overwrite the existing template or save these changes as a new copy?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSaveOptionsOpen(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveAsCopy}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Save as Copy (Create New)
            </Button>
            <Button
              type="button"
              onClick={handleSaveUpdateOriginal}
              className="bg-[#0b6886] hover:bg-[#0c7ea3] text-white w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Update Original Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
