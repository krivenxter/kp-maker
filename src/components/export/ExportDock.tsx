export type ExportFormat = 'full' | 'onepager' | 'both';

type Props = {
  valid: boolean;
  issueCount: number;
  busy: boolean;
  status: string;
  format: ExportFormat;
  onePagerBlocked: boolean;
  pdfState: 'checking' | 'available' | 'unavailable';
  exportType?: 'pptx' | 'pdf';
  elapsedSeconds?: number;
  onFormatChange: (format: ExportFormat) => void;
  onExport: (type: 'pptx' | 'pdf') => void;
};

function exportEstimate(type: 'pptx' | 'pdf' | undefined, format: ExportFormat) {
  if (type === 'pdf') return format === 'both' ? 'Обычно до 40 секунд' : 'Обычно до 20 секунд';
  if (type === 'pptx') return format === 'both' ? 'Обычно до 10 секунд' : 'Обычно до 8 секунд';
  return '';
}

function formatElapsed(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function ExportDock({ valid, issueCount, busy, status, format, onePagerBlocked, pdfState, exportType, elapsedSeconds = 0, onFormatChange, onExport }: Props) {
  const ready = valid && !onePagerBlocked;
  const blocked = busy || !ready;
  const estimate = exportEstimate(exportType, format);
  return <div className="export-dock" aria-busy={busy}>
    <div className="export-readiness">
      <i className={busy ? 'working' : ready ? 'ready' : 'blocked'} aria-hidden="true" />
      <div>
        <b>{busy ? 'Файл рендерится — не закрывайте вкладку' : ready ? 'КП готово к экспорту' : valid ? 'One-pager нужно сократить' : `Осталось исправить: ${issueCount}`}</b>
        <span role="status" aria-live="polite">{busy ? `${status || 'Подготавливаю файл…'} · Прошло ${formatElapsed(elapsedSeconds)} · ${estimate}` : status || (ready ? 'Выберите формат и скачайте готовый файл' : 'Ошибки перечислены выше')}</span>
      </div>
    </div>
    <div className="export-format" role="radiogroup" aria-label="Формат экспорта">
      <button type="button" disabled={busy} className={format === 'full' ? 'active' : ''} aria-pressed={format === 'full'} onClick={() => onFormatChange('full')}>Полное КП</button>
      <button type="button" disabled={busy} className={format === 'onepager' ? 'active' : ''} aria-pressed={format === 'onepager'} onClick={() => onFormatChange('onepager')}>One-pager</button>
      <button type="button" disabled={busy} className={format === 'both' ? 'active' : ''} aria-pressed={format === 'both'} onClick={() => onFormatChange('both')}>Оба</button>
    </div>
    <div className="export-actions">
      <button className={`button secondary ${busy && exportType === 'pdf' ? 'exporting' : ''}`} title={pdfState === 'unavailable' ? 'PDF-сервис недоступен — PPTX по-прежнему доступен' : undefined} disabled={blocked || pdfState !== 'available'} onClick={() => onExport('pdf')}>
        {busy && exportType === 'pdf' ? <><i className="button-spinner" aria-hidden="true" />PDF · {formatElapsed(elapsedSeconds)}</> : pdfState === 'checking' ? 'Проверяю PDF…' : pdfState === 'unavailable' ? 'PDF недоступен' : 'Скачать PDF'}
      </button>
      <button className={`button primary ${busy && exportType === 'pptx' ? 'exporting' : ''}`} disabled={blocked} onClick={() => onExport('pptx')}>
        {busy && exportType === 'pptx' ? <><i className="button-spinner" aria-hidden="true" />PPTX · {formatElapsed(elapsedSeconds)}</> : 'Скачать PPTX'}
      </button>
      <details className="font-download">
        <summary aria-label="Шрифты для PPTX">Aa <span>Шрифты</span></summary>
        <div className="font-download-popover">
          <b>Шрифты для редактирования</b>
          <p>В PPTX они уже встраиваются автоматически. Скачайте файлы, если нужно установить их отдельно.</p>
          <div className="font-download-links">
            <a href="/fonts/google/Manrope-Variable.ttf" download="Manrope-Variable.ttf">Manrope</a>
            <a href="/fonts/DelaGothicOne-Regular.ttf" download="DelaGothicOne-Regular.ttf">Dela Gothic One</a>
          </div>
        </div>
      </details>
    </div>
  </div>;
}
