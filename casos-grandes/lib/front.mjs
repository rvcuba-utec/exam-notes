import { esc, img, epCard, pill, code } from './html.mjs';
import { ICON_NAMES } from './icons.mjs';
import { cuando } from './cuando.mjs';

const COVER_ICONS = {
  clinica: ['amplify', 'cognito', 'apigw', 'lambda', 'dynamodb', 'aurora', 's3', 'sqs'],
  ecommerce: ['cloudfront', 'cognito', 'apigw', 'lambda', 'dynamodb', 'stepfunctions', 'sns', 'sqs'],
  universidad: ['amplify', 'cognito', 'apigw', 'lambda', 'dynamodb', 's3', 'eventbridge', 'ses'],
  telefonia: ['cognito', 'apigw', 'lambda', 'aurora', 'dynamodb', 'eventbridge', 's3', 'athena'],
  delivery: ['amplify', 'cognito', 'apigw', 'lambda', 'dynamodb', 'sns', 'sqs', 'kinesis'],
  banco: ['waf', 'cognito', 'apigw', 'lambda', 'aurora', 'stepfunctions', 'textract', 'kms'],
};
const SHORT = { clinica: 'Clínica San Gabriel', ecommerce: 'Marketplace online', universidad: 'Campus universitario', telefonia: 'Telefonía y reportes', delivery: 'Delivery y logística', banco: 'Banca digital' };

export function front(cases) {
  const nMs = cases.reduce((a, c) => a + c.ms.length, 0);
  const nEp = cases.reduce((a, c) => a + c.ms.reduce((b, m) => b + m.eps.length, 0), 0);
  const strip = ['amplify', 'cognito', 'apigw', 'lambda', 'dynamodb', 'aurora', 's3', 'sns', 'sqs', 'eventbridge', 'stepfunctions', 'ses', 'cloudwatch', 'kms'].map(i => img(i, '', i)).join('');

  const cover = `<div class="cover-wrap"><div class="cover">
    <span class="tag">GUÍA DE EXAMEN · CASOS GRANDES · AWS SERVERLESS</span>
    <h1>Microservicios, Endpoints y<br>Arquitectura Completa en <em>AWS</em></h1>
    <div class="bar"></div>
    <p class="lead">${cases.length === 1 ? '1 caso grande' : cases.length + ' casos grandes'} de examen resueltos de punta a punta: detección de microservicios, base de datos por servicio, endpoints estilo Postman con JSON de entrada y salida, eventos, seguridad con Cognito y un diagrama de solución completo con íconos oficiales de AWS.</p>
    <div class="strip">${strip}</div>
    <div class="grid">
      ${cases.map((c, i) => `<div class="cc"><b>CASO ${c.id} · ${esc(SHORT[c.slug])}</b><span>${esc(c.pattern)}<br>${c.ms.length} microservicios · ${c.ms.reduce((a, m) => a + m.eps.length, 0)} endpoints</span><div class="ics">${(COVER_ICONS[c.slug] || []).map(n => img(n, '', n)).join('')}</div></div>`).join('')}
    </div>
    <div class="stats">
      <div class="stat"><b>${nEp}</b><span>endpoints con método, ruta, Lambda, grupo y JSON de entrada / salida</span></div>
      <div class="stat"><b>${cases.length}</b><span>diagramas de solución completa con íconos oficiales de AWS</span></div>
      <div class="stat"><b>7</b><span>pasos de método: detectar → BD → endpoints → diagrama → eventos → seguridad → conceptos</span></div>
    </div>
    <div class="foot"><span>${cases.length} caso${cases.length === 1 ? '' : 's'} · ${nMs} microservicios · ${nEp} endpoints · ${cases.length} diagrama${cases.length === 1 ? '' : 's'} con íconos AWS</span><span>Cloud Computing · Examen final</span></div>
  </div></div>`;

  // ---------- Mapa y convenciones ----------
  const mapa = `<div>
  <div class="h-sec">Mapa del documento y convenciones de lectura</div>
  <p class="lead2">Esta guía complementa a las de casos pequeños: aquí cada caso es <b>grande</b> (7 a 9 microservicios) y se responde como en el examen real: <b>detectar microservicios → definir base de datos → escribir endpoints con JSON → dibujar la solución completa → explicar eventos y seguridad</b>.</p>
  <table><thead><tr><th style="width:8%">Caso</th><th style="width:25%">Dominio</th><th style="width:27%">Patrón principal</th><th>Microservicios</th></tr></thead><tbody>
  ${cases.map(c => `<tr><td><b>CASO ${c.id}</b></td><td>${esc(SHORT[c.slug])}</td><td><code>${esc(c.pattern)}</code></td><td class="sm8">${c.ms.map(m => esc(m.name)).join(' · ')}</td></tr>`).join('')}
  </tbody></table>
  <div class="two">
    <div class="box"><h5>Estructura de cada caso</h5><ul>
      <li><b>Antes de los casos:</b> método, hoja Postman, catálogo de logos y la <b>guía “cuándo usar cada servicio”</b> (EventBridge vs SNS vs SQS, Aurora vs DynamoDB…).</li>
      <li><b>Pág. 1:</b> enunciado, requisitos y tabla “frase → microservicio”.</li>
      <li><b>Pág. 2+:</b> un bloque por microservicio: tabla de endpoints + tarjetas Postman (request / response / errores).</li>
      <li><b>Pág. apaisada:</b> diagrama completo con logos, flechas síncronas/asíncronas y pasos numerados.</li>
      <li><b>Última:</b> flujos event-driven, JSON de eventos, matriz de seguridad y conceptos.</li></ul></div>
    <div class="box"><h5>Colores de las flechas del diagrama</h5><ul>
      <li><b style="color:#0b6ab5">Azul continuo</b>: llamada síncrona (HTTPS, invoke).</li>
      <li><b style="color:#d96b00">Naranja punteado</b>: evento o mensaje asíncrono.</li>
      <li><b style="color:#1b8a4b">Verde</b>: lectura/escritura de datos.</li>
      <li><b style="color:#7b3fb0">Morado punteado</b>: control (JWT, logs, claves).</li>
      <li><b style="color:#c62828">Rojo</b>: fallo hacia la DLQ. Los círculos numerados enlazan con los pasos del flujo.</li></ul></div>
  </div>
  <div class="callout amber" style="margin-top:8pt"><b class="t">Cómo estudiar cada caso</b>Antes de leer la solución, cubre el diagrama y responde: ① ¿qué microservicios veo en el enunciado y qué BD usa cada uno? ② ¿cuál es el endpoint que dispara un evento y qué JSON publica? ③ ¿dónde se pierde un mensaje si un consumidor falla y cómo lo evito? ④ ¿cómo garantizo que un usuario solo vea sus datos?</div>
  </div>`;

  // ---------- Método ----------
  const metodo = `<div class="pg">
  <div class="h-sec">Método de 7 pasos para resolver un caso grande (90 min)</div>
  <div class="steps">
    ${[
      ['Lee y subraya (5 min)', 'Subraya <b>sustantivos con datos</b> (paciente, pedido, factura), <b>verbos de proceso</b> (reservar, pagar, notificar), <b>volúmenes</b> y <b>restricciones</b> (sin EC2, 50 MB, 99,9 %).'],
      ['Detecta microservicios (10 min)', 'Agrupa tablas por dominio y por quién las cambia. Un servicio = <b>sus datos + sus Lambdas</b>. Nunca dos servicios escribiendo la misma tabla.'],
      ['Elige BD por servicio (5 min)', '<b>DynamoDB</b> si accedes por clave y hay picos; <b>Aurora Serverless</b> si hay joins y transacciones ACID; <b>S3</b> para archivos. Usa ambas al menos una vez y justifica.'],
      ['Escribe endpoints (20 min)', 'Tabla por servicio: método + ruta + Lambda + quién + JSON de entrada/salida + errores. Prioriza <b>crear, consultar</b> y el endpoint que <b>dispara un evento</b>.'],
      ['Dibuja el diagrama (25 min)', 'De izquierda a derecha: usuarios → Amplify → Cognito/API GW → microservicios → BD → mensajería → entrega. Flechas rotuladas S/A y pasos numerados.'],
      ['Eventos y DLQ (15 min)', 'Quién publica qué evento, quién lo consume y <b>qué pasa si falla</b>: SQS + reintentos + DLQ + alarma. Elige SNS / SQS / EventBridge con motivo.'],
      ['Seguridad y cierre (10 min)', 'Grupos de Cognito, authorizer, claims JWT para “solo mis datos”, cifrado KMS, auditoría, mínimo privilegio. Cierra con 1 línea por pilar Well-Architected.'],
    ].map((s, i) => `<div class="step"><span class="n">${i + 1}</span><div><b>${s[0]}</b><br>${s[1]}</div></div>`).join('')}
  </div>

  <div class="h-sub">Heurísticas para encontrar microservicios</div>
  <table class="tabletight"><thead><tr><th style="width:26%">Señal en el enunciado</th><th style="width:30%">Qué significa</th><th>Ejemplo</th></tr></thead><tbody>
    <tr><td>Un conjunto de tablas con FK entre sí</td><td>Mismo dominio → mismo microservicio</td><td><code>recetas ↔ detalle_receta</code> → Historia clínica</td></tr>
    <tr><td>“Notificar”, “avisar”, “recordar”</td><td>Servicio consumidor <b>sin dueño de datos</b> + cola</td><td>Notificaciones (SES / SNS)</td></tr>
    <tr><td>“Todas las noches / cada hora / mensual”</td><td>Regla programada de EventBridge → Lambda</td><td><code>cron(0 4 * * ? *)</code> = 23:00 Lima</td></tr>
    <tr><td>“Archivo de X MB”, imágenes, PDF</td><td>S3 + URL prefirmada; en BD solo la clave</td><td>Resultados de laboratorio, comprobantes</td></tr>
    <tr><td>“Pago”, “saldo”, “no puede quedar a medias”</td><td>Transacción ACID → Aurora (o Step Functions con compensación)</td><td>Facturación, Pagos, Transferencias</td></tr>
    <tr><td>“Pico ×10”, “campaña”, “oferta flash”</td><td>Cola delante del consumidor + DynamoDB on-demand</td><td>SQS + <code>crearPedido</code></td></tr>
    <tr><td>“Cada usuario solo ve lo suyo”</td><td>Claim del JWT filtra la consulta (no el id de la URL)</td><td><code>custom:id_paciente</code></td></tr>
    <tr><td>“Reporte con datos de varios sistemas”</td><td>Componer (invoke), vista materializada por eventos o lote</td><td>Reporte consolidado del cliente</td></tr>
  </tbody></table>

  <div class="two">
    <div class="box"><h5>DynamoDB vs Aurora Serverless</h5><ul>
      <li><b>DynamoDB:</b> patrón de acceso conocido por clave, escala sin límite, picos 10×, sin joins. Diseña PK/SK + GSI.</li>
      <li><b>Aurora:</b> entidades muy relacionadas, transacciones ACID, reportes con JOIN. Usa RDS Proxy + Secrets Manager.</li>
      <li><b>S3:</b> archivos y reportes; cifrado KMS; en la BD solo <code>s3_key</code>.</li></ul></div>
    <div class="box"><h5>SQS vs SNS vs EventBridge</h5><ul>
      <li><b>SQS:</b> una cola por consumidor; reintentos y <b>DLQ</b>; protege de picos.</li>
      <li><b>SNS:</b> un evento → muchos destinatarios (fan-out, filtros, SMS, correo).</li>
      <li><b>EventBridge:</b> ruteo por reglas de contenido y <b>programación</b> (cron / rate, en UTC).</li></ul></div>
  </div>
  </div>`;

  // ---------- Hoja Postman ----------
  const demo = {
    m: 'POST', p: '/citas', l: 'crearCita', who: 'pacientes · recepcion', st: 201,
    in: { id_medico: 'M-045', id_sede: 'LIMA', fecha_hora: '2026-12-01T09:30', motivo: 'Control' },
    out: { id_cita: 'C-8841', estado: 'RESERVADA' }, errs: '400 datos inválidos · 401 sin token · 403 sin permiso · 409 conflicto', note: 'El id del paciente sale del JWT, no del body',
  };
  const postman = `<div class="pg">
  <div class="h-sec">Hoja Postman: cómo escribir un endpoint en el examen</div>
  <p class="lead2">Para cada endpoint escribe lo mismo, siempre en este orden. Así muestras criterio y el corrector encuentra todo rápido.</p>
  ${epCard(demo)}
  <div class="two">
    <div><div class="h-sub" style="margin-top:3pt">Método HTTP según la acción</div>
    <table class="tabletight"><thead><tr><th>Método</th><th>Para qué</th><th>Body</th></tr></thead><tbody>
      <tr><td>${pill('GET')}</td><td>Leer uno o una lista; no modifica</td><td>No (ruta / query)</td></tr>
      <tr><td>${pill('POST')}</td><td>Crear o ejecutar una acción</td><td>Sí</td></tr>
      <tr><td>${pill('PUT')}</td><td>Reemplazar un recurso</td><td>Sí</td></tr>
      <tr><td>${pill('PATCH')}</td><td>Modificar campos</td><td>Sí (parcial)</td></tr>
      <tr><td>${pill('DELETE')}</td><td>Eliminar o cancelar</td><td>No</td></tr>
    </tbody></table></div>
    <div><div class="h-sub" style="margin-top:3pt">Códigos de respuesta que debes usar</div>
    <table class="tabletight"><thead><tr><th>Código</th><th>Cuándo</th></tr></thead><tbody>
      <tr><td><b>200</b> OK · <b>201</b> Created</td><td>Lectura / modificación · creación</td></tr>
      <tr><td><b>400</b> Bad Request</td><td>Falta un dato o formato inválido</td></tr>
      <tr><td><b>401</b> · <b>403</b></td><td>Sin token o expirado · sin grupo / no es suyo</td></tr>
      <tr><td><b>404</b> · <b>409</b></td><td>No existe · conflicto (horario ocupado, stock)</td></tr>
      <tr><td><b>500</b></td><td>Error interno de la Lambda</td></tr>
    </tbody></table></div>
  </div>
  <div class="three">
    <div class="box"><h5>Headers y token</h5><div class="sm8"><code>Authorization: Bearer &lt;JWT&gt;</code> lo valida el <b>authorizer de Cognito</b> en API Gateway. Claims útiles: <code>sub</code>, <code>cognito:groups</code>, <code>custom:id_paciente</code>.</div></div>
    <div class="box"><h5>Formato de error estándar</h5>${`<pre class="json">{ <span class="jk">"error"</span>: <span class="js">"HORARIO_OCUPADO"</span>,\n  <span class="jk">"mensaje"</span>: <span class="js">"La hora ya fue reservada"</span> }</pre>`}</div>
    <div class="box"><h5>Estilo del curso (sem. 9–11)</h5><div class="sm8">En los talleres las Lambdas devuelven <code>{"statusCode": 200, "body": …}</code> y las rutas son por acción (<code>/alumnos/crear</code>). En el examen usa REST claro, pero sé <b>consistente</b>.</div></div>
  </div>
  <div class="callout red"><b class="t">Regla de seguridad que más puntos da</b>Datos del usuario (<code>id_paciente</code>, <code>id_cliente</code>, <code>tenant_id</code>) <b>no viajan en el body</b>: la Lambda los toma de los <b>claims del JWT</b>. Escríbelo en el endpoint (“id sale del token”).</div>
  <div class="callout green"><b class="t">Archivos grandes</b>Nunca por API Gateway (límite ~10 MB, Lambda 6 MB). Endpoint <code>POST /…/url-subida</code> devuelve una <b>URL prefirmada de S3</b>; el cliente hace <code>PUT</code> directo y S3 emite <code>ObjectCreated</code>.</div>
  </div>`;

  // ---------- Catálogo de íconos ----------
  const CAT = [
    ['amplify', 'AWS Amplify', 'Hospeda el frontend web (portales). Una app por tipo de usuario. Integra login con Cognito.'],
    ['cognito', 'Amazon Cognito', 'User Pool: registro, login, MFA, grupos y tokens JWT. Reemplaza la tabla usuarios.'],
    ['apigw', 'API Gateway', 'Entrada REST. Authorizer Cognito, CORS, throttling. Invoca Lambdas.'],
    ['lambda', 'AWS Lambda', 'Lógica de cada microservicio. Un rol IAM mínimo por función. Pago por uso.'],
    ['dynamodb', 'DynamoDB', 'NoSQL por clave. PK/SK + GSI. On-demand para picos. Streams y TTL.'],
    ['aurora', 'Aurora Serverless', 'Relacional con transacciones ACID y joins. Con RDS Proxy y Secrets Manager.'],
    ['s3', 'Amazon S3', 'Archivos, reportes, frontends. Bucket privado + KMS + URL prefirmada.'],
    ['sns', 'Amazon SNS', 'Pub/Sub: fan-out a colas, correo, SMS. Filtros por atributos.'],
    ['sqs', 'Amazon SQS', 'Cola con reintentos. Una por consumidor. DLQ tras N recepciones.'],
    ['eventbridge', 'EventBridge', 'Bus de eventos con reglas por contenido y tareas programadas (cron/rate en UTC).'],
    ['stepfunctions', 'Step Functions', 'Orquesta flujos con pasos, reintentos y compensación (sagas).'],
    ['ses', 'Amazon SES', 'Correo transaccional a cualquier destinatario (plantillas).'],
    ['cloudwatch', 'CloudWatch', 'Logs, métricas y alarmas (p. ej. mensajes en la DLQ).'],
    ['kms', 'AWS KMS', 'Llaves de cifrado para S3, DynamoDB y Aurora (datos sensibles).'],
    ['secrets', 'Secrets Manager', 'Credenciales de BD y APIs externas con rotación.'],
    ['cloudtrail', 'CloudTrail', 'Auditoría de llamadas a la API de AWS (quién hizo qué).'],
    ['iam', 'IAM', 'Roles y políticas de mínimo privilegio por Lambda.'],
    ['waf', 'AWS WAF', 'Protege API Gateway/CloudFront de bots e inyección.'],
    ['cloudfront', 'CloudFront', 'CDN para frontend y archivos; baja latencia global.'],
    ['route53', 'Route 53', 'DNS y dominio propio.'],
    ['kinesis', 'Kinesis Data Streams', 'Streaming de alto volumen (telemetría, clics, GPS).'],
    ['firehose', 'Kinesis Firehose', 'Entrega continua de streams a S3 (lago de datos).'],
    ['athena', 'Amazon Athena', 'SQL serverless sobre archivos en S3 (reportes históricos).'],
    ['glue', 'AWS Glue', 'Catálogo y ETL para el lago de datos.'],
    ['textract', 'Amazon Textract', 'Extrae texto y campos de documentos (KYC, facturas).'],
    ['rekognition', 'Rekognition', 'Análisis de imágenes y rostros (verificación).'],
    ['comprehend', 'Comprehend', 'Análisis de texto (sentimiento, entidades).'],
    ['pinpoint', 'Pinpoint', 'Mensajería multicanal y campañas.'],
    ['iotcore', 'AWS IoT Core', 'Ingesta de dispositivos y sensores (MQTT).'],
    ['elasticache', 'ElastiCache', 'Caché en memoria (Redis) para lecturas calientes.'],
    ['ssm', 'Systems Manager', 'Parameter Store: configuración por stage.'],
  ].filter(c => ICON_NAMES.includes(c[0]));
  const catalogo = `<div class="pg">
  <div class="h-sec">Catálogo de servicios y logos usados en los diagramas</div>
  <p class="lead2">Solo servicios que aparecen en el curso (sem. 9–15) y en los casos prácticos de referencia. Si dudas entre dos, escribe el del curso y añade “(alternativa: X porque …)”.</p>
  <div class="catalog">${CAT.map(c => `<div class="cat">${img(c[0], '', c[1])}<div><b>${c[1]}</b><span>${c[2]}</span></div></div>`).join('')}</div>
  </div>`;

  return [cover, mapa, metodo, postman, catalogo, cuando()].join('\n');
}

export function back(cases) {
  return `<div class="pg">
  <div class="h-sec">Checklist final antes de entregar</div>
  <div class="two">
    <div class="box"><h5>Microservicios y datos</h5><ul>
      <li>Al menos 5 servicios, cada uno con <b>responsabilidad, Lambdas y tablas</b>.</li>
      <li>DynamoDB <b>y</b> Aurora usados, cada uno con su motivo.</li>
      <li>Archivos pesados en <b>S3</b>, solo la clave en la BD.</li>
      <li>Ningún servicio lee la tabla de otro: se llaman por API o evento.</li></ul></div>
    <div class="box"><h5>Endpoints</h5><ul>
      <li>Método + ruta + Lambda + grupo autorizado en cada uno.</li>
      <li>JSON de <b>entrada y salida</b> del endpoint principal de cada servicio.</li>
      <li>Códigos de error (400/401/403/404/409).</li>
      <li>Datos del usuario tomados del <b>JWT</b>, no del body.</li></ul></div>
    <div class="box"><h5>Diagrama</h5><ul>
      <li>Izquierda → derecha: usuarios, Amplify, Cognito/API GW, Lambdas, BD, mensajería, entrega.</li>
      <li>Flechas <b>rotuladas</b> y distinguidas (sólida = síncrona, punteada = asíncrona).</li>
      <li>SNS delante de varios consumidores, SQS + <b>DLQ</b> delante de los críticos.</li>
      <li>Leyenda y transversales (CloudWatch, KMS, IAM).</li></ul></div>
    <div class="box"><h5>Justificación</h5><ul>
      <li>“Uso X para Y porque Z; lo prefiero a W porque …”.</li>
      <li>Qué pasa si un consumidor falla (reintento + DLQ + alarma).</li>
      <li>Seguridad: Cognito, KMS, auditoría, mínimo privilegio.</li>
      <li>Cierre Well-Architected: fiabilidad, seguridad, costos.</li></ul></div>
  </div>
  <div class="h-sub">Errores que restan puntos</div>
  <table class="tabletight"><thead><tr><th style="width:42%">Error</th><th>Corrección</th></tr></thead><tbody>
    <tr><td>Usar EC2, contenedores o servidores cuando el enunciado pide serverless</td><td>Lambda + servicios administrados; léelo en las restricciones</td></tr>
    <tr><td>Una sola base de datos compartida por todos los servicios</td><td>BD propia por servicio (o esquema propio en Aurora)</td></tr>
    <tr><td>Subir archivos de 50 MB por API Gateway</td><td>URL prefirmada de S3 + evento <code>ObjectCreated</code></td></tr>
    <tr><td>Flechas sin rótulo o sin distinguir síncrono / asíncrono</td><td>Verbo o evento + (S)/(A), línea sólida / punteada</td></tr>
    <tr><td>Notificar con una Lambda directa y perder el mensaje si falla</td><td>SNS → SQS por canal + DLQ + alarma</td></tr>
    <tr><td>Enviar <code>id_paciente</code> en el body y confiar en él</td><td>Leer el claim del JWT y filtrar con él</td></tr>
    <tr><td>Cron en hora local en EventBridge</td><td>Las reglas usan UTC (Lima = UTC−5)</td></tr>
  </tbody></table>
  <div class="callout amber"><b class="t">Plantilla de justificación</b><b>[Servicio]</b> se usa para <b>[función]</b> porque <b>[requisito del caso]</b>. Se prefiere sobre <b>[alternativa]</b> porque <b>[razón]</b>. Recibe <b>[trigger]</b>, <b>[hace X]</b> y <b>[manda Y a Z]</b>.</div>
  </div>`;
}
