import { Edit3, Trash2 } from 'lucide-react';
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
import { SubscriptionStatusBadge } from '@/components/contacts/subscription-status-badge';
import type { Contact } from '@/lib/types/contact';

interface ContactsTableProps {
  contacts: Contact[];
  isLoading?: boolean;
  selectedIds: string[];
  deletingId?: string | null;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelect: (contactId: string, checked: boolean) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, idx) => (
        <TableRow key={idx}>
          <TableCell>
            <Skeleton className="h-4 w-4 rounded-sm" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-36" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-44" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-24" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function getDisplayName(contact: Contact): string {
  if (contact.fullName && contact.fullName.trim().length > 0) {
    return contact.fullName;
  }

  const fromParts = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
  if (fromParts.length > 0) {
    return fromParts;
  }

  return 'Unnamed Contact';
}

export function ContactsTable({
  contacts,
  isLoading = false,
  selectedIds,
  deletingId,
  onToggleSelectAll,
  onToggleSelect,
  onEdit,
  onDelete,
}: ContactsTableProps) {
  const isAllSelected = contacts.length > 0 && selectedIds.length === contacts.length;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
              checked={isAllSelected}
              onChange={(event) => onToggleSelectAll(event.target.checked)}
            />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <LoadingRows />
        ) : contacts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="py-14 text-center">
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-200">No contacts found</p>
                <p className="text-xs text-zinc-500">
                  Try adjusting filters or add a new contact.
                </p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
                  checked={selectedIds.includes(contact.id)}
                  onChange={(event) => onToggleSelect(contact.id, event.target.checked)}
                />
              </TableCell>
              <TableCell>
                <p className="font-medium text-zinc-100">{getDisplayName(contact)}</p>
              </TableCell>
              <TableCell className="text-zinc-300">{contact.email ?? '-'}</TableCell>
              <TableCell className="text-zinc-300">{contact.phone ?? '-'}</TableCell>
              <TableCell className="text-zinc-300">{contact.company ?? '-'}</TableCell>
              <TableCell>
                <SubscriptionStatusBadge value={contact.subscriptionStatus} />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {contact.tags.length === 0 ? (
                    <span className="text-xs text-zinc-500">No tags</span>
                  ) : (
                    contact.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[11px] text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                    onClick={() => onEdit(contact)}
                  >
                    <Edit3 className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(contact)}
                    disabled={deletingId === contact.id}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    {deletingId === contact.id ? 'Deleting...' : 'Delete'}
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

