import { z } from 'zod';

export const contactFormSchema = z
  .object({
    fullName: z.string().optional(),
    email: z.string().email('Please provide a valid email.').optional().or(z.literal('')),
    phone: z.string().optional(),
    company: z.string().optional(),
    category: z.string().optional(),
    labels: z.array(z.string()).default([]),
    notes: z.string().optional(),
    subscriptionStatus: z.string().optional(),
  })
  .refine((value) => Boolean(value.email || value.phone), {
    message: 'At least one contact method (email or phone) is required.',
    path: ['email'],
  });

export type ContactFormValues = z.infer<typeof contactFormSchema>;

