'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  MousePointerClick,
  EyeOff,
  Users,
  Download,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { getCampaignRecipientDetails, downloadCampaignRecipientsCsv } from '@/lib/api/campaigns';
import type { Campaign, CampaignRecipientDetail, CampaignRecipientDetailsResult } from '@/lib/types/campaign';
import { toast } from 'sonner';

interface CampaignHistoryDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
}

const DAILY_LIMIT_PATTERN = /daily sending limit|daily user sending limit exceeded/i;

export function CampaignHistoryDetailsPanel({
  open,
  onOpenChange,
  campaign,
}: CampaignHistoryDetailsPanelProps) {
  const [data, setData] = useState<CampaignRecipientDetailsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadCsv = async (type: 'sent' | 'remaining_failed') => {
    if (!campaign?.id) return;
    setIsDownloading(true);
    try {
      const blob = await downloadCampaignRecipientsCsv(campaign.id, type);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanName = campaign.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.setAttribute('download', `${cleanName}_recipients_${type}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded successfully.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download CSV file.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const loadDetails = useCallback(async () => {
    if (!campaign?.id || !open) return;
    setIsLoading(true);
    try {
      const response = await getCampaignRecipientDetails(campaign.id, {
        page,
        limit: 10,
        filter,
        search: debouncedSearch.trim() || undefined,
      });
      setData(response);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load history details');
    } finally {
      setIsLoading(false);
    }
  }, [campaign?.id, open, page, filter, debouncedSearch]);

  useEffect(() => {
    if (open) {
      loadDetails();
    } else {
      setData(null);
      setFilter('all');
      setPage(1);
      setSearch('');
      setDebouncedSearch('');
    }
  }, [open, loadDetails]);

  // Reset page when filter changes
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return '-';
    }
  };

  const renderStatusBadge = (item: CampaignRecipientDetail) => {
    if (item.clickedAt) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 animate-fade-in">
          <MousePointerClick className="h-3.5 w-3.5" /> Clicks
        </span>
      );
    }
    if (item.openedAt) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 animate-fade-in">
          <Eye className="h-3.5 w-3.5" /> Opens
        </span>
      );
    }
    if (item.status === 'sent') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-500/10 px-2 py-1 text-xs font-medium text-zinc-400 animate-fade-in">
          <CheckCircle2 className="h-3.5 w-3.5" /> Sent
        </span>
      );
    }
    if (item.status === 'failed') {
      const reason = item.failureReason || '';
      const isLimit = DAILY_LIMIT_PATTERN.test(reason);
      const isActiveQueueState =
        campaign?.status === 'running' ||
        campaign?.status === 'scheduled' ||
        campaign?.status === 'paused';
      if (isLimit) {
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium animate-fade-in ${
              isActiveQueueState
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {isActiveQueueState ? (
              <>
                <Clock className="h-3.5 w-3.5" /> Remaining
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" /> Failed (Limit)
              </>
            )}
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 animate-fade-in">
          <XCircle className="h-3.5 w-3.5" /> Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400 animate-fade-in">
        <Clock className="h-3.5 w-3.5" /> Remaining
      </span>
    );
  };

  const renderActivityTime = (item: CampaignRecipientDetail) => {
    if (item.clickedAt) {
      return (
        <div className="text-xs text-zinc-350">
          <div className="font-semibold text-emerald-400">Clicked at:</div>
          <div>{formatDateTime(item.clickedAt)}</div>
        </div>
      );
    }
    if (item.openedAt) {
      return (
        <div className="text-xs text-zinc-350">
          <div className="font-semibold text-blue-400">Opened at:</div>
          <div>{formatDateTime(item.openedAt)}</div>
        </div>
      );
    }
    if (item.sentAt) {
      return (
        <div className="text-xs text-zinc-350">
          <div className="font-semibold text-zinc-400">Sent at:</div>
          <div>{formatDateTime(item.sentAt)}</div>
        </div>
      );
    }
    return <span className="text-zinc-500 text-xs">-</span>;
  };

  const summary = data?.summary || {
    sent: 0,
    pending: 0,
    opened: 0,
    clicked: 0,
    notOpened: 0,
  };

  const items = data?.items || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  const status = (campaign?.status ?? '').toLowerCase();
  const stopReason = (campaign?.stopReason ?? '').toLowerCase();
  const isLimitStopReason =
    stopReason.includes('daily sending limit reached') || stopReason.includes('system limit reached');
  const rawPending = summary.pending;
  const queuedPending = campaign?.stats?.queuedRecipients ?? rawPending;
  const effectivePending = status === 'completed' ? Math.max(queuedPending, 0) : Math.max(rawPending, 0);
  const recipientTotal = campaign?.stats?.totalRecipients ?? summary.sent + effectivePending;
  const failedRecipients = campaign?.stats?.failedRecipients ?? 0;
  const showLimitAlert =
    (status === 'paused' || status === 'running' || status === 'scheduled') &&
    (Boolean(campaign?.limitFailedAt) || isLimitStopReason) &&
    effectivePending > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-none md:max-w-3xl lg:max-w-4xl border-zinc-800 bg-zinc-950 text-zinc-100 p-6 overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-bold tracking-tight">
            History Details - <span className="text-blue-400">{campaign?.name}</span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Detailed information about the campaign's recipients, delivery, and interaction metrics.
          </SheetDescription>
        </SheetHeader>

        {/* Daily Sending Limit Info Alert */}
        {showLimitAlert && (
          <div className="mb-5 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-200/90 flex items-start gap-3 shadow-md animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-300">Google Workspace Sending Limit Reached</div>
              <div>
                A single Google Workspace account can only send around 2,000 emails per day. 
                There are <span className="font-semibold text-white">{effectivePending}</span> remaining emails in queue. 
                They are displayed under the <strong className="text-amber-300">Remaining</strong> section below. 
                Sending will resume automatically after the daily limit resets.
              </div>
            </div>
          </div>
        )}

        {/* Campaign Timeline Section */}
        {campaign &&
          (campaign.startedAt ||
            campaign.completedAt ||
            campaign.stoppedAt ||
            campaign.limitFailedAt ||
            campaign.limitResumeAt ||
            campaign.resentAt) && (
          <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
            <h3 className="text-xs font-semibold text-zinc-300 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="h-4 w-4 text-blue-400" />
              Campaign Timeline
            </h3>
            <div className="relative flex flex-col md:flex-row justify-between gap-4 md:gap-2">
              {/* Event 1: Started */}
              {campaign.startedAt && (
                <div className="flex-1 flex gap-2.5 items-start">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-450 flex items-center justify-center text-blue-400 text-[10px] font-bold">
                      S
                    </div>
                    <div className="w-0.5 h-full min-h-[16px] bg-zinc-800 md:hidden" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-zinc-200">Campaign Start Time</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{formatDateTime(campaign.startedAt || null)}</div>
                  </div>
                </div>
              )}

              {/* Event 2: Limit Reached / Stopped */}
              {campaign.limitFailedAt && (
                <div className="flex-1 flex gap-2.5 items-start">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-450 flex items-center justify-center text-amber-400 text-[10px] font-bold">
                      L
                    </div>
                    <div className="w-0.5 h-full min-h-[16px] bg-zinc-800 md:hidden" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-amber-300">
                      {status === 'paused' ? 'Daily Limit Reached (Paused)' : 'Daily Limit Reached'}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{formatDateTime(campaign.limitFailedAt)}</div>
                    <div className="text-[9px] text-amber-400/80 italic mt-0.5">Google Workspace daily limit reached</div>
                  </div>
                </div>
              )}

              {/* Event 3: Stopped / Paused (if not limit reached) */}
              {campaign.stoppedAt && !campaign.limitFailedAt && (
                <div className="flex-1 flex gap-2.5 items-start">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-450 flex items-center justify-center text-red-400 text-[10px] font-bold">
                      P
                    </div>
                    <div className="w-0.5 h-full min-h-[16px] bg-zinc-800 md:hidden" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-red-300">Stopped / Paused</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{formatDateTime(campaign.stoppedAt)}</div>
                    <div className="text-[9px] text-red-450/85 italic mt-0.5">
                      {campaign.stopReason === 'manually stopped' ? 'Manually stopped' : campaign.stopReason || 'Manually paused'}
                    </div>
                  </div>
                </div>
              )}

              {/* Event 4: Pending / Remaining */}
              {effectivePending > 0 && (
                <div className="flex-1 flex gap-2.5 items-start">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-5 h-5 rounded-full bg-zinc-600/20 border border-zinc-500 flex items-center justify-center text-zinc-400 text-[10px] font-bold">
                      R
                    </div>
                    <div className="w-0.5 h-full min-h-[16px] bg-zinc-800 md:hidden" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-zinc-200">
                      {status === 'completed' ? 'Unsent Emails' : 'Remaining Emails'}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {status === 'completed' ? 'Failed' : 'Pending'} ({effectivePending.toLocaleString()})
                    </div>
                  </div>
                </div>
              )}
              {status === 'completed' && failedRecipients > 0 && effectivePending === 0 && (
                <div className="flex-1 flex gap-2.5 items-start">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-450 flex items-center justify-center text-red-400 text-[10px] font-bold">
                      F
                    </div>
                    <div className="w-0.5 h-full min-h-[16px] bg-zinc-800 md:hidden" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-red-300">Failed Deliveries</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{failedRecipients.toLocaleString()} recipient(s)</div>
                  </div>
                </div>
              )}
              {campaign.limitResumeAt && status === 'paused' && (
                <div className="flex-1 flex gap-2.5 items-start">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-indigo-400 text-[10px] font-bold">
                      A
                    </div>
                    <div className="w-0.5 h-full min-h-[16px] bg-zinc-800 md:hidden" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-indigo-300">Auto Resume Scheduled</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{formatDateTime(campaign.limitResumeAt)}</div>
                  </div>
                </div>
              )}
              {/* Event: Resent */}
              {campaign.resentAt && (
                <div className="flex-1 flex gap-2.5 items-start">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-indigo-400 text-[10px] font-bold">
                      R
                    </div>
                    <div className="w-0.5 h-full min-h-[16px] bg-zinc-800 md:hidden" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-indigo-300">Remaining Resent</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{formatDateTime(campaign.resentAt)}</div>
                  </div>
                </div>
              )}

              {/* Event 5: Completed */}
              {campaign.completedAt && (
                <div className="flex-1 flex gap-2.5 items-start">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-450 flex items-center justify-center text-emerald-450 text-[10px] font-bold">
                      C
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-emerald-300">Completed Time</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{formatDateTime(campaign.completedAt)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <button
            onClick={() => handleFilterChange('all')}
            className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${
              filter === 'all'
                ? 'border-blue-500 bg-zinc-100 text-zinc-100 shadow-lg shadow-blue-950/10'
                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className={`h-5 w-5 mb-2 ${filter === 'all' ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className="text-xs font-medium uppercase tracking-wider">Recipients</span>
            <span className={`text-2xl font-extrabold mt-1 ${filter === 'all' ? 'text-blue-400' : 'text-zinc-100'}`}>
              {recipientTotal}
            </span>
          </button>

          <button
            onClick={() => handleFilterChange('sent')}
            className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${
              filter === 'sent'
                ? 'border-blue-500 bg-zinc-100 text-zinc-100 shadow-lg shadow-blue-950/10'
                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className={`h-5 w-5 mb-2 ${filter === 'sent' ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className="text-xs font-medium uppercase tracking-wider">Sent</span>
            <span className={`text-2xl font-extrabold mt-1 ${filter === 'sent' ? 'text-blue-400' : 'text-zinc-100'}`}>
              {summary.sent}
            </span>
          </button>

          <button
            onClick={() => handleFilterChange('pending')}
            className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${
              filter === 'pending'
                ? 'border-blue-500 bg-zinc-100 text-zinc-100 shadow-lg shadow-blue-950/10'
                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className={`h-5 w-5 mb-2 ${filter === 'pending' ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className="text-xs font-medium uppercase tracking-wider">Remaining</span>
            <span className={`text-2xl font-extrabold mt-1 ${filter === 'pending' ? 'text-blue-400' : 'text-zinc-100'}`}>
              {effectivePending}
            </span>
          </button>

          <button
            onClick={() => handleFilterChange('opened')}
            className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${
              filter === 'opened'
                ? 'border-blue-500 bg-zinc-100 text-zinc-100 shadow-lg shadow-blue-950/10'
                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className={`h-5 w-5 mb-2 ${filter === 'opened' ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className="text-xs font-medium uppercase tracking-wider">Opens</span>
            <span className={`text-2xl font-extrabold mt-1 ${filter === 'opened' ? 'text-blue-400' : 'text-zinc-100'}`}>
              {summary.opened}
            </span>
          </button>

          <button
            onClick={() => handleFilterChange('clicked')}
            className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${
              filter === 'clicked'
                ? 'border-blue-500 bg-zinc-100 text-zinc-100 shadow-lg shadow-blue-950/10'
                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MousePointerClick className={`h-5 w-5 mb-2 ${filter === 'clicked' ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className="text-xs font-medium uppercase tracking-wider">Clicks</span>
            <span className={`text-2xl font-extrabold mt-1 ${filter === 'clicked' ? 'text-blue-400' : 'text-zinc-100'}`}>
              {summary.clicked}
            </span>
          </button>

          <button
            onClick={() => handleFilterChange('notOpened')}
            className={`flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${
              filter === 'notOpened'
                ? 'border-blue-500 bg-zinc-100 text-zinc-100 shadow-lg shadow-blue-950/10'
                : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <EyeOff className={`h-5 w-5 mb-2 ${filter === 'notOpened' ? 'text-blue-400' : 'text-zinc-500'}`} />
            <span className="text-xs font-medium uppercase tracking-wider">Not Opened</span>
            <span className={`text-2xl font-extrabold mt-1 ${filter === 'notOpened' ? 'text-blue-400' : 'text-zinc-100'}`}>
              {summary.notOpened}
            </span>
          </button>
        </div>


        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 max-w-2xl">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus-visible:ring-blue-500"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              disabled={isDownloading}
              onClick={() => handleDownloadCsv('sent')}
              className="border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-350 text-xs gap-1.5 h-9"
            >
              <Download className="h-3.5 w-3.5" />
              Sent CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isDownloading}
              onClick={() => handleDownloadCsv('remaining_failed')}
              className="border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-350 text-xs gap-1.5 h-9"
            >
              <Download className="h-3.5 w-3.5" />
              Remaining/Failed CSV
            </Button>
          </div>
          <div className="text-xs text-zinc-400">
            Showing contacts for status: <span className="font-semibold text-zinc-200">{filter === 'all' ? 'Recipients' : filter === 'sent' ? 'Sent' : filter === 'pending' ? 'Remaining' : filter === 'opened' ? 'Opens' : filter === 'clicked' ? 'Clicks' : filter === 'notOpened' ? 'Not Opened' : filter}</span>
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-x-auto min-h-[300px] relative">
          {isLoading && (
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[2px] flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="text-sm text-zinc-400">Loading contacts...</span>
              </div>
            </div>
          )}

          <Table>
            <TableHeader className="bg-zinc-100 border-b border-zinc-800">
              <TableRow className="bg-zinc-100 hover:bg-zinc-100">
                <TableHead className="w-1/3 text-zinc-700 font-semibold">Name</TableHead>
                <TableHead className="w-1/3 text-zinc-700 font-semibold">Email</TableHead>
                <TableHead className="w-1/6 text-zinc-700 font-semibold">Status</TableHead>
                <TableHead className="w-1/6 text-zinc-700 font-semibold">Activity Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="h-48 text-center text-zinc-500">
                    No contacts found in this list.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="border-b border-zinc-850 hover:bg-transparent transition-colors">
                    <TableCell className="font-medium text-zinc-200">{item.name || '-'}</TableCell>
                    <TableCell className="text-zinc-450">{item.email}</TableCell>
                    <TableCell>{renderStatusBadge(item)}</TableCell>
                    <TableCell>{renderActivityTime(item)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Section */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800 text-xs text-zinc-400">
          <div>
            Page {pagination.page} of {pagination.totalPages} | {pagination.total} total contacts
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevious || isLoading}
              className="border-zinc-850 bg-zinc-900 hover:bg-zinc-850 text-zinc-350 disabled:opacity-50"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNext || isLoading}
              className="border-zinc-850 bg-zinc-900 hover:bg-zinc-850 text-zinc-350 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
