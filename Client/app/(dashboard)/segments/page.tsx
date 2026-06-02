'use client';

import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  HelpCircle,
  Mail,
  MessageSquare,
  MousePointerClick,
  Pencil,
  Play,
  RefreshCw,
  RotateCw,
  Send,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Tag,
  Users,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CampaignEditRerunDialog } from '@/components/campaigns/campaign-edit-rerun-dialog';
import { CampaignHistoryDetailsPanel } from '@/components/campaigns/campaign-history-details-dialog';
import { SendingLimitInfoDialog } from '@/components/campaigns/sending-limit-info-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCampaigns, duplicateCampaign, pauseCampaign, resumeCampaign, resendRemainingCampaign } from '@/lib/api/campaigns';
import { getTemplates } from '@/lib/api/templates';
import { HttpClientError } from '@/lib/api/errors';
import { getWorkspaceSettings } from '@/lib/api/settings';
import type { WorkspaceSettings } from '@/lib/types/settings';
import type { Campaign } from '@/lib/types/campaign';
import type { MarketingTemplate } from '@/lib/types/template';

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpClientError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    running: {
      icon: <Play className="h-3 w-3" />,
      label: 'Running',
      cls: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    scheduled: {
      icon: <Clock className="h-3 w-3" />,
      label: 'Scheduled',
      cls: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    completed: {
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: 'Completed',
      cls: 'bg-green-100 text-green-700 border-green-200',
    },
    cancelled: {
      icon: <XCircle className="h-3 w-3" />,
      label: 'Cancelled',
      cls: 'bg-red-100 text-red-700 border-red-200',
    },
    paused: {
      icon: <Circle className="h-3 w-3" />,
      label: 'Paused',
      cls: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    },
    partially_sent: {
      icon: <Clock className="h-3 w-3" />,
      label: 'Partially Sent',
      cls: 'bg-amber-100 text-amber-700 border-amber-200',
    },
  };
  const s = map[status ?? ''] ?? {
    icon: <Circle className="h-3 w-3" />,
    label: status ?? 'Draft',
    cls: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${s.cls}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

// ─── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 min-w-[60px]">
      <div className="text-zinc-400">{icon}</div>
      <p className="text-base font-bold text-zinc-800">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-zinc-400">{label}</p>
    </div>
  );
}

// ─── Campaign card ─────────────────────────────────────────────────────────────
interface CampaignCardProps {
  campaign: Campaign;
  templateMap: Map<string, MarketingTemplate>;
  onEdit: (campaign: Campaign) => void;
  onDuplicate: (campaign: Campaign) => void;
  isDuplicating: boolean;
  onSuccess: () => void;
  onShowHistoryDetails: (campaign: Campaign) => void;
}

function CampaignCard({
  campaign,
  templateMap,
  onEdit,
  onDuplicate,
  isDuplicating,
  onSuccess,
  onShowHistoryDetails,
}: CampaignCardProps) {
  const template = campaign.templateId ? templateMap.get(campaign.templateId) : undefined;
  const stats = campaign.stats ?? {};
  const [actionLoading, setActionLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleResendRemaining = async () => {
    setResendLoading(true);
    try {
      await resendRemainingCampaign(campaign.id);
      toast.success('Resending remaining contacts started successfully.');
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResendLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await pauseCampaign(campaign.id);
      toast.success('Campaign sending stopped successfully.');
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await resumeCampaign(campaign.id);
      toast.success('Campaign sending resumed successfully.');
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Audience summary
  function renderAudience() {
    if (campaign.segmentId) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Users className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <span>Segment-based audience</span>
        </div>
      );
    }
    if (campaign.contactIds.length > 0) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Users className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <span>
            <strong className="text-zinc-700">{campaign.contactIds.length}</strong> direct
            contact{campaign.contactIds.length !== 1 ? 's' : ''}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Users className="h-3.5 w-3.5 shrink-0" />
        <span>No audience recorded</span>
      </div>
    );
  }

  const total = stats.totalRecipients || campaign.contactIds.length || 0;
  const sent = stats.sentRecipients ?? 0;
  const failed = stats.failedRecipients ?? 0;
  const skipped = stats.skippedRecipients ?? 0;
  const limitFailed = stats.limitFailedRecipients ?? 0;
  const permanentFailed = Math.max(0, failed - limitFailed);
  const processed = sent + permanentFailed + skipped;
  const remaining = stats.queuedRecipients ?? Math.max(0, total - (sent + failed + skipped));

  const isCompleted = campaign.status === 'completed' && remaining === 0 && permanentFailed === 0;
  const completedWithFailures = campaign.status === 'completed' && permanentFailed > 0 && remaining === 0;
  const isPartiallySent = campaign.status === 'completed' && (limitFailed > 0 || remaining > 0);
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
  const showHistory = campaign.status === 'completed' && remaining === 0;

  const limitFailedTime = campaign.limitFailedAt || campaign.completedAt || campaign.updatedAt || null;
  const limitResumeTime = campaign.limitResumeAt || (limitFailedTime ? new Date(new Date(limitFailedTime).getTime() + 24 * 60 * 60 * 1000).toISOString() : null);

  // Progress Bar Helper
  const renderProgress = () => {
    if (campaign.status === 'draft') {
      return null;
    }

    const showStop = campaign.status === 'running' || campaign.status === 'scheduled';
    const showResume = campaign.status === 'paused';
    const showStartAgain = campaign.status === 'cancelled';
    const showResendRemaining = isPartiallySent;

    let progressTitle = 'Campaign Progress';
    let titleClass = 'text-zinc-700';
    let badgeClass = 'text-emerald-700 bg-emerald-50';

    if (isCompleted) {
      progressTitle = 'Campaign Completed Successfully';
      titleClass = 'text-emerald-700';
      badgeClass = 'text-emerald-700 bg-emerald-100';
    } else if (completedWithFailures) {
      progressTitle = 'Campaign Completed (with failures)';
      titleClass = 'text-red-700';
      badgeClass = 'text-red-700 bg-red-100';
    } else if (isPartiallySent) {
      progressTitle = 'Partially Sent (Daily Limit Reached)';
      titleClass = 'text-amber-700';
      badgeClass = 'text-amber-700 bg-amber-100';
    }

    return (
      <div className="mt-4 rounded-lg border border-zinc-150 bg-zinc-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${titleClass}`}>
              {progressTitle}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeClass}`}>
              {percent}% Complete
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isCompleted
                  ? 'bg-emerald-600'
                  : completedWithFailures
                  ? 'bg-red-600'
                  : isPartiallySent
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {(showStop || showResume || showStartAgain || showResendRemaining) && (
          <div className="shrink-0 flex items-center justify-end sm:border-l sm:border-zinc-200 sm:pl-4 gap-2">
            {showStop && (
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-all"
                onClick={handlePause}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Stop
              </Button>
            )}
            {showResume && (
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
                onClick={handleResume}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Resume
              </Button>
            )}
            {showStartAgain && (
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
                onClick={() => onDuplicate(campaign)}
                disabled={isDuplicating || actionLoading}
              >
                {isDuplicating ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCw className="h-3.5 w-3.5" />
                )}
                Start Again
              </Button>
            )}
            {showResendRemaining && (
              <Button
                size="sm"
                className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm transition-all"
                onClick={handleResendRemaining}
                disabled={resendLoading || actionLoading}
              >
                {resendLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCw className="h-3.5 w-3.5" />
                )}
                Resend Remaining
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50 px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: name + badges */}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-zinc-900">{campaign.name}</h3>
            <Badge variant={campaign.channel === 'email' ? 'neutral' : 'warning'}>
              {campaign.channel === 'email' ? (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> WhatsApp
                </span>
              )}
            </Badge>
            <StatusBadge status={isPartiallySent ? 'partially_sent' : campaign.status} />
            {campaign.copyNumber === 0 || !campaign.copyNumber ? (
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 font-medium">
                Original
              </Badge>
            ) : (
              <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-800 font-medium">
                Copy {campaign.copyNumber}
              </Badge>
            )}
            {campaign.editedAt ? (
              <Badge
                variant="outline"
                className="border-yellow-200 bg-yellow-100 text-yellow-800"
              >
                Edited
              </Badge>
            ) : null}
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2">
            {showHistory && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                onClick={() => onShowHistoryDetails(campaign)}
              >
                <BarChart2 className="h-3.5 w-3.5" />
                History Details
              </Button>
            )}
            {campaign.status === 'draft' ? (
              <Button
                size="sm"
                className="gap-1.5 bg-black text-white hover:bg-zinc-800"
                onClick={() => onEdit(campaign)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            ) : showHistory ? (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                onClick={() => onDuplicate(campaign)}
                disabled={isDuplicating || actionLoading}
              >
                <Copy className="h-3.5 w-3.5" />
                {isDuplicating ? 'Duplicating...' : 'Duplicate'}
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-4">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          {/* Details */}
          <div className="flex-1 space-y-3">
            {/* Audience */}
            {renderAudience()}

            {/* Template — always latest version */}
            {campaign.templateId ? (
              <div className="flex items-start gap-1.5 text-xs text-zinc-500">
                <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <div className="space-y-1">
                  <p className="line-clamp-1">
                    <span className="text-zinc-400">Template: </span>
                    <span className="font-medium text-zinc-700">{template?.name || campaign.templateName || 'Unnamed Template'}</span>
                  </p>
                  <p className="line-clamp-1">
                    <span className="text-zinc-400">Subject: </span>
                    <span className="font-medium text-zinc-700">{template?.subject || campaign.templateSubject || template?.name || campaign.templateName || 'Unnamed Template'}</span>
                  </p>
                  <p className="italic text-zinc-400">
                    (Always reflects the latest template version automatically)
                  </p>
                </div>
              </div>
            ) : null}

            {/* Senders */}
            {campaign.senderAccountIds.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Send className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <span>
                  <strong className="text-zinc-700">{campaign.senderAccountIds.length}</strong>{' '}
                  sender account{campaign.senderAccountIds.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Schedule info */}
            {campaign.startAt && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                Scheduled: {formatDate(campaign.startAt)}
                {campaign.timezone ? ` (${campaign.timezone})` : ''}
              </div>
            )}

            {/* Sending window */}
            {(campaign.sendingWindowStart || campaign.sendingWindowEnd) && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                Window: {campaign.sendingWindowStart ?? '-'} → {campaign.sendingWindowEnd ?? '-'}
              </div>
            )}

            {/* Timestamps */}
            <div className="flex flex-wrap gap-3 text-[11px] text-zinc-400">
              <span>Created: {formatDate(campaign.createdAt)}</span>
              {campaign.editedAt && campaign.updatedAt && (
                <span>Updated: {formatDate(campaign.updatedAt)}</span>
              )}
            </div>

            {/* Premium Sending Progress Bar */}
            {renderProgress()}
          </div>

          {/* Stats */}
          <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="flex flex-wrap gap-2 lg:flex-nowrap">
              <StatPill
                icon={<Users className="h-3.5 w-3.5" />}
                label="Recipients"
                value={total}
              />
              <StatPill
                icon={<Send className="h-3.5 w-3.5" />}
                label="Sent"
                value={sent}
              />
              <StatPill
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Remaining"
                value={remaining}
              />
              <StatPill
                icon={<BarChart2 className="h-3.5 w-3.5" />}
                label="Opens"
                value={stats.openCount ?? 0}
              />
              <StatPill
                icon={<MousePointerClick className="h-3.5 w-3.5" />}
                label="Clicks"
                value={stats.clickCount ?? 0}
              />
            </div>

            {isPartiallySent && (
              <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3.5 text-xs text-amber-800 max-w-[340px] space-y-1 text-left lg:text-right flex flex-col items-start lg:items-end">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Google Workspace Limit</span>
                </div>
                <p className="text-zinc-500 leading-normal">
                  Google accounts have a daily sending limit of 2,000 emails/day. Remaining emails are kept pending to avoid account suspension and can be resumed once the limit resets.
                </p>
                <div className="mt-3 w-full border-t border-amber-200/50 pt-2.5 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-zinc-500 font-medium">Start Time:</span>
                    <span className="font-semibold text-zinc-700">{formatDate(campaign.startedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-zinc-500 font-medium">Limit Reached:</span>
                    <span className="font-semibold text-zinc-700">{formatDate(limitFailedTime)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-zinc-500 font-medium">Resume Time:</span>
                    <span className="font-semibold text-amber-700">{formatDate(limitResumeTime)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Skeleton loader ────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-zinc-200">
          <CardHeader className="border-b border-zinc-100 bg-zinc-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardHeader>
          <CardContent className="px-5 py-4">
            <div className="flex justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((k) => (
                  <Skeleton key={k} className="h-16 w-14 rounded-lg" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function SegmentsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templateMap, setTemplateMap] = useState<Map<string, MarketingTemplate>>(new Map());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [historyCampaign, setHistoryCampaign] = useState<Campaign | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLimitInfoOpen, setIsLimitInfoOpen] = useState(false);
  const [showLimitDetails, setShowLimitDetails] = useState(false);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);

  const load = useCallback(async (pageNum: number, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [campaignsRes, templatesRes, settingsRes] = await Promise.allSettled([
        getCampaigns({ page: pageNum, limit: 10 }),
        getTemplates({ page: 1, limit: 100 }),
        getWorkspaceSettings(),
      ]);

      if (campaignsRes.status === 'fulfilled') {
        setCampaigns(campaignsRes.value.items);
        setTotalPages(campaignsRes.value.pagination.totalPages);
        setTotal(campaignsRes.value.pagination.total);
      } else {
        toast.error(getErrorMessage(campaignsRes.reason));
        setCampaigns([]);
      }

      if (templatesRes.status === 'fulfilled') {
        const map = new Map<string, MarketingTemplate>();
        for (const t of templatesRes.value.items) map.set(t.id, t);
        setTemplateMap(map);
      }

      if (settingsRes.status === 'fulfilled') {
        setSettings(settingsRes.value);
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  const handleDuplicate = async (campaign: Campaign) => {
    setDuplicatingId(campaign.id);
    try {
      const duplicated = await duplicateCampaign(campaign.id);
      toast.success(`Campaign duplicated successfully as "${duplicated.name}"!`);
      await load(page, true);
      setEditingCampaign(duplicated);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setDuplicatingId(null);
    }
  };

  useEffect(() => {
    void load(page, false);
  }, [load, page]);

  const activeCampaignIds = campaigns
    .filter((c) => c.status === 'running' || c.status === 'scheduled')
    .map((c) => c.id)
    .join(',');

  // Congestion-Free Intelligent Polling Hook: Schedule next poll 1s AFTER previous completes
  useEffect(() => {
    if (!activeCampaignIds) return;

    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const poll = async () => {
      try {
        const res = await getCampaigns({ page, limit: 10 });
        if (isMounted) {
          setCampaigns(res.items);
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
        }
      } catch (err) {
        console.error('Error polling running campaigns:', err);
      } finally {
        if (isMounted) {
          timeoutId = setTimeout(poll, 1000);
        }
      }
    };

    timeoutId = setTimeout(poll, 200);

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [activeCampaignIds, page]);

  return (
    <section className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Campaign Segments</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Full history of every campaign — contacts, template, audience, and delivery stats. Edit
            any campaign segment with updated settings.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => void load(page, false)}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary bar */}
      {!loading && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-600">
            <div className="flex flex-wrap items-center gap-2">
              <BarChart2 className="h-4 w-4 shrink-0 text-zinc-400" />
              <span>
                <strong className="text-zinc-800">{total}</strong> campaign{total !== 1 ? 's' : ''} in history
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-xs text-zinc-400">
                {"Templates always reflect their latest edited version"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs border-zinc-200 bg-white text-zinc-700 hover:text-zinc-900 shrink-0"
              onClick={() => setIsLimitInfoOpen(true)}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Sending Limit Info
            </Button>
          </div>

          {/* Quick Safe Limits Note */}
          {(() => {
            const emailLimits = settings?.sendingLimits?.email;
            const activeDailyLimit = emailLimits?.dailyLimit ?? settings?.sendingLimits?.dailyLimit ?? 275;
            const activeHourlyLimit = emailLimits?.hourlyLimit ?? settings?.sendingLimits?.hourlyLimit ?? 50;
            const activeMinDelay = emailLimits?.minDelaySeconds ?? settings?.sendingLimits?.minDelaySeconds ?? 50;
            const activeMaxDelay = emailLimits?.maxDelaySeconds ?? settings?.sendingLimits?.maxDelaySeconds ?? 80;

            const isDailyDefault = activeDailyLimit === 275;
            const isHourlyDefault = activeHourlyLimit === 50;
            const isDelayDefault = activeMinDelay === 50 && activeMaxDelay === 80;

            // Determine risk properties
            let riskLevel: 'safe' | 'moderate' | 'high' | 'critical' = 'safe';
            if (activeDailyLimit > 2000 || activeMinDelay < 30) {
              riskLevel = 'critical';
            } else if (activeDailyLimit > 500 || activeHourlyLimit > 100) {
              riskLevel = 'high';
            } else if (activeDailyLimit > 275 || activeHourlyLimit > 50 || activeMinDelay < 50) {
              riskLevel = 'moderate';
            }

            const config = {
              critical: {
                border: 'border-rose-200',
                bg: 'bg-rose-50/50',
                text: 'text-rose-950',
                btnHover: 'hover:bg-rose-100/30',
                badge: 'border-rose-300 bg-rose-100 text-rose-800',
                chevron: 'text-rose-700',
                iconColor: 'text-rose-600',
                labelText: '💀 CRITICAL RISK',
              },
              high: {
                border: 'border-red-200',
                bg: 'bg-red-50/50',
                text: 'text-red-950',
                btnHover: 'hover:bg-red-100/30',
                badge: 'border-red-300 bg-red-100 text-red-800',
                chevron: 'text-red-700',
                iconColor: 'text-red-600',
                labelText: '🔥 HIGH RISK',
              },
              moderate: {
                border: 'border-amber-200',
                bg: 'bg-amber-50/50',
                text: 'text-amber-950',
                btnHover: 'hover:bg-amber-100/30',
                badge: 'border-amber-300 bg-amber-100 text-amber-800',
                chevron: 'text-amber-700',
                iconColor: 'text-amber-600',
                labelText: '⚠️ MODERATE RISK',
              },
              safe: {
                border: 'border-emerald-200',
                bg: 'bg-emerald-50/50',
                text: 'text-emerald-950',
                btnHover: 'hover:bg-emerald-100/30',
                badge: 'border-emerald-300 bg-emerald-100 text-emerald-800',
                chevron: 'text-emerald-700',
                iconColor: 'text-emerald-600',
                labelText: '✓ SAFE SETTINGS',
              },
            }[riskLevel];

            return (
              <div className={`rounded-lg border ${config.border} ${config.bg} overflow-hidden transition-all duration-300`}>
                <button
                  onClick={() => setShowLimitDetails(!showLimitDetails)}
                  className={`w-full flex items-center justify-between p-4 text-xs font-semibold ${config.text} ${config.btnHover} transition-all text-left`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <ShieldAlert className={`h-4 w-4 ${config.iconColor} shrink-0`} />
                    <span>{"Campaign Delivery Speed & Google SMTP Limits (Active Settings)"}</span>
                    <Badge variant="outline" className={`border ${config.badge} font-semibold px-2 py-0.5 text-[10px]`}>
                      {config.labelText}
                    </Badge>
                  </div>
                  {showLimitDetails ? (
                    <ChevronUp className={`h-4 w-4 ${config.chevron} shrink-0`} />
                  ) : (
                    <ChevronDown className={`h-4 w-4 ${config.chevron} shrink-0`} />
                  )}
                </button>
                
                {showLimitDetails && (
                  <div className={`px-4 pb-4 text-xs ${config.text} space-y-2 border-t ${config.border}/50 pt-3`}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-zinc-700 py-2 border-b border-emerald-100/50">
                      <div>
                        <span className="text-zinc-500 block">{"Safe Daily Limit:"}</span>
                        <strong className="text-zinc-800">
                          {`${activeDailyLimit} emails / day ${isDailyDefault ? "(Default)" : "(Custom)"}`}
                        </strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">{"Safe Hourly Speed:"}</span>
                        <strong className="text-zinc-800">
                          {`${activeHourlyLimit} emails / hour ${isHourlyDefault ? "(Default)" : "(Custom)"}`}
                        </strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">{"Safe Pacing Delay:"}</span>
                        <strong className="text-emerald-700">
                          {`${activeMinDelay}s - ${activeMaxDelay}s delay ${isDelayDefault ? "(Default)" : "(Custom)"}`}
                        </strong>
                      </div>
                    </div>
                    {(() => {
                      const isDefaultAll = isDailyDefault && isHourlyDefault && isDelayDefault;
                      if (isDefaultAll) {
                        return (
                          <p className="leading-relaxed text-zinc-600">
                            <strong>{"Why we use these limits: "}</strong> 
                            {"Google's SMTP servers automatically flag accounts as spam or reject messages if emails are sent in rapid bursts or trigger high bounce rates. These safe defaults prevent your sender accounts from suspension. "}
                            <strong>{"How to increase / restore limits: "}</strong>
                            {"Ensure your domain has SPF/DKIM/DMARC authenticated, keep your list bounce rate below 2%, and warm up new accounts slowly. If your capacity is reduced by Google, stop campaigns for 24-48 hours and send manual emails that get replies to signal organic usage."}
                          </p>
                        );
                      }

                      // Dynamic explanations based on custom limits
                      let dailyFeedback = "";
                      let dailyRisk = false;
                      if (activeDailyLimit > 2000) {
                        dailyFeedback = `⚠️ Critical Limit Risk: Your daily limit (${activeDailyLimit}) exceeds Google Workspace's hard cap of 2,000 emails/day, which will trigger immediate delivery rejections and account suspension.`;
                        dailyRisk = true;
                      } else if (activeDailyLimit > 500) {
                        dailyFeedback = `⚠️ High Volume Risk: Your limit (${activeDailyLimit}) is above the free Gmail threshold (500/day). You must use paid Google Workspace accounts, and warm them up slowly to avoid spam flags.`;
                        dailyRisk = true;
                      } else if (activeDailyLimit > 275) {
                        dailyFeedback = `⚠️ Moderate Volume Risk: Your limit (${activeDailyLimit}) is higher than the safe default limit of 275/day. Ensure your domain has established sender reputation before running campaigns.`;
                        dailyRisk = true;
                      } else {
                        dailyFeedback = `✓ Safe Daily Volume: Your limit of ${activeDailyLimit} emails/day is safe and conservative.`;
                      }

                      let hourlyFeedback = "";
                      let hourlyRisk = false;
                      if (activeHourlyLimit > 100) {
                        hourlyFeedback = `⚠️ High Hourly Speed: Sending ${activeHourlyLimit} emails/hour is too fast. Google's burst filters will likely trigger SMTP code 421 (throttling) or mark incoming messages as spam.`;
                        hourlyRisk = true;
                      } else if (activeHourlyLimit > 50) {
                        hourlyFeedback = `⚠️ Moderate Hourly Speed: Your speed of ${activeHourlyLimit}/hour is above the safe default limit of 50. Emails may be throttled or put in spam if sent too rapidly.`;
                        hourlyRisk = true;
                      } else {
                        hourlyFeedback = `✓ Safe Hourly Speed: Your speed of ${activeHourlyLimit}/hour is safe and mimics natural human pacing.`;
                      }

                      let delayFeedback = "";
                      let delayRisk = false;
                      if (activeMinDelay < 30) {
                        delayFeedback = `⚠️ Critical Delay Risk: Pacing delay of ${activeMinDelay}s-${activeMaxDelay}s is extremely fast. Delays under 30 seconds mimic automated bot behavior and trigger quick SMTP blocks.`;
                        delayRisk = true;
                      } else if (activeMinDelay < 50) {
                        delayFeedback = `⚠️ Moderate Delay Risk: Pacing delay of ${activeMinDelay}s-${activeMaxDelay}s is slightly fast. We recommend keeping it at least 50 seconds to avoid velocity filter flags.`;
                        delayRisk = true;
                      } else {
                        delayFeedback = `✓ Safe Delay Pacing: Your delay of ${activeMinDelay}s-${activeMaxDelay}s is wide enough to mimic organic sending.`;
                      }

                      const isCustomSafe = activeDailyLimit <= 275 && activeHourlyLimit <= 50 && activeMinDelay >= 50;

                      if (isCustomSafe) {
                        return (
                          <div className="leading-relaxed text-zinc-600 space-y-3 text-left">
                            <div className="text-emerald-800 font-semibold flex items-center gap-1.5 pt-0.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span>{"Custom Limits Set Safely"}</span>
                            </div>
                            
                            <p className="text-xs text-zinc-600">
                              {"Your custom limits are set within the recommended safe guidelines. This is a very conservative and secure setup that will protect your sender accounts from suspension."}
                            </p>

                            <div className="space-y-2.5 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                              <div className="text-xs">
                                <strong className="text-zinc-800 font-semibold">{"Daily Limit Analysis:"}</strong>
                                <span className="block mt-0.5 text-emerald-700 font-medium">
                                  {dailyFeedback}
                                </span>
                              </div>
                              <div className="border-t border-zinc-200/60 pt-2 text-xs">
                                <strong className="text-zinc-800 font-semibold">{"Hourly Speed Analysis:"}</strong>
                                <span className="block mt-0.5 text-emerald-700 font-medium">
                                  {hourlyFeedback}
                                </span>
                              </div>
                              <div className="border-t border-zinc-200/60 pt-2 text-xs">
                                <strong className="text-zinc-800 font-semibold">{"Pacing Delay Analysis:"}</strong>
                                <span className="block mt-0.5 text-emerald-700 font-medium">
                                  {delayFeedback}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="leading-relaxed text-zinc-600 space-y-3 text-left">
                          <div className="text-amber-800 font-semibold flex items-center gap-1.5 pt-0.5">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>{"You have set Custom Limits"}</span>
                          </div>
                          
                          <p className="text-xs text-zinc-600">
                            {"You are currently using custom limits instead of the recommended safe defaults. Google's SMTP servers automatically flag spam patterns and suspend accounts if custom parameters are set too aggressively. Here is how your current settings can affect your delivery:"}
                          </p>

                          <div className="space-y-2.5 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                            <div className="text-xs">
                              <strong className="text-zinc-800 font-semibold">{"Daily Limit Analysis:"}</strong>
                              <span className={`block mt-0.5 ${dailyRisk ? "text-amber-700 font-medium" : "text-emerald-700"}`}>
                                {dailyFeedback}
                              </span>
                            </div>
                            <div className="border-t border-zinc-200/60 pt-2 text-xs">
                              <strong className="text-zinc-800 font-semibold">{"Hourly Speed Analysis:"}</strong>
                              <span className={`block mt-0.5 ${hourlyRisk ? "text-amber-700 font-medium" : "text-emerald-700"}`}>
                                {hourlyFeedback}
                              </span>
                            </div>
                            <div className="border-t border-zinc-200/60 pt-2 text-xs">
                              <strong className="text-zinc-800 font-semibold">{"Pacing Delay Analysis:"}</strong>
                              <span className={`block mt-0.5 ${delayRisk ? "text-amber-700 font-medium" : "text-emerald-700"}`}>
                                {delayFeedback}
                              </span>
                            </div>
                          </div>

                          <div className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-100 text-xs space-y-1.5">
                            <strong className="font-semibold block text-red-950">{"Google's Throttling & Spam Safeguards:"}</strong>
                            <p>
                              {"If Google's servers reject your emails or flag your account as spam under these custom limits, you should immediately revert back to the safe defaults (275 daily limit, 50 hourly limit, 50s-80s pacing delay)."}
                            </p>
                            <p className="font-semibold text-red-900">
                              {"To restore/increase your capacity: (1) Stop campaigns for 24-48 hours. (2) Send manual emails to personal contacts and get replies. (3) Ensure SPF/DKIM/DMARC are properly authenticated. (4) Keep list bounce rate strictly below 2%."}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Campaign list */}
      {loading ? (
        <LoadingSkeleton />
      ) : campaigns.length === 0 ? (
        <Card className="border-dashed border-zinc-300 bg-zinc-50">
          <CardContent className="py-16 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-600">No campaigns yet</p>
            <p className="mt-1 text-xs text-zinc-400">
              Go to <strong>Campaigns</strong>, pick your audience (by category or individual
              contacts), choose a template, and launch. It will appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              templateMap={templateMap}
              onEdit={setEditingCampaign}
              onDuplicate={handleDuplicate}
              isDuplicating={duplicatingId === campaign.id}
              onSuccess={() => void load(page, true)}
              onShowHistoryDetails={(c) => {
                setHistoryCampaign(c);
                setIsHistoryOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
          <p className="text-xs text-zinc-500">
            Page {page} of {totalPages} • {total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit & Re-run Dialog */}
      <CampaignEditRerunDialog
        open={Boolean(editingCampaign)}
        campaign={editingCampaign}
        onOpenChange={(open) => {
          if (!open) setEditingCampaign(null);
        }}
        onSuccess={() => void load(page, true)}
      />

      {/* History Details Side Panel */}
      <CampaignHistoryDetailsPanel
        open={isHistoryOpen}
        campaign={historyCampaign}
        onOpenChange={setIsHistoryOpen}
      />

      <SendingLimitInfoDialog
        open={isLimitInfoOpen}
        onOpenChange={setIsLimitInfoOpen}
      />
    </section>
  );
}
