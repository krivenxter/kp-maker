import { useEffect, useState } from 'react';

const ONBOARDING_STORAGE_KEY = 'calltouch-proposal-onboarding-seen-v1';

type Step = {
  eyebrow: string;
  title: string;
  description: string;
  tip: string;
};

const steps: Step[] = [
  {
    eyebrow: 'Шаг 1 из 4',
    title: 'Начните с клиента',
    description: 'Заполните название, отрасль, сайт и выберите менеджера. Эти данные попадут в презентацию автоматически.',
    tip: 'Можно вернуться к любому шагу — введённые данные сохраняются.',
  },
  {
    eyebrow: 'Шаг 2 из 4',
    title: 'Соберите решение',
    description: 'Выберите продукты и сформулируйте задачу клиента. Конструктор сам соберёт из них структуру КП.',
    tip: 'Используйте поиск по каталогу, если продуктов много.',
  },
  {
    eyebrow: 'Шаг 3 из 4',
    title: 'Настройте условия',
    description: 'Добавьте тарифы, позиции, цены и скидки. Итоги и суммы пересчитаются автоматически.',
    tip: 'Рекомендуемый тариф попадёт в One-pager.',
  },
  {
    eyebrow: 'Шаг 4 из 4',
    title: 'Проверьте и скачайте',
    description: 'Добавьте кейсы, проверьте предупреждения и скачайте готовое КП в PPTX или PDF.',
    tip: 'Черновик сохраняется автоматически, поэтому можно продолжить позже.',
  },
];

function OnboardingIllustration({ step }: { step: number }) {
  return <div className={`onboarding-illustration onboarding-illustration-${step + 1}`} aria-hidden="true">
    <svg viewBox="0 0 440 250" role="presentation">
      <defs>
        <linearGradient id="onboardingGlow" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#19c6e6" />
          <stop offset="1" stopColor="#8b3dff" />
        </linearGradient>
        <filter id="onboardingShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#102027" floodOpacity=".18" />
        </filter>
      </defs>
      <rect className="onboarding-art-bg" x="18" y="18" width="404" height="214" rx="26" />
      {step === 0 && <>
        <circle className="onboarding-art-orb" cx="356" cy="58" r="36" />
        <rect className="onboarding-art-card onboarding-float" x="70" y="52" width="300" height="142" rx="18" filter="url(#onboardingShadow)" />
        <circle className="onboarding-art-avatar onboarding-pulse" cx="112" cy="96" r="22" />
        <rect className="onboarding-art-line" x="150" y="81" width="126" height="10" rx="5" />
        <rect className="onboarding-art-line muted" x="150" y="101" width="174" height="7" rx="3.5" />
        <rect className="onboarding-art-input" x="96" y="138" width="112" height="28" rx="8" />
        <rect className="onboarding-art-input" x="220" y="138" width="112" height="28" rx="8" />
      </>}
      {step === 1 && <>
        <path className="onboarding-art-dash" d="M94 122h252" />
        {[0, 1, 2].map((index) => <g className={`onboarding-product onboarding-product-${index}`} key={index}>
          <rect className="onboarding-art-card" x={62 + index * 108} y="61" width="88" height="122" rx="15" filter="url(#onboardingShadow)" />
          <circle className="onboarding-art-icon" cx={106 + index * 108} cy="92" r="17" />
          <rect className="onboarding-art-line" x={79 + index * 108} y="126" width="54" height="8" rx="4" />
          <rect className="onboarding-art-line muted" x={78 + index * 108} y="144" width="58" height="6" rx="3" />
        </g>)}
        <path className="onboarding-art-check" d="M333 171l10 10 21-25" />
      </>}
      {step === 2 && <>
        <rect className="onboarding-art-card onboarding-float" x="70" y="50" width="300" height="150" rx="18" filter="url(#onboardingShadow)" />
        <rect className="onboarding-art-line" x="96" y="77" width="104" height="11" rx="5.5" />
        <rect className="onboarding-art-input" x="96" y="107" width="248" height="28" rx="8" />
        <rect className="onboarding-art-input" x="96" y="151" width="112" height="28" rx="8" />
        <rect className="onboarding-art-price onboarding-pulse" x="224" y="151" width="120" height="28" rx="8" />
        <path className="onboarding-art-spark" d="M327 44l5 11 11 5-11 5-5 11-5-11-11-5 11-5 5-11Z" />
      </>}
      {step === 3 && <>
        <rect className="onboarding-art-card onboarding-float" x="79" y="45" width="282" height="162" rx="18" filter="url(#onboardingShadow)" />
        <rect className="onboarding-art-line" x="105" y="72" width="118" height="11" rx="5.5" />
        <circle className="onboarding-art-check-circle onboarding-pulse" cx="112" cy="116" r="15" />
        <path className="onboarding-art-check" d="M105 116l5 5 10-12" />
        <rect className="onboarding-art-line muted" x="140" y="111" width="164" height="8" rx="4" />
        <circle className="onboarding-art-check-circle onboarding-pulse" cx="112" cy="154" r="15" />
        <path className="onboarding-art-check" d="M105 154l5 5 10-12" />
        <rect className="onboarding-art-line muted" x="140" y="149" width="134" height="8" rx="4" />
        <rect className="onboarding-art-export" x="248" y="178" width="84" height="17" rx="8.5" />
      </>}
    </svg>
  </div>;
}

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(ONBOARDING_STORAGE_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const finish = () => {
    try { window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '1'); } catch { /* localStorage can be unavailable in private mode */ }
    setOpen(false);
  };

  const restart = () => { setStep(0); setOpen(true); };
  const current = steps[step];

  return <>
    <button className="onboarding-help" type="button" onClick={restart}>Как пользоваться</button>
    {open && <div className="onboarding-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) finish(); }}>
      <section className="onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <button className="onboarding-close" type="button" aria-label="Закрыть онбординг" onClick={finish}>×</button>
        <div className="onboarding-main">
          <OnboardingIllustration step={step} />
          <div className="onboarding-copy">
            <span className="onboarding-eyebrow">{current.eyebrow}</span>
            <h2 id="onboarding-title">{current.title}</h2>
            <p>{current.description}</p>
            <div className="onboarding-tip"><span>✓</span>{current.tip}</div>
          </div>
        </div>
        <div className="onboarding-footer">
          <div className="onboarding-dots" aria-label="Шаг онбординга">{steps.map((item, index) => <button type="button" key={item.title} aria-label={`Перейти к шагу ${index + 1}`} className={index === step ? 'active' : ''} onClick={() => setStep(index)} />)}</div>
          <div className="onboarding-actions">
            {step > 0 && <button className="button ghost-dark" type="button" onClick={() => setStep(step - 1)}>Назад</button>}
            {step < steps.length - 1 ? <button className="button primary" type="button" onClick={() => setStep(step + 1)}>Далее</button> : <button className="button primary" type="button" onClick={finish}>Понятно, поехали</button>}
          </div>
        </div>
      </section>
    </div>}
  </>;
}
