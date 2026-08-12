import { z } from 'zod';

export const productSchema = z.object({
  id: z.string(),
  name: z.string().max(60),
  shortName: z.string().max(45),
  shortValue: z.string().max(120),
  problemTags: z.array(z.string()),
  industryTags: z.array(z.string()),
  icon: z.string().optional(),
  offerIncludes: z.array(z.string()),
  benefits: z.array(z.object({ title: z.string(), description: z.string() })),
  flowSteps: z.array(z.string()),
  approvedMetrics: z.array(z.object({
    id: z.string(),
    value: z.string(),
    label: z.string(),
    allowedForCover: z.boolean(),
  })),
});

export type Product = z.infer<typeof productSchema>;
