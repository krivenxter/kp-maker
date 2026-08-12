import type PptxGenJS from 'pptxgenjs';
import products from '../../data/products.json';
import cases from '../../data/cases.json';
import { demoFixtures } from '../../data/demoFixtures';
import type { ProposalDocument } from '../../schemas/proposal';
import type { PresentationAssets } from '../engine/assets';
import { accentForBrand, COLORS, presentationThemeOf } from '../design/tokens';
import { FLOW_ICON_PATHS, productIconPath, tintedIconPath } from '../design/productIcons';
import { UI_ICONS } from '../design/uiIcons';
import {
  renderCasesSlide,
  renderConfigurationSlide,
  renderContactsSlide,
  renderContextSlide,
  renderCoverSlide,
  renderFlowSlide,
  renderPricingSlide,
} from '../slides/slideRenderers';
import { renderOnePager } from '../slides/onePagerRenderer';

export type PreviewElement =
  | { kind: 'text'; text: string; options: Record<string, unknown> }
  | { kind: 'shape'; shape: string; options: Record<string, unknown> }
  | { kind: 'image'; options: Record<string, unknown> };

export type PreviewScene = {
  background?: { color?: string };
  elements: PreviewElement[];
};

class PreviewSlideRecorder {
  background?: { color?: string };
  elements: PreviewElement[] = [];

  addText(text: string, options: Record<string, unknown>) {
    this.elements.push({ kind: 'text', text, options });
  }

  addShape(shape: string, options: Record<string, unknown>) {
    this.elements.push({ kind: 'shape', shape, options });
  }

  addImage(options: Record<string, unknown>) {
    this.elements.push({ kind: 'image', options });
  }

  addNotes() {}
}

class PreviewDeckRecorder {
  readonly ShapeType = {
    rect: 'rect',
    roundRect: 'roundRect',
    ellipse: 'ellipse',
    line: 'line',
    chevron: 'chevron',
  };
  readonly scenes: PreviewScene[] = [];

  addSlide() {
    const slide = new PreviewSlideRecorder();
    this.scenes.push(slide);
    return slide;
  }
}

function makePreviewSafe(proposal: ProposalDocument): ProposalDocument {
  const fixture = demoFixtures.find((item) => item.proposal.client.brandId === proposal.client.brandId) ?? demoFixtures[1];
  const fallback = structuredClone(fixture.proposal);
  const backgroundId = ['prez-bg-1', 'prez-bg-2', 'prez-bg-3', 'prez-bg-4', 'prez-bg-5'].includes(proposal.cover.backgroundId ?? '')
    ? proposal.cover.backgroundId
    : fallback.cover.backgroundId;
  return {
    ...fallback,
    ...proposal,
    presentationTheme: proposal.presentationTheme ?? fallback.presentationTheme,
    client: {
      ...fallback.client,
      ...proposal.client,
      name: proposal.client.name.trim() || 'Клиент',
    },
    project: {
      ...fallback.project,
      ...proposal.project,
      goal: proposal.project.goal.trim() || fallback.project.goal,
    },
    products: proposal.products.length ? proposal.products : fallback.products,
    pricing: {
      ...fallback.pricing,
      ...proposal.pricing,
      plans: proposal.pricing.plans.length ? proposal.pricing.plans : fallback.pricing.plans,
    },
    caseIds: proposal.caseIds.length + (proposal.customCases?.length ?? 0) >= 1
      ? proposal.caseIds
      : fallback.caseIds.slice(0, Math.max(0, 1 - (proposal.customCases?.length ?? 0))),
    cover: {
      ...fallback.cover,
      ...proposal.cover,
      backgroundId,
      subtitle: proposal.cover.subtitle.trim() || fallback.cover.subtitle,
    },
  };
}

export function buildPreviewScenes(rawProposal: ProposalDocument): PreviewScene[] {
  const proposal = makePreviewSafe(rawProposal);
  const accent = accentForBrand(proposal.client.brandId);
  const deck = new PreviewDeckRecorder();
  const assets: PresentationAssets = {
    logoLight: '/logos/calltouch-light.svg',
    logoDark: '/logos/calltouch-dark.svg',
    darkBackground: `/backgrounds/${proposal.cover.backgroundId ?? 'prez-bg-1'}.webp`,
    lightBackground: `/backgrounds-light/${proposal.cover.backgroundId ?? 'prez-bg-1'}.png`,
    finalBackground: '/backgrounds/prez-bg-6.webp',
    lightFinalBackground: '/backgrounds-light/prez-bg-6.png',
    productIcons: Object.fromEntries(products.map((product) => [product.id, tintedIconPath(productIconPath(product.id, product.icon), accent)])),
    productVisuals: Object.fromEntries(products.filter((product) => product.icon).map((product) => [product.id, product.icon])),
    caseLogos: Object.fromEntries(cases.filter((item) => item.logo).map((item) => [item.id, item.logo])),
    caseLogosDark: Object.fromEntries(cases.filter((item) => item.logo).map((item) => [item.id, item.logo.replace('/case-logos/', '/case-logos-dark/')])),
    flowIcons: Object.fromEntries(FLOW_ICON_PATHS.map((path) => [path, tintedIconPath(path, accent)])),
    uiIcons: Object.fromEntries(Object.entries(UI_ICONS).map(([name, path]) => [name, tintedIconPath(path, name === 'userPlaceholder' || name === 'email' || name === 'phone' ? COLORS.white : COLORS.ink)])),
    uiIconsDark: Object.fromEntries(Object.entries(UI_ICONS).map(([name, path]) => [name, tintedIconPath(path, COLORS.ink)])),
  };
  const pptx = deck as unknown as PptxGenJS;
  const theme = presentationThemeOf(proposal);

  renderCoverSlide(pptx, proposal, assets, theme);
  renderContextSlide(pptx, proposal, assets, theme);
  renderConfigurationSlide(pptx, proposal, assets, theme);
  renderPricingSlide(pptx, proposal, assets, theme);
  renderFlowSlide(pptx, proposal, assets, theme);
  renderCasesSlide(pptx, proposal, assets, theme);
  renderContactsSlide(pptx, proposal, assets, theme);

  return deck.scenes;
}

export function buildOnePagerPreviewScenes(rawProposal: ProposalDocument): PreviewScene[] {
  const proposal = makePreviewSafe(rawProposal);
  const accent = accentForBrand(proposal.client.brandId);
  const deck = new PreviewDeckRecorder();
  const assets: PresentationAssets = {
    logoLight: '/logos/calltouch-light.svg',
    logoDark: '/logos/calltouch-dark.svg',
    darkBackground: `/backgrounds/${proposal.cover.backgroundId ?? 'prez-bg-1'}.webp`,
    lightBackground: `/backgrounds-light/${proposal.cover.backgroundId ?? 'prez-bg-1'}.png`,
    finalBackground: '/backgrounds/prez-bg-6.webp',
    lightFinalBackground: '/backgrounds-light/prez-bg-6.png',
    productIcons: Object.fromEntries(products.map((product) => [product.id, tintedIconPath(productIconPath(product.id, product.icon), accent)])),
    productVisuals: Object.fromEntries(products.filter((product) => product.icon).map((product) => [product.id, product.icon])),
    caseLogos: Object.fromEntries(cases.filter((item) => item.logo).map((item) => [item.id, item.logo])),
    caseLogosDark: Object.fromEntries(cases.filter((item) => item.logo).map((item) => [item.id, item.logo.replace('/case-logos/', '/case-logos-dark/')])),
    flowIcons: Object.fromEntries(FLOW_ICON_PATHS.map((path) => [path, tintedIconPath(path, accent)])),
    uiIcons: Object.fromEntries(Object.entries(UI_ICONS).map(([name, path]) => [name, tintedIconPath(path, name === 'userPlaceholder' || name === 'email' || name === 'phone' ? COLORS.white : COLORS.ink)])),
    uiIconsDark: Object.fromEntries(Object.entries(UI_ICONS).map(([name, path]) => [name, tintedIconPath(path, COLORS.ink)])),
  };
  renderOnePager(deck as unknown as PptxGenJS, proposal, assets, presentationThemeOf(proposal));
  return deck.scenes;
}
