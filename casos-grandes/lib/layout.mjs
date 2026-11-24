// Parte izquierda común de los diagramas: clientes → Amplify → Cognito/API GW → columna de microservicios.
// Cada caso añade luego su propia zona de mensajería a la derecha (x ≥ 930).
import { msBox } from './diagram.mjs';

export function base({ ms, actors, waf = false, cloudfront = false, rightLabel, transversals, rightTone = 'green', idpSub, apiSub }) {
  const Y0 = 66, STEP = 92, H = 82, X = 512, W = 372;
  const rowY = i => Y0 + i * STEP;
  const mid = i => rowY(i) + 41;
  const n = ms.length;
  const bottom = rowY(n - 1) + H + 16;           // borde inferior de los grupos
  const gh = bottom - 36;
  const cy = (36 + bottom) / 2;
  const groups = [], nodes = [], notes = [], edges = [], marks = [];

  groups.push({ x: 12, y: 36, w: 218, h: gh, tone: 'blue', label: '1 · Clientes y frontend' });
  groups.push({ x: 252, y: 36, w: 208, h: gh, tone: 'red', label: '2 · Identidad y entrada' });
  groups.push({ x: 494, y: 36, w: 410, h: gh, tone: 'amber', label: '3 · Microservicios (Lambda + BD propia)' });
  groups.push({ x: 930, y: 36, w: 560, h: gh, tone: rightTone, label: rightLabel });

  // actores → Amplify
  const k = actors.length;
  const ys = actors.map((a, i) => a.y ?? (k === 1 ? cy : 36 + 110 + i * ((gh - 220) / (k - 1))));
  actors.forEach((a, i) => {
    nodes.push({ id: 'act' + i, x: 62, y: ys[i], icon: a.icon, label: a.label, sub: a.sub });
    nodes.push({ id: 'amp' + i, x: 170, y: ys[i], icon: a.front || 'amplify', label: a.frontLabel || 'Amplify', sub: a.frontSub });
    edges.push({ from: 'act' + i, to: 'amp' + i, route: 'h', kind: 'sync' });
  });

  // identidad / entrada
  const cogY = 36 + 118;
  const apiY = cy + 20;
  nodes.push({ id: 'cog', x: 356, y: cogY, icon: 'cognito', label: 'Cognito', sub: idpSub || 'User Pool + grupos\nJWT (id / access)' });
  nodes.push({ id: 'apigw', x: 356, y: apiY, icon: 'apigw', label: 'API Gateway', sub: apiSub || 'REST · authorizer Cognito\nCORS · throttling' });
  if (waf) nodes.push({ id: 'waf', x: 356, y: apiY + 130, icon: 'waf', size: 40, label: 'AWS WAF', sub: 'bots · inyección · límites' });
  if (cloudfront) nodes.push({ id: 'cf', x: 356, y: apiY + 130, icon: 'cloudfront', size: 40, label: 'CloudFront', sub: 'CDN + caché' });
  const tx = 236;
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  ys.forEach((y, i) => edges.push({ pts: [[200, y], [tx, y]], kind: 'sync', noArrow: true }));
  edges.push({ pts: [[tx, yMin], [tx, yMax]], kind: 'sync', noArrow: true });
  edges.push({ pts: [[tx, Math.min(yMin, cogY)], [tx, cogY], [326, cogY]], kind: 'sync', label: 'login', n: 1, nx: tx, ny: cogY + 18, lx: 281, ly: cogY - 14 });
  edges.push({ pts: [[tx, apiY], [326, apiY]], kind: 'sync', label: 'HTTPS + JWT', n: 2, nx: tx, ny: apiY - 18, lx: 281, ly: apiY - 14 });
  edges.push({ pts: [[tx, Math.max(yMax, apiY)], [tx, apiY]], kind: 'sync', noArrow: true });
  edges.push({ pts: [[356, apiY - 38], [356, cogY + 68]], kind: 'ctrl', label: 'valida JWT', lx: 400, ly: (apiY + cogY) / 2 + 10 });
  if (waf || cloudfront) edges.push({ pts: [[356, apiY + 110], [356, apiY + 56]], kind: 'ctrl', noArrow: false });

  // microservicios
  ms.forEach((m, i) => {
    const b = msBox({ x: X, y: rowY(i), w: W, h: H, num: m.num, name: m.name, lambdas: m.lam, db: m.db, dbLabel: m.dbl });
    groups.push(...b.groups); nodes.push(...b.nodes);
    b.notes.forEach(nt => { nt.t = m.lam; notes.push(nt); });
    if (m.extra) nodes.push({ id: 'ex' + i, x: X + W - 112, y: rowY(i) + 46, size: 30, icon: m.extra.icon, label: m.extra.label, fs: 9.5 });
  });
  // tronco síncrono
  edges.push({ pts: [[386, apiY], [482, apiY]], kind: 'sync', noArrow: true, label: 'invoca (S)', lx: 436, ly: apiY - 14 });
  edges.push({ pts: [[482, mid(0)], [482, mid(n - 1)]], kind: 'sync', noArrow: true });
  ms.forEach((m, i) => edges.push({ pts: [[482, mid(i)], [X, mid(i)]], kind: 'sync' }));

  // transversales
  const ty = bottom + 16;
  groups.push({ x: 12, y: ty, w: 1478, h: 84, tone: 'purple', label: 'Transversales (todos los microservicios)', fs: 12 });
  const tp = transversals.length;
  transversals.forEach((t, i) => nodes.push({ id: 'tr' + i, x: 12 + 1478 / (tp + 1) * (i + 1), y: ty + 40, icon: t[0], size: 34, label: t[1], sub: t[2], fs: 11, sfs: 9.5 }));

  return { groups, nodes, notes, edges, marks, rowY, mid, X, W, AX: 912, height: ty + 84 + 10, bottom, apiY, cogY, cy };
}
