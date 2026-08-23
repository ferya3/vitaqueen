import { z } from 'zod';

/**
 * One schema, used by the browser form and by the route handler.
 *
 * Client-side validation is a convenience; the server re-validates the same
 * shape because anything that only runs in the browser is advisory at best.
 * Laravel validates a third time — defence in depth is cheap here.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(180),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  topic: z.enum(['general', 'sales', 'export', 'quality', 'career']),
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(20).max(4000),
  locale: z.string().min(2).max(5),
  consent: z.literal(true),
  /** Cloudflare Turnstile token, when the widget is configured. */
  token: z.string().max(2048).optional(),
  /** Honeypot: real users never fill this in. */
  website: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
