export enum SuppressionChannel {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
}

export enum SuppressionReason {
  UNSUBSCRIBED = 'unsubscribed',
  BOUNCED = 'bounced',
  BLOCKED = 'blocked',
  INVALID = 'invalid',
  COMPLAINT = 'complaint',
  MANUAL = 'manual',
}

export enum SuppressionSource {
  MANUAL = 'manual',
  API = 'api',
  SYSTEM = 'system',
  WEBHOOK = 'webhook',
  IMPORT = 'import',
}

export const SUPPRESSION_CHANNEL_VALUES = Object.values(SuppressionChannel);
export const SUPPRESSION_REASON_VALUES = Object.values(SuppressionReason);
export const SUPPRESSION_SOURCE_VALUES = Object.values(SuppressionSource);
