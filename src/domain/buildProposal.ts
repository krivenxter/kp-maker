import { proposalSchema, type ProposalDocument } from '../schemas/proposal';
import { normalizeLineItem } from './pricingCalculator';

export function buildProposal(input: ProposalDocument): ProposalDocument {
  const normalized: ProposalDocument = {
    ...input,
    client: { ...input.client, name: input.client.name.trim(), site: input.client.site.trim() },
    project: {
      ...input.project,
      goal: input.project.goal.trim(),
      summary: input.project.summary.trim(),
      channels: input.project.channels.map((item) => item.trim()).filter(Boolean),
      integrations: input.project.integrations.map((item) => item.trim()).filter(Boolean),
      traffic: (input.project.traffic ?? '').trim(),
      sessions: (input.project.sessions ?? '').trim(),
      channels: (input.project.channels ?? []).map((item) => item.trim()).filter(Boolean),
      crm: (input.project.crm ?? '').trim(),
      currentCalltracking: (input.project.currentCalltracking ?? '').trim(),
      staticPhones: (input.project.staticPhones ?? '').trim(),
      cityCode: (input.project.cityCode ?? '').trim(),
      forwardingTarget: (input.project.forwardingTarget ?? '').trim(),
      requiredModules: (input.project.requiredModules ?? []).map((item) => item.trim()).filter(Boolean),
      integrations: (input.project.integrations ?? []).map((item) => item.trim()).filter(Boolean),
      additionalContext: (input.project.additionalContext ?? '').trim(),
    },
    products: input.products.map((item) => ({ ...item, reason: item.reason.trim() })),
    pricing: {
      ...input.pricing,
      plans: input.pricing.plans.map((plan) => ({
        ...plan,
        lineItems: plan.lineItems.map(normalizeLineItem),
      })),
    },
    customManager: input.customManager ? {
      ...input.customManager,
      firstName: input.customManager.firstName.trim(),
      lastName: input.customManager.lastName.trim(),
      position: input.customManager.position.trim(),
      email: input.customManager.email.trim(),
      phone: input.customManager.phone.trim(),
    } : undefined,
    customCases: input.customCases?.map((item) => ({
      ...item,
      company: item.company.trim(),
      description: item.description.trim(),
      metrics: item.metrics.map((metric) => ({ value: metric.value.trim(), label: metric.label.trim() })),
      url: item.url.trim(),
    })),
  };
  return proposalSchema.parse(normalized);
}

export function validateProposal(input: unknown) {
  return proposalSchema.safeParse(input);
}
