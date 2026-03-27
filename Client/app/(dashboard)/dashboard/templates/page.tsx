'use client';

import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TemplateFormDialog } from '@/components/templates/template-form-dialog';
import { TemplatesFilters } from '@/components/templates/templates-filters';
import { TemplatePreviewDialog } from '@/components/templates/template-preview-dialog';
import { TemplatesTable } from '@/components/templates/templates-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HttpClientError } from '@/lib/api/errors';
import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  previewTemplate,
  updateTemplate,
} from '@/lib/api/templates';
import type {
  MarketingTemplate,
  TemplatePreviewResult,
  TemplateType,
  TemplatesPagination,
} from '@/lib/types/template';
import type { TemplateFormValues } from '@/lib/validators/template';
import type { TemplateTypeTabValue } from '@/components/templates/template-type-tabs';

const DEFAULT_PAGINATION: TemplatesPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
  const [pagination, setPagination] = useState<TemplatesPagination>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [activeType, setActiveType] = useState<TemplateTypeTabValue>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MarketingTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewingTemplate, setPreviewingTemplate] = useState<MarketingTemplate | null>(null);
  const [previewResult, setPreviewResult] = useState<TemplatePreviewResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [activeType, debouncedSearch]);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getTemplates({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        type: activeType === 'all' ? undefined : activeType,
      });

      setTemplates(response.items);
      setPagination(response.pagination);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [activeType, debouncedSearch, pagination.limit, pagination.page]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const visibleTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesType = activeType === 'all' || template.type === activeType;
      const matchesSearch =
        !debouncedSearch ||
        template.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        template.subject.toLowerCase().includes(debouncedSearch.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [activeType, debouncedSearch, templates]);

  const openCreate = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const openEdit = (template: MarketingTemplate) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const closeForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingTemplate(null);
    }
  };

  const openPreview = async (template: MarketingTemplate) => {
    setPreviewingTemplate(template);
    setPreviewResult(null);
    setIsPreviewOpen(true);

    setIsPreviewLoading(true);

    try {
      const result = await previewTemplate(template.id);
      setPreviewResult(result);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = (open: boolean) => {
    setIsPreviewOpen(open);
    if (!open) {
      setPreviewingTemplate(null);
      setPreviewResult(null);
      setIsPreviewLoading(false);
    }
  };

  const handleSave = async (values: TemplateFormValues) => {
    setIsSaving(true);

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, values);
        toast.success('Template updated.');
      } else {
        await createTemplate(values);
        toast.success('Template created.');
      }

      closeForm(false);
      await loadTemplates();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (template: MarketingTemplate) => {
    const confirmed = window.confirm(`Delete "${template.name}" template?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(template.id);

    try {
      await deleteTemplate(template.id);
      toast.success('Template deleted.');
      await loadTemplates();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const goToPreviousPage = () => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(1, prev.page - 1),
    }));
  };

  const goToNextPage = () => {
    setPagination((prev) => ({
      ...prev,
      page: Math.min(prev.totalPages || 1, prev.page + 1),
    }));
  };

  const dialogDefaultType: TemplateType =
    activeType === 'all' ? 'email' : activeType;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Templates</h2>
          <p className="text-sm text-zinc-400">
            Build and manage reusable email and WhatsApp templates.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-100">
        <CardHeader className="space-y-4">
          <CardTitle className="text-base">Template Library</CardTitle>
          <TemplatesFilters
            search={search}
            type={activeType}
            onSearchChange={setSearch}
            onTypeChange={setActiveType}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplatesTable
            templates={visibleTemplates}
            isLoading={isLoading}
            deletingId={deletingId}
            onPreview={openPreview}
            onEdit={openEdit}
            onDelete={handleDelete}
          />

          <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              Page {pagination.page} of {pagination.totalPages} | {pagination.total} total templates
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                onClick={goToPreviousPage}
                disabled={pagination.page <= 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                onClick={goToNextPage}
                disabled={pagination.page >= pagination.totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TemplateFormDialog
        open={isFormOpen}
        onOpenChange={closeForm}
        template={editingTemplate}
        defaultType={dialogDefaultType}
        isSubmitting={isSaving}
        onSubmit={handleSave}
      />

      <TemplatePreviewDialog
        open={isPreviewOpen}
        onOpenChange={closePreview}
        template={previewingTemplate}
        preview={previewResult}
        isLoading={isPreviewLoading}
      />
    </section>
  );
}
