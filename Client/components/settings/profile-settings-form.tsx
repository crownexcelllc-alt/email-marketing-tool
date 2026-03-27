'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SettingsFieldError } from '@/components/settings/settings-field-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProfileSettings } from '@/lib/types/settings';
import {
  profileSettingsSchema,
  type ProfileSettingsFormValues,
} from '@/lib/validators/settings';

interface ProfileSettingsFormProps {
  values: ProfileSettings;
  isSaving?: boolean;
  onSubmit: (values: ProfileSettingsFormValues) => Promise<void>;
}

export function ProfileSettingsForm({
  values,
  isSaving = false,
  onSubmit,
}: ProfileSettingsFormProps) {
  const form = useForm<ProfileSettingsFormValues>({
    resolver: zodResolver(profileSettingsSchema) as never,
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
          <Label htmlFor="settings-fullName">Full Name</Label>
          <Input
            id="settings-fullName"
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
            placeholder="Alex Johnson"
            disabled={isSaving}
            {...form.register('fullName')}
          />
          <SettingsFieldError message={form.formState.errors.fullName?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-email">Email</Label>
          <Input
            id="settings-email"
            type="email"
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
            placeholder="alex@company.com"
            disabled={isSaving}
            {...form.register('email')}
          />
          <SettingsFieldError message={form.formState.errors.email?.message} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="settings-timezone">Timezone</Label>
          <Input
            id="settings-timezone"
            className="border-zinc-800 bg-zinc-900 text-zinc-100"
            placeholder="UTC"
            disabled={isSaving}
            {...form.register('timezone')}
          />
          <SettingsFieldError message={form.formState.errors.timezone?.message} />
        </div>
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  );
}
