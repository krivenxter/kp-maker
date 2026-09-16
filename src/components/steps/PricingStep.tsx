import { useMemo, useState } from 'react';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { ProposalDocument } from '../../schemas/proposal';
import { calculateFinalPrice, formatMoney } from '../../domain/pricingCalculator';
import { calculateFinalPrice, calculatePlanTotals, formatMoney, getForwardingMinutesByCommunicationFee } from '../../domain/pricingCalculator';
import { calculateCalltouchPricing, type CalltouchPricingResult, type CalltouchRegion, type CalltouchTariffType } from '../../domain/calltouchPricing';
import { CustomSelect } from '../ui/CustomSelect';
import { UiIcon } from '../ui/UiIcon';

type Props = {
  proposal: ProposalDocument;
  register: UseFormRegister<ProposalDocument>;
  setValue: UseFormSetValue<ProposalDocument>;
  issueFor: (path: string) => string | undefined;
  addPlan: () => void;
  removePlan: (index: number) => void;
  addLine: (planIndex: number) => void;
  removeLine: (planIndex: number, lineIndex: number) => void;
};

const REGION_OPTIONS = [
  { value: '1', label: 'Москва (499)' },
  { value: '2', label: 'Москва (495), СПб (812) и регионы' },
  { value: '6', label: 'Номера в коде (800)' },
];

export function PricingStep({ proposal, register, setValue, issueFor, addPlan, removePlan, addLine, removeLine }: Props) {
  // Автоопределение параметров из исходных данных проекта
  const parsedSessions = useMemo(() => {
    const raw = proposal.project?.sessions ?? '';
    const digits = raw.replace(/\D/g, '');
    const num = Number(digits);
    if (!num) return 400;
    return num > 10000 ? Math.max(400, Math.round(num / 30)) : Math.max(400, num);
  }, [proposal.project?.sessions]);

  const parsedStatic = useMemo(() => {
    const raw = proposal.project?.staticPhones ?? '';
    const digits = raw.replace(/\D/g, '');
    return digits ? Number(digits) : 0;
  }, [proposal.project?.staticPhones]);

  const defaultRegion: CalltouchRegion = useMemo(() => {
    const code = proposal.project?.cityCode ?? '';
    if (code.includes('800')) return 6;
    if (code.includes('495') || code.includes('812')) return 2;
    return 1;
  }, [proposal.project?.cityCode]);

  const hasCallbackSelected = useMemo(() => {
    return proposal.products.some((p) => p.productId === 'callback') ||
      Boolean(proposal.project?.requiredModules?.some((m) => m.includes('Обратный звонок') || m.includes('ОЗ')));
  }, [proposal.products, proposal.project?.requiredModules]);

  const [calcTariff, setCalcTariff] = useState<CalltouchTariffType>('standart');
  const [calcSessions, setCalcSessions] = useState<number>(parsedSessions);
  const [calcStatic, setCalcStatic] = useState<number>(parsedStatic);
  const [calcRegion, setCalcRegion] = useState<CalltouchRegion>(defaultRegion);
  const [calcCallback, setCalcCallback] = useState<boolean>(hasCallbackSelected);
  const [calcMinutes, setCalcMinutes] = useState<number>(300);
  const [calcMachineChecker, setCalcMachineChecker] = useState<boolean>(false);
  const [targetPlanIdx, setTargetPlanIdx] = useState<number>(0);

  const calcResult: CalltouchPricingResult = useMemo(() => {
    return calculateCalltouchPricing({
      tariff: calcTariff,
      sessionsPerDay: calcSessions,
      staticPhones: calcStatic,
      region: calcRegion,
      hasCallback: calcCallback,
      callbackMinutes: calcMinutes,
      hasMachineChecker: calcMachineChecker,
    });
  }, [calcTariff, calcSessions, calcStatic, calcRegion, calcCallback, calcMinutes, calcMachineChecker]);

  // Вычисляем рекомендуемые минуты по лесенке связи для текущего рекомендуемого тарифа
  const autoForwardingMinutes = useMemo(() => {
    const recommended = proposal.pricing.plans.find((p) => p.recommended) ?? proposal.pricing.plans[0];
    if (!recommended) return 3000;
    const totals = calculatePlanTotals(recommended);
    return getForwardingMinutesByCommunicationFee(totals.monthlyCommunication);
  }, [proposal.pricing.plans]);

  const applyCalcToTargetPlan = (planIndex: number) => {
    if (!proposal.pricing.plans[planIndex]) return;
    const plans = structuredClone(proposal.pricing.plans);
    const tariffNames: Record<CalltouchTariffType, string> = {
      standart: 'Стандарт',
      premium: 'Премиум',
      analitics: 'Аналитика',
      enterprise: 'Энтерпрайз',
    };
    plans[planIndex].name = tariffNames[calcTariff];
    plans[planIndex].lineItems = calcResult.lineItems.map((item, idx) => ({
      ...item,
      id: `line-${Date.now()}-${idx}`,
    }));
    setValue('pricing.plans', plans, { shouldValidate: true });
    setValue('pricing.includedMinutes', calcResult.includedForwardingMinutes, { shouldValidate: true });
  };

  const addPlanFromCalc = () => {
    if (proposal.pricing.plans.length >= 3) return;
    const tariffNames: Record<CalltouchTariffType, string> = {
      standart: 'Стандарт',
      premium: 'Премиум',
      analitics: 'Аналитика',
      enterprise: 'Энтерпрайз',
    };
    const newPlan = {
      id: `plan-${Date.now()}`,
      name: tariffNames[calcTariff],
      recommended: proposal.pricing.plans.length === 0,
      lineItems: calcResult.lineItems.map((item, idx) => ({
        ...item,
        id: `line-${Date.now()}-${idx}`,
      })),
    };
    setValue('pricing.plans', [...proposal.pricing.plans, newPlan], { shouldValidate: true });
    setValue('pricing.includedMinutes', calcResult.includedForwardingMinutes, { shouldValidate: true });
  };

  return <div className="step-content">
    <div className="section-heading"><span>Шаг 3</span><h1>Расчёт и условия</h1><p>Все итоги считаются автоматически в целых рублях.</p></div>

    {/* Калькулятор цен Calltouch */}
    <section className="calltouch-calc-box">
      <div className="calltouch-calc-header">
        <h3>
          <UiIcon name="check" />
          Калькулятор цен Calltouch
        </h3>
        <a href="https://www.calltouch.ru/pricing/" target="_blank" rel="noreferrer">
          Официальный калькулятор calltouch.ru/pricing ↗
        </a>
      </div>

      <div className="calc-tariff-tabs">
        <button
          type="button"
          className={`calc-tariff-btn ${calcTariff === 'standart' ? 'active' : ''}`}
          onClick={() => setCalcTariff('standart')}
        >
          Стандарт
        </button>
        <button
          type="button"
          className={`calc-tariff-btn ${calcTariff === 'premium' ? 'active' : ''}`}
          onClick={() => setCalcTariff('premium')}
        >
          Премиум
        </button>
        <button
          type="button"
          className={`calc-tariff-btn ${calcTariff === 'analitics' ? 'active' : ''}`}
          onClick={() => setCalcTariff('analitics')}
        >
          Аналитика
        </button>
        <button
          type="button"
          className={`calc-tariff-btn ${calcTariff === 'enterprise' ? 'active' : ''}`}
          onClick={() => setCalcTariff('enterprise')}
        >
          Энтерпрайз
        </button>
      </div>

      <div className="calc-grid">
        <label>
          <span className="field-label-text">Сессий в сутки (посещаемость)</span>
          <input
            type="number"
            min="400"
            step="100"
            value={calcSessions}
            onChange={(e) => setCalcSessions(Math.max(400, Number(e.target.value) || 400))}
          />
        </label>
        <label>
          <span className="field-label-text">Статические номера</span>
          <input
            type="number"
            min="0"
            step="1"
            value={calcStatic}
            onChange={(e) => setCalcStatic(Math.max(0, Number(e.target.value) || 0))}
          />
        </label>
        <label>
          <span className="field-label-text">Регион номеров</span>
          <CustomSelect
            value={String(calcRegion)}
            onChange={(v) => setCalcRegion(Number(v) as CalltouchRegion)}
            options={REGION_OPTIONS}
          />
        </label>
      </div>

      <div className="calc-checkboxes">
        <label className="check">
          <input
            type="checkbox"
            checked={calcCallback}
            onChange={(e) => setCalcCallback(e.target.checked)}
          />
          Обратный звонок (ОЗ)
        </label>

        {calcCallback && (
          <label style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '8px', margin: 0 }}>
            <span style={{ fontSize: '13px', color: '#4d6067' }}>Минут ОЗ:</span>
            <input
              type="number"
              min="100"
              step="50"
              style={{ width: '95px', minHeight: '32px', padding: '5px 8px' }}
              value={calcMinutes}
              onChange={(e) => setCalcMinutes(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
        )}

        <label className="check">
          <input
            type="checkbox"
            disabled={!calcCallback}
            checked={calcMachineChecker && calcCallback}
            onChange={(e) => setCalcMachineChecker(e.target.checked)}
          />
          Определитель автоответчика (+1 000 ₽)
        </label>
      </div>

      <div className="calc-result-panel">
        <div className="calc-stats">
          <div className="calc-stat-item">
            <span>ПО Calltouch</span>
            <b>{formatMoney(calcResult.monthlySoftware)}</b>
          </div>
          <div className="calc-stat-item">
            <span>Услуги связи</span>
            <b>{formatMoney(calcResult.monthlyCommunication)}</b>
          </div>
          {calcResult.monthlyCallback > 0 && (
            <div className="calc-stat-item">
              <span>Пакет минут ОЗ</span>
              <b>{formatMoney(calcResult.monthlyCallback)}</b>
            </div>
          )}
          <div className="calc-stat-item">
            <span>Переадресация (лесенка)</span>
            <b>{calcResult.includedForwardingMinutes.toLocaleString('ru-RU')} мин</b>
          </div>
          <div className="calc-stat-item highlight">
            <span>Итого в месяц</span>
            <b>{formatMoney(calcResult.monthlyTotal)}</b>
          </div>
        </div>

        <div className="calc-apply-group">
          {proposal.pricing.plans.length > 0 && (
            <>
              {proposal.pricing.plans.length > 1 && (
                <CustomSelect
                  value={String(targetPlanIdx)}
                  onChange={(val) => setTargetPlanIdx(Number(val))}
                  options={proposal.pricing.plans.map((p, idx) => ({
                    value: String(idx),
                    label: p.name || `Тариф ${idx + 1}`,
                  }))}
                />
              )}
              <button
                type="button"
                className="button primary"
                onClick={() => applyCalcToTargetPlan(targetPlanIdx)}
              >
                Применить в {proposal.pricing.plans[targetPlanIdx]?.name || `Тариф ${targetPlanIdx + 1}`}
              </button>
            </>
          )}
          {proposal.pricing.plans.length < 3 && (
            <button
              type="button"
              className="button secondary"
              onClick={addPlanFromCalc}
            >
              + Добавить как новый тариф
            </button>
          )}
        </div>
      </div>
    </section>

    <div className="field-grid two">
      <label><span className="field-label-text">Режим цены <span className="required-mark">*</span></span><CustomSelect value={proposal.pricing.displayMode} onChange={(value) => setValue('pricing.displayMode', value as ProposalDocument['pricing']['displayMode'], { shouldValidate: true })} options={[{ value: 'final_only', label: 'Только итоговая цена' }, { value: 'full_vs_discount', label: 'Полная и со скидкой' }]} /></label>
      <label><span className="field-label-text">Включено минут <span className="optional-note">необязательно</span></span><input type="number" {...register('pricing.includedMinutes', { setValueAs: (value) => value === '' ? undefined : Number(value) })} /></label>
      <label>
        <span className="field-label-text">
          Включено минут переадресации{' '}
          <span className="optional-note">
            авто: {autoForwardingMinutes.toLocaleString('ru-RU')} мин по лесенке связи
          </span>
        </span>
        <input
          type="number"
          placeholder={`По тарифу: ${autoForwardingMinutes}`}
          {...register('pricing.includedMinutes', { setValueAs: (value) => value === '' ? undefined : Number(value) })}
        />
      </label>
    </div>

    <div className="plans-heading" data-field-path="pricing.plans"><h2>Тарифы</h2><button className="button secondary" type="button" onClick={addPlan} disabled={proposal.pricing.plans.length >= 3}><UiIcon name="plus" />Добавить тариф</button></div>
    {proposal.pricing.plans.map((plan, planIndex) => <div className="plan-editor" key={plan.id}>
      <div className="plan-title"><label><span className="field-label-text">Название тарифа <span className="required-mark">*</span></span><input {...register(`pricing.plans.${planIndex}.name` as const)} /></label><label className="check"><input type="checkbox" {...register(`pricing.plans.${planIndex}.recommended` as const)} /> Рекомендуемый</label><button className="icon-button" type="button" aria-label="Удалить тариф" onClick={() => removePlan(planIndex)}><UiIcon name="close" /></button></div>
      {plan.lineItems.map((line, lineIndex) => <div className="line-editor" key={line.id}>
        <label className="grow"><span className="field-label-text">Позиция <span className="required-mark">*</span></span><input {...register(`pricing.plans.${planIndex}.lineItems.${lineIndex}.title` as const)} /></label>
        <label><span className="field-label-text">Категория <span className="required-mark">*</span></span><CustomSelect value={line.category} onChange={(value) => setValue(`pricing.plans.${planIndex}.lineItems.${lineIndex}.category` as const, value as typeof line.category, { shouldValidate: true })} options={[{ value: 'software', label: 'ПО' }, { value: 'communication', label: 'Связь' }, { value: 'other', label: 'Другое' }]} /></label>
        <label><span className="field-label-text">Период <span className="required-mark">*</span></span><CustomSelect value={line.billingType} onChange={(value) => setValue(`pricing.plans.${planIndex}.lineItems.${lineIndex}.billingType` as const, value as typeof line.billingType, { shouldValidate: true })} options={[{ value: 'recurring', label: 'Ежемесячно' }, { value: 'one_time', label: 'Разово' }]} /></label>
        <label><span className="field-label-text">Полная цена <span className="required-mark">*</span></span><input type="number" min="0" step="1" {...register(`pricing.plans.${planIndex}.lineItems.${lineIndex}.listPrice` as const, { valueAsNumber: true })} /></label>
        <label><span className="field-label-text">Скидка, % <span className="required-mark">*</span></span><input type="number" min="0" max="100" step="0.01" {...register(`pricing.plans.${planIndex}.lineItems.${lineIndex}.discountPercent` as const, { valueAsNumber: true })} /></label>
        <div className="calculated"><span>Итог</span><b>{formatMoney(calculateFinalPrice(line))}</b></div>
        <button className="icon-button" type="button" aria-label="Удалить позицию" onClick={() => removeLine(planIndex, lineIndex)}><UiIcon name="close" /></button>
      </div>)}
      <button className="text-button" type="button" onClick={() => addLine(planIndex)}><UiIcon name="plus" />Добавить позицию</button>
    </div>)}
    {issueFor('pricing.plans') && <em className="form-error">{issueFor('pricing.plans')}</em>}
  </div>;
}
