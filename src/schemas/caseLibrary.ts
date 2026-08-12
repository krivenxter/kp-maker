import { z } from 'zod';

export const caseVerificationLevelSchema = z.enum(['confirmed', 'needs-review']);

export const caseLibraryMetricSchema = z.object({
  value: z.string().min(1).max(24),
  label: z.string().min(2).max(100),
  period: z.string().min(1).max(60),
}).strict();

export const caseLibraryItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  company: z.string().min(2).max(80),
  industry: z.enum(['automotive', 'real-estate', 'medical', 'other']),
  products: z.array(z.string().min(1)).min(1),
  description: z.string().min(5).max(240),
  metrics: z.array(caseLibraryMetricSchema).min(1).max(3),
  logo: z.string().regex(/^\/case-logos\/[a-z0-9-]+\.png$/),
  url: z.string().url().or(z.literal('не указано')),
  sourceDeck: z.literal('Calltouch All Products.pptx'),
  sourceSlide: z.number().int().min(1).max(53),
  status: z.enum(['approved', 'draft']),
  verification: z.object({
    level: caseVerificationLevelSchema,
    note: z.string().max(240).optional(),
  }).strict(),
}).strict();

export const caseLibrarySchema = z.array(caseLibraryItemSchema);
export type CaseLibraryItem = z.infer<typeof caseLibraryItemSchema>;
