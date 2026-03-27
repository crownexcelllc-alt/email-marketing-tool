export type TemplateType = 'email' | 'whatsapp';

export interface MarketingTemplate {
  id: string;
  workspaceId?: string;
  type: TemplateType;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplatesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TemplatesListResult {
  items: MarketingTemplate[];
  pagination: TemplatesPagination;
}

export interface TemplatesQueryFilters {
  search?: string;
  type?: TemplateType;
  page?: number;
  limit?: number;
}

export interface TemplatePreviewResult {
  subject: string;
  body: string;
  unresolvedVariables: string[];
}
