import PptxGenJS from 'pptxgenjs';
import { withPPTXEmbedFonts } from 'pptx-embed-fonts/pptxgenjs';
import products from '../../data/products.json';
import cases from '../../data/cases.json';
import type { ProposalDocument } from '../../schemas/proposal';
import { buildProposal } from '../../domain/buildProposal';
import { loadPresentationAssets, validateAssets } from './assets';
import { renderCasesSlide, renderConfigurationSlide, renderContactsSlide, renderContextSlide, renderCoverSlide, renderFlowSlide, renderPricingSlide } from '../slides/slideRenderers';
import { renderOnePager } from '../slides/onePagerRenderer';
import type { PresentationAssets } from './assets';
import { fontProfileForBrand, presentationThemeOf } from '../design/tokens';
import { FLOW_ICON_PATHS, productIconPath } from '../design/productIcons';
import { UI_ICONS } from '../design/uiIcons';
import { safeClientName } from '../../export/fileName';

const EmbeddedPptxGenJS = withPPTXEmbedFonts(PptxGenJS);

export async function createDeckFromAssets(rawProposal: ProposalDocument, assets: PresentationAssets) {
  const proposal = buildProposal(rawProposal);
  const theme = presentationThemeOf(proposal);
  const fontProfile = fontProfileForBrand(proposal.client.brandId);
  const pptx = new EmbeddedPptxGenJS();
  for (const font of assets.fonts ?? []) {
    await pptx.addFont(font);
  }
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Calltouch';
  pptx.company = 'Calltouch';
  pptx.subject = `Коммерческое предложение для ${proposal.client.name}`;
  pptx.title = `Calltouch — ${proposal.client.name}`;
  pptx.theme = {
    headFontFace: fontProfile.heading,
    bodyFontFace: fontProfile.body,
  };
  pptx.defineSlideMaster({
    title: 'CALLTOUCH',
    background: { color: theme === 'light' ? 'FFFFFF' : '111A1F' },
    objects: [],
  });

  renderCoverSlide(pptx, proposal, assets, theme);
  renderContextSlide(pptx, proposal, assets, theme);
  renderConfigurationSlide(pptx, proposal, assets, theme);
  renderPricingSlide(pptx, proposal, assets, theme);
  renderFlowSlide(pptx, proposal, assets, theme);
  renderCasesSlide(pptx, proposal, assets, theme);
  renderContactsSlide(pptx, proposal, assets, theme);
  return pptx;
}

export async function createPresentation(rawProposal: ProposalDocument) {
  const proposal = buildProposal(rawProposal);
  const selectedProducts = products.filter((product) => proposal.products.some((item) => item.productId === product.id));
  const selectedCases = cases.filter((item) => proposal.caseIds.includes(item.id));
  const fontProfile = fontProfileForBrand(proposal.client.brandId);
  const coverBackgroundId = proposal.cover.backgroundId ?? 'prez-bg-1';
  const missingAssets = await validateAssets(['/logos/calltouch-light.svg', '/logos/calltouch-dark.svg', `/backgrounds/${coverBackgroundId}.webp`, `/backgrounds-light/${coverBackgroundId}.png`, '/backgrounds/prez-bg-6.webp', '/backgrounds-light/prez-bg-6.png', fontProfile.headingFile, ...fontProfile.bodyFiles.map((font) => font.path), ...selectedProducts.map((product) => productIconPath(product.id, product.icon)), ...selectedProducts.map((product) => product.icon).filter((path): path is string => Boolean(path)), ...selectedCases.map((item) => item.logo), ...FLOW_ICON_PATHS, ...Object.values(UI_ICONS)]);
  if (missingAssets.length) throw new Error(`Не найдены обязательные ассеты: ${missingAssets.join(', ')}`);
  const assets = await loadPresentationAssets(selectedProducts, proposal.client.brandId, coverBackgroundId, selectedCases);
  return await createDeckFromAssets(proposal, assets);
}

export async function createOnePager(rawProposal: ProposalDocument) {
  const proposal = buildProposal(rawProposal);
  const theme = presentationThemeOf(proposal);
  const selectedProducts = products.filter((product) => proposal.products.some((item) => item.productId === product.id));
  const selectedCases = cases.filter((item) => proposal.caseIds.includes(item.id));
  const fontProfile = fontProfileForBrand(proposal.client.brandId);
  const coverBackgroundId = proposal.cover.backgroundId ?? 'prez-bg-1';
  const missingAssets = await validateAssets(['/logos/calltouch-light.svg', '/logos/calltouch-dark.svg', `/backgrounds/${coverBackgroundId}.webp`, `/backgrounds-light/${coverBackgroundId}.png`, fontProfile.headingFile, ...fontProfile.bodyFiles.map((font) => font.path), ...selectedProducts.map((product) => productIconPath(product.id, product.icon)), ...selectedProducts.map((product) => product.icon).filter((path): path is string => Boolean(path)), ...selectedCases.map((item) => item.logo)]);
  if (missingAssets.length) throw new Error(`Не найдены обязательные ассеты: ${missingAssets.join(', ')}`);
  const assets = await loadPresentationAssets(selectedProducts, proposal.client.brandId, coverBackgroundId, selectedCases);
  const pptx = new EmbeddedPptxGenJS();
  for (const font of assets.fonts ?? []) await pptx.addFont(font);
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Calltouch';
  pptx.company = 'Calltouch';
  pptx.subject = `One-pager для ${proposal.client.name}`;
  pptx.title = `Calltouch One-pager — ${proposal.client.name}`;
  pptx.theme = { headFontFace: fontProfile.heading, bodyFontFace: fontProfile.body };
  renderOnePager(pptx, proposal, assets, theme);
  return pptx;
}

export async function downloadPptx(proposal: ProposalDocument) {
  const pptx = await createPresentation(proposal);
  const safeName = safeClientName(proposal.client.name);
  await pptx.writeFile({ fileName: `Calltouch-${safeName}.pptx`, compression: true });
}

export async function downloadOnePagerPptx(proposal: ProposalDocument) {
  const pptx = await createOnePager(proposal);
  const safeName = safeClientName(proposal.client.name);
  await pptx.writeFile({ fileName: `Calltouch-${safeName}-one-pager.pptx`, compression: true });
}

export async function createPptxBlob(proposal: ProposalDocument): Promise<Blob> {
  const pptx = await createPresentation(proposal);
  const output = await pptx.write({ outputType: 'blob', compression: true });
  if (!(output instanceof Blob)) throw new Error('Не удалось сформировать PPTX');
  return output;
}

export async function createOnePagerPptxBlob(proposal: ProposalDocument): Promise<Blob> {
  const pptx = await createOnePager(proposal);
  const output = await pptx.write({ outputType: 'blob', compression: true });
  if (!(output instanceof Blob)) throw new Error('Не удалось сформировать One-pager PPTX');
  return output;
}
