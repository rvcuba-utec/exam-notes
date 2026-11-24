import { base } from '../lib/layout.mjs';

function diagrama() {
  const ms = [
    { num: 1, name: 'Clientes y KYC', lam: 'registrarCliente · urlDocumento\nverificarKyc (workflow)', db: 'dynamodb', dbl: 'DynamoDB', extra: { icon: 'textract', label: 'Textract' } },
    { num: 2, name: 'Cuentas (ledger)', lam: 'abrirCuenta · saldo · movimientos\ndebitar · acreditar', db: 'aurora', dbl: 'Aurora Sv.' },
    { num: 3, name: 'Transferencias', lam: 'iniciarTransferencia · confirmar\nverTransferencia', db: 'aurora', dbl: 'Aurora Sv.', extra: { icon: 'stepfunctions', label: 'Express' } },
    { num: 4, name: 'Tarjetas', lam: 'solicitarTarjeta · bloquear\nlimites', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 5, name: 'Préstamos', lam: 'simular · solicitar · aprobar\naceptarContrato', db: 'aurora', dbl: 'Aurora Sv.', extra: { icon: 'stepfunctions', label: 'Workflow' } },
    { num: 6, name: 'Antifraude', lam: 'evaluarRiesgo · listarAlertas\nresolverAlerta', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 7, name: 'Auditoría y cumplimiento', lam: 'consultarAuditoria (Athena)\nestadoConsulta', db: 's3', dbl: 'S3 WORM' },
  ];
  const b = base({
    ms, waf: true, rightLabel: '4 · Saga de transferencia, eventos, auditoría inmutable y estados de cuenta',
    actors: [
      { icon: 'mobile', label: 'Clientes', sub: 'app móvil / web', frontSub: 'Banca móvil' },
      { icon: 'user', label: 'Analistas y\nauditores', sub: 'back-office', frontSub: 'Panel interno' },
    ],
    idpSub: 'User Pool · MFA obligatorio\nJWT de corta vida',
    apiSub: 'REST · authorizer Cognito\nusage plans · throttling',
    transversals: [['cloudwatch', 'CloudWatch', 'alarmas · DLQ'], ['kms', 'KMS', 'CMK por servicio'], ['secrets', 'Secrets Manager', 'Aurora · CCE'], ['iam', 'IAM', 'mínimo privilegio'], ['cloudtrail', 'CloudTrail', 'auditoría de la API'], ['xray', 'X-Ray', 'trazas de transferencia']],
  });
  const { groups, nodes, notes, edges, marks, mid, X, W, AX } = b;

  // Step Functions Express (transferencia)
  nodes.push({ id: 'sf', x: 1010, y: 291, icon: 'stepfunctions', size: 50 });
  notes.push({ x: 1044, y: 318, t: 'Step Functions Express', fs: 11, weight: 800, fill: '#18283b' });
  notes.push({ x: 1044, y: 331, t: 'saga síncrona + reverso', fs: 10, weight: 500, fill: '#55657a' });
  edges.push({ pts: [[X + W, mid(2)], [980, mid(2)]], kind: 'sync', label: 'StartSyncExecution', n: 3, nx: 948, ny: mid(2) + 18, lx: 934, ly: mid(2) - 14 });
  edges.push({ pts: [[1010, 322], [1010, mid(5)], [X + W, mid(5)]], kind: 'sync', label: 'evaluarRiesgo', n: 4, nx: 1030, ny: 420, lx: 956, ly: mid(5) - 14 });
  edges.push({ pts: [[1010, 260], [1010, mid(1)], [X + W, mid(1)]], kind: 'sync', label: 'debitar / acreditar', n: 5, nx: 1030, ny: 232, lx: 956, ly: mid(1) - 14 });
  notes.push({ x: 1044, y: 352, t: 'riesgo ALTO → espera OTP', fs: 10, weight: 700, fill: '#a02020' });
  notes.push({ x: 1044, y: 365, t: '(task token) y responde 202', fs: 10, weight: 700, fill: '#a02020' });

  // EventBridge + notificaciones
  nodes.push({ id: 'eb', x: 1250, y: 291, icon: 'eventbridge', size: 46, label: 'EventBridge', sub: 'bus banco' });
  edges.push({ pts: [[1040, 291], [1222, 291]], kind: 'async', label: 'TransferenciaCompletada', n: 6, nx: 1204, ny: 312, lx: 1136, ly: 273 });
  // auditoría
  nodes.push({ id: 'fh', x: 1250, y: 150, icon: 'firehose', size: 42 });
  notes.push({ x: 1160, y: 196, t: 'Firehose · todos los eventos', fs: 10.5, weight: 700, fill: '#18283b' });
  nodes.push({ id: 's3a', x: 1360, y: 150, icon: 's3', size: 42, label: 'S3 auditoría', sub: 'Object Lock · 10 años' });
  nodes.push({ id: 'ath', x: 1448, y: 150, icon: 'athena', size: 42, label: 'Athena', sub: 'SQL' });
  edges.push({ pts: [[1250, 266], [1250, 174]], kind: 'async', label: 'regla *', lx: 1250, ly: 230 });
  edges.push({ pts: [[1274, 150], [1337, 150]], kind: 'data' });
  edges.push({ pts: [[1385, 150], [1424, 150]], kind: 'data', noArrow: true });
  edges.push({ pts: [[1448, 108], [1448, 82], [AX + 8, 82], [AX + 8, mid(6)], [X + W, mid(6)]], kind: 'ctrl', label: 'consulta (Auditoría)', lx: 1180, ly: 82 });
  // SNS → colas
  nodes.push({ id: 'snsn', x: 1120, y: 520, icon: 'sns', size: 46, label: 'SNS\nnotificaciones', sub: 'tipo = MOVIMIENTO | ALERTA' });
  edges.push({ pts: [[1250, 360], [1250, 400], [1120, 400], [1120, 492]], kind: 'async', label: 'regla', lx: 1186, ly: 400 });
  nodes.push({ id: 'q1', x: 1262, y: 455, icon: 'sqs', size: 38, label: 'push', badge: 'DLQ' });
  nodes.push({ id: 'q2', x: 1262, y: 545, icon: 'sqs', size: 38, label: 'sms', badge: 'DLQ' });
  nodes.push({ id: 'l1', x: 1346, y: 455, icon: 'lambda', size: 32, label: 'enviarPush' });
  nodes.push({ id: 'l2', x: 1346, y: 545, icon: 'lambda', size: 32, label: 'enviarSMS' });
  nodes.push({ id: 'd1', x: 1432, y: 455, icon: 'sns', size: 36, label: 'SNS Push', sub: 'cliente' });
  nodes.push({ id: 'd2', x: 1432, y: 545, icon: 'sns', size: 36, label: 'SNS SMS', sub: 'alertas y OTP' });
  groups.push({ x: 1212, y: 408, w: 274, h: 212, tone: 'purple', dash: true, label: '8 · Notificaciones', fs: 12 });
  edges.push({ pts: [[1146, 520], [1186, 520], [1186, 455], [1240, 455]], kind: 'async', label: 'fan-out', n: 7, nx: 1170, ny: 538, lx: 1204, ly: 438 });
  edges.push({ pts: [[1186, 520], [1186, 545], [1240, 545]], kind: 'async' });
  edges.push({ from: 'q1', to: 'l1', route: 'h', kind: 'async' });
  edges.push({ from: 'q2', to: 'l2', route: 'h', kind: 'async' });
  edges.push({ from: 'l1', to: 'd1', route: 'h', kind: 'sync' });
  edges.push({ from: 'l2', to: 'd2', route: 'h', kind: 'sync' });
  notes.push({ x: 1222, y: 610, t: 'DLQ + alarma CloudWatch', fs: 10, weight: 700, fill: '#a02020' });

  // estados de cuenta mensuales
  nodes.push({ id: 'cron', x: 1010, y: 662, icon: 'eventbridge', size: 42, label: 'EventBridge', sub: 'día 1 · 01:00 Lima = 06:00 UTC' });
  nodes.push({ id: 'lest', x: 1150, y: 662, icon: 'lambda', size: 34, label: 'estadoDeCuenta', sub: 'lee Aurora' });
  nodes.push({ id: 's3e', x: 1280, y: 662, icon: 's3', size: 34, label: 'S3 estados', sub: 'PDF cifrado' });
  nodes.push({ id: 'ses', x: 1410, y: 662, icon: 'ses', size: 34, label: 'SES', sub: 'aviso con enlace' });
  edges.push({ from: 'cron', to: 'lest', route: 'h', kind: 'async' });
  edges.push({ from: 'lest', to: 's3e', route: 'h', kind: 'data' });
  edges.push({ from: 's3e', to: 'ses', route: 'h', kind: 'async' });

  return { w: 1500, h: b.height, groups, nodes, notes, edges, pills: [], marks };
}

export default {
  id: '06', slug: 'banco',
  title: 'BancoAndino Digital — Banca Móvil con Transferencias Inmediatas',
  pattern: 'Saga Express + antifraude · Ledger ACID en Aurora · Auditoría WORM',
  kicker: 'CASO 06 · FINTECH · ALTA SEGURIDAD',
  svc: ['WAF', 'Cognito (MFA)', 'API Gateway', 'Lambda', 'Aurora Serverless', 'DynamoDB', 'Step Functions', 'Textract', 'EventBridge', 'SNS + SQS + DLQ', 'Firehose + S3 + Athena', 'KMS'],
  problema: 'Banco 100 % digital. El cliente se registra desde el celular y valida su identidad (foto del DNI + selfie), abre cuentas de ahorro, hace transferencias inmediatas, administra su tarjeta de débito y solicita préstamos personales. Cada transferencia debe evaluarse contra fraude en menos de 300 ms y no puede quedar “a medias”: o se debita y acredita, o se revierte. Los picos de quincena y fin de mes son ×8. La regulación exige auditar todo movimiento y conservar los registros 10 años sin posibilidad de alteración.',
  reqs: ['Dinero: ACID e idempotencia', 'Antifraude < 300 ms por transferencia', 'KYC con foto de DNI + selfie', 'Picos de quincena ×8', 'Auditoría inmutable 10 años', 'MFA y datos cifrados con KMS'],
  detectar: [
    ['“registro”, “foto del DNI y selfie”', 'Clientes y KYC', 'DynamoDB + S3', 'Perfil por id; documentos en S3; verificación con Textract + Rekognition'],
    ['“cuentas”, “saldo”, “movimientos”', 'Cuentas (ledger)', 'Aurora Serverless', 'Libro mayor: ACID, saldo = suma de movimientos, joins para estados'],
    ['“transferencias inmediatas”, “no quedar a medias”', 'Transferencias', 'Aurora + Step Functions', 'Saga síncrona con reverso; idempotencia por clave'],
    ['“tarjeta”, “bloquear”, “límites”', 'Tarjetas', 'DynamoDB', 'Estado por tarjeta; lectura/escritura de baja latencia'],
    ['“préstamos”, “evaluación”, “desembolso”', 'Préstamos', 'Aurora + Step Functions', 'Flujo largo con aprobación humana y contrato'],
    ['“fraude en < 300 ms”', 'Antifraude', 'DynamoDB', 'Reglas y listas por cliente; decisión rápida por clave'],
    ['“auditar todo”, “10 años sin alteración”', 'Auditoría y cumplimiento', 'S3 Object Lock + Athena', 'Almacenamiento WORM barato y consulta SQL sin servidor'],
    ['“avisar al cliente”, “OTP”', 'Notificaciones', 'sin BD', 'Push/SMS por colas con DLQ'],
  ],
  ms: [
    {
      n: 1, name: 'Clientes y KYC', icon: 'dynamodb', extraIcon: 'textract', db: 'DynamoDB (PK id_cliente) + S3 documentos cifrados con KMS', tablas: 'clientes, verificaciones_kyc',
      resp: 'Registro, subida de documentos y verificación de identidad (Textract + Rekognition en un workflow).',
      eps: [
        { m: 'POST', p: '/clientes', l: 'registrarCliente', who: 'público (con captcha y WAF)', st: 201,
          in: { tipo_doc: 'DNI', num_doc: '70123456', nombres: 'Ana María', apellidos: 'Vega Ruiz', fecha_nacimiento: '1994-03-02', correo: 'ana.vega@mail.com', telefono: '+51999111000' },
          out: { id_cliente: 'CLI-2026-88120', estado_kyc: 'PENDIENTE_DOCUMENTOS' }, errs: '400 · 409 documento ya registrado', note: 'Crea el usuario en Cognito (MFA por SMS) y el perfil en DynamoDB' },
        { m: 'POST', p: '/clientes/me/kyc/url-subida', l: 'urlDocumento', who: 'clientes', st: 200,
          in: { tipo: 'DNI_FRENTE', content_type: 'image/jpeg' }, out: { url_subida: 'https://s3…firma…', s3_key: 'kyc/CLI-2026-88120/dni_frente.jpg', expira_en_seg: 300 }, errs: '400 tipo inválido' },
        { m: 'POST', p: '/clientes/me/kyc/verificar', l: 'verificarKyc', who: 'clientes', st: 202,
          in: {}, out: { estado_kyc: 'EN_VERIFICACION', id_ejecucion: 'kyc-88120-001' }, errs: '409 faltan documentos', note: 'Inicia un workflow: Textract extrae datos del DNI → Rekognition compara rostro con la selfie → regla de puntaje' },
        { m: 'GET', p: '/clientes/me/kyc', l: 'estadoKyc', who: 'clientes', inS: '— (id del token)', st: 200,
          out: { estado_kyc: 'APROBADO', score_rostro: 0.97, datos_coinciden: true, verificado_el: '2026-11-24T10:41:00Z' }, errs: '' },
      ],
    },
    {
      n: 2, name: 'Cuentas (ledger)', icon: 'aurora', db: 'Aurora Serverless v2 (esquema cuentas) · RDS Proxy · Secrets Manager · KMS', tablas: 'cuentas, movimientos',
      resp: 'Libro mayor: cada movimiento es una fila inmutable; el saldo se mantiene en la misma transacción.',
      eps: [
        { m: 'POST', p: '/cuentas', l: 'abrirCuenta', who: 'clientes (KYC aprobado)', st: 201,
          in: { tipo: 'AHORROS', moneda: 'PEN' }, out: { id_cuenta: 'CTA-77120', numero: '191-00123456-0-12', cci: '00219100012345601234', saldo: 0.0 }, errs: '403 KYC no aprobado · 409 límite de cuentas' },
        { m: 'GET', p: '/cuentas/{id_cuenta}/movimientos?desde=2026-11-01&limite=20', l: 'movimientos', who: 'clientes (dueño)', q: 'path id_cuenta · query desde, hasta, limite', st: 200,
          out: { id_cuenta: 'CTA-77120', saldo: 1520.4, items: [{ id: 'MOV-99120', fecha: '2026-11-24T09:12', tipo: 'DEBITO', monto: 200.0, glosa: 'Transferencia a Luis' }], siguiente_token: 'eyJvIjoyMH0' }, errs: '403 cuenta ajena' },
        { m: 'POST', p: '/cuentas/{id_cuenta}/debitar', l: 'debitar', who: 'interno (Step Functions)', st: 200,
          in: { monto: 200.0, id_transferencia: 'TRF-55120', clave_idempotencia: 'TRF-55120-D' }, out: { id_movimiento: 'MOV-99120', saldo: 1320.4 }, errs: '409 saldo insuficiente · 200 repetido (misma clave)', note: 'BEGIN; SELECT … FOR UPDATE; INSERT movimiento; UPDATE saldo; COMMIT. La clave de idempotencia evita doble débito en reintentos' },
        { m: 'GET', p: '/cuentas', l: 'listarCuentas', who: 'clientes (del token)', inS: '—', outS: '200 [{id_cuenta, numero, saldo}]', card: false },
        { m: 'GET', p: '/cuentas/{id_cuenta}/saldo', l: 'saldo', who: 'clientes (dueño)', inS: 'path id_cuenta', outS: '200 {saldo, disponible}', card: false },
      ],
    },
    {
      n: 3, name: 'Transferencias', icon: 'aurora', extraIcon: 'stepfunctions', db: 'Aurora Serverless v2 (esquema transferencias) + Step Functions Express', tablas: 'transferencias',
      resp: 'Orquesta antifraude → débito → crédito con reverso si algo falla; responde con el resultado.',
      eps: [
        { m: 'POST', p: '/transferencias', l: 'iniciarTransferencia', who: 'clientes (MFA)', st: 201,
          in: { cuenta_origen: 'CTA-77120', cuenta_destino: '00219100098765401234', monto: 200.0, moneda: 'PEN', glosa: 'Alquiler noviembre' },
          out: { id_transferencia: 'TRF-55120', estado: 'COMPLETADA', monto: 200.0, comision: 0.0, fecha: '2026-11-24T09:12:07Z' },
          errs: '202 PENDIENTE_VALIDACION (riesgo alto) · 409 saldo insuficiente · 403 cuenta ajena', note: 'Header Idempotency-Key obligatorio. Express síncrono: responde con el resultado; la Lambda lee la cuenta origen del claim, no del body' },
        { m: 'POST', p: '/transferencias/{id}/confirmar', l: 'confirmarTransferencia', who: 'clientes (dueño)', st: 200,
          in: { otp: '482913' }, out: { id_transferencia: 'TRF-55120', estado: 'COMPLETADA' }, errs: '401 OTP inválido · 409 expirada', note: 'Reanuda la ejecución con el task token guardado cuando el riesgo fue ALTO' },
        { m: 'GET', p: '/transferencias/{id}', l: 'verTransferencia', who: 'clientes (dueño)', q: 'path id', st: 200,
          out: { id_transferencia: 'TRF-55120', estado: 'COMPLETADA', origen: 'CTA-77120', destino: '…01234', monto: 200.0, pasos: [{ paso: 'ANTIFRAUDE', resultado: 'BAJO' }, { paso: 'DEBITO', resultado: 'OK' }, { paso: 'CREDITO', resultado: 'OK' }] } },
        { m: 'GET', p: '/transferencias?estado=PENDIENTE_VALIDACION', l: 'listarTransferencias', who: 'clientes (del token)', inS: 'query estado, desde', outS: '200 [{id_transferencia, estado, monto}]', card: false },
      ],
    },
    {
      n: 4, name: 'Tarjetas', icon: 'dynamodb', db: 'DynamoDB (PK id_cliente · SK TARJETA#id)', tablas: 'tarjetas, límites',
      resp: 'Solicitud, bloqueo inmediato y límites de la tarjeta de débito.',
      eps: [
        { m: 'PATCH', p: '/tarjetas/{id_tarjeta}/bloqueo', l: 'bloquearTarjeta', who: 'clientes (dueño) · operaciones', st: 200,
          in: { bloqueada: true, motivo: 'PERDIDA' }, out: { id_tarjeta: 'TJ-4410', estado: 'BLOQUEADA', desde: '2026-11-24T11:03:00Z' }, errs: '403 · 404', note: 'Publica TarjetaBloqueada; el procesador de pagos consulta este estado en cada autorización' },
        { m: 'PUT', p: '/tarjetas/{id_tarjeta}/limites', l: 'limites', who: 'clientes (dueño)', st: 200,
          in: { limite_diario: 1500.0, compras_internet: true, retiros_exterior: false }, out: { actualizado: true }, errs: '400 supera el máximo permitido' },
        { m: 'POST', p: '/tarjetas', l: 'solicitarTarjeta', who: 'clientes (KYC aprobado)', inS: '{id_cuenta, tipo: "DEBITO", direccion_envio}', outS: '201 {id_tarjeta, estado: "EN_PRODUCCION"}', card: false },
        { m: 'GET', p: '/tarjetas', l: 'listarTarjetas', who: 'clientes (del token)', inS: '—', outS: '200 [{id_tarjeta, ultimos4, estado}]', card: false },
      ],
    },
    {
      n: 5, name: 'Préstamos', icon: 'aurora', extraIcon: 'stepfunctions', db: 'Aurora Serverless v2 (esquema préstamos) + Step Functions Standard', tablas: 'solicitudes, préstamos, cronograma',
      resp: 'Simulación, solicitud y workflow de evaluación con aprobación humana y desembolso.',
      eps: [
        { m: 'POST', p: '/prestamos/simulaciones', l: 'simular', who: 'clientes', st: 200,
          in: { monto: 15000, plazo_meses: 24 }, out: { cuota_mensual: 748.2, tea: 0.289, total_a_pagar: 17956.8, primera_cuota: '2026-12-24' }, errs: '400 monto fuera de rango', note: 'Cálculo puro, sin escritura: Lambda sin base de datos' },
        { m: 'POST', p: '/prestamos', l: 'solicitarPrestamo', who: 'clientes (KYC aprobado)', st: 202,
          in: { monto: 15000, plazo_meses: 24, destino: 'CAPITAL_DE_TRABAJO', id_cuenta_desembolso: 'CTA-77120' }, out: { id_solicitud: 'SOL-3012', estado: 'EN_EVALUACION' }, errs: '409 ya tiene solicitud abierta', note: 'Inicia workflow Standard: score → reglas → (humano si monto > S/ 10 000) → contrato → desembolso' },
        { m: 'POST', p: '/prestamos/{id_solicitud}/aprobacion', l: 'aprobarPrestamo', who: 'analistas_riesgo', st: 200,
          in: { decision: 'APROBAR', monto_aprobado: 12000, comentario: 'Historial crediticio favorable' }, out: { id_solicitud: 'SOL-3012', estado: 'APROBADO_PENDIENTE_ACEPTACION' }, errs: '403 no es analista · 409 ya resuelta', note: 'Reanuda el workflow con SendTaskSuccess (task token)' },
        { m: 'POST', p: '/prestamos/{id_solicitud}/aceptar', l: 'aceptarContrato', who: 'clientes (dueño)', inS: '{acepto_contrato: true, otp}', outS: '200 {estado: "DESEMBOLSADO"}', card: false },
        { m: 'GET', p: '/prestamos/{id_solicitud}', l: 'estadoPrestamo', who: 'clientes (dueño) · analistas', inS: 'path id', outS: '200 {estado, cronograma[]}', card: false },
      ],
    },
    {
      n: 6, name: 'Antifraude', icon: 'dynamodb', db: 'DynamoDB (PK id_cliente · reglas y perfiles de comportamiento) con DAX opcional', tablas: '— (nuevo)',
      resp: 'Evalúa cada operación en tiempo real y genera alertas para analistas.',
      eps: [
        { m: 'POST', p: '/antifraude/evaluar', l: 'evaluarRiesgo', who: 'interno (Step Functions)', st: 200,
          in: { id_cliente: 'CLI-2026-88120', tipo: 'TRANSFERENCIA', monto: 5000.0, cuenta_destino: '00219100098765401234', dispositivo: 'dev-a91f', ip: '190.12.4.88' },
          out: { riesgo: 'ALTO', score: 0.82, accion: 'REQUERIR_OTP', reglas: ['MONTO_INUSUAL', 'DESTINO_NUEVO'] }, errs: '', note: 'Lecturas por clave en DynamoDB (< 10 ms): perfil del cliente + lista de destinos conocidos + reglas. Si falla, política por defecto: pedir OTP' },
        { m: 'GET', p: '/antifraude/alertas?estado=ABIERTA', l: 'listarAlertas', who: 'analistas_riesgo', q: 'query estado, desde', st: 200,
          out: [{ id_alerta: 'AL-9120', id_cliente: 'CLI-2026-88120', tipo: 'TRANSFERENCIA', score: 0.82, creada: '2026-11-24T09:12:07Z', estado: 'ABIERTA' }] },
        { m: 'PATCH', p: '/antifraude/alertas/{id_alerta}', l: 'resolverAlerta', who: 'analistas_riesgo', inS: '{resolucion: "FALSO_POSITIVO"|"FRAUDE", nota}', outS: '200 {estado: "CERRADA"}', card: false },
        { m: 'PUT', p: '/antifraude/reglas', l: 'actualizarReglas', who: 'administradores', inS: '{reglas[]}', outS: '200 {version}', card: false },
      ],
    },
    {
      n: 7, name: 'Auditoría y cumplimiento', icon: 's3', db: 'S3 con Object Lock (WORM) · Firehose · Athena + Glue', tablas: 'auditoria (tabla original del modelo)',
      resp: 'Registro inmutable de todos los eventos; consultas para auditores sin tocar las bases operativas.',
      eps: [
        { m: 'POST', p: '/auditoria/consultas', l: 'consultarAuditoria', who: 'auditores', st: 202,
          in: { id_cliente: 'CLI-2026-88120', desde: '2026-10-01', hasta: '2026-11-24', tipos: ['TRANSFERENCIA', 'LOGIN'] }, out: { id_consulta: 'Q-6601', estado: 'EJECUTANDO' }, errs: '400 rango mayor a 12 meses', note: 'Lanza una consulta de Athena (asíncrona) sobre Parquet particionado por fecha' },
        { m: 'GET', p: '/auditoria/consultas/{id_consulta}', l: 'estadoConsulta', who: 'auditores (quien la pidió)', q: 'path id_consulta', st: 200,
          out: { id_consulta: 'Q-6601', estado: 'LISTO', filas: 138, url_resultado: 'https://s3…firma…', expira_en_seg: 900 }, errs: '404 · 403' },
      ],
      nota: 'Nadie edita ni borra: S3 <b>Object Lock</b> en modo <i>compliance</i> con retención de 10 años; las reglas de EventBridge envían <b>todos</b> los eventos a Firehose → S3. CloudTrail cubre además las acciones sobre la infraestructura.',
    },
    {
      n: 8, name: 'Notificaciones', icon: 'sns', db: 'sin BD', tablas: '— (nuevo)',
      resp: 'Push y SMS al cliente: movimiento, OTP, alerta de seguridad.',
      eps: [
        { m: 'PUT', p: '/notificaciones/preferencias', l: 'guardarPreferencias', who: 'clientes', st: 200,
          in: { push: true, sms_alertas: true, umbral_aviso: 100.0 }, out: { actualizado: true } },
      ],
      nota: 'Disparadores: <code>SQS push</code> → <code>enviarPush</code> · <code>SQS sms</code> → <code>enviarSMS</code> (OTP y alertas). Cada cola con DLQ y alarma; el OTP tiene expiración corta y reintento limitado.',
    },
  ],
  eventos: [
    { name: 'TransferenciaCompletada', via: 'EventBridge bus → SNS (tipo=MOVIMIENTO) + Firehose (auditoría)', json: { source: 'banco.transferencias', 'detail-type': 'TransferenciaCompletada', detail: { id_transferencia: 'TRF-55120', id_cliente: 'CLI-2026-88120', monto: 200.0, moneda: 'PEN' } } },
    { name: 'AlertaFraude', via: 'Antifraude → EventBridge → SNS (tipo=ALERTA) → SMS', json: { id_alerta: 'AL-9120', id_cliente: 'CLI-2026-88120', score: 0.82, accion: 'REQUERIR_OTP' } },
    { name: 'KycCompletado', via: 'Workflow KYC → EventBridge → Clientes y Notificaciones', json: { id_cliente: 'CLI-2026-88120', estado_kyc: 'APROBADO', score_rostro: 0.97 } },
  ],
  flujos: [
    { t: 'A · Transferencia inmediata con antifraude y reverso (pasos numerados 1–7)', steps: [
      ['Amplify → Cognito', 'El cliente inicia sesión con **MFA**; el JWT dura pocos minutos.'],
      ['WAF → API Gateway → Lambda `iniciarTransferencia`', 'WAF filtra bots; el authorizer valida el JWT; se exige el header `Idempotency-Key`; la cuenta origen se valida contra el claim.'],
      ['Lambda → Step Functions Express', '`StartSyncExecution` arranca la saga y espera el resultado (síncrono, segundos).'],
      ['Step Functions → Antifraude', '`evaluarRiesgo` consulta DynamoDB y devuelve BAJO / ALTO. Con riesgo ALTO la ejecución espera un OTP (task token) y responde 202.'],
      ['Step Functions → Cuentas', '`debitar` y luego `acreditar` (transacciones ACID en Aurora con clave de idempotencia). Si el crédito falla, el paso `reversar` devuelve el débito.'],
      ['Step Functions → EventBridge', 'Publica `TransferenciaCompletada`; el cliente ya recibió su 201. Una regla envía **todos** los eventos a Firehose → S3 (auditoría).'],
      ['EventBridge → SNS → colas → SNS Push / SMS', 'Fan-out a `push` y `sms` con DLQ: aviso del movimiento al cliente y alerta si hubo riesgo.'],
    ] },
    { t: 'B · KYC: foto del DNI + selfie', steps: [
      ['`urlDocumento` → S3', 'El celular sube las fotos directo a S3 (URL prefirmada, cifrado KMS).'],
      ['`verificarKyc` → workflow', 'Step Functions: Textract extrae nombre y número → Rekognition compara el rostro con la selfie → si coincide con el registro, `APROBADO`; si no, revisión manual.'],
      ['Evento `KycCompletado`', 'Habilita la apertura de cuentas y avisa al cliente por push.'],
    ] },
    { t: 'C · Préstamo con aprobación humana y estados de cuenta', steps: [
      ['`solicitarPrestamo` → Standard workflow', 'Score → reglas → si monto > S/ 10 000 espera a un analista (`aprobarPrestamo` reanuda con el task token) → contrato → desembolso en Cuentas.'],
      ['EventBridge `cron(0 6 1 * ? *)`', 'Día 1, 01:00 Lima = 06:00 UTC: `estadoDeCuenta` genera el PDF por cliente desde Aurora, lo guarda en S3 y avisa con enlace prefirmado.'],
    ] },
  ],
  seguridad: {
    grupos: ['clientes', 'analistas_riesgo', 'auditores', 'operaciones', 'administradores'],
    matriz: {
      cols: ['clientes', 'analistas', 'auditores', 'operac.', 'admin'],
      rows: [
        ['Cuentas y movimientos', ['s', 0, 'v', 'v', 0]],
        ['Iniciar transferencia', ['s', 0, 0, 0, 0]],
        ['Bloquear tarjeta', ['s', 0, 0, 1, 0]],
        ['Aprobar préstamos', [0, 1, 0, 0, 0]],
        ['Alertas de fraude', [0, 1, 'v', 0, 1]],
        ['Consultar auditoría', [0, 0, 1, 0, 'v']],
      ],
    },
    puntos: [
      '**MFA obligatorio** en Cognito y **step-up** con OTP para operaciones de riesgo; tokens de acceso de corta duración y refresh controlado.',
      '**WAF + throttling** (usage plans) delante de API Gateway; límites por cliente contra abuso y fuerza bruta.',
      '**Separación de funciones**: analistas, auditores y operaciones son grupos distintos; los auditores solo leen y nadie puede borrar la auditoría (Object Lock).',
      '**Cifrado y secretos**: KMS con clave por servicio (Aurora, DynamoDB, S3), Secrets Manager con rotación, TLS en todo el tránsito, tarjetas por token (nunca el PAN).',
    ],
  },
  conceptos: [
    ['Idempotencia', 'Los reintentos de red o de Step Functions no deben duplicar dinero. Cada operación lleva una clave (`Idempotency-Key`); si ya se aplicó, se devuelve el mismo resultado sin volver a debitar.'],
    ['Express vs Standard', 'Express: ≤ 5 min, alto volumen, respuesta síncrona (transferencias). Standard: hasta 1 año, auditable paso a paso y con espera de aprobación humana (préstamos, KYC).'],
    ['¿Por qué S3 Object Lock?', 'Retención legal de 10 años en modo *compliance*: ni el administrador puede borrar. Athena consulta los Parquet con SQL sin servidores ni cargar datos en una base.'],
  ],
  diagrama,
  figura: 'Figura 6.1 — Banca digital: WAF + Cognito MFA, saga síncrona de transferencia con antifraude, ledger ACID, auditoría inmutable en S3.',
};
