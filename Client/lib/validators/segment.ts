import { z } from 'zod';

export const segmentFormSchema = z.object({
  name: z.string().min(2, 'Segment name must be at least 2 characters.'),
  description: z.string().optional(),
  type: z.enum(['static', 'dynamic']).default('static'),
  filterTags: z.array(z.string()).default([]),
  filterStatus: z.array(z.string()).default([]),
});

export type SegmentFormValues = z.infer<typeof segmentFormSchema>;

