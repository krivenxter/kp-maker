export type ExportFormat = 'full' | 'onepager' | 'both';

type Props = {
  valid: boolean;
  issueCount: number;
  busy: boolean;
  status: string;
  format: ExportFormat;
  onePagerBlocked: boolean;
  pdfState: 'checking' | 'available' | 'unavailable';
  onFormatChange: (format: ExportFormat) => void;
  onExport: (type: 'pptx' | 'pdf') => void;
};

export function ExportDock({ valid, issueCount, busy, status, format, onePagerBlocked, pdfState, onFormatChange, onExport }: Props) {
  const ready = valid && !onePagerBlocked;
  const blocked = busy || !ready;
  return <div className="export-dock">
    <div className="export-readiness">
      <i className={ready ? 'ready' : 'blocked'} aria-hidden="true" />
      <div>
        <b>{ready ? 'КП готово к экспорту' : valid ? 'One-pager нужно сократить' : `Осталось исправить: ${issueCount}`}</b>
        <span>{status || (ready ? 'Выберите формат и скачайте готовый файл' : 'Ошибки перечислены выше')}</span>
      </div>
    </div>
    <div className="export-format" role="radiogroup" aria-label="Формат экспорта">
      <button type="button" className={format === 'full' ? 'active' : ''} aria-pressed={format === 'full'} onClick={() => onFormatChange('full')}>Полное КП</button>
      <button type="button" className={format === 'onepager' ? 'active' : ''} aria-pressed={format === 'onepager'} onClick={() => onFormatChange('onepager')}>One-pager</button>
      <button type="button" className={format === 'both' ? 'active' : ''} aria-pressed={format === 'both'} onClick={() => onFormatChange('both')}>Оба</button>
    </div>
    <div className="export-actions">
      <button className="button secondary" title={pdfState === 'unavailable' ? 'PDF-сервис недоступен — PPTX по-прежнему доступен' : undefined} disabled={blocked || pdfState !== 'available'} onClick={() => onExport('pdf')}>
        {pdfState === 'checking' ? 'Проверяю PDF…' : pdfState === 'unavailable' ? 'PDF недоступен' : 'Скачать PDF'}
      </button>
      <button className="button primary" disabled={blocked} onClick={() => onExport('pptx')}>Скачать PPTX</button>
    </div>
  </div>;
}
