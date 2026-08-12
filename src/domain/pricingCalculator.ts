import type { PriceLineItem, TariffPlan } from '../schemas/pricing';

export type PricingTotals = {
  monthlySoftware: number;
  monthlyCommunication: number;
  monthlyOther: number;
  monthlyTotal: number;
  oneTimeSoftware: number;
  oneTimeCommunication: number;
  oneTimeOther: number;
  oneTimeTotal: number;
  firstMonthTotal: number;
  nextMonthsTotal: number;
  listMonthlyTotal: number;
  listOneTimeTotal: number;
};

export function calculateFinalPrice(item: Pick<PriceLineItem, 'listPrice' | 'discountPercent' | 'quantity'>): number {
  const basisPoints = Math.round(item.discountPercent * 100);
  const discountedUnit = Math.round((item.listPrice * (10000 - basisPoints)) / 10000);
  return discountedUnit * item.quantity;
}

export function normalizeLineItem(item: PriceLineItem): PriceLineItem {
  return { ...item, finalPrice: calculateFinalPrice(item) };
}

export function calculatePlanTotals(plan: TariffPlan): PricingTotals {
  const totals: PricingTotals = {
    monthlySoftware: 0,
    monthlyCommunication: 0,
    monthlyOther: 0,
    monthlyTotal: 0,
    oneTimeSoftware: 0,
    oneTimeCommunication: 0,
    oneTimeOther: 0,
    oneTimeTotal: 0,
    firstMonthTotal: 0,
    nextMonthsTotal: 0,
    listMonthlyTotal: 0,
    listOneTimeTotal: 0,
  };

  for (const rawItem of plan.lineItems) {
    const item = normalizeLineItem(rawItem);
    const finalPrice = item.finalPrice ?? 0;
    const listPrice = item.listPrice * item.quantity;
    const period = item.billingType === 'recurring' ? 'monthly' : 'oneTime';
    const category = item.category === 'software' ? 'Software' : item.category === 'communication' ? 'Communication' : 'Other';
    totals[`${period}${category}` as keyof PricingTotals] += finalPrice;
    if (item.billingType === 'recurring') totals.listMonthlyTotal += listPrice;
    else totals.listOneTimeTotal += listPrice;
  }

  totals.monthlyTotal = totals.monthlySoftware + totals.monthlyCommunication + totals.monthlyOther;
  totals.oneTimeTotal = totals.oneTimeSoftware + totals.oneTimeCommunication + totals.oneTimeOther;
  totals.firstMonthTotal = totals.monthlyTotal + totals.oneTimeTotal;
  totals.nextMonthsTotal = totals.monthlyTotal;
  return totals;
}

export function formatMoney(value: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
}
