'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SettingsFieldError } from '@/components/settings/settings-field-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    defaultValues: values,
  });

  useEffect(() => {
    form.reset(values);
  }, [form, values]);

  const handleSubmit = form.handleSubmit(async (formValues) => {
    await onSubmit(formValues);
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="limits-dailyLimit">Daily Limit</Label>
          <Input
            id="limits-dailyLimit"
            type="number"
            min={1}
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
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
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
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
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
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
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
            disabled={isSaving}
            {...form.register('maxDelaySeconds')}
          />
          <SettingsFieldError message={form.formState.errors.maxDelaySeconds?.message} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
          disabled={isSaving}
          {...form.register('respectSenderLimits')}
        />
        Respect individual sender-account limits while scheduling
      </label>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Sending Limits'}
      </Button>
    </form>
  );
}
