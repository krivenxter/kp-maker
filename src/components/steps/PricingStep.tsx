import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { ProposalDocument } from '../../schemas/proposal';
import { calculateFinalPrice, formatMoney } from '../../domain/pricingCalculator';
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

export function PricingStep({ proposal, register, setValue, issueFor, addPlan, removePlan, addLine, removeLine }: Props) {
  return <div className="step-content">
    <div className="section-heading"><span>Шаг 3</span><h1>Расчёт и условия</h1><p>Все итоги считаются автоматически в целых рублях.</p></div>
    <div className="field-grid two">
      <label><span className="field-label-text">Режим цены <span className="required-mark">*</span></span><CustomSelect value={proposal.pricing.displayMode} onChange={(value) => setValue('pricing.displayMode', value as ProposalDocument['pricing']['displayMode'], { shouldValidate: true })} options={[{ value: 'final_only', label: 'Только итоговая цена' }, { value: 'full_vs_discount', label: 'Полная и со скидкой' }]} /></label>
      <label><span className="field-label-text">Включено минут <span className="optional-note">необязательно</span></span><input type="number" {...register('pricing.includedMinutes', { setValueAs: (value) => value === '' ? undefined : Number(value) })} /></label>
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
