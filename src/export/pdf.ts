import type { ProposalDocument } from '../schemas/proposal';
import { createOnePagerPptxBlob, createPptxBlob } from './pptx';
import { safeClientName } from './fileName';
import { pdfApiUrl } from './pdfApi';

export async function downloadPdf(proposal: ProposalDocument, format: 'full' | 'onepager' = 'full') {
  const pptxBlob = format === 'onepager' ? await createOnePagerPptxBlob(proposal) : await createPptxBlob(proposal);
  const response = await fetch(pdfApiUrl('/api/export/pdf'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
    body: pptxBlob,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'PDF-сервис недоступен');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Calltouch-${safeClientName(proposal.client.name)}${format === 'onepager' ? '-one-pager' : ''}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
