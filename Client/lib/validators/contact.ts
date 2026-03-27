import { z } from 'zod';

export const contactFormSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    fullName: z.string().optional(),
    email: z.string().email('Please provide a valid email.').optional().or(z.literal('')),
    phone: z.string().optional(),
    company: z.string().optional(),
    tags: z.array(z.string()).default([]),
    source: z.string().optional(),
    notes: z.string().optional(),
    subscriptionStatus: z.string().optional(),
  })
  .refine((value) => Boolean(value.email || value.phone), {
    message: 'At least one contact method (email or phone) is required.',
    path: ['email'],
  });

export type ContactFormValues = z.infer<typeof contactFormSchema>;

