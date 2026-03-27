import { z } from 'zod';

const optionalNumberSchema = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }

    return value;
  },
  z.number().int().min(0).optional(),
);

const baseSenderAccountSchema = z.object({
  type: z.enum(['email', 'whatsapp']),
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  status: z.string().optional(),

  email: z.string().email('Please provide a valid sender email.').optional(),
  providerType: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().int().min(1, 'SMTP port must be valid.').optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  secure: z.boolean().optional(),
  dailyLimit: optionalNumberSchema,
  hourlyLimit: optionalNumberSchema,
  minDelaySeconds: optionalNumberSchema,
  maxDelaySeconds: optionalNumberSchema,

  phoneNumber: z.string().optional(),
  businessAccountId: z.string().optional(),
  phoneNumberId: z.string().optional(),
  accessToken: z.string().optional(),
  webhookVerifyToken: z.string().optional(),
});

function requireField(
  value: string | undefined,
  ctx: z.RefinementCtx,
  path: string,
  message: string,
): void {
  if (!value || value.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message,
    });
  }
}

export function buildSenderAccountSchema(options: { requireSecrets: boolean }) {
  return baseSenderAccountSchema.superRefine((value, ctx) => {
    if (value.type === 'email') {
      requireField(value.email, ctx, 'email', 'Sender email is required.');
      requireField(value.smtpHost, ctx, 'smtpHost', 'SMTP host is required.');
      requireField(value.smtpUser, ctx, 'smtpUser', 'SMTP user is required.');

      if (!value.smtpPort) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['smtpPort'],
          message: 'SMTP port is required.',
        });
      }

      if (options.requireSecrets) {
        requireField(value.smtpPass, ctx, 'smtpPass', 'SMTP password is required.');
      }
    }

    if (value.type === 'whatsapp') {
      requireField(value.phoneNumber, ctx, 'phoneNumber', 'Phone number is required.');
      requireField(value.phoneNumberId, ctx, 'phoneNumberId', 'Phone number ID is required.');

      if (options.requireSecrets) {
        requireField(value.accessToken, ctx, 'accessToken', 'Access token is required.');
        requireField(
          value.webhookVerifyToken,
          ctx,
          'webhookVerifyToken',
          'Webhook verify token is required.',
        );
      }
    }
  });
}

export const createSenderAccountSchema = buildSenderAccountSchema({ requireSecrets: true });
export const updateSenderAccountSchema = buildSenderAccountSchema({ requireSecrets: false });
export type SenderAccountFormValues = z.infer<typeof baseSenderAccountSchema>;

