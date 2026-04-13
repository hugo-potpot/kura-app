import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
