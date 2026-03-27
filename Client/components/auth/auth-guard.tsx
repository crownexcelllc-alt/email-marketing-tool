'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import { useAuthStore } from '@/lib/stores/auth-store';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace(ROUTES.auth.login);
    }
  }, [hydrated, token, router]);

  if (!hydrated || isLoading || !token || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your workspace...</p>
      </div>
    );
  }

  return children;
}
