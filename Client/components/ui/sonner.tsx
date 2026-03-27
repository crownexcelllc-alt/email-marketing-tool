'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      richColors
      toastOptions={{
        className: 'border border-zinc-800 bg-zinc-900 text-zinc-100',
      }}
    />
  );
}

