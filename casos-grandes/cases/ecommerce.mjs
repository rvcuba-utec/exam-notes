import { base } from '../lib/layout.mjs';

function diagrama() {
  const ms = [
    { num: 1, name: 'Clientes y vendedores', lam: 'crearPerfil · agregarDireccion\nregistrarVendedor', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 2, name: 'Catálogo', lam: 'listarProductos · crearProducto\nsubirImagen (prefirmada)', db: 'dynamodb', dbl: 'DynamoDB', extra: { icon: 's3', label: 'S3' } },
    { num: 3, name: 'Carrito', lam: 'agregarItem · quitarItem\nobtenerCarrito', db: 'dynamodb', dbl: 'DDB + TTL' },
    { num: 4, name: 'Pedidos', lam: 'crearPedido · verPedido\ncancelarPedido · confirmarPedido', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 5, name: 'Inventario', lam: 'reservarStock · liberarStock\najustarStock', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 6, name: 'Pagos', lam: 'cobrar · reembolsar\nliquidacionesVendedor', db: 'aurora', dbl: 'Aurora Sv.', extra: { icon: 'secrets', label: 'API key' } },
    { num: 7, name: 'Envíos', lam: 'crearEnvio · actualizarEstado\nseguimiento', db: 'dynamodb', dbl: 'DynamoDB' },
    { num: 8, name: 'Reseñas', lam: 'crearReseña · listarReseñas\nanalizarSentimiento', db: 'dynamodb', dbl: 'DynamoDB', extra: { icon: 'comprehend', label: 'Comprehend' } },
  ];
  const b = base({
    ms, rightLabel: '4 · Saga de checkout, mensajería asíncrona y tareas programadas',
    actors: [
      { icon: 'users', label: 'Clientes', sub: 'web / móvil', frontSub: 'Tienda' },
      { icon: 'user', label: 'Vendedores\ny soporte', sub: 'panel de ventas', frontSub: 'Panel vendedor' },
    ],
    cloudfront: true,
    transversals: [['cloudwatch', 'CloudWatch', 'logs · alarmas DLQ'], ['kms', 'KMS', 'cifrado S3 / BD'], ['secrets', 'Secrets Manager', 'pasarela de pago · Aurora'], ['iam', 'IAM', 'mínimo privilegio'], ['xray', 'X-Ray', 'trazas del checkout']],
  });
  const { groups, nodes, notes, edges, marks, mid, X, W, AX } = b;
  const pills = [];

  // Saga (Step Functions)
  nodes.push({ id: 'sf', x: 1010, y: 475, icon: 'stepfunctions', size: 50 });
  notes.push({ x: 1042, y: 508, t: 'Step Functions', fs: 11.5, weight: 800, fill: '#18283b' });
  notes.push({ x: 1042, y: 521, t: 'saga checkout', fs: 10, weight: 500, fill: '#55657a' });
  edges.push({ pts: [[X + W, mid(3)], [1010, mid(3)], [1010, 446]], kind: 'async', label: 'StartExecution', n: 3, nx: 940, ny: mid(3) + 18, lx: 960, ly: mid(3) - 14 });
  edges.push({ pts: [[982, 475], [X + W, 475]], kind: 'sync', label: 'reservarStock', n: 4, nx: 940, ny: 493, lx: 933, ly: 461 });
  edges.push({ pts: [[1010, 504], [1010, mid(5)], [X + W, mid(5)]], kind: 'sync', label: 'cobrar', lx: 950, ly: mid(5) - 14 });
  edges.push({ pts: [[1040, 475], [1148, 475]], kind: 'async', label: 'PedidoConfirmado', n: 5, nx: 1104, ny: 494, lx: 1092, ly: 458 });
  notes.push({ x: 1042, y: 548, t: 'si falla el pago →\nliberarStock (compensa)', fs: 10, weight: 700, fill: '#a02020' });

  // SNS → colas → lambdas → entrega
  nodes.push({ id: 'snsp', x: 1172, y: 475, icon: 'sns', size: 44, label: 'SNS\npedidos' });
  nodes.push({ id: 'q1', x: 1268, y: 400, icon: 'sqs', size: 40, label: 'email', badge: 'DLQ' });
  nodes.push({ id: 'q2', x: 1268, y: 475, icon: 'sqs', size: 40, label: 'envío', badge: 'DLQ' });
  nodes.push({ id: 'q3', x: 1268, y: 550, icon: 'sqs', size: 40, label: 'vendedor', badge: 'DLQ' });
  nodes.push({ id: 'l1', x: 1352, y: 400, icon: 'lambda', size: 34, label: 'enviarCorreo' });
  nodes.push({ id: 'l2', x: 1352, y: 475, icon: 'lambda', size: 34, label: 'crearEnvio' });
  nodes.push({ id: 'l3', x: 1352, y: 550, icon: 'lambda', size: 34, label: 'notificarVendedor' });
  nodes.push({ id: 'ses1', x: 1444, y: 400, icon: 'ses', size: 40, label: 'SES', sub: 'confirmación' });
  nodes.push({ id: 'ddbenv', x: 1444, y: 475, icon: 'dynamodb', size: 38, label: 'envíos' });
  nodes.push({ id: 'smsv', x: 1444, y: 550, icon: 'sns', size: 40, label: 'SNS SMS', sub: 'aviso vendedor' });
  groups.push({ x: 1218, y: 335, w: 268, h: 290, tone: 'purple', dash: true, label: '9 · Notificaciones + creación de envío', fs: 12 });
  edges.push({ pts: [[1198, 475], [1222, 475], [1222, 400], [1246, 400]], kind: 'async' });
  edges.push({ pts: [[1198, 475], [1246, 475]], kind: 'async', label: 'fan-out', n: 6, nx: 1210, ny: 455, lx: 1222, ly: 497 });
  edges.push({ pts: [[1198, 475], [1222, 475], [1222, 550], [1246, 550]], kind: 'async' });
  edges.push({ from: 'q1', to: 'l1', route: 'h', kind: 'async' });
  edges.push({ from: 'q2', to: 'l2', route: 'h', kind: 'async' });
  edges.push({ from: 'q3', to: 'l3', route: 'h', kind: 'async' });
  edges.push({ from: 'l1', to: 'ses1', route: 'h', kind: 'sync', n: 7, nx: 1398, ny: 384 });
  edges.push({ from: 'l2', to: 'ddbenv', route: 'h', kind: 'data' });
  edges.push({ from: 'l3', to: 'smsv', route: 'h', kind: 'sync' });
  notes.push({ x: 1228, y: 612, t: 'DLQ + alarma CloudWatch', fs: 10, weight: 700, fill: '#a02020' });

  // Stock bajo + reporte diario
  nodes.push({ id: 'eb', x: 1010, y: 690, icon: 'eventbridge', size: 46, label: 'EventBridge', sub: 'StockBajo · cron 07:00 Lima' });
  edges.push({ pts: [[X + W, 492], [AX + 6, 492], [AX + 6, 686], [982, 686]], kind: 'async', label: 'StockBajo', lx: AX + 6, ly: 640 });
  nodes.push({ id: 'lrep', x: 1130, y: 650, icon: 'lambda', size: 36, label: 'reporteDiario\nVentas', sub: '12:00 UTC' });
  nodes.push({ id: 's3rep', x: 1250, y: 650, icon: 's3', size: 36, label: 'S3 reportes' });
  nodes.push({ id: 'snsal', x: 1130, y: 752, icon: 'sns', size: 36, label: 'SNS alertas-vendedor' });
  nodes.push({ id: 'ses2', x: 1330, y: 752, icon: 'ses', size: 36, label: 'SES', sub: 'correo vendedor' });
  edges.push({ pts: [[1038, 676], [1085, 676], [1085, 650], [1106, 650]], kind: 'async' });
  edges.push({ pts: [[1038, 700], [1085, 700], [1085, 752], [1106, 752]], kind: 'async' });
  edges.push({ from: 'lrep', to: 's3rep', route: 'h', kind: 'data' });
  edges.push({ pts: [[1155, 752], [1305, 752]], kind: 'async' });

  return { w: 1500, h: b.height, groups, nodes, notes, edges, pills, marks };
}

export default {
  id: '02', slug: 'ecommerce',
  title: 'MercadoAndino — Marketplace Online con Checkout Distribuido',
  pattern: 'Saga con Step Functions · Fan-out SNS→SQS · DynamoDB + Aurora',
  kicker: 'CASO 02 · E-COMMERCE · CYBER DAY ×20',
  svc: ['Amplify', 'CloudFront', 'Cognito', 'API Gateway', 'Lambda', 'DynamoDB', 'Aurora Serverless', 'S3', 'Step Functions', 'SNS + SQS + DLQ', 'EventBridge', 'SES', 'Comprehend'],
  problema: 'Marketplace donde vendedores publican productos y clientes compran con tarjeta. Durante el Cyber Day el tráfico se multiplica ×20 y no se puede vender stock que no existe ni cobrar sin confirmar el pedido. Se necesita catálogo con imágenes, carrito, checkout confiable, seguimiento de envío, reseñas con análisis de sentimiento, avisos por correo/SMS y un reporte diario de ventas por vendedor. Todo serverless, sin servidores propios.',
  reqs: ['Picos ×20 en campañas', 'Stock consistente (sin sobreventa)', 'Pago ACID + conciliación', 'Imágenes de producto en S3', 'Si falla un paso, el checkout se compensa', 'Reporte diario por vendedor'],
  detectar: [
    ['“clientes”, “vendedores”, “direcciones”', 'Clientes y vendedores', 'DynamoDB', 'Perfil por id; credenciales viven en Cognito'],
    ['“catálogo”, “productos”, “imágenes”', 'Catálogo', 'DynamoDB + S3', 'Lecturas masivas por clave/categoría; imágenes en S3 + CloudFront'],
    ['“carrito”', 'Carrito', 'DynamoDB (TTL)', 'Dato temporal por cliente; expira solo'],
    ['“pedido”, “checkout”, “cancelar”', 'Pedidos', 'DynamoDB', 'Acceso por cliente y por vendedor; coordina la saga'],
    ['“no vender stock inexistente”', 'Inventario', 'DynamoDB', 'Decremento atómico condicional por SKU'],
    ['“cobrar con tarjeta”, “liquidar al vendedor”', 'Pagos', 'Aurora Serverless', 'Transacciones ACID, conciliación y reportes con JOIN'],
    ['“seguimiento del envío”', 'Envíos', 'DynamoDB', 'Línea de tiempo de eventos por envío'],
    ['“reseñas”, “sentimiento”', 'Reseñas', 'DynamoDB + Comprehend', 'Escrituras masivas; análisis asíncrono por Streams'],
    ['“avisar por correo y SMS”, “reporte diario”', 'Notificaciones', 'sin BD', 'Consume SNS/SQS; reporte con EventBridge cron'],
  ],
  ms: [
    {
      n: 1, name: 'Clientes y vendedores', icon: 'dynamodb', db: 'DynamoDB (PK id_usuario · SK PERFIL | DIR#id)', tablas: 'clientes, direcciones, vendedores',
      resp: 'Perfil del cliente, libreta de direcciones y alta/aprobación de vendedores (Cognito guarda credenciales).',
      eps: [
        { m: 'POST', p: '/clientes', l: 'crearPerfil', who: 'clientes', st: 201,
          in: { nombre: 'Lucía', apellido: 'Torres', telefono: '+51999111222', doc_tipo: 'DNI', doc_num: '70123456' },
          out: { id_cliente: 'CL-90321', mensaje: 'Perfil creado' }, errs: '400 · 409 perfil ya existe', note: 'id_cliente = claim sub del JWT; se invoca tras el registro en Cognito' },
        { m: 'POST', p: '/clientes/me/direcciones', l: 'agregarDireccion', who: 'clientes', st: 201,
          in: { alias: 'Casa', direccion: 'Calle Los Olivos 245', distrito: 'Miraflores', ciudad: 'Lima', referencia: 'Frente al parque' }, out: { id_direccion: 'DIR-4', alias: 'Casa' }, errs: '400' },
        { m: 'GET', p: '/clientes/me', l: 'obtenerPerfil', who: 'clientes', inS: '— (id del token)', outS: '200 {perfil, direcciones[]}', card: false },
        { m: 'POST', p: '/vendedores', l: 'registrarVendedor', who: 'clientes', st: 202,
          in: { razon_social: 'TechAndes SAC', ruc: '20601234567', cuenta_bancaria: '002-193-000123456-01' }, out: { id_vendedor: 'V-310', estado: 'PENDIENTE_APROBACION' }, errs: '400 RUC inválido · 409 ya registrado' },
        { m: 'PATCH', p: '/vendedores/{id}/aprobar', l: 'aprobarVendedor', who: 'administradores', inS: 'path id', outS: '200 {estado: "ACTIVO"} + agrega al grupo vendedores', card: false },
      ],
    },
    {
      n: 2, name: 'Catálogo', icon: 'dynamodb', extraIcon: 's3', db: 'DynamoDB (PK sku · GSI categoria+precio · GSI id_vendedor) + S3 imágenes', tablas: 'productos, categorías',
      resp: 'Publicación y consulta de productos; imágenes en S3 servidas por CloudFront.',
      eps: [
        { m: 'GET', p: '/productos?categoria=laptops&orden=precio&limite=20', l: 'listarProductos', who: 'público (sin token)', q: 'query categoria, orden, limite, token', st: 200,
          out: { items: [{ sku: 'SKU-1001', nombre: 'Laptop 14"', precio: 2499.9, moneda: 'PEN', imagen: 'https://cdn…/sku-1001.jpg', puntaje: 4.6 }], siguiente_token: 'eyJwayI6…' }, note: 'Rutas de lectura públicas: API Gateway sin authorizer + caché' },
        { m: 'POST', p: '/productos', l: 'crearProducto', who: 'vendedores', st: 201,
          in: { nombre: 'Laptop 14"', descripcion: '16 GB RAM, 512 GB SSD', categoria: 'laptops', precio: 2499.9, moneda: 'PEN', stock_inicial: 40 },
          out: { sku: 'SKU-1001', id_vendedor: 'V-310', estado: 'PUBLICADO' }, errs: '400 · 403 no es vendedor', note: 'id_vendedor sale del JWT. Publica ProductoCreado y crea el stock inicial en Inventario' },
        { m: 'POST', p: '/productos/{sku}/imagenes/url-subida', l: 'subirImagen', who: 'vendedores', st: 200,
          in: { nombre_archivo: 'frontal.jpg', content_type: 'image/jpeg' }, out: { url_subida: 'https://s3…firma…', s3_key: 'productos/SKU-1001/frontal.jpg', expira_en_seg: 300 }, errs: '403 producto ajeno' },
        { m: 'GET', p: '/productos/{sku}', l: 'obtenerProducto', who: 'público', inS: 'path sku', outS: '200 producto completo + imágenes[]', card: false },
        { m: 'PATCH', p: '/productos/{sku}', l: 'actualizarProducto', who: 'vendedores (dueño)', inS: '{precio, descripcion, estado}', outS: '200 producto', card: false },
        { m: 'DELETE', p: '/productos/{sku}', l: 'despublicarProducto', who: 'vendedores (dueño) · admin', inS: 'path sku', outS: '200 {estado: "DESPUBLICADO"}', card: false },
      ],
    },
    {
      n: 3, name: 'Carrito', icon: 'dynamodb', db: 'DynamoDB (PK id_cliente · SK sku) con TTL de 7 días', tablas: '— (nuevo)',
      resp: 'Carrito temporal por cliente; DynamoDB TTL lo limpia sin código ni cron.',
      eps: [
        { m: 'POST', p: '/carrito/items', l: 'agregarItem', who: 'clientes', st: 200,
          in: { sku: 'SKU-1001', cantidad: 2 }, out: { items: 1, unidades: 2, subtotal: 4999.8 }, errs: '404 sku · 409 sin stock visible' },
        { m: 'GET', p: '/carrito', l: 'obtenerCarrito', who: 'clientes', inS: '— (id del token)', st: 200,
          out: { items: [{ sku: 'SKU-1001', nombre: 'Laptop 14"', precio: 2499.9, cantidad: 2 }], total: 4999.8, moneda: 'PEN' }, errs: '' },
        { m: 'PATCH', p: '/carrito/items/{sku}', l: 'cambiarCantidad', who: 'clientes', inS: '{cantidad}', outS: '200 carrito', card: false },
        { m: 'DELETE', p: '/carrito/items/{sku}', l: 'quitarItem', who: 'clientes', inS: 'path sku', outS: '200 carrito', card: false },
      ],
    },
    {
      n: 4, name: 'Pedidos', icon: 'dynamodb', extraIcon: 'stepfunctions', db: 'DynamoDB (PK id_cliente · SK id_pedido · GSI id_vendedor+fecha) + Step Functions', tablas: 'pedidos, detalle_pedido',
      resp: 'Crea el pedido y dispara la saga de checkout; consulta y cancelación.',
      eps: [
        { m: 'POST', p: '/pedidos', l: 'crearPedido', who: 'clientes', st: 202,
          in: { id_direccion: 'DIR-4', metodo_pago: 'TARJETA', token_tarjeta: 'tok_1Nf3…', cupon: 'CYBER10' },
          out: { id_pedido: 'PED-2026-55012', estado: 'PROCESANDO', total: 4499.82 }, errs: '400 carrito vacío · 409 carrito cambió',
          note: 'Responde 202 Accepted: guarda el pedido (PROCESANDO) y llama StartExecution. El cliente consulta el estado después' },
        { m: 'GET', p: '/pedidos/{id_pedido}', l: 'verPedido', who: 'clientes (el suyo) · vendedores · soporte', q: 'path id_pedido', st: 200,
          out: { id_pedido: 'PED-2026-55012', estado: 'CONFIRMADO', total: 4499.82, items: [{ sku: 'SKU-1001', cantidad: 2 }], pago: { estado: 'APROBADO' }, envio: { estado: 'PREPARANDO' } }, errs: '403 · 404' },
        { m: 'POST', p: '/pedidos/{id_pedido}/cancelar', l: 'cancelarPedido', who: 'clientes', st: 200,
          in: { motivo: 'Me equivoqué de modelo' }, out: { id_pedido: 'PED-2026-55012', estado: 'CANCELANDO' }, errs: '409 ya despachado', note: 'Dispara compensación: reembolso + liberarStock' },
        { m: 'GET', p: '/pedidos?estado=CONFIRMADO', l: 'listarPedidos', who: 'clientes (del token)', inS: 'query estado, pagina', outS: '200 {items[], siguiente_token}', card: false },
        { m: 'GET', p: '/vendedor/pedidos?estado=PAGADO', l: 'pedidosDelVendedor', who: 'vendedores', inS: 'query estado (GSI)', outS: '200 [{id_pedido, items, fecha}]', card: false },
      ],
    },
    {
      n: 5, name: 'Inventario', icon: 'dynamodb', db: 'DynamoDB (PK sku, contadores atómicos con ConditionExpression)', tablas: 'inventario',
      resp: 'Reserva y libera stock de forma atómica; avisa cuando queda poco.',
      eps: [
        { m: 'POST', p: '/inventario/reservar', l: 'reservarStock', who: 'interno (Step Functions)', st: 200,
          in: { id_pedido: 'PED-2026-55012', items: [{ sku: 'SKU-1001', cantidad: 2 }] }, out: { reservado: true, id_pedido: 'PED-2026-55012' }, errs: '409 sin stock suficiente',
          note: 'UpdateItem con condición stock ≥ cantidad. Idempotente por id_pedido. Si queda < umbral publica StockBajo' },
        { m: 'POST', p: '/inventario/liberar', l: 'liberarStock', who: 'interno (compensación)', st: 200,
          in: { id_pedido: 'PED-2026-55012' }, out: { liberado: true }, errs: '' },
        { m: 'PUT', p: '/inventario/{sku}', l: 'ajustarStock', who: 'vendedores (dueño)', inS: '{stock}', outS: '200 {sku, stock}', card: false },
        { m: 'GET', p: '/inventario/{sku}', l: 'consultarStock', who: 'vendedores · soporte', inS: 'path sku', outS: '200 {sku, disponible, reservado}', card: false },
      ],
      nota: 'Las Lambdas <code>reservarStock</code> y <code>liberarStock</code> las invoca Step Functions: pueden no tener ruta pública en API Gateway.',
    },
    {
      n: 6, name: 'Pagos', icon: 'aurora', extraIcon: 'secrets', db: 'Aurora Serverless v2 · RDS Proxy · Secrets Manager (API key de la pasarela)', tablas: 'pagos, reembolsos, liquidaciones',
      resp: 'Cobro con tarjeta vía pasarela externa, reembolsos y liquidación mensual a vendedores.',
      eps: [
        { m: 'POST', p: '/pagos', l: 'cobrar', who: 'interno (Step Functions)', st: 201,
          in: { id_pedido: 'PED-2026-55012', monto: 4499.82, moneda: 'PEN', token_tarjeta: 'tok_1Nf3…' },
          out: { id_pago: 'PAG-77120', estado: 'APROBADO', autorizacion: 'AUTH-77231' }, errs: '402 pago rechazado · 409 pedido ya cobrado', note: 'INSERT en transacción + llamada a la pasarela con la clave de Secrets Manager. Idempotente por id_pedido' },
        { m: 'POST', p: '/pagos/{id_pago}/reembolso', l: 'reembolsar', who: 'interno · administradores', st: 200,
          in: { monto: 4499.82, motivo: 'Cancelación del cliente' }, out: { id_reembolso: 'RF-310', estado: 'PROCESADO' }, errs: '409 monto excede lo cobrado' },
        { m: 'GET', p: '/vendedor/liquidaciones?mes=2026-11', l: 'liquidacionesVendedor', who: 'vendedores', q: 'query mes', st: 200,
          out: { id_vendedor: 'V-310', mes: '2026-11', ventas_brutas: 58230.5, comision: 5823.05, neto: 52407.45, estado: 'PENDIENTE' }, note: 'Consulta con JOIN y SUM en Aurora' },
        { m: 'GET', p: '/pagos/pedido/{id_pedido}', l: 'estadoPago', who: 'clientes (el suyo) · soporte', inS: 'path id_pedido', outS: '200 {id_pago, estado}', card: false },
      ],
    },
    {
      n: 7, name: 'Envíos', icon: 'dynamodb', db: 'DynamoDB (PK id_envio · SK fecha#evento · GSI id_pedido)', tablas: 'envios, eventos_envio',
      resp: 'Crea el envío al confirmarse el pedido y mantiene la línea de tiempo de seguimiento.',
      eps: [
        { m: 'PATCH', p: '/envios/{id_envio}/estado', l: 'actualizarEstado', who: 'operadores (courier)', st: 200,
          in: { estado: 'EN_RUTA', ubicacion: 'Centro de distribución Lurín', nota: 'Sale a reparto' }, out: { id_envio: 'ENV-880', estado: 'EN_RUTA' }, errs: '409 transición inválida', note: 'Publica EnvioActualizado (aviso al cliente)' },
        { m: 'GET', p: '/envios/pedido/{id_pedido}', l: 'seguimiento', who: 'clientes (el suyo) · soporte', q: 'path id_pedido', st: 200,
          out: { id_envio: 'ENV-880', estado: 'EN_RUTA', eventos: [{ fecha: '2026-11-24T08:10', estado: 'PREPARANDO' }, { fecha: '2026-11-24T14:30', estado: 'EN_RUTA' }], entrega_estimada: '2026-11-26' } },
        { m: 'POST', p: '/envios', l: 'crearEnvio', who: 'interno (cola envío)', inS: '{id_pedido, id_direccion}', outS: '201 {id_envio, estado: "PREPARANDO"}', card: false },
      ],
    },
    {
      n: 8, name: 'Reseñas', icon: 'dynamodb', extraIcon: 'comprehend', db: 'DynamoDB (PK sku · SK fecha#id_resena) + Streams → Comprehend', tablas: 'reseñas',
      resp: 'Reseñas verificadas (solo quien compró) con puntaje agregado y sentimiento.',
      eps: [
        { m: 'POST', p: '/productos/{sku}/resenas', l: 'crearReseña', who: 'clientes', st: 201,
          in: { id_pedido: 'PED-2026-55012', puntaje: 5, comentario: 'Llegó rápido y funciona perfecto' }, out: { id_resena: 'RES-5521', estado: 'PUBLICADA' }, errs: '403 no compró el producto · 409 ya reseñó', note: 'DynamoDB Streams dispara analizarSentimiento (Comprehend) y actualiza el resumen' },
        { m: 'GET', p: '/productos/{sku}/resumen', l: 'resumenReseñas', who: 'público', q: 'path sku', st: 200,
          out: { sku: 'SKU-1001', promedio: 4.6, total: 128, sentimiento: { positivo: 0.86, neutro: 0.1, negativo: 0.04 } } },
        { m: 'GET', p: '/productos/{sku}/resenas?limite=10', l: 'listarReseñas', who: 'público', inS: 'query limite, token', outS: '200 {items[], siguiente_token}', card: false },
      ],
    },
    {
      n: 9, name: 'Notificaciones', icon: 'sns', extraIcon: 'ses', db: 'sin BD obligatoria (bitácora opcional)', tablas: '— (nuevo)',
      resp: 'Correo y SMS a clientes y vendedores a partir de eventos; también el reporte diario.',
      eps: [
        { m: 'PUT', p: '/notificaciones/preferencias', l: 'guardarPreferencias', who: 'clientes · vendedores', st: 200,
          in: { canales: ['EMAIL', 'SMS'], eventos: ['PEDIDO', 'ENVIO'] }, out: { actualizado: true } },
      ],
      nota: 'Disparadores: <code>SQS email</code> → <code>enviarCorreo</code> (SES) · <code>SQS vendedor</code> → <code>notificarVendedor</code> (SNS SMS) · <code>SQS envío</code> → <code>crearEnvio</code>. Cada cola con DLQ.',
    },
  ],
  eventos: [
    { name: 'PedidoConfirmado', via: 'Step Functions → SNS pedidos (fan-out a 3 colas)', json: { id_pedido: 'PED-2026-55012', id_cliente: 'CL-90321', id_vendedor: 'V-310', total: 4499.82, id_direccion: 'DIR-4' } },
    { name: 'StockBajo', via: 'EventBridge bus (regla) → SNS alertas-vendedor → SES', json: { source: 'mercado.inventario', 'detail-type': 'StockBajo', detail: { sku: 'SKU-1001', id_vendedor: 'V-310', disponible: 4, umbral: 5 } } },
    { name: 'EnvioActualizado', via: 'EventBridge → cola email', json: { id_envio: 'ENV-880', id_pedido: 'PED-2026-55012', estado: 'EN_RUTA' } },
  ],
  flujos: [
    { t: 'A · Checkout con saga distribuida (pasos numerados 1–7 en el diagrama)', steps: [
      ['Amplify → Cognito', 'El cliente inicia sesión y recibe sus JWT.'],
      ['API Gateway → Lambda `crearPedido`', 'El authorizer valida el JWT; la Lambda guarda el pedido en `PROCESANDO` y responde **202 Accepted** (no bloquea al cliente).'],
      ['Lambda → Step Functions', '`StartExecution` arranca la saga con el `id_pedido` (asíncrono).'],
      ['Step Functions → Inventario y Pagos', 'Paso 1 `reservarStock` (condicional). Paso 2 `cobrar` (Aurora + pasarela). Si falla el pago, la **compensación** ejecuta `liberarStock`; con reintentos y `Catch` en cada paso.'],
      ['Step Functions → SNS `pedidos`', 'Al terminar bien, `confirmarPedido` marca el pedido `CONFIRMADO` y publica `PedidoConfirmado` (un evento, varios consumidores).'],
      ['SNS → 3 colas SQS → Lambdas', 'Fan-out a `email`, `envío` y `vendedor`; cada cola con su DLQ aísla fallos y absorbe picos del Cyber Day.'],
      ['SES / DynamoDB / SNS SMS', 'Correo de confirmación al cliente, creación del envío y aviso al vendedor. Un fallo de SES no frena la creación del envío.'],
    ] },
    { t: 'B · Stock bajo y reporte diario de ventas', steps: [
      ['Lambda `reservarStock`', 'Si `disponible < umbral` publica `StockBajo` en EventBridge.'],
      ['EventBridge → SNS `alertas-vendedor` → SES', 'La regla filtra por `detail-type` y avisa por correo al vendedor dueño del SKU.'],
      ['EventBridge `cron(0 12 * * ? *)`', '07:00 Lima = 12:00 UTC. Invoca `reporteDiarioVentas`, que consulta Aurora, escribe un CSV en S3 y envía el enlace prefirmado.'],
    ] },
    { t: 'C · Reseña con análisis de sentimiento', steps: [
      ['`crearReseña` → DynamoDB', 'Valida con el pedido que el cliente compró el SKU y guarda la reseña.'],
      ['DynamoDB Streams → `analizarSentimiento`', 'Se ejecuta en segundo plano, llama a Comprehend y actualiza el resumen del producto sin retrasar la respuesta.'],
    ] },
  ],
  seguridad: {
    grupos: ['clientes', 'vendedores', 'soporte', 'administradores'],
    matriz: {
      cols: ['público', 'clientes', 'vendedores', 'soporte', 'admin'],
      rows: [
        ['Listar / ver productos', [1, 1, 1, 1, 1]],
        ['Crear / editar productos', [0, 0, 's', 0, 1]],
        ['Carrito y checkout', [0, 's', 0, 0, 0]],
        ['Ver pedidos', [0, 's', 's', 1, 1]],
        ['Pagos y liquidaciones', [0, 's', 's', 'v', 1]],
        ['Actualizar envíos', [0, 0, 0, 1, 1]],
      ],
    },
    puntos: [
      '**Rutas públicas** (catálogo, reseñas) sin authorizer pero con throttling y caché; el resto con **authorizer Cognito**.',
      '**Datos propios**: `id_cliente` e `id_vendedor` salen de `sub` / `custom:id_vendedor` del JWT; nunca del body.',
      '**Tarjetas**: la app envía solo un **token** de la pasarela; el número nunca toca nuestros servicios (alcance PCI mínimo). La API key va en **Secrets Manager**.',
      '**Lambdas internas** (`reservarStock`, `cobrar`) sin ruta pública: solo las invoca Step Functions con su rol IAM.',
    ],
  },
  conceptos: [
    ['¿Por qué una saga y no una transacción?', 'Cada servicio tiene su BD: no hay transacción distribuida. Step Functions ejecuta pasos con reintentos y **compensaciones** (liberar stock, reembolsar) para mantener consistencia eventual.'],
    ['¿Por qué 202 en `POST /pedidos`?', 'El checkout tarda varios pasos. Responder 202 evita timeouts de API Gateway (29 s) y permite consultar el estado después. Con picos ×20 la cola absorbe la carga.'],
    ['Idempotencia', 'Reintentos pueden repetir un paso: `reservarStock` y `cobrar` usan `id_pedido` como clave de idempotencia para no reservar ni cobrar dos veces.'],
  ],
  diagrama,
  figura: 'Figura 2.1 — Marketplace serverless: checkout como saga de Step Functions, fan-out de eventos con DLQ, reportes programados y análisis de reseñas.',
};
