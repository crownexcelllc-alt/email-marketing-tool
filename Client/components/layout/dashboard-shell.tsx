import { DashboardHeader } from '@/components/layout/dashboard-header';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <DashboardSidebar />
      <div className="flex min-h-screen w-full flex-col md:pl-72">
        <DashboardHeader />
        <main className="flex-1 bg-gradient-to-b from-zinc-950 to-zinc-900/60 p-4 md:p-6">
          <div className="mx-auto h-full w-full max-w-7xl rounded-2xl border border-zinc-800/70 bg-zinc-950/60 p-4 shadow-2xl md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
