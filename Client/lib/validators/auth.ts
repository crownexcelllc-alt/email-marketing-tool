import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
    email: z.string().email('Please provide a valid email.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
