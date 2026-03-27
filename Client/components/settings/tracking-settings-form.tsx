'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { SettingsFieldError } from '@/components/settings/settings-field-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TrackingSettings } from '@/lib/types/settings';
import {
  trackingSettingsSchema,
  type TrackingSettingsFormValues,
} from '@/lib/validators/settings';

interface TrackingSettingsFormProps {
  values: TrackingSettings;
  isSaving?: boolean;
  onSubmit: (values: TrackingSettingsFormValues) => Promise<void>;
}

export function TrackingSettingsForm({
  values,
  isSaving = false,
  onSubmit,
}: TrackingSettingsFormProps) {
  const form = useForm<TrackingSettingsFormValues>({
    resolver: zodResolver(trackingSettingsSchema) as never,
    defaultValues: values,
  });

  useEffect(() => {
    form.reset(values);
  }, [form, values]);

  const appendUtm = useWatch({
    control: form.control,
    name: 'appendUtm',
  }) ?? false;

  const handleSubmit = form.handleSubmit(async (formValues) => {
    await onSubmit(formValues);
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
            disabled={isSaving}
            {...form.register('trackOpens')}
          />
          Track opens via tracking pixel
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
            disabled={isSaving}
            {...form.register('trackClicks')}
          />
          Track clicks via redirect links
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
            disabled={isSaving}
            {...form.register('appendUtm')}
          />
          Append UTM parameters to tracked links
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tracking-utmSource">UTM Source</Label>
          <Input
            id="tracking-utmSource"
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
            placeholder="marketing-platform"
            disabled={isSaving || !appendUtm}
            {...form.register('utmSource')}
          />
          <SettingsFieldError message={form.formState.errors.utmSource?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tracking-utmMedium">UTM Medium</Label>
          <Input
            id="tracking-utmMedium"
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
            placeholder="campaign"
            disabled={isSaving || !appendUtm}
            {...form.register('utmMedium')}
          />
          <SettingsFieldError message={form.formState.errors.utmMedium?.message} />
        </div>
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Tracking Settings'}
      </Button>
    </form>
  );
}
