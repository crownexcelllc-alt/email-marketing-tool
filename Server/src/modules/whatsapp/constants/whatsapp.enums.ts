import { EmailFailureCategory } from '../../email/constants/email.enums';

export enum WhatsappErrorCode {
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVALID_TEMPLATE = 'INVALID_TEMPLATE',
  INVALID_PHONE = 'INVALID_PHONE',
  RATE_LIMITED = 'RATE_LIMITED',
  API_FAILURE = 'API_FAILURE',
  TRANSIENT_API_FAILURE = 'TRANSIENT_API_FAILURE',
  CONTACT_NOT_OPTED_IN = 'CONTACT_NOT_OPTED_IN',
  CONTACT_SUPPRESSED = 'CONTACT_SUPPRESSED',
}

export interface WhatsappFailureClassification {
  category: EmailFailureCategory;
  code: WhatsappErrorCode;
  message: string;
  providerStatusCode: number | null;
}
