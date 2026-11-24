// Uso: node build.mjs [slug1,slug2,...]   → genera out/casos.html y el PDF
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderCase } from './lib/case.mjs';
import { front, back } from './lib/front.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const only = process.argv[2] ? process.argv[2].split(',') : null;
const order = ['clinica', 'ecommerce', 'universidad', 'telefonia', 'delivery', 'banco'];

const cases = [];
for (const slug of order) {
  if (only && !only.includes(slug)) continue;
  const f = path.join(root, 'cases', slug + '.mjs');
  if (!fs.existsSync(f)) continue;
  cases.push((await import(f)).default);
}

const css = fs.readFileSync(path.join(root, 'lib', 'style.css'), 'utf8');
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Casos Grandes de Examen — Microservicios en AWS Serverless</title><style>${css}</style></head><body>
${front(cases)}
${cases.map(renderCase).join('\n')}
${back(cases)}
</body></html>`;

fs.mkdirSync(path.join(root, 'out'), { recursive: true });
const htmlPath = path.join(root, 'out', 'casos.html');
fs.writeFileSync(htmlPath, html);

const pdf = process.env.PDF_OUT || path.join(root, 'out', 'Casos_Grandes_Microservicios_AWS.pdf');
const chrome = process.env.CHROME || path.join(os.homedir(), '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome');
execFileSync(chrome, ['--headless', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer', '--run-all-compositor-stages-before-draw', '--virtual-time-budget=8000', `--print-to-pdf=${pdf}`, 'file://' + htmlPath], { stdio: 'ignore' });
console.log('PDF:', pdf, (fs.statSync(pdf).size / 1024).toFixed(0) + ' KB');
