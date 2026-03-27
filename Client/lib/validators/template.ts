import { z } from 'zod';

export const templateFormSchema = z.object({
  type: z.enum(['email', 'whatsapp']),
  name: z.string().min(2, 'Template name must be at least 2 characters.'),
  subject: z.string().min(1, 'Subject is required.'),
  body: z.string().min(1, 'Body is required.'),
  status: z.string().optional(),
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;

