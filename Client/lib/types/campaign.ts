export type CampaignChannel = 'email' | 'whatsapp';
export type CampaignTargetMode = 'segment' | 'contacts';
export type CampaignScheduleMode = 'now' | 'scheduled';

export interface CampaignBuilderValues {
  name: string;
  description?: string;
  channel: CampaignChannel;
  targetMode: CampaignTargetMode;
  segmentId?: string;
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
  name: string;
  channel: CampaignChannel;
  status?: string;
  stats?: {
    totalRecipients?: number;
    sentRecipients?: number;
    failedRecipients?: number;
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
