import type PptxGenJS from 'pptxgenjs';
import products from '../../data/products.json';
import cases from '../../data/cases.json';
import { demoFixtures } from '../../data/demoFixtures';
import type { ProposalDocument } from '../../schemas/proposal';
import type { PresentationAssets } from '../engine/assets';
import { accentForBrand, COLORS } from '../design/tokens';
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
  return {
    ...fallback,
    ...proposal,
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
    finalBackground: '/backgrounds/prez-bg-6.webp',
    productIcons: Object.fromEntries(products.map((product) => [product.id, tintedIconPath(productIconPath(product.id, product.icon), accent)])),
    productVisuals: Object.fromEntries(products.filter((product) => product.icon).map((product) => [product.id, product.icon])),
    caseLogos: Object.fromEntries(cases.filter((item) => item.logo).map((item) => [item.id, item.logo])),
    caseLogosDark: Object.fromEntries(cases.filter((item) => item.logo).map((item) => [item.id, `${item.logo}?tint=${COLORS.ink}`])),
    flowIcons: Object.fromEntries(FLOW_ICON_PATHS.map((path) => [path, tintedIconPath(path, accent)])),
    uiIcons: Object.fromEntries(Object.entries(UI_ICONS).map(([name, path]) => [name, tintedIconPath(path, name === 'userPlaceholder' || name === 'email' || name === 'phone' ? COLORS.white : COLORS.ink)])),
  };
  const pptx = deck as unknown as PptxGenJS;

  renderCoverSlide(pptx, proposal, assets);
  renderContextSlide(pptx, proposal, assets);
  renderConfigurationSlide(pptx, proposal, assets);
  renderPricingSlide(pptx, proposal, assets);
  renderFlowSlide(pptx, proposal, assets);
  renderCasesSlide(pptx, proposal, assets);
  renderContactsSlide(pptx, proposal, assets);

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
    finalBackground: '/backgrounds/prez-bg-6.webp',
    productIcons: Object.fromEntries(products.map((product) => [product.id, tintedIconPath(productIconPath(product.id, product.icon), accent)])),
    productVisuals: Object.fromEntries(products.filter((product) => product.icon).map((product) => [product.id, product.icon])),
    caseLogos: Object.fromEntries(cases.filter((item) => item.logo).map((item) => [item.id, item.logo])),
    caseLogosDark: Object.fromEntries(cases.filter((item) => item.logo).map((item) => [item.id, `${item.logo}?tint=${COLORS.ink}`])),
    flowIcons: Object.fromEntries(FLOW_ICON_PATHS.map((path) => [path, tintedIconPath(path, accent)])),
    uiIcons: Object.fromEntries(Object.entries(UI_ICONS).map(([name, path]) => [name, tintedIconPath(path, name === 'userPlaceholder' || name === 'email' || name === 'phone' ? COLORS.white : COLORS.ink)])),
  };
  renderOnePager(deck as unknown as PptxGenJS, proposal, assets);
  return deck.scenes;
}
