export type SenderAccountType = 'email' | 'whatsapp';

export interface SenderAccountBase {
  id: string;
  workspaceId?: string;
  type: SenderAccountType;
  name: string;
  status?: string;
  healthStatus?: string;
  lastTestedAt?: string | null;
}

export interface EmailSenderAccount extends SenderAccountBase {
  type: 'email';
  email: string;
  providerType?: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass?: string;
  secure?: boolean;
  dailyLimit?: number;
  hourlyLimit?: number;
  minDelaySeconds?: number;
  maxDelaySeconds?: number;
}

export interface WhatsAppSenderAccount extends SenderAccountBase {
  type: 'whatsapp';
  phoneNumber: string;
  businessAccountId?: string;
  phoneNumberId: string;
  accessToken?: string;
  webhookVerifyToken?: string;
  qualityStatus?: string;
}

export type SenderAccount = EmailSenderAccount | WhatsAppSenderAccount;

export interface SenderAccountTestResult {
  success: boolean;
  message: string;
}

