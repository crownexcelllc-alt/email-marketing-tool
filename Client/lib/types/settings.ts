export interface ProfileSettings {
  fullName: string;
  email: string;
  timezone: string;
}

export interface SmtpSettings {
  defaultFromName: string;
  defaultFromEmail: string;
  replyToEmail: string;
  providerType: string;
  trackReplies: boolean;
}

export interface WhatsAppSettings {
  businessAccountId: string;
  phoneNumberId: string;
  webhookVerifyToken: string;
  defaultLanguage: string;
}

export interface SendingLimitsSettings {
  dailyLimit: number;
  hourlyLimit: number;
  minDelaySeconds: number;
  maxDelaySeconds: number;
  respectSenderLimits: boolean;
}

export interface TrackingSettings {
  trackOpens: boolean;
  trackClicks: boolean;
  appendUtm: boolean;
  utmSource: string;
  utmMedium: string;
}

export interface WorkspaceSettings {
  profile: ProfileSettings;
  smtp: SmtpSettings;
  whatsapp: WhatsAppSettings;
  sendingLimits: SendingLimitsSettings;
  tracking: TrackingSettings;
}

export type SettingsSectionKey = keyof WorkspaceSettings;
