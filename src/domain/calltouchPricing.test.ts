import { describe, expect, it } from 'vitest';
import { calculateCalltouchPricing } from './calltouchPricing';

describe('calculateCalltouchPricing', () => {
  it('calculates Standart tariff for Moscow 499 at 400 sessions', () => {
    const result = calculateCalltouchPricing({
      tariff: 'standart',
      sessionsPerDay: 400,
      staticPhones: 0,
      region: 1,
      hasCallback: false,
    });
    expect(result.monthlySoftware).toBe(6900);
    expect(result.monthlyCommunication).toBe(550); // 500 + 10%
    expect(result.monthlyTotal).toBe(7450);
    expect(result.includedForwardingMinutes).toBe(3000);
    expect(result.lineItems.length).toBe(2);
  });

  it('calculates Standart with callback and extra phones', () => {
    const result = calculateCalltouchPricing({
      tariff: 'standart',
      sessionsPerDay: 400,
      staticPhones: 2,
      region: 1,
      hasCallback: true,
      callbackMinutes: 300,
    });
    // Phones = 2 + 1 (callback technical phone) = 3
    // Soft: 6900 + 3 * 460 = 8280
    expect(result.monthlySoftware).toBe(8280);
    // Service: (500 + 3 * 150 = 950) + 10% = 1045 -> round 1045
    expect(result.monthlyCommunication).toBe(1045);
    // Callback: 300 * 8 = 2400
    expect(result.monthlyCallback).toBe(2400);
    expect(result.lineItems.length).toBe(3);
  });

  it('calculates Premium tariff correctly', () => {
    const result = calculateCalltouchPricing({
      tariff: 'premium',
      sessionsPerDay: 1000,
      staticPhones: 1,
      region: 2,
      hasCallback: false,
    });
    expect(result.monthlySoftware).toBeGreaterThan(10900);
    expect(result.monthlyCommunication).toBeGreaterThan(1000);
  });

  it('calculates forwarding minutes ladder according to communication fee', () => {
    // <= 4000: 3000
    const res1 = calculateCalltouchPricing({
      tariff: 'standart',
      sessionsPerDay: 400,
      staticPhones: 0,
      region: 1,
    });
    expect(res1.includedForwardingMinutes).toBe(3000);

    // region 6 (800) with higher communication fee
    const res2 = calculateCalltouchPricing({
      tariff: 'standart',
      sessionsPerDay: 2000,
      staticPhones: 5,
      region: 6,
    });
    expect(res2.monthlyCommunication).toBeGreaterThan(12000);
    expect(res2.includedForwardingMinutes).toBe(20000);
  });
});

