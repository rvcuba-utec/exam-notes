# Servicios AWS: cómo se explicaron y cómo se usaron en clase

Curso CS2032 Cloud Computing (ciclo 2026-2), docente Geraldo Colchado. Síntesis por servicio de las semanas 9 a 15 (teoría, talleres de laboratorio y ejercicios propuestos). Todo lo que figura aquí sale del material del curso; lo que no se vio en clase se marca como "(no visto en clase)" y lo que es una propuesta de solución o una lectura complementaria se indica expresamente.

Convenciones del curso que conviene tener presentes al leer:

- Región usada en casi todos los talleres: us-east-1 (N. Virginia). Las diapositivas del Taller 1 de la semana 10 se hicieron en us-west-2.
- Todas las funciones Lambda se ejecutan con el rol existente LabRole de AWS Academy (no se crean roles propios).
- Multi-tenancy: casi todas las tablas usan tenant_id como clave de partición (UTEC, UNIV2, PLAZA_VEA, CINEPLANET, FAB1...).
- Los nombres de recursos del laboratorio llevan prefijos como t_ para tablas (t_alumnos, t_pedidos_procesados).

## Índice rápido

| Servicio | Semana(s) donde aparece | Rol en una arquitectura |
|---|---|---|
| AWS Lambda | 9, 10, 11, 12, 13, 14, 15 | Cómputo serverless (FaaS) que contiene la lógica de negocio y reacciona a eventos |
| Amazon API Gateway | 9, 10, 11, 12, 14, 15 | Puerta de entrada HTTP/REST: expone los microservicios, maneja CORS, etapas y (en teoría) autorización y throttling |
| Amazon DynamoDB | 9 a 15 | Base de datos NoSQL clave-valor sin servidor; almacén de cada microservicio |
| Amazon S3 | 10, 11, 13, 15 | Almacenamiento de objetos; origen de eventos (ObjectCreated), ingesta de datos, imágenes para IA, hosting estático (teoría) |
| Amazon SNS | 10, 13, 14 | Enrutador pub/sub de eventos con fan-out, filtros por suscripción; notificaciones por correo |
| Amazon SQS y DLQ | 10, 13 (teoría), 14 | Cola de mensajes para desacoplar productor y consumidor; la DLQ retiene mensajes fallidos |
| Amazon EventBridge | 10, 13, 14, 15 (propuesta) | Bus de eventos con reglas; en el laboratorio, regla programada que dispara una Lambda |
| Amazon CloudWatch | 11, 12, 14 | Logs de Lambda, métricas, Logs Insights, observabilidad |
| Amazon RDS / Aurora Serverless | 10 (teoría), 11 (proyecto), 15 (laboratorio RDS MySQL) | Base relacional administrada; patrón 2 de multi-tenancy (un esquema por tenant) |
| Secrets Manager y Parameter Store | 15 | Guardar y entregar secretos (passwords, endpoints) a las Lambdas; rotación |
| Amazon Rekognition y otros servicios de IA | 10 (ejemplos), 15 | Servicios gestionados de visión, voz y lenguaje consumidos por API |
| Amazon Cognito | 10, 14 (teoría) | Usuarios y autenticación; no disponible en AWS Academy, por eso se hizo un sistema propio de tokens |
| AWS Amplify | 10 (teoría), 11 (proyecto final) | Hosting del frontend (contenido estático) y conexión con backends |
| AWS Step Functions | 10 (teoría), 14 (lectura) | Orquestador visual de flujos de trabajo (no practicado en laboratorio) |
| Serverless Framework | 10, 11, 12, 14 (indirecto), 15 | Herramienta de despliegue como código: crea Lambdas, API Gateway, tablas y buckets con un comando |
| IAM, LabRole y AWS Academy | 9 a 15 | Rol de ejecución, credenciales temporales (4 h), servicios no disponibles |
| Postman y herramientas de prueba | 9 a 15 | Probar APIs (Postman, curl), eventos de prueba de Lambda, consolas de SQS/SNS/DynamoDB |
| Entorno de desarrollo (MV Desarrollo, CloudShell) | 10 a 15 | Máquina EC2 Ubuntu con node, npm, aws CLI y serverless; CloudShell para comandos de AWS CLI |

---

## AWS Lambda

### Qué es (definición del profesor)

- Semana 9 (diapositiva del Taller 2): Lambda es un servicio informático sin servidor y basado en eventos que permite ejecutar código sin pensar en servidores ni clústeres; no se aprovisiona ni administra infraestructura (se sube el código como .zip o imagen de contenedor). Puede activarse desde más de 200 servicios de AWS y aplicaciones SaaS. Escala automáticamente, de una docena de eventos al día a cientos de miles por segundo. Se paga solo por el tiempo de cómputo usado (por milisegundo). Capa gratuita: 1 millón de solicitudes al mes.
- Semana 10 (teoría): Lambda es el servicio FaaS (Función como Servicio) de AWS. FaaS (definición de Red Hat usada en clase): permite diseñar, ejecutar y gestionar paquetes de aplicaciones como funciones sin ocuparse de la infraestructura; es un modelo de ejecución basado en eventos que corre en contenedores sin estado (stateless). Consecuencia vista en el laboratorio: como las funciones no guardan estado, el estado persistente va a DynamoDB.
- Semana 10: Lambda está marcada como el servicio más usado de la capa de cómputo serverless (junto con AWS Fargate, que no se usa en el laboratorio).
- Semana 11 (clase "Optimización de Lambdas"): memoria, CPU, timeout máximo, cold start, concurrencia y formas de optimizar.

### Conceptos clave y componentes

| Concepto | Qué se dijo en clase |
|---|---|
| Función y handler | Cada función tiene un manejador (archivo.función, por ejemplo ListarAlumnos.lambda_handler) que recibe un evento y un contexto y devuelve un resultado |
| Runtime | Python 3.9 en la semana 9; Python 3.12 en la semana 10 y en la 12; Python 3.13 en las semanas 11 y 15 (las Lambdas de las semanas 13 y 14 no indican versión en las diapositivas). Arquitectura x86_64 |
| Memoria | De 128 MB a 10 240 MB en incrementos de 1 MB. La CPU no se configura: Lambda asigna CPU proporcional a la memoria. A 1769 MB equivale a 1 vCPU; con 10 GB se llega a 6 vCPU. Antes el máximo era 3008 MB |
| Timeout (tiempo de espera) | Por defecto 3 s. Máximo 900 s (15 min). En el laboratorio: 30 s (semanas 10 y 12), 20 s (semanas 11, 14 y 15) |
| Cold start | Retardo al invocar una función inactiva: hay que provisionar una máquina, crear el contenedor y ejecutar el código. El contenedor se elimina tras unos 10 minutos de inactividad; en el peor caso tarda hasta unos 5 s. Aumenta con el peso del código y las dependencias |
| Warm (caliente) | Contenedor aún activo y reutilizado; no hay retardo de cold start |
| Etapas de una ejecución | Code Download y Start Execution Environment (full cold start); Execute Init Code, que son los imports y lecturas fuera del handler (partial cold start); Execute Handler Code (warm start) |
| Concurrencia | Número de solicitudes en curso que la función atiende a la vez. Cada solicitud concurrente usa una instancia separada del entorno de ejecución. Límite por defecto: 1000 ejecuciones concurrentes entre todas las funciones de una región (por cuenta) |
| Variables de entorno | Se configuran en la función (o en el serverless.yml); se cifran en reposo con la clave predeterminada de Lambda. Se usaron para el nombre de la tabla (TABLE_NAME), del bucket de ingesta y para los nombres de parámetros de secretos |
| Rol de ejecución | Siempre LabRole ("Uso de un rol existente"). Es el que da permiso de acceso a DynamoDB, S3, SNS, SQS, Rekognition y SSM |
| Evento de prueba | En la consola: botón Test, evento privado con JSON, Invoke. Muestra Status Succeeded y la respuesta |
| Deploy en consola | Hay que pulsar Deploy tras pegar el código antes de probar |
| Optimización (6 puntos de la diapositiva) | Medir con CloudWatch; mantener caliente (ping cada n minutos); elegir bien la memoria; dependencias externas con Lambda Layers; función pequeña y de propósito único; simultaneidad aprovisionada (Provisioned Concurrency) para reducir el cold start |

Nota: keep warm, Layers y Provisioned Concurrency solo se mencionan en teoría (no se practicaron).

### Cómo se usó en el laboratorio

Creación manual desde la consola (semanas 9, 10 Taller 1, 13, 14):

1. Lambda, Crear función, opción Crear desde cero.
2. Nombre de la función (ListarAlumnos, CrearUsuario, RegistrarPedido, etc.), runtime Python (3.9 en la semana 9; 3.12 en la semana 10), arquitectura x86_64.
3. Permisos: expandir Cambiar el rol de ejecución predeterminado, elegir Uso de un rol existente y seleccionar LabRole.
4. Pegar el código en el editor, pulsar Deploy, y probar con un evento de prueba (Test, Create new test event, pegar JSON, Save, Invoke).
5. En las semanas 10 (Taller 1) y 14 (Taller 3) se subió el timeout: Configuración, Configuración general, Tiempo de espera: 30 s en los cuatro Lambdas de seguridad; 20 s en RegistrarPedido y ProcesarPedido (ProcesarPedido espera hasta 10 s de long polling).
6. Conectar el disparador: API Gateway (semanas 9 y 10), desencadenador SQS (semanas 14), suscripción SNS (semana 13), notificación de evento de S3 (semana 13 Taller 2) o regla de EventBridge (semana 14 Taller 4).

Creación automatizada con Serverless Framework (semanas 10 Taller 2 en adelante): cada función se declara en el serverless.yml con su handler, su evento http, la memoria y el timeout, y se despliega con un solo comando. El nombre resultante es servicio-stage-función (por ejemplo api-alumnos-dev-listar).

Funciones Lambda vistas por semana (resumen):

| Semana / taller | Lambdas | Qué hacen |
|---|---|---|
| 9 Taller 2 | ListarAlumnos, CrearAlumno, ModificarAlumno, BuscarAlumno, EliminarAlumno | CRUD multi-tenant sobre la tabla t_alumnos |
| 10 Taller 1 | CrearUsuario, LoginUsuario, ValidarTokenAcceso, CrearProducto | Sistema propio de seguridad con token de 60 minutos |
| 10 Taller 2 | ListarAlumnos, CrearAlumno (y BuscarAlumno, ModificarAlumno, EliminarAlumno en el propuesto) | Mismo CRUD desplegado con Serverless Framework |
| 11 Taller 3 | lista_buckets, lista_objetos_bucket (más crear_bucket, crear_directorio, subir_archivo en el propuesto) | Operaciones sobre S3; memoria 256 MB global y 512 MB en lista_buckets |
| 11 Taller 4 | crear (api-comentario) | Guarda un comentario con UUID v1 en la tabla del stage; en el propuesto también lo escribe en el bucket de ingesta |
| 12 Taller 1 | crear (api-pelicula) | Guarda una película e imprime logs de entrada y salida |
| 12 Taller 2 | scrape_table | Web scraping de la web de Bomberos y guardado en DynamoDB (1.7 MB por las librerías) |
| 13 Taller 1 | CrearAlumno (publica en SNS), CrearAlumno_Canvas, CrearAlumno_Seguridad | Productor y consumidores del evento Nuevo Alumno |
| 13 Taller 2 | LeerMetadataArchivo, CrearArchivo_UTEC | Lee el evento de S3, publica en SNS; consumidor que guarda en t_archivos_UTEC |
| 14 Taller 3 | RegistrarPedido, ProcesarPedido, RegistrarCanvas | Productor a SQS, consumidor por pull, Lambda que falla a propósito para la DLQ |
| 14 Taller 4 | GenerarEventoSensorIoT, InsertarEventoSensorIoT | Simulador de sensor que publica en SNS; consumidor disparado por SQS |
| 15 Taller 1 | DetectarEtiquetas | Llama a Rekognition sobre una imagen de S3 |
| 15 Taller 2 | ListarAlumnos (api-alumnos-rds) | Lee secretos de Parameter Store y consulta RDS MySQL |

### Qué lo activa, qué necesita y qué produce

La forma del evento que recibe la Lambda depende de quién la dispara. Esto es lo más preguntable para explicar un flujo.

| Disparador | Forma del evento (en palabras) | Qué devuelve y a quién |
|---|---|---|
| API Gateway (integración Lambda manual, semana 9, semana 14) | El evento es directamente el cuerpo JSON de la solicitud: se lee tenant_id o alumno_id como claves del evento | Un diccionario con statusCode 200 y datos; API Gateway lo devuelve como cuerpo de la respuesta |
| API Gateway con plantilla de asignación (semana 10 Taller 1, API productos) | El evento es un JSON armado por la plantilla: contiene method, path, headers (con Authorization) y body | Igual que arriba; el 403 se devuelve como cuerpo con statusCode 403 |
| API Gateway creado por Serverless Framework (integration: lambda) | El cuerpo llega dentro de la clave body del evento, ya como diccionario | Igual; los datos de la respuesta incluyen statusCode dentro del cuerpo |
| Notificación de S3 (ObjectCreated) | Un evento con una lista Records; cada registro trae eventTime, el nombre del bucket, la clave del objeto (key), su tamaño y su eTag | Sin retorno útil; la Lambda actúa (publica en SNS) |
| Suscripción de SNS | Lista Records con un elemento Sns cuyo campo Message es un texto JSON (hay que convertirlo con json.loads) | Sin retorno útil; la Lambda guarda en DynamoDB |
| Cola SQS (desencadenador) | Lista Records; el campo body es el texto del mensaje. Si el origen fue SNS, body es el sobre de SNS y el evento real está en su campo Message (doble parseo) | Si la función termina bien, el mensaje se borra; si lanza excepción, el mensaje vuelve a la cola y tras las recepciones máximas va a la DLQ |
| Regla programada de EventBridge | La Lambda no usa el contenido del evento (GenerarEventoSensorIoT ignora el evento y genera la lectura por su cuenta) | Publica en SNS |
| Otra Lambda (invocación síncrona RequestResponse) | El Payload que envía el llamador (por ejemplo, un JSON con el token) | Devuelve statusCode 200 o 403; el llamador lee el resultado y decide |
| Evento de prueba de la consola | El JSON que se pega en el cuadro de prueba | Muestra el resultado en pantalla |

Qué necesita: el rol LabRole con permiso sobre los servicios que invoca, el timeout adecuado, y las variables de entorno (por ejemplo, TABLE_NAME).

Un ejemplo del formato de evento SNS que recibe una Lambda suscrita (el código del profesor la lee con event, Records, posición 0, Sns, Message):

```json
{
  "Records": [
    {
      "Sns": {
        "Message": "{\"tenant_id\": \"UTEC\", \"alumno_id\": \"202199991\", \"alumno_datos\": {\"nombre\": \"Juan Colchado\"}}"
      }
    }
  ]
}
```

### Con qué otros servicios se combinó en clase

- API Gateway, Lambda y DynamoDB: microservicio CRUD (semanas 9 a 12).
- Lambda invoca Lambda (síncrona): CrearProducto, ListarProductos, etc. llaman a ValidarTokenAcceso (semana 10).
- Lambda y S3: lista, crea y sube objetos (semana 11); procesa evento de creación de objeto (semana 13).
- Lambda y SNS: la Lambda publica con atributos (semanas 13 y 14) o recibe como suscriptora.
- Lambda y SQS: la Lambda envía mensajes (RegistrarPedido), lee con receive (ProcesarPedido) o es disparada por la cola (RegistrarCanvas, InsertarEventoSensorIoT).
- Lambda y EventBridge: regla programada cada minuto (semana 14).
- Lambda y Rekognition: detect_labels sobre imagen de S3 (semana 15).
- Lambda y SSM Parameter Store y RDS MySQL: lectura de secretos y consulta SQL (semana 15).
- Lambda y CloudWatch Logs: todo lo que se imprime con print va a CloudWatch Logs automáticamente (semana 12).

### Cuándo usarlo, ventajas y limitaciones según el material

- Cuatro beneficios de serverless citados en la clase (semana 10): pasar de la idea al mercado más rápido; disminuir costos (pago por valor, nunca pagar por exceso de aprovisionamiento); adaptarse a la escala (de cero a la demanda máxima); crear mejores aplicaciones con más facilidad (integraciones integradas, centrarse en construir en lugar de configurar).
- Cifras: 128 a 10 240 MB; 900 s máximo; 1000 ejecuciones concurrentes por región; cold start de hasta ~5 s; 1 millón de solicitudes gratis al mes.
- Limitaciones vistas en el laboratorio (el material no presenta una lista formal de desventajas): timeout por defecto de 3 s (insuficiente para long polling o llamadas encadenadas), cold start en la primera llamada (1 a 2 s en los tiempos de Postman de la semana 11), el peso del código con dependencias (1.7 MB en el scraping), y que las funciones no guardan estado.
- Principio de diseño de la teoría: función pequeña y de un solo propósito (una Lambda por operación).

### Cómo ponerlo en un diagrama

Una caja "Lambda" por función (nómbrela por su operación: CrearPedido, ValidarToken...). Flecha de entrada: desde API Gateway, SQS, SNS, S3 o EventBridge según el disparador; flechas de salida hacia DynamoDB, S3, SNS, SQS u otro servicio. Es síncrona cuando la dispara API Gateway o otra Lambda con RequestResponse, y asíncrona cuando la dispara un evento (S3, SNS, SQS, EventBridge).

### Errores y trampas vistos en clase

- Olvidar el Deploy en el editor antes de probar.
- No seleccionar LabRole: la función no tiene permisos sobre DynamoDB.
- Dejar el timeout en 3 s: falla ProcesarPedido (long polling de 10 s) o las Lambdas encadenadas del sistema de seguridad.
- Leer el evento con la forma equivocada: la Lambda suscrita a SNS recibe Records con Sns Message; la disparada por SQS desde SNS requiere dos json.loads; con Serverless Framework el cuerpo está en event body.
- Olvidar la plantilla de asignación cuando la Lambda lee headers (la clave Authorization no existe).
- No poner pip install con la opción de directorio actual y la regla package include: la Lambda no encuentra las librerías (bs4, requests, pymysql).
- Pegar un ARN de otra cuenta (TopicArn, queue_url, ARN del rol LabRole).

### Preguntas tipo examen

1. ¿Qué es Lambda y cómo se cobra? Servicio FaaS serverless basado en eventos; se paga solo por el tiempo de cómputo usado (por milisegundo); capa gratuita de 1 millón de solicitudes al mes.
2. ¿Cómo se controla la CPU de una Lambda? No se configura directamente: se configura la memoria (128 a 10 240 MB) y la CPU es proporcional; a 1769 MB equivale a 1 vCPU.
3. Defina cold start y diga qué lo agrava. Retardo al invocar una función inactiva (hay que crear el contenedor y ejecutar el código); sube con el peso del código y de las dependencias; el contenedor se elimina tras ~10 min sin uso.
4. ¿Cuál es el timeout máximo y qué valor por defecto? Máximo 900 s; por defecto 3 s; en clase se usó 30 s o 20 s.
5. ¿Cómo protegió el curso una Lambda con token? La Lambda protegida lee el header Authorization e invoca de forma síncrona (RequestResponse) a ValidarTokenAcceso; si esta responde 403, devuelve 403 Forbidden; si no, ejecuta su proceso.

---

## Amazon API Gateway

### Qué es (definición del profesor)

- Semana 9: servicio completamente administrado para crear, publicar, mantener, monitorear y proteger APIs a cualquier escala; las APIs actúan como puerta de entrada a datos, lógica de negocio o funcionalidad de servicios backend. Permite crear API RESTful y API WebSocket. Gestiona tráfico, compatibilidad con CORS, control de autorizaciones y acceso, limitación controlada (throttling) y monitoreo. Sin pagos mínimos: se paga por las llamadas recibidas y por los datos salientes. Capa gratuita: 1 millón de llamadas al mes durante 12 meses.
- Semana 10 (arquitectura de referencia de microservicios RESTful, Serverless Applications Lens): API Gateway hospeda las solicitudes y respuestas HTTP RESTful y ofrece autorización integrada (built-in authorization), throttling, seguridad, tolerancia a fallos, mapeo de solicitud y respuesta y optimizaciones de rendimiento.
- Semana 14 (lens Serverless, escenario Web application): endpoint HTTPS seguro al que la web hace llamadas REST, con dominio propio o el dominio único que da API Gateway.

### Conceptos clave y componentes

| Concepto | Qué se vio y cómo |
|---|---|
| Tipo de API | API REST (control total de solicitud y respuesta; funciona con Lambda, HTTP y servicios AWS). Tipo de punto de conexión Regional (las optimizadas para la periferia usan CloudFront); tipo de IP IPv4 |
| Recurso | Segmento de ruta: /alumnos, /alumnos/listar. Al crear el recurso padre se marca CORS. Recurso de proxy desactivado |
| Método | POST, GET, PUT, DELETE (más OPTIONS creado por CORS) |
| Integración | Tipo Función de Lambda, región us-east-1; el serverless.yml usa integration: lambda (no proxy): el cuerpo llega como diccionario |
| Plantilla de asignación (mapping template) | En Solicitud de integración, tipo application/json: arma el evento que recibe la Lambda con method, path, headers (Authorization tomado del header de entrada) y body. Se usó en la API productos (semana 10) |
| CORS | Habilitar CORS en cada recurso: respuestas de puerta de enlace Default 4XX y Default 5XX; Access-Control-Allow-Methods (OPTIONS más el método real); Allow-Headers por defecto (Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token); Allow-Origin con asterisco. Al guardar reemplaza la configuración previa |
| Etapa (stage) | prod en los talleres manuales; dev, test y prod con Serverless Framework. La URL incluye la etapa |
| Implementar API (Deploy) | Hay que volver a implementar tras crear o cambiar recursos y métodos |
| URL de invocación | https, id de la API, execute-api, región, amazonaws.com, etapa y ruta. Cada API tiene un id distinto |
| Pruebas | Pestaña Pruebas de la consola (cuerpo de la solicitud, estado y respuesta) |
| Seguridad (teoría) | Autorización integrada y throttling según la arquitectura de referencia |

### Cómo se usó en el laboratorio

Procedimiento manual (semana 9 Taller 2, api-alumnos, 14 pasos):

1. API Gateway, Crear API, tipo API REST, Nueva API, nombre api-alumnos, punto de conexión Regional, IPv4.
2. Crear recurso alumnos (ruta /, proxy desactivado, marcar CORS).
3. Crear recursos hijos listar, crear, modificar, buscar, eliminar.
4. En cada hijo crear el método y asociarlo a su Lambda con integración Función de Lambda (us-east-1).
5. Probar en la pestaña Pruebas (por ejemplo, cuerpo con tenant_id UTEC; se espera 200).
6. Habilitar CORS en cada recurso (4XX y 5XX; métodos OPTIONS más POST, PUT o DELETE según el caso).
7. Implementar API con Nueva etapa llamada prod.
8. Copiar la URL de invocación y probar en Postman (cuerpo raw JSON).

Rutas y métodos de api-alumnos: listar POST, crear POST, modificar PUT, buscar POST, eliminar DELETE. Ejercicio propuesto de la semana 9: buscar2 con GET y parámetros en query string.

API de usuarios y API de productos (semana 10 Taller 1): API usuarios con /usuarios/crear POST y /usuarios/login POST; API productos con /productos/crear POST y plantilla de asignación en la Solicitud de integración para pasar el header Authorization. En el ejercicio propuesto se añaden /productos/listar POST, /buscar POST, /modificar PUT y /eliminar DELETE.

API pedidos (semana 14 Taller 3): /pedidos/registrar POST hacia RegistrarPedido y /pedidos/procesar GET hacia ProcesarPedido (en el propuesto cambia a POST para recibir despachador_id). CORS con Default 4XX, Default 5XX y el método correspondiente; etapa prod.

Con Serverless Framework (semana 10 Taller 2 en adelante) la API se crea sola: el nombre es stage-servicio (por ejemplo dev-api-alumnos), con rutas definidas en el YAML y CORS activado con una opción. Rutas vistas: /alumnos/listar y /alumnos/crear; /s3/lista-buckets GET y /s3/bucket/lista-objetos POST; /comentario/crear POST; /pelicula/crear POST; /scrape/table GET; /alumnos/listar GET en api-alumnos-rds; /images/etiquetas POST.

### Qué lo activa, qué necesita y qué produce

| Entrada | Salida |
|---|---|
| Solicitud HTTPS del cliente (Postman, curl, navegador, front-end) con método, ruta y cuerpo JSON | Invoca la Lambda de la integración y devuelve su resultado como respuesta HTTP |
| Cabecera Authorization (solo API productos) | La plantilla de asignación la copia al evento de la Lambda; la validación la hace la Lambda ValidarTokenAcceso, no API Gateway |
| Método OPTIONS (preflight de CORS) | Responde con los encabezados CORS configurados |

### Con qué otros servicios se combinó en clase

- API Gateway, Lambda y DynamoDB: patrón central de todo el curso (arquitectura de referencia de microservicios RESTful).
- API Gateway, Lambda y SQS: la API registra pedidos en una cola y los despachadores consumen por otra ruta (semana 14).
- API Gateway, Lambda y Rekognition con S3 (semana 15).
- API Gateway, Lambda, SSM y RDS (semana 15).
- Escenario Web application del lens: Cognito para tokens, CloudFront, S3 para estáticos, API Gateway, Lambda y DynamoDB (semana 14, solo teoría).

### Cuándo usarlo, ventajas y limitaciones según el material

- Ventaja: sin pagos mínimos, escala a cualquier volumen, maneja CORS, throttling, autorización y monitoreo.
- Cifra: 1 millón de llamadas gratis al mes durante 12 meses.
- Limitación práctica: cada cambio exige reimplementar (en consola); con el framework un deploy lo hace por ustedes.

### Cómo ponerlo en un diagrama

Caja "API Gateway" entre el cliente y las Lambdas. Flecha del cliente a API Gateway (síncrona, HTTPS) y de API Gateway a cada Lambda (síncrona). Rotule cada flecha con método y ruta (POST /pedidos/registrar). Si hay seguridad, dibuje la Lambda de validación de token o Cognito.

### Errores y trampas vistos en clase

- Olvidar habilitar CORS (en cada recurso) o no marcar el método correspondiente (PUT, DELETE, GET).
- Olvidar implementar la API en la etapa: la URL con prod o dev no refleja los cambios.
- Usar un método HTTP distinto al definido (DELETE y PUT en eliminar y modificar).
- No configurar la plantilla de asignación: la Lambda no recibe el header Authorization.
- Reutilizar la URL de otra cuenta o de otra etapa (cada etapa tiene su propio id y su propia API en el framework).

### Preguntas tipo examen

1. ¿Qué es API Gateway y qué funciones tiene? Puerta de entrada de APIs REST y WebSocket; gestiona tráfico, CORS, autorización, throttling y monitoreo; paga por llamadas y datos.
2. Pasos para publicar una Lambda como API REST. Crear API REST Regional, crear recurso (con CORS), crear método con integración de Función de Lambda, probar, habilitar CORS, implementar en la etapa prod, copiar la URL y probar en Postman.
3. ¿Para qué sirve la plantilla de asignación en el API de productos? Para que la Lambda reciba el header Authorization y el cuerpo en un JSON armado por la plantilla (method, path, headers, body).
4. ¿Qué rutas y métodos tiene el CRUD de alumnos? listar POST, crear POST, modificar PUT, buscar POST, eliminar DELETE, todas bajo /alumnos, cada una además con OPTIONS por CORS.
5. ¿Por qué el nombre de la API cambia por etapa con Serverless Framework? Porque cada stage crea una API y Lambdas distintas (dev-api-s3, test-api-s3, prod-api-s3), con su propia URL.

---
## Amazon DynamoDB

### Qué es (definición del profesor)

- Semana 9 (diapositiva del Taller 1a): base de datos NoSQL de clave-valor, sin servidor (serverless) y completamente administrada, diseñada para aplicaciones de alto rendimiento a cualquier escala. Rendimiento de milisegundos de un solo dígito; capacidad de rendimiento y almacenamiento prácticamente ilimitada; replicación automática en varias regiones; seguridad integrada, cifrado en reposo, copias de seguridad continuas, restauraciones y caché en memoria; SLA de disponibilidad de hasta 99,999 %; escala vertical y horizontalmente de forma automática. Capa gratuita: 25 GB de almacenamiento y hasta 200 millones de solicitudes de lectura y escritura al mes.
- Semana 10 (arquitectura de referencia de microservicios RESTful): DynamoDB almacena persistentemente los datos del microservicio y escala según la demanda. Como los microservicios suelen hacer una sola cosa, se usa un almacén NoSQL sin esquema (schemaless).
- Semana 14 (escenario Web application): almacén NoSQL que escala elásticamente con la aplicación.

### Conceptos clave y componentes

| Concepto | Qué se dijo o se hizo |
|---|---|
| Tabla | Nombre de 3 a 255 caracteres (letras, números, guion bajo, guion y punto) |
| Clave de partición (hash) | Su valor pasa por una función hash interna que decide la partición física (10 GB cada una). Buena práctica: cardinalidad alta (correo, código de cliente, número de sesión, número de orden). Malas: status code, fecha redondeada, device ID con un dispositivo mucho más popular. Evitar claves calientes (hot) |
| Clave de ordenamiento (sort key, RANGE) | Opcional. La clave primaria (partición, o partición más ordenamiento) debe ser única en la tabla. Permite consultas de rango (begins_with, between, mayor que, menor que) y jerarquías con claves compuestas separadas por # |
| Tipos de atributo | String (S), Number (N), Map (M). En la consola se ven como JSON de DynamoDB, por ejemplo S para cadena y N para número |
| Capacidad | Modo Bajo demanda (on-demand): se paga por lecturas y escrituras reales. En el serverless.yml es BillingMode PAY_PER_REQUEST. La alternativa es Aprovisionado |
| GSI (Global Secondary Index) | Índice con clave de partición y de ordenamiento que pueden ser distintas a las de la tabla base (usado en la Alternativa 3 de Matrículas) |
| LSI (Local Secondary Index) | Misma clave de partición que la base, distinta clave de ordenamiento |
| Operaciones usadas desde Lambda | put_item (crea o reemplaza), get_item (por clave completa), query (por clave de partición), update_item (con expresión de actualización y valores devueltos), delete_item, scan (solo en el scraping) |
| Multi-tenancy | Patrón 1 de la teoría: esquema único compartido con tenant_id como clave de partición; equivale a filtrar por tenant en SQL |

Diseño de claves compuestas visto en el Taller 1b (Sistema Académico):

| Tabla o alternativa | Clave de partición | Clave de ordenamiento | Para qué consulta sirve |
|---|---|---|---|
| Alumnos | tenant_id | alumno_id | Alumnos de un tenant |
| Cursos | tenant_id | curso_id | Cursos de un tenant |
| Matrículas, Alternativa 1 | tenant_id#alumno_id | ciclo#curso_id#seccion_id#eval_id | Consultas por alumno (todo un ciclo con begins_with) |
| Matrículas, Alternativa 2 | tenant_id#curso_id | ciclo#seccion_id#alumno_id#eval_id | Consultas por curso |
| Matrículas, Alternativa 3 | Base como Alternativa 1; GSI con tenant_id#curso_id | GSI con ciclo#seccion_id#alumno_id#eval_id | Ambos patrones de acceso, a costa de un índice adicional |

Ítem de ejemplo del Taller 1a (tabla t_alumnos, con atributo mapa alumno_datos):

```json
{
  "tenant_id": "UTEC",
  "alumno_id": "202010290",
  "alumno_datos": {
    "nombre": "Juan Pérez",
    "sexo": "M",
    "fecha_nac": "2004-12-04",
    "celular": "999736371",
    "domicilio": { "distrito": "Monterrico", "provincia": "Lima", "pais": "Perú" }
  }
}
```

### Cómo se usó en el laboratorio

Creación manual (semana 9 Taller 1a):

1. DynamoDB, Crear tabla.
2. Nombre t_alumnos; clave de partición tenant_id (Cadena); clave de ordenación alumno_id (Cadena).
3. Configuración de la tabla: Personalizar configuración; Modo de capacidad: Bajo demanda.
4. Insertar elementos: Explorar elementos de la tabla, Crear elemento, pestaña Vista JSON, pegar el JSON. Se insertaron 3 alumnos de UTEC y 3 de UNIV2 (seis elementos).

Tablas creadas a lo largo del curso:

| Tabla | Clave de partición | Clave de ordenación | Semana / servicio que la usa |
|---|---|---|---|
| t_alumnos | tenant_id (S) | alumno_id (S) | 9, 10, 13 (CRUD de alumnos; en 13 la escribe CrearAlumno antes de publicar en SNS) |
| t_usuarios | user_id (S) | no tiene | 10 (usuarios con password como hash SHA-256) |
| t_tokens_acceso | token (S) | no tiene | 10 (token con atributo expires, 60 minutos) |
| t_productos | tenant_id (S) | producto_id (S) | 10 (API productos protegida) |
| dev-t_comentarios, test-t_comentarios, prod-t_comentarios | tenant_id (S) | uuid (S, UUID v1) | 11 (creadas por el serverless.yml en la sección resources, una por stage) |
| dev-t_peliculas | tenant_id (S) | uuid (S) | 12 (api-pelicula) |
| TablaWebScrapping | id (S) | no tiene | 12 (scraping de Bomberos; 123 elementos) |
| t_alumnos_canvas | tenant_id (S) | alumno_id (S) | 13 Taller 1 (consumidor Canvas) |
| t_alumnos_seguridad | tenant_id | alumno_id (se asume igual que Canvas) | 13 propuesto (consumidor Seguridad) |
| t_archivos_UTEC | tenant_id (S) | archivo_id (S) | 13 Taller 2 |
| t_pedidos_procesados | tenant_id (S) | pedido_id (N, número) | 14 Taller 3 |
| t_sensor_iot_FAB1 | tenant_id (S) | lectura_id (S) | 14 Taller 4 |

Con Serverless Framework (semanas 11 y 12) la tabla se crea desde el serverless.yml: en la sección resources se declara un recurso de tipo tabla DynamoDB con nombre dependiente del stage, definición de atributos (solo los que son clave), esquema de claves (HASH y RANGE) y facturación por solicitud. Se elimina con serverless remove.

### Qué lo activa, qué necesita y qué produce

| Entrada | Salida |
|---|---|
| put_item con el ítem completo (debe incluir todas las claves) | Crea o reemplaza; no falla si ya existe |
| get_item con clave completa | Devuelve el ítem (Item) o nada si no existe; las Lambdas devolvían 404 en los ejemplos de buscar |
| query por tenant_id | Lista de ítems (Items) y cantidad (Count); es la operación que materializa el aislamiento por tenant |
| update_item con clave, expresión y valores | Devuelve los atributos actualizados (UPDATED_NEW) |
| delete_item con clave | Elimina el ítem |
| scan | Recorre toda la tabla; solo se usó en el scraping para vaciar la tabla antes de reescribir |

Nota del material: en put_item los números decimales (float) no se aceptan con el recurso de alto nivel de boto3; por eso los precios del pedido se enviaron como cadenas.

### Con qué otros servicios se combinó en clase

- API Gateway y Lambda: CRUD multi-tenant (semanas 9 a 12) y API productos con token.
- Lambda disparada por SNS o SQS que guarda el evento: t_alumnos_canvas, t_archivos_UTEC, t_sensor_iot_FAB1 (semanas 13 y 14).
- Lambda que lee de SQS y guarda en t_pedidos_procesados (semana 14).
- Serverless Framework: tabla creada por stage con nombre según la variable de stage.
- S3: el comentario se guarda en DynamoDB y además como archivo en el bucket de ingesta (semana 11).

### Cuándo usarlo, ventajas y limitaciones según el material

- Ventajas: sin servidor, escala solo, milisegundos, pago por solicitud en modo bajo demanda, esquema flexible (ideal para microservicios que hacen una sola cosa).
- Cifras: partición de 10 GB; SLA 99,999 %; capa gratuita 25 GB y 200 millones de solicitudes al mes.
- Diseño: elegir la clave según el patrón de acceso (Matrículas Alternativa 1, 2 o 3 con GSI); usar # para claves compuestas; tenant_id siempre como prefijo.
- Contraste visto en el proyecto final: si la solución necesita SQL se usa un único RDS con el patrón 2 de multi-tenancy; si es NoSQL se usa DynamoDB.
- Limitaciones: el material no presenta una lista formal de desventajas. Lo que sí se vio es que el diseño de las claves depende del patrón de acceso (por eso la Alternativa 3 de Matrículas añade un GSI para consultar por dos criterios).

### Cómo ponerlo en un diagrama

Caja "DynamoDB" con el nombre de la tabla y sus claves (por ejemplo, t_pedidos_procesados PK tenant_id SK pedido_id). Flecha desde la Lambda hacia la tabla (síncrona). Cada microservicio tiene su propia tabla (regla del proyecto final: una base por microservicio).

### Errores y trampas vistos en clase

- Usar tipo Número en lugar de Cadena para las claves, o escribir tenant_id en minúsculas cuando el enunciado lo exige en mayúsculas.
- Elegir una clave de partición de baja cardinalidad (hot partition).
- Olvidar una de las claves al insertar (put_item exige la clave completa).
- En el serverless.yml, definir en los atributos columnas que no son clave.
- Poner el mismo nombre de tabla en varios stages (por eso se antepone el stage).
- Enviar números decimales a put_item (usar cadenas).

### Preguntas tipo examen

1. ¿Qué es DynamoDB? Base de datos NoSQL clave-valor, serverless y administrada, de milisegundos y con escalado automático; SLA 99,999 %.
2. ¿Cómo se implementó el patrón 1 de multi-tenancy? Tabla t_alumnos con clave de partición tenant_id y ordenamiento alumno_id, modo bajo demanda; query por tenant_id equivale a WHERE TENANT_ID.
3. Diseñe una tabla para consultar matrículas por alumno y por curso. Tabla base con partición tenant_id#alumno_id y ordenamiento ciclo#curso_id#seccion_id#eval_id, más un GSI con partición tenant_id#curso_id y ordenamiento ciclo#seccion_id#alumno_id#eval_id.
4. Diferencia entre GSI y LSI. GSI: otra clave de partición y de ordenamiento; LSI: misma clave de partición, distinta de ordenamiento.
5. ¿Qué es una buena clave de partición? Alta cardinalidad y distribución uniforme (correo, código de cliente); mala: status code o fecha redondeada.

---

## Amazon S3

### Qué es (definición del profesor)

- Semana 10 (capa de almacén de datos serverless): servicio de almacenamiento de objetos para almacenar y proteger cualquier cantidad de datos (marcado como servicio principal de la clase).
- Semana 14 (escenario Web application): aloja los activos estáticos de la aplicación web (HTML, CSS, JavaScript, imágenes), servidos de forma segura vía CloudFront.
- Semana 10 (ejemplos): origen de eventos que disparan Lambdas en tiempo real tras una carga (por ejemplo, redimensionar fotos para web, móvil y tablet; procesar archivos Markdown; indexar documentos).

### Conceptos clave y componentes

| Concepto | Qué se vio |
|---|---|
| Bucket | Contenedor con nombre único global (no se puede repetir; por eso se antepuso stage y número de cuenta, o un nombre propio como gcolchado3) |
| Objeto y clave (key) | Un objeto se identifica por su clave completa (por ejemplo, universidades/UTEC/archivo01.txt) |
| "Directorio" o carpeta | Es un objeto vacío cuya clave termina en barra; en clase se crearon con la consola y con put_object con clave terminada en / |
| Notificación de eventos | En Propiedades del bucket, Crear notificación de eventos: nombre, tipo de evento (todos los eventos de creación de objetos, es decir ObjectCreated), destino (Función Lambda) |
| Evento ObjectCreated | Registro con eventName (por ejemplo ObjectCreated:Put), eventTime, bucket.name, object.key, object.size y eTag |
| Clave codificada | En los eventos S3 la clave llega codificada como URL (espacios como +); la solución propuesta usa unquote_plus |
| Prefijos | Se usó el segundo segmento de la ruta como tenant (universidades/TENANT/archivo) |

### Cómo se usó en el laboratorio

- Semana 11 Taller 3 (Paso 0): crear buckets y carpetas para el supermercado: catalogo-productos (imagenes-chicas, imagenes-medianas), documentos-ventas (boletas, facturas), documentos-compras (ordenes-compra, facturas, guias-remision) y subir imágenes. Luego las Lambdas lista_buckets y lista_objetos_bucket los listan por API; en el ejercicio propuesto se añaden crear_bucket, crear_directorio y subir_archivo (despliegue en dev, test y prod y prueba con curl).
- Semana 11 Taller 4 (propuesto): crear un bucket de ingesta por stage desde el serverless.yml (nombre stage más ingesta más ID de cuenta) y guardar el JSON del comentario como archivo tenant_id/uuid.json (estrategia de ingesta Push: la aplicación empuja el dato al bucket).
- Semana 13 Taller 2: crear el bucket (gcolchado3) con carpeta universidades y subcarpetas UNIV2, UNIV3 y UTEC; en Propiedades, Crear notificación de eventos con nombre NuevoArchivo, tipo ObjectCreated y destino la Lambda LeerMetadataArchivo (el enunciado dice archivos .txt; el filtro de sufijo no se aprecia en las capturas). Subir archivo01.txt a universidades/UTEC/ y revisar los logs.
- Semana 15 Taller 1: crear el bucket gcr-data-01 con prefijo images/ y subir las imágenes que Rekognition analizará (landscape_resized.jpg, skateboard_resized.jpg).
- Observación: al listar buckets en la semana 11 aparecieron buckets de despliegue del framework (con nombre serverlessdeploymentbucket), lo que muestra que Serverless Framework crea un bucket de apoyo para subir el paquete (no se explicó en clase).

### Qué lo activa, qué necesita y qué produce

| Entrada | Salida |
|---|---|
| Subida de un objeto (consola o put_object) | Evento ObjectCreated hacia la Lambda configurada en el bucket |
| Lambda con put_object (Body en bytes) | Crea el archivo o el "directorio" |
| Rekognition con la ubicación (bucket y clave) | Lee directamente la imagen del bucket; la Lambda no la descarga |

### Con qué otros servicios se combinó en clase

- S3, Lambda, SNS, correo y DynamoDB (semana 13): bucket, Lambda LeerMetadataArchivo, tema TemaNuevoArchivo, suscripciones de correo y de Lambda hacia t_archivos_UTEC.
- S3 y Rekognition vía Lambda (semana 15).
- Serverless Framework crea buckets en la sección resources (semana 11).
- Ejemplos de teoría (semana 10): S3, evento y SNS hacia dos colas SQS (conversión Markdown a HTML y análisis de sentimiento con Comprehend); S3 hacia Lambda que redimensiona imágenes; front-end estático en S3 con API Gateway, Lambda y DynamoDB; buckets de resultados intermedios en el flujo por lotes con Step Functions.

### Cuándo usarlo, ventajas y limitaciones según el material

- Ideal para guardar objetos (archivos, imágenes, JSON de ingesta) y como disparador de procesos por evento sin servidores.
- Limitaciones vistas: el nombre del bucket es único global; el evento puede llegar para cualquier prefijo si no se filtra; los "directorios" son solo parte de la clave.
- El material no da cifras de límites ni de precios de S3.

### Cómo ponerlo en un diagrama

Caja "S3 bucket". Flecha de evento ObjectCreated hacia una Lambda (asíncrona). Si es ingesta, flecha desde la Lambda a S3 (put_object). Si es hosting, flecha desde el cliente (o CloudFront) hacia S3.

### Errores y trampas vistos en clase

- Que la notificación apunte a un bucket o prefijo distinto: la Lambda no se dispara.
- Asumir split por barra sin respetar la estructura universidades/TENANT/archivo.
- No decodificar la clave (unquote_plus) cuando tiene espacios o caracteres especiales.
- Repetir un nombre de bucket (único global) al desplegar varios stages.
- list_objects falla con KeyError si el bucket está vacío (la versión del ejercicio propuesto comprueba antes que exista el campo Contents).

### Preguntas tipo examen

1. ¿Qué es S3? Almacenamiento de objetos para guardar y proteger cualquier cantidad de datos.
2. ¿Cómo hace S3 para disparar una Lambda? Con una notificación de eventos del bucket (por ejemplo, todos los eventos de creación de objetos) cuyo destino es la función.
3. ¿Qué campos del evento S3 usó LeerMetadataArchivo? key, size, bucket name y eventTime; el tenant sale del segundo segmento de la clave.
4. ¿Qué es la ingesta Push? La aplicación (la Lambda) empuja el dato (el JSON del comentario) a un bucket S3 de ingesta.
5. ¿Cómo se crea un directorio en S3 con código? Con put_object cuya clave termina en barra.

---

## Amazon SNS

### Qué es (definición del profesor)

- Semana 10: servicio de mensajería completamente administrado para comunicación aplicación a aplicación (A2A) y aplicación a persona (A2P).
- Semana 13 (Taller 1): SNS es mensajería de publicación y suscripción (pub/sub) con notificaciones push móviles, correo y SMS. A2A: temas para mensajería de alto rendimiento, de muchos a muchos, basada en push entre sistemas distribuidos, microservicios y aplicaciones serverless; entrega a colas SQS, funciones Lambda, puntos de enlace HTTP/S y Kinesis Data Firehose. A2P: envía notificaciones push a apps móviles, mensajes de texto y correos.
- Semana 13 (teoría): SNS es uno de los dos enrutadores de eventos en AWS (junto con EventBridge). Crea temas de eventos; es la opción para eventos de alto rendimiento y baja latencia o gran difusión (miles o millones de puntos de conexión); los temas son independientes del esquema del evento.
- Semana 14 (lens Serverless): SNS topics para fan-out de eventos.

### Conceptos clave y componentes

| Concepto | Qué se dijo en clase |
|---|---|
| Tema (topic) | Canal al que se publica. Nombre hasta 256 caracteres (alfanuméricos, guion y guion bajo). Tiene un ARN con la forma arn:aws:sns, región, cuenta y nombre |
| Tipo de tema | Estándar o FIFO; no se puede cambiar una vez creado. En el curso siempre Estándar |
| Suscripción | Protocolo más punto de enlace: Correo electrónico (hay que confirmar el enlace del correo), AWS Lambda (ARN de la función), Amazon SQS (ARN de la cola), HTTP/S, SMS, aplicaciones móviles, Kinesis Data Firehose |
| Atributos del mensaje (MessageAttributes) | El publicador adjunta atributos con tipo (String o Number; el valor se envía como texto); son lo que evalúan los filtros |
| Política de filtro de suscripción | JSON de la suscripción: cada clave es un atributo y su valor una lista de valores aceptados, o una condición numérica. Si no coincide, el mensaje no se entrega a esa suscripción |
| Fan-out | Un mensaje publicado una vez se reparte a todos los suscriptores |
| Dead-letter queue de SNS | Aparece en el diagrama de la teoría: si un endpoint no está disponible los mensajes pueden retenerse para análisis o reprocesamiento (no se configuró en clase) |
| Push móvil | Crear una platform application, agregar endpoints (dispositivos) y publicar (solo teoría) |

Tipos de tema:

| Aspecto | Estándar | FIFO |
|---|---|---|
| Orden | Mejor esfuerzo | Estrictamente conservado |
| Entrega | Al menos una vez | Entrega única (sin duplicados) |
| Rendimiento | Mayor número de publicaciones por segundo | Alto, hasta 300 publicaciones por segundo |
| Protocolos de suscripción | SQS, Lambda, HTTP, SMS, correo, aplicaciones móviles | Solo SQS |

Reglas de las políticas de filtro (deducidas de los diagramas del taller): claves distintas se combinan con AND (deben cumplirse todas); varios valores en la lista de una clave se combinan con OR. El único operador numérico mostrado en clase es "mayor que".

Forma de un mensaje publicado por la Lambda (atributos usados en la semana 14):

```json
{
  "Subject": "Nueva Lectura Sensor",
  "Message": "{\"tenant_id\": \"FAB1\", \"lectura_id\": \"CO2.2022-10-26.01:45:48\", \"lectura_datos\": {\"medicion\": 807, \"unidad_medida\": \"PPM\"}}",
  "MessageAttributes": {
    "tenant_id": { "DataType": "String", "StringValue": "FAB1" },
    "sensor_id": { "DataType": "String", "StringValue": "CO2" },
    "medicion": { "DataType": "Number", "StringValue": "807" }
  }
}
```

Filtros usados en el curso:

```json
{ "tenant_id": ["UTEC"] }
```

```json
{
  "tenant_id": ["FAB1"],
  "sensor_id": ["CO2"],
  "medicion": [ { "numeric": [">", 800] } ]
}
```

### Cómo se usó en el laboratorio

Semana 13 Taller 1, evento Nuevo Alumno en UTEC:

1. SNS, Crear un tema, tipo Estándar, nombre NuevoAlumno.
2. Modificar la Lambda CrearAlumno para que, tras guardar en t_alumnos, publique en el tema con asunto Nuevo Alumno, mensaje con el JSON del alumno y atributo tenant_id (hay que poner el ARN del propio tema).
3. Suscripción de correo al tema: protocolo Correo electrónico, punto de enlace un gmail, activar Política de filtro de suscripciones, filtro tenant_id igual a UTEC. Confirmar el correo.
4. Crear la tabla t_alumnos_canvas (partición tenant_id, ordenación alumno_id, ambas String) y la Lambda CrearAlumno_Canvas que lee el mensaje de SNS y guarda tenant_id, alumno_id y nombre.
5. Suscripción Lambda al tema (protocolo AWS Lambda, ARN de la función) con el mismo filtro UTEC.
6. Prueba positiva (alumno UTEC): llega correo y se graba en t_alumnos_canvas. Prueba negativa (UNIV2): no llega correo ni se graba en Canvas (pero sí en t_alumnos porque la guarda CrearAlumno directamente).
7. Propuesto: tercera suscripción Lambda con filtro UTEC para CrearAlumno_Seguridad, que guarda nombre y celular en t_alumnos_seguridad. No se modifica la Lambda publicadora.

Semana 13 Taller 2, evento Nuevo Archivo en UTEC: tema Estándar TemaNuevoArchivo; la Lambda LeerMetadataArchivo (disparada por S3) publica con atributo tenant_id; suscripción de correo con filtro UTEC (el diagrama dice correo al docente); tabla t_archivos_UTEC (tenant_id, archivo_id); Lambda CrearArchivo_UTEC suscrita con filtro UTEC. Un archivo subido a UTEC genera correo y registro; uno subido a UNIV2 no genera ninguno.

Semana 14 Taller 4, evento Nueva Lectura Sensor IoT:

1. Crear el tema TemaSensorIoT y guardar su ARN.
2. Lambda GenerarEventoSensorIoT: simula un sensor de CO2 (tenant FAB1, lectura aleatoria de 400 a 1000 PPM) y publica con tres atributos (tenant_id, sensor_id y medicion de tipo Number).
3. Suscripción de correo con el filtro 1 (FAB1 y CO2 y medición mayor que 800).
4. Cola SQS ColaSensorIoTFAB1 con política de acceso que permite al tema enviarle mensajes, suscrita al tema con el filtro 2 (solo tenant_id FAB1), que dispara la Lambda InsertarEventoSensorIoT hacia t_sensor_iot_FAB1.
5. La regla de EventBridge SimuladorSensorIoT dispara la generación cada minuto; tras unos 6 minutos llegan correos solo de lecturas mayores a 800 y la tabla guarda todas las lecturas de FAB1.
6. Propuesto: añadir sensor TEMP (10 a 60 grados, unidad CELSIUS) y un segundo correo con filtro FAB1, TEMP y medición mayor que 40.

### Qué lo activa, qué necesita y qué produce

| Entrada | Salida |
|---|---|
| Lambda (u otro servicio) que publica con tema, asunto, mensaje (texto JSON) y atributos | Entrega copia del mensaje a cada suscripción cuyo filtro coincida |
| Suscripción de correo | Correo con asunto Nuevo Archivo, remitente AWS Notifications y cuerpo igual al JSON publicado |
| Suscripción Lambda | Invoca la función con un evento cuyo Records, Sns, Message es el texto JSON |
| Suscripción SQS | Deja el mensaje en la cola como un sobre JSON de SNS (su campo Message contiene el evento); requiere política de acceso de la cola |

Qué necesita: permiso de la Lambda para publicar en el tema (con LabRole funcionó), ARN del tema correcto, atributos si hay filtros y confirmación del correo.

Fuentes que publican en SNS (teoría de semana 13): CloudWatch Alarms, AWS Budgets, Lambda, notificaciones de Auto Scaling, eventos de S3, DynamoDB, cambios de estado de CloudFormation, AWS DMS, eventos de RDS.

### Con qué otros servicios se combinó en clase

- Lambda publicadora y suscriptora, DynamoDB, correo (semana 13 Taller 1).
- S3, Lambda, SNS, correo y Lambda hacia DynamoDB (semana 13 Taller 2).
- EventBridge programado, Lambda, SNS, correo y SQS hacia Lambda y DynamoDB (semana 14 Taller 4).
- Teoría: SNS, varias colas SQS (fan-out, una cola por consumidor: Fraud y Shipping); ejemplo de procesamiento de datos con S3, SNS, SQS, Lambda, Comprehend y DLQ con alarma de CloudWatch que notifica por SNS; flujo por lotes que termina enviando correo por SNS.

### Cuándo usarlo, ventajas y limitaciones según el material

- Cuándo: fan-out (un mensaje a muchos receptores), alertas a personas (correo, SMS, push), integración de sistemas heterogéneos, procesamiento en paralelo.
- Ventaja: el productor no conoce a los consumidores; se puede añadir un suscriptor (Seguridad) sin tocar la Lambda productora.
- Cifras: tema FIFO hasta 300 publicaciones por segundo; nombre de tema de hasta 256 caracteres.
- Limitaciones: el tipo de tema no puede cambiarse; si falta el atributo el filtro no puede evaluarse (inferencia del resumen de estudio: el mensaje no llegaría a la suscripción filtrada); los temas FIFO solo admiten SQS.

### Cómo ponerlo en un diagrama

Caja "SNS Topic" con el nombre del tema. Flecha asíncrona del publicador al tema; del tema salen tantas flechas como suscriptores (correo, Lambda, SQS) y sobre cada flecha se escribe el filtro (tenant_id igual a UTEC). Si el suscriptor es una cola, la cola va entre SNS y la Lambda consumidora.

### Errores y trampas vistos en clase

- No confirmar el enlace del correo: la suscripción queda pendiente.
- Olvidar MessageAttributes (tenant_id) al publicar: el filtro no actúa.
- Leer event con tenant_id directamente en la Lambda suscrita: el evento viene envuelto en Records, Sns, Message y hay que convertirlo con json.loads.
- Olvidar la política de acceso de la cola SQS: SNS no puede escribirle y la tabla queda vacía.
- Filtro mal escrito: los valores van en listas; el numérico es numeric con operador.
- Usar el TopicArn de otra cuenta.

### Preguntas tipo examen

1. ¿Qué es SNS y qué significan A2A y A2P? Mensajería pub/sub administrada; A2A entre aplicaciones (SQS, Lambda, HTTP, Firehose); A2P hacia personas (SMS, correo, push).
2. ¿Cómo logra que solo UTEC reciba la notificación? El publicador adjunta el atributo tenant_id y cada suscripción lleva un filtro tenant_id con valor UTEC.
3. ¿Qué es el patrón pub/sub fan-out? Un productor publica una vez en un tema y SNS reparte a todos los suscriptores; evita integraciones directas productor-receptor.
4. Diferencie tema Estándar y FIFO. Estándar: mejor esfuerzo de orden, al menos una vez, mayor rendimiento, varios protocolos. FIFO: orden estricto, entrega única, 300 publicaciones por segundo, solo SQS.
5. ¿Por qué InsertarEventoSensorIoT usa json.loads dos veces? Porque la cola entrega en body el sobre JSON de SNS y el evento real está como texto en su campo Message.

---

## Amazon SQS y DLQ

### Qué es (definición del profesor)

- Semana 10: servicio de colas de mensajes que permite desacoplar y escalar microservicios, sistemas distribuidos y aplicaciones sin servidor (marcado como servicio principal).
- Semana 14 (Taller 3): colas de mensajes completamente administradas; elimina la complejidad del middleware orientado a mensajes; permite enviar, almacenar y recibir mensajes entre componentes de cualquier volumen sin pérdida de mensajes ni necesidad de que otros servicios estén disponibles. Se usa desde consola, CLI o SDK.
- Semana 14 (lens): SQS para comunicación confiable y duradera entre microservicios.
- DLQ (cola de mensajes fallidos): tipo especial de cola que almacena temporalmente los mensajes que un sistema de software no puede procesar debido a errores.

### Conceptos clave y componentes

| Concepto | Qué se vio |
|---|---|
| Cola Estándar | Orden de mejor esfuerzo (no se conserva el orden), entrega al menos una vez, máxima capacidad de procesamiento. Es la que se usó siempre |
| Cola FIFO | Primero en entrar, primero en salir; procesamiento único |
| Tipo inmutable | La consola avisa: no se puede cambiar el tipo de cola después de crearla |
| Nombre de cola | Distingue mayúsculas, hasta 80 caracteres; alfanuméricos, guiones y guiones bajos |
| Mensaje | Cuerpo de texto (en clase, un JSON serializado) |
| Mensajes disponibles / en tránsito | Disponibles = listos para recibirse; en tránsito = recibidos por un consumidor pero aún no borrados |
| URL de la cola | https, sqs, región, amazonaws.com, número de cuenta y nombre de la cola; se pone en el código (queue_url) |
| Recibir con long polling | La Lambda ProcesarPedido pide hasta 3 mensajes y espera hasta 10 segundos (espera larga) |
| Borrar el mensaje | Tras procesar, se borra con el identificador de recibo (receipt handle); si no se borra, el mensaje reaparece |
| Desencadenador de Lambda (trigger) | En la cola, pestaña Desencadenadores de Lambda: la cola dispara la función (consumo automático, a diferencia del pull) |
| Cola de mensajes fallidos (DLQ) | Se configura en la cola origen: Habilitada, ARN de la DLQ y Recepciones máximas (1 a 1000) |
| Recepciones máximas | Cuántas veces puede recibirse un mensaje sin borrarse antes de moverse a la DLQ; en clase 2 |
| Política de acceso | Política de la cola que permite que SNS le envíe mensajes (condición por ARN de origen) |

Nota del material: el tiempo de visibilidad (visibility timeout) no se explica en las diapositivas. Solo se observó que los reintentos de la Lambda fallida ocurrieron cada 30 segundos.

Política de acceso de la cola que permite a SNS enviar (Taller 4, solo ese tema puede escribir en la cola):

```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "sns.amazonaws.com" },
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:CUENTA:ColaSensorIoTFAB1",
      "Condition": {
        "ArnEquals": { "aws:SourceArn": "arn:aws:sns:us-east-1:CUENTA:TemaSensorIoT" }
      }
    }
  ]
}
```

### Cómo se usó en el laboratorio

Semana 14 Taller 3, Ejercicio 1, despacho de pedidos (arquitectura desacoplada y asíncrona):

1. SQS, Crear una cola, tipo Estándar, nombre sqs-pedidos.
2. Crear la Lambda RegistrarPedido con timeout de 20 s y poner la URL de la propia cola; recibe el pedido, lo convierte en texto y lo envía a la cola.
3. Crear la API pedidos con el recurso /pedidos/registrar, método POST hacia esa Lambda y CORS.
4. Probar en Postman con los cinco pedidos de PLAZA_VEA (pedido_id 1 a 5) y verificar que la cola muestra Mensajes disponibles 1 y luego 5.
5. Crear la tabla t_pedidos_procesados (tenant_id String, pedido_id Número).
6. Crear la Lambda ProcesarPedido con timeout 20 s: recibe hasta 3 mensajes con espera de 10 s, guarda cada pedido en DynamoDB y borra el mensaje.
7. En API pedidos crear /pedidos/procesar con método GET y CORS; ejecutarla en Postman simulando a los Despachadores 1, 2 y 3. El Despachador 1 recibió los pedidos 1 y 4 (no 1, 2 y 3): cola estándar sin orden garantizado; cada mensaje borrado no llega a otro despachador.
8. Propuesto: ProcesarPedido recibe despachador_id (DESP-01, DESP-02, DESP-03), lo guarda en la tabla, el método pasa a POST y la respuesta incluye la cantidad de pedidos procesados.

Semana 14 Taller 3, Ejercicio 3, DLQ (registro de alumno en Canvas):

1. Crear la cola sqs-registrar-canvas-dlq.
2. Crear la cola sqs-registrar-canvas y activar Cola de mensajes fallidos: Habilitada, elegir el ARN de la DLQ, Recepciones máximas 2.
3. Crear la Lambda RegistrarCanvas que imprime el evento y lanza una excepción a propósito.
4. En la cola sqs-registrar-canvas configurar el desencadenador de Lambda hacia RegistrarCanvas.
5. Enviar un mensaje (JSON de alumno de UTEC) desde Enviar y recibir mensajes y validar en CloudWatch los 2 intentos con error cada 30 segundos y que aparece un mensaje en sqs-registrar-canvas-dlq (Mensajes disponibles 1).

Semana 14 Taller 4: cola ColaSensorIoTFAB1 con trigger a InsertarEventoSensorIoT, política de acceso para el tema y suscripción al tema con filtro tenant_id FAB1 (ver SNS).

### Qué lo activa, qué necesita y qué produce

| Entrada | Salida |
|---|---|
| Lambda productora (send_message) o suscripción SNS | Mensaje almacenado hasta que alguien lo consuma |
| Consumidor por pull (Lambda ProcesarPedido: recibe, procesa, borra) | Hasta 3 mensajes por invocación; el mensaje borrado desaparece |
| Trigger Lambda | La función recibe Records con body; si termina bien se borra; si lanza excepción, vuelve a la cola |
| Mensaje que supera las recepciones máximas | Se mueve a la DLQ y queda disponible para análisis o reproceso |

### Con qué otros servicios se combinó en clase

- API Gateway, Lambda, SQS, Lambda, DynamoDB (pedidos).
- SNS, SQS, Lambda, DynamoDB (fan-out SNS más SQS del Taller 4); en teoría, un tema con varias colas (una por consumidor).
- DLQ con CloudWatch para validar reintentos (Taller 3); en teoría, DLQ con alarma de CloudWatch y notificación por SNS.
- Ejemplos de la semana 10: colas SQS como fuente de las Lambdas de conversión y de análisis de sentimiento.

### Cuándo usarlo, ventajas y limitaciones según el material

- Cuándo: desacoplar productor y consumidor, absorber picos, no perder mensajes aunque el consumidor esté caído, repartir trabajo entre consumidores competidores (despachadores).
- Ventajas: cada consumidor procesa a su ritmo; con DLQ los mensajes que fallan no se pierden (pilar de Fiabilidad, REL 2 del lens).
- Limitaciones: cola estándar no garantiza orden y puede entregar más de una vez (hay que borrar el mensaje); el tipo no se puede cambiar; el nombre de la cola tiene como máximo 80 caracteres.

### Cómo ponerlo en un diagrama

Caja "SQS Cola" con el nombre. Flecha asíncrona de la Lambda productora (o de SNS) hacia la cola; de la cola a la Lambda consumidora (por trigger o por pull). La DLQ es otra caja de cola conectada a la cola principal con una flecha rotulada "tras 2 recepciones fallidas".

### Errores y trampas vistos en clase

- Olvidar cambiar queue_url por la URL de la cola propia.
- Dejar el timeout en 3 s con espera larga de 10 s.
- No borrar el mensaje: reaparece y otro consumidor lo repite.
- No habilitar la DLQ o poner mal su ARN; olvidar el trigger de Lambda; esperar menos de un minuto para ver los reintentos.
- Confundir reintentos con "Recepciones máximas" (la consola usa ese nombre).
- Olvidar la política de acceso cuando la cola recibe de SNS.
- No tener en cuenta que el cuerpo viene envuelto (sobre de SNS).

### Preguntas tipo examen

1. ¿Qué es SQS y qué tipos de cola hay? Servicio de colas administrado que desacopla y escala; Estándar (al menos una vez, mejor esfuerzo de orden) y FIFO (primero en entrar primero en salir, procesamiento único).
2. ¿Qué es una DLQ y cómo se configuró? Cola que guarda los mensajes que no se pudieron procesar; en la cola origen se habilitó la cola de mensajes fallidos con su ARN y Recepciones máximas igual a 2.
3. ¿Por qué el Despachador 1 recibió los pedidos 1 y 4? Cola estándar sin orden garantizado; una recepción puede devolver menos mensajes; cada mensaje borrado ya no se entrega a otros.
4. ¿Por qué el timeout de ProcesarPedido es 20 s? Porque espera hasta 10 s en la lectura de la cola.
5. Describa el consumo por pull frente al trigger. Pull: la Lambda llama a recibir y borra. Trigger: la cola dispara la Lambda con Records y el borrado es automático si no hay error.

---

## Amazon EventBridge

### Qué es (definición del profesor)

- Semana 10: bus de eventos sin servidor para crear aplicaciones basadas en eventos y escalar en AWS y sistemas existentes (capa de integración de la aplicación). En el ejemplo de procesamiento por lotes, una regla programada de EventBridge dispara el flujo.
- Semana 13 (teoría): uno de los dos enrutadores de eventos (el otro es SNS). Crea buses de eventos; es la opción para aplicaciones que reaccionan a eventos de SaaS, de servicios AWS o de aplicaciones propias; usa un esquema predefinido y permite reglas aplicadas a todo el cuerpo del evento para filtrarlo antes de enviarlo a los consumidores (la diapositiva destaca "launched in July 2019").
- Semana 14 (lens): EventBridge si se necesita filtrado y ruteo de eventos. Una arquitectura dirigida por eventos tiene tres partes: fuentes de eventos, ruteadores de eventos (reglas que coinciden con partes del evento y los envían a destinos, descritas con EventBridge) y destinos.
- Semana 12 (teoría de CloudWatch): se menciona CloudWatch Events para automatizar la respuesta a cambios operativos.

### Conceptos clave y componentes

| Concepto | Qué se vio |
|---|---|
| Bus de eventos | Default (el que usan los servicios de AWS), custom (propio) y partner (de aplicaciones SaaS) |
| Regla | Dos tipos en la consola: Programar (horario periódico) y Regla con un patrón de eventos. En clase solo se usó Programar |
| Programación | Horario con frecuencia periódica; en el taller, valor 1, unidad minutos |
| Destino (target) | Servicio de AWS, por ejemplo Función Lambda. La teoría lista muchos: Lambda, Step Functions, SNS, SQS, Kinesis, API Gateway, CloudWatch Log Group, otro bus, API Destination, entre otros |
| Permisos | Al usar la consola, EventBridge configura automáticamente los permisos del destino |

### Cómo se usó en el laboratorio

Semana 14 Taller 4, regla SimuladorSensorIoT:

1. EventBridge, Crear regla.
2. Definición: nombre SimuladorSensorIoT, bus de eventos default, regla habilitada, tipo de regla Programar.
3. Definir programación: horario con frecuencia periódica, valor 1, unidad Minutos.
4. Seleccionar destino: tipo Servicio de AWS, Función Lambda, GenerarEventoSensorIoT.
5. Crear regla. Esperar unos 6 minutos y verificar correos y tabla.

Propuesta (no vista en clase, semana 15, rotación de secretos): una regla programada de EventBridge cada 10 minutos que invoque una Lambda de rotación. El enunciado recomienda este diseño; el detalle de configuración no está en el material.

### Qué lo activa, qué necesita y qué produce

| Entrada | Salida |
|---|---|
| Cron o frecuencia de la regla (o un evento que coincide con un patrón) | Invoca el destino; en el taller, la Lambda ignora el contenido del evento |
| Evento de una fuente (AWS, aplicación propia, SaaS) | Se filtra con reglas y se enruta a los destinos |

### Con qué otros servicios se combinó en clase

- EventBridge, Lambda, SNS, correo y SQS (semana 14 Taller 4).
- Teoría semana 10: regla programada, Step Functions con Lambdas, S3 y SNS (procesamiento por lotes).
- Teoría semana 14: bus default, custom o partner, reglas y múltiples destinos.

### Cuándo usarlo, ventajas y limitaciones según el material

- Cuándo: tareas programadas, enrutar eventos con reglas sobre el cuerpo, integrar SaaS, aplicaciones con eventos de varios orígenes.
- Frente a SNS: EventBridge usa un esquema predefinido y reglas sobre todo el cuerpo; SNS es independiente del esquema y apunta a alto rendimiento, baja latencia y gran difusión.
- Lectura complementaria (lens Serverless de la semana 14, no vista en clase): EventBridge puede añadir latencia; si es crítica se usan SNS y SQS para filtrado y ruteo.

### Cómo ponerlo en un diagrama

Caja "EventBridge (regla programada)" con la frecuencia escrita (cada 1 minuto). Flecha asíncrona hacia la Lambda destino. Si es un bus de eventos, dibujar fuentes, bus, reglas y destinos.

### Errores y trampas vistos en clase

- Elegir el tipo de regla equivocado (se necesitaba Programar, no patrón de eventos).
- Esperar poco tiempo: la verificación de correos pide unos 6 minutos (las lecturas son aleatorias).
- Dejar la regla habilitada: seguirá invocando la Lambda cada minuto mientras exista (consecuencia de su definición; el material no lo menciona).

### Preguntas tipo examen

1. ¿Qué es EventBridge y en qué se diferencia de SNS? Bus de eventos con esquema predefinido y reglas sobre todo el cuerpo; SNS es un tema independiente del esquema, de alto rendimiento y gran difusión.
2. ¿Cómo se simuló el sensor y se disparó periódicamente? Una regla de EventBridge de tipo Programar con frecuencia de 1 minuto invoca la Lambda GenerarEventoSensorIoT.
3. ¿Cuáles son las tres partes de una arquitectura de eventos? Fuentes, ruteadores (reglas) y destinos.

---
## Amazon CloudWatch (Logs, métricas, Logs Insights y observabilidad)

### Qué es (definición del profesor)

- Semana 12 (teoría 1a): Amazon CloudWatch es un servicio de monitoreo y observabilidad creado para desarrolladores, SRE, administradores de TI, propietarios de productos e ingenieros de DevOps ("observación de sus recursos y aplicaciones de AWS tanto en AWS como locales"). Recopila datos operativos y de monitoreo en forma de registros (logs), métricas y eventos, con una vista unificada de recursos, aplicaciones y servicios en AWS y on-premises. Sirve para detectar comportamientos anómalos, establecer alarmas, comparar registros y métricas, realizar acciones automatizadas y resolver problemas.
- Monitoreo de infraestructura y aplicaciones (semana 12): estrategia de gestión o flujo de trabajo operativo que evalúa recursos informáticos y aplicaciones para obtener visibilidad del rendimiento, el estado y la disponibilidad de los servicios.
- Observabilidad (teoría 1b): capacidad de medir el estado actual de un sistema a partir de los datos que genera (registros, métricas y trazas), basada en telemetría; su objetivo es entender qué ocurre para detectar y resolver problemas y mantener sistemas eficientes y fiables.
- Semana 11 (optimización de Lambdas): el primer punto es medir el rendimiento con CloudWatch.

### Conceptos clave y componentes

| Concepto | Qué se dijo en clase |
|---|---|
| Monitoreo (reactivo) frente a observabilidad (proactivo) | El monitoreo detecta dónde, qué y cuándo fallan las cosas (datos dispersos, por componente, poco análisis de causa raíz). La observabilidad explica por qué y cómo; es la evolución del monitoreo (datos integrados, monitoreo full-stack, predictiva y automatizada); ganó terreno en 2018 |
| Tres pilares | Métricas (detección: ¿tengo un problema?), trazas (resolución: ¿dónde está el problema?) y registros o logs (causa raíz: ¿qué lo causa?). El esquema Full-Stack Observability añade User Experience |
| Etapas de funcionamiento | Collect (recopilar métricas y logs de AWS y on-premises), Monitor (dashboards, correlacionar logs y métricas, CloudWatch Alarms), Act (automatizar respuestas con CloudWatch Events y Auto Scaling) y Analyze (métricas de hasta 1 segundo, retención de 15 meses, Metric Math) |
| Cifras | Integración nativa con más de 70 servicios de AWS; métricas detalladas de 1 minuto automáticas; métricas personalizadas con granularidad de hasta 1 segundo; retención de métricas hasta 15 meses |
| Dashboards y alarmas | Paneles automáticos; alarmas sobre umbrales o algoritmos de machine learning para comportamiento anómalo; acciones como iniciar Auto Scaling para reducir el MTTR |
| Metric Math | Operaciones matemáticas sobre métricas (por ejemplo, sumar el uso de una flota de EC2) |
| CloudWatch Logs | Grupo de registros (log group) por función, con flujos (log streams) por contenedor y fecha. El grupo de una Lambda es /aws/lambda/ seguido del nombre de la función, por ejemplo /aws/lambda/api-pelicula-dev-crear |
| Logs Insights | Consulta de logs: se paga solo por las consultas ejecutadas, responde en segundos, puede publicar métricas basadas en logs y correlacionar con paneles. Se pueden elegir hasta 50 grupos de registros y un rango de tiempo |
| Trazas | Rastrean la ruta de una solicitud a través de sistemas distribuidos y capturan intervalos (spans) con servicio, operación, duración y errores; en la clase solo se explicó la teoría (no se practicó) |
| Herramientas de terceros | Dynatrace, Datadog, New Relic, Splunk, Honeycomb, Grafana (cuadrante de Gartner 2023) |

Cada invocación de Lambda deja en el log un bloque con la misma identificación de solicitud (RequestId): la línea START, las líneas que se imprimieron con print (por ejemplo el evento de entrada y el dato procesado), la línea END y la línea REPORT. REPORT contiene la duración, la duración facturada, el tamaño de memoria y la memoria máxima usada (son las "métricas" de la ejecución). La primera invocación tras un cold start añade una línea INIT_START. Una excepción no controlada deja una línea con ERROR y el traceback.

Comandos de Logs Insights usados en clase (se encadenan con el operador de tubería): fields (elegir campos), sort (ordenar ascendente o descendente), filter (filtrar con igualdad, and, like) y stats con by (agregar, por ejemplo contar por género). Campos del sistema: @timestamp, @message, @type, @billedDuration, @memorySize y @requestId; los campos JSON se acceden con punto (pelicula_datos.genero).

### Cómo se usó en el laboratorio

Semana 12 Taller 1 (api-pelicula): la Lambda crear imprime el evento de entrada y el dato procesado y guarda la película en DynamoDB.

1. Desplegar el servicio api-pelicula con Serverless Framework (python3.12, 1024 MB, timeout 30 s, LabRole, tabla dev-t_peliculas).
2. Insertar por Postman 7 películas del tenant CINEPLANET: seis válidas y una con la clave equivocada (pelicula_patos) para provocar un error.
3. En la consola de Lambda, pestaña Monitorear, botón Ver registros de CloudWatch: se abre el grupo /aws/lambda/api-pelicula-dev-crear con sus flujos de registro; en cada invocación se ve el bloque START, los prints, END y REPORT (primera invocación 391.75 ms, segunda 79.76 ms).
4. En CloudWatch, Logs Insights: seleccionar el grupo y el rango de tiempo y ejecutar consultas.
5. Consulta de métricas: filtrar las líneas REPORT y mostrar @billedDuration, @memorySize y @requestId (7 filas; la fallida facturó 4 ms).
6. Consulta de logs: filtrar por tenant CINEPLANET y mostrar nombre, género, año y duración; ordenar por duración descendente; filtrar por género Terror (La Sustancia 140 y Beetlejuice Beetlejuice 110); contar por género (Terror 2, Documental 2, Animación 1, Acción 1).
7. Consulta de errores: filtrar mensajes que contienen ERROR; devuelve el traceback del KeyError de pelicula_datos (línea 9 de CrearPelicula.py).
8. Ejercicio propuesto (30 puntos): usar try y except y estandarizar el log como JSON con el campo tipo (INFO o ERROR) y log_datos, e imprimirlo en éxito y en error; luego consultar sobre ese formato (propuesta, no hay solución oficial).

Otros usos en el curso: validar en CloudWatch los reintentos de la Lambda fallida con la DLQ (semana 14 Taller 3); revisar los prints de eventos de S3, SNS y SQS en las semanas 13 y 14; tiempos de respuesta en Postman para analizar cold start (semana 11).

### Qué lo activa, qué necesita y qué produce

| Entrada | Salida |
|---|---|
| Todo lo que la Lambda imprime con print (stdout) | Se envía automáticamente a CloudWatch Logs, sin configuración adicional |
| Ejecución de una Lambda | Líneas START, END y REPORT, y métricas de la función |
| Consulta de Logs Insights sobre un grupo y un rango de tiempo | Tabla de resultados (métricas de ejecución, registros de negocio o errores) |
| Alarma de CloudWatch (teoría) | Acción automatizada: notificar por SNS, activar Auto Scaling |

### Con qué otros servicios se combinó en clase

- Lambda: logs y métricas automáticos (semana 12).
- SQS y DLQ: validar reintentos en CloudWatch (semana 14).
- SNS: en la teoría, una alarma de CloudWatch sobre la DLQ notifica por SNS al correo (ejemplo de procesamiento de datos de la semana 10), y los eventos de CloudWatch Alarms pueden publicar en SNS.
- Lens Serverless (lectura complementaria): CloudWatch, X-Ray y AWS SAM para monitoreo y despliegue; logs centralizados y estructurados.

### Cuándo usarlo, ventajas y limitaciones según el material

- Usar los logs para el contexto y la causa raíz, las métricas para detectar, y las trazas para localizar el cuello de botella.
- Ventajas: una sola plataforma, integración nativa con más de 70 servicios, Logs Insights paga solo por consulta.
- En el laboratorio solo se practicaron logs y métricas de Lambda; las alarmas, los dashboards, las trazas y Metric Math solo se vieron en teoría.
- Buena práctica sugerida por el ejercicio propuesto: un formato de log estándar (INFO y ERROR) permite análisis estructurado en lugar de revisar a mano.

### Cómo ponerlo en un diagrama

Caja "CloudWatch (Logs e Insights)" con flecha de logs desde cada Lambda (se puede dibujar una sola flecha de todas las Lambdas o una por Lambda importante). Alarma opcional que sale hacia SNS. Es una relación asíncrona y pasiva: las Lambdas escriben, nadie espera respuesta.

### Errores y trampas vistos en clase

- No cambiar org y role del serverless.yml o no actualizar las credenciales: el deploy falla.
- Clave equivocada en el JSON de entrada (pelicula_patos) provoca KeyError si no hay manejo de errores.
- Olvidar seleccionar el grupo de registros o el rango de tiempo en Logs Insights: no hay resultados.
- Sin un formato estándar, la búsqueda por ERROR solo encuentra el traceback del runtime.

### Preguntas tipo examen

1. Diferencie monitoreo y observabilidad. Monitoreo: dónde y cuándo falla (reactivo). Observabilidad: por qué y cómo (proactiva, predictiva, datos integrados), evolución del monitoreo.
2. ¿Cuáles son los tres pilares y qué pregunta responde cada uno? Métricas (¿tengo un problema?), trazas (¿dónde?), logs (¿qué lo causa?).
3. ¿Cómo se registran logs en una Lambda y dónde se ven? Con print; se ven en CloudWatch Logs en el grupo /aws/lambda/nombre-de-la-función (pestaña Monitorear, Ver registros de CloudWatch).
4. ¿Qué contiene la línea REPORT? Duración, duración facturada, tamaño de memoria y memoria máxima usada (más RequestId).
5. ¿Cómo se encuentran los errores de una Lambda con Logs Insights? Con una consulta que filtra los mensajes que contienen ERROR, ordenados por tiempo.

---

## Amazon RDS y Aurora Serverless

### Qué es (definición del profesor)

- Semana 10 (capa de datos serverless, solo teoría): Amazon RDS Proxy es un proxy de base de datos administrada para RDS que hace las aplicaciones más escalables y seguras; Amazon Aurora Serverless es una base de datos relacional compatible con MySQL y PostgreSQL que escala la capacidad automáticamente según las necesidades.
- Semana 9 (teoría de multi-tenancy): el patrón 2 es una base de datos única con esquemas múltiples (cada tenant tiene un schema con réplica de tablas; el reto es conectarse al schema correcto).
- Semana 11 (Proyecto Final): si el microservicio requiere SQL, se crea un único RDS usando el patrón 2.
- Semana 15 (Taller de secretos): se usa una instancia RDS MySQL con tres esquemas (dev, test, prod).

### Conceptos clave y componentes

| Concepto | Qué se vio |
|---|---|
| Instancia RDS | Identificador alumnos; clase db.t3.micro; motor mysql; usuario maestro admin; 20 GB; accesible públicamente; región us-east-1 |
| Costo | La diapositiva avisa de unos 15 dólares al mes |
| Endpoint y puerto | El punto de enlace (por ejemplo alumnos.xxxx.us-east-1.rds.amazonaws.com) y el puerto 3306 se leen en Conectividad y seguridad |
| Grupo de seguridad | Se abrió el puerto 3306 a 0.0.0.0/0 (solo para fines académicos). En producción: red privada de la cuenta, reglas de entrada solo desde grupos de seguridad o dentro de la misma VPC de las Lambdas |
| Esquemas | Tres bases o esquemas: dev, test y prod, cada uno con la tabla alumnos (alumno_id, apellidos, nombres) y tres filas |
| Usuarios por esquema | user_dev, user_test y user_prod, cada uno con todos los privilegios solo sobre su esquema (principio de acceso mínimo) |
| Conexión desde Lambda | Librería pymysql (requirements.txt con pymysql 1.2.0) instalada en la carpeta del proyecto; tiempo de conexión de 5 s |

### Cómo se usó en el laboratorio

Semana 15 Taller 2, parte A:

1. Abrir CloudShell (icono de terminal en la consola); ya trae credenciales, AWS CLI y cliente MySQL.
2. Crear la instancia con el comando de AWS CLI para crear una instancia RDS: identificador alumnos, clase db.t3.micro, motor mysql, usuario admin, 20 GB y acceso público. Esperar el estado Disponible en Aurora y RDS, Bases de datos.
3. Leer el endpoint y el puerto 3306 en Conectividad y seguridad y abrir el puerto 3306 en el grupo de seguridad (MYSQL/Aurora, TCP, cualquier origen), solo por fines académicos.
4. Conectarse con el cliente mysql al endpoint como admin y crear las bases dev, test y prod con su tabla alumnos y tres alumnos de ejemplo cada una; crear user_dev, user_test y user_prod con permisos solo sobre su esquema. Verificar con la lista de bases (siete filas) y la lista de usuarios.
5. Crear los secretos en Parameter Store (ver siguiente sección) y desplegar la API api-alumnos-rds en dev, test y prod.
6. Probar en el navegador https://id.execute-api.us-east-1.amazonaws.com con la etapa y /alumnos/listar (método GET): devuelve los tres alumnos del esquema de su stage.

### Qué lo activa, qué necesita y qué produce

| Entrada | Salida |
|---|---|
| Lambda con host, usuario, contraseña y base de datos (obtenidos de variables de entorno y de Parameter Store) | Conexión; la consulta devuelve las filas (por ejemplo, tres alumnos) |
| Lambda sin acceso de red al puerto 3306 | Falla por tiempo de espera (connect_timeout de 5 s) |

### Con qué otros servicios se combinó en clase

- API Gateway, Lambda, Parameter Store (secretos) y RDS MySQL (semana 15).
- Serverless Framework: el mismo YAML crea los tres ambientes con las variables de entorno según el stage.
- CloudShell para ejecutar los comandos de AWS CLI y SQL.

### Cuándo usarlo, ventajas y limitaciones según el material

- En el proyecto final: SQL requiere un único RDS con el patrón 2 (Single Database, Multiple Schemas); NoSQL usa DynamoDB; en ambos casos se presenta un diagrama entidad-relación (SQL) o la estructura JSON (NoSQL).
- Aurora Serverless y RDS Proxy: solo mencionados en la teoría de la semana 10 como opciones serverless de bases relacionales (no se practicaron).
- Limitaciones vistas: el RDS genera costo mientras existe (unos 15 dólares al mes); no es serverless como DynamoDB (hay que crearlo y abrir la red); la conexión desde Lambda exige red y credenciales.

### Cómo ponerlo en un diagrama

Caja "RDS MySQL" con los esquemas dev, test y prod anotados. Flecha de la Lambda al RDS (síncrona, puerto 3306). Flecha de la Lambda a Parameter Store para obtener la contraseña.

### Errores y trampas vistos en clase

- Puerto 3306 no abierto en el grupo de seguridad: timeout de conexión.
- Dejar 3306 abierto a todo el mundo en producción (solo es válido para el laboratorio).
- Cambiar la contraseña en la base y no en Parameter Store (o al revés): falla la autenticación.
- Olvidar instalar pymysql en la carpeta del proyecto.
- Costo: eliminar el RDS al terminar (inferencia del aviso de costo).

### Preguntas tipo examen

1. ¿Qué patrón de multi-tenancy usa el proyecto final cuando se requiere SQL? El patrón 2: una sola base de datos RDS con un esquema por tenant.
2. ¿Cómo se aplicó el mínimo privilegio en el Taller de secretos? Un usuario por esquema (user_dev, user_test, user_prod) con permisos solo sobre su esquema.
3. ¿Qué advertencia se dio sobre el puerto 3306? Abrirlo a cualquier origen solo es aceptable en el laboratorio; en producción se debe usar la red privada o la VPC con reglas de grupos de seguridad.
4. ¿Cuándo se elegiría Aurora Serverless según la teoría? Cuando se necesita base relacional compatible con MySQL o PostgreSQL que escale la capacidad automáticamente (solo teoría).

---

## Secrets Manager y Parameter Store

### Qué es (definición del profesor)

- Concepto de secreto (semana 15, Taller 2): información confidencial como claves de API, contraseñas, credenciales de bases de datos o cualquier dato que otorgue acceso a sistemas y servicios. La gestión de secretos protege estos datos del acceso no autorizado.
- Rotación de secretos: cambiar regularmente la información confidencial (contraseñas, claves de acceso) para mejorar la seguridad. En la realidad se cambian como mínimo cada 30 días.
- AWS Systems Manager Parameter Store: almacén de parámetros (se usó con el tipo SecureString). AWS Secrets Manager: servicio específico de secretos con rotación automática.

### Conceptos clave y componentes

Tabla comparativa de la diapositiva:

| Característica | Systems Manager Parameter Store | AWS Secrets Manager |
|---|---|---|
| Tamaño máximo del valor | 4 KB (standard) u 8 KB (advanced) | 64 KB |
| Cifrado con KMS | Sí | Sí |
| Referenciable desde CloudFormation | Sí | Sí |
| Generador de contraseñas incorporado | No | Sí |
| Rotación automática de secretos | No | Sí |
| Acceso entre cuentas (cross-account) | No | Sí |
| Costo | Gratis para parámetros standard; los advanced se cobran por parámetro y por transacción de API | Tiene costo |

Otros conceptos:

| Concepto | Qué se vio |
|---|---|
| SecureString | Tipo de parámetro cifrado (capa Estándar en la consola) |
| Nombre jerárquico | /rds_mysql_alumnos/user_dev/password, /rds_mysql_alumnos/user_test/password, /rds_mysql_alumnos/user_prod/password y /rds_mysql_alumnos/punto_enlace |
| Variable de entorno con el nombre del parámetro | La variable de entorno de la Lambda no contiene el secreto sino el nombre del parámetro; el valor se obtiene en ejecución con get_parameter y descifrado activado |
| Un mismo YAML, tres ambientes | Variables que usan la variable de stage: DB_USER, DB_PASSWORD y DB_NAME según el stage |

### Cómo se usó en el laboratorio

Semana 15 Taller 2, parte B:

1. Desde CloudShell crear con AWS CLI cuatro parámetros SecureString con el comando de Systems Manager para guardar parámetros (put-parameter): las tres contraseñas (user_dev, user_test, user_prod) y el punto de enlace del RDS.
2. En la consola de Systems Manager, Almacén de parámetros, Mis parámetros: aparecen 4 parámetros, tipo SecureString y capa Estándar.
3. Desplegar api-alumnos-rds con las variables de entorno DB_HOST, DB_USER, DB_PASSWORD y DB_NAME. En Lambda, Configuración, Variables de entorno, se valida que DB_HOST y DB_PASSWORD contienen nombres de parámetros y DB_USER y DB_NAME el usuario y el esquema del stage.
4. La Lambda lee DB_HOST y DB_PASSWORD, pide los valores a SSM con descifrado y abre la conexión a RDS.

Ejercicios propuestos de la semana 15 (50 puntos, entrega el 29-nov-2026):

- Ejercicio 1 (20 puntos): api-alumnos-rds-v2, reemplazando Parameter Store por Secrets Manager. Propuesta: crear un secreto por usuario y reemplazar el cliente de SSM por el de Secrets Manager (get_secret_value); las variables de entorno siguen guardando solo nombres.
- Ejercicio 2 (30 puntos): rotación cada 10 minutos de la contraseña de user_dev, user_test y user_prod en la base y en Parameter Store. El enunciado recomienda una regla de EventBridge que invoque una Lambda que cambie la contraseña (cambiar usuario con ALTER USER y FLUSH PRIVILEGES) y almacene la nueva en Parameter Store; la alternativa es la rotación automática de Secrets Manager.

### Qué lo activa, qué necesita y qué produce

| Entrada | Salida |
|---|---|
| Lambda con rol (LabRole) y nombre del parámetro | Valor descifrado del secreto en memoria; la contraseña no queda en el código ni en el YAML |
| Regla de EventBridge cada 10 minutos (ejercicio de rotación) | Lambda que cambia la contraseña en RDS y la reescribe en Parameter Store |

### Con qué otros servicios se combinó en clase

- Parameter Store con Lambda y RDS (semana 15 Taller 2).
- KMS: SecureString y Secrets Manager cifran con KMS; las variables de entorno de Lambda se cifran en reposo con la clave predeterminada del servicio.
- Serverless Framework: nombres de parámetros construidos con la variable de stage.
- EventBridge y Lambda para la rotación (propuesta de ejercicio).

### Cuándo usarlo, ventajas y limitaciones según el material

- Parameter Store: configuración y secretos simples, gratis en el nivel standard, sin rotación automática.
- Secrets Manager: cuando se necesita rotación automática, generador de contraseñas, acceso entre cuentas o valores hasta 64 KB; cuesta dinero.
- Principio de acceso mínimo: un usuario de base por ambiente.

### Cómo ponerlo en un diagrama

Caja "Parameter Store (o Secrets Manager)" junto a la Lambda: flecha de la Lambda hacia el almacén de secretos para pedir la contraseña antes de la flecha hacia RDS. Si hay rotación: EventBridge hacia una Lambda de rotación que actualiza el almacén y la base.

### Errores y trampas vistos en clase

- Guardar el secreto en claro en variables de entorno de la Lambda (visible en la consola): el taller guarda el nombre y recupera el valor.
- Olvidar el tipo SecureString o el descifrado al leer (llegaría el valor cifrado).
- Cambiar la contraseña en la base y no en el almacén: la rotación debe actualizar ambos.
- No instalar pymysql con la opción de directorio actual y la regla package include.

### Preguntas tipo examen

1. Compare Parameter Store y Secrets Manager. Ambos cifran con KMS y se pueden referenciar desde CloudFormation; Secrets Manager añade generador de contraseñas, rotación automática, acceso entre cuentas y 64 KB, pero tiene costo; Parameter Store tiene 4 u 8 KB, es gratis en standard y no rota.
2. ¿Por qué la variable de entorno no contiene la contraseña? Contiene el nombre del parámetro; en ejecución se pide el valor descifrado a SSM, así el secreto no queda en el código ni en el YAML.
3. ¿Cómo rotaría las contraseñas cada 10 minutos? Regla programada de EventBridge que invoque una Lambda que genere una contraseña nueva, la cambie en la base y la guarde en Parameter Store; o usar la rotación automática de Secrets Manager.
4. ¿Qué es un secreto? Información confidencial (claves de API, contraseñas, credenciales de base) que da acceso a sistemas.

---

## Amazon Rekognition y otros servicios de IA

### Qué es (definición del profesor)

- Inteligencia artificial (IBM, semana 15): tecnología que permite que las computadoras simulen la inteligencia humana y las capacidades humanas de resolución de problemas.
- Amazon Rekognition: servicio de análisis visual basado en aprendizaje profundo para buscar, verificar y organizar millones de imágenes y videos; automatiza y reduce el costo del reconocimiento de imágenes y el análisis de videos; se agregan a las aplicaciones APIs de visión artificial previamente entrenadas o personalizables sin crear modelos de machine learning desde cero.
- Los servicios de IA se consumen como APIs gestionadas; en el curso no se entrenó ningún modelo.

### Conceptos clave y componentes

Servicios de IA de AWS vistos en la teoría (semana 15):

| Categoría | Servicio | Qué hace (según la diapositiva) |
|---|---|---|
| Reconocimiento de voz | Amazon Polly | Texto a voz (convertir blog a podcast, dictado de texto) |
| Reconocimiento de voz | Amazon Transcribe | Voz a texto (crear transcripciones, redacción de contenido, filtrado de vocabulario) |
| Procesamiento de lenguaje natural | Amazon Comprehend | Análisis de sentimiento, topic modeling, frases clave, detección de entidades, clasificación |
| Procesamiento de lenguaje natural | Amazon Lex | Chatbots conversacionales y de BI |
| Visión artificial | Amazon Rekognition | Detección de objetos, texto, moderación de imágenes, actividad en video |
| Visión artificial | Amazon Textract | Extracción de documentos, tablas y redacción de documentos |
| Predicción y recomendación | Amazon SageMaker | Plataforma para construir modelos propios (regresión, clasificación, clustering, imagen, texto) |
| Predicción y recomendación | Amazon Forecast | Pronóstico de demanda |
| Predicción y recomendación | Amazon Personalize | Recomendación y personalización |
| Predicción y recomendación | Fraud Detector | Solo se nombra en la categoría |
| Creación de contenido (GenAI) | Amazon Bedrock | Solo se nombra en la categoría |

Demos de Rekognition en la consola (menú Demostraciones): detección de etiquetas, propiedades de la imagen, moderación de imágenes, análisis facial, comparación de rostros, Face Liveness, reconocimiento de famosos, texto en la imagen y detección de EPI (equipo de protección personal); también etiquetas personalizadas, moderación personalizada y análisis masivo. En video: análisis de videos almacenados y transmisión de eventos de video (detecta personas, mascotas y paquetes en secuencias en directo).

Detección de etiquetas: reconoce objetos, conceptos, escenas y acciones y da una puntuación de confianza por etiqueta (ejemplo de la demo con un skateboard: Neighborhood, City, Road, Street, Urban 99.9 %, Person 98.7 %).

### Cómo se usó en el laboratorio

Semana 15 Taller 1, API de visión artificial (api-vision-artificial):

1. Crear un bucket de S3 (gcr-data-01) con el prefijo images y subir las imágenes del docente (landscape_resized.jpg, skateboard_resized.jpg).
2. Revisar el código de la Lambda DetectarEtiquetas y cambiar org y role en el serverless.yml (python3.13, 1024 MB, timeout 20 s, LabRole).
3. Crear el repositorio api-vision-artificial en GitHub, clonar en la MV Desarrollo, actualizar las credenciales y hacer serverless login.
4. serverless deploy en el stage dev: crea el endpoint POST /dev/images/etiquetas.
5. Probar con Postman un cuerpo JSON con el nombre del bucket (bucket_name) y la clave de la imagen con su prefijo (image_name, por ejemplo images/skateboard_resized.jpg).
6. La Lambda llama a la operación de Rekognition para detectar etiquetas sobre el objeto de S3 con máximo 10 etiquetas y confianza mínima de 80 %, y devuelve una lista de etiquetas con nombre y porcentaje de confianza.
7. Comparar la respuesta de la API propia con la demo de la consola de Rekognition. También se probaron las demos de famosos, texto en la imagen y EPI con las imágenes del ZIP.

### Qué lo activa, qué necesita y qué produce

| Entrada | Salida |
|---|---|
| Solicitud POST con bucket_name e image_name | Rekognition lee la imagen directamente de S3 (la Lambda no la descarga) |
| Respuesta de Rekognition | statusCode 200 y una lista de etiquetas con nombre y porcentaje de confianza |

### Con qué otros servicios se combinó en clase

- API Gateway, Lambda, S3 y Rekognition (semana 15).
- Teoría semana 10: Rekognition (texto de imágenes JPG) y Comprehend dentro de un flujo de ingesta de eventos con S3, Lambdas, SQS y OpenSearch; Comprehend para detectar sentimiento y guardarlo en DynamoDB en el ejemplo de procesamiento de datos.
- Los otros servicios (Polly, Transcribe, Lex, Textract, SageMaker, Forecast, Personalize, Fraud Detector y Bedrock) solo se vieron en teoría (no se usaron en laboratorio).

### Cuándo usarlo, ventajas y limitaciones según el material

- Usar Rekognition para visión artificial sin construir modelos; los resultados mejoran o empeoran según MinConfidence y MaxLabels.
- Ventaja: APIs preentrenadas o personalizables, sin infraestructura ML.
- Limitación vista: el bucket y Rekognition deben estar en la misma región (el taller usa us-east-1); la clave debe incluir el prefijo.

### Cómo ponerlo en un diagrama

Caja "Rekognition" (o Comprehend, Textract, Polly...) a la derecha de la Lambda que lo invoca; flecha síncrona desde la Lambda. Si hay imágenes, una caja S3 con flecha de la Lambda (o de la subida) hacia S3 y de la Lambda hacia Rekognition indicando la ubicación del objeto. Elegir el servicio según el dato: imagen o video (Rekognition), documento (Textract), texto (Comprehend), voz (Transcribe o Polly), chatbot (Lex).

### Errores y trampas vistos en clase

- No cambiar org y role, o credenciales vencidas: falla el deploy.
- Clave de imagen sin el prefijo images.
- Región diferente entre el bucket y Rekognition.
- Cambiar MaxLabels o MinConfidence y sorprenderse por el número de etiquetas.

### Preguntas tipo examen

1. ¿Qué es Rekognition? Servicio de análisis visual con aprendizaje profundo para imágenes y video, con APIs preentrenadas o personalizables sin crear modelos.
2. ¿Qué servicio usaría para convertir voz en texto, texto en voz, analizar sentimiento y construir un chatbot? Transcribe, Polly, Comprehend y Lex.
3. ¿Qué flujo implementó el Taller de visión artificial? Cliente, API Gateway, Lambda, Rekognition leyendo la imagen de S3; devuelve etiquetas con confianza.
4. Mencione servicios de visión artificial. Rekognition y Textract.

---

## Amazon Cognito

### Qué es (definición del profesor)

- Semana 10 (Taller 1): Cognito es el servicio recomendado por el docente para el manejo de usuarios, contraseñas y autorización, pero no está disponible en AWS Academy; por eso se construyó un sistema propio de seguridad con Lambda y DynamoDB.
- Semana 10 (ejemplo de aplicación web "To Do"): el usuario se registra y autentica con Cognito; el cliente llega a API Gateway.
- Semana 14 (lens Serverless, escenario Web application): Cognito user pools aportan la administración de usuarios y proveedores de identidad; los tokens emitidos por Cognito se usan para autenticar las solicitudes a API Gateway.

### Conceptos clave y componentes

| Concepto | Qué se dijo en clase |
|---|---|
| User pool | Administración de usuarios y proveedores de identidad; emite tokens |
| Tokens | Se usan para autenticar llamadas a API Gateway |
| Mecanismos de acceso a la API (lectura complementaria del lens, no visto en clase) | AWS_IAM, Cognito user pools, Lambda authorizer, resource policies y mutual TLS |

### Cómo se usó en el laboratorio

No se usó (no estaba disponible en AWS Academy). En su lugar se implementó el sistema de seguridad de la semana 10 Taller 1:

1. Tablas t_usuarios (clave user_id) y t_tokens_acceso (clave token, atributo expires).
2. Lambda CrearUsuario: guarda el usuario con la contraseña convertida a hash SHA-256 (nunca en claro).
3. Lambda LoginUsuario: compara el hash, genera un token (UUID v4) con expiración a 60 minutos y lo guarda; devuelve el token.
4. Lambda ValidarTokenAcceso: busca el token y revisa que exista y no haya expirado (devuelve 200 o 403).
5. API usuarios (/usuarios/crear y /usuarios/login) y API productos (/productos/crear), esta última protegida: el cliente envía el header Authorization con el token; una plantilla de asignación pasa el header; la Lambda CrearProducto invoca de forma síncrona a ValidarTokenAcceso y, si responde 403, devuelve 403 Forbidden - Acceso No Autorizado.

### Qué lo activa, qué necesita y qué produce

| Entrada | Salida |
|---|---|
| Credenciales del usuario (Cognito) | Tokens que viajan al llamar a API Gateway |
| Usuario y contraseña (sistema propio) | Token con expiración almacenado en t_tokens_acceso |

### Con qué otros servicios se combinó en clase

- Teoría: Cognito con API Gateway, Lambda y DynamoDB; Amplify Console y Route 53 en el ejemplo To Do; CloudFront y S3 en el escenario Web application.
- Laboratorio: el sistema propio combina API Gateway, Lambda y DynamoDB.

### Cuándo usarlo, ventajas y limitaciones según el material

- Cuándo: cualquier aplicación con usuarios registrados y autorización (recomendado por el docente); en el laboratorio no es posible por AWS Academy.
- El sistema propio tiene limitaciones visibles en el material: usa 403 para todos los casos de fallo, valida el token invocando una Lambda por cada petición protegida, y no cubre otras prestaciones de un servicio de identidad gestionado (esas prestaciones no se vieron en clase).

### Cómo ponerlo en un diagrama

Cognito (user pool) junto al cliente: flecha del cliente hacia Cognito para autenticarse y flecha con el token hacia API Gateway. En la versión de laboratorio se dibuja la Lambda LoginUsuario que emite el token y la Lambda ValidarTokenAcceso que lo valida, con la tabla t_tokens_acceso.

### Errores y trampas vistos en clase

- Intentar usar Cognito en AWS Academy: no está disponible.
- No configurar la plantilla de asignación: la Lambda protegida no ve el header Authorization.
- Token falso, ausente o vencido: respuesta 403 Forbidden (comportamiento esperado, no un error).
- Timeout de 3 s con Lambdas encadenadas: por eso se subió a 30 s.

### Preguntas tipo examen

1. ¿Por qué se implementó un sistema de seguridad propio? Porque Cognito no está disponible en AWS Academy.
2. Describa los 8 pasos del flujo de seguridad. Crear usuario, login valida, se genera y guarda el token, se devuelve al cliente, el cliente llama a API protegida con el token, se envía a ValidarTokenAcceso, se valida (token y expiración), se autoriza y se registra el producto.
3. ¿Qué papel tiene Cognito en el escenario Web application? Administra usuarios y emite tokens para autenticar las solicitudes a API Gateway.

---

## AWS Amplify

### Qué es (definición del profesor)

- Semana 10 (ejemplos de arquitecturas): en la aplicación web "To Do", AWS Amplify (Amplify Console) hospeda el contenido estático; el repositorio de GitHub se conecta a Amplify Console. En backends móviles, Lambda y API Gateway autentican y procesan solicitudes de API y AWS Amplify integra con frontends de iOS, Android, web y React Native.
- Semana 11 (Proyecto Final): el frontend, en cualquier framework, debe desplegarse en Amplify.

### Conceptos clave y componentes

| Concepto | Qué se dijo |
|---|---|
| Amplify Console | Hosting del contenido estático del front-end; se conecta a un repositorio de GitHub |
| Integración con frontends | iOS, Android, web y React Native (backends móviles) |

### Cómo se usó en el laboratorio

No hubo un taller de Amplify en las semanas 9 a 15 (no visto en clase como práctica). Solo aparece como requisito del Proyecto Final (frontend en Amplify, 6 puntos de rúbrica para el FrontEnd).

### Qué lo activa, qué necesita y qué produce

(No visto en clase.) Según el ejemplo de teoría: recibe el código del repositorio y sirve el sitio al usuario; el sitio llama a API Gateway.

### Con qué otros servicios se combinó en clase

- En el diagrama de teoría To Do: dispositivos, Route 53, Amplify Console y Cognito, API Gateway, Lambdas y DynamoDB; GitHub Repository conectado a Amplify Console.

### Cuándo usarlo, ventajas y limitaciones según el material

- Para alojar el front-end estático de la solución y conectarlo con el backend serverless (requisito del Proyecto Final). El material no da más cifras ni comparaciones.

### Cómo ponerlo en un diagrama

Caja "Amplify (frontend)" a la izquierda, a la derecha del usuario; flecha del usuario a Amplify (carga del sitio) y flecha del frontend a API Gateway (llamadas REST). Opcionalmente, GitHub como origen del código hacia Amplify.

### Errores y trampas vistos en clase

No hay errores documentados (no hubo taller). Confundir hosting estático de Amplify (o S3) con el backend: el backend es API Gateway, Lambda y DynamoDB.

### Preguntas tipo examen

1. ¿Dónde se despliega el frontend del proyecto final? En AWS Amplify.
2. ¿Qué rol cumple Amplify en el ejemplo To Do? Hospeda el contenido estático de la aplicación web, conectado a un repositorio de GitHub.

---

## AWS Step Functions

### Qué es (definición del profesor)

- Semana 10 (capa de integración de la aplicación, solo teoría): organizador visual de flujos de trabajo que facilita la secuenciación de múltiples servicios de AWS en aplicaciones fundamentales.
- Semana 14 (lens Serverless, lectura complementaria): "Orchestrate your application with state machines, not functions" (principio de diseño) y como orquestador de workflows en la capa de cómputo.

### Conceptos clave y componentes

| Concepto | Qué se dijo |
|---|---|
| Flujo de trabajo (workflow) | Secuencia de pasos que orquesta servicios; en el ejemplo, Lambdas |
| Máquina de estados | Término del lens para el flujo de pasos |
| Destinos de EventBridge | Step Functions aparece como destino posible de una regla |

### Cómo se usó en el laboratorio

No se usó (no visto en clase como práctica).

### Qué lo activa, qué necesita y qué produce

Ejemplo de procesamiento por lotes (semana 10): una regla programada de EventBridge inicia el flujo; la primera Lambda lista los archivos del día anterior; otras Lambdas procesan los archivos en paralelo (dos); una espera de 10 segundos; otra Lambda agrega resultados; otra borra los resultados intermedios; y SNS envía un correo. Los buckets de S3 guardan los resultados intermedios y finales. Es un ETL (extracción, transferencia y carga) orquestado con Step Functions y Lambda (calidad del aire con mínimas, máximas y promedio).

### Con qué otros servicios se combinó en clase

EventBridge (regla programada), Lambda, S3 y SNS en el ejemplo de procesamiento por lotes.

### Cuándo usarlo, ventajas y limitaciones según el material

- Para flujos recurrentes o con varios pasos, paralelismo y esperas, donde una cadena de Lambdas sería difícil de seguir. El material no da cifras.

### Cómo ponerlo en un diagrama

Caja "Step Functions" que contiene o dirige varias Lambdas (flechas de la caja a cada Lambda en secuencia o en paralelo); EventBridge entra por la izquierda y SNS sale por la derecha.

### Errores y trampas vistos en clase

No hay (no se practicó). Contraste útil para el examen: en el laboratorio las llamadas encadenadas se hicieron con una Lambda que invoca a otra de forma síncrona (ValidarTokenAcceso), no con Step Functions.

### Preguntas tipo examen

1. ¿Qué es Step Functions? Organizador visual de flujos de trabajo que secuencia varios servicios de AWS.
2. ¿Cómo se usó en el ejemplo de procesamiento por lotes? Orquesta Lambdas (inventario, procesamiento en paralelo, espera, agregación, borrado) iniciado por una regla programada de EventBridge y con notificación final por SNS.

---
## Serverless Framework

### Qué es (definición del profesor)

- Semana 10 (Taller 2): es un framework (www.serverless.com): "Do more with less. All-in-one development solution for auto-scaling apps on AWS Lambda". Tres ideas de la diapositiva: (1) definir aplicaciones como funciones y eventos (funciones Lambda y sus disparadores con sintaxis YAML simple); (2) desplegar infraestructura y código con un solo comando (funciones, triggers y código se despliegan y conectan automáticamente en la nube); (3) extender con plugins.
- Beneficio práctico: con un solo serverless deploy se crean las Lambdas y la API REST de API Gateway (y la pila de CloudFormation que las agrupa), en lugar de crear todo a mano en la consola como en el Taller 1.
- Semana 11 (Proyecto Final): "automatizar todo el despliegue con Serverless Framework" es un requisito del backend.

### Conceptos clave y componentes

Archivo serverless.yml (descrito en palabras):

| Sección o clave | Qué define | Valores vistos |
|---|---|---|
| org | Organización de la cuenta en serverless.com (Serverless Dashboard); cada alumno la cambia por la suya | geraldocolchado, renzocuba |
| service | Nombre del servicio; forma el nombre de la pila, de las funciones y de la API | api-alumnos, api-s3, api-comentario, api-pelicula, api-web-scraping, api-vision-artificial, api-alumnos-rds |
| provider: runtime | Versión de Python | python3.12 (semanas 10 y 12), python3.13 (semanas 11 y 15) |
| provider: memorySize | Memoria por defecto de todas las funciones | 256 MB (semana 11 Taller 3), 1024 MB (comentario, película, scraping, visión, RDS) |
| provider: timeout | Timeout por defecto de las funciones | 30 s (semanas 10 y 12), 20 s (semanas 11 y 15) |
| provider: iam: role | ARN del rol existente de ejecución | arn:aws:iam::ID-DE-CUENTA:role/LabRole |
| provider: environment | Variables de entorno de todas las funciones | TABLE_NAME con el stage, BUCKET_INGESTA, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME |
| functions | Una entrada por Lambda: handler (archivo.función), memorySize propio que sobrescribe el global, package include para empaquetar librerías y events | listar, crear, buscar, modificar, eliminar... |
| events: http | Disparador API Gateway: path, method (get, post, put, delete), cors true e integration lambda (no proxy, el cuerpo llega como diccionario) | /alumnos/listar POST... |
| resources | Recursos de CloudFormation en bruto (tablas DynamoDB, buckets S3) | Tabla con claves HASH y RANGE y facturación por solicitud; bucket de ingesta |
| Variables | ${sls:stage} (stage actual) y ${self:provider.environment.TABLE_NAME} (referencia a otro valor del archivo) | dev-t_comentarios, user_dev, /rds_mysql_alumnos/user_dev/password |

Stages (etapas, semana 11): entorno de despliegue (dev desarrollo, test pruebas/QA, prod producción). Cada stage crea recursos independientes: Lambdas distintas, API Gateway distinto, tablas y buckets distintos. El stage por defecto es dev y se cambia con la opción de stage al desplegar.

Convención de nombres:

| Elemento | Nombre | Ejemplo |
|---|---|---|
| Pila de CloudFormation | servicio-stage | api-alumnos-dev |
| Lambda | servicio-stage-clave de la función | api-alumnos-dev-listar |
| API Gateway (consola) | stage-servicio | dev-api-alumnos |
| URL | https, id, execute-api, región, amazonaws.com, stage y ruta | .../dev/alumnos/listar |

### Cómo se usó en el laboratorio

Preparación (semana 10 Taller 2): en la MV Desarrollo verificar node.js mayor que v20, npm y aws CLI; instalar el framework con npm de forma global; escribir las credenciales de AWS Academy en el archivo ~/.aws/credentials (válidas 4 horas); crear usuario en serverless.com con correo UTEC y nombre de Organization (es el valor de org).

Flujo de trabajo repetido en cada taller:

1. Crear (o clonar) el repositorio de GitHub con el serverless.yml y los .py.
2. En la MV, git clone, y actualizar org y el ID de cuenta del rol LabRole en el serverless.yml.
3. Actualizar las credenciales si pasaron 4 horas.
4. serverless login (abre el navegador; "You have successfully signed in").
5. Si hay librerías que no son estándar (requests, bs4, pymysql): instalarlas en el directorio del proyecto con pip3 install -r requirements.txt -t . y usar package include en la función.
6. serverless deploy (o sls deploy). Muestra el stage, la región, la pila (por ejemplo api-alumnos-dev en 78 s), el endpoint y las funciones con su peso.
7. Probar con Postman o curl.
8. Para otros ambientes: serverless deploy con la opción de stage test o prod. Para borrar: serverless remove (y con stage test o prod); elimina API Gateway, Lambdas y DynamoDB de cada stage.

Casos del curso:

| Semana | Servicio (proyecto) | Qué aporta |
|---|---|---|
| 10 Taller 2 | api-alumnos (listar, luego crear; completo con buscar, modificar y eliminar) | Primer despliegue; añadir una función y volver a desplegar actualiza la misma API (mismo service) |
| 10 propuesto | api-productos (4 funciones protegidas con token) | Despliegue por framework de las Lambdas protegidas |
| 11 Taller 3 | api-s3 | Memoria por función (512 MB para lista_buckets, 256 MB el resto); stages dev, test y prod: 6 Lambdas y 3 API Gateways |
| 11 Taller 4 | api-comentario | Variables de entorno por stage, tabla DynamoDB creada por resources (dev-, test- y prod-t_comentarios), eliminación con remove |
| 11 propuesto | bucket de ingesta por stage | resources con un bucket S3 por stage |
| 12 Taller 1 | api-pelicula | Tabla por stage y logs en CloudWatch |
| 12 Taller 2 | api-web-scraping | Librerías empaquetadas con package include |
| 15 Taller 1 | api-vision-artificial | POST /images/etiquetas con Rekognition |
| 15 Taller 2 | api-alumnos-rds | Un mismo YAML genera dev, test y prod usando la variable de stage en usuario, contraseña (nombre del parámetro) y base |

Propuesta (no vista en clase) para la rotación de secretos de la semana 15: un evento de tipo schedule con frecuencia cada 10 minutos en el serverless.yml crea la regla de EventBridge que invoca la Lambda.

### Qué lo activa, qué necesita y qué produce

| Entrada | Salida |
|---|---|
| Archivo serverless.yml, código y credenciales vigentes de AWS Academy | Pila de CloudFormation con Lambdas, API Gateway, tablas, buckets y permisos conectados |
| Opción de stage | Copia independiente de todos los recursos con el stage en sus nombres |
| serverless remove | Eliminación de los recursos de ese stage |

Necesita: node, npm, aws CLI, la herramienta instalada, org correcto, ARN del LabRole de su cuenta, sesión iniciada en serverless.com y credenciales no vencidas.

### Con qué otros servicios se combinó en clase

Lambda y API Gateway (siempre), DynamoDB (resources), S3 (resources), CloudFormation (por detrás: la plantilla de la MV de desarrollo también es CloudFormation), IAM (LabRole), Parameter Store (nombres de parámetros en variables de entorno), EventBridge (propuesta de schedule).

### Cuándo usarlo, ventajas y limitaciones según el material

- Ventajas: un solo comando despliega todo, es repetible por stage, permite versionar la infraestructura como código (infraestructura como código en la teoría DevOps), y evita crear todo a mano en consola.
- Cifras útiles: deploy de 38 a 90 segundos en los ejemplos; paquete de unos 750 bytes por función simple y 1.7 MB con librerías.
- Limitaciones vistas: depende de credenciales de 4 horas y de la organización de cada alumno; los nombres de bucket deben ser únicos globalmente entre stages; cambiar service crea otra pila y otra API.

### Cómo ponerlo en un diagrama

No es un componente de ejecución: no se dibuja como caja del flujo, sino como una nota o un cuadro lateral (por ejemplo, "desplegado con Serverless Framework, stages dev, test y prod"). En el diagrama de arquitectura de solución del proyecto final conviene señalar con una leyenda que todo el despliegue está automatizado.

### Errores y trampas vistos en clase

- No cambiar org ni el ID de cuenta del ARN de LabRole.
- Credenciales de AWS Academy vencidas (4 horas) y falta de serverless login.
- Cambiar service y crear sin querer otra API.
- No instalar las librerías en el directorio o no incluirlas con package include.
- Atributos que no son clave en la definición de atributos de la tabla; nombre de tabla o bucket repetido entre stages.
- Olvidar que el evento llega en event body por la integración lambda.

### Preguntas tipo examen

1. ¿Qué automatiza Serverless Framework? Con un YAML y un comando crea y conecta Lambdas, API Gateway, tablas y buckets, por stage.
2. ¿Cómo se llamarán la pila, la Lambda y la API si el servicio es api-alumnos, el stage dev y la función listar? api-alumnos-dev, api-alumnos-dev-listar y dev-api-alumnos.
3. ¿Qué ocurre al desplegar en test y en prod? Se crean Lambdas y API Gateway distintos (por stage); con tres stages y dos funciones hay 6 Lambdas y 3 API Gateways.
4. ¿Cómo se pasa el nombre de una tabla a la Lambda según el stage? Variable de entorno definida en el provider con el nombre construido con el stage; la Lambda la lee de las variables de entorno.
5. ¿Cómo se crea una tabla desde el framework? En la sección resources, con claves HASH y RANGE y facturación por solicitud.

---

## IAM, LabRole y AWS Academy

### Qué es (definición del profesor)

- AWS Academy: entorno de laboratorio del curso, con credenciales temporales y servicios restringidos. El material no define IAM; lo que se ve son sus consecuencias prácticas.
- LabRole: rol existente de AWS Academy que se asigna a las Lambdas ("Uso de un rol existente") y se indica como ARN en el serverless.yml.
- Semana 14 (política de acceso de SQS): ejemplo de política con Effect, Principal, Action, Resource y Condition (mínimo privilegio).

### Conceptos clave y componentes

| Concepto | Qué se vio |
|---|---|
| Rol de ejecución de Lambda | Siempre LabRole; en la consola se elige "Uso de un rol existente"; en el serverless.yml se escribe su ARN con el ID de cuenta del alumno |
| Credenciales temporales | Se copian de AWS Details, AWS CLI en el archivo ~/.aws/credentials (clave de acceso, clave secreta y token de sesión); solo son válidas durante el Lab de AWS Academy (4 horas) y hay que reescribirlas al iniciar |
| Cognito | No disponible en AWS Academy (por eso el sistema propio de tokens) |
| Política de recurso de una cola | Permite que el servicio SNS envíe mensajes a la cola solo si el ARN de origen es el tema indicado |
| Permisos de las Lambdas | Con LabRole las Lambdas pudieron acceder a DynamoDB, S3, SNS, SQS, Rekognition, SSM y RDS; el material no muestra la configuración de roles |
| Región | us-east-1 (en el Taller 1 de la semana 10, us-west-2) |
| Credenciales de la CLI en CloudShell | CloudShell ya viene con credenciales y herramientas |
| Mínimo privilegio | Un usuario de base de datos por esquema; en producción, acceso a RDS solo por la red privada y grupos de seguridad (semana 15) |
| Lens (lectura complementaria) | SEC 2: mínimo privilegio y no compartir el mismo rol entre funciones (no visto en clase) |

### Cómo se usó en el laboratorio

- Lambdas creadas por consola: en Permisos, Cambiar el rol de ejecución predeterminado, Uso de un rol existente, LabRole.
- Lambdas desplegadas con el framework: el ARN de LabRole en iam role del provider (cambiar el ID de cuenta).
- MV de desarrollo: archivo de credenciales en /home/ubuntu/.aws/credentials, que se actualiza cada vez que se inicia el laboratorio.
- ARNs con cuenta propia: TopicArn de SNS, queue_url de SQS, ARN de las Lambdas y de las colas en la política; el ID de cuenta se ve en la consola (esquina superior derecha).
- Política de acceso de ColaSensorIoTFAB1 (Taller 4): se pega en la cola, Política de acceso, editar.

### Qué lo activa, qué necesita y qué produce

| Entrada | Salida |
|---|---|
| Rol LabRole asignado a la función | La función obtiene permisos para llamar a otros servicios AWS desde su código |
| Política de recurso de la cola con condición de ARN | Solo el tema indicado puede escribir en la cola |
| Credenciales vencidas | El deploy o los comandos de CLI fallan |

### Con qué otros servicios se combinó en clase

Todos los servicios usados desde Lambda (DynamoDB, S3, SNS, SQS, Rekognition, SSM, RDS) y Serverless Framework (ARN en el YAML). KMS cifra los parámetros SecureString y las variables de entorno.

### Cuándo usarlo, ventajas y limitaciones según el material

- Restricciones del laboratorio resumidas: no se pueden crear roles propios (se usa LabRole), Cognito no está disponible, las credenciales duran 4 horas, y los IDs de cuenta de las diapositivas deben reemplazarse.
- Para el examen, en una arquitectura real hay que justificar seguridad con: autorización en API Gateway (autorización integrada o validación propia), mínimo privilegio, secretos fuera del código, acceso a bases solo por red privada y cifrado.

### Cómo ponerlo en un diagrama

IAM no se dibuja como caja de flujo; se anota en la leyenda o junto a cada Lambda ("rol con permisos a DynamoDB y SNS") y se rotula la política de acceso en la flecha de SNS a SQS.

### Errores y trampas vistos en clase

- Olvidar seleccionar LabRole: la Lambda no tiene permisos.
- No cambiar el ID de cuenta del ARN del rol, del tema o de la cola.
- Credenciales vencidas.
- Olvidar la política de acceso de la cola cuando recibe de SNS.
- Abrir la base de datos a 0.0.0.0/0 en un entorno real.

### Preguntas tipo examen

1. ¿Qué rol de ejecución se usó y por qué? LabRole, porque AWS Academy no permite crear roles propios y es el rol existente del laboratorio.
2. ¿Cuánto duran las credenciales de AWS Academy y qué se hace al vencer? 4 horas; se copian de nuevo al archivo de credenciales.
3. ¿Qué elementos tiene la política de acceso de la cola para SNS? Effect Allow, Principal el servicio de SNS, Action de envío de mensajes, Resource la cola y Condition por ARN de origen igual al tema.
4. ¿Qué servicio recomendado no estaba disponible y cómo se resolvió? Cognito; con un sistema propio de usuarios y tokens (Lambda y DynamoDB).

---

## Postman y herramientas de prueba

### Qué es (definición del profesor)

Postman es el cliente HTTP usado para llamar a las APIs REST desplegadas; curl es la alternativa desde Linux (semana 11, Taller 3, Ejercicio 3). La consola de Lambda, SQS, SNS y DynamoDB se usó para probar y verificar cada componente.

### Conceptos clave y componentes

| Herramienta | Uso en clase |
|---|---|
| Postman | Método y URL de invocación; Body, raw, tipo JSON; header Authorization para APIs protegidas; la pestaña Params arma el query string; se usó una colección (api-vision-artificial) con la URL por reemplazar |
| curl | curl con la URL para GET; con la opción de método POST, cabecera Content-Type application/json y cuerpo con -d para POST; devuelve el JSON en la terminal |
| Eventos de prueba de Lambda | Test, Create new test event, nombre, JSON, Save, Invoke (semanas 9 y 13) |
| Pestaña Pruebas de API Gateway | Prueba el método con un cuerpo antes de implementar (semana 9) |
| Consola de SQS | Enviar y recibir mensajes; contadores de mensajes disponibles y en tránsito (semana 14) |
| Consola de DynamoDB | Explorar elementos de la tabla; Vista JSON; formato DynamoDB con tipos S, N y M |
| Correo electrónico | Verificación de las suscripciones de SNS (asunto, remitente AWS Notifications, cuerpo JSON) |
| CloudWatch Logs e Insights | Revisión de los prints de las Lambdas y de errores (semana 12) |
| jsonviewer.stack.hu | Visor de árboles JSON recomendado para los logs |
| Navegador | GET directo de las APIs de api-alumnos-rds en dev, test y prod |
| Padlet y Canvas | Entrega de evidencias de los ejercicios propuestos (capturas de Postman, tablas, correos) |

### Cómo se usó en el laboratorio

- Postman: POST con Body raw JSON a la URL de invocación (stage prod o dev); los tiempos de respuesta (1412 ms y 2 s en la primera llamada de la semana 11) se usaron para analizar cold start; para APIs protegidas se agrega el header Authorization con el token del login.
- curl: listar buckets con GET y listar objetos con POST más JSON, para dev, test y prod.
- Consola: eventos de prueba JSON de cada Lambda; verificación en tablas y colas.

### Qué lo activa, qué necesita y qué produce

| Entrada | Salida |
|---|---|
| Solicitud HTTP desde Postman o curl a la URL de la etapa | Respuesta JSON de la Lambda (statusCode y datos) |

### Con qué otros servicios se combinó en clase

API Gateway (siempre), Lambda, DynamoDB, SQS, S3, SNS (verificación por correo y tablas).

### Cuándo usarlo, ventajas y limitaciones según el material

- Postman para pruebas manuales con cuerpo y headers; curl para pruebas desde la MV de desarrollo y evidencias en Linux.
- No se vio en clase una herramienta de pruebas automatizadas.

### Cómo ponerlo en un diagrama

El cliente (Postman, navegador o aplicación web) es la caja de origen; flecha HTTPS hacia API Gateway.

### Errores y trampas vistos en clase

- Enviar el cuerpo sin JSON válido o sin los campos obligatorios (tenant_id).
- Olvidar el header Authorization en las APIs protegidas.
- Usar ids de ejemplo que no existen (modificar, buscar o eliminar un alumno no creado).
- Usar la URL de otra etapa u otra cuenta.

### Preguntas tipo examen

1. ¿Cómo se prueba un API REST con cuerpo JSON? En Postman, método y URL de invocación, Body, raw, JSON; o con curl con la opción de método, cabecera Content-Type y cuerpo.
2. ¿Cómo se prueba una Lambda sin API? Con un evento de prueba en la consola (Test, pegar JSON, Invoke).
3. ¿Qué se envía en el header de las APIs protegidas? Authorization con el token obtenido en el login.

---

## Entorno de desarrollo (MV Desarrollo y CloudShell)

### Qué es (definición del profesor)

- MV Desarrollo: máquina virtual EC2 Ubuntu que se usa como estación de trabajo para ejecutar Serverless Framework (no hospeda la aplicación). Se puede crear con la plantilla de CloudFormation del curso.
- CloudShell (semana 15): terminal integrada en la consola de AWS con credenciales, AWS CLI y cliente MySQL ya configurados.
- Cloud9 como servicio no se explicó: solo aparece en el nombre de la imagen (AMI Cloud9Ubuntu22) de la plantilla de la MV.
- Teoría de la semana 15 (entornos de desarrollo de software): desarrollo local, integración (opcional), pruebas, staging y producción; en el laboratorio se reflejan como stages dev, test y prod.

### Conceptos clave y componentes

| Concepto | Qué se vio |
|---|---|
| Plantilla de CloudFormation | Crea la instancia EC2 con una AMI específica (Cloud9Ubuntu22), tipo t3.micro, llave vockey, disco de 20 GB y un grupo de seguridad con los puertos 22 (SSH) y 80 (HTTP) abiertos a 0.0.0.0/0; devuelve el ID de instancia y la IP pública |
| Requisitos | node.js mayor que v20 (v20.19.0), npm (11.2.0) y aws CLI (2.25.2); instalar el framework con npm de forma global |
| Credenciales | /home/ubuntu/.aws/credentials (se actualizan cada 4 horas) |
| Rutas de trabajo | /home/ubuntu/lambdas, /home/ubuntu/serverless y /home/ubuntu/python (según el taller) |
| Acceso | ssh con la llave vockey.pem al usuario ubuntu de la IP pública; scp para copiar proyectos |
| GitHub | Cada servicio tiene su repositorio (api-alumnos, api-pelicula, api-web-scraping, api-vision-artificial...) que se clona en la MV |
| Entornos | Desarrollo local, integración, pruebas, staging y producción (teoría); dev, test y prod (laboratorio) |
| DevOps | Cultura que integra desarrollo y operaciones; CI y CD; ciclo plan, code, build, test, release, deploy, operate y monitor; infraestructura como código (teoría de la semana 15) |

### Cómo se usó en el laboratorio

Flujo repetido: ingresar a la MV Desarrollo, actualizar las credenciales, clonar el repositorio, ajustar org y role, ejecutar serverless login y serverless deploy; probar desde Postman (en el equipo local) o curl (desde la MV). En el Taller 4 de la semana 11 se usó además para crear scripts de Python (generar UUID, variables de entorno). En la semana 15 se usó CloudShell para crear el RDS, los parámetros y ejecutar el cliente MySQL.

### Qué lo activa, qué necesita y qué produce

La MV solo sirve para ejecutar comandos; produce el despliegue de los recursos en AWS. No hace parte de la arquitectura de la solución (no se dibuja en el diagrama de ejecución).

### Con qué otros servicios se combinó en clase

GitHub, Serverless Framework, IAM (credenciales), CloudFormation (plantilla de la MV), RDS y SSM (CloudShell).

### Cuándo usarlo, ventajas y limitaciones según el material

- Ventaja: entorno homogéneo con node, npm, aws CLI y serverless ya listos.
- Limitación: las credenciales caducan cada 4 horas.

### Cómo ponerlo en un diagrama

Nota opcional fuera de la arquitectura: "despliegue desde MV Desarrollo con Serverless Framework".

### Errores y trampas vistos en clase

- Credenciales sin actualizar.
- No instalar las librerías en el directorio del proyecto.
- Confundir la MV (herramienta de despliegue) con un servidor de la aplicación.

### Preguntas tipo examen

1. ¿Para qué se usa la MV Desarrollo? Para ejecutar Serverless Framework (node, npm, aws CLI) y desplegar; no hospeda la aplicación.
2. ¿Qué entornos de desarrollo se recomiendan? Local, integración, pruebas, staging y producción; en el curso dev, test y prod.
3. ¿Qué es DevOps? Cultura que integra desarrollo y operaciones para entregar nuevas funcionalidades con estabilidad, con CI y CD.

---

## Otros servicios mencionados solo en teoría

Útiles para completar un diagrama cuando el caso lo pida; ninguno se practicó.

| Servicio | Qué dijo el material |
|---|---|
| AWS Fargate | Motor informático sin servidor para ECS y EKS (cómputo de contenedores) |
| Amazon CloudFront | Acelera la entrega del contenido estático y puede cachear llamadas a la API (escenario Web application, semana 14) |
| Amazon Route 53 | Aparece en el diagrama del ejemplo To Do (semana 10) como entrada de los dispositivos |
| Amazon Kinesis | Flujo de datos en tiempo real que dispara Lambda (hashtags en redes sociales, sensores de un tractor); también como destino o suscriptor |
| AWS AppSync | Servicio administrado para APIs GraphQL escalables |
| Amazon EFS | Sistema de archivos elástico sin servidor, accesible por Lambda |
| Amazon OpenSearch Service sin servidor | Búsqueda y análisis; destino de la ingesta de documentos (sucesor de Elasticsearch Service) |
| Amazon Redshift, Neptune y ElastiCache sin servidor | Opciones de la capa de datos serverless (almacén de datos, grafos y caché) |
| Amazon RDS Proxy y Aurora Serverless | Ver sección de RDS |
| AWS X-Ray, AWS SAM | Lectura complementaria (trazas y despliegue) |
| AWS Well-Architected | Seis pilares (excelencia operativa, seguridad, fiabilidad, eficiencia de rendimiento, optimización de costos y sostenibilidad), enfoques (lenses) como el Serverless Applications Lens y la Well-Architected Tool gratuita (semana 14) |

---

## Comparaciones clave

### SQS frente a SNS frente a EventBridge

| Aspecto | SQS | SNS | EventBridge |
|---|---|---|---|
| Definición en clase | Cola de mensajes para desacoplar y escalar | Mensajería pub/sub A2A y A2P | Bus de eventos serverless |
| Modelo | Cola: un mensaje lo procesa un consumidor y se borra | Tema: un mensaje se entrega a todos los suscriptores | Bus: reglas que coinciden con el evento y lo envían a destinos |
| Recomendación del lens | Comunicación confiable y duradera entre microservicios | Fan-out de eventos | Filtrado y ruteo de eventos |
| Filtrado | No | Por atributos con política de filtro en cada suscripción | Reglas sobre todo el cuerpo del evento |
| Esquema | El cuerpo es un texto | Independiente del esquema | Esquema predefinido |
| Rendimiento | Estándar: capacidad máxima | Alto rendimiento y baja latencia, gran difusión (miles o millones de endpoints) | No se dieron cifras |
| Almacena mensajes | Sí (hasta que se borran; con DLQ) | No como cola; se entrega a los suscriptores | No |
| Uso en el laboratorio | sqs-pedidos, sqs-registrar-canvas y DLQ, ColaSensorIoTFAB1 | NuevoAlumno, TemaNuevoArchivo, TemaSensorIoT | Regla programada SimuladorSensorIoT (cada 1 minuto) |
| Típico en un diagrama | Entre productor y consumidor para absorber carga o reintentar | Un productor a varios consumidores (fan-out), alertas por correo | Disparar tareas programadas o enrutar eventos |

### DynamoDB frente a RDS visto en clase

| Aspecto | DynamoDB | RDS (MySQL) |
|---|---|---|
| Tipo | NoSQL clave-valor, sin esquema | Relacional (SQL) |
| Serverless | Sí, escala automáticamente, facturación por solicitud | No es serverless como DynamoDB en el curso: se crea una instancia (db.t3.micro, 20 GB, unos 15 dólares al mes) y se abre la red |
| Multi-tenancy | Patrón 1: tenant_id como clave de partición | Patrón 2: una base con un esquema por tenant (o dev, test y prod como esquemas) |
| Acceso desde Lambda | boto3 con el rol, sin conexión ni contraseña | pymysql con host, usuario y contraseña (secretos) |
| Proyecto final | Si es NoSQL, una tabla por microservicio con estructura JSON | Si es SQL, un único RDS con diagrama entidad-relación |
| Teoría | Almacén de microservicios que hacen una sola cosa (schemaless) | Opciones serverless: Aurora Serverless y RDS Proxy |

### Parameter Store frente a Secrets Manager

| Característica | Parameter Store | Secrets Manager |
|---|---|---|
| Tamaño | 4 KB (standard) u 8 KB (advanced) | 64 KB |
| Cifrado con KMS | Sí | Sí |
| Referencia desde CloudFormation | Sí | Sí |
| Generador de contraseñas | No | Sí |
| Rotación automática | No | Sí |
| Acceso entre cuentas | No | Sí |
| Costo | Gratis (standard) | Con costo |
| Uso en clase | Taller 2 de la semana 15 (SecureString) | Ejercicio propuesto (migración); no se practicó |

### Síncrono frente a asíncrono

| Aspecto | Síncrono (acoplado) | Asíncrono (basado en eventos, desacoplado) |
|---|---|---|
| Comunicación | Aplicación a aplicación: Buying llama a Shipping | Aplicación, cola o tema, aplicación |
| Espera | El emisor espera la respuesta (por ejemplo, 201 en cadena) | El emisor publica y sigue |
| Extensión | Agregar un consumidor obliga a modificar el productor | Nuevos suscriptores sin cambiar el productor |
| Resiliencia | Depende de que el receptor esté disponible | Los eventos no se pierden si el consumidor cae |
| En el laboratorio | API Gateway a Lambda; Lambda que invoca a ValidarTokenAcceso (RequestResponse) | S3 a Lambda; SNS; SQS con trigger o pull; EventBridge a Lambda |
| Efecto en la respuesta HTTP | La respuesta espera el resultado | RegistrarPedido responde 200 sin esperar al despacho |

### Token propio frente a Cognito

| Aspecto | Token propio (semana 10 Taller 1) | Cognito |
|---|---|---|
| Disponibilidad | Funciona en AWS Academy | No disponible en AWS Academy |
| Usuarios y contraseñas | t_usuarios con hash SHA-256 | Administración de usuarios en un user pool |
| Token | UUID v4 con expiración de 60 minutos en t_tokens_acceso | Tokens emitidos por Cognito |
| Validación | Lambda ValidarTokenAcceso invocada de forma síncrona por cada Lambda protegida | Los tokens autentican las solicitudes a API Gateway (según el lens) |
| Respuesta de error | 403 Forbidden en todos los casos | No visto en clase |
| Paso del token | Header Authorization y plantilla de asignación | Los tokens se envían al llamar a API Gateway |

### Estándar frente a FIFO

| Aspecto | SQS Estándar | SQS FIFO | SNS Estándar | SNS FIFO |
|---|---|---|---|---|
| Orden | Mejor esfuerzo | Primero en entrar, primero en salir | Mejor esfuerzo | Estrictamente conservado |
| Entrega | Al menos una vez | Procesamiento único | Al menos una vez | Entrega única |
| Rendimiento | Capacidad máxima | No se dieron cifras para SQS | Mayor número de publicaciones por segundo | Hasta 300 publicaciones por segundo |
| Suscriptores | Lambda o consumidores por pull | Igual | SQS, Lambda, HTTP, SMS, correo, móvil | Solo SQS |
| Cambiar el tipo | No se puede después de crear | No se puede | No se puede | No se puede |
| Uso en el curso | Siempre | Nunca | Siempre | Nunca |

### Cómo llega el evento a Lambda según el disparador

| Disparador | Dónde está el dato útil |
|---|---|
| API Gateway manual | Directamente en el evento |
| API Gateway con plantilla de asignación | En la clave de cuerpo y en la clave de encabezados del evento armado por la plantilla |
| API Gateway creado por el framework (integration lambda) | En la clave body del evento |
| S3 | En el primer registro: clave del objeto, tamaño, bucket, hora |
| SNS | En el campo Message (texto JSON) del primer registro |
| SQS directo | En el campo body del primer registro |
| SNS a SQS a Lambda | En body (sobre de SNS) y dentro, en Message (doble parseo) |
| EventBridge programado | No se usa el contenido |

---

## Patrones de arquitectura vistos en clase

1. CRUD REST multi-tenant. API Gateway recibe POST, PUT o DELETE; una Lambda por operación; DynamoDB con tenant_id como clave de partición. Semana 9 Taller 2 (manual), semana 10 Taller 2 y propuesto (con Serverless Framework), semanas 11 y 12 (comentarios y películas).
2. Seguridad con token propio. API usuarios (crear y login) más API productos protegida: la Lambda protegida invoca de forma síncrona a ValidarTokenAcceso, que consulta t_tokens_acceso; 403 si falla. Semana 10 Taller 1 y propuesto.
3. Multi-stage con Serverless Framework. Un YAML y la opción de stage generan dev, test y prod con Lambdas, API, tablas y buckets independientes. Semana 11 Talleres 3 y 4; semana 15 (api-alumnos-rds).
4. Ingesta Push a S3. La Lambda guarda el dato en DynamoDB y además como archivo tenant_id/uuid.json en el bucket de ingesta de su stage. Semana 11 Taller 4, ejercicio propuesto.
5. Observabilidad con logs. Lambdas que imprimen entrada y salida, CloudWatch Logs y consultas de Logs Insights (métricas REPORT, filtros por tenant, errores). Semana 12 Taller 1.
6. Web scraping serverless. API Gateway GET, Lambda con requests y BeautifulSoup, DynamoDB (borra y reescribe). Semana 12 Taller 2.
7. Pub/sub fan-out con filtros. Lambda productora, tema SNS, suscripciones con filtro por tenant (correo y Lambdas a tablas). Semana 13 Taller 1 y propuesto.
8. Evento de S3. S3 (ObjectCreated), Lambda LeerMetadataArchivo, tema SNS, correo y Lambda CrearArchivo_UTEC a DynamoDB; el prefijo de la clave identifica al tenant. Semana 13 Taller 2.
9. Despacho de pedidos desacoplado con SQS. API Gateway, Lambda RegistrarPedido, cola estándar sqs-pedidos, API Gateway, Lambda ProcesarPedido (pull con espera larga), DynamoDB; varios despachadores consumiendo de la misma cola. Semana 14 Taller 3, Ejercicio 1.
10. Cola con DLQ y reintentos. Cola principal con trigger a una Lambda; tras 2 recepciones fallidas el mensaje pasa a la DLQ. Semana 14 Taller 3, Ejercicio 3.
11. Eventos programados con fan-out filtrado (IoT). EventBridge cada minuto, Lambda generadora, tema SNS, correo con filtro por sensor y umbral, y cola SQS con trigger a Lambda que guarda en DynamoDB, con política de acceso de la cola. Semana 14 Taller 4.
12. IA como API. API Gateway, Lambda, Rekognition leyendo la imagen de S3. Semana 15 Taller 1.
13. Secretos y bases relacionales por ambiente. API Gateway, Lambda, Parameter Store para contraseñas y host, RDS MySQL con esquemas dev, test y prod y usuario por esquema; rotación propuesta con EventBridge y Lambda. Semana 15 Taller 2.
14. Arquitecturas de teoría (semana 10, no practicadas): procesamiento de datos (S3, SNS, dos colas SQS, Lambdas, Comprehend, DynamoDB, DLQ con alarma de CloudWatch y SNS), por lotes (EventBridge, Step Functions, Lambdas, S3, SNS), ingesta de eventos (S3, Lambdas, Rekognition, SQS, Comprehend, OpenSearch), archivos (S3 a Lambda que redimensiona), streaming (Kinesis, Lambda, DynamoDB), web (S3, API Gateway, Lambda, DynamoDB), backends móviles (Lambda, API Gateway, Amplify) y To Do (Route 53, Amplify, Cognito, API Gateway, Lambdas, DynamoDB).
15. Escenarios del Serverless Applications Lens (semana 14): microservicios RESTful (API Gateway, Lambda, DynamoDB), aplicación web (Cognito, CloudFront, S3, API Gateway, Lambda, DynamoDB) y arquitectura dirigida por eventos (fuentes, ruteadores y destinos con EventBridge, SNS y SQS).
16. Multi-tenancy (semana 9): patrón 1 (esquema compartido con tenant_id, el usado con DynamoDB), patrón 2 (una base con esquemas por tenant, el requerido para SQL en el proyecto final) y patrón 3 (una base por tenant, máximo aislamiento y máximo esfuerzo).
