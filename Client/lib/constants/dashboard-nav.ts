import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  ClipboardList,
  ContactRound,
  FolderKanban,
  History,
  LayoutDashboard,
  Megaphone,
  SendHorizontal,
  Settings,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { label: 'Dashboard', href: ROUTES.dashboard.root, icon: LayoutDashboard },
  { label: 'Sender Accounts', href: ROUTES.dashboard.senderAccounts, icon: SendHorizontal },
  { label: 'Contacts', href: ROUTES.dashboard.contacts, icon: ContactRound },
  { label: 'Segments', href: ROUTES.dashboard.segments, icon: FolderKanban },
  { label: 'Templates', href: ROUTES.dashboard.templates, icon: ClipboardList },
  { label: 'Campaigns', href: ROUTES.dashboard.campaigns, icon: Megaphone },
  { label: 'Analytics', href: ROUTES.dashboard.analytics, icon: BarChart3 },
  { label: 'History', href: ROUTES.dashboard.history, icon: History },
  { label: 'Settings', href: ROUTES.dashboard.settings, icon: Settings },
];

export function isActiveDashboardRoute(pathname: string, href: string): boolean {
  if (href === ROUTES.dashboard.root) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
