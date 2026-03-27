export const ROUTES = {
  root: '/',
  auth: {
    login: '/login',
    signup: '/signup',
  },
  dashboard: {
    root: '/dashboard',
    senderAccounts: '/dashboard/sender-accounts',
    campaigns: '/dashboard/campaigns',
    contacts: '/dashboard/contacts',
    segments: '/dashboard/segments',
    templates: '/dashboard/templates',
    analytics: '/dashboard/analytics',
    history: '/dashboard/history',
    settings: '/dashboard/settings',
  },
} as const;
