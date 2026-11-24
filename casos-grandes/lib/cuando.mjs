// Guía de decisión: cuándo usar cada servicio ("si piden esto → usa esto").
import { esc, img } from './html.mjs';

const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');

// [frase del enunciado, servicio, icono(s), por qué, donde se ve]
const FRASES = [
  ['“usuarios”, “login”, “roles”, “MFA”, “registro”', 'Cognito', ['cognito'], 'No guardas contraseñas ni haces Lambda de login: Cognito emite el JWT y los grupos definen roles.', 'todos'],
  ['“portal web”, “panel”, “app web”', 'Amplify', ['amplify'], 'Aloja el frontend. Una app por tipo de usuario (pacientes / personal).', 'todos'],
  ['“API”, “endpoints”, “microservicios”', 'API Gateway + Lambda', ['apigw', 'lambda'], 'Entrada HTTP con authorizer y una Lambda por operación.', 'todos'],
  ['“buscar por id”, “picos ×10”, “miles de peticiones/s”, “sin joins”', 'DynamoDB', ['dynamodb'], 'Acceso por clave, escala sin administrar, paga por uso.', 'todos'],
  ['“transacción”, “ACID”, “saldo”, “factura + pagos”, “reporte con JOIN”, “20 tablas relacionadas”', 'Aurora Serverless (RDS)', ['aurora'], 'Relaciones y consistencia entre varias tablas; consultas SQL libres.', '1 · 2 · 3 · 4 · 5 · 6'],
  ['“archivo”, “PDF”, “imagen”, “50 MB”, “reporte generado”', 'S3 (+ URL prefirmada)', ['s3'], 'La BD solo guarda la clave; el archivo sube directo a S3.', 'todos'],
  ['“avisar a varios a la vez”, “correo y SMS”', 'SNS (fan-out)', ['sns'], 'Un evento → muchos destinatarios; filtros por atributo.', 'todos'],
  ['“no se puede perder”, “picos”, “reintentos”, “a su ritmo”', 'SQS + DLQ', ['sqs'], 'Una cola delante de cada consumidor crítico; la DLQ guarda lo fallido.', 'todos'],
  ['“todas las noches”, “cada hora”, “mensual”, “24 h antes”', 'EventBridge (regla programada)', ['eventbridge'], 'Único servicio de la lista que tiene reloj (cron / rate, en UTC).', 'todos'],
  ['“cuando pase X, hacer Y distinto según el tipo” (stock crítico, pago recibido)', 'EventBridge (regla por contenido) o SNS con filtro', ['eventbridge', 'sns'], 'Ruteo por el contenido del evento. Ver la comparación en la página siguiente.', '1 · 2 · 4 · 5 · 6'],
  ['“cuando se sube un archivo a S3”', 'Notificación de S3 → Lambda', ['s3', 'lambda'], 'S3 ya avisa por sí solo (`ObjectCreated`); no hace falta EventBridge.', '1 · 3 · 6'],
  ['“varios pasos en orden”, “si falla, deshacer”, “esperar aprobación”', 'Step Functions', ['stepfunctions'], 'Orquesta con reintentos, compensación y espera humana (task token).', '2 · 6'],
  ['“millones de eventos/hora”, “GPS”, “telemetría”, “CDR”', 'Kinesis (+ Firehose)', ['kinesis', 'firehose'], 'Streaming ordenado por clave; Firehose archiva en S3.', '4'],
  ['“consultar histórico con SQL” sin cargar una BD', 'Athena (+ S3)', ['athena'], 'SQL serverless sobre archivos; ideal para auditoría y analítica.', '4 · 6'],
  ['“correo de confirmación / recibo / factura”', 'SES', ['ses'], 'Correo transaccional a cualquier destinatario; “SMS / push” → SNS.', 'todos'],
  ['“datos sensibles”, “cifrar”, “ley de protección de datos”', 'KMS (+ CloudTrail)', ['kms', 'cloudtrail'], 'Cifrado en reposo con llave administrada y auditoría de accesos.', 'todos'],
  ['“contraseña de la BD”, “API key de la pasarela”', 'Secrets Manager', ['secrets'], 'Secretos fuera del código, con rotación.', '1 · 2 · 4 · 5 · 6'],
  ['“bots”, “ataques”, “inyección SQL”, “abuso”', 'AWS WAF', ['waf'], 'Filtro delante de API Gateway / CloudFront.', '6'],
  ['“baja latencia global”, “imágenes”, “caché”', 'CloudFront', ['cloudfront'], 'CDN para estáticos y respuestas cacheables.', '2'],
  ['“leer el DNI / una factura”, “comparar rostros”, “sentimiento”', 'Textract · Rekognition · Comprehend', ['textract', 'rekognition', 'comprehend'], 'IA administrada: sin entrenar modelos.', '2 · 6'],
  ['“reaccionar a cambios de una tabla”, “carrito / sesión que expira”', 'DynamoDB Streams · TTL', ['dynamodb'], 'Streams dispara una Lambda; TTL borra solo lo vencido.', '2 · 3 · 4 · 5'],
  ['“alertar si algo falla”, “monitoreo”', 'CloudWatch (alarmas)', ['cloudwatch'], 'Alarma sobre mensajes en la DLQ, errores de Lambda, latencia.', 'todos'],
];

const eventBridgeSection = () => `
  <div class="h-sec">EventBridge vs SNS vs SQS: la duda más común</div>
  <div class="callout amber"><b class="t">¿Con SNS no sale?</b><b>Sí, en la mayoría de casos un SNS (+ SQS) alcanza</b> para “avisar a varios” y es lo que se vio en clase. EventBridge <b>no reemplaza</b> a SNS: sirve para cosas que SNS <b>no puede hacer</b>. Úsalo cuando se cumpla alguna de estas 5 señales:</div>
  <div class="steps">
    ${[
      ['Hay un reloj', 'Si el enunciado dice “todas las noches a las 11 p. m.”, “cada hora”, “el día 1 de cada mes”, “24 h antes”: <b>solo EventBridge</b> tiene regla programada (<code>cron</code> / <code>rate</code>, en UTC). SNS no programa nada.'],
      ['Decides por el contenido del evento', 'Una regla mira el JSON (<code>detail-type = StockCritico</code>, <code>detail.monto &gt; 5000</code>) y manda a destinos distintos. Con muchos tipos de evento y destinos distintos es más ordenado que muchos temas SNS.'],
      ['El evento nace en AWS', '“Cuando una instancia/pipeline/servicio cambie de estado…”: AWS ya publica esos eventos en EventBridge. (Para “se subió un archivo a S3” no lo necesitas: S3 llama a la Lambda directo.)'],
      ['Bus compartido entre muchos microservicios', 'Un bus donde cada servicio publica sin conocer a los consumidores; nuevas reglas sin tocar al productor; permite archivar y reproducir eventos. Típico en banca y telefonía.'],
      ['El destino no es una persona ni una cola', 'Una regla puede arrancar <b>Step Functions</b>, enviar a un <b>webhook externo</b>, a <b>Firehose</b> (auditoría) o a otro bus.'],
      ['Notificar a personas → SNS', 'SMS, correo y push a destinatarios: SNS (y SES para correo a cualquiera). EventBridge no manda SMS.'],
    ].map((s, i) => `<div class="step"><span class="n" style="background:${i === 5 ? '#e07b00' : 'var(--blue)'}">${i === 5 ? '≠' : i + 1}</span><div><b>${s[0]}</b><br>${s[1]}</div></div>`).join('')}
  </div>

  <table class="tabletight"><thead><tr><th style="width:17%"></th><th style="width:27%">SNS</th><th style="width:27%">SQS</th><th>EventBridge</th></tr></thead><tbody>
    <tr><td><b>Idea</b></td><td>Pregonero: avisa a todos los suscritos</td><td>Buzón: guarda trabajo hasta que alguien lo toma</td><td>Recepcionista: lee el evento y lo manda a donde corresponda</td></tr>
    <tr><td><b>Consumidores</b></td><td>Muchos (colas, Lambdas, correo, SMS, push)</td><td>Uno por cola</td><td>Hasta 5 destinos por regla (colas, SNS, Lambda, Step Functions, API…)</td></tr>
    <tr><td><b>Filtro</b></td><td>Por atributos del mensaje (<code>tenant_id</code>, <code>tipo</code>)</td><td>No filtra</td><td>Por cualquier campo del JSON del evento</td></tr>
    <tr><td><b>Programación</b></td><td>No</td><td>No (solo retardo de entrega)</td><td><b>Sí</b>: cron y rate</td></tr>
    <tr><td><b>Si el consumidor falla</b></td><td>Reintenta según el destino</td><td><b>Reintenta y manda a la DLQ</b></td><td>Reintenta y puede mandar a DLQ</td></tr>
    <tr><td><b>Entrega a personas</b></td><td><b>Sí</b>: SMS, correo, push</td><td>No</td><td>No</td></tr>
    <tr><td><b>En el examen</b></td><td>“Avisar a varios”, fan-out, notificar</td><td>“No perder”, picos, trabajo en segundo plano</td><td>“Cada noche…”, “según el tipo de evento…”</td></tr>
  </tbody></table>

  <div class="two">
    <div class="box"><h5>Combinaciones que sí conviene escribir</h5><ul>
      <li><b>EventBridge → SNS → SQS → Lambda:</b> regla por tipo, fan-out a canales y cola con DLQ por canal.</li>
      <li><b>SNS → SQS → Lambda</b> (sin EventBridge): fan-out simple, como en los talleres del curso.</li>
      <li><b>EventBridge cron → Lambda:</b> reporte nocturno / recordatorio.</li>
      <li><b>S3 → Lambda → SNS:</b> archivo subido que avisa a varios.</li></ul></div>
    <div class="box"><h5>Ejemplos de los 6 casos</h5><ul>
      <li><b>Clínica:</b> resultado de laboratorio → <b>SNS</b> (3 destinatarios). Stock crítico → <b>EventBridge</b> (alerta + reposición). 23:00 → <b>EventBridge cron</b>.</li>
      <li><b>Marketplace:</b> PedidoConfirmado → <b>SNS</b>; StockBajo y reporte 07:00 → <b>EventBridge</b>.</li>
      <li><b>Telefonía / Banca:</b> bus con muchos tipos de evento → <b>EventBridge</b>.</li></ul></div>
  </div>
  <div class="callout green"><b class="t">Si dudas en el examen</b>Pon SNS + SQS para el fan-out y <b>añade EventBridge solo si hay reloj o ruteo por tipo de evento</b>, escribiendo la razón: <i>“Uso EventBridge porque necesito [ejecutar a las 23:00 / rutear por detail-type]; SNS no puede programar ni mirar el contenido del evento.”</i> No encadenes los tres sin motivo.</div>`;

const bdSection = () => `
  <div class="h-sec">Aurora / RDS vs DynamoDB vs S3: cuándo cada uno</div>
  <div class="two">
    <div class="box" style="border-top:3pt solid #7b3fb0"><h5>${img('aurora', 'ic16')}Usa Aurora Serverless (RDS) si el enunciado pide…</h5><ul>
      <li><b>Transacción / ACID:</b> “no puede quedar a medias”, factura + pagos, débito + crédito.</li>
      <li><b>Reportes con JOIN o agregaciones:</b> promedios, actas, estados de cuenta, “por carrera”, “por mes”.</li>
      <li><b>Datos muy relacionados:</b> cita → consulta → receta → detalle (FK entre tablas).</li>
      <li><b>Consultas libres</b> por muchos campos que aún no conoces.</li>
      <li>Pistas: <i>saldo, factura, pago, nota, acta, contabilidad, conciliación, ledger</i>.</li></ul></div>
    <div class="box" style="border-top:3pt solid #1b6fbf"><h5>${img('dynamodb', 'ic16')}Usa DynamoDB si el enunciado pide…</h5><ul>
      <li><b>Acceso por clave</b> conocido: por paciente, por cliente, por sede + fecha.</li>
      <li><b>Picos grandes</b> (×10, ×20) o miles de peticiones por segundo.</li>
      <li><b>Sin JOIN:</b> perfil, catálogo, carrito, tickets, ubicación GPS, sesiones.</li>
      <li><b>Datos temporales</b> con TTL y reacción a cambios con Streams.</li>
      <li>Pistas: <i>por id, último valor, carrito, catálogo, lecturas masivas</i>.</li></ul></div>
  </div>
  <div class="two">
    <div class="box" style="border-top:3pt solid #1b8a4b"><h5>${img('s3', 'ic16')}Usa S3 si hay…</h5><ul>
      <li>Archivos, PDF, imágenes, rayos X, reportes generados, frontends.</li>
      <li>Retención larga o inmutable (Object Lock) y lago de datos con Athena.</li>
      <li>En la BD solo se guarda <code>bucket</code> + <code>s3_key</code>.</li></ul></div>
    <div class="box" style="border-top:3pt solid #e07b00"><h5>${img('aurora', 'ic16')}RDS “clásico” vs Aurora Serverless</h5><ul>
      <li>Si el examen dice <b>serverless</b>: <b>Aurora Serverless v2</b> (escala a demanda). RDS clásico es una instancia encendida siempre.</li>
      <li>Lambdas → Aurora: añade <b>RDS Proxy</b> (pool de conexiones) y <b>Secrets Manager</b> (credenciales).</li>
      <li>Las Lambdas que acceden a Aurora van dentro de la VPC.</li></ul></div>
  </div>
  <table class="tabletight"><thead><tr><th style="width:36%">Dato</th><th style="width:20%">Va en</th><th>Razón corta</th></tr></thead><tbody>
    <tr><td>Perfil de usuario, catálogo, carrito, tickets</td><td><b>DynamoDB</b></td><td>Acceso por id; sin joins</td></tr>
    <tr><td>Ubicación GPS, último estado, sesiones</td><td><b>DynamoDB + TTL</b></td><td>Se sobrescribe y expira solo</td></tr>
    <tr><td>Saldos, movimientos, facturas, pagos, notas</td><td><b>Aurora</b></td><td>ACID y reportes con JOIN</td></tr>
    <tr><td>Historia clínica, receta + detalle</td><td><b>Aurora</b></td><td>Transacción entre tablas relacionadas</td></tr>
    <tr><td>PDF, rayos X, imágenes, reportes, auditoría</td><td><b>S3</b></td><td>Objetos grandes y baratos</td></tr>
    <tr><td>Histórico analítico de millones de filas</td><td><b>S3 + Athena</b></td><td>SQL sin cargar una BD</td></tr>
  </tbody></table>
  <div class="callout red"><b class="t">Trampas</b>No pongas todo en Aurora “porque conoces SQL”, ni todo en DynamoDB aunque haya JOINs. Cada microservicio tiene <b>su propia BD</b> (o esquema propio) y el examen suele pedir usar <b>las dos al menos una vez</b> con justificación.</div>

  <div class="h-sub">Otras decisiones frecuentes</div>
  <div class="three">
    <div class="box"><h5>${img('stepfunctions', 'ic16')}Step Functions vs otras opciones</h5><ul>
      <li><b>Step Functions:</b> varios pasos con orden, reintentos, <b>compensación</b> o espera de una persona (checkout, transferencia, préstamo).</li>
      <li><b>Lambda → Lambda:</b> solo 2 pasos simples y síncronos.</li>
      <li><b>SQS:</b> trabajo independiente en segundo plano, sin orden entre pasos.</li>
      <li><b>Express</b> ≤ 5 min y síncrono · <b>Standard</b> hasta 1 año.</li></ul></div>
    <div class="box"><h5>${img('kinesis', 'ic16')}Kinesis vs SQS</h5><ul>
      <li><b>Kinesis:</b> volumen enorme, <b>orden por clave</b> (<code>PartitionKey</code>), varios lectores y reproceso (GPS, CDR, clics).</li>
      <li><b>SQS:</b> tareas/trabajos que se borran al procesarse, con DLQ; sin orden estricto.</li>
      <li>Si no dicen “streaming / tiempo real / millones”, usa SQS.</li></ul></div>
    <div class="box"><h5>${img('ses', 'ic16')}SES vs SNS (correo y SMS)</h5><ul>
      <li><b>SES:</b> correo a <b>cualquier</b> destinatario (recibos, facturas, plantillas).</li>
      <li><b>SNS:</b> SMS y push; correo solo a suscriptores que confirmaron.</li>
      <li>“Correo <b>y</b> SMS” → SNS para SMS + SES para correo, cada canal con su cola.</li></ul></div>
  </div>`;

const CARDS = [
  ['cognito', 'Cognito', ['Hay usuarios, login, roles (pacientes, médicos, vendedores…).', 'Piden “cada usuario solo ve lo suyo”: el claim del JWT.'], 'Siempre que haya usuarios. No necesitas Lambda de login ni tabla de contraseñas.', 'Token propio (sem. 10) solo si el enunciado dice que Cognito no está disponible.'],
  ['apigw', 'API Gateway', ['Piden endpoints / API REST con autenticación.', 'Necesitas throttling, CORS, caché de rutas públicas.'], 'Límites: ~10 MB de payload y 29 s por petición → archivos por URL prefirmada y trabajos largos asíncronos (202).', 'WebSocket de API Gateway si piden empujar datos al cliente.'],
  ['waf', 'WAF', ['Banca, pagos o datos sensibles expuestos a internet.', 'Piden proteger de bots, fuerza bruta o inyección.'], 'Importante en sistemas financieros y registros públicos.', 'No hace falta en una API interna.'],
  ['cloudfront', 'CloudFront', ['Alcance global, imágenes del catálogo, baja latencia.', 'Quieres cachear respuestas públicas.'], 'Útil delante de S3 y de rutas de lectura masiva.', 'Amplify ya incluye CDN para el frontend.'],
  ['kms', 'KMS', ['“Datos sensibles”, salud, finanzas, cumplimiento.'], 'Cifrado en reposo de S3, DynamoDB, Aurora. Nómbralo siempre que haya datos personales.', 'No confundir con Secrets Manager (guarda secretos, no cifra tus datos).'],
  ['secrets', 'Secrets Manager', ['Hay Aurora/RDS o una API de terceros (pasarela de pago).'], 'Credenciales fuera del código con rotación.', 'Parameter Store para configuración simple sin rotación.'],
  ['cloudtrail', 'CloudTrail', ['“Auditar”, “quién accedió”, regulación.'], 'Registra llamadas a la API de AWS; se complementa con una tabla de auditoría de negocio.', 'Para auditoría de 10 años inmutable: S3 Object Lock.'],
  ['athena', 'Athena + Glue', ['Histórico en S3 consultado con SQL, auditoría, analítica.'], 'Evita cargar millones de filas en una BD.', 'No sustituye a Aurora en consultas transaccionales.'],
  ['textract', 'Textract · Rekognition · Comprehend', ['Leer documentos (DNI, facturas), comparar rostros, sentimiento de comentarios.'], 'Llamadas desde una Lambda o un workflow; sin entrenar modelos.', 'Solo si el caso tiene imágenes, documentos o texto.'],
  ['dynamodb', 'DynamoDB Streams · TTL', ['Reaccionar al cambio de un ítem (reseña → sentimiento, calificación → promedio).', 'Datos que expiran (carrito, ubicación, ofertas).'], 'Streams = “trigger de una tabla”. TTL = limpieza sin cron.', 'Si necesitas reglas por contenido entre servicios: EventBridge.'],
  ['cloudwatch', 'CloudWatch', ['Siempre como transversal: logs, métricas y alarmas.'], 'Alarma sobre mensajes en la DLQ y errores de Lambda: lo que cierra el “no se pierde”.', 'X-Ray si piden trazar una petición entre servicios.'],
  ['lambda', 'Lambda (concurrencia)', ['Preguntan por cold start o latencia de la primera petición.'], 'Provisioned Concurrency en las funciones críticas (reservar, pagar, transferir).', 'Más memoria = más CPU; dependencias en Layers.'],
];

const cardsSection = () => `
  <div class="h-sec">Servicios transversales y de apoyo: señal de uso</div>
  <div class="catalog" style="grid-template-columns:repeat(2,minmax(0,1fr))">
    ${CARDS.map(c => `<div class="cat cc2" style="flex-direction:column;gap:2pt">
      <div style="display:flex;align-items:center;gap:6pt">${img(c[0], '', c[1])}<b style="font-size:9.4pt">${esc(c[1])}</b></div>
      <div class="sm8 cc2t"><b style="color:#0b6ab5">Úsalo si piden…</b><ul style="margin:1pt 0 2pt 11pt;padding:0">${c[2].map(x => `<li>${md(x)}</li>`).join('')}</ul>
      <b style="color:#b25f00">Importante:</b> ${md(c[3])}<br><b style="color:#a02020">Ojo / alternativa:</b> ${md(c[4])}</div></div>`).join('')}
  </div>`;

export function cuando() {
  const tabla = `<div class="pg">
  <div class="h-sec">Cuándo usar cada servicio: si el enunciado dice… usa…</div>
  <p class="lead2">Lee el enunciado buscando estas frases. La columna <b>“Se ve en”</b> indica los casos de esta guía donde aparece, para que veas el uso real en el diagrama.</p>
  <table class="tabletight dense"><thead><tr><th style="width:33%">Si el enunciado dice…</th><th style="width:22%">Usa</th><th>Porque…</th><th style="width:11%">Se ve en</th></tr></thead><tbody>
  ${FRASES.map(f => `<tr><td>${md(f[0])}</td><td><span class="svc-tag">${f[2].map(i => img(i, 'ic16')).join('')}${esc(f[1])}</span></td><td class="sm8">${md(f[3])}</td><td class="sm8">${f[4] === 'todos' ? 'todos' : 'casos ' + f[4]}</td></tr>`).join('')}
  </tbody></table></div>`;
  return [tabla, `<div class="pg">${eventBridgeSection()}</div>`, `<div class="pg">${bdSection()}</div>`, `<div class="pg">${cardsSection()}</div>`].join('\n');
}
