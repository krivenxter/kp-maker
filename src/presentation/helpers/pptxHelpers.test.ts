import { describe, expect, it } from 'vitest';
import type PptxGenJS from 'pptxgenjs';
import { addImageFit, fitTextToBox } from './pptxHelpers';

function recorder() {
  const images: Array<Record<string, unknown>> = [];
  return {
    images,
    slide: { addImage: (options: Record<string, unknown>) => images.push(options) } as unknown as PptxGenJS.Slide,
  };
}

describe('addImageFit', () => {
  const logo = `data:image/svg+xml;base64,${Buffer.from('<svg width="220" height="39" viewBox="0 0 220 39"></svg>').toString('base64')}`;

  it('записывает в PPTX исходное соотношение сторон SVG, а не размеры контейнера', () => {
    const { slide, images } = recorder();
    addImageFit(slide, logo, { x: 0.72, y: 0.36, w: 1.52, h: 0.42 }, 'contain');
    const image = images[0] as { w: number; h: number; sizing?: unknown };
    expect(image.w / image.h).toBeCloseTo(220 / 39, 6);
    expect(image.sizing).toBeUndefined();
  });

  it('сохраняет пропорции и при заполнении фона', () => {
    const { slide, images } = recorder();
    addImageFit(slide, logo, { x: 0, y: 0, w: 13.333, h: 7.5 }, 'cover');
    const image = images[0] as { w: number; h: number };
    expect(image.w / image.h).toBeCloseTo(220 / 39, 6);
    expect(image.w).toBeGreaterThanOrEqual(13.333);
    expect(image.h).toBeGreaterThanOrEqual(7.5);
  });
});

describe('fitTextToBox', () => {
  it('сохраняет заданный кегль, когда текст помещается', () => {
    const fitted = fitTextToBox('КОРОТКИЙ ЗАГОЛОВОК', {
      x: 0.7, y: 1, w: 8, h: 0.6, fontFace: 'Unbounded', fontSize: 24, lineSpacing: 26, margin: 0, fit: 'shrink', wrap: false,
    }, { singleLine: true, minFontSize: 14 });
    expect(fitted.fontSize).toBe(24);
    expect(fitted.fit).toBeUndefined();
  });

  it('уменьшает кегль заранее, если длинный заголовок не помещается в одну строку', () => {
    const fitted = fitTextToBox('РЕШЕНИЕ ДЛЯ ОЧЕНЬ ДЛИННОГО НАЗВАНИЯ КОМПЛЕКСНОГО ПРОЕКТА', {
      x: 0.7, y: 1, w: 6.95, h: 0.58, fontFace: 'Unbounded', fontSize: 24, lineSpacing: 26, margin: 0, fit: 'shrink', wrap: false,
    }, { singleLine: true, minFontSize: 14 });
    expect(Number(fitted.fontSize)).toBeLessThan(24);
    expect(fitted.fit).toBeUndefined();
  });
});
