export enum HistoryEventSource {
  SEND_EVENT = 'send_event',
  TRACKING_EVENT = 'tracking_event',
  WHATSAPP_WEBHOOK = 'whatsapp_webhook',
  CONTACT_ACTIVITY = 'contact_activity',
}

export const HISTORY_EVENT_SOURCE_VALUES = Object.values(HistoryEventSource);
