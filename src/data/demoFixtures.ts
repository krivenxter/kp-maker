import type { ProposalDocument } from '../schemas/proposal';

const baseProject = {
  goal: 'Понять окупаемость рекламы и связать обращения с продажами в CRM',
  summary: 'Клиенту важно видеть путь от рекламного источника до сделки и оперативно контролировать качество обращений.',
  traffic: 'Контекст, органика и социальные сети',
  sessions: '500 сессий в месяц',
  channels: ['Яндекс Директ', 'ВКонтакте', 'Авито'],
  crm: 'Битрикс24',
  currentCalltracking: 'Не используется',
  integrations: ['Яндекс Директ', 'ВК Реклама', 'Битрикс24'],
  additionalContext: 'Пилотный запуск на одном направлении',
};

export const demoFixtures: Array<{ id: string; name: string; proposal: ProposalDocument }> = [
  {
    id: 'automotive-two-products',
    name: 'EXLANTIX — готовое КП со скидкой',
    proposal: {
      version: 1,
      presentationTheme: 'dark',
      client: { name: 'EXLANTIX', brandId: 'exlantix', site: 'exlantix.ru', industry: 'automotive' },
      managerId: 'ivan-petrov',
      project: baseProject,
      products: [
        { productId: 'calltracking', reason: 'Определит рекламный источник каждого звонка и сохранит запись обращения.' },
        { productId: 'analytics', reason: 'Свяжет расходы, обращения и сделки в CRM для расчёта ROI по каналам.' },
      ],
      pricing: {
        displayMode: 'full_vs_discount',
        includedMinutes: 300,
        plans: [{
          id: 'standard', name: 'Стандарт', recommended: true,
          lineItems: [
            { id: 'ct-software', productId: 'calltracking', title: 'Коллтрекинг и аналитика', category: 'software', billingType: 'recurring', quantity: 1, unit: 'месяц', listPrice: 31250, discountPercent: 20, finalPrice: 25000, note: '' },
            { id: 'communication', productId: 'calltracking', title: 'Услуги связи', category: 'communication', billingType: 'recurring', quantity: 1, unit: 'месяц', listPrice: 6250, discountPercent: 20, finalPrice: 5000, note: '' },
            { id: 'setup', productId: 'analytics', title: 'Настройка интеграции', category: 'other', billingType: 'one_time', quantity: 1, unit: 'проект', listPrice: 10000, discountPercent: 0, finalPrice: 10000, note: '' }
          ],
        }],
      },
      caseIds: ['jetour', 'dikkit', 'am-medica'],
      cover: { subtitle: 'Коллтрекинг и сквозная аналитика для контроля маркетинга и продаж' },
    },
  },
  {
    id: 'neutral-single-product',
    name: 'Новый клиент — простое КП',
    proposal: {
      version: 1,
      presentationTheme: 'dark',
      client: { name: 'Новый клиент', brandId: 'neutral', site: '', industry: 'other' },
      managerId: 'ivan-petrov',
      project: { ...baseProject, goal: 'Определять, какая реклама приводит звонки', summary: '', crm: '', integrations: [] },
      products: [{ productId: 'calltracking', reason: 'Покажет источник каждого звонка и даст данные для оптимизации рекламы.' }],
      pricing: {
        displayMode: 'final_only',
        plans: [{
          id: 'base', name: 'Базовый', recommended: true,
          lineItems: [{ id: 'base-software', productId: 'calltracking', title: 'Коллтрекинг', category: 'software', billingType: 'recurring', quantity: 1, unit: 'месяц', listPrice: 25000, discountPercent: 0, finalPrice: 25000, note: '' }],
        }],
      },
      caseIds: ['jetour', 'am-medica'],
      cover: { subtitle: 'Коллтрекинг для контроля эффективности рекламных источников' },
    },
  },
  {
    id: 'two-tariffs',
    name: 'Сравнение двух тарифов',
    proposal: {
      version: 1,
      presentationTheme: 'dark',
      client: { name: 'Проект с двумя тарифами', brandId: 'neutral', site: '', industry: 'automotive' },
      managerId: 'ivan-petrov',
      project: baseProject,
      products: [
        { productId: 'calltracking', reason: 'Фиксирует источник и запись каждого звонка.' },
        { productId: 'analytics', reason: 'Показывает ROI рекламы на основании сделок CRM.' },
      ],
      pricing: {
        displayMode: 'final_only', includedMinutes: 300,
        plans: [
          { id: 'standard', name: 'Стандарт', recommended: false, lineItems: [
            { id: 'std-po', productId: 'calltracking', title: 'ПО', category: 'software', billingType: 'recurring', quantity: 1, unit: 'месяц', listPrice: 20000, discountPercent: 0, finalPrice: 20000, note: '' },
            { id: 'std-com', productId: 'calltracking', title: 'Связь', category: 'communication', billingType: 'recurring', quantity: 1, unit: 'месяц', listPrice: 5000, discountPercent: 0, finalPrice: 5000, note: '' }
          ] },
          { id: 'premium', name: 'Премиум', recommended: true, lineItems: [
            { id: 'premium-po', productId: 'analytics', title: 'ПО', category: 'software', billingType: 'recurring', quantity: 1, unit: 'месяц', listPrice: 47000, discountPercent: 0, finalPrice: 47000, note: '' },
            { id: 'premium-com', productId: 'calltracking', title: 'Связь', category: 'communication', billingType: 'recurring', quantity: 1, unit: 'месяц', listPrice: 8000, discountPercent: 0, finalPrice: 8000, note: '' }
          ] }
        ],
      },
      caseIds: ['jetour', 'am-medica', 'dikkit'],
      cover: { subtitle: 'Два варианта запуска коллтрекинга и сквозной аналитики' },
    },
  },
  {
    id: 'three-tariffs-four-products',
    name: 'Комплексное КП с тремя тарифами',
    proposal: {
      version: 1,
      presentationTheme: 'dark',
      client: { name: 'Комплексный проект', brandId: 'neutral', site: '', industry: 'automotive' },
      managerId: 'ivan-petrov',
      project: { ...baseProject, goal: 'Автоматизировать обработку обращений и контролировать маркетинг в едином контуре' },
      products: [
        { productId: 'calltracking', reason: 'Определяет источник звонков.' },
        { productId: 'analytics', reason: 'Связывает рекламу и продажи.' },
        { productId: 'ai-operator', reason: 'Принимает входящие звонки 24/7.' },
        { productId: 'sms', reason: 'Автоматизирует сообщения клиентской базе.' },
      ],
      pricing: {
        displayMode: 'final_only', includedMinutes: 500,
        plans: ['Базовый', 'Расширенный', 'Премиум'].map((name, index) => ({
          id: `plan-${index + 1}`, name, recommended: index === 1,
          lineItems: [
            { id: `plan-${index + 1}-po`, productId: 'calltracking', title: 'Программное обеспечение', category: 'software' as const, billingType: 'recurring' as const, quantity: 1, unit: 'месяц', listPrice: [25000, 55000, 95000][index], discountPercent: 0, finalPrice: [25000, 55000, 95000][index], note: '' },
            { id: `plan-${index + 1}-setup`, productId: 'analytics', title: 'Запуск и настройка', category: 'other' as const, billingType: 'one_time' as const, quantity: 1, unit: 'проект', listPrice: [5000, 10000, 15000][index], discountPercent: 0, finalPrice: [5000, 10000, 15000][index], note: '' }
          ],
        })),
      },
      caseIds: ['jetour', 'dikkit', 'am-medica'],
      cover: { subtitle: 'Единый контур аналитики, обработки звонков и коммуникаций' },
    },
  },
];

export const blankProposal: ProposalDocument = {
  ...structuredClone(demoFixtures[1].proposal),
  client: { name: '', brandId: 'neutral', site: '', industry: 'other' },
  project: { ...structuredClone(demoFixtures[1].proposal.project), goal: '', summary: '', traffic: '', sessions: '', channels: [], crm: '', currentCalltracking: '', integrations: [], additionalContext: '' },
  products: [],
  pricing: { displayMode: 'full_vs_discount', plans: [] },
  caseIds: [],
  cover: { subtitle: '' },
};
