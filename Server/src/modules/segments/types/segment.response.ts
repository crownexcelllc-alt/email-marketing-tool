import {
  ContactEmailStatus,
  ContactSubscriptionStatus,
  ContactWhatsappStatus,
} from '../../contacts/constants/contact.enums';
import { SegmentType } from '../constants/segment.enums';

export interface SegmentFiltersResponse {
  tags: string[];
  subscriptionStatus: ContactSubscriptionStatus | null;
  emailStatus: ContactEmailStatus | null;
  whatsappStatus: ContactWhatsappStatus | null;
}

export interface SegmentResponse {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  type: SegmentType;
  filters: SegmentFiltersResponse;
  contactIds: string[];
  estimatedCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SegmentListResponse {
  items: SegmentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
