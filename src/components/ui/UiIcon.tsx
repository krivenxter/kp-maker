import type { CSSProperties } from 'react';
import { UI_ICONS, type UiIconName } from '../../presentation/design/uiIcons';

export function UiIcon({ name, className = '' }: { name: UiIconName; className?: string }) {
  return <span
    aria-hidden="true"
    className={`ui-icon ${className}`}
    style={{ '--ui-icon': `url("${UI_ICONS[name]}")` } as CSSProperties}
  />;
}
