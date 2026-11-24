import { base } from '../lib/layout.mjs';

function diagrama() {
  const ms = [
    { num: 1, name: 'Clientes y repartidores', lam: 'crearCliente · agregarDireccion\nregistrarRepartidor', db: 'dynamodb', dbl: 'DynamoDB', extra: { icon: 's3', label: 'Documentos' } },
    { num: 2, name: 'Restaurantes y menú', lam: 'buscarRestaurantes · verMenu\ncrearItem · abrirCerrar', db: 'dynamodb', dbl: 'DynamoDB', extra: { icon: 's3', label: 'Fotos' } },
    { num: 3, name: 'Pedidos', lam: 'crearPedido · verPedido\nactualizarEstado · cancelar', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 4, name: 'Despacho', lam: 'asignarRepartidor (cola)\nofertas · aceptarOferta', db: 'dynamodb', dbl: 'DDB geohash' },
    { num: 5, name: 'Tracking', lam: 'actualizarUbicacion\nverTracking (ETA)', db: 'dynamodb', dbl: 'DDB + TTL' },
    { num: 6, name: 'Pagos', lam: 'autorizar · capturar\nreembolsar · liquidaciones', db: 'aurora', dbl: 'Aurora Sv.', extra: { icon: 'secrets', label: 'API key' } },
    { num: 7, name: 'Calificaciones', lam: 'calificar · resumenRestaurante', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 8, name: 'Promociones', lam: 'validarCupon · crearCupon\nlistarPromociones', db: 'dynamodb', dbl: 'DynamoDB' },
  ];
  const b = base({
    ms, rightLabel: '4 · Pedido → despacho → notificaciones (cola con DLQ) y reporte semanal',
    actors: [
      { icon: 'users', label: 'Clientes', sub: 'app móvil', frontSub: 'App cliente' },
      { icon: 'user', label: 'Restaurantes', sub: 'tablet / panel', frontSub: 'Panel local' },
      { icon: 'mobile', label: 'Repartidores', sub: 'app móvil + GPS', frontSub: 'App repartidor' },
    ],
    transversals: [['cloudwatch', 'CloudWatch', 'logs · alarmas DLQ'], ['kms', 'KMS', 'cifrado'], ['secrets', 'Secrets Manager', 'pasarela de pago'], ['iam', 'IAM', 'mínimo privilegio'], ['xray', 'X-Ray', 'trazas del pedido']],
  });
  const { groups, nodes, notes, edges, marks, mid, X, W, AX } = b;

  // Pedidos → EventBridge
  nodes.push({ id: 'eb', x: 1010, y: 291, icon: 'eventbridge', size: 46, label: 'EventBridge', sub: 'bus rapidoya' });
  edges.push({ pts: [[X + W, mid(2)], [982, mid(2)]], kind: 'async', label: 'PedidoCreado', n: 3, nx: 948, ny: mid(2) + 18, lx: 934, ly: mid(2) - 14 });
  // regla → SQS despacho → Despacho
  nodes.push({ id: 'qdes', x: 1170, y: 383, icon: 'sqs', size: 44, label: 'SQS despacho', badge: 'DLQ' });
  edges.push({ pts: [[1040, 291], [1100, 291], [1100, 383], [1146, 383]], kind: 'async', label: 'regla', n: 4, nx: 1086, ny: 340, lx: 1100, ly: 310 });
  edges.push({ pts: [[1146, 395], [X + W, 395]], kind: 'async', label: 'consume (asignarRepartidor)', n: 5, nx: 960, ny: 430, lx: 1010, ly: 411 });
  notes.push({ x: 940, y: 112, t: 'Oferta con expiración: si nadie acepta en 30 s,', fs: 10.5, weight: 700, fill: '#7b3fb0' });
  notes.push({ x: 940, y: 126, t: 'el mensaje reaparece (visibility timeout) → siguiente repartidor', fs: 10.5, weight: 700, fill: '#7b3fb0' });
  notes.push({ x: 940, y: 150, t: 'Picos ×15 (almuerzo / lluvia): la cola absorbe y la Lambda escala', fs: 10.5, weight: 600, fill: '#55657a' });

  // Despacho → SNS notificaciones
  nodes.push({ id: 'snsn', x: 1140, y: 520, icon: 'sns', size: 46, label: 'SNS\nnotificaciones', sub: 'filtro por tipo' });
  edges.push({ pts: [[X + W, 410], [AX, 410], [AX, 520], [1114, 520]], kind: 'async', label: 'PedidoAsignado', n: 6, nx: AX + 14, ny: 470, lx: AX, ly: 440 });
  nodes.push({ id: 'q1', x: 1270, y: 455, icon: 'sqs', size: 36, label: 'push', badge: 'DLQ' });
  nodes.push({ id: 'q2', x: 1270, y: 535, icon: 'sqs', size: 36, label: 'sms', badge: 'DLQ' });
  nodes.push({ id: 'q3', x: 1270, y: 615, icon: 'sqs', size: 36, label: 'email', badge: 'DLQ' });
  nodes.push({ id: 'l1', x: 1352, y: 455, icon: 'lambda', size: 30, label: 'enviarPush' });
  nodes.push({ id: 'l2', x: 1352, y: 535, icon: 'lambda', size: 30, label: 'enviarSMS' });
  nodes.push({ id: 'l3', x: 1352, y: 615, icon: 'lambda', size: 30, label: 'enviarCorreo' });
  nodes.push({ id: 'd1', x: 1444, y: 455, icon: 'sns', size: 36, label: 'SNS Push', sub: 'cliente + repartidor' });
  nodes.push({ id: 'd2', x: 1444, y: 535, icon: 'sns', size: 36, label: 'SNS SMS', sub: 'restaurante' });
  nodes.push({ id: 'd3', x: 1444, y: 615, icon: 'ses', size: 36, label: 'SES', sub: 'recibo' });
  groups.push({ x: 1218, y: 410, w: 268, h: 276, tone: 'purple', dash: true, label: '9 · Notificaciones', fs: 12 });
  edges.push({ pts: [[1166, 520], [1196, 520], [1196, 455], [1250, 455]], kind: 'async' });
  edges.push({ pts: [[1166, 520], [1250, 535]], kind: 'async', label: 'fan-out', lx: 1204, ly: 540 });
  edges.push({ pts: [[1166, 520], [1196, 520], [1196, 615], [1250, 615]], kind: 'async' });
  edges.push({ from: 'q1', to: 'l1', route: 'h', kind: 'async' });
  edges.push({ from: 'q2', to: 'l2', route: 'h', kind: 'async' });
  edges.push({ from: 'q3', to: 'l3', route: 'h', kind: 'async' });
  edges.push({ from: 'l1', to: 'd1', route: 'h', kind: 'sync', n: 7, nx: 1398, ny: 439 });
  edges.push({ from: 'l2', to: 'd2', route: 'h', kind: 'sync' });
  edges.push({ from: 'l3', to: 'd3', route: 'h', kind: 'sync' });
  notes.push({ x: 1228, y: 676, t: 'DLQ + alarma CloudWatch', fs: 10, weight: 700, fill: '#a02020' });

  // Tracking: lectura del cliente (nota) y reporte semanal
  notes.push({ x: 940, y: 200, t: 'Tracking: el repartidor envía GPS cada 5 s (PUT).', fs: 10.5, weight: 600, fill: '#176b3a' });
  notes.push({ x: 940, y: 214, t: 'El cliente consulta cada 5 s (GET) · DynamoDB con TTL de 2 h', fs: 10.5, weight: 600, fill: '#176b3a' });
  nodes.push({ id: 'cron', x: 1010, y: 705, icon: 'eventbridge', size: 40, label: 'EventBridge', sub: 'lunes 06:00 Lima = 11:00 UTC' });
  nodes.push({ id: 'lrep', x: 1140, y: 705, icon: 'lambda', size: 34, label: 'reporteSemanal', sub: 'por restaurante' });
  nodes.push({ id: 's3rep', x: 1270, y: 725, icon: 's3', size: 34, label: 'S3 reportes' });
  edges.push({ from: 'cron', to: 'lrep', route: 'h', kind: 'async' });
  edges.push({ pts: [[1164, 710], [1246, 725]], kind: 'data' });

  return { w: 1500, h: b.height, groups, nodes, notes, edges, pills: [], marks };
}

export default {
  id: '05', slug: 'delivery',
  title: 'RapidoYa — Delivery de Comida con Despacho y Seguimiento en Vivo',
  pattern: 'Cola de despacho + DLQ · Tracking con TTL · DynamoDB geohash',
  kicker: 'CASO 05 · LOGÍSTICA · TIEMPO REAL',
  svc: ['Amplify', 'Cognito', 'API Gateway', 'Lambda', 'DynamoDB (geohash + TTL)', 'Aurora Serverless', 'S3', 'EventBridge', 'SNS + SQS + DLQ', 'SES'],
  problema: 'App de delivery presente en 5 ciudades. Los clientes piden a restaurantes cercanos, los restaurantes aceptan y preparan, y el sistema asigna al repartidor disponible más cercano, que comparte su ubicación cada 5 segundos para que el cliente vea el avance y el tiempo estimado. Hay picos ×15 en almuerzo y cuando llueve; no se puede perder un pedido ni asignar dos repartidores. Se cobra con tarjeta, se califica el servicio, hay cupones y cada semana se envía un reporte a los restaurantes.',
  reqs: ['Picos ×15 almuerzo / lluvia', 'Asignación sin doble repartidor', 'GPS cada 5 s por repartidor', 'ETA y tracking para el cliente', 'Cupones de un solo uso', 'Reporte semanal a restaurantes'],
  detectar: [
    ['“clientes”, “direcciones”, “repartidores”', 'Clientes y repartidores', 'DynamoDB + S3', 'Perfiles por id; documentos del repartidor en S3'],
    ['“restaurantes cercanos”, “menú”', 'Restaurantes y menú', 'DynamoDB + S3', 'Búsqueda por geohash (celda) + categoría; fotos en S3'],
    ['“pedir”, “estados del pedido”', 'Pedidos', 'DynamoDB', 'Acceso por cliente y por restaurante; publica eventos'],
    ['“asignar el repartidor más cercano”', 'Despacho', 'DynamoDB (geohash) + SQS', 'Disponibles por celda; cola con reintentos y DLQ'],
    ['“ubicación cada 5 segundos”', 'Tracking', 'DynamoDB (TTL)', 'Escritura masiva de último valor; los datos viejos expiran'],
    ['“cobrar”, “liquidar al restaurante”', 'Pagos', 'Aurora Serverless', 'Autorizar/capturar con ACID y liquidaciones con JOIN'],
    ['“calificar restaurante y repartidor”', 'Calificaciones', 'DynamoDB', 'Escritura simple; promedio por Streams'],
    ['“cupones”, “promociones”', 'Promociones', 'DynamoDB', 'Canje atómico de un solo uso (escritura condicional)'],
    ['“avisar al cliente, repartidor y restaurante”', 'Notificaciones', 'sin BD', 'Push + SMS + correo por colas'],
  ],
  ms: [
    {
      n: 1, name: 'Clientes y repartidores', icon: 'dynamodb', extraIcon: 's3', db: 'DynamoDB (PK id_usuario · SK PERFIL | DIR#id | DOC#tipo) + S3 documentos', tablas: 'clientes, direcciones, repartidores',
      resp: 'Perfiles, libreta de direcciones y alta de repartidores con revisión de documentos.',
      eps: [
        { m: 'POST', p: '/repartidores', l: 'registrarRepartidor', who: 'clientes (postulante)', st: 202,
          in: { nombre: 'Marco Quispe', dni: '45128870', telefono: '+51988777666', tipo_vehiculo: 'MOTO', placa: 'ABC-123', ciudad: 'LIMA' },
          out: { id_repartidor: 'REP-5012', estado: 'EN_REVISION' }, errs: '400 · 409 DNI registrado', note: 'Los documentos (licencia, SOAT) se suben con URL prefirmada; un operador aprueba' },
        { m: 'PATCH', p: '/repartidores/me/disponibilidad', l: 'cambiarDisponibilidad', who: 'repartidores', st: 200,
          in: { disponible: true, lat: -12.1211, lng: -77.0297 }, out: { id_repartidor: 'REP-5012', disponible: true, celda: 'LIM#6mc8y' }, errs: '403 no aprobado',
          note: 'Actualiza la celda geohash: el índice de “disponibles por celda” cambia aquí' },
        { m: 'POST', p: '/clientes/me/direcciones', l: 'agregarDireccion', who: 'clientes', st: 201,
          in: { alias: 'Casa', direccion: 'Av. Pardo 450, Miraflores', lat: -12.1189, lng: -77.0301, referencia: 'Piso 3' }, out: { id_direccion: 'DIR-2' } },
        { m: 'POST', p: '/clientes', l: 'crearCliente', who: 'clientes', inS: '{nombre, telefono, correo}', outS: '201 {id_cliente}', card: false },
        { m: 'POST', p: '/repartidores/me/documentos/url-subida', l: 'subirDocumento', who: 'repartidores', inS: '{tipo, content_type}', outS: '200 {url_subida, s3_key}', card: false },
      ],
    },
    {
      n: 2, name: 'Restaurantes y menú', icon: 'dynamodb', extraIcon: 's3', db: 'DynamoDB (PK ciudad#geohash · SK id_restaurante) + GSI categoría + S3 fotos', tablas: 'restaurantes, menú, ítems',
      resp: 'Búsqueda de restaurantes cercanos, menú y disponibilidad en tiempo real.',
      eps: [
        { m: 'GET', p: '/restaurantes?lat=-12.12&lng=-77.03&radio_km=3&categoria=pollo', l: 'buscarRestaurantes', who: 'clientes', q: 'query lat, lng, radio_km, categoria', st: 200,
          out: [{ id_restaurante: 'R-310', nombre: 'Pollería El Brasa', abierto: true, calificacion: 4.6, eta_min: 28, costo_envio: 4.5 }], note: 'Query a las celdas geohash vecinas + filtro por categoría; resultados en caché' },
        { m: 'POST', p: '/restaurantes/{id_restaurante}/menu/items', l: 'crearItem', who: 'restaurantes (dueño)', st: 201,
          in: { nombre: '1/4 Pollo + papas', descripcion: 'Con ensalada', precio: 24.9, categoria: 'PLATOS', disponible: true }, out: { id_item: 'IT-884', disponible: true }, errs: '403 restaurante ajeno' },
        { m: 'GET', p: '/restaurantes/{id_restaurante}/menu', l: 'verMenu', who: 'clientes', inS: 'path id_restaurante', outS: '200 {categorias[{items[]}]}', card: false },
        { m: 'PATCH', p: '/restaurantes/{id_restaurante}/estado', l: 'abrirCerrar', who: 'restaurantes (dueño)', inS: '{abierto}', outS: '200 {abierto}', card: false },
        { m: 'PATCH', p: '/menu/items/{id_item}/disponibilidad', l: 'agotarItem', who: 'restaurantes (dueño)', inS: '{disponible}', outS: '200 ítem', card: false },
      ],
    },
    {
      n: 3, name: 'Pedidos', icon: 'dynamodb', db: 'DynamoDB (PK id_cliente · SK id_pedido · GSI id_restaurante+estado)', tablas: 'pedidos, detalle_pedido',
      resp: 'Crea el pedido (con pago autorizado y cupón) y gestiona su máquina de estados.',
      eps: [
        { m: 'POST', p: '/pedidos', l: 'crearPedido', who: 'clientes', st: 201,
          in: { id_restaurante: 'R-310', items: [{ id_item: 'IT-884', cantidad: 2, notas: 'sin ají' }], id_direccion: 'DIR-2', metodo_pago: 'TARJETA', token_tarjeta: 'tok_8Pq…', cupon: 'ALMUERZO10' },
          out: { id_pedido: 'PED-77120', estado: 'RECIBIDO', subtotal: 49.8, descuento: 4.98, envio: 4.5, total: 49.32, eta_min: 32 }, errs: '400 · 402 pago rechazado · 409 restaurante cerrado',
          note: 'Invoca (síncrono) a Promociones.validarCupon y a Pagos.autorizar antes de guardar; luego publica PedidoCreado y responde' },
        { m: 'PATCH', p: '/pedidos/{id_pedido}/estado', l: 'actualizarEstado', who: 'restaurantes · repartidores', st: 200,
          in: { estado: 'EN_PREPARACION' }, out: { id_pedido: 'PED-77120', estado: 'EN_PREPARACION' }, errs: '409 transición inválida · 403',
          note: 'Máquina de estados: RECIBIDO → ACEPTADO → EN_PREPARACION → LISTO → RECOGIDO → ENTREGADO. Cada cambio publica PedidoActualizado' },
        { m: 'GET', p: '/pedidos/{id_pedido}', l: 'verPedido', who: 'clientes (el suyo) · restaurante · repartidor asignado', q: 'path id_pedido', st: 200,
          out: { id_pedido: 'PED-77120', estado: 'EN_CAMINO', restaurante: 'Pollería El Brasa', total: 49.32, repartidor: { nombre: 'Marco', vehiculo: 'MOTO' } }, errs: '403 · 404' },
        { m: 'POST', p: '/pedidos/{id_pedido}/cancelar', l: 'cancelarPedido', who: 'clientes', inS: '{motivo}', outS: '200 {estado: "CANCELADO"} (+reembolso)', card: false },
        { m: 'GET', p: '/restaurantes/{id}/pedidos?estado=RECIBIDO', l: 'pedidosActivos', who: 'restaurantes (dueño)', inS: 'query estado (GSI)', outS: '200 [{id_pedido, items, hora}]', card: false },
      ],
    },
    {
      n: 4, name: 'Despacho', icon: 'dynamodb', extraIcon: 'sqs', db: 'DynamoDB (PK ciudad#geohash · SK id_repartidor, disponibles) + tabla ofertas con TTL', tablas: '— (nuevo)',
      resp: 'Asigna el repartidor disponible más cercano; la primera aceptación gana.',
      eps: [
        { m: 'GET', p: '/despacho/ofertas', l: 'ofertasPendientes', who: 'repartidores (del token)', q: '— (id del token)', st: 200,
          out: [{ id_oferta: 'OF-3301', id_pedido: 'PED-77120', restaurante: 'Pollería El Brasa', distancia_km: 1.4, pago_estimado: 7.5, expira_en_seg: 30 }], note: 'Alternativa: push al celular; este GET sirve de respaldo' },
        { m: 'POST', p: '/despacho/ofertas/{id_oferta}/aceptar', l: 'aceptarOferta', who: 'repartidores', st: 200,
          in: {}, out: { id_pedido: 'PED-77120', estado: 'ASIGNADO', restaurante: { nombre: 'Pollería El Brasa', direccion: 'Av. Larco 120' } }, errs: '409 oferta ya tomada o expirada',
          note: 'Escritura condicional (estado = OFERTADO) en el pedido: solo un repartidor la gana. Publica PedidoAsignado' },
        { m: 'POST', p: '/despacho/ofertas/{id_oferta}/rechazar', l: 'rechazarOferta', who: 'repartidores', inS: '{motivo}', outS: '200 (se ofrece al siguiente)', card: false },
      ],
      nota: '<code>asignarRepartidor</code> consume la cola SQS <code>despacho</code> (sin endpoint): consulta las celdas geohash vecinas, ofrece el pedido a los 3 más cercanos y, si nadie acepta en 30 s, el mensaje reaparece y se reintenta; tras N fallos va a la DLQ.',
    },
    {
      n: 5, name: 'Tracking', icon: 'dynamodb', db: 'DynamoDB (PK id_repartidor, último valor) con TTL 2 h', tablas: '— (nuevo)',
      resp: 'Recibe la ubicación GPS y calcula el ETA que ve el cliente.',
      eps: [
        { m: 'PUT', p: '/repartidores/me/ubicacion', l: 'actualizarUbicacion', who: 'repartidores', st: 200,
          in: { lat: -12.1204, lng: -77.0289, velocidad_kmh: 24, id_pedido: 'PED-77120', timestamp: '2026-11-24T20:15:05Z' }, out: { ok: true }, errs: '400 coordenadas inválidas', note: 'PutItem sobrescribe el último valor (no historial). Con 5 000 repartidores ≈ 1 000 escrituras/s: DynamoDB on-demand' },
        { m: 'GET', p: '/pedidos/{id_pedido}/tracking', l: 'verTracking', who: 'clientes (el suyo)', q: 'path id_pedido', st: 200,
          out: { estado: 'EN_CAMINO', ubicacion: { lat: -12.1204, lng: -77.0289, actualizado: '2026-11-24T20:15:05Z' }, eta_min: 7, distancia_km: 1.2, repartidor: { nombre: 'Marco', vehiculo: 'MOTO' } }, errs: '403 · 404', note: 'ETA = distancia (haversine) ÷ velocidad media; alternativa: Amazon Location Service' },
      ],
    },
    {
      n: 6, name: 'Pagos', icon: 'aurora', extraIcon: 'secrets', db: 'Aurora Serverless v2 · RDS Proxy · Secrets Manager', tablas: 'pagos, liquidaciones',
      resp: 'Autoriza al crear el pedido, captura al entregar y liquida a restaurantes y repartidores.',
      eps: [
        { m: 'POST', p: '/pagos/autorizar', l: 'autorizar', who: 'interno (crearPedido)', st: 201,
          in: { id_pedido: 'PED-77120', monto: 49.32, token_tarjeta: 'tok_8Pq…' }, out: { id_pago: 'PAG-90112', estado: 'AUTORIZADO' }, errs: '402 rechazado', note: 'Retiene fondos; se captura al marcarse ENTREGADO. Idempotente por id_pedido' },
        { m: 'GET', p: '/liquidaciones?semana=2026-W47', l: 'liquidaciones', who: 'restaurantes · repartidores (lo suyo)', q: 'query semana', st: 200,
          out: { id_restaurante: 'R-310', semana: '2026-W47', pedidos: 312, ventas: 8420.5, comision: 1263.08, neto: 7157.42, estado: 'PENDIENTE' }, note: 'SUM + GROUP BY en Aurora' },
        { m: 'POST', p: '/pagos/{id_pago}/capturar', l: 'capturar', who: 'interno (evento ENTREGADO)', inS: '{}', outS: '200 {estado: "CAPTURADO"}', card: false },
        { m: 'POST', p: '/pagos/{id_pago}/reembolso', l: 'reembolsar', who: 'interno · soporte', inS: '{monto, motivo}', outS: '200 {id_reembolso}', card: false },
      ],
    },
    {
      n: 7, name: 'Calificaciones', icon: 'dynamodb', db: 'DynamoDB (PK id_restaurante · SK fecha#id) + Streams', tablas: '— (nuevo)',
      resp: 'Calificación del restaurante y del repartidor tras la entrega.',
      eps: [
        { m: 'POST', p: '/pedidos/{id_pedido}/calificacion', l: 'calificar', who: 'clientes (el pedido es suyo)', st: 201,
          in: { restaurante: 5, repartidor: 4, comentario: 'Llegó caliente' }, out: { id_calificacion: 'CAL-9001' }, errs: '409 ya calificado · 409 pedido no entregado', note: 'DynamoDB Streams recalcula el promedio del restaurante' },
        { m: 'GET', p: '/restaurantes/{id_restaurante}/calificaciones', l: 'resumenRestaurante', who: 'todos', inS: 'path id', outS: '200 {promedio, total, ultimas[]}', card: false },
      ],
    },
    {
      n: 8, name: 'Promociones', icon: 'dynamodb', db: 'DynamoDB (PK codigo · usos con escritura condicional)', tablas: '— (nuevo)',
      resp: 'Cupones con límite de usos y promociones por restaurante.',
      eps: [
        { m: 'POST', p: '/cupones/validar', l: 'validarCupon', who: 'interno (crearPedido) · clientes', st: 200,
          in: { codigo: 'ALMUERZO10', id_restaurante: 'R-310', subtotal: 49.8 }, out: { valido: true, descuento: 4.98, usos_restantes: 1204 }, errs: '409 agotado o vencido · 404', note: 'UpdateItem usos = usos + 1 con condición usos < limite: dos pedidos no pueden usar el último cupón' },
        { m: 'POST', p: '/cupones', l: 'crearCupon', who: 'marketing', inS: '{codigo, tipo, valor, limite_usos, vigente_hasta}', outS: '201 {codigo}', card: false },
        { m: 'GET', p: '/promociones?id_restaurante=R-310', l: 'listarPromociones', who: 'clientes', inS: 'query id_restaurante', outS: '200 [{titulo, vigente_hasta}]', card: false },
      ],
    },
    {
      n: 9, name: 'Notificaciones', icon: 'sns', extraIcon: 'ses', db: 'sin BD (endpoints de dispositivo en SNS)', tablas: '— (nuevo)',
      resp: 'Push, SMS y correo a clientes, repartidores y restaurantes.',
      eps: [
        { m: 'PUT', p: '/notificaciones/dispositivos', l: 'registrarDispositivo', who: 'clientes · repartidores', st: 200,
          in: { plataforma: 'ANDROID', token_push: 'fcm_dX3…' }, out: { registrado: true } },
      ],
      nota: 'Disparadores: <code>SQS push</code> → <code>enviarPush</code> · <code>SQS sms</code> → <code>enviarSMS</code> (restaurante) · <code>SQS email</code> → <code>enviarCorreo</code> (recibo). Cada cola con DLQ.',
    },
  ],
  eventos: [
    { name: 'PedidoCreado', via: 'EventBridge bus → regla → SQS despacho', json: { source: 'rapidoya.pedidos', 'detail-type': 'PedidoCreado', detail: { id_pedido: 'PED-77120', id_restaurante: 'R-310', celda: 'LIM#6mc8y', total: 49.32 } } },
    { name: 'PedidoAsignado', via: 'Despacho → SNS notificaciones (atributo tipo=ASIGNADO)', json: { id_pedido: 'PED-77120', id_repartidor: 'REP-5012', id_cliente: 'CL-8801', id_restaurante: 'R-310', eta_min: 32 } },
    { name: 'OfertaDespacho (cuerpo SQS)', via: 'SQS despacho · visibility timeout 30 s', json: { id_pedido: 'PED-77120', celda: 'LIM#6mc8y', intento: 1, excluidos: ['REP-4410'] } },
  ],
  flujos: [
    { t: 'A · Pedido → asignación de repartidor → avisos (pasos numerados 1–7)', steps: [
      ['Amplify → Cognito', 'El cliente inicia sesión; el JWT trae `sub` y el grupo `clientes`.'],
      ['API Gateway → Lambda `crearPedido`', 'Valida el JWT, invoca **síncronamente** a Promociones (cupón) y a Pagos (autorizar), guarda el pedido `RECIBIDO` y responde 201.'],
      ['Pedidos → EventBridge', 'Publica `PedidoCreado` (asíncrono): el cliente no espera la asignación.'],
      ['EventBridge → regla → SQS `despacho`', 'La regla filtra `detail-type = PedidoCreado` y encola; la cola absorbe el pico del almuerzo y tiene DLQ.'],
      ['SQS → Lambda `asignarRepartidor` (Despacho)', 'Consulta las celdas geohash vecinas, ofrece el pedido a los 3 más cercanos; el primero en aceptar gana por escritura condicional. Si nadie acepta en 30 s, el mensaje reaparece.'],
      ['Despacho → SNS `notificaciones`', 'Publica `PedidoAsignado`; SNS reparte a las colas `push`, `sms` y `email`.'],
      ['Lambdas → SNS Push / SMS / SES', 'Push a cliente y repartidor, SMS al restaurante y correo de recibo. Cada canal reintenta de forma independiente y termina en su DLQ si falla.'],
    ] },
    { t: 'B · Seguimiento en vivo', steps: [
      ['App repartidor → `PUT /repartidores/me/ubicacion`', 'Cada 5 s envía lat/lng; la Lambda sobrescribe el último valor en DynamoDB con TTL de 2 h.'],
      ['App cliente → `GET /pedidos/{id}/tracking`', 'Consulta cada 5 s, recibe posición + ETA. (Alternativa: WebSocket API de API Gateway para empujar cambios.)'],
    ] },
    { t: 'C · Entrega, captura de pago y reporte semanal', steps: [
      ['`actualizarEstado = ENTREGADO`', 'Publica `PedidoActualizado`; una regla invoca `capturar` en Pagos y habilita la calificación.'],
      ['EventBridge `cron(0 11 ? * MON *)`', 'Lunes 06:00 Lima = 11:00 UTC: `reporteSemanal` consulta Aurora por restaurante y guarda el PDF en S3.'],
    ] },
  ],
  seguridad: {
    grupos: ['clientes', 'restaurantes', 'repartidores', 'soporte', 'marketing', 'administradores'],
    matriz: {
      cols: ['clientes', 'restaur.', 'repart.', 'soporte', 'market.', 'admin'],
      rows: [
        ['Buscar restaurantes / menú', [1, 1, 0, 1, 0, 1]],
        ['Crear pedido', [1, 0, 0, 0, 0, 0]],
        ['Cambiar estado del pedido', [0, 's', 's', 1, 0, 1]],
        ['Ofertas de despacho', [0, 0, 's', 0, 0, 1]],
        ['Ver tracking', ['s', 0, 's', 'v', 0, 1]],
        ['Cupones', [0, 0, 0, 0, 1, 1]],
      ],
    },
    puntos: [
      '**Atributos del token**: `custom:id_restaurante` y `custom:id_repartidor` acotan lo que cada usuario puede ver; el pedido solo lo lee quien participa en él.',
      '**Tracking**: solo el cliente del pedido (y el repartidor asignado) pueden leer la ubicación; la Lambda valida la relación pedido–usuario.',
      '**Escrituras condicionales** (aceptar oferta, canjear cupón) evitan condiciones de carrera sin bloqueos ni servidores.',
      '**Pagos**: la app envía token de tarjeta, no el número; claves de la pasarela en Secrets Manager; datos cifrados con KMS.',
    ],
  },
  conceptos: [
    ['¿Por qué una cola para el despacho?', 'Desacopla crear el pedido de encontrar repartidor. En picos ×15 la cola absorbe, la Lambda escala por lotes, los fallos se reintentan y la DLQ evita perder pedidos.'],
    ['DynamoDB con geohash', 'La PK `ciudad#geohash` agrupa repartidores/restaurantes por celda: buscar “cercanos” = consultar la celda y sus vecinas. Evita escanear la tabla.'],
    ['TTL y último valor', 'Para el GPS solo importa la última posición: `PutItem` sobrescribe y TTL borra solo lo viejo. Más barato y simple que guardar historial en una base.'],
  ],
  diagrama,
  figura: 'Figura 5.1 — Delivery serverless: pedido → EventBridge → cola de despacho con DLQ → asignación → notificaciones por canal; tracking con DynamoDB TTL.',
};
