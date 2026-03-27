import {
  SuppressionChannel,
  SuppressionReason,
  SuppressionSource,
} from '../constants/suppression.enums';

export interface SuppressionResponse {
  id: string;
  workspaceId: string;
  contactId: string | null;
  channel: SuppressionChannel;
  address: string;
  reason: SuppressionReason;
  source: SuppressionSource;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SuppressionCheckContactInput {
  id?: string;
  contactId?: string;
  _id?: string;
  email?: string | null;
  phone?: string | null;
}

export interface SuppressionCheckResult {
  suppressed: boolean;
  matchType?: 'contactId' | 'address';
  suppression?: SuppressionResponse;
}
