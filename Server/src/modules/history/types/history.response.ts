import { CampaignChannel } from '../../campaigns/constants/campaign.enums';
import { HistoryEventSource } from '../constants/history.enums';

export interface HistoryEventResponse {
  id: string;
  source: HistoryEventSource;
  timestamp: Date;
  campaignId: string | null;
  campaignRecipientId: string | null;
  contactId: string | null;
  senderAccountId: string | null;
  channel: CampaignChannel | null;
  eventType: string;
  address: string | null;
  providerMessageId: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  metadata: Record<string, unknown>;
}

export interface HistoryListResponse {
  items: HistoryEventResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
