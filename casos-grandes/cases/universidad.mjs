import { base } from '../lib/layout.mjs';

function diagrama() {
  const ms = [
    { num: 1, name: 'Alumnos y docentes', lam: 'crearAlumno · obtenerAlumno\nlistarAlumnos · crearDocente', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 2, name: 'Cursos y matrícula', lam: 'listarCursos · matricular\nretirarCurso · misMatriculas', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 3, name: 'Tareas y entregas', lam: 'crearTarea · subirEntrega\nlistarEntregas', db: 'dynamodb', dbl: 'DynamoDB', extra: { icon: 's3', label: 'S3' } },
    { num: 4, name: 'Calificaciones', lam: 'calificar · misNotas\nactaDeNotas', db: 'aurora', dbl: 'Aurora Sv.' },
    { num: 5, name: 'Pensiones y pagos', lam: 'generarPensiones · pagar\nmisPensiones · deudores', db: 'aurora', dbl: 'Aurora Sv.' },
    { num: 6, name: 'Reportes académicos', lam: 'solicitarReporte · estadoReporte\n(encola en SQS)', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 7, name: 'Anuncios y foros', lam: 'publicarAnuncio · listarAnuncios\ncomentar', db: 'dynamodb', dbl: 'DynamoDB' },
  ];
  const b = base({
    ms, rightLabel: '4 · Eventos académicos (SNS con filtro tenant_id), colas y tareas programadas',
    actors: [
      { icon: 'users', label: 'Alumnos', sub: 'varias universidades', frontSub: 'Portal alumno' },
      { icon: 'user', label: 'Docentes y\nadministración', sub: 'por universidad', frontSub: 'Portal docente' },
    ],
    idpSub: 'User Pool único\ncustom:tenant_id + grupos',
    transversals: [['cloudwatch', 'CloudWatch', 'logs · alarmas DLQ'], ['kms', 'KMS', 'cifrado S3 / BD'], ['secrets', 'Secrets Manager', 'credenciales Aurora'], ['iam', 'IAM', 'mínimo privilegio'], ['cloudtrail', 'CloudTrail', 'auditoría']],
  });
  const { groups, nodes, notes, edges, marks, mid, rowY, X, W, AX } = b;
  const pills = [];

  // --- flujo de entrega de tarea ---
  const sx = X + W - 112, sy = rowY(2) + 46;
  marks.push({ x: sx + 22, y: sy - 16, n: 3 });
  edges.push({ pts: [[sx, sy - 15], [sx, rowY(2) + 12], [AX + 24, rowY(2) + 12], [AX + 24, 265], [980, 265]], kind: 'async', label: 'ObjectCreated', n: 4, nx: AX + 24, ny: 240, lx: AX + 24, ly: 205 });
  nodes.push({ id: 'lent', x: 1010, y: 265, icon: 'lambda', size: 40, label: 'registrar\nEntrega', sub: 'trigger S3' });
  nodes.push({ id: 'snse', x: 1140, y: 265, icon: 'sns', size: 46, label: 'SNS eventos', sub: 'tenant_id · tipo' });
  edges.push({ pts: [[1042, 265], [1114, 265]], kind: 'async', label: 'publica', n: 5, nx: 1058, ny: 286, lx: 1078, ly: 251 });
  // alumnos / anuncios publican eventos al mismo tema
  edges.push({ pts: [[X + W, mid(0)], [AX - 6, mid(0)], [AX - 6, 168], [1140, 168], [1140, 236]], kind: 'async', label: 'AlumnoCreado · AnuncioPublicado', lx: 1040, ly: 168 });
  edges.push({ pts: [[X + W, mid(6)], [AX - 6, mid(6)], [AX - 6, mid(0)]], kind: 'async', noArrow: true });

  nodes.push({ id: 'q1', x: 1272, y: 190, icon: 'sqs', size: 40, label: 'email', badge: 'DLQ' });
  nodes.push({ id: 'q2', x: 1272, y: 340, icon: 'sqs', size: 40, label: 'lms', badge: 'DLQ' });
  nodes.push({ id: 'l1', x: 1352, y: 190, icon: 'lambda', size: 34, label: 'enviarCorreo' });
  nodes.push({ id: 'l2', x: 1352, y: 340, icon: 'lambda', size: 34, label: 'sincronizarLMS' });
  nodes.push({ id: 'ses', x: 1444, y: 190, icon: 'ses', size: 40, label: 'SES', sub: 'docente / alumno' });
  nodes.push({ id: 'lms', x: 1444, y: 340, icon: 'internet', size: 40, label: 'Canvas (LMS)', sub: 'API externa' });
  groups.push({ x: 1222, y: 140, w: 264, h: 258, tone: 'purple', dash: true, label: '8 · Notificaciones + integraciones', fs: 12 });
  edges.push({ pts: [[1166, 265], [1198, 265], [1198, 190], [1250, 190]], kind: 'async', label: 'tipo=ENTREGA', lx: 1212, ly: 232 });
  edges.push({ pts: [[1166, 265], [1198, 265], [1198, 340], [1250, 340]], kind: 'async', label: 'tipo=ALUMNO', lx: 1212, ly: 306 });
  marks.push({ x: 1203, y: 252, n: 6 });
  edges.push({ from: 'q1', to: 'l1', route: 'h', kind: 'async' });
  edges.push({ from: 'q2', to: 'l2', route: 'h', kind: 'async' });
  edges.push({ from: 'l1', to: 'ses', route: 'h', kind: 'sync', n: 7, nx: 1398, ny: 174 });
  edges.push({ from: 'l2', to: 'lms', route: 'h', kind: 'sync' });
  notes.push({ x: 1232, y: 392, t: 'DLQ + alarma CloudWatch', fs: 10, weight: 700, fill: '#a02020' });

  // --- reportes asíncronos ---
  nodes.push({ id: 'qrep', x: 1010, y: 500, icon: 'sqs', size: 42, label: 'SQS reportes', badge: 'DLQ' });
  nodes.push({ id: 'lrep', x: 1130, y: 500, icon: 'lambda', size: 38, label: 'generarReporte', sub: 'lee Aurora' });
  nodes.push({ id: 's3rep', x: 1250, y: 500, icon: 's3', size: 38, label: 'S3 reportes', sub: 'PDF · URL prefirmada' });
  edges.push({ pts: [[X + W, mid(5)], [AX, mid(5)], [AX, 500], [982, 500]], kind: 'async', label: 'SolicitudReporte', lx: AX, ly: 538 });
  edges.push({ from: 'qrep', to: 'lrep', route: 'h', kind: 'async' });
  edges.push({ from: 'lrep', to: 's3rep', route: 'h', kind: 'data' });
  edges.push({ pts: [[1130, 462], [1130, 440], [1178, 440]], kind: 'ctrl', noArrow: true });
  notes.push({ x: 1182, y: 444, t: 'avisa por SNS (tipo=REPORTE)', fs: 10, weight: 600, fill: '#7b3fb0' });

  // --- recordatorios programados ---
  nodes.push({ id: 'eb', x: 1010, y: 640, icon: 'eventbridge', size: 46, label: 'EventBridge', sub: 'cron 08:00 Lima = 13:00 UTC' });
  nodes.push({ id: 'lrec', x: 1140, y: 640, icon: 'lambda', size: 38, label: 'recordarEntregas', sub: 'GSI fecha_limite' });
  nodes.push({ id: 'snsr', x: 1280, y: 640, icon: 'sns', size: 38, label: 'SNS recordatorios' });
  nodes.push({ id: 'ses2', x: 1410, y: 640, icon: 'ses', size: 38, label: 'SES', sub: 'alumnos' });
  edges.push({ from: 'eb', to: 'lrec', route: 'h', kind: 'async' });
  edges.push({ from: 'lrec', to: 'snsr', route: 'h', kind: 'async' });
  edges.push({ from: 'snsr', to: 'ses2', route: 'h', kind: 'async' });

  return { w: 1500, h: b.height, groups, nodes, notes, edges, pills, marks };
}

export default {
  id: '03', slug: 'universidad',
  title: 'Campus Virtual UniNet — SaaS Multi-universidad',
  pattern: 'Multi-tenant (tenant_id) · S3 → Lambda → SNS con filtros · SQS',
  kicker: 'CASO 03 · SAAS MULTI-TENANT · EDUCACIÓN',
  svc: ['Amplify', 'Cognito (custom:tenant_id)', 'API Gateway', 'Lambda', 'DynamoDB', 'Aurora Serverless', 'S3', 'SNS (filtro)', 'SQS + DLQ', 'EventBridge', 'SES'],
  problema: 'UniNet es un SaaS usado por varias universidades (UTEC, UPC, PUCP…). Cada universidad es un tenant con sus alumnos, cursos y notas aislados de las demás. Los alumnos se matriculan, descargan material y suben tareas (PDF de hasta 100 MB); los docentes califican, publican anuncios y piden reportes; administración gestiona pensiones. Cada entrega debe avisar al docente, y cada alta de alumno debe sincronizarse con el LMS externo. Todo serverless.',
  reqs: ['Aislamiento por universidad (tenant)', 'Matrícula con cupos y concurrencia', 'Entregas de hasta 100 MB', 'Notas con JOIN y promedios', 'Reportes pesados en segundo plano', 'Recordatorio diario de tareas'],
  detectar: [
    ['“alumnos”, “docentes”', 'Alumnos y docentes', 'DynamoDB', 'PK tenant_id#id; patrón 1 de multi-tenancy (columna tenant)'],
    ['“cursos”, “matrícula”, “cupos”', 'Cursos y matrícula', 'DynamoDB', 'Acceso por alumno y por curso (GSI); cupos con escritura condicional'],
    ['“tareas”, “entregas de 100 MB”', 'Tareas y entregas', 'DynamoDB + S3', 'Archivo en S3; metadatos por curso/tarea/alumno'],
    ['“notas”, “actas”, “promedios”', 'Calificaciones', 'Aurora Serverless', 'JOIN y agregaciones; esquema por universidad (patrón 2)'],
    ['“pensiones”, “pagos”, “deudores”', 'Pensiones y pagos', 'Aurora Serverless', 'Transacciones ACID y morosidad'],
    ['“reportes pesados”', 'Reportes académicos', 'DynamoDB + SQS + S3', 'Se encola, se genera en segundo plano y se descarga por URL'],
    ['“anuncios”, “foros”', 'Anuncios y foros', 'DynamoDB', 'Lecturas por curso; publica evento para avisar'],
    ['“avisar”, “sincronizar con el LMS”', 'Notificaciones e integraciones', 'sin BD', 'Colas por consumidor con filtro tenant_id'],
  ],
  ms: [
    {
      n: 1, name: 'Alumnos y docentes', icon: 'dynamodb', db: 'DynamoDB (PK tenant_id · SK alumno_id) — patrón 1', tablas: 'alumnos, docentes',
      resp: 'Alta, consulta y baja de alumnos y docentes de cada universidad.',
      eps: [
        { m: 'POST', p: '/alumnos', l: 'crearAlumno', who: 'admin_tenant', st: 201,
          in: { codigo: 'U202110456', nombre: 'Camila', apellido: 'Rojas', correo: 'camila.rojas@utec.edu.pe', carrera: 'SISTEMAS', ciclo: 5 },
          out: { tenant_id: 'UTEC', id_alumno: 'A-2026-0412', estado: 'ACTIVO' }, errs: '400 · 409 código duplicado', note: 'tenant_id sale del claim custom:tenant_id, no del body. Publica AlumnoCreado' },
        { m: 'GET', p: '/alumnos?carrera=SISTEMAS&ciclo=5&limite=25', l: 'listarAlumnos', who: 'docentes · admin_tenant', q: 'query carrera, ciclo, limite', st: 200,
          out: { items: [{ id_alumno: 'A-2026-0412', nombre: 'Camila Rojas', carrera: 'SISTEMAS', ciclo: 5 }], siguiente_token: null }, note: 'Query con KeyCondition tenant_id = claim: nunca cruza universidades' },
        { m: 'GET', p: '/alumnos/{id_alumno}', l: 'obtenerAlumno', who: 'alumnos (el suyo) · docentes · admin', inS: 'path id_alumno', outS: '200 alumno', card: false },
        { m: 'PATCH', p: '/alumnos/{id_alumno}', l: 'modificarAlumno', who: 'admin_tenant · alumnos (contacto)', inS: '{correo, ciclo, estado}', outS: '200 alumno', card: false },
        { m: 'DELETE', p: '/alumnos/{id_alumno}', l: 'retirarAlumno', who: 'admin_tenant', inS: 'path id', outS: '200 {estado: "RETIRADO"}', card: false },
        { m: 'POST', p: '/docentes', l: 'crearDocente', who: 'admin_tenant', inS: '{nombre, correo, departamento}', outS: '201 {id_docente}', card: false },
      ],
    },
    {
      n: 2, name: 'Cursos y matrícula', icon: 'dynamodb', db: 'DynamoDB (PK tenant#curso · SK seccion · GSI alumno → matrículas)', tablas: 'cursos, secciones, matrículas',
      resp: 'Oferta de cursos por ciclo y matrícula con control de cupos y cruce de horarios.',
      eps: [
        { m: 'POST', p: '/matriculas', l: 'matricular', who: 'alumnos', st: 201,
          in: { id_curso: 'CS2031', seccion: '1', ciclo: '2026-2' }, out: { id_matricula: 'M-998120', id_curso: 'CS2031', seccion: '1', estado: 'CONFIRMADA', cupos_restantes: 7 },
          errs: '409 sin cupos · 409 cruce de horario · 403 deuda de pensión', note: 'TransactWriteItems: cupos−1 (condición cupos > 0) + put matrícula. El id_alumno sale del JWT' },
        { m: 'GET', p: '/matriculas?ciclo=2026-2', l: 'misMatriculas', who: 'alumnos (del token)', q: 'query ciclo (GSI alumno)', st: 200,
          out: [{ id_curso: 'CS2031', nombre: 'Cloud Computing', seccion: '1', creditos: 4, horario: 'LUN 08:00-10:00' }] },
        { m: 'POST', p: '/cursos', l: 'crearCurso', who: 'admin_tenant', st: 201,
          in: { codigo: 'CS2031', nombre: 'Cloud Computing', creditos: 4, id_docente: 'D-077', cupos: 35, horario: 'LUN 08:00-10:00', ciclo: '2026-2' }, out: { id_curso: 'CS2031', estado: 'ABIERTO' }, errs: '400 · 409 código existente' },
        { m: 'GET', p: '/cursos?ciclo=2026-2&carrera=SISTEMAS', l: 'listarCursos', who: 'todos los autenticados', inS: 'query ciclo, carrera', outS: '200 [{id_curso, nombre, cupos_libres}]', card: false },
        { m: 'DELETE', p: '/matriculas/{id_matricula}', l: 'retirarCurso', who: 'alumnos', inS: 'path id', outS: '200 {estado: "RETIRADO"} (+1 cupo)', card: false },
        { m: 'GET', p: '/cursos/{id_curso}/alumnos', l: 'alumnosDelCurso', who: 'docentes (del curso)', inS: 'path id_curso', outS: '200 [{id_alumno, nombre}]', card: false },
      ],
    },
    {
      n: 3, name: 'Tareas y entregas', icon: 'dynamodb', extraIcon: 's3', db: 'DynamoDB (PK tenant#curso · SK tarea#alumno) + S3 por tenant', tablas: 'tareas, entregas',
      resp: 'Docentes crean tareas; alumnos entregan archivos directo a S3; cada entrega dispara avisos.',
      eps: [
        { m: 'POST', p: '/cursos/{id_curso}/tareas', l: 'crearTarea', who: 'docentes (del curso)', st: 201,
          in: { titulo: 'Taller 2 — Eventos con SNS y SQS', descripcion: 'Implementar fan-out con DLQ', fecha_limite: '2026-12-05T23:59', puntaje: 20 },
          out: { id_tarea: 'T-310', id_curso: 'CS2031', estado: 'ABIERTA' }, errs: '400 · 403 no es docente del curso' },
        { m: 'POST', p: '/tareas/{id_tarea}/entregas/url-subida', l: 'subirEntrega', who: 'alumnos (matriculados)', st: 200,
          in: { nombre_archivo: 'taller2.pdf', content_type: 'application/pdf', tamano_bytes: 48200000 },
          out: { url_subida: 'https://s3…firma…', s3_key: 'UTEC/CS2031/T-310/A-2026-0412/taller2.pdf', expira_en_seg: 600 }, errs: '400 excede 100 MB · 403 no matriculado · 409 fuera de plazo',
          note: 'La clave codifica tenant/curso/tarea/alumno: la Lambda del trigger los lee del nombre (patrón del Taller 2, sem. 13)' },
        { m: 'GET', p: '/tareas/{id_tarea}/entregas', l: 'listarEntregas', who: 'docentes (del curso)', q: 'path id_tarea', st: 200,
          out: [{ id_alumno: 'A-2026-0412', archivo: 'taller2.pdf', tamano: 48200000, fecha: '2026-12-04T21:10', estado: 'ENTREGADA' }] },
        { m: 'GET', p: '/cursos/{id_curso}/tareas', l: 'listarTareas', who: 'alumnos · docentes', inS: 'path id_curso', outS: '200 [{id_tarea, titulo, fecha_limite}]', card: false },
        { m: 'GET', p: '/entregas/{id_entrega}/descarga', l: 'descargarEntrega', who: 'docentes · alumno dueño', inS: 'path id_entrega', outS: '200 {url_descarga, expira_en_seg}', card: false },
      ],
      nota: 'Al terminar el PUT, S3 emite <code>ObjectCreated</code> → Lambda <code>registrarEntrega</code> (sin endpoint): guarda metadatos y publica <code>EntregaRegistrada</code> en SNS con <code>tenant_id</code> y <code>tipo</code> como atributos.',
    },
    {
      n: 4, name: 'Calificaciones', icon: 'aurora', db: 'Aurora Serverless v2 — un esquema por universidad (patrón 2) + RDS Proxy', tablas: 'notas, actas, evaluaciones',
      resp: 'Notas por entrega, promedios y actas oficiales con consultas relacionales.',
      eps: [
        { m: 'POST', p: '/entregas/{id_entrega}/calificacion', l: 'calificar', who: 'docentes (del curso)', st: 200,
          in: { nota: 17.5, comentario: 'Buen uso de DLQ; falta justificar el filtro' }, out: { id_entrega: 'E-5521', nota: 17.5, estado: 'CALIFICADA' }, errs: '400 nota fuera de 0–20 · 403',
          note: 'search_path = esquema del tenant (claim). Publica NotaPublicada' },
        { m: 'GET', p: '/notas?ciclo=2026-2', l: 'misNotas', who: 'alumnos (del token)', q: 'query ciclo', st: 200,
          out: [{ id_curso: 'CS2031', curso: 'Cloud Computing', evaluaciones: [{ nombre: 'Taller 2', nota: 17.5, peso: 0.2 }], promedio_parcial: 16.8 }] },
        { m: 'GET', p: '/cursos/{id_curso}/acta', l: 'actaDeNotas', who: 'docentes · admin_tenant', q: 'path id_curso', st: 200,
          out: { id_curso: 'CS2031', alumnos: 34, promedio: 15.9, aprobados: 30, desaprobados: 4, estado: 'ABIERTA' }, note: 'JOIN + AVG + COUNT en SQL: razón principal para usar Aurora' },
        { m: 'PUT', p: '/cursos/{id_curso}/acta/cierre', l: 'cerrarActa', who: 'docentes (del curso)', inS: '{confirmar: true}', outS: '200 {estado: "CERRADA"}', card: false },
      ],
    },
    {
      n: 5, name: 'Pensiones y pagos', icon: 'aurora', db: 'Aurora Serverless v2 (esquema del tenant, mismo clúster) · Secrets Manager', tablas: 'pensiones, pagos',
      resp: 'Cuotas por ciclo, pagos y reporte de morosidad.',
      eps: [
        { m: 'GET', p: '/pensiones?ciclo=2026-2', l: 'misPensiones', who: 'alumnos (del token)', q: 'query ciclo', st: 200,
          out: [{ id_pension: 'PEN-77', cuota: 3, monto: 1350.0, vence: '2026-11-30', estado: 'PENDIENTE' }] },
        { m: 'POST', p: '/pensiones/{id_pension}/pagos', l: 'pagar', who: 'alumnos', st: 201,
          in: { monto: 1350.0, metodo_pago: 'TARJETA', token_tarjeta: 'tok_9aB…' }, out: { id_pago: 'PG-45120', estado_pension: 'PAGADA' }, errs: '409 ya pagada · 402 rechazado', note: 'INSERT pago + UPDATE pensión en una transacción' },
        { m: 'POST', p: '/pensiones/generar', l: 'generarPensiones', who: 'admin_tenant', inS: '{ciclo}', outS: '202 {alumnos_procesados}', card: false },
        { m: 'GET', p: '/pensiones/deudores?ciclo=2026-2', l: 'deudores', who: 'admin_tenant', inS: 'query ciclo', outS: '200 [{id_alumno, deuda}]', card: false },
      ],
    },
    {
      n: 6, name: 'Reportes académicos', icon: 'dynamodb', extraIcon: 'sqs', db: 'DynamoDB (estado de cada reporte) + SQS + S3', tablas: '— (nuevo)',
      resp: 'Solicitud asíncrona de reportes pesados: se encola, se genera y se entrega por URL prefirmada.',
      eps: [
        { m: 'POST', p: '/reportes', l: 'solicitarReporte', who: 'docentes · admin_tenant', st: 202,
          in: { tipo: 'RENDIMIENTO_CARRERA', parametros: { carrera: 'SISTEMAS', ciclo: '2026-2' }, formato: 'PDF' },
          out: { id_reporte: 'REP-7001', estado: 'EN_COLA' }, errs: '400 tipo desconocido', note: 'Escribe estado EN_COLA y envía el mensaje a SQS: responde de inmediato' },
        { m: 'GET', p: '/reportes/{id_reporte}', l: 'estadoReporte', who: 'quien lo solicitó', q: 'path id_reporte', st: 200,
          out: { id_reporte: 'REP-7001', estado: 'LISTO', url_descarga: 'https://s3…firma…', expira_en_seg: 900 }, errs: '404 · 403' },
      ],
    },
    {
      n: 7, name: 'Anuncios y foros', icon: 'dynamodb', db: 'DynamoDB (PK tenant#curso · SK fecha#id_anuncio)', tablas: '— (nuevo)',
      resp: 'Comunicación del docente con el curso; opcionalmente notifica por correo.',
      eps: [
        { m: 'POST', p: '/cursos/{id_curso}/anuncios', l: 'publicarAnuncio', who: 'docentes (del curso)', st: 201,
          in: { titulo: 'Cambio de aula', mensaje: 'La clase del lunes será en el B-204', notificar: true }, out: { id_anuncio: 'AN-1204', notificados: 'EN_PROCESO' }, note: 'Publica AnuncioPublicado (tipo=ANUNCIO) en SNS' },
        { m: 'GET', p: '/cursos/{id_curso}/anuncios', l: 'listarAnuncios', who: 'alumnos · docentes', inS: 'path id_curso', outS: '200 [{id_anuncio, titulo, fecha}]', card: false },
        { m: 'POST', p: '/anuncios/{id_anuncio}/comentarios', l: 'comentar', who: 'alumnos · docentes', inS: '{texto}', outS: '201 {id_comentario}', card: false },
      ],
    },
    {
      n: 8, name: 'Notificaciones e integraciones', icon: 'sns', extraIcon: 'ses', db: 'sin BD obligatoria', tablas: '— (nuevo)',
      resp: 'Correo al docente/alumno y sincronización con el LMS externo; sin endpoints públicos.',
      eps: [
        { m: 'PUT', p: '/notificaciones/preferencias', l: 'guardarPreferencias', who: 'alumnos · docentes', st: 200,
          in: { canales: ['EMAIL'], tipos: ['ENTREGA', 'NOTA', 'ANUNCIO'] }, out: { actualizado: true } },
      ],
      nota: 'Cada suscripción de SNS a su cola lleva una <b>política de filtro</b>: <code>{"tenant_id":["UTEC"],"tipo":["ENTREGA"]}</code> (claves distintas = AND). La cola necesita política de acceso que permita a SNS escribirle.',
    },
  ],
  eventos: [
    { name: 'EntregaRegistrada', via: 'SNS eventos · atributos tenant_id=UTEC, tipo=ENTREGA', json: { tenant_id: 'UTEC', id_curso: 'CS2031', id_tarea: 'T-310', id_alumno: 'A-2026-0412', s3_key: 'UTEC/CS2031/T-310/A-2026-0412/taller2.pdf', tamano: 48200000 } },
    { name: 'AlumnoCreado', via: 'SNS eventos · tipo=ALUMNO → cola lms', json: { tenant_id: 'UTEC', id_alumno: 'A-2026-0412', correo: 'camila.rojas@utec.edu.pe', carrera: 'SISTEMAS' } },
    { name: 'SolicitudReporte', via: 'SQS reportes (cuerpo del mensaje)', json: { id_reporte: 'REP-7001', tenant_id: 'UTEC', tipo: 'RENDIMIENTO_CARRERA', parametros: { carrera: 'SISTEMAS', ciclo: '2026-2' }, solicitante: 'D-077' } },
  ],
  flujos: [
    { t: 'A · Alumno entrega una tarea de 48 MB (pasos numerados 1–7)', steps: [
      ['Amplify → Cognito', 'El alumno inicia sesión; el JWT trae `custom:tenant_id=UTEC` y el grupo `alumnos`.'],
      ['API Gateway → Lambda `subirEntrega`', 'El authorizer valida el JWT; la Lambda verifica matrícula y plazo y devuelve una **URL prefirmada**.'],
      ['S3', 'El navegador sube el PDF directo a S3 (no pasa por API Gateway ni Lambda).'],
      ['S3 → Lambda `registrarEntrega`', '`ObjectCreated` dispara la Lambda: lee `key`, `size`, `bucket`, deduce `tenant/curso/tarea/alumno` del nombre y guarda metadatos en DynamoDB.'],
      ['Lambda → SNS `eventos`', 'Publica `EntregaRegistrada` con atributos `tenant_id` y `tipo=ENTREGA`.'],
      ['SNS → colas filtradas', 'La suscripción de la cola `email` solo acepta `tipo=ENTREGA`; la cola `lms` solo `tipo=ALUMNO`. Un tenant nunca recibe eventos de otro.'],
      ['SES / LMS', '`enviarCorreo` avisa al docente. Si SES falla, el mensaje reaparece y tras N recepciones va a la DLQ con alarma.'],
    ] },
    { t: 'B · Reporte pesado en segundo plano', steps: [
      ['`solicitarReporte` → SQS reportes', 'Guarda `EN_COLA` y encola el pedido; responde 202 al instante.'],
      ['SQS → `generarReporte`', 'Consume por lotes (concurrencia limitada), consulta Aurora, genera el PDF y lo guarda en S3 bajo `tenant/reportes/`.'],
      ['Aviso al solicitante', 'Marca `LISTO` y publica `ReporteListo` en SNS; el cliente consulta `GET /reportes/{id}` y descarga por URL prefirmada.'],
    ] },
    { t: 'C · Recordatorio diario de tareas por vencer', steps: [
      ['EventBridge `cron(0 13 * * ? *)`', '08:00 Lima = 13:00 UTC. Invoca `recordarEntregas`.'],
      ['`recordarEntregas` → SNS → SES', 'Consulta el GSI de tareas por `fecha_limite` (próximas 24 h) por tenant y avisa a alumnos sin entrega.'],
    ] },
  ],
  seguridad: {
    grupos: ['alumnos', 'docentes', 'admin_tenant', 'soporte'],
    matriz: {
      cols: ['alumnos', 'docentes', 'admin_tenant', 'soporte'],
      rows: [
        ['Alumnos y docentes (alta / baja)', [0, 0, 1, 0]],
        ['Matricularse', ['s', 0, 1, 0]],
        ['Subir entrega', ['s', 0, 0, 0]],
        ['Calificar / actas', [0, 's', 1, 0]],
        ['Ver notas', ['s', 's', 1, 'v']],
        ['Pensiones', ['s', 0, 1, 'v']],
        ['Reportes', [0, 1, 1, 0]],
      ],
    },
    puntos: [
      '**Un User Pool** con atributo `custom:tenant_id` (o un pool por universidad si el contrato lo exige); el grupo define el rol dentro del tenant.',
      '**Aislamiento**: `tenant_id` del JWT es la **clave de partición** en DynamoDB, el prefijo de S3 (`UTEC/…`), el `search_path` en Aurora y el filtro en SNS.',
      '**Nunca confiar en el body**: si el JSON trae `tenant_id` distinto al claim, se rechaza con 403.',
      '**Mínimo privilegio**: política IAM de la Lambda con condición sobre el prefijo S3 del tenant; KMS por bucket; CloudTrail para auditoría.',
    ],
  },
  conceptos: [
    ['Los 3 patrones multi-tenant', '1) BD y esquema compartidos con columna tenant (DynamoDB: PK tenant_id). 2) Un esquema por tenant en una BD (Aurora, el que pide el proyecto del curso). 3) Una BD por tenant (máximo aislamiento, más costo).'],
    ['Filtro de SNS', 'La política de filtro vive en la **suscripción**: claves distintas = AND; varios valores de una clave = OR. Permite un único tema para todos los tenants sin mezclar eventos.'],
    ['¿Por qué SQS en reportes?', 'Un reporte tarda más que el límite de API Gateway (29 s). La cola desacopla, limita la concurrencia y reintenta; la DLQ guarda los fallidos.'],
  ],
  diagrama,
  figura: 'Figura 3.1 — Campus SaaS multi-tenant: tenant_id como eje de aislamiento, entrega directa a S3, eventos filtrados por tenant, reportes en cola.',
};
