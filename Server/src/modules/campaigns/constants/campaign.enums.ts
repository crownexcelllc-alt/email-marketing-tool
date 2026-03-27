export enum CampaignChannel {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum CampaignDistributionStrategy {
  ROUND_ROBIN = 'round_robin',
  WEIGHTED_BY_DAILY_LIMIT = 'weighted_by_daily_limit',
}

export enum CampaignRecipientStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
}

export const CAMPAIGN_CHANNEL_VALUES = Object.values(CampaignChannel);
export const CAMPAIGN_STATUS_VALUES = Object.values(CampaignStatus);
export const CAMPAIGN_DISTRIBUTION_STRATEGY_VALUES = Object.values(CampaignDistributionStrategy);
export const CAMPAIGN_RECIPIENT_STATUS_VALUES = Object.values(CampaignRecipientStatus);
