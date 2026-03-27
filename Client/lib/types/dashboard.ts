export interface DashboardTotals {
  totalContacts: number;
  totalCampaigns: number;
  totalEmailsSent: number;
  totalWhatsAppMessages: number;
}

export interface DashboardQuickStat {
  id: string;
  label: string;
  value: string;
  helper: string;
}

export type DashboardActivityChannel = 'email' | 'whatsapp' | 'system';

export interface DashboardActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  channel: DashboardActivityChannel;
}

export interface DashboardOverview {
  totals: DashboardTotals;
  quickStats: DashboardQuickStat[];
  recentActivity: DashboardActivityItem[];
}

