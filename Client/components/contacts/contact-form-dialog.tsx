'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Contact } from '@/lib/types/contact';
import { contactFormSchema, type ContactFormValues } from '@/lib/validators/contact';

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  categoryOptions?: string[];
  isSubmitting?: boolean;
  onSubmit: (values: ContactFormValues) => Promise<void>;
}

const VALID_SUBSCRIPTION_STATUSES = new Set([
  'subscribed',
  'pending',
  'unsubscribed',
  'suppressed',
]);

function normalizeSubscriptionStatus(value: string | undefined): string {
  if (value && VALID_SUBSCRIPTION_STATUSES.has(value)) {
    return value;
  }

  return 'subscribed';
}

function getDefaultValues(contact?: Contact | null): ContactFormValues {
  return {
    fullName: contact?.fullName ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    company: contact?.company ?? '',
    category: contact?.category ?? contact?.labels?.[0] ?? '',
    labels: contact?.labels ?? [],
    notes: contact?.notes ?? '',
    subscriptionStatus: normalizeSubscriptionStatus(contact?.subscriptionStatus),
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-rose-400">{message}</p>;
}

function parseLabels(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  categoryOptions = [],
  isSubmitting = false,
  onSubmit,
}: ContactFormDialogProps) {
  const isEdit = Boolean(contact);
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema) as never,
    defaultValues: getDefaultValues(contact),
  });

  const labels = useWatch({
    control: form.control,
    name: 'labels',
  }) ?? [];

  useEffect(() => {
    form.reset(getDefaultValues(contact));
  }, [contact, form, open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
          <DialogDescription>
            Manage contact details, category, labels, and subscription metadata.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
                {...form.register('fullName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
                {...form.register('email')}
              />
              <FieldError message={form.formState.errors.email?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
                {...form.register('phone')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
                {...form.register('company')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                {...form.register('category')}
              >
                <option value="">Select category</option>
                {categoryOptions.map((categoryOption) => (
                  <option key={categoryOption} value={categoryOption}>
                    {categoryOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionStatus">Subscription Status</Label>
              <select
                id="subscriptionStatus"
                className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
                {...form.register('subscriptionStatus')}
              >
                <option value="subscribed">Subscribed</option>
                <option value="pending">Pending</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="suppressed">Suppressed</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="labels">Labels</Label>
              <Input
                id="labels"
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
                placeholder="newsletter, high_priority"
                value={labels.join(', ')}
                onChange={(event) => {
                  form.setValue('labels', parseLabels(event.target.value), {
                    shouldDirty: true,
                    shouldValidate: false,
                  });
                }}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                rows={3}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                {...form.register('notes')}
              />
            </div>
          </div>

          <FieldError message={form.formState.errors.root?.message} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
