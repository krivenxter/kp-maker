import products from '../data/products.json';
import cases from '../data/cases.json';
import type { ProposalDocument } from '../schemas/proposal';
import { selectCases } from './selectCases';

export type OnePagerLayout = 'onepager_standard' | 'onepager_discount';

export function selectOnePagerPlan(proposal: ProposalDocument) {
  return proposal.pricing.plans.find((plan) => plan.recommended) ?? proposal.pricing.plans[0];
}

export function selectOnePagerLayout(proposal: ProposalDocument): OnePagerLayout {
  const plan = selectOnePagerPlan(proposal);
  const hasDiscount = plan?.lineItems.some((item) => (item.finalPrice ?? item.listPrice) < item.listPrice);
  if (proposal.pricing.displayMode === 'full_vs_discount' && hasDiscount) return 'onepager_discount';
  return 'onepager_standard';
}

export function getOnePagerWarnings(proposal: ProposalDocument): string[] {
  const warnings: string[] = [];
  if (`РЕШЕНИЕ ДЛЯ ${proposal.client.name}`.length > 55) warnings.push('Заголовок One-pager должен быть не длиннее 55 символов.');
  if (proposal.cover.subtitle.length > 120) warnings.push('Подзаголовок One-pager должен быть не длиннее 120 символов.');
  if (proposal.project.goal.length > 160) warnings.push('Задача клиента для One-pager должна быть не длиннее 160 символов.');
  if (proposal.products.length > 4) warnings.push('Для One-pager можно выбрать максимум 4 продукта.');
  for (const selected of proposal.products) {
    const product = products.find((item) => item.id === selected.productId);
    if (product && product.shortValue.length > 75) warnings.push(`Ценность продукта «${product.shortName}» слишком длинная для One-pager.`);
  }
  return warnings;
}

export function selectOnePagerCase(proposal: ProposalDocument) {
  const selectedIds = new Set(proposal.caseIds);
  const selectedCases = cases.filter((item) => selectedIds.has(item.id));
  const ranked = selectCases(proposal.client.industry, proposal.products.map((item) => item.productId), 3);
  return ranked.find((item) => selectedIds.has(item.id)) ?? selectedCases[0] ?? proposal.customCases?.[0];
}

export function getOnePagerProducts(proposal: ProposalDocument) {
  return proposal.products
    .map((selected) => products.find((item) => item.id === selected.productId))
    .filter((item): item is (typeof products)[number] => Boolean(item))
    .slice(0, 4);
}

export function getOnePagerBenefits(proposal: ProposalDocument) {
  return getOnePagerProducts(proposal)
    .flatMap((product) => product.benefits.map((benefit) => ({ ...benefit, productId: product.id })))
    .filter((benefit) => benefit.description.length <= 80)
    .slice(0, 3);
}
