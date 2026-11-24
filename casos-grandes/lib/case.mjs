// Render de un caso completo: apertura, microservicios, diagrama, flujos, seguridad.
import { esc, img, jsonBlock, msSection } from './html.mjs';
import { diagram, legend } from './diagram.mjs';

const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');

export function renderCase(c) {
  const epCount = c.ms.reduce((a, m) => a + m.eps.length, 0);
  const out = [];

  // ---------- Página de apertura ----------
  out.push(`<div class="pg">
  <div class="case-banner">
    <span class="pat">${esc(c.pattern)}</span>
    <div class="k">${esc(c.kicker)}</div>
    <h2>${esc(c.title)}</h2>
    <div class="svc">${c.svc.map(s => `<span>${esc(s)}</span>`).join('')}</div>
  </div>
  <div class="prob"><h4>Problemática de negocio y requisitos clave</h4><p>${esc(c.problema)}</p>
    <div class="chips ok">${c.reqs.map(r => `<span>${esc(r)}</span>`).join('')}</div></div>

  <div class="h-sub" style="margin-top:4pt">Paso 1 · Cómo detectar los microservicios en el enunciado</div>
  <table class="tabletight"><thead><tr><th style="width:30%">Frase / dato del enunciado</th><th style="width:16%">Microservicio</th><th style="width:17%">Base de datos</th><th>Por qué</th></tr></thead><tbody>
  ${c.detectar.map(d => `<tr><td>${md(d[0])}</td><td><b>${esc(d[1])}</b></td><td>${esc(d[2])}</td><td class="sm8">${md(d[3])}</td></tr>`).join('')}
  </tbody></table>

  <div class="two">
    <div class="callout"><b class="t">Regla práctica</b>Un microservicio = un dominio que <b>posee sus datos</b> y cambia por las mismas razones. Si dos tablas se consultan juntas con JOIN, van en el mismo servicio. Si una acción <i>reacciona</i> a otra (sin esperar respuesta), es un <b>evento</b>, no una llamada.</div>
    <div class="callout amber"><b class="t">Esquema del caso</b>${c.ms.length} microservicios · ${epCount} endpoints · ${c.eventos.length} eventos clave · ${c.flujos.length} flujos asíncronos. Las páginas siguientes siguen el orden que conviene responder en el examen: <b>microservicios → endpoints (Postman) → diagrama → eventos → seguridad → conceptos</b>.</div>
  </div>
  </div>`);

  // ---------- Resumen de microservicios + endpoints ----------
  out.push(`<div class="h-sub" style="margin-top:2pt">Paso 2 · Microservicios, base de datos y justificación</div>
  <table class="tabletight"><thead><tr><th style="width:4%">#</th><th style="width:14%">Microservicio</th><th style="width:30%">Responsabilidad</th><th style="width:20%">Tablas del modelo</th><th>BD y por qué</th></tr></thead><tbody>
  ${c.ms.map(m => `<tr><td><b>${m.n}</b></td><td><b>${esc(m.name)}</b></td><td class="sm8">${esc(m.resp)}</td><td class="sm8">${esc(m.tablas)}</td><td class="sm8">${img(m.icon, 'ic16')}${esc(m.db)}</td></tr>`).join('')}
  </tbody></table>
  <div class="h-sub">Paso 3 · Endpoints por microservicio (estilo Postman)</div>
  <p class="lead2 sm8">Cada fila muestra <b>método + ruta</b>, la <b>Lambda</b>, el <b>grupo de Cognito</b> autorizado y qué entra y sale. Debajo, las tarjetas muestran el <b>request</b> (headers + body JSON) y el <b>response</b> (código + JSON) de los endpoints importantes, con sus errores.</p>
  ${c.ms.map(msSection).join('')}`);

  // ---------- Diagrama (página apaisada) ----------
  out.push(`<div class="dgpage">
  <div class="case-line"><b>Paso 4 · Diagrama de la solución completa</b><span>${esc(c.figura)}</span></div>
  <div class="dgwrap">${diagram(c.diagrama())}</div>
  ${legend()}
  </div>`);

  // ---------- Eventos y flujos ----------
  out.push(`<div class="pg"><div class="h-sub" style="margin-top:0">Paso 5 · Flujos orientados a eventos (paso a paso)</div>
  ${c.flujos.map((f, k) => `<div class="flow"><h4>${esc(f.t)}</h4><ol>${f.steps.map(s => `<li class="${k ? 'l' : ''}"><div><span class="svc-tag">${md(s[0])}</span> — ${md(s[1])}</div></li>`).join('')}</ol></div>`).join('')}
  <div class="h-sub">JSON de los eventos que viajan por SNS · SQS · EventBridge</div>
  <div class="three">
   ${c.eventos.map(e => `<div class="box"><h5>${esc(e.name)}</h5><div class="sm8" style="color:#5a6b80;margin-bottom:3pt">${md(e.via)}</div>${jsonBlock(e.json, 40)}</div>`).join('')}
  </div>
  <div class="callout amber"><b class="t">Cómo viaja el mensaje</b>En SQS el cuerpo llega como <i>string</i> (<code>json.loads(record['body'])</code>); si vino de SNS, dentro está el sobre con <code>Message</code>. Lambda disparada por SNS: <code>event['Records'][0]['Sns']['Message']</code>.</div>

  <div class="h-sub">Paso 6 · Seguridad con Cognito</div>
  <table class="matrix"><thead><tr><th>Recurso (endpoints)</th>${c.seguridad.matriz.cols.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>
  ${c.seguridad.matriz.rows.map(r => `<tr><td>${esc(r[0])}</td>${r[1].map(v => `<td>${v === 1 ? '<span class="yes">✔</span>' : v === 's' ? '<span class="yes">✔*</span>' : v === 'v' ? '<span class="yes sm8">lee</span>' : '<span class="no">—</span>'}</td>`).join('')}</tr>`).join('')}
  </tbody></table>
  <div class="sm8" style="color:#5a6b80;margin:-3pt 0 6pt">✔* solo sus propios datos (claim del JWT) · lee = solo lectura</div>
  <div class="box"><h5>Grupos del User Pool y medidas de seguridad</h5><div class="chips">${c.seguridad.grupos.map(g => `<span>${g}</span>`).join('')}</div>
    <ul>${c.seguridad.puntos.map(p => `<li>${md(p)}</li>`).join('')}</ul></div>

  <div class="h-sub">Paso 7 · Conceptos que suelen preguntar al final</div>
  <div class="three">${c.conceptos.map(k => `<div class="box"><h5>${esc(k[0])}</h5><div class="sm8">${md(k[1])}</div></div>`).join('')}</div>
  </div>`);

  return out.join('\n');
}
