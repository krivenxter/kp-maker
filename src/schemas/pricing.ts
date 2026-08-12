import { z } from 'zod';

export const priceCategorySchema = z.enum(['software', 'communication', 'other']);
export const billingTypeSchema = z.enum(['recurring', 'one_time']);

export const priceLineItemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  title: z.string().min(1, 'Укажите название позиции').max(70, 'Название позиции должно быть не длиннее 70 символов'),
  category: priceCategorySchema,
  billingType: billingTypeSchema,
  quantity: z.number().int().positive().default(1),
  unit: z.string().min(1, 'Укажите единицу измерения').max(20, 'Единица измерения должна быть не длиннее 20 символов').default('месяц'),
  listPrice: z.number().int().nonnegative(),
  discountPercent: z.number().min(0).max(100).default(0),
  finalPrice: z.number().int().nonnegative().optional(),
  note: z.string().max(100).default(''),
});

export const tariffPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Укажите название тарифа').max(30, 'Название тарифа должно быть не длиннее 30 символов'),
  recommended: z.boolean().default(false),
  lineItems: z.array(priceLineItemSchema).min(1).max(10),
});

export const pricingSchema = z.object({
  displayMode: z.enum(['final_only', 'full_vs_discount']).default('full_vs_discount'),
  plans: z.array(tariffPlanSchema).min(1).max(3),
  includedMinutes: z.number().int().nonnegative().max(100000).optional(),
});

export type PriceCategory = z.infer<typeof priceCategorySchema>;
export type BillingType = z.infer<typeof billingTypeSchema>;
export type PriceLineItem = z.infer<typeof priceLineItemSchema>;
export type TariffPlan = z.infer<typeof tariffPlanSchema>;
export type Pricing = z.infer<typeof pricingSchema>;
