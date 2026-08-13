import type PptxGenJS from 'pptxgenjs';
import casesData from '../../data/cases.json';
import type { ProposalDocument } from '../../schemas/proposal';
import { columns } from '../design/layout';
import { accentForBrand, accentTextColor, fontProfileForBrand, paletteForTheme, surfaceMode, textStyle, type PresentationTheme } from '../design/tokens';
import type { PresentationAssets } from '../engine/assets';
import { addAdaptiveText, addBackground, addBrandHeader, addCard, addCaseLogo, addNotes, addTitle } from '../helpers/pptxHelpers';

export function renderCasesSlide(pptx: PptxGenJS, proposal: ProposalDocument, assets: PresentationAssets, theme: PresentationTheme = proposal.presentationTheme) {
  const slide = pptx.addSlide();
  const accent = accentForBrand(proposal.client.brandId);
  const fonts = fontProfileForBrand(proposal.client.brandId);
  const palette = paletteForTheme(theme);
  const mode = surfaceMode(theme, 'dark');
  addBackground(pptx, slide, mode, undefined, theme);
  addBrandHeader(pptx, slide, mode, mode === 'light' ? assets.logoDark : assets.logoLight, proposal.client.name, accent, fonts, proposal.client.site);
  addTitle(slide, 'Кейсы похожих клиентов', mode, 'Результаты', accent, fonts);
  const selectedCases = [
    ...proposal.caseIds.map((id) => casesData.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item)),
    ...(proposal.customCases ?? []),
  ].slice(0, 3);
  const boxes = columns(selectedCases.length, 1.76, 4.52);
  selectedCases.forEach((item, index) => {
    const box = boxes[index];
    addCard(pptx, slide, box, mode, { fill: index === 0 ? palette.cardAlt : palette.card, line: theme === 'light' ? palette.line : index === 0 ? accent : palette.line });
    const caseLogo = assets.caseLogos?.[item.id];
    const companyX = caseLogo ? box.x + 1.08 : box.x + 0.26;
    if (caseLogo) {
      addCaseLogo(pptx, slide, caseLogo, { x: box.x + 0.26, y: box.y + 0.24, w: 0.7, h: 0.36 }, mode, assets.caseLogosDark?.[item.id]);
    }
    addAdaptiveText(slide, item.company, { x: companyX, y: box.y + 0.24, w: box.x + box.w - 0.26 - companyX, h: 0.36, ...textStyle(fonts, 'heading'), color: palette.text, margin: 0, valign: 'middle', wrap: false }, { singleLine: true, minFontSize: 8 });
    addAdaptiveText(slide, item.description, { x: box.x + 0.26, y: box.y + 0.86, w: box.w - 0.52, h: 0.82, ...textStyle(fonts, 'body'), color: palette.mutedStrong, margin: 0 }, { maxLines: 4, minFontSize: 8 });
    const metrics = item.metrics.slice(0, 3);
    const metricStartY = box.y + 1.82;
    const metricRowStep = 0.72;
    metrics.forEach((metric, metricIndex) => {
      const metricY = metricStartY + metricIndex * metricRowStep;
      addAdaptiveText(slide, metric.value, { x: box.x + 0.26, y: metricY, w: box.w - 0.52, h: 0.3, ...textStyle(fonts, 'title'), color: accent, margin: 0, valign: 'top', wrap: false }, { singleLine: true, minFontSize: 13 });
      addAdaptiveText(slide, metric.label, { x: box.x + 0.26, y: metricY + 0.39, w: box.w - 0.52, h: 0.22, ...textStyle(fonts, 'caption'), color: palette.text, margin: 0, valign: 'top' }, { maxLines: 2, minFontSize: 6.5 });
    });
    if (item.url && item.url !== 'не указано') {
      const button = { x: box.x + 0.26, y: box.y + 4, w: 1.48, h: 0.34 };
      addAdaptiveText(slide, 'Подробнее →', { ...button, shape: pptx.ShapeType.roundRect, rectRadius: 0.08, fill: { color: accent }, line: { color: accent, transparency: 100 }, ...textStyle(fonts, 'caption'), bold: true, color: accentTextColor(accent), underline: { style: 'none', color: accentTextColor(accent) }, margin: [0.03, 0.05, 0.03, 0.05], align: 'center', valign: 'middle', wrap: false }, { singleLine: true, minFontSize: 7 });
      slide.addShape(pptx.ShapeType.roundRect, { ...button, rectRadius: 0.1, fill: { color: accent, transparency: 100 }, line: { color: accent, transparency: 100 }, hyperlink: { url: item.url } });
    }
  });
  addNotes(slide);
}
