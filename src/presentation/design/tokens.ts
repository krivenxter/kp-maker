export const SLIDE = { width: 13.333, height: 7.5, marginX: 0.72, marginTop: 0.48 } as const;

export const COLORS = {
  ink: '142027',
  dark: '111A1F',
  darkCard: '1C282E',
  paper: 'F3F7F9',
  white: 'FFFFFF',
  muted: '93A4AC',
  line: 'DCE4E7',
  cyan: '19C6E6',
  cyanSoft: 'DDF8FC',
  purple: '8B3DFF',
  purpleSoft: 'EEE5FF',
  gold: 'D6A746',
  danger: 'D44B5F',
} as const;

export type PresentationTheme = 'dark' | 'light';

export const DEFAULT_PRESENTATION_THEME: PresentationTheme = 'dark';

export type PresentationPalette = {
  background: string;
  card: string;
  cardAlt: string;
  text: string;
  muted: string;
  mutedStrong: string;
  line: string;
  headerMode: 'dark' | 'light';
};

const PRESENTATION_PALETTES: Record<PresentationTheme, PresentationPalette> = {
  dark: {
    background: COLORS.dark,
    card: COLORS.darkCard,
    cardAlt: '17262D',
    text: COLORS.white,
    muted: 'B6C4CA',
    mutedStrong: 'AEBEC5',
    line: '314149',
    headerMode: 'dark',
  },
  light: {
    background: COLORS.white,
    card: 'FAFBFC',
    cardAlt: 'F5F7F8',
    text: COLORS.ink,
    muted: '718087',
    mutedStrong: '52636B',
    line: COLORS.line,
    headerMode: 'light',
  },
};

export function presentationThemeOf(value: { presentationTheme?: PresentationTheme } | undefined): PresentationTheme {
  return value?.presentationTheme === 'light' ? 'light' : DEFAULT_PRESENTATION_THEME;
}

export function paletteForTheme(theme: PresentationTheme): PresentationPalette {
  return PRESENTATION_PALETTES[theme];
}

export function surfaceMode(theme: PresentationTheme, defaultMode: 'dark' | 'light'): 'dark' | 'light' {
  return theme === 'light' ? 'light' : defaultMode;
}

export const TYPOGRAPHY = {
  display: { size: 30, lineSpacing: 32 },
  title: { size: 24, lineSpacing: 26 },
  heading: { size: 13, lineSpacing: 15 },
  body: { size: 10.5, lineSpacing: 13 },
  caption: { size: 8, lineSpacing: 10 },
} as const;

export type TypographyRole = keyof typeof TYPOGRAPHY;

export type FontProfile = {
  heading: string;
  body: string;
  headingFile: string;
  bodyFile: string;
  bodyFiles: ReadonlyArray<{ path: string; fontType: 'ttf' | 'otf' }>;
};

// Меняется в одном месте, чтобы быстро сравнить Museo Sans Cyrl и Manrope
// во всех UI-, preview-, PPTX- и PDF-рендерах.
export const ACTIVE_BODY_FONT: 'museo' | 'manrope' = 'museo';

const BODY_FONT_PROFILES = {
  museo: {
    family: 'Museo Sans Cyrl',
    browserFile: '/fonts/museosanscyrl-300.woff2',
    files: [
      { path: '/fonts/museosanscyrl-300.otf', fontType: 'otf' as const },
      { path: '/fonts/museosanscyrl-700.otf', fontType: 'otf' as const },
    ],
  },
  manrope: {
    family: 'Manrope',
    browserFile: '/fonts/google/Manrope-Variable.ttf',
    files: [
      { path: '/fonts/static/Manrope_400Regular.ttf', fontType: 'ttf' as const },
      { path: '/fonts/static/Manrope_500Medium.ttf', fontType: 'ttf' as const },
      { path: '/fonts/static/Manrope_600SemiBold.ttf', fontType: 'ttf' as const },
      { path: '/fonts/static/Manrope_700Bold.ttf', fontType: 'ttf' as const },
      { path: '/fonts/static/Manrope_800ExtraBold.ttf', fontType: 'ttf' as const },
    ],
  },
} as const;

export function activeBodyFontProfile() {
  return BODY_FONT_PROFILES[ACTIVE_BODY_FONT];
}

export const FONT_PROFILES: Record<'neutral' | 'exlantix', FontProfile> = {
  neutral: {
    heading: 'Dela Gothic One',
    body: activeBodyFontProfile().family,
    headingFile: '/fonts/DelaGothicOne-Regular.ttf',
    bodyFile: activeBodyFontProfile().browserFile,
    bodyFiles: activeBodyFontProfile().files,
  },
  exlantix: {
    heading: 'Unbounded',
    body: activeBodyFontProfile().family,
    headingFile: '/fonts/google/Unbounded-Variable.ttf',
    bodyFile: activeBodyFontProfile().browserFile,
    bodyFiles: activeBodyFontProfile().files,
  },
};

export function fontProfileForBrand(brandId: string): FontProfile {
  return brandId === 'exlantix' ? FONT_PROFILES.exlantix : FONT_PROFILES.neutral;
}

export function capsHeadingSpacing(fonts: FontProfile, fontSize: number) {
  return fonts.heading === 'Dela Gothic One'
    ? { charSpacing: 0.2, lineSpacing: fontSize + 2 }
    : {};
}

export function textStyle(fonts: FontProfile, role: TypographyRole) {
  const preset = TYPOGRAPHY[role];
  const heading = role === 'display' || role === 'title';
  return {
    fontFace: heading ? fonts.heading : fonts.body,
    fontSize: preset.size,
    bold: role !== 'body' && role !== 'caption' && fonts.heading !== 'Dela Gothic One',
    lineSpacing: preset.lineSpacing,
    ...(heading ? capsHeadingSpacing(fonts, preset.size) : {}),
  } as const;
}

export const RADIUS = 0.16;
export const CARD_GAP = 0.18;

export function accentForBrand(brandId: string): string {
  return brandId === 'exlantix' ? COLORS.gold : COLORS.cyan;
}

export function accentTextColor(accent: string): string {
  return accent.toUpperCase() === COLORS.cyan ? COLORS.white : COLORS.ink;
}
