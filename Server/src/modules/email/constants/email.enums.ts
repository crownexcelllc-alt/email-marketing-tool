export enum EmailSendEventType {
  SEND_ATTEMPT = 'send_attempt',
  SEND_RETRY_SCHEDULED = 'send_retry_scheduled',
  SEND_SUCCESS = 'send_success',
  SEND_FAILED_TEMPORARY = 'send_failed_temporary',
  SEND_FAILED_PERMANENT = 'send_failed_permanent',
  SEND_SKIPPED_SUPPRESSED = 'send_skipped_suppressed',
  WHATSAPP_STATUS_SENT = 'whatsapp_status_sent',
  WHATSAPP_STATUS_DELIVERED = 'whatsapp_status_delivered',
  WHATSAPP_STATUS_READ = 'whatsapp_status_read',
  WHATSAPP_STATUS_FAILED = 'whatsapp_status_failed',
}

export enum EmailFailureCategory {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
}

export const EMAIL_SEND_EVENT_TYPE_VALUES = Object.values(EmailSendEventType);
export const EMAIL_FAILURE_CATEGORY_VALUES = Object.values(EmailFailureCategory);
