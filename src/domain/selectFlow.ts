import flows from '../data/solutionFlows.json';
import products from '../data/products.json';

export type SolutionFlow = {
  id: string;
  productIds: string[];
  headline: string;
  explanation: string;
  steps: Array<{ title: string; description: string; productId: string }>;
  benefits: Array<{ title: string; description: string; productId: string }>;
};

export function selectFlow(productIds: string[]): SolutionFlow {
  const sorted = [...productIds].sort();
  const exact = flows.find((flow) => [...flow.productIds].sort().join('+') === sorted.join('+'));
  if (exact) return exact;

  const selected = products.filter((product) => productIds.includes(product.id));
  const uniqueSteps = new Map<string, { title: string; description: string; productId: string }>();
  selected.forEach((product) => product.flowSteps.forEach((title, index) => {
    if (!uniqueSteps.has(title)) uniqueSteps.set(title, {
      title,
      description: product.offerIncludes[index] ?? product.offerIncludes.at(-1) ?? product.shortValue,
      productId: product.id,
    });
  }));
  const uniqueBenefits = new Map<string, { title: string; description: string; productId: string }>();
  selected.forEach((product) => product.benefits.forEach((benefit) => {
    if (!uniqueBenefits.has(benefit.title)) uniqueBenefits.set(benefit.title, { ...benefit, productId: product.id });
  }));
  return {
    id: `generic:${sorted.join('+')}`,
    productIds,
    headline: selected.length === 1 ? selected[0].shortValue : 'Единый контур обработки обращений и аналитики',
    explanation: selected.map((product) => product.shortValue).join('. '),
    steps: [...uniqueSteps.values()].slice(0, 6),
    benefits: [...uniqueBenefits.values()].slice(0, 4),
  };
}
