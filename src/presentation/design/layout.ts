import { CARD_GAP, SLIDE } from './tokens';

export function columns(count: number, top: number, height: number, left: number = SLIDE.marginX, right: number = SLIDE.marginX) {
  const width = (SLIDE.width - left - right - CARD_GAP * (count - 1)) / count;
  return Array.from({ length: count }, (_, index) => ({
    x: left + index * (width + CARD_GAP),
    y: top,
    w: width,
    h: height,
  }));
}

export const LAYOUT = {
  contentTop: 1.42,
  contentBottom: 7.08,
  coverTitle: { x: 0.76, y: 1.48, w: 7.2, h: 1.35 },
  coverSubtitle: { x: 0.78, y: 2.88, w: 6.5, h: 0.72 },
  managerCard: { x: 0.78, y: 5.78, w: 4.1, h: 1.08 },
} as const;
