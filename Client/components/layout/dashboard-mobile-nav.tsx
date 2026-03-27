'use client';

import { Menu } from 'lucide-react';
import { useState } from 'react';
import { AppLogo } from '@/components/shared/app-logo';
import { DashboardNav } from '@/components/layout/dashboard-nav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function DashboardMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 border-zinc-800 p-0">
        <SheetHeader className="border-b border-zinc-800 px-5 py-5">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Dashboard navigation menu</SheetDescription>
          <AppLogo />
        </SheetHeader>
        <div className="px-3 py-4">
          <DashboardNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

