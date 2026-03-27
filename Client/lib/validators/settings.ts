import { z } from 'zod';

const nonNegativeInteger = z.coerce
  .number()
  .int('Must be a whole number.')
  .min(0, 'Cannot be negative.');

const positiveInteger = z.coerce
  .number()
  .int('Must be a whole number.')
  .min(1, 'Must be at least 1.');

export const profileSettingsSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().trim().email('Please provide a valid email address.'),
  timezone: z.string().trim().min(2, 'Timezone is required.'),
});

export const smtpSettingsSchema = z.object({
  defaultFromName: z.string().trim().min(2, 'From name is required.'),
  defaultFromEmail: z.string().trim().email('Please provide a valid sender email.'),
  replyToEmail: z.string().trim().email('Please provide a valid reply-to email.').or(z.literal('')),
  providerType: z.string().trim().max(80),
  trackReplies: z.boolean(),
});

export const whatsappSettingsSchema = z.object({
  businessAccountId: z.string().trim().max(120),
  phoneNumberId: z.string().trim().max(120),
  webhookVerifyToken: z.string().trim().max(200),
  defaultLanguage: z.string().trim().min(2, 'Default language is required.'),
});

export const sendingLimitsSettingsSchema = z
  .object({
    dailyLimit: positiveInteger,
    hourlyLimit: positiveInteger,
    minDelaySeconds: nonNegativeInteger,
    maxDelaySeconds: nonNegativeInteger,
    respectSenderLimits: z.boolean(),
  })
  .refine((value) => value.maxDelaySeconds >= value.minDelaySeconds, {
    message: 'Max delay must be greater than or equal to min delay.',
    path: ['maxDelaySeconds'],
  });

export const trackingSettingsSchema = z.object({
  trackOpens: z.boolean(),
  trackClicks: z.boolean(),
  appendUtm: z.boolean(),
  utmSource: z.string().trim().max(80),
  utmMedium: z.string().trim().max(80),
});

export type ProfileSettingsFormValues = z.infer<typeof profileSettingsSchema>;
export type SmtpSettingsFormValues = z.infer<typeof smtpSettingsSchema>;
export type WhatsAppSettingsFormValues = z.infer<typeof whatsappSettingsSchema>;
export type SendingLimitsSettingsFormValues = z.infer<typeof sendingLimitsSettingsSchema>;
export type TrackingSettingsFormValues = z.infer<typeof trackingSettingsSchema>;
