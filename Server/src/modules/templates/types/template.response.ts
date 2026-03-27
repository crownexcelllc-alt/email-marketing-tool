import { TemplateCategory, TemplateChannelType, TemplateStatus } from '../constants/template.enums';

interface TemplateBaseResponse {
  id: string;
  workspaceId: string;
  channelType: TemplateChannelType;
  name: string;
  category: TemplateCategory;
  status: TemplateStatus;
  variables: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmailTemplateResponse extends TemplateBaseResponse {
  channelType: TemplateChannelType.EMAIL;
  subject: string;
  previewText: string;
  htmlBody: string;
  textBody: string;
}

export interface WhatsAppTemplateResponse extends TemplateBaseResponse {
  channelType: TemplateChannelType.WHATSAPP;
  templateName: string;
  language: string;
  bodyParams: string[];
  headerParams: string[];
  buttonParams: string[];
}

export type TemplateResponse = EmailTemplateResponse | WhatsAppTemplateResponse;

export interface TemplateListResponse {
  items: TemplateResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface TemplatePreviewResponse {
  templateId: string;
  channelType: TemplateChannelType;
  rendered: Record<string, unknown>;
  sampleData: Record<string, unknown>;
  unresolvedVariables: string[];
}
