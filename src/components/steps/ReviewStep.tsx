import { useMemo, useState } from 'react';
import type { UseFormRegister } from 'react-hook-form';
import cases from '../../data/cases.json';
import type { ProposalDocument } from '../../schemas/proposal';
import { UiIcon } from '../ui/UiIcon';
import { ValidationSummary } from '../export/ValidationSummary';

type Issue = { path: PropertyKey[]; message: string };

type Props = {
  proposal: ProposalDocument;
  register: UseFormRegister<ProposalDocument>;
  issueFor: (path: string) => string | undefined;
  valid: boolean;
  issues: Issue[];
  onePagerWarnings: string[];
  showOnePagerWarnings: boolean;
  onIssueClick: (path: string) => void;
  addCustomCase: () => void;
  recommendCases: () => void;
  toggleCase: (id: string) => void;
  removeCustomCase: (index: number) => void;
  addCustomCaseMetric: (caseIndex: number) => void;
  removeCustomCaseMetric: (caseIndex: number, metricIndex: number) => void;
};

export function ReviewStep(props: Props) {
  const { proposal, register, issueFor, valid, issues, onePagerWarnings, showOnePagerWarnings, onIssueClick, addCustomCase, recommendCases, toggleCase, removeCustomCase, addCustomCaseMetric, removeCustomCaseMetric } = props;
  const [caseQuery, setCaseQuery] = useState('');
  const visibleCases = useMemo(() => {
    const query = caseQuery.trim().toLocaleLowerCase('ru');
    return cases
      .filter((item) => !query || [item.company, item.description, ...item.metrics.flatMap((metric) => [metric.value, metric.label])].join(' ').toLocaleLowerCase('ru').includes(query))
      .sort((a, b) => Number(proposal.caseIds.includes(b.id)) - Number(proposal.caseIds.includes(a.id)) || a.company.localeCompare(b.company, 'ru'));
  }, [caseQuery, proposal.caseIds]);
  return <div className="step-content">
    <div className="section-heading"><span>Шаг 4</span><h1>Проверка и экспорт</h1><p>Перед экспортом проверяются данные, длины текста и обязательные ассеты.</p></div>
    <div className="review-block" data-field-path="caseIds">
      <div><h2>Кейсы</h2><div className="case-actions"><button className="text-button" type="button" onClick={addCustomCase}><UiIcon name="plus" />Добавить вручную</button><button className="text-button" type="button" onClick={recommendCases}>Подобрать автоматически</button></div></div>
      <div className="case-library-toolbar"><input type="search" value={caseQuery} onChange={(event) => setCaseQuery(event.target.value)} placeholder="Поиск по компании, описанию или метрике" aria-label="Поиск по библиотеке кейсов" /><span>{visibleCases.length} из {cases.length}</span></div>
      <div className="case-options">{visibleCases.map((item) => {
        const checked = proposal.caseIds.includes(item.id);
        return <label className={checked ? 'selected' : ''} key={item.id}>
          <input type="checkbox" checked={checked} onChange={() => toggleCase(item.id)} />
          <span className="case-option-heading"><span className="case-logo"><img src={item.logo.replace('/case-logos/', '/case-logos-dark/')} alt="" /></span><b>{item.company}</b></span>
          <span className="case-option-description">{item.description}</span>
          <span className="case-option-metrics">{item.metrics.map((metric, metricIndex) => <span className="case-option-metric" key={`${item.id}-metric-${metricIndex}`}><b>{metric.value}</b> · {metric.label}</span>)}</span>
        </label>;
      })}</div>
      {(proposal.customCases ?? []).map((item, index) => <div className="custom-case-editor" key={item.id}>
        <div className="custom-case-heading"><b>Свой кейс {index + 1}</b><button className="icon-button" type="button" aria-label="Удалить кейс" onClick={() => removeCustomCase(index)}><UiIcon name="close" /></button></div>
        <div className="field-grid two">
          <label className="required-label">Компания *<input required {...register(`customCases.${index}.company` as const)} maxLength={60} placeholder="Название компании" />{issueFor(`customCases.${index}.company`) && <em>{issueFor(`customCases.${index}.company`)}</em>}</label>
          <label><span className="field-label-text">Ссылка <span className="optional-note">необязательно</span></span><input {...register(`customCases.${index}.url` as const)} placeholder="https://calltouch.ru/cases/..." />{issueFor(`customCases.${index}.url`) && <em>{issueFor(`customCases.${index}.url`)}</em>}</label>
        </div>
        <div className="case-metrics-heading"><b>Метрики · {item.metrics.length} из 3</b><button className="text-button" type="button" disabled={item.metrics.length >= 3} onClick={() => addCustomCaseMetric(index)}><UiIcon name="plus" />Добавить метрику</button></div>
        {item.metrics.map((_, metricIndex) => <div className="case-metric-row" key={`${item.id}-metric-${metricIndex}`}>
          <label className="required-label">Значение метрики *<input required {...register(`customCases.${index}.metrics.${metricIndex}.value` as const)} maxLength={20} placeholder="+34%" />{issueFor(`customCases.${index}.metrics.${metricIndex}.value`) && <em>{issueFor(`customCases.${index}.metrics.${metricIndex}.value`)}</em>}</label>
          <label className="required-label">Что означает метрика *<input required {...register(`customCases.${index}.metrics.${metricIndex}.label` as const)} maxLength={80} placeholder="рост конверсии" />{issueFor(`customCases.${index}.metrics.${metricIndex}.label`) && <em>{issueFor(`customCases.${index}.metrics.${metricIndex}.label`)}</em>}</label>
          {item.metrics.length > 1 ? <button className="icon-button case-metric-remove" type="button" aria-label={`Удалить метрику ${metricIndex + 1}`} onClick={() => removeCustomCaseMetric(index, metricIndex)}><UiIcon name="close" /></button> : <span />}
        </div>)}
        <label className="required-label">Описание кейса *<textarea required {...register(`customCases.${index}.description` as const)} maxLength={150} rows={2} placeholder="Что сделали и для какого проекта" />{issueFor(`customCases.${index}.description`) && <em>{issueFor(`customCases.${index}.description`)}</em>}</label>
      </div>)}
      {issueFor('caseIds') && <em className="form-error">{issueFor('caseIds')}</em>}
    </div>
    <ValidationSummary valid={valid} issues={issues} onePagerWarnings={onePagerWarnings} showOnePagerWarnings={showOnePagerWarnings} onIssueClick={onIssueClick} />
  </div>;
}
