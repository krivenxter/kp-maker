import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const defaultPort = Number(process.env.PORT || process.env.PDF_SERVER_PORT || 4174);
const maxBytes = 50 * 1024 * 1024;
const corsOrigin = process.env.PDF_CORS_ORIGIN || '*';

function resolveLibreOfficeBinary() {
  if (process.env.LIBREOFFICE_BIN) return process.env.LIBREOFFICE_BIN;
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    ];
    return candidates.find(existsSync) ?? 'soffice';
  }
  return 'soffice';
}

const libreOffice = resolveLibreOfficeBinary();

function runLibreOffice(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(libreOffice, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let errorText = '';
    child.stderr.on('data', (chunk) => { errorText += String(chunk); });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(errorText || `LibreOffice завершился с кодом ${code}`)));
  });
}

async function isLibreOfficeAvailable() {
  if (isAbsolute(libreOffice)) return existsSync(libreOffice);
  try {
    await runLibreOffice(['--headless', '--version']);
    return true;
  } catch {
    return false;
  }
}

async function convert(input: string, outputDir: string, profileDir: string) {
  const profileUrl = pathToFileURL(profileDir).href;
  await runLibreOffice([`-env:UserInstallation=${profileUrl}`, '--headless', '--convert-to', 'pdf', '--outdir', outputDir, input]);
}

export function createPdfServer(): Server {
  return createServer(async (request, response) => {
    const requestOrigin = request.headers.origin;
    const originAllowed = corsOrigin === '*' || !requestOrigin || requestOrigin === corsOrigin;
    if (originAllowed) response.setHeader('Access-Control-Allow-Origin', corsOrigin === '*' ? '*' : corsOrigin);
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (request.method === 'OPTIONS') {
      if (!originAllowed) return response.writeHead(403).end('Origin not allowed');
      return response.end();
    }

    if (request.method === 'GET' && request.url === '/api/export/pdf/health') {
      const available = await isLibreOfficeAvailable();
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ available }));
      return;
    }

    if (request.method !== 'POST' || request.url !== '/api/export/pdf') {
      response.writeHead(404).end('Not found');
      return;
    }

    const chunks: Buffer[] = [];
    let size = 0;
    let tooLarge = false;
    request.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) tooLarge = true;
      else chunks.push(chunk);
    });
    request.on('error', (error) => {
      if (!response.headersSent) response.writeHead(400).end(error.message);
    });
    request.on('end', async () => {
      if (tooLarge) {
        response.writeHead(413).end('PPTX превышает лимит 50 МБ');
        return;
      }
      let workDir = '';
      try {
        workDir = await mkdtemp(join(tmpdir(), 'calltouch-pdf-'));
        const outputDir = join(workDir, 'output');
        const profileDir = join(workDir, 'libreoffice-profile');
        await mkdir(outputDir);
        await mkdir(profileDir);
        const input = join(workDir, 'proposal.pptx');
        await writeFile(input, Buffer.concat(chunks));
        await convert(input, outputDir, profileDir);
        const pdf = await readFile(join(outputDir, 'proposal.pdf'));
        response.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="proposal.pdf"' });
        response.end(pdf);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'PDF conversion failed';
        response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' }).end(`PDF-сервис недоступен: ${message}`);
      } finally {
        if (workDir) await rm(workDir, { recursive: true, force: true });
      }
    });
  });
}

export function startPdfServer(port = defaultPort): Server {
  const server = createPdfServer();
  server.listen(port, '0.0.0.0', () => console.log(`PDF adapter: http://0.0.0.0:${port}`));
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) startPdfServer();
