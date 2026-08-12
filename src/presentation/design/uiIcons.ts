export const UI_ICONS = {
  check: '/icons/ui/check.svg',
  plus: '/icons/ui/plus.svg',
  close: '/icons/ui/close.svg',
  chevronDown: '/icons/ui/chevron-down.svg',
  arrowRight: '/icons/ui/arrow-right.svg',
  save: '/icons/ui/save.svg',
  userPlaceholder: '/icons/ui/gridicons_user.svg',
  email: '/icons/ui/mail-solid.svg',
  phone: '/icons/ui/phone-solid.svg',
} as const;

export type UiIconName = keyof typeof UI_ICONS;
