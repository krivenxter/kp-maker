import type { PresentationTheme } from '../../presentation/design/tokens';

type PresentationThemeToggleProps = {
  value: PresentationTheme;
  onChange: (value: PresentationTheme) => void;
};

export function PresentationThemeToggle({ value, onChange }: PresentationThemeToggleProps) {
  return <div className="presentation-theme-control">
    <div className="presentation-theme-copy">
      <b>Стиль презентации</b>
      <span>Меняет оформление превью, PPTX, PDF и One-pager</span>
    </div>
    <div className="presentation-theme-toggle" role="group" aria-label="Стиль презентации">
      <button type="button" className={value === 'dark' ? 'selected' : ''} aria-pressed={value === 'dark'} onClick={() => onChange('dark')}>
        <i className="theme-preview theme-preview-dark" aria-hidden="true"><span /></i>
        <span>Тёмная</span>
      </button>
      <button type="button" className={value === 'light' ? 'selected' : ''} aria-pressed={value === 'light'} onClick={() => onChange('light')}>
        <i className="theme-preview theme-preview-light" aria-hidden="true"><span /></i>
        <span>Светлая</span>
      </button>
    </div>
  </div>;
}
