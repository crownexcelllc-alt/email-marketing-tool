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
        <div className="rounded-xl border border-zinc-200 bg-red-50/40 p-5 space-y-4 text-black mb-6">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-red-900 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
              Why Google Might Drop Your Daily Limit (Google's Rules)
            </h4>
            <p className="text-xs text-zinc-700 leading-relaxed">
              Google's maximum limits of <strong>500 (free Gmail)</strong> and <strong>2,000 (Google Workspace)</strong> are not guaranteed. Google has an automated AI system that monitors your account activity. If it detects suspicious patterns, it will instantly reduce your limit to protect other users. Here is what triggers Google to lower your capacity:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-white rounded-lg border border-red-100 space-y-2 flex flex-col justify-between">
              <div>
                <span className="font-bold text-zinc-900 block mb-1">1. Brand New Account (No Trust Score)</span>
                <p className="text-zinc-600 leading-relaxed text-[11px]">
                  Even if you buy a premium Google Workspace account (2,000 limit), Google starts you with a low trust score. If you send too many emails on day one, Google treats you as a spammer.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 block bg-emerald-50 px-2 py-0.5 rounded w-max mt-2 border border-emerald-100">
                Rule: Start with 20–30 emails/day and increase slowly.
              </span>
            </div>

            <div className="p-4 bg-white rounded-lg border border-red-100 space-y-2 flex flex-col justify-between">
              <div>
                <span className="font-bold text-zinc-900 block mb-1">2. Sending to Fake/Dead Emails (Bounces)</span>
                <p className="text-zinc-600 leading-relaxed text-[11px]">
                  If you import lists of old or inactive emails, your messages will "bounce" back. High bounce rates tell Google that you bought a random list, causing them to lower your limit immediately.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 block bg-emerald-50 px-2 py-0.5 rounded w-max mt-2 border border-emerald-100">
                Rule: Clean and verify your email list before importing.
              </span>
            </div>

            <div className="p-4 bg-white rounded-lg border border-red-100 space-y-2 flex flex-col justify-between">
              <div>
                <span className="font-bold text-zinc-900 block mb-1">3. People Clicking "Report Spam"</span>
                <p className="text-zinc-600 leading-relaxed text-[11px]">
                  If real users receive your email and manually click the "Report Spam" button, Google's filters notice it instantly. If even 1 or 2 users complain, Google will drop your daily sending limit to under 100.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 block bg-emerald-50 px-2 py-0.5 rounded w-max mt-2 border border-emerald-100">
                Rule: Only email people who agreed to get messages.
              </span>
            </div>

            <div className="p-4 bg-white rounded-lg border border-red-100 space-y-2 flex flex-col justify-between">
              <div>
                <span className="font-bold text-zinc-900 block mb-1">4. Missing Domain Setup (No Ownership proof)</span>
                <p className="text-zinc-600 leading-relaxed text-[11px]">
                  If you send emails using a custom business email (like <code>name@yourcompany.com</code>) but have not proved you own it inside your domain registrar settings, Google treats your emails as suspicious.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 block bg-emerald-50 px-2 py-0.5 rounded w-max mt-2 border border-emerald-100">
                Rule: Add SPF and DKIM records to verify your domain.
              </span>
            </div>
          </div>
        </div>

        {/* 3. How to Increase & Restore Your Sending Limits */}
        <div className="rounded-xl border border-zinc-200 bg-emerald-50/20 p-5 space-y-4 text-black mb-6">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600 shrink-0" />
              How to Increase Your Limits & Build Trust (Step-by-Step Guide)
            </h4>
            <p className="text-xs text-zinc-700 leading-relaxed">
              If your sending limit has been dropped, or you want to safely reach the maximum 2,000 emails/day limit, follow these steps. This builds a permanent high trust score with Google's systems:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

            <div className="p-4 bg-white rounded-lg border border-emerald-100 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">1</span>
                <span className="font-bold text-zinc-900">Setup Domain Verification (SPF, DKIM, DMARC)</span>
              </div>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                Log into the website where you bought your domain (GoDaddy, Namecheap, etc.) and add SPF, DKIM, and DMARC text records. This acts like a verified digital signature, proving you are not a scammer.
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-emerald-100 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">2</span>
                <span className="font-bold text-zinc-900">Warm Up Your Account (Patience is Key)</span>
              </div>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                Never send 2,000 emails on day one. Start by sending 10–20 emails per day, and increase that limit by 10% each day. This slowly teaches Google's AI that your account sends clean, legitimate messages.
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-emerald-100 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">3</span>
                <span className="font-bold text-zinc-900">Use Paid Google Workspace (No Free Gmail)</span>
              </div>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                Free accounts ending in <code>@gmail.com</code> are strictly locked at 500 emails/day. To get the maximum 2,000 emails/day capacity, you must pay for a Google Workspace account (e.g. <code>you@business.com</code>).
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-emerald-100 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">4</span>
                <span className="font-bold text-zinc-900">How to Fix a Blocked or Lowered Limit</span>
              </div>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                If Google restricts you, stop sending campaigns for 48 hours. Send 5–10 manual emails to friends, coworkers, or clients and ask them to write back. Getting replies instantly restores Google's trust in your email.
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-emerald-100 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">5</span>
                <span className="font-bold text-zinc-900">Always Include an Unsubscribe Link</span>
              </div>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                It is always better for a recipient to unsubscribe from your campaign rather than report you as spam. Make the unsubscribe button clear and easy to find at the bottom of every email.
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-emerald-100 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">6</span>
                <span className="font-bold text-zinc-900">Personalize Your Content</span>
              </div>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                Avoid copy-pasting the exact same templates to thousands of users. Use personalization tags like <code>{"{{firstName}}"}</code>. If Google sees identical templates sent to everyone, it flags it as robotic spam.
              </p>
            </div>

          </div>
        </div>

        {/* 4. Pacing & Rolling Window Grid (Bottom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Box 1: Dynamic Rolling Window */}
          <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] p-5 space-y-2 text-black shadow-sm">
            <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              Rolling 24-Hour Windows
            </h4>
            <p className="text-[11px] text-zinc-700 leading-relaxed">
              Google does not reset limits at midnight. Instead, it looks at a sliding 24-hour window. For example, if you send 500 emails at 2:00 PM today, you must wait until 2:00 PM tomorrow for that limit capacity to become available again.
            </p>
          </div>

          {/* Box 2: Connection Throttling */}
          <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] p-5 space-y-2 text-black shadow-sm">
            <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Gauge className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              Burst Limits & Safe Pacing
            </h4>
            <p className="text-[11px] text-zinc-700 leading-relaxed">
              Sending 100 emails within a single minute triggers automated locks. To prevent Google from blocking your connections, our system enforces a safe spacing pause (<strong>50s–80s</strong> per email) to simulate real human typing.
            </p>
          </div>

          {/* Box 3: Reputation-Based Limits */}
          <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] p-5 space-y-2 text-black shadow-sm">
            <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              Reputation & Content Limits
            </h4>
            <p className="text-[11px] text-zinc-700 leading-relaxed">
              The 500 and 2,000 daily limits are the absolute maximum theoretical limits. If Google's AI flags identical templates, bad links, or low email open rates, it will dynamically drop your allowed limit down to less than 100 emails/day.
            </p>
          </div>

          {/* Box 4: Shared Capacity */}
          <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] p-5 space-y-2 text-black shadow-sm">
            <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <UserCheck className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              Shared Inbox Space
            </h4>
            <p className="text-[11px] text-zinc-700 leading-relaxed">
              Your sending limit is shared. If you send normal emails from your Gmail inbox, or use other apps with the same account, those count towards the same daily limit.
            </p>
          </div>

        </div>

        {/* 4. Warning / Acceptance Clause */}
        <div className="rounded-xl border border-zinc-200 bg-amber-50/50 p-5 flex gap-3.5 text-sm text-black">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-black flex items-center gap-1 text-sm">Please Note</h4>
            <p className="leading-relaxed text-zinc-800 text-xs">
              While our system spaces out your emails and limits daily sends to keep your account safe, <strong>Google has the final say</strong>. If Google decides to block or pause your email, our system will automatically pause your campaigns to protect your email account from getting banned.
            </p>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
