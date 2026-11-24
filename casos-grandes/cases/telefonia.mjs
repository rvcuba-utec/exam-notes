import { base } from '../lib/layout.mjs';

function diagrama() {
  const ms = [
    { num: 1, name: 'Clientes', lam: 'crearCliente · obtenerCliente\nactualizarContacto', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 2, name: 'Líneas y planes', lam: 'listarPlanes · activarLinea\ncambiarPlan · listarLineas', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 3, name: 'Consumo', lam: 'consultarConsumo · configurarAlerta\n(escribe agregarConsumo)', db: 'dynamodb', dbl: 'DDB + TTL' },
    { num: 4, name: 'Facturación', lam: 'ejecutarCiclo · verFactura\nmisFacturas · generarPDF', db: 'aurora', dbl: 'Aurora Sv.', extra: { icon: 's3', label: 'PDF' } },
    { num: 5, name: 'Pagos', lam: 'pagarFactura · historialPagos\nregistrarMedioPago', db: 'aurora', dbl: 'Aurora Sv.' },
    { num: 6, name: 'Beneficios', lam: 'beneficiosVigentes · otorgar\ncanjear', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 7, name: 'Soporte y tickets', lam: 'crearTicket · misTickets\nactualizarTicket', db: 'dynamodb', dbl: 'DynamoDB', extra: { icon: 's3', label: 'Adjuntos' } },
    { num: 8, name: 'Reportes (vista del cliente)', lam: 'reporteCliente · generarPDF\nejecutarMensual', db: 'dynamodb', dbl: 'Vista DDB', extra: { icon: 's3', label: 'PDF' } },
  ];
  const b = base({
    ms, rightLabel: '4 · Ingesta de consumo, eventos de negocio, vista materializada y lote mensual',
    actors: [
      { icon: 'users', label: 'Clientes', sub: 'app web / móvil', frontSub: 'Portal cliente' },
      { icon: 'user', label: 'Agentes y\nfinanzas', sub: 'back-office', frontSub: 'Panel interno' },
    ],
    transversals: [['cloudwatch', 'CloudWatch', 'logs · alarmas DLQ'], ['kms', 'KMS', 'cifrado datos personales'], ['secrets', 'Secrets Manager', 'credenciales Aurora'], ['iam', 'IAM', 'mínimo privilegio'], ['cloudtrail', 'CloudTrail', 'auditoría de accesos']],
  });
  const { groups, nodes, notes, edges, marks, mid, X, W, AX } = b;
  const pills = [];

  // ---- ingesta de consumo (fila superior) ----
  nodes.push({ id: 'red', x: 1440, y: 125, icon: 'server', size: 44, label: 'Red móvil', sub: 'CDR de voz · datos · SMS' });
  nodes.push({ id: 'kin', x: 1320, y: 125, icon: 'kinesis', size: 46 });
  notes.push({ x: 1320, y: 88, t: 'Kinesis Data Streams', fs: 11, weight: 800, fill: '#18283b', anchor: 'middle' });
  nodes.push({ id: 'lagg', x: 1200, y: 125, icon: 'lambda', size: 40, label: 'agregarConsumo', sub: 'lote · upsert por línea' });
  nodes.push({ id: 'fh', x: 1320, y: 235, icon: 'firehose', size: 42, label: 'Firehose', sub: 'buffer Parquet' });
  nodes.push({ id: 's3l', x: 1200, y: 235, icon: 's3', size: 42, label: 'S3 lago', sub: 'histórico por mes' });
  nodes.push({ id: 'ath', x: 1080, y: 235, icon: 'athena', size: 42, label: 'Athena', sub: 'SQL sobre CDR' });
  edges.push({ from: 'red', to: 'kin', route: 'h', kind: 'async', label: 'PutRecords', lx: 1380, ly: 112 });
  edges.push({ from: 'kin', to: 'lagg', route: 'h', kind: 'async', label: 'lote 100', lx: 1260, ly: 112, n: 3, nx: 1233, ny: 143 });
  edges.push({ pts: [[1320, 150], [1320, 205]], kind: 'async' });
  edges.push({ from: 'fh', to: 's3l', route: 'h', kind: 'data' });
  edges.push({ from: 's3l', to: 'ath', route: 'h', kind: 'data' });
  edges.push({ pts: [[1176, 125], [924, 125], [924, mid(2)], [X + W, mid(2)]], kind: 'data', label: 'upsert consumo mensual', lx: 1030, ly: 138 });
  notes.push({ x: 1188, y: 190, t: '>80 % del plan → ConsumoUmbral', fs: 10, weight: 700, fill: '#a02020' });

  // ---- eventos de negocio ----
  nodes.push({ id: 'eb', x: 1010, y: 440, icon: 'eventbridge', size: 48, label: 'EventBridge', sub: 'bus telco · reglas por tipo' });
  edges.push({ pts: [[X + W, mid(3)], [AX, mid(3)], [AX, 440], [980, 440]], kind: 'async', label: 'FacturaEmitida', lx: AX, ly: mid(3) - 14 });
  edges.push({ pts: [[X + W, mid(4)], [AX, mid(4)]], kind: 'async', noArrow: true, label: 'PagoRecibido', lx: AX, ly: mid(4) - 14, n: 3, nx: AX - 12, ny: mid(4) + 18 });
  edges.push({ pts: [[X + W, mid(5)], [AX, mid(5)], [AX, mid(4)]], kind: 'async', noArrow: true, label: 'BeneficioOtorgado', lx: AX, ly: mid(5) + 14 });
  edges.push({ pts: [[X + W, mid(1)], [AX - 8, mid(1)], [AX - 8, mid(3)]], kind: 'async', noArrow: true, label: 'LineaActivada', lx: AX - 8, ly: mid(1) + 20 });

  // regla → SNS → colas
  nodes.push({ id: 'snsn', x: 1140, y: 440, icon: 'sns', size: 44, label: 'SNS\nnotificaciones', sub: 'filtro por tipo' });
  nodes.push({ id: 'q1', x: 1268, y: 375, icon: 'sqs', size: 38, label: 'email', badge: 'DLQ' });
  nodes.push({ id: 'q2', x: 1268, y: 505, icon: 'sqs', size: 38, label: 'sms', badge: 'DLQ' });
  nodes.push({ id: 'l1', x: 1352, y: 375, icon: 'lambda', size: 32, label: 'enviarCorreo' });
  nodes.push({ id: 'l2', x: 1352, y: 505, icon: 'lambda', size: 32, label: 'enviarSMS' });
  nodes.push({ id: 'ses', x: 1444, y: 375, icon: 'ses', size: 38, label: 'SES', sub: 'factura / recibo' });
  nodes.push({ id: 'sms', x: 1444, y: 505, icon: 'sns', size: 38, label: 'SNS SMS', sub: 'consumo / vencimiento' });
  groups.push({ x: 1218, y: 322, w: 268, h: 252, tone: 'purple', dash: true, label: '9 · Notificaciones', fs: 12 });
  edges.push({ pts: [[1040, 440], [1114, 440]], kind: 'async', label: 'regla', n: 4, nx: 1056, ny: 458, lx: 1078, ly: 426 });
  edges.push({ pts: [[1166, 440], [1196, 440], [1196, 375], [1246, 375]], kind: 'async', label: 'fan-out', n: 5, nx: 1210, ny: 410, lx: 1206, ly: 360 });
  edges.push({ pts: [[1166, 440], [1196, 440], [1196, 505], [1246, 505]], kind: 'async' });
  edges.push({ from: 'q1', to: 'l1', route: 'h', kind: 'async' });
  edges.push({ from: 'q2', to: 'l2', route: 'h', kind: 'async', n: 6, nx: 1310, ny: 490 });
  edges.push({ from: 'l1', to: 'ses', route: 'h', kind: 'sync', n: 7, nx: 1398, ny: 359 });
  edges.push({ from: 'l2', to: 'sms', route: 'h', kind: 'sync' });
  notes.push({ x: 1228, y: 562, t: 'DLQ + alarma CloudWatch', fs: 10, weight: 700, fill: '#a02020' });

  // ---- vista materializada del cliente ----
  nodes.push({ id: 'lvis', x: 1130, y: 620, icon: 'lambda', size: 36, label: 'actualizarVista\nCliente' });
  nodes.push({ id: 'ddbv', x: 1280, y: 620, icon: 'dynamodb', size: 40, label: 'vista_cliente', sub: 'perfil + líneas + saldo' });
  edges.push({ pts: [[1010, 470], [1010, 620], [1106, 620]], kind: 'async', label: 'todos los eventos', lx: 1010, ly: 565 });
  edges.push({ from: 'lvis', to: 'ddbv', route: 'h', kind: 'data' });

  // ---- lote mensual ----
  nodes.push({ id: 'cron', x: 1010, y: 740, icon: 'eventbridge', size: 42, label: 'EventBridge', sub: 'cron día 1 · 03:00 Lima' });
  nodes.push({ id: 'lenc', x: 1130, y: 725, icon: 'lambda', size: 34, label: 'encolarReportes', sub: 'pagina clientes' });
  nodes.push({ id: 'qrep', x: 1240, y: 725, icon: 'sqs', size: 38, label: 'SQS reportes', badge: 'DLQ' });
  nodes.push({ id: 'lgen', x: 1350, y: 725, icon: 'lambda', size: 34, label: 'generarReporte\nCliente', sub: 'lee vista' });
  nodes.push({ id: 's3rep', x: 1450, y: 725, icon: 's3', size: 34, label: 'S3 reportes', sub: 'PDF por cliente' });
  edges.push({ from: 'cron', to: 'lenc', route: 'h', kind: 'async' });
  edges.push({ from: 'lenc', to: 'qrep', route: 'h', kind: 'async', label: '1 msg / cliente', lx: 1186, ly: 700 });
  edges.push({ from: 'qrep', to: 'lgen', route: 'h', kind: 'async' });
  edges.push({ from: 'lgen', to: 's3rep', route: 'h', kind: 'data' });
  edges.push({ pts: [[1350, 698], [1350, 646], [1306, 646]], kind: 'data', label: 'lee', lx: 1366, ly: 672 });

  return { w: 1500, h: b.height, groups, nodes, notes, edges, pills, marks };
}

export default {
  id: '04', slug: 'telefonia',
  title: 'TeleAndes — Telefonía Móvil con Reporte Consolidado del Cliente',
  pattern: 'Kinesis + Firehose · Vista materializada · Lote mensual con SQS',
  kicker: 'CASO 04 · TELECOMUNICACIONES · REPORTE CONSOLIDADO',
  svc: ['Amplify', 'Cognito', 'API Gateway', 'Lambda', 'DynamoDB', 'Aurora Serverless', 'Kinesis + Firehose', 'S3 + Athena', 'EventBridge', 'SNS + SQS + DLQ', 'SES'],
  problema: 'Operador móvil con 4 millones de clientes. Cada cliente tiene una o más líneas, un plan, beneficios y facturas mensuales. La red genera millones de registros de consumo (CDR) por hora, y el cliente debe ver en la app cuántos GB lleva usados casi en tiempo real. Hay que facturar cada mes, cobrar, avisar por correo y SMS, atender tickets de soporte y entregar un reporte PDF por cliente con nombre, edad, líneas, consumo, última factura, saldo y beneficios vigentes (datos de varios microservicios). Todo serverless.',
  reqs: ['4 M de clientes · millones de CDR/h', 'Consumo visible casi en tiempo real', 'Facturación mensual ACID', 'Aviso al 80 % del plan', 'Reporte con datos de 5 servicios', 'Histórico auditable en S3'],
  detectar: [
    ['“nombre, edad, correo del cliente”', 'Clientes', 'DynamoDB', 'La edad se calcula de fecha_nacimiento; acceso por id y documento'],
    ['“líneas”, “planes”, “portabilidad”', 'Líneas y planes', 'DynamoDB', 'Líneas por cliente; catálogo de planes de lectura masiva'],
    ['“millones de registros de consumo por hora”', 'Consumo', 'Kinesis + DynamoDB + S3', 'Streaming: agrega por línea; histórico en S3 para Athena'],
    ['“facturar cada mes”, “facturas”', 'Facturación', 'Aurora Serverless', 'Ciclo mensual con joins (cliente–línea–consumo) y PDF'],
    ['“cobrar”, “pagos”, “medios de pago”', 'Pagos', 'Aurora Serverless', 'ACID: pagos ≤ saldo de la factura, conciliación'],
    ['“beneficios”, “promociones”', 'Beneficios', 'DynamoDB', 'Vigentes por cliente; lectura frecuente'],
    ['“tickets”, “adjuntos”', 'Soporte', 'DynamoDB + S3', 'Casos por cliente; adjuntos pesados en S3'],
    ['“reporte del cliente con datos de varios sistemas”', 'Reportes', 'DynamoDB (vista) + S3', 'Vista materializada actualizada por eventos + PDF en S3'],
    ['“avisar por correo y SMS”', 'Notificaciones', 'sin BD', 'Colas por canal con DLQ'],
  ],
  ms: [
    {
      n: 1, name: 'Clientes', icon: 'dynamodb', db: 'DynamoDB (PK id_cliente · GSI num_doc)', tablas: 'clientes',
      resp: 'Datos personales y de contacto del cliente.',
      eps: [
        { m: 'POST', p: '/clientes', l: 'crearCliente', who: 'agentes · clientes (autoregistro)', st: 201,
          in: { tipo_doc: 'DNI', num_doc: '70123456', nombre: 'Jorge', apellido: 'Salas', fecha_nacimiento: '1991-08-20', correo: 'jorge.salas@mail.com', telefono_contacto: '+51999000111' },
          out: { id_cliente: 'CLI-100234', mensaje: 'Cliente creado' }, errs: '400 · 409 documento ya registrado' },
        { m: 'GET', p: '/clientes/{id_cliente}', l: 'obtenerCliente', who: 'clientes (el suyo) · agentes', q: 'path id_cliente', st: 200,
          out: { id_cliente: 'CLI-100234', nombre: 'Jorge', apellido: 'Salas', fecha_nacimiento: '1991-08-20', edad: 35, correo: 'jorge.salas@mail.com' }, errs: '403 · 404', note: 'La edad no se guarda: se calcula al responder' },
        { m: 'PATCH', p: '/clientes/{id_cliente}', l: 'actualizarContacto', who: 'clientes · agentes', inS: '{correo, telefono_contacto}', outS: '200 cliente · publica ClienteActualizado', card: false },
        { m: 'GET', p: '/clientes?num_doc=70123456', l: 'buscarPorDocumento', who: 'agentes', inS: 'query num_doc (GSI)', outS: '200 [{id_cliente, nombre}]', card: false },
      ],
    },
    {
      n: 2, name: 'Líneas y planes', icon: 'dynamodb', db: 'DynamoDB (PK id_cliente · SK LINEA#número) + tabla planes', tablas: 'líneas, planes',
      resp: 'Activación, portabilidad, cambio de plan y catálogo de planes.',
      eps: [
        { m: 'POST', p: '/lineas', l: 'activarLinea', who: 'agentes · clientes', st: 201,
          in: { id_cliente: 'CLI-100234', id_plan: 'PLN-40', tipo: 'PORTABILIDAD', numero_origen: '+51987654321', operador_origen: 'OPERADOR-B' },
          out: { numero: '+51987654321', id_plan: 'PLN-40', estado: 'PENDIENTE_PORTABILIDAD', vigente_desde: '2026-12-02' }, errs: '400 · 409 número ya activo', note: 'Publica LineaActivada' },
        { m: 'GET', p: '/clientes/{id_cliente}/lineas', l: 'listarLineas', who: 'clientes (el suyo) · agentes', q: 'path id_cliente', st: 200,
          out: [{ numero: '+51987654321', plan: 'Plan 40', estado: 'ACTIVA' }, { numero: '+51955123456', plan: 'Plan 20', estado: 'ACTIVA' }] },
        { m: 'PATCH', p: '/lineas/{numero}/plan', l: 'cambiarPlan', who: 'clientes (dueño) · agentes', inS: '{id_plan}', outS: '200 {id_plan, vigente_desde}', card: false },
        { m: 'GET', p: '/planes', l: 'listarPlanes', who: 'público (caché)', inS: '—', outS: '200 [{id_plan, nombre, gigas, minutos, precio}]', card: false },
        { m: 'POST', p: '/lineas/{numero}/suspender', l: 'suspenderLinea', who: 'agentes · finanzas', inS: '{motivo}', outS: '200 {estado: "SUSPENDIDA"}', card: false },
      ],
    },
    {
      n: 3, name: 'Consumo', icon: 'dynamodb', extraIcon: 'kinesis', db: 'DynamoDB (PK numero · SK periodo, TTL) + Kinesis + Firehose → S3', tablas: '— (nuevo)',
      resp: 'Ingesta de CDR en streaming, consumo mensual por línea y alertas por umbral.',
      eps: [
        { m: 'POST', p: '/consumo/eventos', l: 'ingestarCDR', who: 'plataforma de red (IAM, sin Cognito)', st: 202,
          in: { numero: '+51987654321', tipo: 'DATOS', cantidad: 12.4, unidad: 'MB', timestamp: '2026-11-24T14:03:21Z' },
          out: { aceptado: true, shard: 'shardId-000000000003' }, errs: '400 formato inválido · 429 throttling', note: 'Equivale a PutRecord en Kinesis con PartitionKey = numero. En la práctica la red escribe directo al stream, sin API Gateway' },
        { m: 'GET', p: '/lineas/{numero}/consumo?periodo=2026-11', l: 'consultarConsumo', who: 'clientes (dueño) · agentes', q: 'path numero · query periodo', st: 200,
          out: { numero: '+51987654321', periodo: '2026-11', datos_mb_usados: 31240, datos_mb_plan: 40960, porcentaje: 76.3, minutos_usados: 412, sms_usados: 18, actualizado: '2026-11-24T14:03:30Z' }, errs: '403 · 404', note: 'Lectura directa a DynamoDB en < 15 ms; la fila la mantiene agregarConsumo' },
        { m: 'PUT', p: '/lineas/{numero}/alertas', l: 'configurarAlerta', who: 'clientes (dueño)', st: 200,
          in: { umbral_pct: 80, canales: ['SMS', 'EMAIL'] }, out: { actualizado: true } },
      ],
    },
    {
      n: 4, name: 'Facturación', icon: 'aurora', extraIcon: 's3', db: 'Aurora Serverless v2 · RDS Proxy · Secrets Manager + S3 (PDF)', tablas: 'ciclos, facturas, detalle_factura',
      resp: 'Cierre mensual: cruza cliente, línea, plan y consumo y emite la factura (PDF en S3).',
      eps: [
        { m: 'GET', p: '/facturas/{id_factura}', l: 'verFactura', who: 'clientes (la suya) · finanzas', q: 'path id_factura', st: 200,
          out: { id_factura: 'F-2026-11-004512', id_cliente: 'CLI-100234', periodo: '2026-11', total: 119.8, vencimiento: '2026-12-10', estado: 'PENDIENTE', items: [{ concepto: 'Plan 40', monto: 59.9 }, { concepto: 'Plan 20', monto: 39.9 }, { concepto: 'Exceso de datos', monto: 20.0 }], pdf_url: 'https://s3…firma…' }, errs: '403 · 404' },
        { m: 'POST', p: '/facturacion/ciclos/{ciclo}/ejecutar', l: 'ejecutarCiclo', who: 'finanzas · EventBridge (cron)', st: 202,
          in: { ciclo: '2026-11', dry_run: false }, out: { id_ejecucion: 'CIC-2026-11', estado: 'EN_PROCESO', clientes_pendientes: 4012330 }, errs: '409 ciclo ya ejecutado', note: 'Procesa por lotes (SQS) y emite FacturaEmitida por cada factura' },
        { m: 'GET', p: '/facturas?estado=PENDIENTE', l: 'misFacturas', who: 'clientes (del token)', inS: 'query estado, periodo', outS: '200 [{id_factura, periodo, total, estado}]', card: false },
        { m: 'GET', p: '/facturas/{id_factura}/pdf', l: 'descargarPDF', who: 'clientes (dueño)', inS: 'path id', outS: '200 {url_descarga, expira_en_seg}', card: false },
      ],
    },
    {
      n: 5, name: 'Pagos', icon: 'aurora', db: 'Aurora Serverless v2 (esquema pagos, mismo clúster)', tablas: 'pagos, medios_pago',
      resp: 'Cobro de facturas, medios de pago y débito automático.',
      eps: [
        { m: 'POST', p: '/facturas/{id_factura}/pagos', l: 'pagarFactura', who: 'clientes', st: 201,
          in: { monto: 119.8, medio: 'TARJETA', token_tarjeta: 'tok_5Kd…' }, out: { id_pago: 'PG-908812', id_factura: 'F-2026-11-004512', estado_factura: 'PAGADA', saldo: 0.0 },
          errs: '409 monto excede el saldo · 402 rechazado', note: 'INSERT pago + UPDATE factura en una transacción. Publica PagoRecibido (se actualiza la vista y se envía el recibo)' },
        { m: 'GET', p: '/pagos?desde=2026-01-01', l: 'historialPagos', who: 'clientes (del token)', q: 'query desde, hasta', st: 200,
          out: [{ id_pago: 'PG-908812', fecha: '2026-11-24', monto: 119.8, medio: 'TARJETA' }] },
        { m: 'POST', p: '/medios-pago', l: 'registrarMedioPago', who: 'clientes', inS: '{tipo, token}', outS: '201 {id_medio}', card: false },
      ],
    },
    {
      n: 6, name: 'Beneficios', icon: 'dynamodb', db: 'DynamoDB (PK id_cliente · SK BEN#id)', tablas: 'beneficios, promociones',
      resp: 'Beneficios y promociones vigentes por cliente.',
      eps: [
        { m: 'GET', p: '/clientes/{id_cliente}/beneficios', l: 'beneficiosVigentes', who: 'clientes (el suyo) · agentes', q: 'path id_cliente', st: 200,
          out: [{ id_beneficio: 'BEN-77', nombre: '10 GB extra por fidelidad', tipo: 'DATOS', vigente_hasta: '2027-02-28' }] },
        { m: 'POST', p: '/beneficios', l: 'otorgarBeneficio', who: 'marketing', st: 201,
          in: { id_cliente: 'CLI-100234', id_promocion: 'PROMO-FIDELIDAD', vigente_hasta: '2027-02-28' }, out: { id_beneficio: 'BEN-77', estado: 'VIGENTE' }, errs: '409 ya otorgado', note: 'Publica BeneficioOtorgado' },
        { m: 'POST', p: '/beneficios/{id}/canjear', l: 'canjear', who: 'clientes (dueño)', inS: 'path id', outS: '200 {estado: "CANJEADO"}', card: false },
      ],
    },
    {
      n: 7, name: 'Soporte y tickets', icon: 'dynamodb', extraIcon: 's3', db: 'DynamoDB (PK id_cliente · SK ticket#id · GSI estado) + S3 adjuntos', tablas: 'tickets, comentarios',
      resp: 'Casos de soporte con SLA y adjuntos (capturas, PDF).',
      eps: [
        { m: 'POST', p: '/tickets', l: 'crearTicket', who: 'clientes · agentes', st: 201,
          in: { asunto: 'Cobro duplicado', categoria: 'FACTURACION', descripcion: 'Me cobraron dos veces el plan', numero_linea: '+51987654321' }, out: { id_ticket: 'TKT-55231', estado: 'ABIERTO', sla_horas: 24 }, errs: '400' },
        { m: 'GET', p: '/tickets?estado=ABIERTO', l: 'misTickets', who: 'clientes (del token) · agentes', inS: 'query estado (GSI)', outS: '200 [{id_ticket, asunto, estado}]', card: false },
        { m: 'PATCH', p: '/tickets/{id_ticket}', l: 'actualizarTicket', who: 'agentes', inS: '{estado, respuesta}', outS: '200 ticket', card: false },
        { m: 'POST', p: '/tickets/{id_ticket}/adjuntos/url-subida', l: 'subirAdjunto', who: 'clientes · agentes', inS: '{nombre_archivo, content_type}', outS: '200 {url_subida, s3_key}', card: false },
      ],
    },
    {
      n: 8, name: 'Reportes (vista del cliente)', icon: 'dynamodb', extraIcon: 's3', db: 'DynamoDB vista_cliente (materializada por eventos) + S3 PDF', tablas: '— (nuevo, derivada de 5 servicios)',
      resp: 'Reporte consolidado del cliente sin hacer JOIN entre bases: se compone desde una vista mantenida por eventos.',
      eps: [
        { m: 'GET', p: '/reportes/cliente/{id_cliente}', l: 'reporteCliente', who: 'clientes (el suyo) · agentes', q: 'path id_cliente', st: 200,
          out: { id_cliente: 'CLI-100234', nombre: 'Jorge Salas', edad: 35, lineas: [{ numero: '+51987654321', plan: 'Plan 40', consumo_pct: 76.3 }], ultima_factura: { id: 'F-2026-11-004512', total: 119.8, estado: 'PAGADA' }, saldo: 0.0, beneficios: ['10 GB extra por fidelidad'], actualizado: '2026-11-24T14:05:00Z' },
          errs: '403 · 404', note: 'Una sola lectura a DynamoDB. Si la vista no existe, compone con invoke a Clientes, Líneas, Facturación y Beneficios (estrategia 1)' },
        { m: 'POST', p: '/reportes/cliente/{id_cliente}/pdf', l: 'generarPDF', who: 'clientes · agentes', st: 202,
          in: { periodo: '2026-11', idioma: 'es' }, out: { id_reporte: 'REP-310045', estado: 'EN_COLA' }, errs: '400 · 403' },
        { m: 'GET', p: '/reportes/{id_reporte}', l: 'estadoReporte', who: 'quien lo pidió', inS: 'path id_reporte', outS: '200 {estado, url_descarga}', card: false },
        { m: 'POST', p: '/reportes/mensual', l: 'ejecutarMensual', who: 'finanzas · EventBridge (cron)', inS: '{periodo}', outS: '202 {clientes_encolados}', card: false },
      ],
    },
    {
      n: 9, name: 'Notificaciones', icon: 'sns', extraIcon: 'ses', db: 'sin BD obligatoria', tablas: '— (nuevo)',
      resp: 'Correo y SMS: factura emitida, recibo de pago, consumo al 80 %, vencimiento.',
      eps: [
        { m: 'PUT', p: '/notificaciones/preferencias', l: 'guardarPreferencias', who: 'clientes', st: 200,
          in: { canales: ['EMAIL', 'SMS'], avisos: ['FACTURA', 'CONSUMO', 'VENCIMIENTO'] }, out: { actualizado: true } },
      ],
      nota: 'Disparadores: <code>SQS email</code> → <code>enviarCorreo</code> (SES) · <code>SQS sms</code> → <code>enviarSMS</code> (SNS SMS). Cada cola con DLQ y alarma.',
    },
  ],
  eventos: [
    { name: 'PagoRecibido', via: 'EventBridge bus → regla → SNS notificaciones y Lambda vista', json: { source: 'telco.pagos', 'detail-type': 'PagoRecibido', detail: { id_cliente: 'CLI-100234', id_factura: 'F-2026-11-004512', monto: 119.8 } } },
    { name: 'FacturaEmitida', via: 'EventBridge bus → SNS (tipo=FACTURA) + vista', json: { id_cliente: 'CLI-100234', id_factura: 'F-2026-11-004512', total: 119.8, vencimiento: '2026-12-10' } },
    { name: 'ConsumoUmbral', via: 'agregarConsumo → EventBridge → SNS (tipo=UMBRAL) → SMS', json: { numero: '+51987654321', periodo: '2026-11', porcentaje: 82.1, umbral: 80 } },
  ],
  flujos: [
    { t: 'A · Cliente paga su factura (pasos numerados 1–7)', steps: [
      ['Amplify → Cognito', 'El cliente inicia sesión; el JWT trae `custom:id_cliente` y el grupo `clientes`.'],
      ['API Gateway → Lambda `pagarFactura`', 'El authorizer valida el JWT; la Lambda verifica que la factura sea del cliente y registra el pago en Aurora (transacción).'],
      ['Lambda → EventBridge', 'Publica `PagoRecibido` en el bus del negocio (asíncrono); el cliente ya recibió su 201.'],
      ['EventBridge → regla → SNS `notificaciones`', 'Una regla filtra `detail-type = PagoRecibido` y publica en SNS con `tipo=PAGO`; otra regla envía el mismo evento a `actualizarVistaCliente`.'],
      ['SNS → colas SQS', 'Fan-out a `email` y `sms`, cada una con su DLQ.'],
      ['SQS → Lambdas consumidoras', '`enviarCorreo` y `enviarSMS` procesan por lotes con reintentos.'],
      ['SES / SNS SMS', 'Recibo por correo y SMS. Si SMS falla, reintenta y termina en DLQ con alarma sin afectar al correo.'],
    ] },
    { t: 'B · Consumo en tiempo casi real (Kinesis)', steps: [
      ['Red móvil → Kinesis Data Streams', 'Cada CDR se publica con `PartitionKey = numero` para mantener el orden por línea.'],
      ['Kinesis → Lambda `agregarConsumo`', 'Procesa lotes de 100 registros, suma por línea y hace `UpdateItem` atómico en DynamoDB; si supera el 80 % publica `ConsumoUmbral`.'],
      ['Kinesis → Firehose → S3 → Athena', 'En paralelo se archiva en Parquet por mes: el histórico se consulta con SQL sin tocar DynamoDB.'],
    ] },
    { t: 'C · Reporte mensual para los 4 M de clientes', steps: [
      ['EventBridge `cron(0 8 1 * ? *)`', '03:00 Lima del día 1 (08:00 UTC). Invoca `encolarReportes`.'],
      ['`encolarReportes` → SQS reportes', 'Pagina la tabla de clientes y envía un mensaje por cliente (lotes de 10).'],
      ['SQS → `generarReporteCliente`', 'Lee `vista_cliente` (1 lectura), genera el PDF y lo guarda en S3; la DLQ recoge los fallidos para reproceso.'],
    ] },
  ],
  seguridad: {
    grupos: ['clientes', 'agentes', 'marketing', 'finanzas', 'administradores'],
    matriz: {
      cols: ['clientes', 'agentes', 'marketing', 'finanzas', 'admin'],
      rows: [
        ['Datos del cliente y líneas', ['s', 1, 0, 0, 1]],
        ['Consumo', ['s', 'v', 0, 0, 1]],
        ['Facturas y pagos', ['s', 'v', 0, 1, 1]],
        ['Beneficios', ['v', 1, 1, 0, 1]],
        ['Tickets', ['s', 1, 0, 0, 1]],
        ['Ejecutar ciclo / reporte mensual', [0, 0, 0, 1, 1]],
      ],
    },
    puntos: [
      '**Cliente solo lo suyo**: las Lambdas filtran por `custom:id_cliente` del JWT; los agentes ven cualquier cliente pero cada lectura queda auditada.',
      '**Ingesta de red sin Cognito**: la plataforma de red usa credenciales IAM de mínimo privilegio solo para `kinesis:PutRecord`.',
      '**Datos personales**: KMS en DynamoDB, Aurora y S3; el número de tarjeta nunca se guarda (solo token); PDF con URL prefirmada de corta vida.',
      '**Secretos y auditoría**: credenciales de Aurora en Secrets Manager; CloudTrail y CloudWatch Logs para accesos a datos personales.',
    ],
  },
  conceptos: [
    ['Estrategia 1 · Componer en línea', 'Una Lambda invoca a 4 servicios y arma el JSON. Simple y siempre fresco, pero lento con muchos servicios y se cae si uno falla. Útil para pocos clientes.'],
    ['Estrategia 2 · Vista materializada (elegida)', 'Los eventos mantienen `vista_cliente` en DynamoDB. Lectura de una sola consulta (< 15 ms), tolera caídas de otros servicios; consistencia eventual de segundos.'],
    ['Estrategia 3 · Lote mensual', 'EventBridge → SQS → Lambda genera PDFs para todos los clientes sin usar un servidor. Ideal para reportes masivos programados; combina con la vista.'],
  ],
  diagrama,
  figura: 'Figura 4.1 — Telefonía serverless: ingesta Kinesis, eventos de negocio con fan-out, vista materializada del cliente y lote mensual de reportes.',
};
