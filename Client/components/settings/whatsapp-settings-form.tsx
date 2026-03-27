'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SettingsFieldError } from '@/components/settings/settings-field-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { WhatsAppSettings } from '@/lib/types/settings';
import {
  type WhatsAppSettingsFormValues,
  whatsappSettingsSchema,
} from '@/lib/validators/settings';

interface WhatsAppSettingsFormProps {
  values: WhatsAppSettings;
  isSaving?: boolean;
  onSubmit: (values: WhatsAppSettingsFormValues) => Promise<void>;
}

export function WhatsAppSettingsForm({
  values,
  isSaving = false,
  onSubmit,
}: WhatsAppSettingsFormProps) {
  const form = useForm<WhatsAppSettingsFormValues>({
    resolver: zodResolver(whatsappSettingsSchema) as never,
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
          <Label htmlFor="wa-businessAccountId">Business Account ID</Label>
          <Input
            id="wa-businessAccountId"
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
            placeholder="123456789012345"
            disabled={isSaving}
            {...form.register('businessAccountId')}
          />
          <SettingsFieldError message={form.formState.errors.businessAccountId?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wa-phoneNumberId">Phone Number ID</Label>
          <Input
            id="wa-phoneNumberId"
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
            placeholder="987654321098765"
            disabled={isSaving}
            {...form.register('phoneNumberId')}
          />
          <SettingsFieldError message={form.formState.errors.phoneNumberId?.message} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="wa-webhookVerifyToken">Webhook Verify Token</Label>
          <Input
            id="wa-webhookVerifyToken"
            type="password"
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
            placeholder="Optional secret"
            disabled={isSaving}
            {...form.register('webhookVerifyToken')}
          />
          <SettingsFieldError message={form.formState.errors.webhookVerifyToken?.message} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="wa-defaultLanguage">Default Template Language</Label>
          <Input
            id="wa-defaultLanguage"
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
            placeholder="en"
            disabled={isSaving}
            {...form.register('defaultLanguage')}
          />
          <SettingsFieldError message={form.formState.errors.defaultLanguage?.message} />
        </div>
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save WhatsApp Config'}
      </Button>
    </form>
  );
}
