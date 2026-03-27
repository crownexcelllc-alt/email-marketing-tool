import { cn } from '@/lib/utils';

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className }: AppLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 text-zinc-900 text-xs font-semibold">
        MP
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-zinc-100">Marketing Platform</span>
        <span className="text-xs text-zinc-400">SaaS Control Center</span>
      </div>
    </div>
  );
}
