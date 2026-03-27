export enum SenderChannelType {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
}

export enum SenderAccountStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DISABLED = 'disabled',
}

export enum SenderHealthStatus {
  UNKNOWN = 'unknown',
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
}

export enum SenderQualityStatus {
  UNKNOWN = 'unknown',
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red',
}

export enum EmailProviderType {
  SMTP = 'smtp',
  SES = 'ses',
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
  CUSTOM = 'custom',
}

export const SENDER_CHANNEL_VALUES = Object.values(SenderChannelType);
export const SENDER_STATUS_VALUES = Object.values(SenderAccountStatus);
export const EMAIL_PROVIDER_VALUES = Object.values(EmailProviderType);
export const EMAIL_HEALTH_STATUS_VALUES = Object.values(SenderHealthStatus);
export const WHATSAPP_QUALITY_STATUS_VALUES = Object.values(SenderQualityStatus);
