'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DASHBOARD_NAV_ITEMS, isActiveDashboardRoute } from '@/lib/constants/dashboard-nav';
import { cn } from '@/lib/utils';

interface DashboardNavProps {
  onNavigate?: () => void;
}

export function DashboardNav({ onNavigate }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {DASHBOARD_NAV_ITEMS.map((item) => {
        const isActive = isActiveDashboardRoute(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-300')} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

