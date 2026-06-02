'use client';

import { 
  HelpCircle, 
  ShieldAlert, 
  Clock, 
  Gauge, 
  Sparkles, 
  UserCheck, 
  AlertTriangle 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SendingLimitInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendingLimitInfoDialog({ open, onOpenChange }: SendingLimitInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-white border-zinc-200 text-zinc-900 p-6 md:p-8">
        <DialogHeader className="mb-6">
          <div className="flex items-center gap-2.5 text-amber-500">
            <HelpCircle className="h-6 w-6 shrink-0" />
            <DialogTitle className="text-xl font-bold tracking-tight text-black">
              Google SMTP Sending Limits & Policies
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-500 text-sm mt-1">
            Learn about Google's strict sending restrictions, reputation-based controls, and how they impact your campaign delivery.
          </DialogDescription>
        </DialogHeader>

        {/* 1. Google SMTP Reference Limits (Top) */}
        <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] overflow-hidden mb-6 text-black">
          <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-200/50">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-black flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Google SMTP Reference limits
            </h4>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-zinc-500 font-medium block mb-1">Standard Gmail Limit</span>
              <span className="font-semibold text-black">500 emails / rolling 24 hours</span>
            </div>
            <div>
              <span className="text-zinc-500 font-medium block mb-1">Google Workspace Limit</span>
              <span className="font-semibold text-black">2,000 emails / rolling 24 hours</span>
            </div>
            <div>
              <span className="text-zinc-500 font-medium block mb-1">Default Safe Pacing Delay</span>
              <span className="font-semibold text-emerald-600">50s Min — 80s Max between sends</span>
            </div>
            <div>
              <span className="text-zinc-500 font-medium block mb-1">Default Safe Caps</span>
              <span className="font-semibold text-emerald-600">50 emails/hour • 275 emails/day</span>
            </div>
          </div>
        </div>

        {/* 2. Dynamic Reputation Warning Box (Second) */}
        <div className="rounded-xl border border-zinc-200 bg-red-50/50 p-5 space-y-3 text-black mb-6">
          <h4 className="text-sm font-bold text-red-800 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
            Why Your Sending Limit Might Drop (Google's Rules)
          </h4>
          <p className="text-xs text-zinc-700 leading-relaxed">
            Google's maximum limits of <strong>500 (free Gmail)</strong> and <strong>2,000 (Google Workspace)</strong> are not guaranteed. Google looks at how you send emails and will lower your daily limit if you do any of these things:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-2">
            <div className="p-3 bg-white rounded-lg border border-red-100 space-y-1">
              <span className="font-bold text-zinc-900 block">1. Sending too fast on a new account</span>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                If your account is brand new or hasn't sent emails in a long time, Google blocks sudden large bursts of emails.
              </p>
              <span className="text-[11px] font-semibold text-emerald-700 block bg-emerald-50 px-1.5 py-0.5 rounded w-max mt-1">
                Solution: Start slow and warm up.
              </span>
            </div>
            
            <div className="p-3 bg-white rounded-lg border border-red-100 space-y-1">
              <span className="font-bold text-zinc-900 block">2. Sending to fake or dead emails</span>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                Sending emails that bounce back because the address doesn't exist makes you look like a spammer.
              </p>
              <span className="text-[11px] font-semibold text-emerald-700 block bg-emerald-50 px-1.5 py-0.5 rounded w-max mt-1">
                Solution: Verify and clean your list.
              </span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-red-100 space-y-1">
              <span className="font-bold text-zinc-900 block">3. People marking you as spam</span>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                If recipients manually click "Report Spam", Google immediately drops your sending limit.
              </p>
              <span className="text-[11px] font-semibold text-emerald-700 block bg-emerald-50 px-1.5 py-0.5 rounded w-max mt-1">
                Solution: Only email people who agreed to join.
              </span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-red-100 space-y-1">
              <span className="font-bold text-zinc-900 block">4. Missing domain setup (SPF/DKIM)</span>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                If you haven't verified that you own your domain, Google treats your emails as suspicious.
              </p>
              <span className="text-[11px] font-semibold text-emerald-700 block bg-emerald-50 px-1.5 py-0.5 rounded w-max mt-1">
                Solution: Add SPF & DKIM records.
              </span>
            </div>
          </div>
        </div>

        {/* 3. How to Increase & Restore Your Sending Limits */}
        <div className="rounded-xl border border-zinc-200 bg-emerald-50/30 p-5 space-y-3 text-black mb-6">
          <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600 shrink-0" />
            How to Increase Your Limits & Build Trust (Step-by-Step Guide)
          </h4>
          <p className="text-xs text-zinc-700 leading-relaxed">
            Follow these easy steps to get Google to trust your email account and safely increase your daily sending capacity:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            <div className="p-4 bg-white rounded-lg border border-emerald-100 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">1</span>
                <span className="font-bold text-zinc-900">Setup Domain Verification</span>
              </div>
              <p className="text-zinc-600 leading-relaxed">
                Log into your domain provider (like GoDaddy, Namecheap) and add <strong>SPF, DKIM, and DMARC</strong> records. This proves you are the real owner.
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-emerald-100 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">2</span>
                <span className="font-bold text-zinc-900">Warm Up Slowly</span>
              </div>
              <p className="text-zinc-600 leading-relaxed">
                Don't send hundreds of emails on your first day. Start with 10–20 per day, then increase by 10% daily. This builds a good sender score.
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-emerald-100 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">3</span>
                <span className="font-bold text-zinc-900">Use Paid Google Workspace</span>
              </div>
              <p className="text-zinc-600 leading-relaxed">
                Free accounts (ending in <code>@gmail.com</code>) are limited to 500/day. Paid accounts (like <code>you@yourcompany.com</code>) can send up to 2,000/day.
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-emerald-100 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">4</span>
                <span className="font-bold text-zinc-900">Fixing a Blocked Account</span>
              </div>
              <p className="text-zinc-600 leading-relaxed">
                If Google blocks your limits, stop sending campaigns for 48 hours. Send 5-10 manual emails to friends and ask them to reply to restore trust.
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-emerald-100 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">5</span>
                <span className="font-bold text-zinc-900">Add an Unsubscribe Link</span>
              </div>
              <p className="text-zinc-600 leading-relaxed">
                Always include a clear "Unsubscribe" button in every email. If people can easily leave, they won't report your emails as spam.
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-emerald-100 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">6</span>
                <span className="font-bold text-zinc-900">Personalize Your Emails</span>
              </div>
              <p className="text-zinc-600 leading-relaxed">
                Use tags like <code>{"{{firstName}}"}</code>. Sending the exact same message to thousands of people makes Google flag you as a robot.
              </p>
            </div>

          </div>
        </div>

        {/* 4. Pacing & Rolling Window Grid (Bottom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Box 1: Dynamic Rolling Window */}
          <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] p-5 space-y-2 text-black">
            <h4 className="text-sm font-semibold text-black flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              Rolling 24-Hour Windows
            </h4>
            <p className="text-xs text-zinc-800 leading-relaxed">
              Google doesn't reset limits at midnight. It looks at the last 24 hours. If you reach your limit, you must wait for older emails to expire before you can send more.
            </p>
          </div>

          {/* Box 2: Connection Throttling */}
          <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] p-5 space-y-2 text-black">
            <h4 className="text-sm font-semibold text-black flex items-center gap-2">
              <Gauge className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              Burst Limits & Safe Pacing
            </h4>
            <p className="text-xs text-zinc-800 leading-relaxed">
              Sending too many emails at once triggers safety locks. To protect you, we add a short pause (<strong>50s–80s</strong> per email) so Google doesn't block your connection.
            </p>
          </div>

          {/* Box 3: Reputation-Based Limits */}
          <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] p-5 space-y-2 text-black">
            <h4 className="text-sm font-semibold text-black flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              Reputation & Content Limits
            </h4>
            <p className="text-xs text-zinc-800 leading-relaxed">
              The 500 or 2,000 limits are the maximum possible. If Google notices bad behavior, it will dynamically drop your limit, sometimes restricting you to less than 100 emails a day.
            </p>
          </div>

          {/* Box 4: Shared Capacity */}
          <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] p-5 space-y-2 text-black">
            <h4 className="text-sm font-semibold text-black flex items-center gap-2">
              <UserCheck className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              Shared Inbox Space
            </h4>
            <p className="text-xs text-zinc-800 leading-relaxed">
              Your sending limit is shared. If you send normal emails from your Gmail inbox, or use other apps with the same account, those count towards the same daily limit.
            </p>
          </div>

        </div>

        {/* 4. Warning / Acceptance Clause */}
        <div className="rounded-xl border border-zinc-200 bg-amber-50/50 p-5 flex gap-3.5 text-sm text-black">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-black flex items-center gap-1">Please Note</h4>
            <p className="leading-relaxed text-zinc-800 text-xs">
              While our system spaces out your emails and limits daily sends to keep your account safe, <strong>Google has the final say</strong>. If Google decides to block or pause your email, our system will automatically pause your campaigns to protect your email account from getting banned.
            </p>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
