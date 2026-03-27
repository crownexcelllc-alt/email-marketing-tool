'use client';

import Link from 'next/link';
import { ChevronDown, UserRound } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DashboardMobileNav } from '@/components/layout/dashboard-mobile-nav';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/lib/constants/routes';
import { useAuthStore } from '@/lib/stores/auth-store';

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.dashboard.root]: 'Dashboard',
  [ROUTES.dashboard.senderAccounts]: 'Sender Accounts',
  [ROUTES.dashboard.contacts]: 'Contacts',
  [ROUTES.dashboard.segments]: 'Segments',
  [ROUTES.dashboard.templates]: 'Templates',
  [ROUTES.dashboard.campaigns]: 'Campaigns',
  [ROUTES.dashboard.analytics]: 'Analytics',
  [ROUTES.dashboard.history]: 'History',
  [ROUTES.dashboard.settings]: 'Settings',
};

function getPageTitle(pathname: string): string {
  const directTitle = PAGE_TITLES[pathname];
  if (directTitle) {
    return directTitle;
  }

  if (pathname.startsWith(ROUTES.dashboard.root)) {
    return 'Workspace';
  }

  return 'Dashboard';
}

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const title = getPageTitle(pathname);
  const subtitle = 'Manage your campaigns, channels, and performance in one place.';
  const initials = (user?.email?.slice(0, 2) ?? 'MP').toUpperCase();

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully.');
    router.replace(ROUTES.auth.login);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <DashboardMobileNav />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-zinc-100 md:text-base">{title}</h1>
            <p className="hidden text-xs text-zinc-400 md:block">{subtitle}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 gap-2 rounded-full border border-zinc-800 px-2 text-zinc-200 hover:bg-zinc-900 hover:text-zinc-100"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-900">
                {initials}
              </span>
              <span className="hidden max-w-40 truncate text-sm md:block">{user?.email ?? 'workspace@company.com'}</span>
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-zinc-200">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-zinc-400" />
                <span className="truncate">{user?.email ?? 'Workspace User'}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={ROUTES.dashboard.settings}>Profile Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={ROUTES.dashboard.settings}>Workspace Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
