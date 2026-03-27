export enum TemplateChannelType {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
}

export enum TemplateCategory {
  GENERAL = 'general',
  MARKETING = 'marketing',
  TRANSACTIONAL = 'transactional',
  UTILITY = 'utility',
  AUTHENTICATION = 'authentication',
}

export enum TemplateStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export const TEMPLATE_CHANNEL_VALUES = Object.values(TemplateChannelType);
export const TEMPLATE_CATEGORY_VALUES = Object.values(TemplateCategory);
export const TEMPLATE_STATUS_VALUES = Object.values(TemplateStatus);
