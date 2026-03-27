'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SettingsFieldError } from '@/components/settings/settings-field-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SmtpSettings } from '@/lib/types/settings';
import { smtpSettingsSchema, type SmtpSettingsFormValues } from '@/lib/validators/settings';

interface SmtpSettingsFormProps {
  values: SmtpSettings;
  isSaving?: boolean;
  onSubmit: (values: SmtpSettingsFormValues) => Promise<void>;
}

export function SmtpSettingsForm({ values, isSaving = false, onSubmit }: SmtpSettingsFormProps) {
  const form = useForm<SmtpSettingsFormValues>({
    resolver: zodResolver(smtpSettingsSchema) as never,
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
          <Label htmlFor="smtp-defaultFromName">From Name</Label>
          <Input
            id="smtp-defaultFromName"
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
            placeholder="Growth Team"
            disabled={isSaving}
            {...form.register('defaultFromName')}
          />
          <SettingsFieldError message={form.formState.errors.defaultFromName?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="smtp-defaultFromEmail">From Email</Label>
          <Input
            id="smtp-defaultFromEmail"
            type="email"
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
            placeholder="updates@company.com"
            disabled={isSaving}
            {...form.register('defaultFromEmail')}
          />
          <SettingsFieldError message={form.formState.errors.defaultFromEmail?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="smtp-replyToEmail">Reply-To Email</Label>
          <Input
            id="smtp-replyToEmail"
            type="email"
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
            placeholder="support@company.com"
            disabled={isSaving}
            {...form.register('replyToEmail')}
          />
          <SettingsFieldError message={form.formState.errors.replyToEmail?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="smtp-providerType">Provider Type</Label>
          <Input
            id="smtp-providerType"
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
            placeholder="smtp / ses / sendgrid"
            disabled={isSaving}
            {...form.register('providerType')}
          />
          <SettingsFieldError message={form.formState.errors.providerType?.message} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
          disabled={isSaving}
          {...form.register('trackReplies')}
        />
        Track inbound replies for email threads
      </label>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save SMTP Settings'}
      </Button>
    </form>
  );
}
