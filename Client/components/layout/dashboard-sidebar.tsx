import { AppLogo } from '@/components/shared/app-logo';
import { DashboardNav } from '@/components/layout/dashboard-nav';

export function DashboardSidebar() {
  return (
    <aside className="hidden border-r border-zinc-800 bg-zinc-950 md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-72 md:flex-col">
      <div className="border-b border-zinc-800 px-5 py-5">
        <AppLogo />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <DashboardNav />
      </div>
    </aside>
  );
}
