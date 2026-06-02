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
        <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] p-5 space-y-3 text-black mb-6">
          <h4 className="text-sm font-semibold text-black flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0" />
            Why Your Actual Sending Limit Might Be Lower (Not Fixed)
          </h4>
          <p className="text-xs text-zinc-800 leading-relaxed">
            The standard limits of <strong>500 (standard Gmail)</strong> and <strong>2,000 (Google Workspace)</strong> are <strong>not fixed or guaranteed</strong>. Google's SMTP servers dynamically analyze your sending history and reputation, and will decrease your daily sending capacity if they detect any of the following:
          </p>
          <ul className="list-disc pl-5 text-xs text-zinc-800 space-y-1.5 leading-relaxed">
            <li>
              <strong>Lack of Sender History:</strong> New or warmed-down accounts do not have an established reputation. Google restricts these accounts to much lower initial limits, scaling them up gradually as clean emails are regularly sent over time.
            </li>
            <li>
              <strong>High Bounce Rates:</strong> Sending messages to invalid, inactive, or non-existent email addresses indicates poor list hygiene, causing Google's anti-spam algorithms to lower your limit immediately.
            </li>
            <li>
              <strong>Spam Complaints:</strong> If recipients mark your messages as spam or if Google's filters flag suspicious link patterns and wording, Google will dynamically drop your daily limit (sometimes to under 100/day).
            </li>
            <li>
              <strong>Authentication Status:</strong> Senders without verified domain records (SPF, DKIM, DMARC) are treated with high suspicion, leading to heavily restricted SMTP acceptance rates.
            </li>
          </ul>
        </div>

        {/* 3. How to Increase & Restore Your Sending Limits */}
        <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] p-5 space-y-3 text-black mb-6">
          <h4 className="text-sm font-semibold text-black flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
            How to Increase & Restore Your Sending Limits (Beginner Guide)
          </h4>
          <p className="text-xs text-zinc-800 leading-relaxed">
            If Google has lowered your limits or you want to safely scale up to reach the maximum 2,000/day limit, follow these simple and essential steps:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1">
              <strong className="text-zinc-900 block font-semibold">1. Authenticate Your Domain (SPF, DKIM, DMARC)</strong>
              <span className="text-zinc-700 leading-relaxed block">
                Go to your domain registrar (like GoDaddy or Namecheap) and add SPF, DKIM, and DMARC records. This tells Google that you are a verified owner and not a spammer.
              </span>
            </div>
            <div className="space-y-1">
              <strong className="text-zinc-900 block font-semibold">2. Warm Up Your Email Account Slowly</strong>
              <span className="text-zinc-700 leading-relaxed block">
                Do not send hundreds of emails on day one. Start by sending 10-20 emails per day and gradually increase by 10-15% each day. This slowly builds a trust score with Google.
              </span>
            </div>
            <div className="space-y-1">
              <strong className="text-zinc-900 block font-semibold">3. Upgrade to Paid Google Workspace</strong>
              <span className="text-zinc-700 leading-relaxed block">
                Free <code>@gmail.com</code> accounts are strictly capped at 500/day. Upgrading to a paid Google Workspace account (e.g. <code>name@yourcompany.com</code>) increases your max potential limit to 2,000/day.
              </span>
            </div>
            <div className="space-y-1">
              <strong className="text-zinc-900 block font-semibold">4. How to Restore Restrictive Limits</strong>
              <span className="text-zinc-700 leading-relaxed block">
                If Google restricted your capacity, stop sending campaigns for 24-48 hours. Send 5-10 manual emails to friends or colleagues and ask them to reply. Genuine replies tell Google your account is authentic.
              </span>
            </div>
            <div className="space-y-1">
              <strong className="text-zinc-900 block font-semibold">5. Keep Bounces & Complaints Very Low</strong>
              <span className="text-zinc-700 leading-relaxed block">
                Always verify and clean your contact list to keep bounce rates below 2%. Include a clear unsubscribe link so recipients can opt out without marking your emails as spam.
              </span>
            </div>
            <div className="space-y-1">
              <strong className="text-zinc-900 block font-semibold">6. Personalize Every Message</strong>
              <span className="text-zinc-700 leading-relaxed block">
                {"Use variables like "}<code>{"{{firstName}}"}</code>{" or company name. Sending identical copy-paste templates to thousands of users triggers Google's automatic spam filters."}
              </span>
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
              Google does not reset daily sending limits at midnight. Limits are calculated dynamically on a continuous, 
              <strong> rolling 24-hour window</strong>. If you reach your limit, your sender account is restricted 
              until enough time passes for the oldest emails to drop out of the 24-hour window.
            </p>
          </div>

          {/* Box 2: Connection Throttling */}
          <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] p-5 space-y-2 text-black">
            <h4 className="text-sm font-semibold text-black flex items-center gap-2">
              <Gauge className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              Connection & Velocity Throttling
            </h4>
            <p className="text-xs text-zinc-800 leading-relaxed">
              Sending a burst of emails too quickly triggers automated safety locks. Google's SMTP servers look for 
              rapid login/send/logout activity and may temporarily block connections. To safeguard your domain, 
              our platform enforces default pacing delays (<strong>50s–80s</strong> per email) and limits.
            </p>
          </div>

          {/* Box 3: Reputation-Based Limits */}
          <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] p-5 space-y-2 text-black">
            <h4 className="text-sm font-semibold text-black flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              Reputation & Content Limits
            </h4>
            <p className="text-xs text-zinc-800 leading-relaxed">
              The daily limit (up to 2,000 for Google Workspace or 500 for standard Gmail) is a theoretical maximum. 
              If Google's algorithms detect high bounce rates, spam flags, or identical repetitive messages, they will 
              <strong> dynamically lower your account threshold</strong>, sometimes restricting sending to under 100/day.
            </p>
          </div>

          {/* Box 4: Shared Capacity */}
          <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] p-5 space-y-2 text-black">
            <h4 className="text-sm font-semibold text-black flex items-center gap-2">
              <UserCheck className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              Shared Inbox Capacity
            </h4>
            <p className="text-xs text-zinc-800 leading-relaxed">
              All sending capacity is shared globally across the target inbox. If you or your team send regular manual emails, 
              or if other third-party tools are connected to the same Google account, those messages count toward the same 
              rolling limit, reducing the total available capacity for marketing campaigns.
            </p>
          </div>

        </div>

        {/* 4. Warning / Acceptance Clause */}
        <div className="rounded-xl border border-zinc-200 bg-[#f3f4f6] p-5 flex gap-3.5 text-sm text-black">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-black flex items-center gap-1">Final Delivery & Acceptance Control</h4>
            <p className="leading-relaxed text-zinc-800 text-xs">
              <strong>Please Note:</strong> While our platform manages sending schedules, pacing delays, and daily limits to align 
              with best practices, the final acceptance and delivery of emails are ultimately controlled by Google's SMTP policies 
              and reputation systems. 
            </p>
            <p className="leading-relaxed text-zinc-500 text-[11px] pt-1">
              If Google restricts your account or rejects a message, our platform dynamically pauses the campaign to protect 
              your domain reputation, permitting resumption once the rolling window resets.
            </p>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
