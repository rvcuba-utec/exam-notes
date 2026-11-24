import { msBox } from '../lib/diagram.mjs';

// ======================= DIAGRAMA =======================
function diagrama() {
  const groups = [], nodes = [], notes = [], edges = [], pills = [], marks = [];
  const Y0 = 66, STEP = 92, H = 82, X = 512, W = 372;
  const rowY = i => Y0 + i * STEP;
  const mid = i => rowY(i) + 40;

  groups.push({ x: 12, y: 36, w: 218, h: 768, tone: 'blue', label: '1 · Clientes y frontend' });
  groups.push({ x: 252, y: 36, w: 208, h: 768, tone: 'red', label: '2 · Identidad y entrada' });
  groups.push({ x: 494, y: 36, w: 410, h: 768, tone: 'amber', label: '3 · Microservicios (Lambda + BD propia)' });
  groups.push({ x: 930, y: 36, w: 560, h: 768, tone: 'green', label: '4 · Mensajería asíncrona, tareas programadas y entrega' });

  // clientes
  nodes.push({ id: 'pac', x: 62, y: 190, icon: 'users', label: 'Pacientes', sub: 'web / móvil' });
  nodes.push({ id: 'staff', x: 62, y: 410, icon: 'user', label: 'Personal', sub: 'médicos · recepción\nlab · farmacia · admin' });
  nodes.push({ id: 'amp1', x: 170, y: 190, icon: 'amplify', label: 'Amplify', sub: 'Portal pacientes' });
  nodes.push({ id: 'amp2', x: 170, y: 410, icon: 'amplify', label: 'Amplify', sub: 'Panel personal' });
  edges.push({ from: 'pac', to: 'amp1', route: 'h', kind: 'sync' });
  edges.push({ from: 'staff', to: 'amp2', route: 'h', kind: 'sync' });

  // identidad / entrada
  nodes.push({ id: 'cog', x: 356, y: 150, icon: 'cognito', label: 'Cognito', sub: 'User Pool + grupos\nJWT (id / access)' });
  nodes.push({ id: 'apigw', x: 356, y: 410, icon: 'apigw', label: 'API Gateway', sub: 'REST · authorizer Cognito\nCORS · throttling' });
  edges.push({ pts: [[200, 190], [232, 190], [232, 150], [326, 150]], kind: 'sync', label: 'login (Cognito)', n: 1, nx: 232, ny: 170, lx: 273, ly: 140 });
  edges.push({ pts: [[200, 410], [326, 410]], kind: 'sync', label: 'HTTPS + JWT', lx: 262, ly: 396, n: 2, nx: 214, ny: 396 });
  edges.push({ pts: [[200, 430], [232, 430], [232, 190]], kind: 'sync', noArrow: true });
  edges.push({ pts: [[356, 372], [356, 218]], kind: 'ctrl', label: 'valida JWT', lx: 400, ly: 330 });

  // microservicios
  const ms = [
    { num: 1, name: 'Pacientes', lam: 'crearPaciente · obtenerPaciente\nactualizarPaciente · listarSeguros', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 2, name: 'Citas', lam: 'crearCita · cancelarCita\nlistarCitas* · listarMedicos', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 3, name: 'Historia clínica', lam: 'registrarConsulta · emitirReceta\nverHistoria · verReceta', db: 'aurora', dbl: 'Aurora Sv.' },
    { num: 4, name: 'Laboratorio', lam: 'solicitarExamen · subirResultado\nverResultados', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 5, name: 'Farmacia', lam: 'descontarStock · consultarStock\nlistarMedicamentos', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 6, name: 'Hospitalización', lam: 'ingresarPaciente · darAlta\nlistarCamasDisponibles', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 7, name: 'Facturación y pagos', lam: 'generarFactura · registrarPago\nconsultarFactura', db: 'aurora', dbl: 'Aurora Sv.' },
    { num: 9, name: 'Auditoría (transversal)', lam: 'registrarAuditoria\n(toda lectura/escritura clínica)', db: 'dynamodb', dbl: 'DynamoDB' },
  ];
  ms.forEach((m, i) => {
    const b = msBox({ x: X, y: rowY(i), w: W, h: H, num: m.num, name: m.name, lambdas: m.lam, db: m.db, dbLabel: m.dbl });
    groups.push(...b.groups); nodes.push(...b.nodes);
    b.notes.forEach(n => { n.t = m.lam; notes.push(n); });
  });
  // tronco sincrónico API GW → microservicios
  edges.push({ pts: [[386, 410], [482, 410]], kind: 'sync', noArrow: true, label: 'invoca (S)', lx: 436, ly: 396 });
  edges.push({ pts: [[482, mid(0)], [482, mid(7)]], kind: 'sync', noArrow: true });
  ms.forEach((m, i) => edges.push({ pts: [[482, mid(i)], [X, mid(i)]], kind: 'sync' }));
  // Lab: S3 dentro de la caja
  marks.push({ x: X + W - 70, y: rowY(3) + 30, n: 3 });
  nodes.push({ id: 's3lab', x: X + W - 98, y: rowY(3) + 46, size: 30, icon: 's3', label: 'S3', fs: 10 });

  // ---- mensajería (derecha) ----
  nodes.push({ id: 'eb', x: 1010, y: 130, icon: 'eventbridge', label: 'EventBridge', sub: 'bus clinica-bus\nreglas por tipo', badge: '' });
  nodes.push({ id: 'sqsrep', x: 1240, y: 130, icon: 'sqs', label: 'SQS reposicion', badge: 'DLQ' });
  nodes.push({ id: 'lamrep', x: 1340, y: 130, icon: 'lambda', size: 40, label: 'crearSolicitud\nReposicion' });
  nodes.push({ id: 'ddbrep', x: 1440, y: 130, icon: 'dynamodb', size: 40, label: 'reposiciones' });
  nodes.push({ id: 'snsfar', x: 1130, y: 235, icon: 'sns', label: 'SNS alertas-farmacia' });
  nodes.push({ id: 'mailfar', x: 1440, y: 235, icon: 'email', size: 38, label: 'Correo a farmacia' });
  // flujo laboratorio
  nodes.push({ id: 'lammeta', x: 1010, y: 370, icon: 'lambda', size: 42, label: 'registrarMetadata', sub: 'trigger S3' });
  nodes.push({ id: 'snsnot', x: 1130, y: 440, icon: 'sns', label: 'SNS\nnotificaciones', sub: 'filtro tipo=…' });
  nodes.push({ id: 'qmail', x: 1250, y: 345, icon: 'sqs', size: 42, label: 'email', badge: 'DLQ' });
  nodes.push({ id: 'qsms', x: 1250, y: 440, icon: 'sqs', size: 42, label: 'sms', badge: 'DLQ' });
  nodes.push({ id: 'qmed', x: 1250, y: 535, icon: 'sqs', size: 42, label: 'médico', badge: 'DLQ' });
  nodes.push({ id: 'lmail', x: 1340, y: 345, icon: 'lambda', size: 36, label: 'enviarCorreo' });
  nodes.push({ id: 'lsms', x: 1340, y: 440, icon: 'lambda', size: 36, label: 'enviarSMS' });
  nodes.push({ id: 'lmed', x: 1340, y: 535, icon: 'lambda', size: 36, label: 'notificarMédico' });
  nodes.push({ id: 'ses', x: 1440, y: 345, icon: 'ses', size: 42, label: 'SES', sub: 'correo' });
  nodes.push({ id: 'snssms', x: 1440, y: 440, icon: 'sns', size: 42, label: 'SNS SMS' });
  groups.push({ x: 1182, y: 292, w: 304, h: 296, tone: 'purple', dash: true, label: '8 · Notificaciones (consume colas)', fs: 12 });
  // reglas programadas
  nodes.push({ id: 'cron', x: 1010, y: 640, icon: 'eventbridge', label: 'EventBridge', sub: 'rate(1 hour) · cron 23:00' });
  nodes.push({ id: 'lamrec', x: 1130, y: 570, icon: 'lambda', size: 38, label: 'programar\nRecordatorios' });
  nodes.push({ id: 'lamrep2', x: 1130, y: 670, icon: 'lambda', size: 38, label: 'generarReporte', sub: '23:00 Lima = 04:00 UTC' });
  nodes.push({ id: 's3rep', x: 1260, y: 670, icon: 's3', size: 38, label: 'S3 reportes' });
  nodes.push({ id: 'snsadm', x: 1380, y: 670, icon: 'sns', size: 38, label: 'SNS admin' });

  // aristas async
  const AX = 912;
  edges.push({ pts: [[X + W, mid(1)], [AX, mid(1)]], kind: 'async', noArrow: true, label: 'CitaCreada', lx: 898, ly: mid(1) - 14 });
  edges.push({ pts: [[X + W, mid(4)], [AX, mid(4)]], kind: 'async', noArrow: true, label: 'StockCritico', lx: 898, ly: mid(4) - 14 });
  edges.push({ pts: [[X + W, mid(6)], [AX, mid(6)]], kind: 'async', noArrow: true, label: 'FacturaPagada', lx: 898, ly: mid(6) - 14 });
  edges.push({ pts: [[AX, mid(1)], [AX, 130], [980, 130]], kind: 'async' });
  edges.push({ pts: [[AX, mid(6)], [AX, mid(1)]], kind: 'async', noArrow: true });
  // Lab → S3 (URL prefirmada) y S3 → registrarMetadata
  edges.push({ pts: [[X + W - 98 + 17, rowY(3) + 50], [X + W - 98 + 17, rowY(3) + 66]], kind: 'data', noArrow: true });
  edges.push({ pts: [[X + W - 98, rowY(3) + 31], [X + W - 98, rowY(3) + 14], [AX + 50, rowY(3) + 14], [AX + 50, 370], [976, 370]], kind: 'async', label: 'ObjectCreated', n: 4, nx: AX + 50, ny: 330, lx: AX + 50, ly: 300 });
  edges.push({ from: 'lammeta', to: 'snsnot', route: 'vh', kind: 'async', label: 'publica', n: 5, nx: 1036, ny: 432, lx: 1075, ly: 456 });
  // EventBridge → colas
  edges.push({ from: 'eb', to: 'sqsrep', route: 'h', kind: 'async', label: 'regla StockCritico', lx: 1128, ly: 116 });
  edges.push({ pts: [[1040, 142], [1075, 142], [1075, 235], [1100, 235]], kind: 'async' });
  edges.push({ from: 'sqsrep', to: 'lamrep', route: 'h', kind: 'async' });
  edges.push({ from: 'lamrep', to: 'ddbrep', route: 'h', kind: 'data' });
  edges.push({ from: 'snsfar', to: 'mailfar', route: 'h', kind: 'async', label: 'correo', lx: 1280, ly: 221 });
  // SNS → 3 colas
  edges.push({ pts: [[1160, 440], [1190, 440], [1190, 345], [1226, 345]], kind: 'async' });
  edges.push({ pts: [[1160, 440], [1226, 440]], kind: 'async', label: 'fan-out', n: 6, nx: 1172, ny: 424, lx: 1196, ly: 456 });
  edges.push({ pts: [[1160, 440], [1190, 440], [1190, 535], [1226, 535]], kind: 'async' });
  edges.push({ from: 'qmail', to: 'lmail', route: 'h', kind: 'async' });
  edges.push({ from: 'qsms', to: 'lsms', route: 'h', kind: 'async', label: 'consume', lx: 1295, ly: 456 });
  edges.push({ from: 'qmed', to: 'lmed', route: 'h', kind: 'async' });
  edges.push({ from: 'lmail', to: 'ses', route: 'h', kind: 'sync' });
  edges.push({ from: 'lsms', to: 'snssms', route: 'h', kind: 'sync', n: 7, nx: 1393, ny: 426 });
  edges.push({ pts: [[1358, 535], [1400, 535], [1400, 380], [1415, 380]], kind: 'sync' });
  // cron
  edges.push({ pts: [[1010, 602], [1010, 585], [1090, 585], [1090, 570], [1108, 570]], kind: 'async' });
  edges.push({ pts: [[1010, 602], [1010, 585], [1090, 585], [1090, 670], [1108, 670]], kind: 'async' });
  edges.push({ pts: [[1130, 532], [1130, 470]], kind: 'async', label: 'RecordatorioCita', lx: 1130, ly: 505 });
  edges.push({ from: 'lamrep2', to: 's3rep', route: 'h', kind: 'data' });
  edges.push({ from: 's3rep', to: 'snsadm', route: 'h', kind: 'async' });
  // DLQ / alarma
  notes.push({ x: 1190, y: 612, t: 'DLQ + alarma CloudWatch → reproceso', fs: 10.5, fill: '#a02020', weight: 700 });

  // transversal
  groups.push({ x: 12, y: 818, w: 1478, h: 84, tone: 'purple', label: 'Transversales (todos los microservicios)', fs: 12 });
  const T = (id, x, icon, label, sub) => nodes.push({ id, x, y: 858, icon, size: 34, label, sub, fs: 11, sfs: 9.5 });
  T('cw', 140, 'cloudwatch', 'CloudWatch', 'logs · métricas · alarmas');
  T('kms', 350, 'kms', 'KMS', 'cifrado S3 / BD');
  T('sec', 540, 'secrets', 'Secrets Manager', 'credenciales Aurora');
  T('ct', 760, 'cloudtrail', 'CloudTrail', 'auditoría de la API');
  T('iam', 960, 'iam', 'IAM', 'mínimo privilegio / Lambda');
  T('x', 1190, 'xray', 'X-Ray', 'trazas (opcional)');
  return { w: 1500, h: 912, groups, nodes, notes, edges, pills, marks };
}

// ======================= DATOS =======================
export default {
  id: '01', slug: 'clinica',
  title: 'Clínica Hospital San Gabriel — Plataforma Clínica Multisede',
  pattern: 'Microservicios por dominio · SNS→SQS→DLQ · EventBridge',
  kicker: 'CASO 01 · EXAMEN SIMULADO (TU "EXAMEN FINAL.PDF")',
  svc: ['Amplify', 'Cognito', 'API Gateway', 'Lambda', 'DynamoDB', 'Aurora Serverless', 'S3', 'EventBridge', 'SNS + SQS + DLQ', 'SES'],
  problema: 'Hospital privado con 3 sedes (Lima, Arequipa, Trujillo) que opera con un monolito en un servidor local. Caídas en horas pico, citas solo en horario de recepción, resultados de laboratorio en papel, sin recordatorios ni alertas de stock y costos fijos aunque la demanda varía. Debe migrar a una arquitectura 100 % serverless con portal de pacientes, panel del personal, procesamiento asíncrono y cumplimiento de la Ley 29733 (datos de salud = datos sensibles).',
  reqs: ['5 000 citas/día · picos 10×', 'Disponibilidad 99,9 %', 'Archivos hasta 50 MB (PDF / rayos X)', 'Recordatorio 24 h antes: correo + SMS', 'Todo acceso clínico auditado', 'Sin EC2 ni contenedores'],
  detectar: [
    ['“pacientes”, “seguros”', 'Pacientes', 'DynamoDB', 'Acceso por id_paciente / DNI; sin joins'],
    ['“citas”, “médicos”, “especialidades”, “sedes”', 'Citas', 'DynamoDB', 'Agenda con picos 10×: acceso por paciente, médico+fecha, sede+fecha'],
    ['“historias clínicas”, “consultas”, “recetas”, “detalle”', 'Historia clínica', 'Aurora Serverless', 'Muy relacional + transacción receta + detalle'],
    ['“exámenes”, “resultados”, “50 MB”', 'Laboratorio', 'DynamoDB + S3', 'Metadatos en tabla; archivo en S3 (solo la clave en BD)'],
    ['“medicamentos”, “inventario”, “stock mínimo”', 'Farmacia', 'DynamoDB', 'Actualización atómica por (sede, medicamento) + evento'],
    ['“camas”, “hospitalización”, “ingreso/alta”', 'Hospitalización', 'DynamoDB', 'Acceso por sede y por paciente (GSI)'],
    ['“facturas”, “pagos”', 'Facturación y pagos', 'Aurora Serverless', 'ACID: suma de pagos ≤ total, reportes contables'],
    ['“recordatorios”, “alertas”, “correo y SMS”', 'Notificaciones', 'sin BD (bitácora opcional)', 'Solo consume eventos de las colas'],
    ['“auditado”, tabla `usuarios`', 'Auditoría + Cognito', 'DynamoDB append-only', 'usuarios/contraseñas → Cognito; auditoria → tabla + CloudTrail'],
  ],
  ms: [
    {
      n: 1, name: 'Pacientes', icon: 'dynamodb', db: 'DynamoDB (PK id_paciente · GSI dni)', tablas: 'pacientes, seguros',
      resp: 'Registro, consulta y actualización de datos del paciente y de su seguro.',
      eps: [
        { m: 'POST', p: '/pacientes', l: 'crearPaciente', who: 'recepcion · pacientes', st: 201,
          in: { nombre: 'Ana', apellido: 'Pérez', dni: '45871236', correo: 'ana@mail.com', telefono: '987654321', direccion: 'Av. Lima 123', fecha_nacimiento: '1994-05-12', id_seguro: 'S-02' },
          out: { id_paciente: 'P-000123', mensaje: 'Paciente registrado' }, errs: '400 datos inválidos · 409 DNI ya registrado' },
        { m: 'GET', p: '/pacientes/{id_paciente}', l: 'obtenerPaciente', who: 'paciente (el suyo) · personal', q: 'path id_paciente', st: 200,
          out: { id_paciente: 'P-000123', nombre: 'Ana', apellido: 'Pérez', dni: '45871236', id_seguro: 'S-02', telefono: '987654321' },
          errs: '403 no es su id · 404 no existe', note: 'Si es paciente, la Lambda ignora la ruta y usa el claim custom:id_paciente' },
        { m: 'PATCH', p: '/pacientes/{id_paciente}', l: 'actualizarPaciente', who: 'paciente · recepcion', inS: 'telefono, direccion, correo', outS: '200 {actualizado: true}' , card: false },
        { m: 'GET', p: '/pacientes?dni=45871236', l: 'buscarPorDni', who: 'recepcion · administradores', inS: 'query dni (GSI)', outS: '200 [{id_paciente, nombre, …}]', card: false },
        { m: 'GET', p: '/seguros', l: 'listarSeguros', who: 'todos', inS: '—', outS: '200 [{id_seguro, nombre_aseguradora, cobertura}]', card: false },
      ],
    },
    {
      n: 2, name: 'Citas', icon: 'dynamodb', db: 'DynamoDB (PK id_paciente · SK fecha_hora#id_cita · GSI medico, sede)', tablas: 'citas, médicos, especialidades, sedes',
      resp: 'Agenda 24/7: reserva, reprogramación, cancelación y catálogo de médicos/horarios por sede.',
      eps: [
        { m: 'POST', p: '/citas', l: 'crearCita', who: 'pacientes · recepcion', st: 201,
          in: { id_medico: 'M-045', id_sede: 'LIMA', fecha_hora: '2026-12-01T09:30', motivo: 'Control' },
          out: { id_cita: 'C-8841', id_paciente: 'P-000123', id_medico: 'M-045', id_sede: 'LIMA', fecha_hora: '2026-12-01T09:30', estado: 'RESERVADA' },
          errs: '400 · 409 horario ocupado · 403', note: 'id_paciente sale del JWT. Escritura condicional evita doble reserva. Publica CitaCreada' },
        { m: 'GET', p: '/medicos/{id_medico}/horarios?fecha=2026-12-01', l: 'verDisponibilidad', who: 'pacientes · recepcion', q: 'path id_medico · query fecha', st: 200,
          out: { id_medico: 'M-045', fecha: '2026-12-01', horarios: [{ hora: '09:30', libre: false }, { hora: '10:00', libre: true }] }, errs: '404 médico no existe' },
        { m: 'DELETE', p: '/citas/{id_cita}', l: 'cancelarCita', who: 'pacientes · recepcion', q: 'path id_cita', st: 200,
          out: { id_cita: 'C-8841', estado: 'CANCELADA' }, errs: '404 · 409 ya atendida', note: 'Libera el horario y publica CitaCancelada' },
        { m: 'GET', p: '/citas?id_medico=M-045&fecha=2026-12-01', l: 'listarCitasPorMedico', who: 'medicos · recepcion', inS: 'query id_medico, fecha (GSI1)', outS: '200 [{id_cita, id_paciente, hora, estado}]', card: false },
        { m: 'GET', p: '/citas', l: 'listarCitasPorPaciente', who: 'pacientes (del token) · recepcion', inS: '— (paciente) · ?id_paciente= (personal)', outS: '200 [{cita}, …]', card: false },
        { m: 'PATCH', p: '/citas/{id_cita}', l: 'reprogramarCita', who: 'pacientes · recepcion', inS: '{fecha_hora}', outS: '200 {cita actualizada}', card: false },
        { m: 'GET', p: '/medicos?id_especialidad=&id_sede=', l: 'listarMedicos', who: 'todos', inS: 'query especialidad, sede', outS: '200 [{id_medico, nombre, cmp}]', card: false },
      ],
    },
    {
      n: 3, name: 'Historia clínica', icon: 'aurora', db: 'Aurora Serverless v2 (esquema historia) · RDS Proxy · Secrets Manager', tablas: 'historias_clínicas, consultas, recetas, detalle_receta',
      resp: 'Historia del paciente, consultas del médico y recetas con su detalle (transacción).',
      eps: [
        { m: 'GET', p: '/historias/{id_paciente}', l: 'verHistoria', who: 'medicos · paciente (la suya)', q: 'path id_paciente', st: 200,
          out: { id_historia: 'H-0451', id_paciente: 'P-000123', alergias: ['penicilina'], antecedentes: 'Hipertensión', consultas: [{ id_consulta: 'CO-501', fecha: '2026-11-20', diagnostico: 'Faringitis' }] },
          errs: '403 · 404', note: 'Cada lectura escribe un registro en Auditoría' },
        { m: 'POST', p: '/consultas', l: 'registrarConsulta', who: 'medicos', st: 201,
          in: { id_cita: 'C-8841', diagnostico: 'Faringitis aguda', observaciones: 'Reposo e hidratación' }, out: { id_consulta: 'CO-501', id_historia: 'H-0451' }, errs: '404 cita no existe · 409 ya tiene consulta' },
        { m: 'POST', p: '/recetas', l: 'emitirReceta', who: 'medicos', st: 201,
          in: { id_consulta: 'CO-501', indicaciones: 'Reposo 3 días', detalle: [{ id_medicamento: 'MED-10', dosis: '500 mg c/8h', duracion: '5 días' }] },
          out: { id_receta: 'R-7710', id_consulta: 'CO-501', items: 1 }, errs: '400 · 404 medicamento', note: 'Transacción ACID: receta + detalle_receta en un solo COMMIT' },
        { m: 'GET', p: '/recetas/{id_receta}', l: 'verReceta', who: 'medicos · farmacia · paciente (la suya)', inS: 'path id_receta', outS: '200 receta + detalle', card: false },
      ],
    },
    {
      n: 4, name: 'Laboratorio', icon: 'dynamodb', extraIcon: 's3', db: 'DynamoDB (metadatos) + S3 bucket privado cifrado KMS', tablas: 'exámenes_laboratorio, resultados_laboratorio',
      resp: 'Solicitud de exámenes, carga de resultados (hasta 50 MB) y entrega al paciente y al médico.',
      eps: [
        { m: 'POST', p: '/examenes', l: 'solicitarExamen', who: 'medicos', st: 201,
          in: { id_consulta: 'CO-501', tipo_examen: 'HEMOGRAMA' }, out: { id_examen: 'EX-1002', estado: 'SOLICITADO' }, errs: '400 · 404 consulta' },
        { m: 'POST', p: '/resultados/url-subida', l: 'subirResultado', who: 'laboratorio', st: 200,
          in: { id_examen: 'EX-1002', nombre_archivo: 'hemograma.pdf', content_type: 'application/pdf' },
          out: { url_subida: 'https://s3…X-Amz-Signature=…', s3_key: 'resultados/P-000123/EX-1002/hemograma.pdf', expira_en_seg: 300 },
          errs: '400 · 404 examen', note: 'El archivo NO pasa por API Gateway/Lambda: el navegador hace PUT directo a S3' },
        { m: 'GET', p: '/resultados/{id_examen}', l: 'verResultados', who: 'medicos · paciente (el suyo)', q: 'path id_examen', st: 200,
          out: { id_examen: 'EX-1002', estado: 'LISTO', fecha_resultado: '2026-11-22', url_descarga: 'https://s3…firma…', expira_en_seg: 300 }, errs: '403 · 404 aún no hay resultado' },
        { m: 'GET', p: '/examenes?id_paciente=…', l: 'listarExamenes', who: 'medicos · paciente (del token)', inS: 'query id_paciente (GSI)', outS: '200 [{id_examen, tipo, estado}]', card: false },
      ],
      nota: 'Al terminar la subida, S3 emite <code>ObjectCreated</code> y dispara la Lambda <code>registrarMetadata</code> (sin endpoint): guarda metadatos y publica <code>ResultadoDisponible</code>.',
    },
    {
      n: 5, name: 'Farmacia', icon: 'dynamodb', db: 'DynamoDB (PK id_sede · SK id_medicamento)', tablas: 'medicamentos, inventario_farmacia',
      resp: 'Catálogo de medicamentos, inventario por sede, stock crítico y reposición automática.',
      eps: [
        { m: 'POST', p: '/inventario/descontar', l: 'descontarStock', who: 'farmacia', st: 200,
          in: { id_sede: 'LIMA', id_medicamento: 'MED-10', cantidad: 5, id_receta: 'R-7710' },
          out: { id_sede: 'LIMA', id_medicamento: 'MED-10', stock_actual: 7, stock_minimo: 20, critico: true },
          errs: '400 · 404 · 409 stock insuficiente', note: 'UpdateItem con condición stock ≥ cantidad. Si baja del mínimo publica StockCritico en EventBridge' },
        { m: 'GET', p: '/inventario?id_sede=LIMA&id_medicamento=MED-10', l: 'consultarStock', who: 'farmacia · medicos', q: 'query id_sede, id_medicamento', st: 200,
          out: { id_sede: 'LIMA', id_medicamento: 'MED-10', stock_actual: 12, stock_minimo: 20 }, errs: '404' },
        { m: 'GET', p: '/medicamentos', l: 'listarMedicamentos', who: 'medicos · farmacia', inS: 'query nombre (opcional)', outS: '200 [{id_medicamento, nombre, precio, requiere_receta}]', card: false },
        { m: 'POST', p: '/inventario/reponer', l: 'registrarReposicion', who: 'farmacia', inS: '{id_sede, id_medicamento, cantidad}', outS: '200 {stock_actual}', card: false },
        { m: 'GET', p: '/reposiciones?id_sede=LIMA&estado=PENDIENTE', l: 'listarReposiciones', who: 'farmacia · administradores', inS: 'query sede, estado', outS: '200 [{id_reposicion, medicamento, cantidad}]', card: false },
      ],
    },
    {
      n: 6, name: 'Hospitalización', icon: 'dynamodb', db: 'DynamoDB (PK id_sede · SK id_cama · GSI id_paciente)', tablas: 'hospitalizaciones, camas',
      resp: 'Camas por sede, ingresos y altas; alimenta el reporte nocturno de ocupación.',
      eps: [
        { m: 'POST', p: '/hospitalizaciones', l: 'ingresarPaciente', who: 'enfermeras · recepcion', st: 201,
          in: { id_paciente: 'P-000123', id_sede: 'LIMA', id_cama: 'LIM-204' }, out: { id_hospitalizacion: 'HOS-3301', estado: 'ACTIVA', id_cama: 'LIM-204' }, errs: '409 cama ocupada' , note: 'Marca la cama disponible=false con escritura condicional'},
        { m: 'GET', p: '/camas?id_sede=LIMA&disponible=true', l: 'listarCamasDisponibles', who: 'enfermeras · recepcion', q: 'query id_sede, disponible', st: 200,
          out: [{ id_cama: 'LIM-205', tipo: 'UCI', disponible: true }, { id_cama: 'LIM-301', tipo: 'GENERAL', disponible: true }] },
        { m: 'PATCH', p: '/hospitalizaciones/{id}/alta', l: 'darAlta', who: 'medicos · enfermeras', inS: 'path id', outS: '200 {estado: "ALTA", fecha_alta}', card: false },
        { m: 'GET', p: '/hospitalizaciones?id_sede=LIMA&estado=ACTIVA', l: 'listarActivas', who: 'administradores · enfermeras', inS: 'query sede, estado', outS: '200 [{id, paciente, cama}]', card: false },
      ],
    },
    {
      n: 7, name: 'Facturación y pagos', icon: 'aurora', db: 'Aurora Serverless v2 (esquema facturación, mismo clúster)', tablas: 'facturas, pagos',
      resp: 'Facturas por cita y pagos (puede haber varios por factura) con consistencia contable.',
      eps: [
        { m: 'POST', p: '/facturas', l: 'generarFactura', who: 'recepcion · administradores', st: 201,
          in: { id_cita: 'C-8841', total: 180.0 }, out: { id_factura: 'F-2026-0912', estado: 'PENDIENTE', total: 180.0 }, errs: '409 la cita ya tiene factura' },
        { m: 'POST', p: '/facturas/{id_factura}/pagos', l: 'registrarPago', who: 'pacientes · recepcion', st: 201,
          in: { monto: 180.0, metodo_pago: 'TARJETA' }, out: { id_pago: 'PG-5530', id_factura: 'F-2026-0912', estado_factura: 'PAGADA', saldo: 0.0 }, errs: '409 excede el total · 402 pago rechazado', note: 'INSERT pago + UPDATE factura en una transacción. Publica FacturaPagada' },
        { m: 'GET', p: '/facturas?estado=PENDIENTE', l: 'listarFacturas', who: 'pacientes (del token) · recepcion', q: 'query estado', st: 200,
          out: [{ id_factura: 'F-2026-0912', fecha: '2026-12-01', total: 180.0, estado: 'PENDIENTE' }] },
        { m: 'GET', p: '/facturas/{id_factura}', l: 'consultarFactura', who: 'pacientes (la suya) · recepcion', inS: 'path id_factura', outS: '200 factura + pagos[]', card: false },
      ],
    },
    {
      n: 8, name: 'Notificaciones', icon: 'sns', extraIcon: 'ses', db: 'sin BD obligatoria (bitácora de envíos en DynamoDB, opcional)', tablas: '— (nuevo)',
      resp: 'Entrega de correo y SMS. Casi no expone endpoints: consume mensajes de colas SQS.',
      eps: [
        { m: 'PUT', p: '/notificaciones/preferencias', l: 'guardarPreferencias', who: 'pacientes', st: 200,
          in: { canales: ['EMAIL', 'SMS'], telefono: '+51987654321' }, out: { actualizado: true }, errs: '400 teléfono inválido' },
        { m: 'GET', p: '/notificaciones', l: 'listarNotificaciones', who: 'pacientes (del token)', inS: '—', outS: '200 [{tipo, canal, fecha, estado}]', card: false },
      ],
      nota: 'Disparadores (sin API): <code>SQS email</code> → <code>enviarCorreo</code> (SES) · <code>SQS sms</code> → <code>enviarSMS</code> (SNS SMS) · <code>SQS médico</code> → <code>notificarMédico</code>. Cada cola tiene su DLQ.',
    },
  ],
  eventos: [
    { name: 'ResultadoDisponible', via: 'SNS notificaciones (atributo tipo=RESULTADO) → 3 colas', json: { id_examen: 'EX-1002', id_paciente: 'P-000123', id_medico: 'M-045', s3_key: 'resultados/P-000123/EX-1002/hemograma.pdf' } },
    { name: 'StockCritico', via: 'EventBridge bus (regla detail-type) → SQS reposicion + SNS farmacia', json: { source: 'clinica.farmacia', 'detail-type': 'StockCritico', detail: { id_sede: 'LIMA', id_medicamento: 'MED-10', stock_actual: 7, stock_minimo: 20 } } },
    { name: 'RecordatorioCita', via: 'Regla rate(1 hour) → programarRecordatorios → SNS (tipo=RECORDATORIO)', json: { id_cita: 'C-8841', id_paciente: 'P-000123', fecha_hora: '2026-12-01T09:30', canales: ['EMAIL', 'SMS'] } },
  ],
  flujos: [
    { t: 'A · Resultado de laboratorio disponible (pasos numerados 1–7 en el diagrama)', steps: [
      ['Amplify → Cognito', 'El personal de laboratorio inicia sesión (grupo `laboratorio`) y recibe los tokens JWT.'],
      ['API Gateway → Lambda `subirResultado`', 'El authorizer de Cognito valida el JWT (síncrono) y la Lambda devuelve una **URL prefirmada** de S3.'],
      ['S3', 'El navegador hace PUT del PDF / rayos X (≤ 50 MB) directo al bucket cifrado: el archivo no pasa por API Gateway.'],
      ['S3 → Lambda `registrarMetadata`', '`ObjectCreated` dispara la Lambda (asíncrono): lee `key`, `size`, `bucket` y guarda los metadatos en DynamoDB.'],
      ['Lambda → SNS `notificaciones`', 'Publica `ResultadoDisponible` con atributo `tipo=RESULTADO` (un evento, varios destinatarios).'],
      ['SNS → 3 colas SQS → Lambdas', 'Fan-out a `email`, `sms` y `médico`; cada cola tiene su DLQ y su Lambda consumidora (`enviarCorreo`, `enviarSMS`, `notificarMédico`).'],
      ['SES y SNS SMS', 'Entregan el correo y el SMS. Si el SMS falla, el mensaje reaparece, se reintenta y tras N recepciones va a la DLQ con alarma de CloudWatch → no se pierde, y los otros canales no se afectan.'],
    ] },
    { t: 'B · Stock crítico → alerta + reposición automática', steps: [
      ['Lambda `descontarStock`', 'Actualiza el inventario con condición; si `stock_actual < stock_minimo` publica `StockCritico` en el bus de EventBridge.'],
      ['EventBridge (regla por `detail-type`)', 'Dos destinos: SNS `alertas-farmacia` (correo a farmacia de la sede) y SQS `reposicion`.'],
      ['SQS `reposicion` + DLQ → `crearSolicitudReposicion`', 'Crea la solicitud en la tabla `reposiciones`; la cola evita perderla si hay errores.'],
    ] },
    { t: 'C · Recordatorio 24 h antes y reporte de las 11:00 p. m.', steps: [
      ['EventBridge `rate(1 hour)`', 'Invoca `programarRecordatorios`: consulta el GSI de citas entre ahora+24 h y ahora+25 h y publica `RecordatorioCita` (SNS → correo + SMS).'],
      ['EventBridge `cron(0 4 * * ? *)`', '23:00 en Lima = 04:00 UTC (las reglas usan UTC). Invoca `generarReporte` (una por sede).'],
      ['Lambda → S3 reportes → SNS admin', 'Consolida ocupación de camas (Hospitalización) y consumo de medicamentos (Farmacia), guarda el reporte y avisa a administración.'],
    ] },
  ],
  seguridad: {
    grupos: ['pacientes', 'medicos', 'enfermeras', 'recepcion', 'farmacia', 'laboratorio', 'administradores'],
    matriz: {
      cols: ['pacientes', 'medicos', 'enferm.', 'recepc.', 'farmac.', 'lab.', 'admin'],
      rows: [
        ['Citas (crear / ver / cancelar)', [1, 0, 0, 1, 0, 0, 1]],
        ['Historia clínica y recetas', ['s', 1, 0, 0, 0, 0, 0]],
        ['Resultados de laboratorio', ['s', 1, 0, 0, 0, 1, 0]],
        ['Inventario y reposición', [0, 'v', 0, 0, 1, 0, 1]],
        ['Camas y hospitalización', [0, 1, 1, 1, 0, 0, 1]],
        ['Facturas y pagos', ['s', 0, 0, 1, 0, 0, 1]],
      ],
    },
    puntos: [
      '**Dos User Pools** (alternativa defendible): pacientes con auto-registro y personal creado por admin con MFA; el grupo viaja en `cognito:groups`.',
      '**Authorizer Cognito** en cada método de API Gateway: sin JWT válido → 401; sin grupo permitido → 403 (lo valida la Lambda).',
      '**Paciente solo ve lo suyo**: la Lambda ignora el id de la URL y usa `claims["custom:id_paciente"]` (en REST: `event.requestContext.authorizer.claims`).',
      '**Datos sensibles (Ley 29733)**: KMS en S3/DynamoDB/Aurora, TLS, bucket privado con URL prefirmada de corta vida, auditoría (tabla + CloudTrail), Secrets Manager para Aurora, rol IAM mínimo por Lambda.',
    ],
  },
  conceptos: [
    ['Serverless vs EC2', 'Serverless: no administras servidores y pagas por uso (invocaciones y GB-segundo; por solicitud en API Gateway/DynamoDB on-demand). EC2 bajo demanda: pagas por tiempo encendido, tengas o no tráfico, y administras SO y escalado. Con picos 10× el costo fijo se evita.'],
    ['Cold start', 'Retraso al invocar una Lambda inactiva (descarga código + crea entorno + init). Afecta al primer paciente que reserva el lunes. Mitigación: Provisioned Concurrency en `crearCita`, ping con EventBridge, más memoria y dependencias en Layers.'],
    ['SQS vs SNS vs EventBridge', 'SQS = cola confiable con reintentos y DLQ (un consumidor). SNS = fan-out a muchos destinatarios/personas. EventBridge = ruteo por reglas de contenido y programación (cron/rate).'],
  ],
  diagrama,
  figura: 'Figura 1.1 — Arquitectura serverless completa de la clínica: 8 microservicios con BD propia, mensajería asíncrona con DLQ y tareas programadas.',
};
