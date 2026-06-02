'use client';

import { History, X, FileSpreadsheet, CheckCircle2, SkipForward, XCircle, Tag } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getImportHistory } from '@/lib/api/contacts';
import type { ImportHistoryItem } from '@/lib/api/contacts';

interface ImportHistoryDialogProps {
  open: boolean;
  onClose: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function StatPill({
  count,
  label,
  color,
}: {
  count: number;
  label: string;
  color: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${color}`}>
      <span className="tabular-nums">{count.toLocaleString()}</span>
      <span className="opacity-80">{label}</span>
    </span>
  );
}

export function ImportHistoryDialog({ open, onClose }: ImportHistoryDialogProps) {
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await getImportHistory();
      setHistory(items);
    } catch {
      toast.error('Failed to load import history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadHistory();
    }
  }, [open, loadHistory]);

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Panel */}
      <div className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 border border-violet-100">
              <History className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-900 tracking-tight">Import History</h2>
              <p className="text-xs font-medium text-zinc-500 mt-0.5">
                All your past CSV imports — each import name is saved as a contact label for easy campaign targeting.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700"
            aria-label="Close history"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tip banner */}
        <div className="flex items-start gap-3 border-b border-zinc-100 bg-violet-50/50 px-6 py-3">
          <Tag className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-600" />
          <p className="text-xs font-medium text-zinc-600 leading-relaxed">
            Each import name is automatically saved as a <strong className="text-zinc-900 font-bold">label</strong> on all imported
            contacts. When creating a Campaign, create a{' '}
            <strong className="text-zinc-900 font-bold">Dynamic Segment</strong> filtered by that label to target only those contacts.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3 text-zinc-400">
                <FileSpreadsheet className="h-8 w-8 animate-pulse text-zinc-300" />
                <p className="text-sm font-medium">Loading history…</p>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 border border-zinc-100">
                <History className="h-8 w-8 text-zinc-400" />
              </div>
              <div className="text-center">
                <p className="text-base font-black text-zinc-700">No imports yet</p>
                <p className="mt-1 text-sm font-medium text-zinc-400">
                  Your import history will appear here after your first CSV upload.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {history.map((item) => {
                const successRate =
                  item.total > 0 ? Math.round((item.created / item.total) * 100) : 0;

                return (
                  <div
                    key={item.id}
                    className="group flex flex-col gap-3 px-6 py-4 transition hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* Left: name + file + date */}
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="truncate text-sm font-black text-zinc-800 group-hover:text-zinc-950">
                          {item.importName}
                        </span>
                        {item.category && (
                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium flex-wrap">
                        <FileSpreadsheet className="h-3.5 w-3.5 flex-shrink-0 text-zinc-400" />
                        <span className="truncate">{item.fileName}</span>
                        <span className="h-1 w-1 rounded-full bg-zinc-200" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>

                    {/* Right: stat pills + success bar */}
                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      <div className="flex flex-wrap gap-1.5">
                        <StatPill
                          count={item.total}
                          label="total"
                          color="text-zinc-600 bg-zinc-50 border border-zinc-200"
                        />
                        <StatPill
                          count={item.created}
                          label="imported"
                          color="text-emerald-700 bg-emerald-50 border border-emerald-200"
                        />
                        {item.skipped > 0 && (
                          <StatPill
                            count={item.skipped}
                            label="skipped"
                            color="text-amber-700 bg-amber-50 border border-amber-200"
                          />
                        )}
                        {item.invalid > 0 && (
                          <StatPill
                            count={item.invalid}
                            label="rejected"
                            color="text-rose-700 bg-rose-50 border border-rose-200"
                          />
                        )}
                      </div>

                      {/* Mini success bar */}
                      <div className="flex w-48 items-center gap-2">
                        <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${successRate}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold tabular-nums text-zinc-400">
                          {successRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-6 py-4">
          <span className="text-xs font-semibold text-zinc-500">
            {history.length > 0 ? `${history.length} import${history.length === 1 ? '' : 's'} found` : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-6 py-2 text-sm font-black text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
