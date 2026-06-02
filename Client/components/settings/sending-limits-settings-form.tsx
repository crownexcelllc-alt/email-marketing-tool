'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Info, Mail, MessageSquare, PhoneCall, ChevronUp, ChevronDown, ShieldAlert, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { SettingsFieldError } from '@/components/settings/settings-field-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SendingLimitInfoDialog } from '@/components/campaigns/sending-limit-info-dialog';
import type { SendingLimitsSettings } from '@/lib/types/settings';
import {
  sendingLimitsSettingsSchema,
  type SendingLimitsSettingsFormValues,
} from '@/lib/validators/settings';

interface SendingLimitsSettingsFormProps {
  values: SendingLimitsSettings;
  isSaving?: boolean;
  onSubmit: (values: SendingLimitsSettingsFormValues) => Promise<void>;
}

export function SendingLimitsSettingsForm({
  values,
  isSaving = false,
  onSubmit,
}: SendingLimitsSettingsFormProps) {
  const [showLimitDetails, setShowLimitDetails] = useState(false);
  const [isLimitInfoOpen, setIsLimitInfoOpen] = useState(false);

  const form = useForm<SendingLimitsSettingsFormValues>({
    resolver: zodResolver(sendingLimitsSettingsSchema) as never,
    defaultValues: {
      channel: 'email',
      dailyLimit: '' as any,
      hourlyLimit: '' as any,
      minDelaySeconds: '' as any,
      maxDelaySeconds: '' as any,
      respectSenderLimits: values.respectSenderLimits,
    },
  });

  const selectedChannel = form.watch('channel');

  const currentDailyLimit = form.watch('dailyLimit');
  const currentHourlyLimit = form.watch('hourlyLimit');
  const currentMinDelay = form.watch('minDelaySeconds');
  const currentMaxDelay = form.watch('maxDelaySeconds');

  useEffect(() => {
    form.reset({
      channel: form.getValues('channel') || 'email',
      dailyLimit: '' as any,
      hourlyLimit: '' as any,
      minDelaySeconds: '' as any,
      maxDelaySeconds: '' as any,
      respectSenderLimits: values.respectSenderLimits,
    });
  }, [form, values]);

  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    form.setValue('channel', e.target.value as any);
    form.setValue('dailyLimit', '' as any);
    form.setValue('hourlyLimit', '' as any);
    form.setValue('minDelaySeconds', '' as any);
    form.setValue('maxDelaySeconds', '' as any);
  };

  const handleSubmit = form.handleSubmit(async (formValues) => {
    await onSubmit(formValues as unknown as SendingLimitsSettingsFormValues);
  });

  const channelOverrides = values[selectedChannel as 'email' | 'sms' | 'whatsapp'];

  const parseVal = (val: any, fallback: number) => {
    if (val === undefined || val === null || val === '') return fallback;
    const num = Number(val);
    return isNaN(num) ? fallback : num;
  };

  const activeDailyLimit = parseVal(currentDailyLimit, channelOverrides?.dailyLimit ?? values.dailyLimit ?? 275);
  const activeHourlyLimit = parseVal(currentHourlyLimit, channelOverrides?.hourlyLimit ?? values.hourlyLimit ?? 50);
  const activeMinDelay = parseVal(currentMinDelay, channelOverrides?.minDelaySeconds ?? values.minDelaySeconds ?? 50);
  const activeMaxDelay = parseVal(currentMaxDelay, channelOverrides?.maxDelaySeconds ?? values.maxDelaySeconds ?? 80);

  const isDailyDefault = activeDailyLimit === 275;
  const isHourlyDefault = activeHourlyLimit === 50;
  const isDelayDefault = activeMinDelay === 50 && activeMaxDelay === 80;

  const placeholders = {
    dailyLimit: channelOverrides?.dailyLimit !== undefined
      ? `${channelOverrides.dailyLimit} (custom)`
      : `${values.dailyLimit} (default)`,
    hourlyLimit: channelOverrides?.hourlyLimit !== undefined
      ? `${channelOverrides.hourlyLimit} (custom)`
      : `${values.hourlyLimit} (default)`,
    minDelaySeconds: channelOverrides?.minDelaySeconds !== undefined
      ? `${channelOverrides.minDelaySeconds} (custom)`
      : `${values.minDelaySeconds} (default)`,
    maxDelaySeconds: channelOverrides?.maxDelaySeconds !== undefined
      ? `${channelOverrides.maxDelaySeconds} (custom)`
      : `${values.maxDelaySeconds} (default)`,
  };

  const channelsList = [
    { key: 'email', name: 'Email', icon: Mail },
    { key: 'sms', name: 'SMS', icon: MessageSquare },
    { key: 'whatsapp', name: 'WhatsApp', icon: PhoneCall },
  ];

  const getChannelLimits = (chanKey: 'email' | 'sms' | 'whatsapp') => {
    const overrides = values[chanKey];
    const isCustom = overrides && (
      overrides.dailyLimit !== undefined ||
      overrides.hourlyLimit !== undefined ||
      overrides.minDelaySeconds !== undefined ||
      overrides.maxDelaySeconds !== undefined
    );

    return {
      isCustom,
      dailyLimit: overrides?.dailyLimit ?? values.dailyLimit,
      hourlyLimit: overrides?.hourlyLimit ?? values.hourlyLimit,
      minDelaySeconds: overrides?.minDelaySeconds ?? values.minDelaySeconds,
      maxDelaySeconds: overrides?.maxDelaySeconds ?? values.maxDelaySeconds,
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Section - Default Sending Limits Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50/35 p-4 text-sm text-zinc-900 shadow-sm dark:bg-yellow-950/10 dark:border-yellow-900/30">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500" />
        <div>
          <h4 className="font-semibold text-zinc-900 flex items-center gap-2 flex-wrap w-full">
            <span>Default Sending Limits</span>
            <Badge variant="neutral" className="scale-90 font-normal">Optimized for Google Workspace</Badge>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-yellow-800 hover:text-yellow-950 hover:underline cursor-pointer transition-colors"
              onClick={() => setIsLimitInfoOpen(true)}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Sending Limit Info
            </button>
          </h4>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
            These safe default values are pre-configured to prevent Google Workspace / G Suite SMTP servers from flagging outbound emails as spam or triggering rolling rate limit locks. Custom overrides can be saved for any channel below.
          </p>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
            <div>Default Min Delay: <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">50s</span></div>
            <div>Default Max Delay: <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">80s</span></div>
            <div>Default Daily Limit: <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">275</span></div>
            <div>Default Hourly Limit: <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">50</span></div>
          </div>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="limits-channel">Select Channel</Label>
          <select
            id="limits-channel"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            value={selectedChannel}
            onChange={handleChannelChange}
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="limits-dailyLimit">Daily Limit</Label>
            <Input
              id="limits-dailyLimit"
              type="number"
              min={1}
              placeholder={placeholders.dailyLimit}
              className="border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
              disabled={isSaving}
              {...form.register('dailyLimit')}
            />
            <SettingsFieldError message={form.formState.errors.dailyLimit?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limits-hourlyLimit">Hourly Limit</Label>
            <Input
              id="limits-hourlyLimit"
              type="number"
              min={1}
              placeholder={placeholders.hourlyLimit}
              className="border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
              disabled={isSaving}
              {...form.register('hourlyLimit')}
            />
            <SettingsFieldError message={form.formState.errors.hourlyLimit?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limits-minDelaySeconds">Min Delay (seconds)</Label>
            <Input
              id="limits-minDelaySeconds"
              type="number"
              min={0}
              placeholder={placeholders.minDelaySeconds}
              className="border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
              disabled={isSaving}
              {...form.register('minDelaySeconds')}
            />
            <SettingsFieldError message={form.formState.errors.minDelaySeconds?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limits-maxDelaySeconds">Max Delay (seconds)</Label>
            <Input
              id="limits-maxDelaySeconds"
              type="number"
              min={0}
              placeholder={placeholders.maxDelaySeconds}
              className="border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
              disabled={isSaving}
              {...form.register('maxDelaySeconds')}
            />
            <SettingsFieldError message={form.formState.errors.maxDelaySeconds?.message} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer select-none py-1">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 bg-white text-indigo-600 focus:ring-indigo-500"
            disabled={isSaving}
            {...form.register('respectSenderLimits')}
          />
          Respect individual sender-account limits while scheduling
        </label>

        {selectedChannel === 'email' && (() => {
          let riskLevel: 'safe' | 'moderate' | 'high' | 'critical' = 'safe';
          if (activeDailyLimit > 2000 || activeMinDelay < 30) {
            riskLevel = 'critical';
          } else if (activeDailyLimit > 500 || activeHourlyLimit > 100) {
            riskLevel = 'high';
          } else if (activeDailyLimit > 275 || activeHourlyLimit > 50 || activeMinDelay < 50) {
            riskLevel = 'moderate';
          }

          const config = {
            critical: {
              border: 'border-rose-200',
              bg: 'bg-rose-50/50',
              text: 'text-rose-950',
              btnHover: 'hover:bg-rose-100/30',
              badge: 'border-rose-300 bg-rose-100 text-rose-800',
              chevron: 'text-rose-700',
              iconColor: 'text-rose-600',
              labelText: '💀 CRITICAL RISK',
            },
            high: {
              border: 'border-red-200',
              bg: 'bg-red-50/50',
              text: 'text-red-950',
              btnHover: 'hover:bg-red-100/30',
              badge: 'border-red-300 bg-red-100 text-red-800',
              chevron: 'text-red-700',
              iconColor: 'text-red-600',
              labelText: '🔥 HIGH RISK',
            },
            moderate: {
              border: 'border-amber-200',
              bg: 'bg-amber-50/50',
              text: 'text-amber-950',
              btnHover: 'hover:bg-amber-100/30',
              badge: 'border-amber-300 bg-amber-100 text-amber-800',
              chevron: 'text-amber-700',
              iconColor: 'text-amber-600',
              labelText: '⚠️ MODERATE RISK',
            },
            safe: {
              border: 'border-emerald-200',
              bg: 'bg-emerald-50/50',
              text: 'text-emerald-950',
              btnHover: 'hover:bg-emerald-100/30',
              badge: 'border-emerald-300 bg-emerald-100 text-emerald-800',
              chevron: 'text-emerald-700',
              iconColor: 'text-emerald-600',
              labelText: '✓ SAFE SETTINGS',
            },
          }[riskLevel];

          // Dynamic explanations based on custom limits
          let dailyFeedback = "";
          let dailyRisk = false;
          if (activeDailyLimit > 2000) {
            dailyFeedback = `⚠️ Critical Limit Risk: Your daily limit (${activeDailyLimit}) exceeds Google Workspace's hard cap of 2,000 emails/day, which will trigger immediate delivery rejections and account suspension.`;
            dailyRisk = true;
          } else if (activeDailyLimit > 500) {
            dailyFeedback = `⚠️ High Volume Risk: Your limit (${activeDailyLimit}) is above the free Gmail threshold (500/day). You must use paid Google Workspace accounts, and warm them up slowly to avoid spam flags.`;
            dailyRisk = true;
          } else if (activeDailyLimit > 275) {
            dailyFeedback = `⚠️ Moderate Volume Risk: Your limit (${activeDailyLimit}) is higher than the safe default limit of 275/day. Ensure your domain has established sender reputation before running campaigns.`;
            dailyRisk = true;
          } else {
            dailyFeedback = `✓ Safe Daily Volume: Your limit of ${activeDailyLimit} emails/day is safe and conservative.`;
          }

          let hourlyFeedback = "";
          let hourlyRisk = false;
          if (activeHourlyLimit > 100) {
            hourlyFeedback = `⚠️ High Hourly Speed: Sending ${activeHourlyLimit} emails/hour is too fast. Google's burst filters will likely trigger SMTP code 421 (throttling) or mark incoming messages as spam.`;
            hourlyRisk = true;
          } else if (activeHourlyLimit > 50) {
            hourlyFeedback = `⚠️ Moderate Hourly Speed: Your speed of ${activeHourlyLimit}/hour is above the safe default limit of 50. Emails may be throttled or put in spam if sent too rapidly.`;
            hourlyRisk = true;
          } else {
            hourlyFeedback = `✓ Safe Hourly Speed: Your speed of ${activeHourlyLimit}/hour is safe and mimics natural human pacing.`;
          }

          let delayFeedback = "";
          let delayRisk = false;
          if (activeMinDelay < 30) {
            delayFeedback = `⚠️ Critical Delay Risk: Pacing delay of ${activeMinDelay}s-${activeMaxDelay}s is extremely fast. Delays under 30 seconds mimic automated bot behavior and trigger quick SMTP blocks.`;
            delayRisk = true;
          } else if (activeMinDelay < 50) {
            delayFeedback = `⚠️ Moderate Delay Risk: Pacing delay of ${activeMinDelay}s-${activeMaxDelay}s is slightly fast. We recommend keeping it at least 50 seconds to avoid velocity filter flags.`;
            delayRisk = true;
          } else {
            delayFeedback = `✓ Safe Delay Pacing: Your delay of ${activeMinDelay}s-${activeMaxDelay}s is wide enough to mimic organic sending.`;
          }

          const isDefaultAll = isDailyDefault && isHourlyDefault && isDelayDefault;

          return (
            <div className={`rounded-lg border ${config.border} ${config.bg} overflow-hidden transition-all duration-300 my-4`}>
              <button
                type="button"
                onClick={() => setShowLimitDetails(!showLimitDetails)}
                className={`w-full flex items-center justify-between p-4 text-xs font-semibold ${config.text} ${config.btnHover} transition-all text-left`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ShieldAlert className={`h-4 w-4 ${config.iconColor} shrink-0`} />
                  <span>{"Campaign Delivery Speed & Google SMTP Limits (Active Settings)"}</span>
                  <Badge variant="outline" className={`border ${config.badge} font-semibold px-2 py-0.5 text-[10px]`}>
                    {config.labelText}
                  </Badge>
                </div>
                {showLimitDetails ? (
                  <ChevronUp className={`h-4 w-4 ${config.chevron} shrink-0`} />
                ) : (
                  <ChevronDown className={`h-4 w-4 ${config.chevron} shrink-0`} />
                )}
              </button>

              {showLimitDetails && (
                <div className={`px-4 pb-4 text-xs ${config.text} space-y-2 border-t ${config.border}/50 pt-3`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-zinc-700 py-2 border-b border-zinc-200/50">
                    <div>
                      <span className="text-zinc-500 block">{"Safe Daily Limit:"}</span>
                      <strong className="text-zinc-800">
                        {`${activeDailyLimit} emails / day ${isDailyDefault ? "(Default)" : "(Custom)"}`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">{"Safe Hourly Speed:"}</span>
                      <strong className="text-zinc-800">
                        {`${activeHourlyLimit} emails / hour ${isHourlyDefault ? "(Default)" : "(Custom)"}`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">{"Safe Pacing Delay:"}</span>
                      <strong className="text-emerald-700 font-bold">
                        {`${activeMinDelay}s - ${activeMaxDelay}s delay ${isDelayDefault ? "(Default)" : "(Custom)"}`}
                      </strong>
                    </div>
                  </div>

                  {isDefaultAll ? (
                    <p className="leading-relaxed text-zinc-600">
                      <strong>{"Why we use these limits: "}</strong>
                      {"Google's SMTP servers automatically flag accounts as spam or reject messages if emails are sent in rapid bursts or trigger high bounce rates. These safe defaults prevent your sender accounts from suspension. "}
                      <strong>{"How to increase / restore limits: "}</strong>
                      {"Ensure your domain has SPF/DKIM/DMARC authenticated, keep your list bounce rate below 2%, and warm up new accounts slowly. If your capacity is reduced by Google, stop campaigns for 24-48 hours and send manual emails that get replies to signal organic usage."}
                    </p>
                  ) : (() => {
                    const isCustomSafe = activeDailyLimit <= 275 && activeHourlyLimit <= 50 && activeMinDelay >= 50;

                    if (isCustomSafe) {
                      return (
                        <div className="leading-relaxed text-zinc-600 space-y-3 text-left">
                          <div className="text-emerald-800 font-semibold flex items-center gap-1.5 pt-0.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>{"Custom Limits Set Safely"}</span>
                          </div>
                          
                          <p className="text-xs text-zinc-600">
                            {"Your custom limits are set within the recommended safe guidelines. This is a very conservative and secure setup that will protect your sender accounts from suspension."}
                          </p>

                          <div className="space-y-2.5 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                            <div className="text-xs">
                              <strong className="text-zinc-800 font-semibold">{"Daily Limit Analysis:"}</strong>
                              <span className="block mt-0.5 text-emerald-700 font-medium">
                                {dailyFeedback}
                              </span>
                            </div>
                            <div className="border-t border-zinc-200/60 pt-2 text-xs">
                              <strong className="text-zinc-800 font-semibold">{"Hourly Speed Analysis:"}</strong>
                              <span className="block mt-0.5 text-emerald-700 font-medium">
                                {hourlyFeedback}
                              </span>
                            </div>
                            <div className="border-t border-zinc-200/60 pt-2 text-xs">
                              <strong className="text-zinc-800 font-semibold">{"Pacing Delay Analysis:"}</strong>
                              <span className="block mt-0.5 text-emerald-700 font-medium">
                                {delayFeedback}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="leading-relaxed text-zinc-600 space-y-3 text-left">
                        <div className="text-amber-800 font-semibold flex items-center gap-1.5 pt-0.5">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>{"You have set Custom Limits"}</span>
                        </div>

                        <p className="text-xs text-zinc-600">
                          {"You are currently using custom limits instead of the recommended safe defaults. Google's SMTP servers automatically flag spam patterns and suspend accounts if custom parameters are set too aggressively. Here is how your current settings can affect your delivery:"}
                        </p>

                        <div className="space-y-2.5 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                          <div className="text-xs">
                            <strong className="text-zinc-800 font-semibold">{"Daily Limit Analysis:"}</strong>
                            <span className={`block mt-0.5 ${dailyRisk ? "text-amber-700 font-medium" : "text-emerald-700"}`}>
                              {dailyFeedback}
                            </span>
                          </div>
                          <div className="border-t border-zinc-200/60 pt-2 text-xs">
                            <strong className="text-zinc-800 font-semibold">{"Hourly Speed Analysis:"}</strong>
                            <span className={`block mt-0.5 ${hourlyRisk ? "text-amber-700 font-medium" : "text-emerald-700"}`}>
                              {hourlyFeedback}
                            </span>
                          </div>
                          <div className="border-t border-zinc-200/60 pt-2 text-xs">
                            <strong className="text-zinc-800 font-semibold">{"Pacing Delay Analysis:"}</strong>
                            <span className={`block mt-0.5 ${delayRisk ? "text-amber-700 font-medium" : "text-emerald-700"}`}>
                              {delayFeedback}
                            </span>
                          </div>
                        </div>

                        <div className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-100 text-xs space-y-1.5">
                          <strong className="font-semibold block text-red-950">{"Google's Throttling & Spam Safeguards:"}</strong>
                          <p>
                            {"If Google's servers reject your emails or flag your account as spam under these custom limits, you should immediately revert back to the safe defaults (275 daily limit, 50 hourly limit, 50s-80s pacing delay)."}
                          </p>
                          <p className="font-semibold text-red-900">
                            {"To restore/increase your capacity: (1) Stop campaigns for 24-48 hours. (2) Send manual emails to personal contacts and get replies. (3) Ensure SPF/DKIM/DMARC are properly authenticated. (4) Keep list bounce rate strictly below 2%."}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })()}

        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Sending Limits'}
        </Button>
      </form>

      {/* Bottom Section - Active Channel Limits Status Cards */}
      <div className="mt-8 border-t border-zinc-200 pt-6">
        <h3 className="text-sm font-semibold text-zinc-900">Active Channel Limits</h3>
        <p className="text-xs text-zinc-500 mt-1 mb-4">
          The calculated sending limits currently active for campaigns in each sending channel.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {channelsList.map(({ key, name, icon: Icon }) => {
            const limits = getChannelLimits(key as 'email' | 'sms' | 'whatsapp');
            return (
              <div key={key} className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3 shadow-sm hover:border-zinc-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4.5 w-4.5 text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-900">{name}</span>
                  </div>
                  <Badge variant={limits.isCustom ? 'success' : 'neutral'}>
                    {limits.isCustom ? 'CUSTOM' : 'DEFAULT'}
                  </Badge>
                </div>
                <div className="text-xs text-zinc-600 space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Daily Limit:</span>
                    <span className="font-mono text-zinc-900 font-semibold">{limits.dailyLimit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Hourly Limit:</span>
                    <span className="font-mono text-zinc-900 font-semibold">{limits.hourlyLimit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Delay Range:</span>
                    <span className="font-mono text-zinc-900 font-semibold">{limits.minDelaySeconds}s – {limits.maxDelaySeconds}s</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <SendingLimitInfoDialog open={isLimitInfoOpen} onOpenChange={setIsLimitInfoOpen} />
    </div>
  );
}
