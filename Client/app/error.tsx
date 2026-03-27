'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global UI error:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <Card className="w-full max-w-lg border-zinc-800 bg-zinc-900/70">
        <CardHeader>
          <CardTitle className="text-base">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">
            We hit an unexpected frontend error. Try again, and if it continues, refresh the page.
          </p>
          <Button onClick={reset}>Try Again</Button>
        </CardContent>
      </Card>
    </main>
  );
}
