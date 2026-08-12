import { useEffect, useId, useRef, useState } from 'react';
import { UiIcon } from './UiIcon';

export type SelectOption = { value: string; label: string };

type Props = {
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function CustomSelect({ value, options, onChange, disabled = false, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  return <div className={`custom-select ${open ? 'open' : ''} ${className}`} ref={rootRef}>
    <button
      type="button"
      className="custom-select-trigger"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={listId}
      disabled={disabled}
      onClick={() => setOpen(!open)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); }
        if (event.key === 'Escape') setOpen(false);
      }}
    >
      <span>{selected?.label ?? 'Выберите значение'}</span><UiIcon name="chevronDown" className="custom-select-chevron" />
    </button>
    {open && <div className="custom-select-menu" id={listId} role="listbox">
      {options.map((option) => <button
        type="button"
        role="option"
        aria-selected={option.value === value}
        className={option.value === value ? 'selected' : ''}
        onClick={() => { onChange(option.value); setOpen(false); }}
        key={option.value}
      ><span>{option.label}</span>{option.value === value && <UiIcon name="check" />}</button>)}
    </div>}
  </div>;
}
