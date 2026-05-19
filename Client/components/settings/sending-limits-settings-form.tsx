'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Info, Mail, MessageSquare, PhoneCall } from 'lucide-react';
import { SettingsFieldError } from '@/components/settings/settings-field-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
      <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-900 shadow-sm">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" />
        <div>
          <h4 className="font-semibold text-zinc-900">Default Sending Limits</h4>
          <p className="mt-1 text-zinc-650">
            These system-wide default settings apply to all channels unless specific overrides are saved:
          </p>
          <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-zinc-800">
            <div>Default Min Delay: <span className="font-mono text-zinc-900 font-semibold">15s</span></div>
            <div>Default Max Delay: <span className="font-mono text-zinc-900 font-semibold">30s</span></div>
            <div>Default Daily Limit: <span className="font-mono text-zinc-900 font-semibold">5000</span></div>
            <div>Default Hourly Limit: <span className="font-mono text-zinc-900 font-semibold">500</span></div>
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
    </div>
  );
}
