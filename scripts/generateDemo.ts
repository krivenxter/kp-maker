import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { demoFixtures } from '../src/data/demoFixtures';
import products from '../src/data/products.json';
import cases from '../src/data/cases.json';
import { createDeckFromAssets } from '../src/presentation/engine/createPresentation';
import { renderOnePager } from '../src/presentation/slides/onePagerRenderer';
import PptxGenJS from 'pptxgenjs';
import { withPPTXEmbedFonts } from 'pptx-embed-fonts/pptxgenjs';
import { fontProfileForBrand } from '../src/presentation/design/tokens';
import { accentForBrand } from '../src/presentation/design/tokens';
import { FLOW_ICON_PATHS, productIconPath, tintEssentialSvg } from '../src/presentation/design/productIcons';
import { UI_ICONS } from '../src/presentation/design/uiIcons';

const root = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2).filter((value) => value !== '--');
const onePager = args.includes('--onepager');
const positionalArgs = args.filter((value) => value !== '--onepager');
const output = resolve(root, positionalArgs[0] || 'tmp/pptx/calltouch-demo.pptx');
const fixtureId = positionalArgs[1] || demoFixtures[0].id;
const fixture = demoFixtures.find((item) => item.id === fixtureId) ?? demoFixtures[0];

async function dataUrl(path: string, mime?: string) {
  const data = await readFile(path);
  const extension = extname(path).slice(1).toLowerCase();
  const contentType = mime || (extension === 'svg' ? 'image/svg+xml' : `image/${extension}`);
  return `data:${contentType};base64,${data.toString('base64')}`;
}

async function tintedSvgDataUrl(path: string, accent: string) {
  const svg = tintEssentialSvg(await readFile(path, 'utf8'), accent);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function arrayBuffer(path: string): Promise<ArrayBuffer> {
  const data = await readFile(path);
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

const selectedProducts = products.filter((product) => fixture.proposal.products.some((item) => item.productId === product.id));
const selectedCases = cases.filter((item) => fixture.proposal.caseIds.includes(item.id));
const fontProfile = fontProfileForBrand(fixture.proposal.client.brandId);
const delaFontProfile = fontProfileForBrand('neutral');
const accent = accentForBrand(fixture.proposal.client.brandId);
const assets = {
  logoLight: await dataUrl(resolve(root, 'calltouch-assets/logos/calltouch-light.svg')),
  logoDark: await dataUrl(resolve(root, 'calltouch-assets/logos/calltouch-dark.svg')),
  darkBackground: await dataUrl(resolve(root, 'tmp/pptx/prez-bg-1.png')),
  finalBackground: await dataUrl(resolve(root, 'tmp/pptx/prez-bg-6.png')),
  productIcons: Object.fromEntries(await Promise.all(selectedProducts.map(async (product) => [product.id, await tintedSvgDataUrl(resolve(root, `calltouch-assets${productIconPath(product.id, product.icon)}`), accent)]))),
  productVisuals: Object.fromEntries(await Promise.all(selectedProducts.filter((product) => product.icon).map(async (product) => [product.id, await dataUrl(resolve(root, `calltouch-assets${product.icon}`))]))),
  caseLogos: Object.fromEntries(await Promise.all(selectedCases.map(async (item) => [item.id, await dataUrl(resolve(root, `calltouch-assets${item.logo}`))]))),
  caseLogosDark: Object.fromEntries(await Promise.all(selectedCases.map(async (item) => [item.id, await dataUrl(resolve(root, `calltouch-assets${item.logo.replace('/case-logos/', '/case-logos-dark/')}`))]))),
  flowIcons: Object.fromEntries(await Promise.all(FLOW_ICON_PATHS.map(async (path) => [path, await tintedSvgDataUrl(resolve(root, `calltouch-assets${path}`), accent)]))),
  uiIcons: Object.fromEntries(await Promise.all(Object.entries(UI_ICONS).map(async ([name, path]) => [
    name,
    await tintedSvgDataUrl(
      resolve(root, `calltouch-assets${path}`),
      name === 'userPlaceholder' || name === 'email' || name === 'phone' ? 'FFFFFF' : '142027',
    ),
  ]))),
  fonts: [
    { fontFace: fontProfile.heading, fontFile: await arrayBuffer(resolve(root, `calltouch-assets${fontProfile.headingFile}`)) },
    { fontFace: fontProfile.body, fontFile: await arrayBuffer(resolve(root, `calltouch-assets${fontProfile.bodyFile}`)) },
    ...(fontProfile.heading === 'Dela Gothic One' ? [] : [{ fontFace: 'Dela Gothic One', fontFile: await arrayBuffer(resolve(root, `calltouch-assets${delaFontProfile.headingFile}`)) }]),
  ],
};

const pptx = onePager ? (() => {
  const Deck = withPPTXEmbedFonts(PptxGenJS);
  const onePagerDeck = new Deck();
  onePagerDeck.layout = 'LAYOUT_WIDE';
  onePagerDeck.theme = { headFontFace: fontProfile.heading, bodyFontFace: fontProfile.body };
  renderOnePager(onePagerDeck, fixture.proposal, assets);
  return onePagerDeck;
})() : await createDeckFromAssets(fixture.proposal, assets);
await pptx.writeFile({ fileName: output, compression: true });
console.log(output);
