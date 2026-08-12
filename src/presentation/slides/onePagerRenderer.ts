import type PptxGenJS from 'pptxgenjs';
import legalTerms from '../../data/legalTerms.json';
import type { ProposalDocument } from '../../schemas/proposal';
import { calculatePlanTotals, formatMoney } from '../../domain/pricingCalculator';
import { getOnePagerBenefits, getOnePagerProducts, selectOnePagerCase, selectOnePagerLayout, selectOnePagerPlan } from '../../domain/onePager';
import { resolveManager } from '../../domain/resolveManager';
import { accentForBrand, COLORS, fontProfileForBrand, paletteForTheme, presentationThemeOf, SLIDE, surfaceMode, textStyle, type PresentationTheme } from '../design/tokens';
import type { PresentationAssets } from '../engine/assets';
import { addAdaptiveText, addBackground, addBrandHeader, addCard, addCaseLogo, addImageFit, addNotes } from '../helpers/pptxHelpers';
import { flowIconPath } from '../design/productIcons';

function addManagerAvatar(pptx: PptxGenJS, slide: PptxGenJS.Slide, photo: string | undefined, placeholderIcon: string | undefined, x: number, y: number, accent: string, border = true) {
  slide.addShape(pptx.ShapeType.ellipse, { x, y, w: 0.42, h: 0.42, fill: { color: accent, transparency: 76 }, line: border ? { color: accent, width: 0.8 } : { color: accent, transparency: 100 } });
  if (photo) addImageFit(slide, photo, { x: x + 0.02, y: y + 0.02, w: 0.38, h: 0.38 }, 'cover', { rounding: true });
  else if (placeholderIcon) addImageFit(slide, placeholderIcon, { x: x + 0.1, y: y + 0.08, w: 0.22, h: 0.22 }, 'contain', { transparency: 48 });
}

function addIconTile(pptx: PptxGenJS, slide: PptxGenJS.Slide, icon: string, x: number, y: number, size: number, mode: 'dark' | 'light' = 'dark') {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: size, h: size, rectRadius: 0.06, fill: { color: mode === 'light' ? 'F0F3F4' : 'FFFFFF', transparency: mode === 'light' ? 0 : 90 }, line: { color: mode === 'light' ? 'E0E7E9' : 'FFFFFF', transparency: mode === 'light' ? 0 : 100 } });
  const inner = size * 0.63;
  addImageFit(slide, icon, { x: x + (size - inner) / 2, y: y + (size - inner) / 2, w: inner, h: inner }, 'contain');
}

function addPriceSummary(pptx: PptxGenJS, slide: PptxGenJS.Slide, proposal: ProposalDocument, accent: string, fonts: ReturnType<typeof fontProfileForBrand>, mode: 'dark' | 'light', palette: ReturnType<typeof paletteForTheme>) {
  const layout = selectOnePagerLayout(proposal);
  const plan = selectOnePagerPlan(proposal);
  const x = 8.46;
  const y = 2.72;
  const w = 4.15;
  const h = 2.05;
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.16, fill: { color: mode === 'light' ? palette.card : '19272D', transparency: mode === 'light' ? 0 : 16 }, line: { color: layout === 'onepager_discount' ? accent : palette.line, transparency: mode === 'light' ? 0 : 18, width: 0.8 } });
  slide.addText('КОММЕРЧЕСКИЕ УСЛОВИЯ', { x: x + 0.22, y: y + 0.18, w: w - 0.44, h: 0.18, ...textStyle(fonts, 'caption'), charSpacing: 1.3, color: accent, margin: 0 });
  const totals = calculatePlanTotals(plan);
  const monthlyLines = [
    totals.monthlySoftware ? `ПО ${formatMoney(totals.monthlySoftware)}` : '',
    totals.monthlyCommunication ? `Связь ${formatMoney(totals.monthlyCommunication)}` : '',
  ].filter(Boolean).join(' · ');
  const monthlyTotalStyle = { ...textStyle(fonts, 'heading'), fontFace: 'Dela Gothic One', fontSize: 18, lineSpacing: 20, bold: false };
  addAdaptiveText(slide, plan.name.toUpperCase(), { x: x + 0.22, y: y + 0.49, w: w - 0.44, h: 0.18, ...textStyle(fonts, 'caption'), bold: true, color: palette.text, margin: 0, wrap: false }, { singleLine: true, minFontSize: 6.5 });
  addAdaptiveText(slide, monthlyLines || 'Ежемесячный платёж', { x: x + 0.22, y: y + 0.73, w: w - 0.44, h: 0.18, ...textStyle(fonts, 'caption'), color: palette.muted, margin: 0 }, { maxLines: 1, minFontSize: 6.5 });
  if (layout === 'onepager_discount' && totals.listMonthlyTotal > totals.monthlyTotal) {
    addAdaptiveText(slide, `Полная ${formatMoney(totals.listMonthlyTotal)}`, { x: x + 0.22, y: y + 0.96, w: w - 0.44, h: 0.18, ...textStyle(fonts, 'caption'), color: palette.muted, margin: 0 }, { maxLines: 1 });
    addAdaptiveText(slide, `${formatMoney(totals.monthlyTotal)} / МЕС`, { x: x + 0.22, y: y + 1.18, w: w - 0.44, h: 0.34, ...monthlyTotalStyle, color: accent, margin: 0, wrap: false }, { singleLine: true, minFontSize: 12 });
  } else {
    addAdaptiveText(slide, `${formatMoney(totals.monthlyTotal)} / МЕС`, { x: x + 0.22, y: y + 1.02, w: w - 0.44, h: 0.36, ...monthlyTotalStyle, color: accent, margin: 0, wrap: false }, { singleLine: true, minFontSize: 12 });
  }
  if (totals.oneTimeTotal) addAdaptiveText(slide, `Разово: ${formatMoney(totals.oneTimeTotal)}`, { x: x + 0.22, y: y + 1.63, w: w - 0.44, h: 0.18, ...textStyle(fonts, 'caption'), color: palette.text, margin: 0 }, { maxLines: 1 });
}

export function renderOnePager(pptx: PptxGenJS, proposal: ProposalDocument, assets: PresentationAssets, theme: PresentationTheme = presentationThemeOf(proposal)) {
  const slide = pptx.addSlide();
  const accent = accentForBrand(proposal.client.brandId);
  const fonts = fontProfileForBrand(proposal.client.brandId);
  const palette = paletteForTheme(theme);
  const mode = surfaceMode(theme, 'dark');
  const iconAssets = mode === 'light' ? (assets.uiIconsDark ?? assets.uiIcons) : assets.uiIcons;
  const cardFill = mode === 'light' ? palette.card : '19272D';
  const cardLine = mode === 'light' ? palette.line : '32434B';
  const products = getOnePagerProducts(proposal);
  const benefits = getOnePagerBenefits(proposal);
  const caseItem = selectOnePagerCase(proposal);
  const manager = resolveManager(proposal);

  addBackground(pptx, slide, mode, mode === 'light' ? (assets.lightBackground ?? assets.darkBackground) : assets.darkBackground, theme);
  addBrandHeader(pptx, slide, mode, mode === 'light' ? assets.logoDark : assets.logoLight, proposal.client.name, accent, fonts, proposal.client.site);
  slide.addText('КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ', { x: SLIDE.marginX, y: 1.08, w: 5.2, h: 0.2, ...textStyle(fonts, 'caption'), bold: true, charSpacing: 1.8, color: accent, margin: 0 });
  addAdaptiveText(slide, `РЕШЕНИЕ ДЛЯ ${proposal.client.name.toUpperCase()}`, { x: SLIDE.marginX, y: 1.36, w: 6.95, h: 0.72, ...textStyle(fonts, 'title'), color: palette.text, margin: 0, valign: 'top' }, { maxLines: 2, minFontSize: 14 });
  addAdaptiveText(slide, proposal.cover.subtitle, { x: SLIDE.marginX, y: 2.17, w: 6.95, h: 0.34, ...textStyle(fonts, 'body'), color: palette.mutedStrong, margin: 0, valign: 'top' }, { maxLines: 2, minFontSize: 8 });
  if (manager) {
    const box = { x: 8.46, y: 1.12, w: 4.15, h: 1.08 };
    addCard(pptx, slide, box, mode, { fill: mode === 'light' ? palette.card : '222B35', line: mode === 'light' ? palette.line : '7B8E98', fillTransparency: mode === 'light' ? 0 : 34, lineTransparency: mode === 'light' ? 0 : 58 });
    addManagerAvatar(pptx, slide, manager.photoDataUrl, iconAssets?.userPlaceholder, box.x + 0.2, box.y + 0.2, accent, false);
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
  addPriceSummary(pptx, slide, proposal, accent, fonts, mode, palette);

  const solutionBox = { x: 0.58, y: 2.72, w: 7.56, h: 2.05 };
  slide.addShape(pptx.ShapeType.roundRect, { ...solutionBox, rectRadius: 0.16, fill: { color: cardFill, transparency: mode === 'light' ? 0 : 16 }, line: { color: cardLine, transparency: mode === 'light' ? 0 : 18, width: 0.8 } });
  slide.addText('РЕШЕНИЕ', { x: SLIDE.marginX, y: 2.9, w: 2, h: 0.2, ...textStyle(fonts, 'caption'), bold: true, charSpacing: 1.5, color: accent, margin: 0 });
  products.forEach((product, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = SLIDE.marginX + column * 3.65;
    const y = 3.18 + row * (products.length > 2 ? 0.82 : 0.86);
    const visualSize = products.length > 2 ? 0.42 : 0.72;
    const image = assets.productVisuals?.[product.id] ?? assets.productIcons[product.id];
    if (image) addImageFit(slide, image, { x, y: y + 0.01, w: visualSize, h: visualSize }, 'contain');
    addAdaptiveText(slide, product.shortName, { x: x + visualSize + 0.14, y, w: 3.36 - visualSize, h: 0.2, ...textStyle(fonts, 'caption'), color: palette.text, margin: 0, valign: 'top', wrap: false }, { singleLine: true, minFontSize: 6 });
    addAdaptiveText(slide, product.shortValue, { x: x + visualSize + 0.14, y: y + 0.27, w: 3.36 - visualSize, h: 0.31, ...textStyle(fonts, 'caption'), color: palette.muted, margin: 0, valign: 'top' }, { maxLines: 2, minFontSize: 6 });
  });

  const benefitsBox = { x: 0.58, y: 4.98, w: 7.56, h: 1.55 };
  slide.addShape(pptx.ShapeType.roundRect, { ...benefitsBox, rectRadius: 0.16, fill: { color: cardFill, transparency: mode === 'light' ? 0 : 16 }, line: { color: cardLine, transparency: mode === 'light' ? 0 : 18, width: 0.8 } });
  slide.addText('ЧТО ПОЛУЧИТЕ', { x: SLIDE.marginX, y: 5.16, w: 3, h: 0.2, ...textStyle(fonts, 'caption'), bold: true, charSpacing: 1.5, color: accent, margin: 0 });
  benefits.forEach((benefit, index) => {
    const x = SLIDE.marginX + index * 2.42;
    const icon = assets.flowIcons?.[flowIconPath(benefit.title, benefit.description, benefit.productId)] ?? assets.productIcons[benefit.productId];
    if (icon) addIconTile(pptx, slide, icon, x, 5.52, 0.2, mode);
    addAdaptiveText(slide, benefit.title, { x: x + 0.32, y: 5.52, w: 1.85, h: 0.2, ...textStyle(fonts, 'caption'), color: palette.text, margin: 0, valign: 'top' }, { maxLines: 2, minFontSize: 6 });
    addAdaptiveText(slide, benefit.description, { x: x + 0.32, y: 5.75, w: 1.85, h: 0.5, ...textStyle(fonts, 'caption'), color: palette.muted, margin: 0, valign: 'top' }, { maxLines: 3, minFontSize: 5.5 });
  });

  if (caseItem) {
    const primaryMetric = caseItem.metrics[0];
    const caseLogo = 'id' in caseItem ? assets.caseLogos?.[caseItem.id] : undefined;
    const box = { x: 8.46, y: 4.98, w: 4.15, h: 1.55 };
    slide.addShape(pptx.ShapeType.roundRect, { ...box, rectRadius: 0.16, fill: { color: cardFill, transparency: mode === 'light' ? 0 : 16 }, line: { color: cardLine, transparency: mode === 'light' ? 0 : 18, width: 0.8 } });
    slide.addText('РЕЛЕВАНТНЫЙ КЕЙС', { x: box.x + 0.22, y: box.y + 0.17, w: box.w - 0.44, h: 0.16, ...textStyle(fonts, 'caption'), bold: true, charSpacing: 1.2, color: accent, margin: 0 });
    if (caseLogo) addCaseLogo(pptx, slide, caseLogo, { x: box.x + 0.22, y: box.y + 0.4, w: 0.68, h: 0.28 }, mode, assets.caseLogosDark?.[caseItem.id]);
    addAdaptiveText(slide, caseItem.company, { x: box.x + (caseLogo ? 0.98 : 0.22), y: box.y + 0.4, w: caseLogo ? 1.12 : 1.5, h: 0.28, ...textStyle(fonts, 'caption'), color: palette.text, margin: 0, valign: 'middle', wrap: false }, { singleLine: true, minFontSize: 5.5 });
    addAdaptiveText(slide, caseItem.description, { x: box.x + 0.22, y: box.y + 0.82, w: 1.82, h: 0.35, ...textStyle(fonts, 'caption'), color: palette.muted, margin: 0, valign: 'top' }, { maxLines: 3, minFontSize: 5.5 });
    addAdaptiveText(slide, primaryMetric.value, { x: box.x + 2.02, y: box.y + 0.7, w: 2.05, h: 0.42, ...textStyle(fonts, 'title'), fontFace: 'Dela Gothic One', fontSize: 18, lineSpacing: 20, bold: false, color: accent, align: 'right', margin: 0, wrap: false }, { singleLine: true, minFontSize: 12 });
    addAdaptiveText(slide, primaryMetric.label, { x: box.x + 2.02, y: box.y + 1.12, w: 2.05, h: 0.24, ...textStyle(fonts, 'caption'), color: palette.text, align: 'right', margin: 0, valign: 'top' }, { maxLines: 2, minFontSize: 5.5 });
    if (caseItem.url && caseItem.url !== 'не указано') {
      const button = { x: box.x + 2.73, y: box.y + 0.16, w: 1.14, h: 0.24 };
      addAdaptiveText(slide, 'Подробнее →', { ...button, shape: pptx.ShapeType.roundRect, rectRadius: 0.08, fill: { color: accent }, line: { color: accent, transparency: 100 }, ...textStyle(fonts, 'caption'), bold: true, color: COLORS.ink, underline: { style: 'none', color: COLORS.ink }, align: 'center', valign: 'middle', margin: [0.02, 0.03, 0.02, 0.03], wrap: false }, { singleLine: true, minFontSize: 7 });
      slide.addShape(pptx.ShapeType.roundRect, { ...button, rectRadius: 0.1, fill: { color: accent, transparency: 100 }, line: { color: accent, transparency: 100 }, hyperlink: { url: caseItem.url } });
    }
  }
  addAdaptiveText(slide, legalTerms.shortVersion, { x: SLIDE.marginX, y: 7.24, w: 11.89, h: 0.18, ...textStyle(fonts, 'caption'), color: palette.mutedStrong, margin: 0, wrap: false }, { singleLine: true, minFontSize: 5.5 });
  addNotes(slide);
}
