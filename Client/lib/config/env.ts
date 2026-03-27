import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
});

const parsed = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

const fallbackApiUrl = 'http://localhost:5000';

export const env = {
  apiUrl: (parsed.NEXT_PUBLIC_API_URL ?? fallbackApiUrl).replace(/\/+$/, ''),
} as const;
