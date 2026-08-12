import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import brands from './data/brands.json';
import managers from './data/managers.json';
import industries from './data/industries.json';
import products from './data/products.json';
import { blankProposal, demoFixtures } from './data/demoFixtures';
import { migrateProposalDocument, proposalSchema, type ProposalDocument } from './schemas/proposal';
import { selectCases } from './domain/selectCases';
import { buildProposal } from './domain/buildProposal';
import { ProposalPreview } from './components/preview/ProposalPreview';
import { CustomSelect } from './components/ui/CustomSelect';
import { UiIcon } from './components/ui/UiIcon';
import { OnboardingModal } from './components/ui/OnboardingModal';
import { resolveManager } from './domain/resolveManager';
import { getOnePagerWarnings } from './domain/onePager';
import { DRAFT_STORAGE_KEY, LEGACY_DRAFT_STORAGE_KEY, restoreDraft, serializeDraft } from './drafts/draftStorage';
import { checkPdfAvailability } from './export/pdfHealth';
import { ExportDock, type ExportFormat } from './components/export/ExportDock';
import { PricingStep } from './components/steps/PricingStep';
import { ReviewStep } from './components/steps/ReviewStep';
import { makeSavedContactId, readSavedContacts, SAVED_CONTACTS_STORAGE_KEY, serializeSavedContacts, type SavedManagerContact } from './contacts/contactStorage';

const MAX_SELECTED_PRODUCTS = 5;
const steps = ['Клиент и менеджер', 'Задача и продукты', 'Расчёт и условия', 'Проверка и экспорт'];
const productCategories = ['Все категории', ...new Set(products.map((product) => product.category))];
const coverBackgrounds = [
  { id: 'prez-bg-1', label: 'Вариант 1', image: '/backgrounds/prez-bg-1.webp' },
  { id: 'prez-bg-2', label: 'Вариант 2', image: '/backgrounds/prez-bg-2.webp' },
  { id: 'prez-bg-3', label: 'Вариант 3', image: '/backgrounds/prez-bg-3.webp' },
  { id: 'prez-bg-4', label: 'Вариант 4', image: '/backgrounds/prez-bg-4.webp' },
  { id: 'prez-bg-5', label: 'Вариант 5', image: '/backgrounds/prez-bg-5.webp' },
] as const;

function stepForIssue(path: string) {
  if (/^(client|managerId|customManager|cover)/.test(path)) return 0;
  if (/^(project|products)/.test(path)) return 1;
  if (/^pricing/.test(path)) return 2;
  return 3;
}

function loadDraft(): { proposal: ProposalDocument; savedAt?: string } {
  const fallback = structuredClone(demoFixtures[0].proposal);
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY) ?? localStorage.getItem(LEGACY_DRAFT_STORAGE_KEY);
    return saved ? restoreDraft(saved, fallback) ?? { proposal: fallback } : { proposal: fallback };
  } catch {
    return { proposal: fallback };
  }
}

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function makeLine(productId: string, index: number) {
  return { id: `line-${Date.now()}-${index}`, productId: productId || 'calltracking', title: 'Новая позиция', category: 'software' as const, billingType: 'recurring' as const, quantity: 1, unit: 'месяц', listPrice: 0, discountPercent: 0, finalPrice: 0, note: '' };
}

function makeCustomCase(index: number) {
  return { id: `custom-case-${Date.now()}-${index}`, company: '', description: '', metrics: [{ value: '', label: '' }], url: '' };
}

function emptyCustomManager() {
  return { firstName: '', lastName: '', position: '', email: '', phone: '', photoDataUrl: undefined };
}

async function prepareManagerPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Выберите изображение JPG, PNG или WebP.');
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Не удалось прочитать фотографию.')); });
    const size = 512;
    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const sourceX = (image.naturalWidth - sourceSize) / 2;
    const sourceY = (image.naturalHeight - sourceSize) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Не удалось обработать фотографию.');
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', .84);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function App() {
  const initialDraft = useRef(loadDraft());
  const [step, setStep] = useState(0);
  const [demoId, setDemoId] = useState(demoFixtures[0].id);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productCategory, setProductCategory] = useState(productCategories[0]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('full');
  const [pdfState, setPdfState] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [lastSavedAt, setLastSavedAt] = useState(() => initialDraft.current.savedAt ? new Date(initialDraft.current.savedAt) : undefined);
  const [savedContacts, setSavedContacts] = useState<SavedManagerContact[]>(() => {
    try { return readSavedContacts(localStorage.getItem(SAVED_CONTACTS_STORAGE_KEY)); } catch { return []; }
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const draftMenuRef = useRef<HTMLDetailsElement>(null);
  const { register, watch, reset, setValue } = useForm<ProposalDocument>({ defaultValues: initialDraft.current.proposal, mode: 'onChange' });
  const proposal = watch();
  const proposalRef = useRef(proposal);
  proposalRef.current = proposal;
  const manager = useMemo(() => resolveManager(proposal), [proposal]);
  const visibleProducts = useMemo(() => {
    const query = productQuery.trim().toLocaleLowerCase('ru');
    return products.filter((product) => {
      const categoryMatches = productCategory === productCategories[0] || product.category === productCategory;
      const queryMatches = !query || `${product.name} ${product.shortValue}`.toLocaleLowerCase('ru').includes(query);
      return categoryMatches && queryMatches;
    });
  }, [productCategory, productQuery]);
  const validation = useMemo(() => proposalSchema.safeParse(proposal), [proposal]);
  const issues = validation.success ? [] : validation.error.issues;
  const onePagerWarnings = useMemo(() => getOnePagerWarnings(proposal), [proposal]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedAt = new Date();
      localStorage.setItem(DRAFT_STORAGE_KEY, serializeDraft(proposal, savedAt));
      localStorage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
      setLastSavedAt(savedAt);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [proposal]);

  useEffect(() => {
    const saveImmediately = () => {
      const savedAt = new Date();
      localStorage.setItem(DRAFT_STORAGE_KEY, serializeDraft(proposalRef.current, savedAt));
    };
    const saveWhenHidden = () => { if (document.visibilityState === 'hidden') saveImmediately(); };
    window.addEventListener('pagehide', saveImmediately);
    window.addEventListener('beforeunload', saveImmediately);
    document.addEventListener('visibilitychange', saveWhenHidden);
    return () => {
      window.removeEventListener('pagehide', saveImmediately);
      window.removeEventListener('beforeunload', saveImmediately);
      document.removeEventListener('visibilitychange', saveWhenHidden);
    };
  }, []);

  useEffect(() => {
    const closeDraftMenu = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && draftMenuRef.current && !draftMenuRef.current.contains(target)) draftMenuRef.current.removeAttribute('open');
    };
    document.addEventListener('pointerdown', closeDraftMenu);
    return () => document.removeEventListener('pointerdown', closeDraftMenu);
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV && 'fonts' in document && !document.fonts.check('12px "Dela Gothic One"')) {
      console.warn('Фирменный заголовочный шрифт не загружен; используется fallback.');
    }
  }, []);

  useEffect(() => {
    let active = true;
    void checkPdfAvailability().then((available) => { if (active) setPdfState(available ? 'available' : 'unavailable'); });
    return () => { active = false; };
  }, []);

  const applyDemo = () => {
    const fixture = demoFixtures.find((item) => item.id === demoId) ?? demoFixtures[0];
    reset(structuredClone(fixture.proposal));
    setStatus(`Загружен демо-сценарий: ${fixture.name}`);
  };

  const toggleProduct = (productId: string) => {
    const current = proposal.products ?? [];
    const exists = current.some((item) => item.productId === productId);
    if (exists) setValue('products', current.filter((item) => item.productId !== productId), { shouldValidate: true });
    else if (current.length < MAX_SELECTED_PRODUCTS) {
      const product = products.find((item) => item.id === productId)!;
      setValue('products', [...current, { productId, reason: product.shortValue }], { shouldValidate: true });
    }
  };

  const selectManager = (managerId: string) => {
    if (managerId.startsWith('saved:')) {
      const saved = savedContacts.find((contact) => `saved:${contact.id}` === managerId);
      if (saved) {
        const { id: _id, ...contact } = saved;
        setValue('customManager', contact, { shouldValidate: true });
      }
      setValue('managerId', managerId, { shouldValidate: true });
      return;
    }
    if (managerId === 'custom' && !proposal.customManager) setValue('customManager', emptyCustomManager(), { shouldValidate: true });
    setValue('managerId', managerId, { shouldValidate: true });
  };

  const saveCustomManager = () => {
    const source = proposal.customManager;
    const contact = {
      firstName: source?.firstName.trim() ?? '',
      lastName: source?.lastName.trim() ?? '',
      position: source?.position.trim() ?? '',
      email: source?.email.trim() ?? '',
      phone: source?.phone.trim() ?? '',
      photoDataUrl: source?.photoDataUrl,
    };
    if (!contact.firstName || !contact.lastName || !contact.position || !contact.email || !contact.phone) {
      setStatus('Заполните имя, фамилию, должность, почту и телефон перед сохранением контакта.');
      return;
    }
    const currentId = proposal.managerId.startsWith('saved:') ? proposal.managerId.slice('saved:'.length) : undefined;
    const savedContact: SavedManagerContact = { id: currentId ?? makeSavedContactId(), ...contact };
    const nextContacts = savedContacts.some((item) => item.id === savedContact.id)
      ? savedContacts.map((item) => item.id === savedContact.id ? savedContact : item)
      : [savedContact, ...savedContacts];
    setSavedContacts(nextContacts);
    try { localStorage.setItem(SAVED_CONTACTS_STORAGE_KEY, serializeSavedContacts(nextContacts)); } catch { /* storage may be unavailable */ }
    setValue('customManager', contact, { shouldValidate: true });
    setValue('managerId', `saved:${savedContact.id}`, { shouldValidate: true });
    setStatus(currentId ? 'Контакт обновлён и сохранён локально.' : 'Контакт сохранён локально для следующих КП.');
  };

  const removeSavedManager = () => {
    if (!proposal.managerId.startsWith('saved:')) return;
    const contactId = proposal.managerId.slice('saved:'.length);
    const nextContacts = savedContacts.filter((item) => item.id !== contactId);
    setSavedContacts(nextContacts);
    try { localStorage.setItem(SAVED_CONTACTS_STORAGE_KEY, serializeSavedContacts(nextContacts)); } catch { /* storage may be unavailable */ }
    setValue('managerId', 'custom', { shouldValidate: true });
    setStatus('Контакт удалён из локальной библиотеки.');
  };

  const uploadManagerPhoto = async (file?: File) => {
    if (!file) return;
    try {
      const photoDataUrl = await prepareManagerPhoto(file);
      setValue('customManager.photoDataUrl', photoDataUrl, { shouldValidate: true });
      setStatus('Фотография контактного лица загружена.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось загрузить фотографию.');
    }
  };

  const addPlan = () => {
    if (proposal.pricing.plans.length >= 3) return;
    const productId = proposal.products[0]?.productId ?? 'calltracking';
    setValue('pricing.plans', [...proposal.pricing.plans, { id: `plan-${Date.now()}`, name: `Тариф ${proposal.pricing.plans.length + 1}`, recommended: proposal.pricing.plans.length === 0, lineItems: [makeLine(productId, 0)] }]);
  };

  const removePlan = (index: number) => setValue('pricing.plans', proposal.pricing.plans.filter((_, itemIndex) => itemIndex !== index));
  const addLine = (planIndex: number) => {
    const plans = structuredClone(proposal.pricing.plans);
    plans[planIndex].lineItems.push(makeLine(proposal.products[0]?.productId ?? 'calltracking', plans[planIndex].lineItems.length));
    setValue('pricing.plans', plans);
  };
  const removeLine = (planIndex: number, lineIndex: number) => {
    const plans = structuredClone(proposal.pricing.plans);
    plans[planIndex].lineItems.splice(lineIndex, 1);
    setValue('pricing.plans', plans);
  };

  const recommendCases = () => {
    const slots = Math.max(0, 3 - (proposal.customCases?.length ?? 0));
    setValue('caseIds', selectCases(proposal.client.industry, proposal.products.map((item) => item.productId)).map((item) => item.id).slice(0, slots), { shouldValidate: true });
  };

  const toggleCase = (caseId: string) => {
    const checked = proposal.caseIds.includes(caseId);
    if (checked) return setValue('caseIds', proposal.caseIds.filter((id) => id !== caseId), { shouldValidate: true });
    if (proposal.caseIds.length + (proposal.customCases?.length ?? 0) < 3) setValue('caseIds', [...proposal.caseIds, caseId], { shouldValidate: true });
  };

  const addCustomCase = () => {
    const customCases = proposal.customCases ?? [];
    if (customCases.length >= 3) return;
    const availablePreparedCases = Math.max(0, 2 - customCases.length);
    if (proposal.caseIds.length > availablePreparedCases) setValue('caseIds', proposal.caseIds.slice(0, availablePreparedCases), { shouldValidate: true });
    setValue('customCases', [...customCases, makeCustomCase(customCases.length)], { shouldValidate: true });
  };

  const removeCustomCase = (index: number) => {
    setValue('customCases', (proposal.customCases ?? []).filter((_, itemIndex) => itemIndex !== index), { shouldValidate: true });
  };

  const addCustomCaseMetric = (caseIndex: number) => {
    const customCases = structuredClone(proposal.customCases ?? []);
    if (!customCases[caseIndex] || customCases[caseIndex].metrics.length >= 3) return;
    customCases[caseIndex].metrics.push({ value: '', label: '' });
    setValue('customCases', customCases, { shouldValidate: true });
  };

  const removeCustomCaseMetric = (caseIndex: number, metricIndex: number) => {
    const customCases = structuredClone(proposal.customCases ?? []);
    if (!customCases[caseIndex] || customCases[caseIndex].metrics.length <= 1) return;
    customCases[caseIndex].metrics.splice(metricIndex, 1);
    setValue('customCases', customCases, { shouldValidate: true });
  };

  const exportJson = () => {
    if (!validation.success) return setStatus('Исправьте ошибки перед экспортом JSON.');
    const blob = new Blob([JSON.stringify(buildProposal(validation.data), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `Calltouch-${proposal.client.name || 'client'}.json`; link.click(); URL.revokeObjectURL(url);
  };

  const importJson = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = proposalSchema.parse(migrateProposalDocument(JSON.parse(await file.text())));
      reset(parsed); setStatus('JSON загружен и проверен.');
    } catch { setStatus('JSON не соответствует схеме ProposalDocument.'); }
  };

  const runExport = async (type: 'pptx' | 'pdf') => {
    if (!validation.success) return setStatus('Экспорт заблокирован: исправьте ошибки проверки.');
    if (exportFormat !== 'full' && onePagerWarnings.length) return setStatus('One-pager не сформирован: сократите информацию по предупреждениям.');
    setBusy(true); setStatus(type === 'pptx' ? 'Собираю редактируемый PPTX…' : 'Передаю PPTX в PDF-сервис…');
    try {
      const normalized = buildProposal(validation.data);
      if (type === 'pptx') {
        const { downloadPptx, downloadOnePagerPptx } = await import('./export/pptx');
        if (exportFormat === 'full' || exportFormat === 'both') await downloadPptx(normalized);
        if (exportFormat === 'onepager' || exportFormat === 'both') await downloadOnePagerPptx(normalized);
      } else {
        const { downloadPdf } = await import('./export/pdf');
        if (exportFormat === 'full' || exportFormat === 'both') await downloadPdf(normalized, 'full');
        if (exportFormat === 'onepager' || exportFormat === 'both') await downloadPdf(normalized, 'onepager');
      }
      setStatus(type === 'pptx' ? 'PPTX готов.' : 'PDF готов.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Не удалось выполнить экспорт.'); }
    finally { setBusy(false); }
  };

  const focusIssue = (path: string) => {
    setStep(stepForIssue(path));
    window.setTimeout(() => {
      const escaped = CSS.escape(path);
      const target = document.querySelector<HTMLElement>(`[name="${escaped}"], [data-field-path="${escaped}"]`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusable = target?.matches('input, textarea, button, select') ? target : target?.querySelector<HTMLElement>('input, textarea, button, select');
      focusable?.focus({ preventScroll: true });
    }, 0);
  };

  const issueFor = (path: string) => issues.find((issue) => issue.path.join('.') === path)?.message;
  return <div className="app-shell">
    <OnboardingModal />
    <header className="app-header">
      <img src="/logos/calltouch-light.svg" alt="Calltouch" />
      <div><b>Конструктор КП</b><span>Внутренний инструмент</span></div>
      <div className="header-actions">
        <div className="demo-picker"><span>Пример заполнения</span><CustomSelect className="header-select" value={demoId} onChange={setDemoId} options={demoFixtures.map((item) => ({ value: item.id, label: item.name }))} /></div>
        <button className="button ghost" onClick={applyDemo}>Загрузить пример</button>
        <details ref={draftMenuRef} className="draft-menu">
          <summary className="button ghost"><UiIcon name="save" />Черновик</summary>
          <div className="draft-menu-popover">
            <span className="draft-saved-at">{lastSavedAt ? `Автосохранено в ${lastSavedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : 'Автосохранение включено'}</span>
            <button type="button" onClick={exportJson}>Сохранить черновик</button>
            <button type="button" onClick={() => fileRef.current?.click()}>Загрузить черновик</button>
            <button className="danger" type="button" onClick={() => { reset(structuredClone(blankProposal)); setStatus('Форма очищена.'); }}>Очистить форму</button>
          </div>
        </details>
        <input ref={fileRef} hidden type="file" accept="application/json" onChange={(event) => importJson(event.target.files?.[0])} />
      </div>
    </header>

    <div className="steps-header">
      <nav className="stepper">{steps.map((label, index) => <button key={label} className={index === step ? 'active' : index < step ? 'done' : ''} onClick={() => setStep(index)}><i>{index + 1}</i><span>{label}</span></button>)}</nav>
      <div className="progress"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
    </div>

    <main className={mobilePreview ? 'show-mobile-preview' : ''}>
      <section className="form-pane">
        <button className="mobile-toggle" onClick={() => setMobilePreview(!mobilePreview)}>{mobilePreview ? 'Вернуться к форме' : 'Показать превью'}</button>
        {step === 0 && <div className="step-content">
          <div className="section-heading"><span>Шаг 1</span><h1>Клиент и менеджер</h1><p>Только данные, которые попадут в КП.</p></div>
          <div className="field-grid two">
            <label className="required-label">Название клиента *<input required {...register('client.name')} placeholder="Например, EXLANTIX" />{issueFor('client.name') && <em>{issueFor('client.name')}</em>}</label>
            <label className="required-label">Подготовленный бренд *<CustomSelect value={proposal.client.brandId} onChange={(value) => setValue('client.brandId', value, { shouldValidate: true })} options={brands.map((brand) => ({ value: brand.id, label: brand.name }))} /></label>
            <label className="required-label">Отрасль *<CustomSelect value={proposal.client.industry} onChange={(value) => setValue('client.industry', value, { shouldValidate: true })} options={industries.map((industry) => ({ value: industry.id, label: industry.name }))} />{issueFor('client.industry') && <em>{issueFor('client.industry')}</em>}</label>
            <label><span className="field-label-text">Сайт <span className="optional-note">необязательно</span></span><input {...register('client.site')} placeholder="client.ru" /></label>
          </div>
          <label className="required-label">Контактное лицо *<CustomSelect value={proposal.managerId} onChange={selectManager} options={[...managers.map((item) => ({ value: item.id, label: `${item.name} — ${item.position}` })), ...savedContacts.map((item) => ({ value: `saved:${item.id}`, label: `${item.firstName} ${item.lastName} — ${item.position} · сохранённый` })), { value: 'custom', label: 'Свое контактное лицо' }]} />{issueFor('managerId') && <em>{issueFor('managerId')}</em>}</label>
          {(proposal.managerId === 'custom' || proposal.managerId.startsWith('saved:')) && <div className="custom-manager-editor">
            <div className="custom-manager-toolbar"><div><b>Своё контактное лицо</b><span>Сохраните его, чтобы использовать в следующих КП.</span></div><div className="custom-manager-toolbar-actions"><button className="button secondary" type="button" onClick={saveCustomManager}><UiIcon name="save" />{proposal.managerId.startsWith('saved:') ? 'Обновить' : 'Сохранить'}</button>{proposal.managerId.startsWith('saved:') && <button className="text-button danger-text" type="button" onClick={removeSavedManager}>Удалить из библиотеки</button>}</div></div>
            <div className="field-grid two">
              <label className="required-label">Имя *<input required {...register('customManager.firstName')} maxLength={40} placeholder="Имя" />{issueFor('customManager.firstName') && <em>{issueFor('customManager.firstName')}</em>}</label>
              <label className="required-label">Фамилия *<input required {...register('customManager.lastName')} maxLength={40} placeholder="Фамилия" />{issueFor('customManager.lastName') && <em>{issueFor('customManager.lastName')}</em>}</label>
              <label className="required-label">Должность *<input required {...register('customManager.position')} maxLength={80} placeholder="Менеджер по работе с клиентами" />{issueFor('customManager.position') && <em>{issueFor('customManager.position')}</em>}</label>
              <label className="required-label">Почта *<input required type="email" {...register('customManager.email')} placeholder="name@calltouch.net" />{issueFor('customManager.email') && <em>{issueFor('customManager.email')}</em>}</label>
              <label className="required-label">Телефон *<input required type="tel" {...register('customManager.phone')} maxLength={30} placeholder="+7 999 000-00-00" />{issueFor('customManager.phone') && <em>{issueFor('customManager.phone')}</em>}</label>
              <div className="manager-photo-field">
                <div className="manager-photo-preview">{proposal.customManager?.photoDataUrl ? <img src={proposal.customManager.photoDataUrl} alt="Фотография контактного лица" /> : <span className="manager-placeholder-icon" aria-hidden="true" />}</div>
                <div><label className="photo-upload-button">Загрузить фото<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const input = event.currentTarget; void uploadManagerPhoto(input.files?.[0]).finally(() => { input.value = ''; }); }} /></label>{proposal.customManager?.photoDataUrl && <button className="text-button" type="button" onClick={() => setValue('customManager.photoDataUrl', undefined)}>Удалить</button>}<small>JPG, PNG или WebP · необязательно</small></div>
              </div>
            </div>
          </div>}
          <div className="manager-card">{manager?.photoDataUrl ? <img src={manager.photoDataUrl} alt="" /> : <i><span className="manager-placeholder-icon" aria-hidden="true" /></i>}<div><b>{manager?.name}</b><span>{manager?.email}</span></div></div>
          <div className="review-block cover-settings">
            <div><h2>Обложка КП</h2><span>Сразу видна в превью справа</span></div>
            <div className="cover-options">{coverBackgrounds.map((cover) => {
              const selected = (proposal.cover.backgroundId ?? 'prez-bg-1') === cover.id;
              return <button type="button" className={selected ? 'selected' : ''} aria-pressed={selected} onClick={() => setValue('cover.backgroundId', cover.id, { shouldValidate: true })} key={cover.id} style={{ backgroundImage: `url(${cover.image})` }}><span>{cover.label}</span></button>;
            })}</div>
            <label className="required-label"><span className="field-label-text">Подзаголовок на обложке *</span><textarea required {...register('cover.subtitle')} maxLength={130} rows={2} placeholder="Коротко: какую задачу клиента решает предложение" />{issueFor('cover.subtitle') && <em>{issueFor('cover.subtitle')}</em>}</label>
          </div>
        </div>}

        {step === 1 && <div className="step-content">
          <div className="section-heading"><span>Шаг 2</span><h1>Задача и продукты</h1><p>Содержание определяет структуру, но не ломает шаблон.</p></div>
          <label className="required-label">Главная задача клиента *<textarea required {...register('project.goal')} maxLength={180} rows={3} />{issueFor('project.goal') && <em>{issueFor('project.goal')}</em>}</label>
          <label><span className="field-label-text">Короткий insight для слайда <span className="optional-note">необязательно</span></span><textarea {...register('project.summary')} maxLength={220} rows={3} /></label>
          <div className="product-catalog-heading"><div><h2>Продукты</h2><span>В каталоге {products.length} · выбрано {proposal.products.length} из {MAX_SELECTED_PRODUCTS}</span></div></div>
          <div className="product-catalog" data-field-path="products">
            <div className="product-catalog-toolbar">
              <label>Поиск<input type="search" value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder="Например, коллтрекинг" /></label>
              <label>Категория<CustomSelect value={productCategory} onChange={setProductCategory} options={productCategories.map((category) => ({ value: category, label: category }))} /></label>
            </div>
            <div className="product-options">{visibleProducts.map((product) => {
            const checked = proposal.products.some((item) => item.productId === product.id);
            const disabled = !checked && proposal.products.length >= MAX_SELECTED_PRODUCTS;
            return <button type="button" disabled={disabled} className={checked ? 'selected' : ''} onClick={() => toggleProduct(product.id)} key={product.id}><img className="product-visual" src={product.icon} alt="" /><span><b>{product.shortName}</b><small>{product.shortValue}</small></span><i className="product-toggle"><UiIcon name={checked ? 'check' : 'plus'} /></i></button>;
            })}</div>
            {!visibleProducts.length && <div className="product-empty">По такому запросу продуктов нет.</div>}
          </div>
          {issueFor('products') && <em className="form-error">{issueFor('products')}</em>}
          {proposal.products.map((selected, index) => <label className="required-label" key={selected.productId}>Почему {productByLabel(selected.productId)} *<textarea required {...register(`products.${index}.reason` as const)} maxLength={140} rows={2} />{issueFor(`products.${index}.reason`) && <em>{issueFor(`products.${index}.reason`)}</em>}</label>)}
          <details><summary>Дополнительные настройки проекта <span className="optional-note">все поля необязательны</span></summary><div className="field-grid two">
            <label><span className="field-label-text">Трафик <span className="optional-note">необязательно</span></span><input {...register('project.traffic')} /></label><label><span className="field-label-text">Сессии <span className="optional-note">необязательно</span></span><input {...register('project.sessions')} /></label>
            <label><span className="field-label-text">Каналы через запятую <span className="optional-note">необязательно</span></span><input value={proposal.project.channels.join(', ')} onChange={(event) => setValue('project.channels', splitList(event.target.value))} /></label>
            <label><span className="field-label-text">CRM <span className="optional-note">необязательно</span></span><input {...register('project.crm')} /></label>
            <label><span className="field-label-text">Текущий коллтрекинг <span className="optional-note">необязательно</span></span><input {...register('project.currentCalltracking')} /></label>
            <label><span className="field-label-text">Интеграции через запятую <span className="optional-note">необязательно</span></span><input value={proposal.project.integrations.join(', ')} onChange={(event) => setValue('project.integrations', splitList(event.target.value))} /></label>
          </div><label><span className="field-label-text">Дополнительные вводные <span className="optional-note">необязательно</span></span><textarea {...register('project.additionalContext')} maxLength={180} rows={2} /></label></details>
        </div>}

        {step === 2 && <PricingStep proposal={proposal} register={register} setValue={setValue} issueFor={issueFor} addPlan={addPlan} removePlan={removePlan} addLine={addLine} removeLine={removeLine} />}

        {step === 3 && <ReviewStep proposal={proposal} register={register} issueFor={issueFor} valid={validation.success} issues={issues} onePagerWarnings={onePagerWarnings} showOnePagerWarnings={exportFormat !== 'full'} onIssueClick={focusIssue} addCustomCase={addCustomCase} recommendCases={recommendCases} toggleCase={toggleCase} removeCustomCase={removeCustomCase} addCustomCaseMetric={addCustomCaseMetric} removeCustomCaseMetric={removeCustomCaseMetric} />}

        {step === 3 ? <ExportDock valid={validation.success} issueCount={issues.length} busy={busy} status={status} format={exportFormat} onePagerBlocked={exportFormat !== 'full' && onePagerWarnings.length > 0} pdfState={pdfState} onFormatChange={setExportFormat} onExport={(type) => { void runExport(type); }} /> : <div className="step-actions"><button className="button ghost-dark" disabled={step === 0} onClick={() => setStep(step - 1)}>Назад</button><button className="button primary" disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}>Далее</button></div>}
      </section>
      <aside className="preview-pane"><div className="preview-heading"><div><span>Превью</span><b>{exportFormat === 'onepager' ? '1 слайд' : exportFormat === 'both' ? '8 сцен' : '7 слайдов'}</b></div><small>{exportFormat === 'both' ? 'Полное КП + отдельный One-pager' : 'Та же сцена, что экспортируется в PPTX'}</small></div><ProposalPreview proposal={proposal} mode={exportFormat} activeSlide={step === 0 ? 0 : step === 1 ? 2 : step === 2 ? 3 : 6} /></aside>
    </main>
  </div>;
}

function productByLabel(id: string) {
  return products.find((product) => product.id === id)?.shortName ?? id;
}
