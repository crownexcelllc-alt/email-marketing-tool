export type CampaignChannel = 'email' | 'whatsapp';
export type CampaignTargetMode = 'segment' | 'contacts' | 'category';
export type CampaignScheduleMode = 'now' | 'scheduled';

export interface CampaignBuilderValues {
  name: string;
  description?: string;
  channel: CampaignChannel;
  targetMode: CampaignTargetMode;
  segmentId?: string;
  categoryName?: string;
  contactIds: string[];
  senderAccountIds: string[];
  templateId?: string;
  scheduleMode: CampaignScheduleMode;
  timezone: string;
  startAt?: string;
  sendingWindowStart?: string;
  sendingWindowEnd?: string;
  dailyCap?: number;
}

export interface Campaign {
  id: string;
  workspaceId?: string;
  name: string;
  channel: CampaignChannel;
  senderAccountIds: string[];
  segmentId?: string | null;
  contactIds: string[];
  templateId?: string;
  templateName?: string | null;
  templateSubject?: string | null;
  status?: string;
  timezone?: string;
  startAt?: string | null;
  sendingWindowStart?: string | null;
  sendingWindowEnd?: string | null;
  dailyCap?: number | null;
  editedAt?: string | null;
  copyNumber?: number;
  startedAt?: string | null;
  stoppedAt?: string | null;
  stopReason?: string | null;
  limitFailedAt?: string | null;
  limitResumeAt?: string | null;
  resentAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  stats?: {
    totalRecipients?: number;
    queuedRecipients?: number;
    skippedRecipients?: number;
    sentRecipients?: number;
    failedRecipients?: number;
    limitFailedRecipients?: number;
    openCount?: number;
    clickCount?: number;
    whatsappSentCount?: number;
    whatsappDeliveredCount?: number;
    whatsappReadCount?: number;
    whatsappFailedCount?: number;
  };
}

export interface CampaignsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CampaignsListResult {
  items: Campaign[];
  pagination: CampaignsPagination;
}

export interface CampaignRecipientDetail {
  id: string;
  contactId: string;
  name: string;
  email: string;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  failureReason?: string | null;
}

export interface CampaignRecipientDetailsResult {
  summary: {
    sent: number;
    pending: number;
    opened: number;
    clicked: number;
    notOpened: number;
  };
  items: CampaignRecipientDetail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
