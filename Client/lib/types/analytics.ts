export interface CampaignStatMetrics {
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  bounced: number;
  failed: number;
  openRate: number;
  clickRate: number;
  deliveryRate: number;
}

export interface AnalyticsTimelinePoint {
  label: string;
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
}

export interface SenderPerformanceMetric {
  senderAccountId: string;
  senderName: string;
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface DeliveryBreakdown {
  delivered: number;
  bounced: number;
  failed: number;
  pending: number;
}

export interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  channel: 'email' | 'whatsapp';
  stats: CampaignStatMetrics;
  timeline: AnalyticsTimelinePoint[];
  senderPerformance: SenderPerformanceMetric[];
  delivery: DeliveryBreakdown;
}

