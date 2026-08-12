import { accentForBrand, COLORS, fontProfileForBrand } from '../design/tokens';
import { FLOW_ICON_PATHS, productIconPath, tintEssentialSvg } from '../design/productIcons';
import { UI_ICONS } from '../design/uiIcons';

export type EmbeddedFontAsset = {
  fontFace: string;
  fontFile: ArrayBuffer;
};

export type PresentationAssets = {
  logoLight?: string;
  logoDark?: string;
  darkBackground?: string;
  finalBackground?: string;
  productIcons: Record<string, string>;
  productVisuals?: Record<string, string>;
  caseLogos?: Record<string, string>;
  caseLogosDark?: Record<string, string>;
  flowIcons?: Record<string, string>;
  uiIcons?: Record<string, string>;
  fonts?: EmbeddedFontAsset[];
};

async function fetchDataUrl(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

async function tintRasterDataUrl(dataUrl: string, color: string): Promise<string | undefined> {
  try {
    const image = new Image();
    image.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Не удалось загрузить изображение'));
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const red = Number.parseInt(color.slice(0, 2), 16);
    const green = Number.parseInt(color.slice(2, 4), 16);
    const blue = Number.parseInt(color.slice(4, 6), 16);
    for (let index = 0; index < pixels.data.length; index += 4) {
      if (pixels.data[index + 3] === 0) continue;
      pixels.data[index] = red;
      pixels.data[index + 1] = green;
      pixels.data[index + 2] = blue;
    }
    context.putImageData(pixels, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return undefined;
  }
}

async function fetchTintedIconDataUrl(url: string, accent: string): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    if (!url.endsWith('.svg')) return await fetchDataUrl(url);
    const svg = tintEssentialSvg(await response.text(), accent);
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  } catch {
    return undefined;
  }
}

async function rasterizeToPng(url: string): Promise<string | undefined> {
  return await new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) return resolve(undefined);
      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => resolve(undefined);
    image.src = url;
  });
}

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer | undefined> {
  try {
    const response = await fetch(url);
    return response.ok ? await response.arrayBuffer() : undefined;
  } catch {
    return undefined;
  }
}

const MANROPE_STATIC_FILES = [
  '/fonts/static/Manrope_400Regular.ttf',
  '/fonts/static/Manrope_500Medium.ttf',
  '/fonts/static/Manrope_600SemiBold.ttf',
  '/fonts/static/Manrope_700Bold.ttf',
  '/fonts/static/Manrope_800ExtraBold.ttf',
] as const;

const UNBOUNDED_STATIC_FILES = [
  '/fonts/static/Unbounded_300Light.ttf',
  '/fonts/static/Unbounded_400Regular.ttf',
  '/fonts/static/Unbounded_500Medium.ttf',
  '/fonts/static/Unbounded_600SemiBold.ttf',
  '/fonts/static/Unbounded_700Bold.ttf',
  '/fonts/static/Unbounded_800ExtraBold.ttf',
  '/fonts/static/Unbounded_900Black.ttf',
] as const;

async function loadCaseLogoDarkDataUrl(logo?: string): Promise<string | undefined> {
  if (!logo) return undefined;
  const darkLogo = await fetchDataUrl(logo.replace('/case-logos/', '/case-logos-dark/'));
  if (darkLogo) return darkLogo;
  const regularLogo = await fetchDataUrl(logo);
  return regularLogo ? tintRasterDataUrl(regularLogo, COLORS.ink) : undefined;
}

export async function loadPresentationAssets(productIcons: Array<{ id: string; icon?: string }>, brandId: string, coverBackgroundId = 'prez-bg-1', caseItems: Array<{ id: string; logo?: string }> = []): Promise<PresentationAssets> {
  const accent = accentForBrand(brandId);
  const iconEntries = await Promise.all(productIcons.map(async (product) => [product.id, await fetchTintedIconDataUrl(productIconPath(product.id, product.icon), accent)] as const));
  const visualEntries = await Promise.all(productIcons.map(async (product) => [product.id, product.icon ? await fetchDataUrl(product.icon) : undefined] as const));
  const caseLogoEntries = await Promise.all(caseItems.map(async (item) => [item.id, item.logo ? await fetchDataUrl(item.logo) : undefined] as const));
  const caseLogoDarkEntries = await Promise.all(caseItems.map(async (item) => [item.id, await loadCaseLogoDarkDataUrl(item.logo)] as const));
  const flowIconEntries = await Promise.all(FLOW_ICON_PATHS.map(async (path) => [path, await fetchTintedIconDataUrl(path, accent)] as const));
  const uiIconEntries = await Promise.all(Object.entries(UI_ICONS).map(async ([name, path]) => [name, await fetchTintedIconDataUrl(path, name === 'userPlaceholder' || name === 'email' || name === 'phone' ? COLORS.white : COLORS.ink)] as const));
  const fontProfile = fontProfileForBrand(brandId);
  const fontRequests = [
    ...(fontProfile.heading === 'Dela Gothic One' ? [fontProfile.headingFile] : UNBOUNDED_STATIC_FILES),
    ...MANROPE_STATIC_FILES,
  ];
  const fontBuffers = await Promise.all(fontRequests.map(async (path) => [path, await fetchArrayBuffer(path)] as const));
  return {
    logoLight: await fetchDataUrl('/logos/calltouch-light.svg'),
    logoDark: await fetchDataUrl('/logos/calltouch-dark.svg'),
    darkBackground: await rasterizeToPng(`/backgrounds/${coverBackgroundId}.webp`),
    finalBackground: await rasterizeToPng('/backgrounds/prez-bg-6.webp'),
    productIcons: Object.fromEntries(iconEntries.filter((entry): entry is readonly [string, string] => Boolean(entry[1]))),
    productVisuals: Object.fromEntries(visualEntries.filter((entry): entry is readonly [string, string] => Boolean(entry[1]))),
    caseLogos: Object.fromEntries(caseLogoEntries.filter((entry): entry is readonly [string, string] => Boolean(entry[1]))),
    caseLogosDark: Object.fromEntries(caseLogoDarkEntries.filter((entry): entry is readonly [string, string] => Boolean(entry[1]))),
    flowIcons: Object.fromEntries(flowIconEntries.filter((entry): entry is readonly [string, string] => Boolean(entry[1]))),
    uiIcons: Object.fromEntries(uiIconEntries.filter((entry): entry is readonly [string, string] => Boolean(entry[1]))),
    fonts: fontBuffers.filter((entry): entry is readonly [string, ArrayBuffer] => Boolean(entry[1])).map(([path, fontFile]) => ({
      fontFace: path.includes('/Manrope_') ? 'Manrope' : path.includes('/Unbounded_') ? 'Unbounded' : 'Dela Gothic One',
      fontFile,
    })),
  };
}

export async function validateAssets(urls: string[]): Promise<string[]> {
  const checks = await Promise.all([...new Set(urls.filter(Boolean))].map(async (url) => {
    try {
      const response = await fetch(url, { method: 'GET' });
      return response.ok ? null : url;
    } catch {
      return url;
    }
  }));
  return checks.filter((value): value is string => Boolean(value));
}
