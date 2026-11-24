// Motor de diagramas SVG con íconos oficiales de AWS.
// Coordenadas absolutas (viewBox). Cada nodo se ubica por el CENTRO de su ícono.
import { icon } from './icons.mjs';

const FONT = "'Adwaita Sans','Inter','DejaVu Sans',Arial,sans-serif";
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const KIND = {
  sync:  { color: '#0b6ab5', dash: '',        label: 'Síncrono (HTTPS / invoke)' },
  async: { color: '#d96b00', dash: '7 5',     label: 'Asíncrono (evento / mensaje)' },
  data:  { color: '#1b8a4b', dash: '',        label: 'Lectura / escritura de datos' },
  ctrl:  { color: '#7b3fb0', dash: '3 4',     label: 'Control: identidad, logs, claves' },
  dlq:   { color: '#c62828', dash: '4 3',     label: 'Fallo → DLQ' },
};

const TONES = {
  blue:   { fill: '#eef5fd', stroke: '#6aa5df', text: '#0b4f8a' },
  amber:  { fill: '#fff8e8', stroke: '#e8b04a', text: '#9a5a00' },
  green:  { fill: '#eefaf2', stroke: '#6fc08f', text: '#176b3a' },
  red:    { fill: '#fff0f0', stroke: '#e58a8a', text: '#a02020' },
  purple: { fill: '#f6f0fc', stroke: '#b592dd', text: '#5d2b8f' },
  grey:   { fill: '#f5f7fa', stroke: '#b8c2cf', text: '#46546a' },
  white:  { fill: '#ffffff', stroke: '#9fb0c4', text: '#1f3b5c' },
};

function lines(txt, x, y, { size = 12, weight = 700, fill = '#1b2a3c', lh = 1.18, anchor = 'middle', family = FONT } = {}) {
  const arr = String(txt).split('\n');
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}">` +
    arr.map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : size * lh}">${esc(l)}</tspan>`).join('') + '</text>';
}

export function diagram(spec) {
  const { w, h, groups = [], nodes = [], edges = [], notes = [], pills = [], marks = [] } = spec;
  const byId = {};
  nodes.forEach(n => { n.size = n.size || 52; byId[n.id] = n; });
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" font-family="${FONT}">`);
  out.push('<defs>' + Object.entries(KIND).map(([k, v]) =>
    `<marker id="ar-${k}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${v.color}"/></marker>`).join('') + '</defs>');
  out.push(`<rect width="${w}" height="${h}" fill="#ffffff"/>`);

  // grupos
  for (const g of groups) {
    const t = TONES[g.tone || 'grey'];
    out.push(`<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="${g.rx ?? 12}" fill="${g.fill || t.fill}" stroke="${t.stroke}" stroke-width="1.6" ${g.dash ? 'stroke-dasharray="6 4"' : ''}/>`);
    if (g.label) out.push(lines(g.label, g.x + (g.lx ?? 12), g.y + (g.ly ?? 20), { size: g.fs || 13, weight: 800, fill: t.text, anchor: 'start' }));
  }

  // anclajes
  const P = ref => (Array.isArray(ref) ? { x: ref[0], y: ref[1], size: 0, pt: true } : byId[ref]);
  const half = n => (n.pt ? 0 : n.size / 2 + 4);
  const down = n => (n.pt ? 0 : n.size / 2 + (n.label ? 12 + (String(n.label).split('\n').length + (n.sub ? String(n.sub).split('\n').length : 0)) * 13 : 4));

  function routePts(e) {
    if (e.pts) return e.pts;
    const A = P(e.from), B = P(e.to);
    const r = e.route || 'hvh';
    const dx = B.x >= A.x ? 1 : -1, dy = B.y >= A.y ? 1 : -1;
    switch (r) {
      case 'h':   return [[A.x + dx * half(A), A.y], [B.x - dx * half(B), A.y]];
      case 'v':   return [[A.x, A.y + (dy > 0 ? down(A) : -half(A))], [A.x, B.y + (dy > 0 ? -half(B) : down(B))]];
      case 'hvh': { const sx = A.x + dx * half(A), ex = B.x - dx * half(B), mx = e.mid ?? (sx + ex) / 2; return [[sx, A.y], [mx, A.y], [mx, B.y], [ex, B.y]]; }
      case 'vhv': { const sy = A.y + (dy > 0 ? down(A) : -half(A)), ey = B.y + (dy > 0 ? -half(B) : down(B)), my = e.mid ?? (sy + ey) / 2; return [[A.x, sy], [A.x, my], [B.x, my], [B.x, ey]]; }
      case 'hv':  return [[A.x + dx * half(A), A.y], [B.x, A.y], [B.x, B.y + (dy > 0 ? -half(B) : down(B))]];
      case 'vh':  return [[A.x, A.y + (dy > 0 ? down(A) : -half(A))], [A.x, B.y], [B.x - dx * half(B), B.y]];
      default: throw new Error('ruta ' + r);
    }
  }

  const labels = [], nums = [];
  for (const e of edges) {
    const k = KIND[e.kind || 'sync'];
    const pts = routePts(e);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ',' + p[1]).join(' ');
    const head = e.noArrow ? '' : ` marker-end="url(#ar-${e.kind || 'sync'})"`;
    const tail = e.both ? ` marker-start="url(#ar-${e.kind || 'sync'})"` : '';
    out.push(`<path d="${d}" fill="none" stroke="${k.color}" stroke-width="${e.w || 2}" ${k.dash ? `stroke-dasharray="${k.dash}"` : ''} stroke-linejoin="round"${head}${tail}/>`);
    // posición del rótulo: segmento más largo o lx,ly
    let best = 0, bi = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const L = Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]);
      if (L > best) { best = L; bi = i; }
    }
    const mx = e.lx ?? (pts[bi][0] + pts[bi + 1][0]) / 2, my = e.ly ?? (pts[bi][1] + pts[bi + 1][1]) / 2;
    if (e.label) labels.push({ x: mx, y: my, t: e.label, c: k.color });
    if (e.n) nums.push({ x: e.nx ?? pts[0][0] + (pts[1][0] === pts[0][0] ? 0 : Math.sign(pts[1][0] - pts[0][0]) * 14), y: e.ny ?? pts[0][1] + (pts[1][1] === pts[0][1] ? 0 : Math.sign(pts[1][1] - pts[0][1]) * 14), n: e.n });
  }

  // nodos
  for (const n of nodes) {
    const s = n.size, x = n.x - s / 2, y = n.y - s / 2;
    if (n.frame) {
      out.push(`<rect x="${x - 4}" y="${y - 4}" width="${s + 8}" height="${s + 8}" rx="8" fill="#fff" stroke="#c9d3df" stroke-width="1.2"/>`);
    }
    out.push(`<image href="${icon(n.icon)}" x="${x}" y="${y}" width="${s}" height="${s}"/>`);
    if (n.label) out.push(lines(n.label, n.x, y + s + 14, { size: n.fs || 12.5, weight: 800, fill: '#18283b' }));
    if (n.sub) {
      const nl = String(n.label || '').split('\n').length;
      out.push(lines(n.sub, n.x, y + s + 14 + nl * 14.5, { size: n.sfs || 10.5, weight: 500, fill: '#55657a' }));
    }
    if (n.badge) {
      out.push(`<g><rect x="${n.x - n.badge.length * 3.4 - 6}" y="${y - 10}" width="${n.badge.length * 6.8 + 12}" height="15" rx="7.5" fill="#c62828"/>` +
        `<text x="${n.x}" y="${y + 1.5}" text-anchor="middle" font-size="10" font-weight="800" fill="#fff" font-family="${FONT}">${esc(n.badge)}</text></g>`);
    }
  }

  // etiquetas y números por encima
  for (const l of labels) {
    const tw = l.t.length * 5.9 + 12;
    out.push(`<rect x="${l.x - tw / 2}" y="${l.y - 8.5}" width="${tw}" height="16" rx="8" fill="#fff" stroke="${l.c}" stroke-width="1.2"/>`);
    out.push(`<text x="${l.x}" y="${l.y + 3.6}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${l.c}" font-family="${FONT}">${esc(l.t)}</text>`);
  }
  for (const p of pills) {
    const tw = p.t.length * 6.3 + 14;
    out.push(`<rect x="${p.x}" y="${p.y}" width="${tw}" height="18" rx="9" fill="${p.fill || '#0b6ab5'}"/>` +
      `<text x="${p.x + tw / 2}" y="${p.y + 12.6}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#fff" font-family="${FONT}">${esc(p.t)}</text>`);
  }
  for (const nt of notes) out.push(lines(nt.t, nt.x, nt.y, { size: nt.fs || 11, weight: nt.weight || 500, fill: nt.fill || '#55657a', anchor: nt.anchor || 'start' }));
  for (const m of marks) nums.push(m);
  for (const m of nums) {
    out.push(`<circle cx="${m.x}" cy="${m.y}" r="11" fill="#e07b00" stroke="#fff" stroke-width="2"/>` +
      `<text x="${m.x}" y="${m.y + 4.6}" text-anchor="middle" font-size="13" font-weight="800" fill="#fff" font-family="${FONT}">${m.n}</text>`);
  }
  out.push('</svg>');
  return out.join('');
}

// Leyenda reutilizable
export function legend() {
  return `<div class="legend">` + Object.entries(KIND).map(([k, v]) =>
    `<span><svg width="34" height="10"><line x1="1" y1="5" x2="33" y2="5" stroke="${v.color}" stroke-width="2.4" ${v.dash ? `stroke-dasharray="${v.dash}"` : ''}/></svg>${v.label}</span>`).join('') +
    `<span><b class="numdot">n</b>Paso del flujo principal</span></div>`;
}

// Cuadro de microservicio: devuelve {groups, nodes}
export function msBox({ x, y, w = 360, h = 82, num, name, lambdas, db, dbLabel, extra, tone = 'white' }) {
  const groups = [{ x, y, w, h, tone, rx: 10, label: `${num ? num + ' · ' : ''}${name}`, ly: 19, fs: 13.5 }];
  const nodes = [{ id: 'l-' + (num ?? name), x: x + 34, y: y + 52, size: 36, icon: 'lambda' }];
  groups.push({ x: x + 62, y: y + 34, w: w - 150, h: 40, tone: 'white', fill: 'none', rx: 0, stroke: 'none' });
  const note = { x: x + 62, y: y + 46, t: lambdas, fs: 11, weight: 600, fill: '#33465c' };
  nodes.push({ id: 'd-' + (num ?? name), x: x + w - 38, y: y + 46, size: 36, icon: db, label: dbLabel, fs: 10.5 });
  if (extra) nodes.push({ id: 'x-' + (num ?? name), x: x + w - 92, y: y + 46, size: 30, icon: extra.icon, label: extra.label, fs: 10 });
  return { groups: [groups[0]], nodes, notes: [note] };
}
