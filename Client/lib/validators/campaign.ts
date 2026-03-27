import { z } from 'zod';

export const campaignBuilderSchema = z
  .object({
    name: z.string().min(2, 'Campaign name must be at least 2 characters.'),
    description: z.string().optional(),
    channel: z.enum(['email', 'whatsapp']),
    targetMode: z.enum(['segment', 'contacts']),
    segmentId: z.string().optional(),
    contactIds: z.array(z.string()).default([]),
    senderAccountIds: z.array(z.string()).min(1, 'Select at least one sender account.'),
    templateId: z.string().min(1, 'Select a template.'),
    scheduleMode: z.enum(['now', 'scheduled']),
    timezone: z.string().min(1, 'Timezone is required.'),
    startAt: z.string().optional(),
    sendingWindowStart: z.string().optional(),
    sendingWindowEnd: z.string().optional(),
    dailyCap: z
      .preprocess(
        (value) => {
          if (value === '' || value === null || value === undefined) {
            return undefined;
          }

          if (typeof value === 'number') {
            return value;
          }

          if (typeof value === 'string') {
            const parsed = Number(value);
            return Number.isNaN(parsed) ? undefined : parsed;
          }

          return undefined;
        },
        z.number().int().min(1).optional(),
      )
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (values.targetMode === 'segment' && !values.segmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['segmentId'],
        message: 'Select a segment.',
      });
    }

    if (values.targetMode === 'contacts' && values.contactIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contactIds'],
        message: 'Select at least one contact.',
      });
    }

    if (values.scheduleMode === 'scheduled' && !values.startAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startAt'],
        message: 'Select a start date/time for scheduled campaigns.',
      });
    }
  });

export type CampaignBuilderFormValues = z.infer<typeof campaignBuilderSchema>;

