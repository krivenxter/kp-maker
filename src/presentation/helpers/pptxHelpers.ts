import type PptxGenJS from 'pptxgenjs';
import { accentTextColor, COLORS, FONT_PROFILES, RADIUS, SLIDE, textStyle, type FontProfile, type PresentationTheme } from '../design/tokens';
import { LAYOUT } from '../design/layout';

export type Slide = PptxGenJS.Slide;
type ImageBox = { x: number; y: number; w: number; h: number };
type ImageDimensions = { width: number; height: number };
type AdaptiveTextConfig = {
  minFontSize?: number;
  maxLines?: number;
  singleLine?: boolean;
};

function marginPoints(margin: PptxGenJS.Margin | undefined): [number, number, number, number] {
  if (Array.isArray(margin)) return margin;
  const value = typeof margin === 'number' ? margin : 0;
  return [value, value, value, value];
}

function characterWidth(character: string): number {
  if (/\s/u.test(character)) return 0.32;
  if (/[ilI1|.,:;!'`]/u.test(character)) return 0.31;
  if (/[MWШЩЖФЮ@%]/u.test(character)) return 0.84;
  if (/[A-ZА-ЯЁ0-9]/u.test(character)) return 0.65;
  if (/[-–—+()[\]{}\/\\]/u.test(character)) return 0.4;
  return 0.55;
}

function textWidthPoints(text: string, fontSize: number, fontFace: string, charSpacing: number): number {
  const fontFactor = /Dela Gothic One|Unbounded/i.test(fontFace) ? 1.08 : 1;
  const glyphWidth = Array.from(text).reduce((sum, character) => sum + characterWidth(character), 0) * fontSize * fontFactor;
  return glyphWidth + Math.max(0, Array.from(text).length - 1) * charSpacing;
}

function wrappedLineCount(text: string, availableWidth: number, fontSize: number, fontFace: string, charSpacing: number): number {
  if (!text) return 1;
  return text.split('\n').reduce((total, paragraph) => {
    const words = paragraph.trim().split(/\s+/u).filter(Boolean);
    if (!words.length) return total + 1;
    let lines = 1;
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidthPoints(candidate, fontSize, fontFace, charSpacing) <= availableWidth) {
        line = candidate;
        continue;
      }
      if (line) lines += 1;
      const wordWidth = textWidthPoints(word, fontSize, fontFace, charSpacing);
      lines += Math.max(0, Math.ceil(wordWidth / availableWidth) - 1);
      line = word;
    }
    return total + lines;
  }, 0);
}

export function fitTextToBox(text: string, options: PptxGenJS.TextPropsOptions, config: AdaptiveTextConfig = {}): PptxGenJS.TextPropsOptions {
  const initialFontSize = Number(options.fontSize ?? 18);
  const minFontSize = Math.min(initialFontSize, config.minFontSize ?? Math.max(6, initialFontSize * 0.64));
  const initialLineSpacing = Number(options.lineSpacing ?? initialFontSize * 1.18);
  const [marginTop, marginRight, marginBottom, marginLeft] = marginPoints(options.margin);
  const availableWidth = Math.max(1, Number(options.w) * 72 - marginLeft - marginRight);
  const availableHeight = Math.max(1, Number(options.h) * 72 - marginTop - marginBottom);
  const fontFace = String(options.fontFace ?? 'Arial');
  const charSpacing = Number(options.charSpacing ?? 0);
  const singleLine = config.singleLine ?? (options.wrap === false || options.breakLine === false);
  const maxLines = config.maxLines ?? (singleLine ? 1 : Number.POSITIVE_INFINITY);
  let fittedFontSize = initialFontSize;

  const fits = (fontSize: number) => {
    const lineSpacing = initialLineSpacing * (fontSize / initialFontSize);
    const lineCount = singleLine
      ? text.split('\n').length
      : wrappedLineCount(text, availableWidth, fontSize, fontFace, charSpacing);
    const widestExplicitLine = Math.max(...text.split('\n').map((line) => textWidthPoints(line, fontSize, fontFace, charSpacing)), 0);
    const widthFits = !singleLine || widestExplicitLine <= availableWidth;
    const heightFits = lineCount <= maxLines && lineCount * lineSpacing * 1.12 <= availableHeight;
    return widthFits && heightFits;
  };

  while (fittedFontSize > minFontSize && !fits(fittedFontSize)) fittedFontSize = Math.max(minFontSize, fittedFontSize - 0.5);
  while (fittedFontSize > 4.5 && !fits(fittedFontSize)) fittedFontSize = Math.max(4.5, fittedFontSize - 0.5);
  const fittedOptions = { ...options };
  delete fittedOptions.fit;
  fittedOptions.fontSize = Number(fittedFontSize.toFixed(1));
  fittedOptions.lineSpacing = Number((initialLineSpacing * (fittedFontSize / initialFontSize)).toFixed(1));
  return fittedOptions;
}

export function addAdaptiveText(slide: Slide, text: string, options: PptxGenJS.TextPropsOptions, config: AdaptiveTextConfig = {}) {
  slide.addText(text, fitTextToBox(text, options, config));
}

function bytesFromDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } | undefined {
  const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return undefined;
  try {
    const decoded = match[2] ? atob(match[3]) : decodeURIComponent(match[3]);
    return { mime: match[1].toLowerCase(), bytes: Uint8Array.from(decoded, (character) => character.charCodeAt(0)) };
  } catch {
    return undefined;
  }
}

function svgDimensions(bytes: Uint8Array): ImageDimensions | undefined {
  const svg = new TextDecoder().decode(bytes);
  const width = /\bwidth=["']([\d.]+)(?:px)?["']/.exec(svg)?.[1];
  const height = /\bheight=["']([\d.]+)(?:px)?["']/.exec(svg)?.[1];
  if (width && height) return { width: Number(width), height: Number(height) };
  const viewBox = /\bviewBox=["'][\d.-]+[ ,]+[\d.-]+[ ,]+([\d.]+)[ ,]+([\d.]+)["']/.exec(svg);
  return viewBox ? { width: Number(viewBox[1]), height: Number(viewBox[2]) } : undefined;
}

function rasterDimensions(mime: string, bytes: Uint8Array): ImageDimensions | undefined {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (mime.includes('png') && bytes.length >= 24) return { width: view.getUint32(16), height: view.getUint32(20) };
  if (mime.includes('gif') && bytes.length >= 10) return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  if ((mime.includes('jpeg') || mime.includes('jpg')) && bytes.length > 4) {
    let offset = 2;
    while (offset + 8 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      const length = view.getUint16(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { width: view.getUint16(offset + 7), height: view.getUint16(offset + 5) };
      }
      if (length < 2) break;
      offset += length + 2;
    }
  }
  if (mime.includes('webp') && bytes.length >= 30) {
    const chunk = String.fromCharCode(...bytes.slice(12, 16));
    if (chunk === 'VP8X') {
      const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
      return { width, height };
    }
    if (chunk === 'VP8L' && bytes[20] === 0x2f) {
      const width = 1 + bytes[21] + ((bytes[22] & 0x3f) << 8);
      const height = 1 + ((bytes[22] & 0xc0) >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10);
      return { width, height };
    }
    if (chunk === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
    }
  }
  return undefined;
}

function imageDimensions(imageData: string): ImageDimensions | undefined {
  const decoded = bytesFromDataUrl(imageData);
  if (!decoded) return undefined;
  const dimensions = decoded.mime.includes('svg') ? svgDimensions(decoded.bytes) : rasterDimensions(decoded.mime, decoded.bytes);
  return dimensions?.width && dimensions.height ? dimensions : undefined;
}

function fittedBox(box: ImageBox, dimensions: ImageDimensions, fit: 'contain' | 'cover'): ImageBox {
  const imageRatio = dimensions.width / dimensions.height;
  const boxRatio = box.w / box.h;
  const widthDriven = fit === 'contain' ? imageRatio >= boxRatio : imageRatio < boxRatio;
  const w = widthDriven ? box.w : box.h * imageRatio;
  const h = widthDriven ? box.w / imageRatio : box.h;
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
}

export function addImageFit(slide: Slide, imageData: string, box: ImageBox, fit: 'contain' | 'cover', options: { rounding?: boolean; transparency?: number } = {}) {
  const dimensions = imageDimensions(imageData);
  if (dimensions) slide.addImage({ data: imageData, ...fittedBox(box, dimensions, fit), ...options });
  else slide.addImage({ data: imageData, ...box, ...options, sizing: { type: fit, w: box.w, h: box.h } });
}

export function addCaseLogo(pptx: PptxGenJS, slide: Slide, imageData: string, box: ImageBox, mode: 'dark' | 'light', darkImageData?: string) {
  const plateColor = mode === 'dark' ? COLORS.white : 'FAFBFC';
  slide.addShape(pptx.ShapeType.roundRect, {
    ...box,
    rectRadius: Math.min(0.08, box.h * 0.22),
    fill: { color: plateColor, transparency: mode === 'dark' ? 90 : 0 },
    line: { color: mode === 'dark' ? COLORS.white : 'E8EDEF', transparency: mode === 'dark' ? 72 : 0, width: 0.5 },
  });
  const insetX = Math.min(0.06, box.w * 0.1);
  const insetY = Math.min(0.06, box.h * 0.16);
  addImageFit(slide, mode === 'light' ? (darkImageData ?? imageData) : imageData, { x: box.x + insetX, y: box.y + insetY, w: box.w - insetX * 2, h: box.h - insetY * 2 }, 'contain');
}

export function addBackground(pptx: PptxGenJS, slide: Slide, mode: 'dark' | 'light', imageData?: string, theme: PresentationTheme = 'dark') {
  slide.background = { color: mode === 'dark' ? COLORS.dark : theme === 'light' ? COLORS.white : COLORS.paper };
  if (imageData) addImageFit(slide, imageData, { x: 0, y: 0, w: SLIDE.width, h: SLIDE.height }, 'cover');
}

export function addBrandHeader(pptx: PptxGenJS, slide: Slide, mode: 'dark' | 'light', logoData?: string, clientName?: string, accent: string = COLORS.cyan, fonts: FontProfile = FONT_PROFILES.neutral, clientSite?: string) {
  const headerY = 0.36;
  if (logoData) addImageFit(slide, logoData, { x: SLIDE.marginX, y: headerY, w: 1.52, h: 0.42 }, 'contain', { transparency: 0 });
  else slide.addText('Calltouch', { x: SLIDE.marginX, y: headerY, w: 1.6, h: 0.42, ...textStyle(fonts, 'heading'), color: mode === 'dark' ? COLORS.white : COLORS.ink, margin: 0, valign: 'middle' });
  const normalizedSite = clientSite?.trim() ?? '';
  const hasSite = normalizedSite.length > 0;
  const clientNameBox = hasSite
    ? { x: 8.18, w: 2.92 }
    : { x: 8.18, w: 4.43 };
  if (clientName) {
    addAdaptiveText(slide, clientName.toUpperCase(), { x: clientNameBox.x, y: headerY + 0.11, w: clientNameBox.w, h: 0.2, ...textStyle(fonts, 'caption'), color: accent, align: 'right', valign: 'middle', margin: 0, wrap: false }, { singleLine: true, minFontSize: 6 });
  }
  if (hasSite) {
    const siteBox = { x: 11.28, y: headerY, w: 1.33, h: 0.42 };
    const displaySite = normalizedSite.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    const siteUrl = /^https?:\/\//i.test(normalizedSite) ? normalizedSite : `https://${displaySite}`;
    slide.addShape(pptx.ShapeType.roundRect, { ...siteBox, rectRadius: 0.14, fill: { color: mode === 'dark' ? COLORS.white : COLORS.ink, transparency: mode === 'dark' ? 88 : 92 }, line: { color: mode === 'dark' ? COLORS.white : COLORS.ink, transparency: 82, width: 0.6 }, hyperlink: { url: siteUrl } });
    addAdaptiveText(slide, displaySite, { x: siteBox.x + 0.1, y: siteBox.y + 0.11, w: siteBox.w - 0.2, h: 0.18, ...textStyle(fonts, 'caption'), color: mode === 'dark' ? COLORS.white : COLORS.ink, align: 'center', valign: 'middle', margin: 0, wrap: false }, { singleLine: true, minFontSize: 6 });
  }
}

export function addTitle(slide: Slide, title: string, mode: 'dark' | 'light' = 'dark', kicker?: string, accent: string = COLORS.cyan, fonts: FontProfile = FONT_PROFILES.neutral) {
  if (kicker) slide.addText(kicker.toUpperCase(), { x: SLIDE.marginX, y: 0.96, w: 6.5, h: 0.22, ...textStyle(fonts, 'caption'), bold: true, charSpacing: 1.8, color: accent, margin: 0 });
  addAdaptiveText(slide, title.toUpperCase(), { x: SLIDE.marginX, y: kicker ? 1.14 : 0.96, w: 11.7, h: 0.48, ...textStyle(fonts, 'title'), color: mode === 'dark' ? COLORS.white : COLORS.ink, margin: 0, wrap: false }, { singleLine: true, minFontSize: 16 });
}

export function addCard(pptx: PptxGenJS, slide: Slide, box: { x: number; y: number; w: number; h: number }, mode: 'dark' | 'light' = 'dark', options?: { fill?: string; line?: string; fillTransparency?: number; lineTransparency?: number }) {
  slide.addShape(pptx.ShapeType.roundRect, { ...box, rectRadius: RADIUS, fill: { color: options?.fill ?? (mode === 'dark' ? COLORS.darkCard : COLORS.white), transparency: options?.fillTransparency ?? 0 }, line: { color: options?.line ?? (mode === 'dark' ? '2B3940' : COLORS.line), width: 0.8, transparency: options?.lineTransparency ?? 0 } });
}

export function addPill(pptx: PptxGenJS, slide: Slide, text: string, box: { x: number; y: number; w: number; h?: number }, accent: string = COLORS.cyan, fonts: FontProfile = FONT_PROFILES.neutral) {
  slide.addShape(pptx.ShapeType.roundRect, { x: box.x, y: box.y, w: box.w, h: box.h ?? 0.3, rectRadius: 0.14, fill: { color: accent, transparency: 8 }, line: { color: accent, transparency: 100 } });
  addAdaptiveText(slide, text, { x: box.x + 0.08, y: box.y + 0.03, w: box.w - 0.16, h: (box.h ?? 0.3) - 0.05, ...textStyle(fonts, 'caption'), color: accentTextColor(accent), margin: 0, align: 'center', valign: 'middle', wrap: false }, { singleLine: true, minFontSize: 6 });
}

export function addArrow(pptx: PptxGenJS, slide: Slide, x: number, y: number, w: number, color: string = COLORS.cyan) {
  slide.addShape(pptx.ShapeType.chevron, { x, y, w, h: 0.22, fill: { color }, line: { color, transparency: 100 } });
}

export function addNotes(slide: Slide) {
  slide.addNotes('[Sources]\n- Internal Calltouch product, pricing and case data supplied with the project.');
}
