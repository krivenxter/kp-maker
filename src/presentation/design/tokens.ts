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
};

export const FONT_PROFILES: Record<'neutral' | 'exlantix', FontProfile> = {
  neutral: {
    heading: 'Dela Gothic One',
    body: 'Manrope',
    headingFile: '/fonts/DelaGothicOne-Regular.ttf',
    bodyFile: '/fonts/google/Manrope-Variable.ttf',
  },
  exlantix: {
    heading: 'Unbounded',
    body: 'Manrope',
    headingFile: '/fonts/google/Unbounded-Variable.ttf',
    bodyFile: '/fonts/google/Manrope-Variable.ttf',
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
    bold: role !== 'body' && role !== 'caption',
    lineSpacing: preset.lineSpacing,
    ...(heading ? capsHeadingSpacing(fonts, preset.size) : {}),
  } as const;
}

export const RADIUS = 0.16;
export const CARD_GAP = 0.18;

export function accentForBrand(brandId: string): string {
  return brandId === 'exlantix' ? COLORS.gold : COLORS.cyan;
}
