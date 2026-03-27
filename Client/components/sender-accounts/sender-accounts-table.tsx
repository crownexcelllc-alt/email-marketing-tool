import { Edit3, PlugZap, Trash2 } from 'lucide-react';
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
import { SenderAccountStatusBadge } from '@/components/sender-accounts/sender-account-status-badge';
import type { SenderAccount } from '@/lib/types/sender-account';

interface SenderAccountsTableProps {
  accounts: SenderAccount[];
  isLoading?: boolean;
  testingId?: string | null;
  deletingId?: string | null;
  onEdit: (account: SenderAccount) => void;
  onDelete: (account: SenderAccount) => void;
  onTest: (account: SenderAccount) => void;
}

function formatLastTestedAt(value?: string | null): string {
  if (!value) {
    return 'Never';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function IdentifierCell({ account }: { account: SenderAccount }) {
  if (account.type === 'email') {
    return (
      <div className="space-y-1">
        <p className="font-medium text-zinc-100">{account.email || '-'}</p>
        <p className="text-xs text-zinc-500">{account.smtpHost || 'No SMTP host'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="font-medium text-zinc-100">{account.phoneNumber || '-'}</p>
      <p className="text-xs text-zinc-500">{account.phoneNumberId || 'No phone number ID'}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, idx) => (
        <TableRow key={idx}>
          <TableCell>
            <Skeleton className="h-4 w-36" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-44" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-36" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function SenderAccountsTable({
  accounts,
  isLoading = false,
  testingId,
  deletingId,
  onEdit,
  onDelete,
  onTest,
}: SenderAccountsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Identifier</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Health</TableHead>
          <TableHead>Last Tested</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <LoadingRows />
        ) : accounts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="py-12 text-center text-zinc-500">
              No sender accounts found.
            </TableCell>
          </TableRow>
        ) : (
          accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-zinc-100">{account.name}</p>
                </div>
              </TableCell>
              <TableCell>
                <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs uppercase tracking-wide text-zinc-300">
                  {account.type}
                </span>
              </TableCell>
              <TableCell>
                <IdentifierCell account={account} />
              </TableCell>
              <TableCell>
                <SenderAccountStatusBadge value={account.status} />
              </TableCell>
              <TableCell>
                <SenderAccountStatusBadge value={account.healthStatus} />
              </TableCell>
              <TableCell className="text-sm text-zinc-400">
                {formatLastTestedAt(account.lastTestedAt)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                    onClick={() => onTest(account)}
                    disabled={testingId === account.id}
                  >
                    <PlugZap className="mr-1 h-3.5 w-3.5" />
                    {testingId === account.id ? 'Testing...' : 'Test'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                    onClick={() => onEdit(account)}
                  >
                    <Edit3 className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(account)}
                    disabled={deletingId === account.id}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    {deletingId === account.id ? 'Deleting...' : 'Delete'}
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

