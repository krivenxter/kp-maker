import { createServer } from 'vite';
import { startPdfServer } from '../server/exportPdf';

const pdfServer = startPdfServer();
const viteServer = await createServer();
await viteServer.listen();
viteServer.printUrls();

let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await viteServer.close();
  await new Promise<void>((resolve) => pdfServer.close(() => resolve()));
  process.exit(0);
}

process.on('SIGINT', () => { void close(); });
process.on('SIGTERM', () => { void close(); });

