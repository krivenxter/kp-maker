import { useEffect } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
};

interface FeatureItem {
  id: string;
  badge: string;
  title: string;
  description: string;
  details: string[];
  icon: (color: string) => React.ReactNode;
}

const features: FeatureItem[] = [
  {
    id: 'calculator',
    badge: 'Цены и расчеты',
    title: 'Официальный калькулятор тарифов Calltouch',
    description: 'Интерактивный калькулятор встроен прямо в Шаг 3 («Цены и тарифы»), аналогично сайту calltouch.ru/pricing.',
    details: [
      'Выбор тарифа: Старт+, Стандарт, Плюс, Премиум',
      'Выбор региона: Москва и МО, Санкт-Петербург и ЛО, Регионы РФ',
      'Учет типа бизнеса и суточных сессий',
      'Кнопка «Применить в тариф» моментально раскладывает расчет на ПО и связь',
    ],
    icon: (color) => (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="3" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="10" y2="10" />
        <line x1="14" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="10" y2="14" />
        <line x1="14" y1="14" x2="16" y2="14" />
        <line x1="8" y1="18" x2="16" y2="18" />
      </svg>
    ),
  },
  {
    id: 'project-inputs',
    badge: 'Данные клиента',
    title: 'Исходные данные проекта на Шаге 2',
    description: 'Блок исходных данных теперь открыт сразу и содержит все необходимые для КП параметры проекта.',
    details: [
      'Количество статических номеров',
      'Код города (для статики и динамики)',
      'Номер или направление переадресации звонков',
      'Быстрые чипы подключения модулей: Обратный звонок (ОЗ), Email-трекинг, Чаты, Предикт',
    ],
    icon: (color) => (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: 'minutes-ladder',
    badge: 'Связь и дисклеймер',
    title: 'Автоматическая лестница минут переадресации',
    description: 'Включенные минуты рассчитываются автоматически на основе абонентской платы за связь по сетке тарифов.',
    details: [
      '3 000 ₽ → 3 000 мин | 5 000 ₽ → 5 000 мин | 10 000 ₽ → 10 000 мин',
      '20 000 ₽ → 20 000 мин | 40 000 ₽ → 40 000 мин',
      'Динамическая подстановка минут в официальную формулировку условий связи',
      'Синхронизация между тарифом, превью и итоговым файлом PPTX',
    ],
    icon: (color) => (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    id: 'slides',
    badge: 'Презентация и экспорт',
    title: 'Обновленный дизайн и структура слайдов',
    description: 'Все новые параметры проекта и расчета тарифов аккуратно интегрированы в слайды презентации.',
    details: [
      'Слайд 2 («Контекст проекта») наглядно выводит номера, коды, переадресацию и сервисы',
      'Слайд тарифов отображает корректные формулировки и юридические условия',
      '100% совместимость при генерации PowerPoint (.pptx) и PDF',
    ],
    icon: (color) => (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
];

export function WhatsNewModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="whats-new-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="whats-new-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
      >
        <button
          className="whats-new-close"
          type="button"
          aria-label="Закрыть окно"
          onClick={onClose}
        >
          ×
        </button>

        <header className="whats-new-header">
          <div className="whats-new-badge-row">
            <span className="whats-new-version-tag">Версия 1.1</span>
            <span className="whats-new-date-tag">15 сентября 2026</span>
          </div>
          <h2 id="whats-new-title">Что нового в Конструкторе КП</h2>
          <p className="whats-new-subtitle">
            Мы внедрили ключевые обновления по запросам менеджеров, чтобы составление коммерческих предложений стало еще быстрее и точнее.
          </p>
        </header>

        <div className="whats-new-content">
          <div className="whats-new-grid">
            {features.map((item) => (
              <article key={item.id} className="whats-new-card">
                <div className="whats-new-card-header">
                  <div className="whats-new-icon-wrap">{item.icon('#0aa9c4')}</div>
                  <div>
                    <span className="whats-new-card-badge">{item.badge}</span>
                    <h3 className="whats-new-card-title">{item.title}</h3>
                  </div>
                </div>
                <p className="whats-new-card-desc">{item.description}</p>
                <ul className="whats-new-card-list">
                  {item.details.map((detail, idx) => (
                    <li key={idx}>
                      <span className="whats-new-check">✓</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <footer className="whats-new-footer">
          <span className="whats-new-hint">
            Есть предложения по улучшению? Обращайтесь к разработчикам проекта.
          </span>
          <button className="button primary" type="button" onClick={onClose}>
            Отлично, понятно
          </button>
        </footer>
      </section>
    </div>
  );
}
