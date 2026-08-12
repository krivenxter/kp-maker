import type PptxGenJS from 'pptxgenjs';
import type { ProposalDocument } from '../../schemas/proposal';
import { resolveManager } from '../../domain/resolveManager';
import { accentForBrand, COLORS, fontProfileForBrand, paletteForTheme, presentationThemeOf, surfaceMode, textStyle, type PresentationTheme } from '../design/tokens';
import type { PresentationAssets } from '../engine/assets';
import { addAdaptiveText, addBackground, addBrandHeader, addCard, addImageFit, addNotes } from '../helpers/pptxHelpers';

function addManagerAvatar(pptx: PptxGenJS, slide: PptxGenJS.Slide, photoDataUrl: string | undefined, placeholderIcon: string | undefined, box: { x: number; y: number; w: number; h: number }, accent: string) {
  slide.addShape(pptx.ShapeType.ellipse, { ...box, fill: { color: accent, transparency: 78 }, line: { color: accent, transparency: 100 } });
  if (photoDataUrl) addImageFit(slide, photoDataUrl, { x: box.x + 0.02, y: box.y + 0.02, w: box.w - 0.04, h: box.h - 0.04 }, 'cover', { rounding: true });
  else if (placeholderIcon) addImageFit(slide, placeholderIcon, { x: box.x + box.w * 0.24, y: box.y + box.h * 0.2, w: box.w * 0.52, h: box.h * 0.52 }, 'contain', { transparency: 48 });
}

export function renderContactsSlide(pptx: PptxGenJS, proposal: ProposalDocument, assets: PresentationAssets, theme: PresentationTheme = presentationThemeOf(proposal)) {
  const slide = pptx.addSlide();
  const accent = accentForBrand(proposal.client.brandId);
  const fonts = fontProfileForBrand(proposal.client.brandId);
  const palette = paletteForTheme(theme);
  const mode = surfaceMode(theme, 'dark');
  addBackground(pptx, slide, mode, mode === 'light' ? (assets.lightFinalBackground ?? assets.finalBackground) : assets.finalBackground);
  addBrandHeader(pptx, slide, mode, mode === 'light' ? assets.logoDark : assets.logoLight, proposal.client.name, accent, fonts, proposal.client.site);
  addAdaptiveText(slide, 'ОБСУДИМ ЗАПУСК', { x: 0.76, y: 2.0, w: 6.2, h: 0.82, ...textStyle(fonts, 'display'), color: palette.text, margin: 0, wrap: false }, { singleLine: true, minFontSize: 22 });
  addAdaptiveText(slide, `Решения Calltouch для ${proposal.client.name}`, { x: 0.78, y: 2.96, w: 5.4, h: 0.42, ...textStyle(fonts, 'body'), color: palette.mutedStrong, margin: 0 }, { maxLines: 2, minFontSize: 8 });
  const manager = resolveManager(proposal);
  if (manager) {
    const box = { x: 7.5, y: 2.08, w: 4.45, h: 1.82 };
    addCard(pptx, slide, box, mode, { fill: mode === 'light' ? palette.card : '222B35', line: mode === 'light' ? palette.line : '7B8E98', fillTransparency: mode === 'light' ? 0 : 34, lineTransparency: mode === 'light' ? 0 : 58 });
    addManagerAvatar(pptx, slide, manager.photoDataUrl, assets.uiIcons?.userPlaceholder, { x: box.x + 0.34, y: box.y + 0.3, w: 0.66, h: 0.66 }, accent);
    const contactX = box.x + 1.18;
    addAdaptiveText(slide, manager.name, { x: contactX, y: box.y + 0.27, w: 2.8, h: 0.26, ...textStyle(fonts, 'heading'), color: palette.text, margin: 0, wrap: false }, { singleLine: true, minFontSize: 9 });
    addAdaptiveText(slide, manager.position, { x: contactX, y: box.y + 0.6, w: 2.8, h: 0.28, ...textStyle(fonts, 'caption'), color: palette.muted, margin: 0, valign: 'top' }, { maxLines: 2, minFontSize: 6.5 });
    const contactIconX = contactX;
    const contactTextX = contactX + 0.27;
    addImageFit(slide, assets.uiIcons?.email ?? '', { x: contactIconX, y: box.y + 1.005, w: 0.17, h: 0.17 }, 'contain');
    addAdaptiveText(slide, manager.email, { x: contactTextX, y: box.y + 0.98, w: 2.73, h: 0.22, ...textStyle(fonts, 'caption'), color: palette.text, margin: 0, valign: 'middle', wrap: false }, { singleLine: true, minFontSize: 6 });
    addImageFit(slide, assets.uiIcons?.phone ?? '', { x: contactIconX, y: box.y + 1.285, w: 0.17, h: 0.17 }, 'contain');
    addAdaptiveText(slide, manager.phone, { x: contactTextX, y: box.y + 1.26, w: 2.73, h: 0.22, ...textStyle(fonts, 'caption'), color: palette.text, margin: 0, valign: 'middle', wrap: false }, { singleLine: true, minFontSize: 6 });
  }
  addNotes(slide);
}
