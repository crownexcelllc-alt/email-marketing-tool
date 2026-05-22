'use client';

import { useState } from 'react';
import { 
  HelpCircle, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  Key, 
  Laptop 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface SmtpHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = 'gmail' | 'hostinger';

export function SmtpHelpDialog({ open, onOpenChange }: SmtpHelpDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('gmail');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-100 p-8 md:p-10">
        <DialogHeader className="mb-6">
          <div className="flex items-center gap-2 text-amber-500">
            <HelpCircle className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold">SMTP Configuration Guide</DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            Follow the instructions below to configure SMTP sending for Gmail or Hostinger accounts.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Buttons */}
        <div className="flex border-b border-zinc-800 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('gmail')}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-[2px] flex items-center gap-2 focus:outline-none',
              activeTab === 'gmail'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            )}
          >
            <Laptop className="h-4 w-4" />
            Gmail SMTP
          </button>
          <button
            onClick={() => setActiveTab('hostinger')}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-[2px] flex items-center gap-2 focus:outline-none',
              activeTab === 'hostinger'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            )}
          >
            <Laptop className="h-4 w-4" />
            Hostinger SMTP
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'gmail' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Policy Warning & Step by Step */}
            <div className="lg:col-span-7 space-y-6">
              {/* Gmail Policy Warning Panel */}
              <div className="rounded-lg border border-zinc-200 bg-[#f3f4f6] p-5 flex gap-3 text-sm text-black">
                <ShieldAlert className="h-5 w-5 text-black shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-black mb-1">Gmail SMTP Authentication Policy</h4>
                  <p className="leading-relaxed text-zinc-800">
                    Google restricts applications from logging in directly using your main password. 
                    You <strong>must</strong> set up an <strong>App Password</strong> using 2-Step Verification for SMTP authentication to work.
                  </p>
                </div>
              </div>

              {/* Step by Step instructions */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Configuration Steps
                </h3>
                <ol className="relative border-l border-zinc-800 ml-2.5 pl-6 space-y-5 text-sm text-zinc-300">
                  <li className="relative">
                    <span className="absolute -left-[31px] top-0 flex items-center justify-center w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-300">
                      1
                    </span>
                    <h4 className="font-medium text-zinc-100 mb-1">Enable 2-Step Verification</h4>
                    <p className="text-zinc-400 leading-relaxed">
                      Go to your{' '}
                      <a
                        href="https://myaccount.google.com/security"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-500 hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        Google Security Settings <ExternalLink className="h-3 w-3" />
                      </a>.
                      Under &quot;How you sign in to Google,&quot; select <strong>2-Step Verification</strong> and complete the setup.
                    </p>
                  </li>
                  <li className="relative">
                    <span className="absolute -left-[31px] top-0 flex items-center justify-center w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-300">
                      2
                    </span>
                    <h4 className="font-medium text-zinc-100 mb-1">Generate App Password</h4>
                    <p className="text-zinc-400 leading-relaxed">
                      Return to the Security tab and search for <strong>&quot;App passwords&quot;</strong> in the search bar. 
                      Select <strong>Other (Custom name)</strong>, type <code>Email Marketing Tool</code>, and click <strong>Generate</strong>.
                    </p>
                  </li>
                  <li className="relative">
                    <span className="absolute -left-[31px] top-0 flex items-center justify-center w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-300">
                      3
                    </span>
                    <h4 className="font-medium text-zinc-100 mb-1">Use the 16-character Code</h4>
                    <p className="text-zinc-400 leading-relaxed">
                      Google will show a yellow box containing a 16-character code (e.g. <code>abcd efgh ijkl mnop</code>). 
                      Copy this code immediately. Enter it as your <strong>SMTP Password</strong> in the setup form.
                    </p>
                  </li>
                </ol>
              </div>
            </div>

            {/* Right Column: Connection Parameters, Port options, and Notes */}
            <div className="lg:col-span-5 space-y-4">
              {/* Tech details card */}
              <div className="rounded-lg border border-zinc-200 bg-[#f3f4f6] p-5 space-y-3 text-black">
                <h4 className="text-sm font-semibold text-black flex items-center gap-2">
                  <Key className="h-4 w-4 text-black" />
                  SMTP Connection Parameters
                </h4>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                  <div className="text-zinc-700">SMTP Host</div>
                  <div className="font-mono font-medium text-black">smtp.gmail.com</div>
                  <div className="text-zinc-700">SMTP Port (TLS)</div>
                  <div className="font-mono font-medium text-black">587</div>
                  <div className="text-zinc-700">SMTP Port (SSL)</div>
                  <div className="font-mono font-medium text-black">465</div>
                  <div className="text-zinc-700">Username</div>
                  <div className="font-medium text-black">Your full Gmail address</div>
                  <div className="text-zinc-700">Password</div>
                  <div className="font-medium text-black italic">16-char App Password</div>
                </div>
              </div>

              {/* Recommended ports */}
              <div className="rounded-lg border border-zinc-200 bg-[#f3f4f6] p-5 text-xs text-zinc-800">
                <h5 className="font-semibold text-black mb-1">Recommended Port Options</h5>
                <p className="leading-relaxed">
                  We recommend using Port <strong>587</strong> with TLS encryption. If your hosting environment blocks Port 587, switch to Port <strong>465</strong> with SSL enabled.
                </p>
              </div>

              {/* Important notes */}
              <div className="rounded-lg border border-zinc-200 bg-[#f3f4f6] p-5 text-xs text-zinc-800 space-y-2">
                <h4 className="font-semibold text-black flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-black" />
                  Important Gmail Notes
                </h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Standard free Gmail accounts are limited to sending 500 emails per 24 hours.</li>
                  <li>Google Workspace accounts are limited to 2,000 emails per 24 hours.</li>
                  <li>Do not share your 16-character App Password. You can delete or regenerate it at any time in Google Security settings.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* How Hostinger SMTP Works */}
            <div className="rounded-lg border border-zinc-200 bg-[#f3f4f6] p-5 space-y-3 text-black">
              <h4 className="text-base font-semibold text-black flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-black" />
                How Hostinger SMTP Works
              </h4>
              <p className="text-sm text-zinc-800 leading-relaxed">
                Hostinger allows direct SMTP connections for outgoing mail. Configuring a Hostinger sender identity is simpler than Gmail, as you can typically authenticate using your primary email password directly, provided SMTP is enabled on your email plan.
              </p>
            </div>

            {/* Grid for Steps and parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Setup Steps */}
              <div className="rounded-lg border border-zinc-200 bg-[#f3f4f6] p-5 space-y-4 text-black">
                <h4 className="text-sm font-semibold text-black">Setup Instructions</h4>
                <ul className="space-y-3 text-sm text-zinc-800">
                  <li className="flex gap-2">
                    <span className="font-semibold text-black">1.</span>
                    <span>Access your Hostinger hPanel and navigate to <strong>Emails → Email Accounts</strong>.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-black">2.</span>
                    <span>Verify that your target email account is active and SMTP sending is not suspended.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-black">3.</span>
                    <span>Create a new sender in this platform and enter your email address and main account password.</span>
                  </li>
                </ul>
              </div>

              {/* Connection parameters */}
              <div className="rounded-lg border border-zinc-200 bg-[#f3f4f6] p-5 space-y-3 text-black">
                <h4 className="text-sm font-semibold text-black flex items-center gap-2">
                  <Key className="h-4 w-4 text-black" />
                  Hostinger Connection Parameters
                </h4>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                  <div className="text-zinc-700">SMTP Host</div>
                  <div className="font-mono font-medium text-black">smtp.hostinger.com</div>
                  <div className="text-zinc-700">SMTP Port (SSL)</div>
                  <div className="font-mono font-medium text-black">465 <span className="text-zinc-500 text-[10px]">(Recommended)</span></div>
                  <div className="text-zinc-700">SMTP Port (TLS)</div>
                  <div className="font-mono font-medium text-black">587</div>
                  <div className="text-zinc-700">Username</div>
                  <div className="font-medium text-black">Your full custom domain email</div>
                  <div className="text-zinc-700">Password</div>
                  <div className="font-medium text-black">Your standard email password</div>
                </div>
              </div>
            </div>

            {/* Hostinger specific warnings & best practices */}
            <div className="rounded-lg border border-zinc-200 bg-[#f3f4f6] p-5 text-xs text-zinc-800 space-y-3">
              <h4 className="font-semibold text-black flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-black" />
                Important Hostinger Notes
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
                <li>
                  <strong>SPF/DKIM Records:</strong> For high deliverability, ensure you have configured TXT records for SPF (<code>v=spf1 include:_spf.mail.hostinger.com ~all</code>) and DKIM in your domain DNS zone settings.
                </li>
                <li>
                  <strong>Plan Limits:</strong> Hostinger email limits vary depending on your hosting tier. Hostinger Single/Premium plans usually restrict sending to 200-500 emails/day, whereas Business plans may support higher limits.
                </li>
                <li>
                  <strong>SSL Connection:</strong> We recommend selecting Port <code>465</code> with SSL checked. Hostinger SMTP is highly optimized for SSL over Port 465.
                </li>
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
