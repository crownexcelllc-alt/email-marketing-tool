import { DashboardHeader } from '@/components/layout/dashboard-header';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="dashboard-shell-root min-h-screen bg-zinc-100 text-zinc-900">
      <DashboardSidebar />
      <div className="flex min-h-screen w-full flex-col md:pl-72">
        <DashboardHeader />
        <main className="dashboard-shell-main flex-1 bg-zinc-100 p-4 md:p-6">
          <div className="dashboard-shell-content mx-auto h-full w-full max-w-7xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
