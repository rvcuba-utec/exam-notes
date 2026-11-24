import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const cache = {};
export function icon(name) {
  if (!cache[name]) {
    const f = path.join(dir, name + '.svg');
    if (!fs.existsSync(f)) throw new Error('icono no existe: ' + name);
    cache[name] = 'data:image/svg+xml;base64,' + fs.readFileSync(f).toString('base64');
  }
  return cache[name];
}
export const ICON_NAMES = fs.readdirSync(dir).map(f => f.replace('.svg', ''));
