'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { EmailTemplateHtmlEditor } from '@/components/templates/email-template-html-editor';
import { LayoutTemplateEditor } from '@/components/templates/layout-template-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLayoutEditorFlow, useLayoutEditorScrollLock } from '@/hooks/use-layout-editor-flow';
import { HttpClientError } from '@/lib/api/errors';
import { createTemplate } from '@/lib/api/templates';
import { getLayoutPresetDefinition } from '@/lib/constants/template-layouts';
import {
  saveTemplateDraft,
  readTemplateDraft,
  clearTemplateDraft,
  type TemplateDraft,
} from '@/lib/templates/draft-store';
import type { TemplateLayoutPreset } from '@/lib/types/template';
import { templateFormSchema, type TemplateFormValues } from '@/lib/validators/template';

const PREBUILT_LAYOUT_PRESETS: TemplateLayoutPreset[] = [
  'basic',
  'commerce',
  'three-columns',
  'news',
  'text',
];

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
  editor: 'html' | 'layout',
  preset: TemplateLayoutPreset | null,
): TemplateFormValues {
  if (editor === 'layout') {
    const starter = getLayoutPresetDefinition(preset ?? 'basic');
    return {
      type: 'email',
      editorType: 'layout',
      layoutPreset: starter.id,
      designJson: null,
      mjmlBody: starter.starterMjml,
      category: 'general',
      name: '',
      subject: starter.starterSubject,
      body: starter.starterHtml,
      status: 'active',
    };
  }

  return {
    type: 'email',
    editorType: 'html',
    layoutPreset: null,
    designJson: null,
    mjmlBody: null,
    category: 'general',
    name: '',
    subject: 'Hello {{name}}, your offer is ready',
    body: '<!doctype html><html><body>...</body></html>',
    status: 'active',
  };
}

const NEW_TEMPLATE_DRAFT_KEY = 'template-new-draft';

export default function NewTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const editorMode = useMemo<'html' | 'layout'>(() => {
    const raw = searchParams.get('editor');
    return raw === 'layout' ? 'layout' : 'html';
  }, [searchParams]);

  const layoutPreset = useMemo<TemplateLayoutPreset | null>(() => {
    const raw = searchParams.get('preset')?.trim();
    if (!raw) {
      return null;
    }

    return PREBUILT_LAYOUT_PRESETS.includes(raw as TemplateLayoutPreset)
      ? (raw as TemplateLayoutPreset)
      : null;
  }, [searchParams]);

  const isLayoutNewFlow = editorMode === 'layout';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalSaving, setIsFinalSaving] = useState(false);
  const [isHtmlNameStepOpen, setIsHtmlNameStepOpen] = useState(false);
  const [isHtmlLeaveConfirmOpen, setIsHtmlLeaveConfirmOpen] = useState(false);
  const [htmlTemplateName, setHtmlTemplateName] = useState('');
  const autoSaveTimerRef = useRef<number | null>(null);
  const backupSaveTimerRef = useRef<number | null>(null);

  // Draft restore state
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<TemplateDraft | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Autosave status state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema) as never,
    defaultValues: getDefaultValues(editorMode, layoutPreset),
  });

  const {
    clearDraftProgress,
    closeNameStep,
    finalizedName,
    isDraftSaved,
    isNameStepOpen,
    markDraftSaved,
    openNameStep,
    resetFlow,
    setTemplateName,
    syncTemplateName,
    templateName,
  } = useLayoutEditorFlow({ initialTemplateName: '' });

  useEffect(() => {
    form.register('designJson');
    form.register('mjmlBody');
  }, [form]);

  useEffect(() => {
    if (isRestoreOpen || pendingDraft || !isReady) {
      return;
    }
    const defaults = getDefaultValues(editorMode, layoutPreset);
    form.reset(defaults);
    resetFlow(defaults.name ?? '');
    setIsHtmlNameStepOpen(false);
    setHtmlTemplateName(defaults.name ?? '');
  }, [editorMode, form, layoutPreset, resetFlow, isRestoreOpen, pendingDraft, isReady]);

  useLayoutEditorScrollLock(isLayoutNewFlow);

  const watchedType = useWatch({ control: form.control, name: 'type' }) ?? 'email';
  const watchedEditorType = useWatch({ control: form.control, name: 'editorType' }) ?? editorMode;
  const watchedLayoutPreset = useWatch({ control: form.control, name: 'layoutPreset' });
  const watchedDesignJson = useWatch({ control: form.control, name: 'designJson' });
  const watchedMjmlBody = useWatch({ control: form.control, name: 'mjmlBody' }) ?? null;
  const watchedName = useWatch({ control: form.control, name: 'name' }) ?? '';
  const watchedBody = useWatch({ control: form.control, name: 'body' }) ?? '';
  const watchedSubject = useWatch({ control: form.control, name: 'subject' }) ?? '';
  const hasUnsavedChanges = form.formState.isDirty;
  const canGoNext = isDraftSaved && !hasUnsavedChanges;

  useEffect(() => {
    syncTemplateName(watchedName);
  }, [syncTemplateName, watchedName]);

  // Check for draft on mount
  useEffect(() => {
    const draft = readTemplateDraft(NEW_TEMPLATE_DRAFT_KEY);
    if (draft) {
      setPendingDraft(draft);
      setIsRestoreOpen(true);
    } else {
      setIsReady(true);
    }
  }, []);

  const handleContinueDraft = () => {
    if (pendingDraft) {
      form.reset(pendingDraft.values);
      resetFlow(pendingDraft.values.name ?? '');
      setHtmlTemplateName(pendingDraft.values.name ?? '');
      if (pendingDraft.stepProgress) {
        if (pendingDraft.stepProgress.isNameStepOpen) {
          openNameStep();
        }
        if (pendingDraft.stepProgress.isHtmlNameStepOpen) {
          setIsHtmlNameStepOpen(true);
        }
      }
      markDraftSaved();
      setSaveStatus('saved');
    }
    setIsRestoreOpen(false);
    setPendingDraft(null);
    setIsReady(true);
  };

  const handleStartFresh = () => {
    clearTemplateDraft(NEW_TEMPLATE_DRAFT_KEY);
    setIsRestoreOpen(false);
    setPendingDraft(null);
    const defaults = getDefaultValues(editorMode, layoutPreset);
    form.reset(defaults);
    resetFlow(defaults.name ?? '');
    setIsHtmlNameStepOpen(false);
    setHtmlTemplateName(defaults.name ?? '');
    setSaveStatus('idle');
    setIsReady(true);
  };

  // Debounced Autosave (1s after typing stops)
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    setSaveStatus('saving');

    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = window.setTimeout(() => {
      const values = form.getValues();
      saveTemplateDraft(NEW_TEMPLATE_DRAFT_KEY, values, {
        isNameStepOpen,
        isHtmlNameStepOpen,
      });
      form.reset(values);
      markDraftSaved();
      setSaveStatus('saved');
      autoSaveTimerRef.current = null;
    }, 1000);

    return () => {
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    form,
    hasUnsavedChanges,
    markDraftSaved,
    isNameStepOpen,
    isHtmlNameStepOpen,
    watchedBody,
    watchedDesignJson,
    watchedMjmlBody,
    watchedName,
    watchedSubject,
  ]);

  // Periodic Backup Autosave (every 8s if there are unsaved changes)
  useEffect(() => {
    if (!hasUnsavedChanges) {
      if (backupSaveTimerRef.current !== null) {
        window.clearInterval(backupSaveTimerRef.current);
        backupSaveTimerRef.current = null;
      }
      return;
    }

    if (backupSaveTimerRef.current === null) {
      backupSaveTimerRef.current = window.setInterval(() => {
        const values = form.getValues();
        saveTemplateDraft(NEW_TEMPLATE_DRAFT_KEY, values, {
          isNameStepOpen,
          isHtmlNameStepOpen,
        });
        form.reset(values);
        markDraftSaved();
        setSaveStatus('saved');
      }, 8000);
    }

    return () => {
      if (backupSaveTimerRef.current !== null) {
        window.clearInterval(backupSaveTimerRef.current);
        backupSaveTimerRef.current = null;
      }
    };
  }, [
    form,
    hasUnsavedChanges,
    markDraftSaved,
    isNameStepOpen,
    isHtmlNameStepOpen,
  ]);

  useEffect(() => {
    if (hasUnsavedChanges) {
      clearDraftProgress();
    }
  }, [clearDraftProgress, hasUnsavedChanges]);

  const openHtmlNameStep = async () => {
    const valid = await form.trigger(['body']);
    if (!valid) {
      toast.error('Please add template code before saving.');
      return;
    }

    const currentName = form.getValues('name') ?? '';
    setHtmlTemplateName(currentName.trim());
    setIsHtmlNameStepOpen(true);
  };

  const handleBack = async () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Press OK to save and go back, or Cancel to stay on this page.'
      );
      if (!confirmed) {
        return;
      }
      const valid = await form.trigger(['subject', 'body']);
      if (valid) {
        saveTemplateDraft(NEW_TEMPLATE_DRAFT_KEY, form.getValues(), {
          isNameStepOpen,
          isHtmlNameStepOpen,
        });
        markDraftSaved();
      }
    }
    router.push('/dashboard/templates?tab=personal');
  };

  const handleFinalSave = async () => {
    if (hasUnsavedChanges) {
      toast.error('Please save your latest editor changes first.');
      return;
    }

    if (finalizedName.length < 2) {
      toast.error('Template name must be at least 2 characters.');
      return;
    }

    setIsFinalSaving(true);
    try {
      const values = form.getValues();
      const starter = getLayoutPresetDefinition(layoutPreset ?? 'basic');
      const payload: TemplateFormValues = {
        ...values,
        name: finalizedName,
        subject: values.subject === starter.starterSubject ? finalizedName : values.subject,
      };
      await createTemplate(payload);
      clearTemplateDraft(NEW_TEMPLATE_DRAFT_KEY);
      toast.success('Template created successfully.');
      router.push('/dashboard/templates?tab=personal');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsFinalSaving(false);
    }
  };

  const handleHtmlFinalSave = async () => {
    const finalName = htmlTemplateName.trim();
    if (finalName.length < 2) {
      toast.error('Template name must be at least 2 characters.');
      return;
    }

    const valid = await form.trigger(['body']);
    if (!valid) {
      toast.error('Please add template code before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      const values = form.getValues();
      const payload: TemplateFormValues = {
        ...values,
        name: finalName,
        subject: values.subject === 'Hello {{name}}, your offer is ready' ? finalName : values.subject,
      };
      await createTemplate(payload);
      clearTemplateDraft(NEW_TEMPLATE_DRAFT_KEY);
      toast.success('Template created successfully.');
      router.push('/dashboard/templates?tab=personal');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmHtmlBack = () => {
    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    const values = form.getValues();
    saveTemplateDraft(NEW_TEMPLATE_DRAFT_KEY, values, {
      isNameStepOpen,
      isHtmlNameStepOpen,
    });
    form.reset(values);
    markDraftSaved();
    setIsHtmlLeaveConfirmOpen(false);
    router.push('/dashboard/templates?tab=personal');
  };

  const handleHtmlBack = () => {
    setIsHtmlLeaveConfirmOpen(true);
  };

  const renderSaveStatus = (theme: 'dark' | 'light') => {
    if (saveStatus === 'idle') return null;
    const isDark = theme === 'dark';
    return (
      <div className="flex items-center gap-1.5 text-[11px] font-medium mr-2">
        {saveStatus === 'saving' ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className={isDark ? 'text-cyan-200/80' : 'text-zinc-500'}>Saving...</span>
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className={isDark ? 'text-cyan-200/80' : 'text-zinc-500'}>Draft saved</span>
          </>
        )}
      </div>
    );
  };

  if (!isReady) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#064a63]">
        <div className="flex flex-col items-center gap-2 text-white">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-transparent" />
          <span className="text-sm font-medium text-cyan-200/80">Loading editor...</span>
        </div>
        <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
          <DialogContent className="w-[96vw] sm:max-w-md bg-zinc-950 text-zinc-100 border-zinc-800" showClose={false}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Unsaved Draft Found</DialogTitle>
              <DialogDescription className="text-zinc-400 mt-2">
                You have an unsaved draft for this template. What do you want to do?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex flex-col sm:flex-row justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleStartFresh}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white w-full sm:w-auto"
              >
                Start fresh
              </Button>
              <Button
                type="button"
                onClick={handleContinueDraft}
                className="bg-[#0b6886] hover:bg-[#0c7ea3] text-white w-full sm:w-auto"
              >
                Continue draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (isLayoutNewFlow) {
    return (
      <section className="relative h-full w-full overflow-hidden">
        <form
          id="template-editor-form"
          className="flex h-full min-h-0 w-full flex-col"
          onSubmit={(event) => event.preventDefault()}
        >
          <input type="hidden" {...form.register('type')} />
          <input type="hidden" {...form.register('editorType')} />
          <input type="hidden" {...form.register('category')} />
          <input type="hidden" {...form.register('status')} />
          <input type="hidden" {...form.register('layoutPreset')} />

          <div className="flex h-full min-h-0 w-full flex-col">
            {watchedType === 'email' && watchedEditorType === 'layout' ? (
              <Controller
                control={form.control}
                name="body"
                render={({ field }) => (
                  <LayoutTemplateEditor
                    key={`layout-editor-new-${watchedLayoutPreset ?? 'none'}`}
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
                    headerActions={
                      <div className="flex items-center gap-2">
                        {renderSaveStatus('dark')}
                        <Button
                          type="button"
                          variant="outline"
                          className="border-cyan-200 bg-white/95 text-[#0b5066] hover:bg-white"
                          onClick={() => void handleBack()}
                        >
                          <ArrowLeft className="mr-1 h-4 w-4" />
                          Back
                        </Button>
                        {canGoNext ? (
                          <Button
                            type="button"
                            className="bg-cyan-100 text-[#0b5066] hover:bg-cyan-200"
                            onClick={openNameStep}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Next
                          </Button>
                        ) : null}
                      </div>
                    }
                    previewHeaderActions={
                      canGoNext ? (
                        <Button
                          type="button"
                          className="bg-cyan-100 text-[#0b5066] hover:bg-cyan-200"
                          onClick={openNameStep}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Next
                        </Button>
                      ) : null
                    }
                    previewBlocked={hasUnsavedChanges}
                    onPreviewBlocked={() => {
                      toast.error('Please save your changes first, then open preview.');
                    }}
                    fullHeight
                  />
                )}
              />
            ) : null}
            <FieldError message={form.formState.errors.body?.message} />
          </div>

          {isNameStepOpen ? (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4">
              <Card className="w-full max-w-xl border-slate-300 bg-white text-slate-900">
                <CardContent className="space-y-4 p-6">
                  <h3 className="text-lg font-semibold">Template Name</h3>
                  <p className="text-sm text-slate-600">
                    Enter template name, then save to add this template in All Templates.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="template-name-final">Template Name</Label>
                    <Input
                      id="template-name-final"
                      value={templateName}
                      onChange={(event) => setTemplateName(event.target.value)}
                      placeholder="Welcome Sequence V1"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={closeNameStep} disabled={isFinalSaving}>
                      Back
                    </Button>
                    <Button type="button" onClick={() => void handleFinalSave()} disabled={isFinalSaving}>
                      {isFinalSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </form>
        <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
          <DialogContent className="w-[96vw] sm:max-w-md bg-zinc-950 text-zinc-100 border-zinc-800" showClose={false}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Unsaved Draft Found</DialogTitle>
              <DialogDescription className="text-zinc-400 mt-2">
                You have an unsaved draft for this template. What do you want to do?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex flex-col sm:flex-row justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleStartFresh}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white w-full sm:w-auto"
              >
                Start fresh
              </Button>
              <Button
                type="button"
                onClick={handleContinueDraft}
                className="bg-[#0b6886] hover:bg-[#0c7ea3] text-white w-full sm:w-auto"
              >
                Continue draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    );
  }

  return (
    <section className="relative flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden p-3 md:p-4">
      <form className="flex h-full min-h-0 flex-col gap-3 overflow-hidden" onSubmit={(event) => event.preventDefault()}>
        <input type="hidden" {...form.register('type')} />
        <input type="hidden" {...form.register('editorType')} />
        <input type="hidden" {...form.register('category')} />
        <input type="hidden" {...form.register('status')} />
        <input type="hidden" {...form.register('layoutPreset')} />
        <input type="hidden" {...form.register('name')} />
        <input type="hidden" {...form.register('subject')} />

        <div className="flex flex-1 min-h-0 flex-col overflow-hidden space-y-2">
          {watchedType === 'email' ? (
            watchedEditorType === 'layout' ? (
              <Controller
                control={form.control}
                name="body"
                render={({ field }) => (
                  <LayoutTemplateEditor
                    key={`layout-editor-new-${watchedLayoutPreset ?? 'none'}`}
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
                      <div className="flex items-center gap-2">
                        {renderSaveStatus('light')}
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100"
                          onClick={handleHtmlBack}
                          disabled={isSubmitting}
                        >
                          <ArrowLeft className="mr-1 h-4 w-4" />
                          Back
                        </Button>
                        <Button type="button" className="h-8" onClick={() => void openHtmlNameStep()} disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    )}
                    fullHeight
                  />
                )}
              />
            )
          ) : (
            <textarea
              id="body"
              rows={8}
              className="h-full min-h-[420px] w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              placeholder="Hi {{name}}, we have a new update for {{company}}."
              {...form.register('body')}
            />
          )}
          <FieldError message={form.formState.errors.body?.message} />
        </div>

        {isHtmlNameStepOpen ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4">
            <Card className="w-full max-w-xl border-slate-300 bg-white text-slate-900">
              <CardHeader>
                <CardTitle>Template Name</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Add a template name to finish saving this custom template.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="html-template-name-final">Template Name</Label>
                  <Input
                    id="html-template-name-final"
                    value={htmlTemplateName}
                    onChange={(event) => setHtmlTemplateName(event.target.value)}
                    placeholder="Welcome Sequence V1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsHtmlNameStepOpen(false)}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button type="button" onClick={() => void handleHtmlFinalSave()} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {isHtmlLeaveConfirmOpen ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4">
            <Card className="w-full max-w-md border-slate-300 bg-white text-slate-900 shadow-xl">
              <CardHeader>
                <CardTitle>Leave Editor?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Your template draft will be auto-saved before you leave this page.
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsHtmlLeaveConfirmOpen(false)}
                    disabled={isSubmitting}
                  >
                    Stay Here
                  </Button>
                  <Button type="button" onClick={confirmHtmlBack} disabled={isSubmitting}>
                    Save & Leave
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </form>
      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent className="w-[96vw] sm:max-w-md bg-zinc-950 text-zinc-100 border-zinc-800" showClose={false}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Unsaved Draft Found</DialogTitle>
            <DialogDescription className="text-zinc-400 mt-2">
              You have an unsaved draft for this template. What do you want to do?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleStartFresh}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white w-full sm:w-auto"
            >
              Start fresh
            </Button>
            <Button
              type="button"
              onClick={handleContinueDraft}
              className="bg-[#0b6886] hover:bg-[#0c7ea3] text-white w-full sm:w-auto"
            >
              Continue draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
