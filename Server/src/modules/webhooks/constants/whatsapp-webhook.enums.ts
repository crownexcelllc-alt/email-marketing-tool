export enum WhatsappWebhookMessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export const WHATSAPP_WEBHOOK_MESSAGE_STATUS_VALUES = Object.values(WhatsappWebhookMessageStatus);
