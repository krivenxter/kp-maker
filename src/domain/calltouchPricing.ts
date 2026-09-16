import type { PriceLineItem } from '../schemas/pricing';

export type CalltouchTariffType = 'standart' | 'premium' | 'analitics' | 'enterprise';

export type CalltouchRegion = 1 | 2 | 6; // 1: Москва 499, 2: Москва 495, СПб 812 и регионы, 6: Номера 800

export type CalltouchPricingInput = {
  tariff: CalltouchTariffType;
  sessionsPerDay: number; // e.g. 400
  staticPhones: number; // static numbers count e.g. 0
  region: CalltouchRegion; // 1, 2, 6
  hasCallback?: boolean;
  callbackMinutes?: number; // e.g. 300
  hasMachineChecker?: boolean; // автоответчик e.g. false
  periodMonths?: 1 | 3 | 6 | 12;
};

export type CalltouchPricingResult = {
  tariff: CalltouchTariffType;
  monthlySoftware: number;
  monthlyCommunication: number;
  monthlyCallback: number;
  monthlyMachineChecker: number;
  monthlyTotal: number;
  periodMonths: number;
  periodTotal: number;
  includedForwardingMinutes: number;
  lineItems: PriceLineItem[];
};

const staticnum: Record<CalltouchRegion, number> = {
  1: 150,
  2: 200,
  6: 1000,
};

const regKoef: Record<CalltouchRegion, number> = {
  1: 1.2,
  2: 1.8,
  6: 7.0,
};

const AnalitycsPO = 6900;
const AnalitycsLiaison = 0;
const StandartPO = 6900;
const StandartLiaison = 500;
const PremiumPO = 10900;
const PremiumLiaison = 500;
const EnterprisePO = 22650;
const EnterpriseLiaison = 500;

function calculateCallbackCost(minutes: number, tariff: CalltouchTariffType): number {
  if (minutes <= 0) return 0;
  let rate = 0;
  if (tariff === 'analitics') {
    if (minutes <= 499) rate = 11;
    else if (minutes <= 1999) rate = 10;
    else if (minutes <= 3999) rate = 9;
    else rate = 8;
  } else {
    if (minutes <= 1999) rate = 8;
    else if (minutes <= 3999) rate = 7;
    else rate = 6;
  }
  return minutes * rate;
}

export function calculateCalltouchPricing(input: CalltouchPricingInput): CalltouchPricingResult {
  const {
    tariff,
    sessionsPerDay: rawSessions,
    staticPhones: rawPhones,
    region,
    hasCallback = false,
    callbackMinutes = 300,
    hasMachineChecker = false,
    periodMonths = 1,
  } = input;

  const vKoef = Math.max(400, Math.round(rawSessions || 400));
  let phones = Math.max(0, Math.round(rawPhones || 0));

  if (hasCallback) {
    phones += 1;
  }

  let softCost = 0;
  let serviceCost = 0;

  if (tariff === 'analitics') {
    serviceCost = Math.round(phones * staticnum[region]);
    if (vKoef < 450) {
      softCost = AnalitycsPO;
    } else if (vKoef < 5000) {
      softCost = vKoef * (20.125 - vKoef * 0.0016675);
    } else if (vKoef < 30000) {
      softCost = vKoef * (12.765 - vKoef * 0.0001955);
    } else {
      softCost = vKoef * 6.785;
    }
    softCost = Math.floor(Math.floor(softCost) / 100) * 100 + phones * 460;
    serviceCost = Math.floor(serviceCost / 10) * 10;
    if (region === 1) serviceCost += AnalitycsLiaison;

    if (hasCallback) {
      serviceCost = serviceCost + (serviceCost / 100) * 10;
      if (region === 6) serviceCost = 220;
    } else {
      serviceCost = serviceCost + (serviceCost / 100) * 10;
    }
  } else if (tariff === 'standart') {
    let serviceCostParam = 0;
    let softCostParam = 0;
    switch (region) {
      case 1:
        softCostParam = StandartPO;
        serviceCostParam = StandartLiaison;
        break;
      case 2:
        softCostParam = 6000;
        serviceCostParam = 1000;
        break;
      case 6:
        softCostParam = 6000;
        serviceCostParam = 4000;
        break;
    }

    serviceCost = Math.round(Math.max(vKoef * regKoef[region], serviceCostParam) + phones * staticnum[region]);
    if (vKoef < 450) {
      softCost = AnalitycsPO;
    } else if (vKoef < 5000) {
      softCost = vKoef * (20.125 - vKoef * 0.0016675);
    } else if (vKoef < 30000) {
      softCost = vKoef * (12.765 - vKoef * 0.0001955);
    } else {
      softCost = vKoef * 6.785;
    }
    softCost = Math.floor(Math.floor(softCost) / 100) * 100 + phones * 460;
    serviceCost = Math.floor(serviceCost / 10) * 10;

    if (hasCallback) {
      serviceCost = serviceCost + (serviceCost / 100) * 10;
      if (region === 6) {
        serviceCost = Math.max(0, serviceCost - 880);
      }
    } else {
      serviceCost = serviceCost + (serviceCost / 100) * 10;
    }
  } else if (tariff === 'premium') {
    let serviceCostParam = 0;
    let softCostParam = 0;
    switch (region) {
      case 1:
        softCostParam = PremiumPO;
        serviceCostParam = PremiumLiaison;
        break;
      case 2:
        softCostParam = 10900;
        serviceCostParam = 1000;
        break;
      case 6:
        softCostParam = 10900;
        serviceCostParam = 4000;
        break;
    }

    serviceCost = Math.round(Math.max(vKoef * regKoef[region], serviceCostParam) + phones * staticnum[region]);
    const rawSoft = vKoef < 450
      ? softCostParam
      : vKoef < 5000
      ? vKoef * (28.75 - vKoef * 0.002645)
      : vKoef < 30000
      ? vKoef * (16.675 - vKoef * 0.0002415)
      : vKoef * 9.2;
    softCost = Math.floor(rawSoft / 100) * 100 + phones * 460;
    serviceCost = Math.floor(serviceCost / 10) * 10;

    if (hasCallback) {
      serviceCost = serviceCost + (serviceCost / 100) * 10;
      const extraCost = region === 6 ? 0 : 460;
      if (region === 6) {
        softCost += 460;
      } else if (region === 1) {
        serviceCost = serviceCost + extraCost + 165;
      } else {
        serviceCost = serviceCost + extraCost + 220;
      }
      if (region !== 6) {
        serviceCost = Math.max(0, serviceCost - 460);
      }
    } else {
      serviceCost = serviceCost + (serviceCost / 100) * 10;
    }
  } else if (tariff === 'enterprise') {
    let serviceCostParam = 0;
    let softCostParam = 0;
    switch (region) {
      case 1:
        softCostParam = EnterprisePO;
        serviceCostParam = EnterpriseLiaison;
        break;
      case 2:
        softCostParam = 21250;
        serviceCostParam = 1000;
        break;
      case 6:
        softCostParam = 21250;
        serviceCostParam = 4000;
        break;
    }

    serviceCost = Math.round(Math.max(vKoef * regKoef[region], serviceCostParam) + phones * staticnum[region]);
    const rawSoft = vKoef < 450
      ? softCostParam - (softCostParam - 10900)
      : vKoef < 5000
      ? vKoef * (28.75 - vKoef * 0.002645)
      : vKoef < 30000
      ? vKoef * (16.675 - vKoef * 0.0002415)
      : vKoef * 9.2;

    const leads = (vKoef < 1700 ? 5000 : vKoef * 30 * 0.1) + (vKoef < 2000 ? 8500 : vKoef * 30 * 0.15);
    const bigdata = 0;
    const scoring = 10000;

    softCost = Math.floor(rawSoft / 100) * 100 + phones * 460 + (leads + bigdata + scoring) / 2;
    serviceCost = Math.floor(serviceCost / 10) * 10;

    if (hasCallback) {
      serviceCost = serviceCost + (serviceCost / 100) * 10;
      const extraCost = region === 6 ? 0 : 460;
      if (region === 6) {
        softCost += 460;
      } else if (region === 1) {
        serviceCost = serviceCost + extraCost + 165;
      } else {
        serviceCost = serviceCost + extraCost + 220;
      }
    } else {
      serviceCost = serviceCost + (serviceCost / 100) * 10;
    }
  }

  const finalSoftCost = Math.round(softCost);
  const finalServiceCost = Math.round(serviceCost);
  const callbackCost = hasCallback ? calculateCallbackCost(callbackMinutes, tariff) : 0;
  const machineCheckerCost = hasCallback && hasMachineChecker ? 1000 : 0;

  const monthlyTotal = finalSoftCost + finalServiceCost + callbackCost + machineCheckerCost;
  const periodTotal = monthlyTotal * periodMonths;

  let includedForwardingMinutes = 3000;
  if (finalServiceCost <= 4000) includedForwardingMinutes = 3000;
  else if (finalServiceCost <= 7000) includedForwardingMinutes = 5000;
  else if (finalServiceCost <= 12000) includedForwardingMinutes = 10000;
  else if (finalServiceCost <= 23000) includedForwardingMinutes = 20000;
  else includedForwardingMinutes = 40000;

  const tariffTitles: Record<CalltouchTariffType, string> = {
    standart: 'Стандарт',
    premium: 'Премиум',
    analitics: 'Аналитика',
    enterprise: 'Энтерпрайз',
  };

  const lineItems: PriceLineItem[] = [
    {
      id: `line-${Date.now()}-1`,
      productId: tariff === 'analitics' ? 'analytics' : 'calltracking',
      title: `Тариф «${tariffTitles[tariff]}» (ПО Calltouch)`,
      category: 'software',
      billingType: 'recurring',
      quantity: 1,
      unit: 'месяц',
      listPrice: finalSoftCost,
      discountPercent: 0,
      finalPrice: finalSoftCost,
      note: 'НДС не облагается',
    },
    {
      id: `line-${Date.now()}-2`,
      productId: 'calltracking',
      title: tariff === 'analitics' ? 'Услуги связи (статические номера)' : 'Услуги связи (динамический и статический коллтрекинг)',
      category: 'communication',
      billingType: 'recurring',
      quantity: 1,
      unit: 'месяц',
      listPrice: finalServiceCost,
      discountPercent: 0,
      finalPrice: finalServiceCost,
      note: 'Включая НДС',
    },
  ];

  if (hasCallback && callbackCost > 0) {
    lineItems.push({
      id: `line-${Date.now()}-3`,
      productId: 'callback',
      title: `Пакет минут обратного звонка (${callbackMinutes} мин)`,
      category: 'communication',
      billingType: 'recurring',
      quantity: 1,
      unit: 'месяц',
      listPrice: callbackCost,
      discountPercent: 0,
      finalPrice: callbackCost,
      note: 'Включая НДС',
    });
  }

  if (machineCheckerCost > 0) {
    lineItems.push({
      id: `line-${Date.now()}-4`,
      productId: 'callback',
      title: 'Определитель автоответчика',
      category: 'software',
      billingType: 'recurring',
      quantity: 1,
      unit: 'месяц',
      listPrice: machineCheckerCost,
      discountPercent: 0,
      finalPrice: machineCheckerCost,
      note: 'НДС не облагается',
    });
  }

  return {
    tariff,
    monthlySoftware: finalSoftCost,
    monthlyCommunication: finalServiceCost,
    monthlyCallback: callbackCost,
    monthlyMachineChecker: machineCheckerCost,
    monthlyTotal,
    periodMonths,
    periodTotal,
    includedForwardingMinutes,
    lineItems,
  };
}

