const configuredPdfApiUrl = (import.meta.env.VITE_PDF_API_URL as string | undefined)?.trim();
const pdfApiBaseUrl = configuredPdfApiUrl?.replace(/\/+$/, '') ?? '';

export function pdfApiUrl(path: string): string {
  return `${pdfApiBaseUrl}${path}`;
}
