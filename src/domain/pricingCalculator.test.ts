import { describe, expect, it } from 'vitest';
import { calculateFinalPrice, calculatePlanTotals } from './pricingCalculator';
import type { TariffPlan } from '../schemas/pricing';

const plan: TariffPlan = {
  id: 'test', name: 'Тест', recommended: true,
  lineItems: [
    { id: 'software', productId: 'calltracking', title: 'ПО', category: 'software', billingType: 'recurring', quantity: 1, unit: 'месяц', listPrice: 20000, discountPercent: 25, finalPrice: 15000, note: '' },
    { id: 'communication', productId: 'calltracking', title: 'Связь', category: 'communication', billingType: 'recurring', quantity: 1, unit: 'месяц', listPrice: 5000, discountPercent: 0, finalPrice: 5000, note: '' },
    { id: 'setup', productId: 'analytics', title: 'Настройка', category: 'other', billingType: 'one_time', quantity: 1, unit: 'проект', listPrice: 10000, discountPercent: 10, finalPrice: 9000, note: '' },
  ],
};

describe('pricingCalculator', () => {
  it('считает скидку в целых рублях', () => expect(calculateFinalPrice(plan.lineItems[0])).toBe(15000));
  it('группирует ПО, связь и разовые платежи', () => {
    const totals = calculatePlanTotals(plan);
    expect(totals.monthlySoftware).toBe(15000);
    expect(totals.monthlyCommunication).toBe(5000);
    expect(totals.oneTimeOther).toBe(9000);
    expect(totals.monthlyTotal).toBe(20000);
    expect(totals.oneTimeTotal).toBe(9000);
  });
  it('считает первый и следующие месяцы', () => {
    const totals = calculatePlanTotals(plan);
    expect(totals.firstMonthTotal).toBe(29000);
    expect(totals.nextMonthsTotal).toBe(20000);
  });
  it('рассчитывает лесенку минут переадресации по абонентской плате за связь', async () => {
    const { getForwardingMinutesByCommunicationFee } = await import('./pricingCalculator');
    expect(getForwardingMinutesByCommunicationFee(0)).toBe(3000);
    expect(getForwardingMinutesByCommunicationFee(4000)).toBe(3000);
    expect(getForwardingMinutesByCommunicationFee(4001)).toBe(5000);
    expect(getForwardingMinutesByCommunicationFee(7000)).toBe(5000);
    expect(getForwardingMinutesByCommunicationFee(7001)).toBe(10000);
    expect(getForwardingMinutesByCommunicationFee(12000)).toBe(10000);
    expect(getForwardingMinutesByCommunicationFee(12001)).toBe(20000);
    expect(getForwardingMinutesByCommunicationFee(23000)).toBe(20000);
    expect(getForwardingMinutesByCommunicationFee(23001)).toBe(40000);
    expect(getForwardingMinutesByCommunicationFee(50000)).toBe(40000);
  });
});
