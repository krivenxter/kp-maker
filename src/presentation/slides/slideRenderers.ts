import type PptxGenJS from 'pptxgenjs';
import productsData from '../../data/products.json';
import legalTerms from '../../data/legalTerms.json';
import type { ProposalDocument } from '../../schemas/proposal';
import { calculatePlanTotals, formatMoney, normalizeLineItem } from '../../domain/pricingCalculator';
import { selectFlow } from '../../domain/selectFlow';
import { resolveManager } from '../../domain/resolveManager';
import { columns, LAYOUT } from '../design/layout';
import { accentForBrand, COLORS, COVER_TITLE_SCALE, fontProfileForBrand, paletteForTheme, presentationThemeOf, SLIDE, surfaceMode, textStyle, TYPOGRAPHY, type PresentationTheme } from '../design/tokens';
import { flowIconPath } from '../design/productIcons';

function addIconTile(pptx: PptxGenJS, slide: PptxGenJS.Slide, icon: string, x: number, y: number, size: number, mode: 'dark' | 'light' = 'dark') {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: size, h: size, rectRadius: 0.06, fill: { color: mode === 'light' ? 'F5F7F8' : 'FFFFFF', transparency: mode === 'light' ? 0 : 90 }, line: { color: mode === 'light' ? 'E8EDEF' : 'FFFFFF', transparency: mode === 'light' ? 0 : 100 } });
  const inner = size * 0.63;
  addImageFit(slide, icon, { x: x + (size - inner) / 2, y: y + (size - inner) / 2, w: inner, h: inner }, 'contain');
}
import type { PresentationAssets } from '../engine/assets';
import { addAdaptiveText, addArrow, addBackground, addBrandHeader, addCard, addImageFit, addNotes, addPill, addTitle } from '../helpers/pptxHelpers';

const products = productsData;

export { renderCasesSlide } from './casesSlide';
export { renderContactsSlide } from './contactsSlide';

function productById(id: string) {
  return products.find((product) => product.id === id);
}

function addManagerAvatar(pptx: PptxGenJS, slide: PptxGenJS.Slide, photoDataUrl: string | undefined, placeholderIcon: string | undefined, box: { x: number; y: number; w: number; h: number }, accent: string, border = true) {
  slide.addShape(pptx.ShapeType.ellipse, { ...box, fill: { color: accent, transparency: 78 }, line: border ? { color: accent, width: 1 } : { color: accent, transparency: 100 } });
  if (photoDataUrl) addImageFit(slide, photoDataUrl, { x: box.x + 0.02, y: box.y + 0.02, w: box.w - 0.04, h: box.h - 0.04 }, 'cover', { rounding: true });
  else if (placeholderIcon) addImageFit(slide, placeholderIcon, { x: box.x + box.w * 0.24, y: box.y + box.h * 0.2, w: box.w * 0.52, h: box.h * 0.52 }, 'contain', { transparency: 48 });
}

export function renderCoverSlide(pptx: PptxGenJS, proposal: ProposalDocument, assets: PresentationAssets, theme: PresentationTheme = presentationThemeOf(proposal)) {
  const slide = pptx.addSlide();
  const accent = accentForBrand(proposal.client.brandId);
  const fonts = fontProfileForBrand(proposal.client.brandId);
  const palette = paletteForTheme(theme);
  const mode = surfaceMode(theme, 'dark');
  const iconAssets = mode === 'light' ? (assets.uiIconsDark ?? assets.uiIcons) : assets.uiIcons;
  addBackground(pptx, slide, mode, mode === 'light' ? (assets.lightBackground ?? assets.darkBackground) : assets.darkBackground, theme);
  addBrandHeader(pptx, slide, mode, mode === 'light' ? assets.logoDark : assets.logoLight, proposal.client.name, accent, fonts, proposal.client.site);
  slide.addText('КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ', { x: 0.78, y: 1.2, w: 5.8, h: 0.25, ...textStyle(fonts, 'caption'), bold: true, charSpacing: 2.2, color: accent, margin: 0 });
  addAdaptiveText(slide, `РЕШЕНИЯ CALLTOUCH\nДЛЯ ${proposal.client.name.toUpperCase()}`, { ...LAYOUT.coverTitle, ...textStyle(fonts, 'display'), fontSize: TYPOGRAPHY.display.size * COVER_TITLE_SCALE, lineSpacing: TYPOGRAPHY.display.lineSpacing * COVER_TITLE_SCALE, color: palette.text, margin: 0, valign: 'middle' }, { maxLines: 2, minFontSize: 30 });
  addAdaptiveText(slide, proposal.cover.subtitle, { ...LAYOUT.coverSubtitle, ...textStyle(fonts, 'body'), color: palette.mutedStrong, margin: 0 }, { maxLines: 2, minFontSize: 8 });

  const manager = resolveManager(proposal);
  if (manager) {
    const box = LAYOUT.managerCard;
    addCard(pptx, slide, box, mode, { fill: mode === 'light' ? palette.card : '222B35', line: mode === 'light' ? palette.line : '7B8E98', fillTransparency: mode === 'light' ? 0 : 34, lineTransparency: mode === 'light' ? 0 : 58 });
    addManagerAvatar(pptx, slide, manager.photoDataUrl, iconAssets?.userPlaceholder, { x: box.x + 0.2, y: box.y + 0.2, w: 0.5, h: 0.5 }, accent, false);
    const contentX = box.x + 0.82;
    addAdaptiveText(slide, manager.name, { x: contentX, y: box.y + 0.16, w: 2.95, h: 0.2, ...textStyle(fonts, 'body'), color: palette.text, margin: 0, wrap: false }, { singleLine: true, minFontSize: 7 });
    addAdaptiveText(slide, manager.position, { x: contentX, y: box.y + 0.4, w: 2.95, h: 0.16, ...textStyle(fonts, 'caption'), color: palette.muted, margin: 0, valign: 'top', wrap: false }, { singleLine: true, minFontSize: 6 });
    const contactY = box.y + 0.74;
    const emailIconX = contentX;
    const emailTextX = emailIconX + 0.23;
    addImageFit(slide, iconAssets?.email ?? '', { x: emailIconX, y: contactY + 0.01, w: 0.15, h: 0.15 }, 'contain');
    addAdaptiveText(slide, manager.email, { x: emailTextX, y: contactY - 0.01, w: 1.7, h: 0.18, ...textStyle(fonts, 'caption'), color: palette.text, margin: 0, valign: 'middle', wrap: false }, { singleLine: true, minFontSize: 6 });
    const phoneIconX = box.x + 2.65;
    const phoneTextX = phoneIconX + 0.23;
    addImageFit(slide, iconAssets?.phone ?? '', { x: phoneIconX, y: contactY + 0.01, w: 0.15, h: 0.15 }, 'contain');
    addAdaptiveText(slide, manager.phone, { x: phoneTextX, y: contactY - 0.01, w: 1.15, h: 0.18, ...textStyle(fonts, 'caption'), color: palette.text, margin: 0, valign: 'middle', wrap: false }, { singleLine: true, minFontSize: 5.5 });
  }
  addNotes(slide);
}

export function renderContextSlide(pptx: PptxGenJS, proposal: ProposalDocument, assets: PresentationAssets, theme: PresentationTheme = presentationThemeOf(proposal)) {
  const slide = pptx.addSlide();
  const accent = accentForBrand(proposal.client.brandId);
  const fonts = fontProfileForBrand(proposal.client.brandId);
  const palette = paletteForTheme(theme);
  const mode = surfaceMode(theme, 'dark');
  addBackground(pptx, slide, mode, undefined, theme);
  addBrandHeader(pptx, slide, mode, mode === 'light' ? assets.logoDark : assets.logoLight, proposal.client.name, accent, fonts, proposal.client.site);
  addTitle(slide, proposal.project.summary ? 'Что мы увидели по проекту' : 'Параметры проекта', mode, 'Контекст', accent, fonts);

  if (proposal.project.summary) {
    addCard(pptx, slide, { x: 0.72, y: 1.68, w: 11.89, h: 0.88 }, mode, { fill: mode === 'light' ? palette.cardAlt : '17262D', line: accent });
    addAdaptiveText(slide, proposal.project.summary, { x: 1.0, y: 1.9, w: 11.3, h: 0.42, ...textStyle(fonts, 'heading'), color: palette.text, margin: 0 }, { maxLines: 2, minFontSize: 9 });
  }

  const entries = [
    ['Главная задача', proposal.project.goal],
    ['Трафик', proposal.project.traffic],
    ['Объём', proposal.project.sessions],
    ['Каналы', proposal.project.channels.join(', ')],
    ['CRM', proposal.project.crm],
    ['Текущий коллтрекинг', proposal.project.currentCalltracking],
    ['Интеграции', proposal.project.integrations.join(', ')],
    ['Дополнительные вводные', proposal.project.additionalContext],
  ].filter(([, value]) => value);
  const startY = proposal.project.summary ? 2.8 : 1.75;
  const rowHeight = Math.min(0.57, 4.05 / Math.max(entries.length, 1));
  entries.forEach(([label, value], index) => {
    const y = startY + index * rowHeight;
    slide.addText(label.toUpperCase(), { x: 0.82, y, w: 2.35, h: rowHeight - 0.08, ...textStyle(fonts, 'caption'), color: index === 0 ? accent : palette.muted, margin: 0, valign: 'middle' });
    addAdaptiveText(slide, value, { x: 3.22, y, w: 9.0, h: rowHeight - 0.08, ...textStyle(fonts, 'body'), color: palette.text, margin: 0, valign: 'middle' }, { maxLines: 2, minFontSize: 7.5 });
    slide.addShape(pptx.ShapeType.line, { x: 0.82, y: y + rowHeight - 0.06, w: 11.4, h: 0, line: { color: palette.line, width: 0.7 } });
  });
  addNotes(slide);
}

export function renderConfigurationSlide(pptx: PptxGenJS, proposal: ProposalDocument, assets: PresentationAssets, theme: PresentationTheme = presentationThemeOf(proposal)) {
  const slide = pptx.addSlide();
  const accent = accentForBrand(proposal.client.brandId);
  const fonts = fontProfileForBrand(proposal.client.brandId);
  const palette = paletteForTheme(theme);
  const mode = surfaceMode(theme, 'dark');
  addBackground(pptx, slide, mode, undefined, theme);
  addBrandHeader(pptx, slide, mode, mode === 'light' ? assets.logoDark : assets.logoLight, proposal.client.name, accent, fonts, proposal.client.site);
  addTitle(slide, 'Рекомендуемая конфигурация', mode, 'Решение', accent, fonts);
  const count = proposal.products.length;
  const boxes = count <= 3 ? columns(count, 1.72, 4.85) : columns(count, 1.72, 4.85, 0.48, 0.48);
  proposal.products.forEach((selected, index) => {
    const product = productById(selected.productId);
    if (!product) return;
    const box = boxes[index];
    addCard(pptx, slide, box, mode, { fill: mode === 'light' ? palette.card : undefined, line: index === 0 ? accent : palette.line });
    const icon = assets.productVisuals?.[product.id] ?? assets.productIcons[product.id];
    const visualSize = count > 3 ? 0.72 : 1.05;
    if (icon) addImageFit(slide, icon, { x: box.x + 0.18, y: box.y + 0.12, w: visualSize, h: visualSize }, 'contain');
    else slide.addShape(pptx.ShapeType.ellipse, { x: box.x + 0.22, y: box.y + 0.22, w: 0.58, h: 0.58, fill: { color: accent, transparency: 10 }, line: { color: accent } });
    addAdaptiveText(slide, product.shortName.toUpperCase(), { x: box.x + 0.22, y: box.y + (count > 3 ? 1.05 : 1.28), w: box.w - 0.44, h: 0.58, ...textStyle(fonts, 'heading'), color: palette.text, margin: 0 }, { maxLines: 3, minFontSize: 8 });
    addAdaptiveText(slide, product.shortValue, { x: box.x + 0.22, y: box.y + 1.82, w: box.w - 0.44, h: 0.72, ...textStyle(fonts, 'body'), color: palette.mutedStrong, margin: 0 }, { maxLines: 4, minFontSize: 7.5 });
    slide.addText('ЗАКРЫВАЕТ ЗАДАЧУ', { x: box.x + 0.22, y: box.y + 2.84, w: box.w - 0.44, h: 0.2, ...textStyle(fonts, 'caption'), bold: true, charSpacing: 1.4, color: accent, margin: 0 });
    addAdaptiveText(slide, selected.reason, { x: box.x + 0.22, y: box.y + 3.16, w: box.w - 0.44, h: 1.12, ...textStyle(fonts, 'body'), color: palette.text, margin: 0, valign: 'top' }, { maxLines: 6, minFontSize: 7 });
  });
  addNotes(slide);
}

export function renderPricingSlide(pptx: PptxGenJS, proposal: ProposalDocument, assets: PresentationAssets, theme: PresentationTheme = presentationThemeOf(proposal)) {
  const slide = pptx.addSlide();
  const accent = accentForBrand(proposal.client.brandId);
  const fonts = fontProfileForBrand(proposal.client.brandId);
  const palette = paletteForTheme(theme);
  const mode = surfaceMode(theme, 'dark');
  addBackground(pptx, slide, mode, undefined, theme);
  addBrandHeader(pptx, slide, mode, mode === 'light' ? assets.logoDark : assets.logoLight, proposal.client.name, accent, fonts, proposal.client.site);
  addTitle(slide, 'Коммерческое предложение', mode, 'Расчёт', accent, fonts);
  const plans = proposal.pricing.plans;
  if (plans.length === 1) {
    const plan = plans[0];
    const totals = calculatePlanTotals(plan);
    const items = plan.lineItems.map(normalizeLineItem).slice(0, 6);
    const cardHeight = Math.max(3.0, 1.04 + items.length * 0.52);
    const listBox = { x: 0.72, y: 2.16, w: 7.28, h: cardHeight };
    const totalsBox = { x: 8.38, y: 2.16, w: 4.23, h: cardHeight };
    const showDiscount = proposal.pricing.displayMode === 'full_vs_discount';
    const savings = (totals.listMonthlyTotal + totals.listOneTimeTotal) - (totals.monthlyTotal + totals.oneTimeTotal);

    addAdaptiveText(slide, plan.name.toUpperCase(), { x: 0.72, y: 1.68, w: 5.8, h: 0.3, ...textStyle(fonts, 'heading'), color: palette.text, margin: 0, wrap: false }, { singleLine: true, minFontSize: 9 });
    if (plan.recommended) addPill(pptx, slide, 'РЕКОМЕНДУЕМ', { x: 6.88, y: 1.64, w: 1.12 }, accent, fonts);

    addCard(pptx, slide, listBox, mode, { fill: palette.card, line: palette.line });
    slide.addText('СОСТАВ ТАРИФА', { x: listBox.x + 0.24, y: listBox.y + 0.18, w: 2.4, h: 0.18, ...textStyle(fonts, 'caption'), bold: true, charSpacing: 1.1, color: palette.muted, margin: 0 });
    if (showDiscount) {
      addAdaptiveText(slide, 'ПОЛНАЯ СТОИМОСТЬ', { x: listBox.x + listBox.w - 3.18, y: listBox.y + 0.18, w: 1.38, h: 0.18, ...textStyle(fonts, 'caption'), color: palette.muted, align: 'right', margin: 0, wrap: false }, { singleLine: true, minFontSize: 6 });
      slide.addText('СО СКИДКОЙ', { x: listBox.x + listBox.w - 1.56, y: listBox.y + 0.18, w: 1.3, h: 0.18, ...textStyle(fonts, 'caption'), color: accent, align: 'right', margin: 0 });
    } else {
      slide.addText('СТОИМОСТЬ', { x: listBox.x + listBox.w - 1.56, y: listBox.y + 0.18, w: 1.3, h: 0.18, ...textStyle(fonts, 'caption'), color: palette.muted, align: 'right', margin: 0 });
    }

    items.forEach((item, itemIndex) => {
      const y = listBox.y + 0.67 + itemIndex * 0.52;
      addAdaptiveText(slide, item.title, { x: listBox.x + 0.24, y, w: showDiscount ? listBox.w - 3.78 : listBox.w - 2.05, h: 0.24, ...textStyle(fonts, 'body'), color: palette.text, margin: 0, wrap: false }, { singleLine: true, minFontSize: 7.5 });
      if (showDiscount) addAdaptiveText(slide, formatMoney(item.listPrice * item.quantity), { x: listBox.x + listBox.w - 3.18, y, w: 1.38, h: 0.24, ...textStyle(fonts, 'body'), color: palette.muted, align: 'right', margin: 0, wrap: false }, { singleLine: true, minFontSize: 7.5 });
      addAdaptiveText(slide, formatMoney(item.finalPrice ?? 0), { x: listBox.x + listBox.w - 1.56, y, w: 1.3, h: 0.24, ...textStyle(fonts, 'body'), color: palette.text, align: 'right', margin: 0, wrap: false }, { singleLine: true, minFontSize: 7.5 });
      slide.addShape(pptx.ShapeType.line, { x: listBox.x + 0.24, y: y + 0.34, w: listBox.w - 0.48, h: 0, line: { color: palette.line, width: 0.6 } });
    });

    addCard(pptx, slide, totalsBox, mode, { fill: plan.recommended ? palette.cardAlt : palette.card, line: plan.recommended ? accent : palette.line });
    slide.addText('ИТОГО ПО ТАРИФУ', { x: totalsBox.x + 0.26, y: totalsBox.y + 0.2, w: totalsBox.w - 0.52, h: 0.18, ...textStyle(fonts, 'caption'), bold: true, charSpacing: 1.1, color: palette.muted, margin: 0 });
    slide.addText('ЕЖЕМЕСЯЧНО', { x: totalsBox.x + 0.26, y: totalsBox.y + 0.68, w: totalsBox.w - 0.52, h: 0.18, ...textStyle(fonts, 'caption'), color: palette.muted, margin: 0 });
    addAdaptiveText(slide, formatMoney(totals.monthlyTotal), { x: totalsBox.x + 0.26, y: totalsBox.y + 0.94, w: totalsBox.w - 0.52, h: 0.42, ...textStyle(fonts, 'title'), color: accent, margin: 0, wrap: false }, { singleLine: true, minFontSize: 14 });
    slide.addShape(pptx.ShapeType.line, { x: totalsBox.x + 0.26, y: totalsBox.y + 1.53, w: totalsBox.w - 0.52, h: 0, line: { color: plan.recommended ? accent : palette.line, transparency: 62, width: 0.7 } });
    slide.addText('РАЗОВО', { x: totalsBox.x + 0.26, y: totalsBox.y + 1.76, w: totalsBox.w - 0.52, h: 0.18, ...textStyle(fonts, 'caption'), color: palette.muted, margin: 0 });
    addAdaptiveText(slide, formatMoney(totals.oneTimeTotal), { x: totalsBox.x + 0.26, y: totalsBox.y + 2.02, w: totalsBox.w - 0.52, h: 0.42, ...textStyle(fonts, 'title'), color: palette.text, margin: 0, wrap: false }, { singleLine: true, minFontSize: 14 });
    if (showDiscount && savings > 0) addAdaptiveText(slide, `Экономия в первый месяц · ${formatMoney(savings)}`, { x: totalsBox.x + 0.26, y: totalsBox.y + cardHeight - 0.38, w: totalsBox.w - 0.52, h: 0.18, ...textStyle(fonts, 'caption'), bold: true, color: accent, margin: 0, wrap: false }, { singleLine: true, minFontSize: 6 });
  } else {
    const boxes = columns(plans.length, 1.67, 4.78);
    const multiTotalStyle = plans.length === 3
      ? { ...textStyle(fonts, 'heading'), fontFace: fonts.heading, fontSize: 17, lineSpacing: 19, bold: true }
      : textStyle(fonts, 'title');
    plans.forEach((plan, index) => {
    const box = boxes[index];
    const totals = calculatePlanTotals(plan);
    addCard(pptx, slide, box, mode, { fill: plan.recommended ? palette.cardAlt : palette.card, line: plan.recommended ? accent : palette.line });
    addAdaptiveText(slide, plan.name.toUpperCase(), { x: box.x + 0.22, y: box.y + 0.2, w: box.w - 0.44, h: 0.3, ...textStyle(fonts, 'heading'), color: palette.text, margin: 0, wrap: false }, { singleLine: true, minFontSize: 8 });
    if (plan.recommended) addPill(pptx, slide, 'РЕКОМЕНДУЕМ', { x: box.x + box.w - 1.35, y: box.y + 0.16, w: 1.12 }, accent, fonts);

    if (plans.length === 1 && proposal.pricing.displayMode === 'full_vs_discount') {
      slide.addText('ПОЛНАЯ СТОИМОСТЬ', { x: box.x + box.w - 4.0, y: box.y + 0.75, w: 1.65, h: 0.25, ...textStyle(fonts, 'caption'), color: palette.muted, align: 'right', margin: 0 });
      slide.addText('С УЧЁТОМ СКИДКИ', { x: box.x + box.w - 2.1, y: box.y + 0.75, w: 1.85, h: 0.25, ...textStyle(fonts, 'caption'), color: accent, align: 'right', margin: 0 });
    }

    const items = plan.lineItems.map(normalizeLineItem);
    items.slice(0, 6).forEach((item, itemIndex) => {
      const y = box.y + 1.12 + itemIndex * 0.47;
      addAdaptiveText(slide, item.title, { x: box.x + 0.22, y, w: plans.length === 1 ? box.w - 4.5 : box.w - 1.65, h: 0.25, ...textStyle(fonts, 'body'), color: palette.text, margin: 0, wrap: false }, { singleLine: true, minFontSize: 7 });
      if (plans.length === 1 && proposal.pricing.displayMode === 'full_vs_discount') {
        slide.addText(formatMoney(item.listPrice * item.quantity), { x: box.x + box.w - 4.0, y, w: 1.65, h: 0.25, ...textStyle(fonts, 'body'), color: palette.muted, align: 'right', margin: 0 });
        slide.addText(formatMoney(item.finalPrice ?? 0), { x: box.x + box.w - 2.1, y, w: 1.85, h: 0.25, ...textStyle(fonts, 'body'), color: palette.text, align: 'right', margin: 0 });
      } else {
        addAdaptiveText(slide, formatMoney(item.finalPrice ?? 0), { x: box.x + box.w - 1.5, y, w: 1.27, h: 0.25, ...textStyle(fonts, 'body'), color: palette.text, align: 'right', margin: 0, wrap: false }, { singleLine: true, minFontSize: 7 });
      }
      slide.addShape(pptx.ShapeType.line, { x: box.x + 0.22, y: y + 0.31, w: box.w - 0.44, h: 0, line: { color: palette.line, width: 0.6 } });
    });

    const totalsY = box.y + 3.84;
    slide.addText('ЕЖЕМЕСЯЧНО', { x: box.x + 0.22, y: totalsY, w: box.w * 0.45, h: 0.18, ...textStyle(fonts, 'caption'), color: palette.muted, margin: 0 });
    addAdaptiveText(slide, formatMoney(totals.monthlyTotal), { x: box.x + 0.22, y: totalsY + 0.22, w: box.w * 0.45, h: 0.44, ...multiTotalStyle, color: accent, margin: 0, wrap: false }, { singleLine: true, minFontSize: plans.length === 3 ? 11 : 14 });
    slide.addText('РАЗОВО', { x: box.x + box.w * 0.54, y: totalsY, w: box.w * 0.38, h: 0.18, ...textStyle(fonts, 'caption'), color: palette.muted, margin: 0 });
    addAdaptiveText(slide, formatMoney(totals.oneTimeTotal), { x: box.x + box.w * 0.54, y: totalsY + 0.22, w: box.w * 0.38, h: 0.44, ...multiTotalStyle, color: palette.text, margin: 0, wrap: false }, { singleLine: true, minFontSize: plans.length === 3 ? 11 : 14 });
    });
  }
  const legal = proposal.pricing.includedMinutes !== undefined
    ? `${legalTerms.call_forwarding_v1.template.replace('{includedMinutes}', String(proposal.pricing.includedMinutes))} ${legalTerms.call_forwarding_v1.rates}`
    : Object.values(legalTerms.categories).map((item) => `${item.label} — ${item.tax}`).join(' · ');
  addAdaptiveText(slide, legal, { x: 0.72, y: 6.62, w: 11.9, h: 0.34, ...textStyle(fonts, 'caption'), color: palette.muted, margin: 0 }, { maxLines: 2, minFontSize: 6 });
  addNotes(slide);
}

export function renderFlowSlide(pptx: PptxGenJS, proposal: ProposalDocument, assets: PresentationAssets, theme: PresentationTheme = presentationThemeOf(proposal)) {
  const slide = pptx.addSlide();
  const accent = accentForBrand(proposal.client.brandId);
  const fonts = fontProfileForBrand(proposal.client.brandId);
  const palette = paletteForTheme(theme);
  const mode = surfaceMode(theme, 'dark');
  addBackground(pptx, slide, mode, undefined, theme);
  addBrandHeader(pptx, slide, mode, mode === 'light' ? assets.logoDark : assets.logoLight, proposal.client.name, accent, fonts, proposal.client.site);
  addTitle(slide, 'Как это будет работать', mode, 'Сценарий', accent, fonts);
  const flow = selectFlow(proposal.products.map((item) => item.productId));
  addAdaptiveText(slide, flow.headline, { x: 0.72, y: 1.72, w: 8.9, h: 0.28, ...textStyle(fonts, 'heading'), color: palette.text, margin: 0, wrap: false }, { singleLine: true, minFontSize: 9 });
  addAdaptiveText(slide, flow.explanation, { x: 0.72, y: 2.08, w: 11.1, h: 0.32, ...textStyle(fonts, 'body'), color: palette.muted, margin: 0 }, { maxLines: 2, minFontSize: 8 });
  slide.addText('КАК ЭТО РАБОТАЕТ', { x: 0.72, y: 2.66, w: 3.4, h: 0.2, ...textStyle(fonts, 'caption'), bold: true, charSpacing: 1.5, color: accent, margin: 0 });
  const stepBoxes = columns(flow.steps.length, 2.96, 1.35, 0.72, 0.72);
  for (let index = 0; index < stepBoxes.length - 1; index += 1) {
    const current = stepBoxes[index];
    const next = stepBoxes[index + 1];
    slide.addShape(pptx.ShapeType.line, { x: current.x + current.w, y: current.y + 0.76, w: next.x - (current.x + current.w), h: 0, line: { color: accent, width: 1.5, endArrowType: 'triangle' } });
  }
  flow.steps.forEach((step, index) => {
    const box = stepBoxes[index];
    addCard(pptx, slide, box, mode, { fill: mode === 'light' ? (index % 2 ? palette.cardAlt : palette.card) : (index % 2 ? '20333B' : '19262C'), line: index === 2 ? accent : palette.line });
    const semanticIconPath = flowIconPath(step.title, step.description, step.productId);
    const icon = assets.flowIcons?.[semanticIconPath] ?? assets.productIcons[step.productId];
    if (icon) addIconTile(pptx, slide, icon, box.x + 0.14, box.y + 0.15, 0.26, mode);
    else slide.addShape(pptx.ShapeType.ellipse, { x: box.x + 0.14, y: box.y + 0.13, w: 0.32, h: 0.32, fill: { color: accent }, line: { color: accent } });
    slide.addText(String(index + 1).padStart(2, '0'), { x: box.x + box.w - 0.42, y: box.y + 0.16, w: 0.26, h: 0.18, ...textStyle(fonts, 'caption'), color: accent, margin: 0, align: 'right' });
    addAdaptiveText(slide, step.title, { x: box.x + 0.14, y: box.y + 0.61, w: box.w - 0.28, h: 0.28, ...textStyle(fonts, 'caption'), color: palette.text, margin: 0 }, { maxLines: 2, minFontSize: 6.5 });
    addAdaptiveText(slide, step.description, { x: box.x + 0.14, y: box.y + 0.96, w: box.w - 0.28, h: 0.43, ...textStyle(fonts, 'caption'), color: palette.mutedStrong, margin: 0, valign: 'top' }, { maxLines: 3, minFontSize: 6 });
  });
  slide.addText('ЧТО ПОЛУЧИТЕ', { x: 0.72, y: 4.62, w: 3, h: 0.25, ...textStyle(fonts, 'caption'), bold: true, charSpacing: 1.5, color: accent, margin: 0 });
  const benefitBoxes = columns(flow.benefits.length, 4.96, 1.44);
  flow.benefits.forEach((benefit, index) => {
    const box = benefitBoxes[index];
    addCard(pptx, slide, box, mode, { fill: mode === 'light' ? palette.card : undefined, line: palette.line });
    const semanticIconPath = flowIconPath(benefit.title, benefit.description, benefit.productId);
    const icon = assets.flowIcons?.[semanticIconPath] ?? assets.productIcons[benefit.productId];
    if (icon) addIconTile(pptx, slide, icon, box.x + 0.2, box.y + 0.19, 0.3, mode);
    else slide.addShape(pptx.ShapeType.ellipse, { x: box.x + 0.2, y: box.y + 0.2, w: 0.34, h: 0.34, fill: { color: accent }, line: { color: accent } });
    addAdaptiveText(slide, benefit.title, { x: box.x + 0.62, y: box.y + 0.19, w: box.w - 0.82, h: 0.35, ...textStyle(fonts, 'body'), color: palette.text, margin: 0, valign: 'middle' }, { maxLines: 2, minFontSize: 7.5 });
    addAdaptiveText(slide, benefit.description, { x: box.x + 0.2, y: box.y + 0.7, w: box.w - 0.4, h: 0.62, ...textStyle(fonts, 'caption'), color: palette.mutedStrong, margin: 0, valign: 'top' }, { maxLines: 3, minFontSize: 6 });
  });
  addNotes(slide);
}
