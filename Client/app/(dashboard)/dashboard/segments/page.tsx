'use client';

import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SegmentFormDialog } from '@/components/segments/segment-form-dialog';
import { SegmentsFilters } from '@/components/segments/segments-filters';
import { SegmentsTable } from '@/components/segments/segments-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createSegment, deleteSegment, getSegments, updateSegment } from '@/lib/api/segments';
import { HttpClientError } from '@/lib/api/errors';
import type { Segment, SegmentsPagination } from '@/lib/types/segment';
import type { SegmentFormValues } from '@/lib/validators/segment';

const DEFAULT_PAGINATION: SegmentsPagination = {
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

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [pagination, setPagination] = useState<SegmentsPagination>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, tagFilter, statusFilter]);

  const loadSegments = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getSegments({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        tag: tagFilter || undefined,
        status: statusFilter || undefined,
      });

      setSegments(response.items);
      setPagination(response.pagination);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagination.limit, pagination.page, statusFilter, tagFilter]);

  useEffect(() => {
    void loadSegments();
  }, [loadSegments]);

  const visibleSegments = useMemo(() => {
    return segments.filter((segment) => {
      const matchesSearch =
        !debouncedSearch ||
        segment.name.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesTag =
        !tagFilter ||
        segment.filters.tags.some((tag) =>
          tag.toLowerCase().includes(tagFilter.toLowerCase()),
        );

      const matchesStatus =
        !statusFilter || segment.filters.status.includes(statusFilter);

      return matchesSearch && matchesTag && matchesStatus;
    });
  }, [debouncedSearch, segments, statusFilter, tagFilter]);

  const openCreate = () => {
    setEditingSegment(null);
    setIsFormOpen(true);
  };

  const openEdit = (segment: Segment) => {
    setEditingSegment(segment);
    setIsFormOpen(true);
  };

  const closeForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingSegment(null);
    }
  };

  const handleSave = async (values: SegmentFormValues) => {
    setIsSaving(true);

    try {
      if (editingSegment) {
        await updateSegment(editingSegment.id, values);
        toast.success('Segment updated.');
      } else {
        await createSegment(values);
        toast.success('Segment created.');
      }

      closeForm(false);
      await loadSegments();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (segment: Segment) => {
    const confirmed = window.confirm(`Delete "${segment.name}" segment?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(segment.id);

    try {
      await deleteSegment(segment.id);
      toast.success('Segment deleted.');
      await loadSegments();
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

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Segments</h2>
          <p className="text-sm text-zinc-400">
            Create reusable audience segments with flexible filter logic.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Segment
        </Button>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-100">
        <CardHeader className="space-y-4">
          <CardTitle className="text-base">Segment Filters</CardTitle>
          <SegmentsFilters
            search={search}
            tag={tagFilter}
            status={statusFilter}
            onSearchChange={setSearch}
            onTagChange={setTagFilter}
            onStatusChange={setStatusFilter}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <SegmentsTable
            segments={visibleSegments}
            isLoading={isLoading}
            deletingId={deletingId}
            onEdit={openEdit}
            onDelete={handleDelete}
          />

          <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              Page {pagination.page} of {pagination.totalPages} | {pagination.total} total segments
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

      <SegmentFormDialog
        open={isFormOpen}
        onOpenChange={closeForm}
        segment={editingSegment}
        isSubmitting={isSaving}
        onSubmit={handleSave}
      />
    </section>
  );
}

