export type HistoryChannel = 'email' | 'whatsapp';

export type HistoryEventTypeFilter = 'all' | 'sent' | 'opened' | 'clicked' | 'failed';

export interface HistoryEvent {
  id: string;
  source: string;
  timestamp: string;
  campaignId: string | null;
  campaignRecipientId: string | null;
  contactId: string | null;
  senderAccountId: string | null;
  channel: HistoryChannel | null;
  eventType: string;
  address: string | null;
  providerMessageId: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  metadata: Record<string, unknown>;
}

export interface HistoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface HistoryListResult {
  items: HistoryEvent[];
  pagination: HistoryPagination;
}

export interface HistoryFilters {
  campaignId?: string;
  contactId?: string;
  eventType?: HistoryEventTypeFilter;
  page?: number;
  limit?: number;
}
