export enum ContactEmailStatus {
  UNKNOWN = 'unknown',
  VALID = 'valid',
  INVALID = 'invalid',
  BOUNCED = 'bounced',
  SUPPRESSED = 'suppressed',
}

export enum ContactWhatsappStatus {
  UNKNOWN = 'unknown',
  VALID = 'valid',
  INVALID = 'invalid',
  OPTED_OUT = 'opted_out',
}

export enum ContactSubscriptionStatus {
  SUBSCRIBED = 'subscribed',
  UNSUBSCRIBED = 'unsubscribed',
  PENDING = 'pending',
  SUPPRESSED = 'suppressed',
}

export enum ContactSource {
  MANUAL = 'manual',
  CSV_IMPORT = 'csv_import',
  API = 'api',
  WEBHOOK = 'webhook',
}

export const CONTACT_EMAIL_STATUS_VALUES = Object.values(ContactEmailStatus);
export const CONTACT_WHATSAPP_STATUS_VALUES = Object.values(ContactWhatsappStatus);
export const CONTACT_SUBSCRIPTION_STATUS_VALUES = Object.values(ContactSubscriptionStatus);
export const CONTACT_SOURCE_VALUES = Object.values(ContactSource);
