// Helpers de maquetación: JSON resaltado, tarjetas tipo Postman, tablas.
import { icon } from './icons.mjs';

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const code = s => `<code>${esc(s)}</code>`;
export const img = (name, cls = 'ic', alt = '') => `<img class="${cls}" src="${icon(name)}" alt="${esc(alt || name)}">`;

// ---------- JSON compacto y resaltado ----------
function fmt(v, ind = 0, width = 64) {
  const pad = '  '.repeat(ind);
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  const one = JSON.stringify(v).replace(/,/g, ', ').replace(/":/g, '": ').replace(/^\{/, '{ ').replace(/\}$/, ' }');
  if (Array.isArray(v)) {
    const flat = JSON.stringify(v).replace(/,/g, ', ');
    if (flat.length + ind * 2 <= width && !v.some(x => x && typeof x === 'object' && Object.keys(x).length > 3)) return flat;
    if (!v.length) return '[]';
    return '[\n' + v.map(x => pad + '  ' + fmt(x, ind + 1, width)).join(',\n') + '\n' + pad + ']';
  }
  if (one.length + ind * 2 <= width) return one;
  const ks = Object.keys(v);
  if (!ks.length) return '{}';
  return '{\n' + ks.map(k => `${pad}  ${JSON.stringify(k)}: ${fmt(v[k], ind + 1, width)}`).join(',\n') + '\n' + pad + '}';
}
export function jsonHtml(obj, width = 64) {
  const txt = typeof obj === 'string' ? obj : fmt(obj, 0, width);
  return esc(txt)
    .replace(/(&quot;|")((?:[^"\\\n]|\\.)*?)\1(\s*:)/g, '<span class="jk">"$2"</span>$3')
    .replace(/: ("(?:[^"\\\n]|\\.)*")/g, ': <span class="js">$1</span>')
    .replace(/([\[,]\s*)("(?:[^"\\\n]|\\.)*")/g, '$1<span class="js">$2</span>')
    .replace(/(^|[\s:\[,])(-?\d+(?:\.\d+)?|true|false|null)(?=[\s,\]\}]|$)/gm, '$1<span class="jn">$2</span>');
}
export const jsonBlock = (obj, width) => `<pre class="json">${jsonHtml(obj, width)}</pre>`;

// ---------- Método HTTP ----------
export const pill = m => `<span class="mth m-${m}">${m}</span>`;

const STATUS = { 200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 409: 'Conflict', 422: 'Unprocessable', 500: 'Server Error' };

function keysOf(o) {
  if (!o) return '—';
  if (Array.isArray(o)) return '[' + keysOf(o[0]) + ', …]';
  return Object.keys(o).filter(k => !k.startsWith('//')).join(', ');
}

// Tabla de endpoints de un microservicio
export function epTable(eps) {
  return `<table class="eps"><thead><tr><th style="width:27%">Método y ruta</th><th style="width:15%">Lambda</th><th style="width:15%">Quién (grupo)</th><th style="width:21%">Entrada</th><th>Salida</th></tr></thead><tbody>` +
    eps.map(e => {
      const inS = e.inS ?? (e.q ? e.q : e.in ? keysOf(e.in) : '—');
      const outS = e.outS ?? `${e.st ?? 200} ${e.out ? keysOf(e.out) : ''}`;
      return `<tr><td>${pill(e.m)} <code class="path">${esc(e.p)}</code></td><td><code>${esc(e.l)}</code></td><td class="who">${esc(e.who)}</td><td class="sm">${esc(inS)}</td><td class="sm">${esc(outS)}</td></tr>`;
    }).join('') + `</tbody></table>`;
}

// Tarjeta tipo Postman
export function epCard(e, i) {
  const st = e.st ?? 200;
  const who = String(e.who || '');
  const pub = /^público/i.test(who), intern = /^(interno|plataforma)/i.test(who);
  const authLine = pub ? 'Sin Authorization (ruta pública)' : /^plataforma/i.test(who) ? 'Credenciales IAM (firma SigV4), sin Cognito' : intern ? 'Invocación interna con rol IAM (sin ruta pública)' : 'Authorization: Bearer &lt;JWT Cognito&gt;';
  const hdrs = [authLine].concat(e.in ? ['Content-Type: application/json'] : []);
  const reqExtra = [];
  if (e.q) reqExtra.push(`<div class="kv"><b>Params</b> ${esc(e.q)}</div>`);
  const req = e.in ? jsonBlock(e.in, 46) : `<div class="nobody">Sin body${e.q ? '' : ''}</div>`;
  const res = e.out !== undefined && e.out !== null ? jsonBlock(e.out, 46) : `<div class="nobody">Sin body</div>`;
  const errs = e.errs ? e.errs.split('·').map(s => `<span class="err">${esc(s.trim())}</span>`).join('') : '';
  return `<div class="card">
  <div class="card-h">${pill(e.m)}<code class="path">${esc(e.p)}</code><span class="chip lam">${img('lambda', 'ic16')}${esc(e.l)}</span><span class="chip auth"><b>${pub || intern ? 'Acceso:' : 'Grupos:'}</b> ${esc(e.who)}</span></div>
  <div class="card-b">
    <div class="col"><div class="lbl">Request</div><div class="hdr">${hdrs.join('<br>')}</div>${reqExtra.join('')}${req}</div>
    <div class="col"><div class="lbl">Response <span class="st st-${String(st)[0]}">${st} ${STATUS[st] || ''}</span></div>${res}</div>
  </div>
  ${(errs || e.note) ? `<div class="card-f">${errs}${e.note ? `<span class="note"><b>Nota:</b> ${esc(e.note)}</span>` : ''}</div>` : ''}
</div>`;
}

// Sección de un microservicio
export function msSection(ms) {
  const cards = ms.eps.filter(e => e.in || e.out).filter(e => e.card !== false);
  return `<section class="ms">
  <div class="ms-h">
    <span class="ms-n">${ms.n}</span>
    <div class="ms-t"><h3>${esc(ms.name)}</h3><p>${esc(ms.resp)}</p></div>
    <div class="ms-i">${img('lambda', 'ic28')}${img(ms.icon, 'ic28')}${ms.extraIcon ? img(ms.extraIcon, 'ic28') : ''}</div>
  </div>
  <div class="ms-meta"><span><b>BD:</b> ${esc(ms.db)}</span><span><b>Tablas del modelo:</b> ${esc(ms.tablas)}</span></div>
  ${epTable(ms.eps)}
  ${cards.map(epCard).join('')}
  ${ms.nota ? `<div class="callout amber"><b>Ojo:</b> ${ms.nota}</div>` : ''}
</section>`;
}
