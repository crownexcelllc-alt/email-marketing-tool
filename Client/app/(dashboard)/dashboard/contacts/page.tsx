'use client';

import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ContactFormDialog } from '@/components/contacts/contact-form-dialog';
import { ContactsFilters } from '@/components/contacts/contacts-filters';
import { ContactsTable } from '@/components/contacts/contacts-table';
import { CsvImportCard } from '@/components/contacts/csv-import-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HttpClientError } from '@/lib/api/errors';
import {
  bulkAddTagToContacts,
  bulkDeleteContacts,
  createContact,
  deleteContact,
  getContacts,
  importContacts,
  updateContact,
} from '@/lib/api/contacts';
import type { Contact, ContactsPagination } from '@/lib/types/contact';
import type { ContactFormValues } from '@/lib/validators/contact';

const DEFAULT_PAGINATION: ContactsPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pagination, setPagination] = useState<ContactsPagination>(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tagsFilter, setTagsFilter] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkTagInput, setBulkTagInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, statusFilter, tagsFilter]);

  const loadContacts = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getContacts({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        tags: parseTags(tagsFilter),
      });

      setContacts(response.items);
      setPagination(response.pagination);
      setSelectedIds([]);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagination.limit, pagination.page, statusFilter, tagsFilter]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const openCreate = () => {
    setEditingContact(null);
    setIsFormOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const closeForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingContact(null);
    }
  };

  const handleSave = async (values: ContactFormValues) => {
    setIsSaving(true);

    try {
      if (editingContact) {
        await updateContact(editingContact.id, values);
        toast.success('Contact updated.');
      } else {
        await createContact(values);
        toast.success('Contact created.');
      }

      closeForm(false);
      await loadContacts();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (contact: Contact) => {
    const confirmed = window.confirm(`Delete "${contact.fullName || contact.email || contact.phone || 'contact'}"?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(contact.id);

    try {
      await deleteContact(contact.id);
      toast.success('Contact deleted.');
      await loadContacts();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);

    try {
      const result = await importContacts(file);
      toast.success(
        `${result.message ?? 'Import complete.'} Created: ${result.created}, Skipped: ${result.skipped}, Invalid: ${result.invalid}`,
      );
      await loadContacts();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsImporting(false);
    }
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(contacts.map((contact) => contact.id));
  };

  const handleToggleSelect = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, contactId])));
      return;
    }

    setSelectedIds((prev) => prev.filter((id) => id !== contactId));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedIds.length} selected contacts?`);
    if (!confirmed) {
      return;
    }

    setIsBulkLoading(true);

    try {
      const result = await bulkDeleteContacts(selectedIds);
      toast.success(`Deleted ${result.deleted} of ${result.requested} selected contacts.`);
      await loadContacts();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkAddTag = async () => {
    const newTag = bulkTagInput.trim();
    if (!newTag || selectedIds.length === 0) {
      return;
    }

    setIsBulkLoading(true);

    try {
      const result = await bulkAddTagToContacts(selectedIds, newTag);
      toast.success(`Tag "${newTag}" added to ${result.modified} of ${result.requested} contacts.`);
      setBulkTagInput('');
      await loadContacts();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsBulkLoading(false);
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
          <h2 className="text-xl font-semibold text-zinc-100">Contacts</h2>
          <p className="text-sm text-zinc-400">
            Manage your audience list with filters, bulk actions, and imports.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <CsvImportCard isImporting={isImporting} onImport={handleImport} />

      <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-100">
        <CardHeader className="space-y-4">
          <CardTitle className="text-base">Filters</CardTitle>
          <ContactsFilters
            search={search}
            status={statusFilter}
            tags={tagsFilter}
            onSearchChange={setSearch}
            onStatusChange={setStatusFilter}
            onTagsChange={setTagsFilter}
          />

          <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-400">
              {selectedIds.length} selected
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                className="h-9 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                placeholder="Tag to add"
                value={bulkTagInput}
                onChange={(event) => setBulkTagInput(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                onClick={() => void handleBulkAddTag()}
                disabled={selectedIds.length === 0 || !bulkTagInput.trim() || isBulkLoading}
              >
                {isBulkLoading ? 'Applying...' : 'Add Tag to Selected'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleBulkDelete()}
                disabled={selectedIds.length === 0 || isBulkLoading}
              >
                {isBulkLoading ? 'Processing...' : 'Delete Selected'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ContactsTable
            contacts={contacts}
            isLoading={isLoading}
            selectedIds={selectedIds}
            deletingId={deletingId}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelect={handleToggleSelect}
            onEdit={openEdit}
            onDelete={handleDelete}
          />

          <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              Page {pagination.page} of {pagination.totalPages} | {pagination.total} total contacts
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

      <ContactFormDialog
        open={isFormOpen}
        onOpenChange={closeForm}
        contact={editingContact}
        onSubmit={handleSave}
        isSubmitting={isSaving}
      />
    </section>
  );
}
