import { z } from 'zod';
import { pricingSchema } from './pricing';

const caseMetricSchema = z.object({
  value: z.string().min(1, 'Укажите значение метрики').max(20, 'Значение метрики должно быть не длиннее 20 символов'),
  label: z.string().min(3, 'Добавьте пояснение метрики').max(80, 'Пояснение метрики должно быть не длиннее 80 символов'),
});

const customCaseSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(2, 'Укажите название компании').max(60),
  description: z.string().min(5, 'Добавьте описание кейса').max(150),
  metrics: z.array(caseMetricSchema).min(1, 'Добавьте хотя бы одну метрику').max(3, 'Можно добавить максимум три метрики'),
  url: z.string().url('Укажите корректную ссылку').or(z.literal('')),
});

export function migrateProposalDocument(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input;
  const migrated = structuredClone(input) as Record<string, unknown>;
  delete migrated.aiEnhancement;
  delete migrated.specialConditions;
  if (migrated.cover && typeof migrated.cover === 'object') delete (migrated.cover as Record<string, unknown>).benefitIds;
  if (Array.isArray(migrated.caseIds)) {
    const legacyCaseIds: Record<string, string> = {
      automir: 'jetour',
      stroygarant: 'dikkit',
      medplus: 'am-medica',
    };
    migrated.caseIds = migrated.caseIds.map((id) => typeof id === 'string' ? (legacyCaseIds[id] ?? id) : id);
  }
  if (!Array.isArray(migrated.customCases)) return migrated;
  migrated.customCases = migrated.customCases.map((rawCase) => {
    if (!rawCase || typeof rawCase !== 'object') return rawCase;
    const caseRecord = rawCase as Record<string, unknown>;
    if (!Array.isArray(caseRecord.metrics) && caseRecord.metric && typeof caseRecord.metric === 'object') {
      caseRecord.metrics = [caseRecord.metric];
      delete caseRecord.metric;
    }
    return caseRecord;
  });
  return migrated;
}

export const proposalSchema = z.object({
  version: z.literal(1),
  client: z.object({
    name: z.string().min(2, 'Укажите название клиента').max(60),
    brandId: z.string().default('neutral'),
    site: z.string().max(100).default(''),
    industry: z.string().min(1, 'Выберите отрасль'),
  }),
  managerId: z.string().min(1, 'Выберите менеджера'),
  customManager: z.object({
    firstName: z.string().max(40),
    lastName: z.string().max(40),
    position: z.string().max(80),
    email: z.string().email('Укажите корректную почту').or(z.literal('')),
    phone: z.string().max(30),
    photoDataUrl: z.string().max(800_000, 'Фотография слишком большая').optional(),
  }).optional(),
  project: z.object({
    goal: z.string().min(5, 'Опишите задачу клиента').max(180),
    summary: z.string().max(220).default(''),
    traffic: z.string().max(60).default(''),
    sessions: z.string().max(40).default(''),
    channels: z.array(z.string().max(40)).max(8).default([]),
    crm: z.string().max(60).default(''),
    currentCalltracking: z.string().max(60).default(''),
    integrations: z.array(z.string().max(40)).max(8).default([]),
    additionalContext: z.string().max(180).default(''),
  }),
  products: z.array(z.object({
    productId: z.string().min(1),
    reason: z.string().min(3, 'Напишите минимум 3 символа: зачем клиенту нужен этот продукт').max(140, 'Описание должно быть не длиннее 140 символов'),
  })).min(1, 'Выберите хотя бы один продукт').max(5),
  pricing: pricingSchema,
  caseIds: z.array(z.string()).max(3),
  customCases: z.array(customCaseSchema).max(3).optional(),
  cover: z.object({
    subtitle: z.string().min(3, 'Добавьте подзаголовок — минимум 3 символа').max(130, 'Подзаголовок должен быть не длиннее 130 символов'),
    backgroundId: z.enum(['prez-bg-1', 'prez-bg-2', 'prez-bg-3', 'prez-bg-4', 'prez-bg-5']).optional(),
  }),
}).superRefine((proposal, context) => {
  const totalCases = proposal.caseIds.length + (proposal.customCases?.length ?? 0);
  if (totalCases < 1) context.addIssue({ code: 'custom', path: ['caseIds'], message: 'Добавьте хотя бы один кейс' });
  if (totalCases > 3) context.addIssue({ code: 'custom', path: ['caseIds'], message: 'Можно добавить максимум три кейса' });
  if (proposal.managerId === 'custom' || proposal.managerId.startsWith('saved:')) {
    const manager = proposal.customManager;
    if (!manager?.firstName.trim()) context.addIssue({ code: 'custom', path: ['customManager', 'firstName'], message: 'Укажите имя' });
    if (!manager?.lastName.trim()) context.addIssue({ code: 'custom', path: ['customManager', 'lastName'], message: 'Укажите фамилию' });
    if (!manager?.position.trim()) context.addIssue({ code: 'custom', path: ['customManager', 'position'], message: 'Укажите должность' });
    if (!manager?.email.trim()) context.addIssue({ code: 'custom', path: ['customManager', 'email'], message: 'Укажите почту' });
    if (!manager?.phone.trim()) context.addIssue({ code: 'custom', path: ['customManager', 'phone'], message: 'Укажите телефон' });
  }
});

export type ProposalDocument = z.infer<typeof proposalSchema>;
