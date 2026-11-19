# Semana 10 — Arquitectura serverless (AWS Lambda, API Gateway, DynamoDB) y Serverless Framework

> Curso CS2032 Cloud Computing (Ciclo 2026-2), docente Geraldo Colchado. Fuentes: `teoria/semana-10/` y `laboratorio/semana-10/`. Todo lo que figura aquí sale del material; lo que no está se marca "(no aparece en el material)".

## 0. Mapa de materiales revisados

| Archivo | Tipo | Resumen de 1 línea |
|---|---|---|
| `teoria/semana-10/1. Arquitectura sin servidor (serverless) - Teoría - V1.20.pdf` (26 diapositivas) | PDF teoría (texto + imágenes, revisado visualmente) | Qué es serverless y FaaS, cuándo usarla, servicios AWS por capa (cómputo, integración, datos) y 8 ejemplos de arquitecturas. |
| `laboratorio/semana-10/1. Serverless - Taller 1 - V2.00.pdf` (20 pág.) | PDF Taller 1 (PRIORIDAD) | Sistema de seguridad serverless: usuarios + login con token con expiración + API de productos protegida (3 tablas DynamoDB, 4 Lambdas, 2 API Gateway). |
| `laboratorio/semana-10/1. Serverless - Taller 2 - V2.11.pdf` (18 pág.) | PDF Taller 2 (PRIORIDAD) | Serverless Framework: instalar, credenciales, `serverless login`, `serverless deploy` de la API REST `api-alumnos`. |
| `mates1/` y `Materiales S10 - Taller 1.zip` (idéntico, md5 verificado) | ZIP + sueltos | `Lambda_CrearUsuario.py`, `Lambda_LoginUsuario.py`, `Lambda_ValidarTokenAcceso.py`, `LambdaCrearProducto.py`, `plantilla_asignación.txt`, `arquitectura_seguridad.drawio.png`. |
| `mates1/arquitectura_seguridad.drawio.png` | Imagen | Diagrama de 8 pasos del sistema de seguridad (misma imagen que la diapositiva 7 del Taller 1). |
| `mates1/plantilla_asignación.txt` | Texto | Plantilla de mapeo (mapping template) `application/json` de la "Solicitud de integración" de API Gateway que pasa el header `Authorization`. |
| `mates2/` y `Materiales S10 - Taller 2.zip` (idéntico en contenido) | ZIP + sueltos | `CrearAlumno.py`, `ListarAlumnos.py`, `serverless.yml`, `json_crear_alumno.txt`, `json_listar_alumnos.txt`, `plantilla_crear_mv.yaml`, un `.url` (roadmap de APIs). |
| `mates2/api-alumnos/`, `mates2/api-alumnos-propuesto/` | Carpetas de proyecto | `api-alumnos` = solo `listar` (ejercicio guiado, versión del ZIP con `org: geraldocolchado`, versión en carpeta con `org: renzocuba`); `api-alumnos-propuesto` = `listar` + `crear` (solución del guiado). |
| `mates2/plantilla_crear_mv.yaml` (= `plantilla_crear_mv.yaml` raíz, mismo md5) | CloudFormation YAML | Plantilla para crear la MV EC2 de desarrollo (AMI Ubuntu 22 con Cloud9, t3.micro, SG con 22 y 80). |
| `mates2/json_crear_alumno.txt`, `json_listar_alumnos.txt` | JSON de prueba | Cuerpos para probar `/alumnos/crear` y `/alumnos/listar` en Postman. |
| `mates2/how-to-learn-api-api-roadmap.url` | Acceso directo | Enlace a un artículo "how to learn API" (techworld-with-milan); complemento, sin contenido en el material. |
| `api-alumnos-completo/` | Proyecto (solución) | `serverless.yml` con 5 funciones + `BuscarAlumno.py`, `ModificarAlumno.py`, `EliminarAlumno.py` (solución del Ejercicio Propuesto Taller 2). |
| `api-productos/` | Proyecto (solución) | `serverless.yml` con 4 funciones protegidas + `ListarProductos.py`, `BuscarProducto.py`, `ModificarProducto.py`, `EliminarProducto.py`, 4 `json_*.json` y `GUIA.md` (solución del Ejercicio Propuesto Taller 1). |
| `S10 Taller 1 - Ejercicio Propuesto.md` | Enunciado Canvas | Entrega 2026-10-26, 20 puntos; solo contiene una imagen (`image.png`) sin descripción de texto. |
| `S10 Taller 2 - Ejercicio Propuesto.md` | Enunciado Canvas | Entrega 2026-10-26, 20 puntos; "(sin descripción)". |

Duplicados ignorados: `__MACOSX`; `plantilla_crear_mv.yaml` (copia en la raíz de laboratorio y en `mates2`, mismo md5); `mates1/*.py` = contenido del ZIP del Taller 1; `CrearAlumno.py`/`ListarAlumnos.py` repetidos en `mates2`, `api-alumnos*` y ZIP; `json_buscar_producto.json` = `json_eliminar_producto.json`. No hay libros/lecturas grandes en esta semana.

Diferencia detectada: `serverless.yml` de `mates2/api-alumnos/` en carpeta (org `renzocuba`, cuenta `092781274895`) difiere del que viene en el ZIP del Taller 2 (org `geraldocolchado`, cuenta `498917627164`, igual a lo que muestran las diapositivas). Solo cambian `org` y el ID de cuenta en el ARN del rol: son los valores que cada alumno debe cambiar.

---

## 1. Teoría

### 1.1 Objetivos de la sesión (diapositiva 3)
- Comprender qué es una arquitectura serverless.
- Identificar cuándo es conveniente usarla.
- Conocer qué servicios de AWS se pueden usar para una arquitectura serverless.

Preguntas de cierre del docente (diap. 25): explicar con tus propias palabras (1) qué es una arquitectura serverless, (2) cuándo es conveniente, (3) qué servicios de AWS se pueden usar.

### 1.2 Qué es serverless (fuente AWS, diap. 5)
Lema: *"Cree y ejecute aplicaciones sin preocuparse por los servidores"*.

Definición (AWS): son **tecnologías para ejecutar código, administrar datos e integrar aplicaciones, todo sin tener que administrar servidores**. Incluyen:
- **escalado automático**,
- **alta disponibilidad integrada**,
- **modelo de facturación de pago por uso** (para aumentar agilidad y optimizar costos).

Además **eliminan las tareas de administración de infraestructura**, como el **aprovisionamiento de capacidad** y la **aplicación de parches**, para que el equipo se enfoque en **escribir el código que sirva a sus clientes**.

Idea clave: "sin servidor" no significa que no existan servidores, sino que **el desarrollador no los administra** (la frase exacta del material es "sin tener que administrar servidores").

### 1.3 FaaS: Función como Servicio (fuente Red Hat, diap. 6)
- **FaaS** es un tipo de servicio de cloud computing que permite a los desarrolladores **diseñar, ejecutar y gestionar paquetes de aplicaciones como funciones** sin ocuparse del mantenimiento de su propia infraestructura.
- Es un **modelo de ejecución basado en eventos** que se ejecuta en **contenedores sin estado** (stateless).
- Las funciones gestionan la lógica y el estado de los servidores mediante el uso de los servicios de un proveedor FaaS.
- En AWS el servicio FaaS es **AWS Lambda** (en el material: "servicio informático basado en los eventos y de pago por uso que le permite ejecutar código sin aprovisionar ni administrar servidores").

Consecuencia práctica vista en el laboratorio: como las funciones no guardan estado, el estado persistente se guarda en un servicio administrado (DynamoDB: usuarios, tokens, productos, alumnos).

### 1.4 Cuándo utilizarla (diap. 8): 4 beneficios
| Beneficio (título en la diapositiva) | Idea |
|---|---|
| **Pase de la idea al mercado, más rápido** | Se elimina el exceso de tareas operativas; los equipos pueden **efectuar lanzamientos rápidamente**, obtener retroalimentación e iterar. |
| **Disminuya sus costos** | Facturación **pago por valor**; la utilización de recursos se optimiza automáticamente y **nunca deberá pagar por exceso de aprovisionamiento**. |
| **Adapte a escala** | Tecnologías que **escalan automáticamente de cero a las demandas máximas**; se adapta a las necesidades del cliente más rápido. |
| **Cree mejores aplicaciones, con más facilidad** | Tienen **integraciones de servicios integradas**; puede **centrarse en construir la aplicación en lugar de configurarla**. |

Desventajas / cuándo no usarla: **(no aparece en el material)**. Solo se pueden deducir observaciones del laboratorio (p. ej. timeout por defecto de Lambda de 3 s; credenciales de AWS Academy válidas 4 h; Cognito no disponible en AWS Academy).

### 1.5 Cómo implementarla en AWS: tres capas (diap. 11-13)
AWS ha desarrollado servicios sin servidor para **tres capas**: **cómputo (informática)**, **integración de la aplicación** y **almacén/almacenamiento de datos**. (Los elementos resaltados en amarillo en las diapositivas —los que más se usan en la clase— están marcados con ★.)

**Capa 1 — Informática (cómputo)**
| Servicio | Descripción del material |
|---|---|
| **AWS Lambda ★** | Servicio informático **basado en eventos y de pago por uso** que permite ejecutar código sin aprovisionar ni administrar servidores. |
| **AWS Fargate** | Motor informático sin servidor que funciona tanto con **Amazon ECS** (Elastic Container Service) como con **Amazon EKS** (Elastic Kubernetes Service). |

**Capa 2 — Integración de la aplicación**
| Servicio | Descripción del material |
|---|---|
| **Amazon EventBridge** | **Bus de eventos sin servidor** para crear aplicaciones basadas en eventos y escalar en AWS y sistemas existentes. |
| **AWS Step Functions** | **Organizador visual de flujos de trabajo** que facilita la secuenciación de múltiples servicios de AWS en aplicaciones fundamentales. |
| **Amazon SQS ★** | Servicio de **colas de mensajes** que permite **desacoplar y escalar** microservicios, sistemas distribuidos y aplicaciones sin servidor. |
| **Amazon SNS ★** | Servicio de **mensajería** completamente administrado para comunicación **aplicación a aplicación (A2A)** y **de aplicación a persona (A2P)**. |
| **Amazon API Gateway ★** | Servicio completamente administrado que facilita la **creación y publicación de API a cualquier escala**. |
| **AWS AppSync** | Servicio completamente administrado que acelera el desarrollo de aplicaciones con **API escalables de GraphQL**. |

**Capa 3 — Almacén de datos**
| Servicio | Descripción del material |
|---|---|
| **Amazon S3 ★** | Servicio de **almacenamiento de objetos** para almacenar y proteger cualquier cantidad de datos. |
| **Amazon EFS** | Sistema de **archivos totalmente elástico y sin servidor**; facilita configuración, escalabilidad y optimización de costos del almacenamiento compartido de alta disponibilidad. |
| **Amazon DynamoDB ★** | Base de datos **sin servidor, NoSQL y totalmente administrada**, rendimiento de milisegundos de un solo dígito a cualquier escala. |
| **Amazon RDS Proxy** | **Proxy de base de datos** administrada para Amazon RDS; hace las aplicaciones más escalables y seguras. |
| **Amazon Aurora Serverless** | Base de datos relacional compatible con **MySQL y PostgreSQL** que escala la capacidad automáticamente según las necesidades. |
| **Amazon Redshift sin servidor** | Permite ejecutar y escalar análisis (data warehouse) sin administrar la infraestructura; se paga solo por lo que se usa. |
| **Amazon Neptune sin servidor** | Base de datos de **grafos** escalable; aprovisiona capacidad automáticamente. |
| **Amazon OpenSearch sin servidor** | Opción sin servidor de OpenSearch Service para búsquedas y análisis sin aprovisionar. |
| **Amazon ElastiCache sin servidor** | Caché de alta disponibilidad, se escala en función de la demanda (rendimiento ultrarrápido). |

### 1.6 Ejemplos de arquitecturas serverless (diap. 15-23)
Cada diapositiva trae un diagrama; se describen en texto.

| # | Ejemplo | Flujo / servicios | Descripción del material |
|---|---|---|---|
| 1 | **Aplicaciones web** (app "To Do") | Dispositivos → Route 53 → (Amplify Console + Cognito) → **API Gateway "ToDo API"** → varias **Lambdas** (`addTodo`, `completeTodo`, `deleteTodo`, `getAllTodo`, `getTodo`, `updateTodo`) → **DynamoDB** (Items Table). GitHub Repository → Amplify Console. | App de "cosas para hacer": usuario registrado crea, actualiza, visualiza y elimina elementos. **Lambda + API Gateway** = lógica empresarial; **DynamoDB** = base de datos; **AWS Amplify** hospeda el contenido estático. |
| 2 | **Procesamiento de datos** | Objeto Markdown → **S3 origen** → evento **SNS** "new object created" → 2 colas **SQS** (Conversion Service, Sentiment Analysis) → Lambda "HTML conversion" → S3 salida; Lambda "Sentiment Analysis" → **Amazon Comprehend** → tabla DynamoDB. Errores → **Dead Letter Queue** → alarma CloudWatch → notificación SNS por email. | Notas de entrevista en Markdown a S3; los **eventos de S3** disparan varios flujos: convertir Markdown a HTML y guardarlo, y detectar y guardar el sentimiento. |
| 3 | **Procesamiento por lotes** | Regla de **EventBridge** (programada) → flujo **Step Functions**: Lambda "Get file inventory" (lista archivos del día anterior en bucket OpenAQ) → Lambdas "Process files" (en paralelo, x2) → Wait 10 s → Lambda "Aggregate results" → Lambda "Delete intermediate results" → **SNS** (email). Buckets S3 de resultados intermedios y salida final. | Programar flujos recurrentes con regla de EventBridge; ejemplo: mínimas, máximas y promedio de calidad del aire orquestando un **ETL** (extracción, transferencia y carga) con **Step Functions + Lambda**. |
| 4 | **Ingesta de eventos** (indexar documentos e imágenes) | Bucket de documentos (PDF, DOCX, JPG) → Lambdas "Extract Text" (JPG usa **Rekognition**) → buckets staging/queued → Lambda "Split files" → Lambda "Add to SQS queue" → **SQS** → Lambda "Analyze" (usa **Comprehend**) → **Amazon Elasticsearch/OpenSearch**. | Usar ML (**Amazon Comprehend**, **Rekognition**) para descubrir información en datos no estructurados y enviar resultados a **OpenSearch** (sucesor de Elasticsearch Service) para indexación rápida. Útil en e-commerce, p. ej. análisis de secuencias de clics. |
| 5 | **Procesamiento de archivos** | Foto → sube a **S3** → dispara **Lambda** (redimensiona) → imagen en tamaños web, móvil y tablet. | S3 dispara Lambda **en tiempo real tras una carga**; o conexión a un sistema **Amazon EFS** existente para acceso compartido masivamente paralelo en procesamiento de archivos a gran escala. |
| 6 | **Procesamiento de transmisiones (streaming)** | Flujo social → **Kinesis** → dispara **Lambda** (calcula tendencias de hashtags) → **DynamoDB** → usuarios de negocio consultan. | Lambda + Kinesis para datos de streaming en tiempo real: seguimiento de actividad de apps, pedidos de transacciones, flujo de clics, limpieza de datos, filtrado de logs, indexación, redes sociales, telemetría IoT y medición. |
| 7 | **Aplicaciones web** (clima) | Front-end en **S3** → clic del usuario → **API Gateway** (REST) → **Lambda** → **DynamoDB** (datos del clima) → respuesta. | Lambda con otros servicios AWS crea aplicaciones web que escalan automáticamente y corren con **alta disponibilidad en varios centros de datos**. |
| 8 | **Backends para IoT** | Sensores de tractor → **Kinesis** → **Lambda** (detecta tendencias/anomalías) → pedido automático de repuestos. | Backends sin servidor con Lambda para administrar solicitudes **web, móviles, IoT y API de terceros**. |
| 9 | **Backends móviles** | **Lambda + API Gateway** para autenticar y procesar solicitudes de API; **AWS Amplify** para integrar con frontends iOS, Android, web y React Native. | (diap. 23, solo texto; sin diagrama relevante). |

Regla mnemotécnica de patrones: **Eventos de S3 / Kinesis / EventBridge / API Gateway disparan Lambda**; Lambda guarda en **DynamoDB/S3**; SQS/SNS desacoplan y notifican; Step Functions orquesta.

### 1.7 Arquitectura de referencia: microservicios RESTful (Taller 1, diap. 5)
Fuente: AWS Well-Architected Serverless Applications Lens. Esquema: `App ↔ (1) Amazon API Gateway ↔ (2) AWS Lambda ↔ (3) Amazon DynamoDB (4)`.

1. **Clientes** usan los microservicios haciendo llamadas HTTP a la API; idealmente los consumidores tienen un **contrato de servicio estrechamente ligado** a la API para tener expectativas consistentes de niveles de servicio y control de cambios.
2. **API Gateway** hospeda las solicitudes y respuestas HTTP RESTful. Ofrece **autorización integrada (built-in authorization)**, **throttling**, seguridad, tolerancia a fallos, **mapeo de solicitud/respuesta** y optimizaciones de rendimiento.
3. **AWS Lambda** contiene la **lógica de negocio** para procesar las llamadas a la API y usa DynamoDB como almacenamiento persistente.
4. **DynamoDB** **almacena persistentemente** los datos de los microservicios y **escala según la demanda**. Como los microservicios suelen hacer una sola cosa, se suele usar un almacén NoSQL **sin esquema (schemaless)**.

### 1.8 Serverless Framework (Taller 2, diap. 4-5; resumen teórico)
- Es un framework ("serverless framework", www.serverless.com): *"Do more with less. Serverless. All-in-one development solution for auto-scaling apps on AWS Lambda"*.
- Tres ideas de la página que se proyecta (slide "Develop. Zero-friction serverless development."):
  1. **Definir aplicaciones como funciones y eventos**: declarar funciones Lambda y sus disparadores (triggers) con sintaxis YAML abstracta simple.
  2. **Desplegar infraestructura y código con un solo comando**: las funciones Lambda, triggers y código se despliegan y conectan automáticamente en la nube.
  3. **Extender con Plugins**: miles de plugins para nuevos casos de uso e integración con otras herramientas.
- Beneficio práctico (lo que se ve en el taller): con un solo `serverless deploy` se crean Lambdas + API Gateway REST (+ stack de CloudFormation, ver 1.9), en lugar de crearlos a mano en consola como en el Taller 1.

### 1.9 Cómo nombra recursos el framework (Taller 2, diap. 11, 14)
- `service: api-alumnos` + stage por defecto `dev` ⇒ stack **`api-alumnos-dev`** (salida: "Service deployed to stack api-alumnos-dev (78s)").
- Nombre de cada Lambda = `<service>-<stage>-<clave de función>` ⇒ `api-alumnos-dev-listar`.
- Nombre de API Gateway = `<stage>-<service>` ⇒ **`dev-api-alumnos`** (protocolo REST).
- URL del endpoint: `https://<id>.execute-api.<región>.amazonaws.com/<stage>/<path>` (ej. `.../dev/alumnos/listar`). El deploy de la diapositiva usó región **us-east-1**.
- Las diapositivas del Taller 1 (hecho a mano) usaron stage **`prod`**, región **us-west-2**: `.../prod/usuarios/crear`.

### 1.10 Conceptos de seguridad con token (Taller 1)
- **Cognito** es el servicio recomendado para usuarios, passwords y autorización, pero **no está disponible en AWS Academy**; por eso se construye un sistema propio con Lambda + DynamoDB.
- Contraseñas nunca en claro: se almacena el **hash SHA-256** (hex) de la contraseña.
- **Token**: UUID v4 aleatorio con **fecha/hora de expiración (60 minutos)** guardado en `t_tokens_acceso`.
- **Protección de un Lambda (patrón del curso)**: el Lambda protegido lee el header `Authorization`, **invoca sincrónicamente** (`RequestResponse`) al Lambda `ValidarTokenAcceso`; si este responde `statusCode 403`, devuelve 403 "Forbidden - Acceso No Autorizado"; si no, ejecuta su proceso.
- Se usa el valor 403 tanto para usuario inexistente, password incorrecto, token inexistente y token expirado (en el código).

---

## 2. Laboratorio

### 2.A Taller 1 — Sistema de Seguridad (PRIORIDAD MÁXIMA)

**Objetivo**: implementar un **Sistema de Seguridad Serverless** para **proteger el acceso a las APIs** con un **token con expiración**.

**Nota del docente**: para manejo de usuarios, passwords y autorización se recomienda **AWS Cognito**, pero actualmente **no está disponible en AWS Academy**.

#### Arquitectura (diagrama "Arquitectura de Solución de Sistema de Seguridad", 8 flujos numerados)
```
                       POST /usuarios/crear        (1) registra (user, pass)
 [api usuarios] ───────► CrearUsuario  ──────────────────────────────► [t_usuarios]
  (API Gateway)          
       │ POST /usuarios/login   (2) valida (user, pass)  ──────────────► [t_usuarios]
       └────────────► LoginUsuario ── (3) genera token y expiración ──► [t_tokens_acceso]
            ◄─ (4) devuelve token para acceso a APIs protegidas

 [api productos (protegida)]  POST /productos/crear  { token, producto }
       └────────────► CrearProducto ── (5) token ──► ValidarTokenAcceso ── (6) valida (token, expiración) ──► [t_tokens_acceso]
                          ◄──────── (7) autoriza acceso ───────┘
                          └── (8) registra producto ──► [t_productos]
```
Los pasos 1-4 (zona punteada superior) = emisión del token; 5-7 = validación; 8 = ejecución protegida.

#### Recursos a crear
| Recurso | Detalle |
|---|---|
| DynamoDB `t_usuarios` | Clave de partición **`user_id` (S)**; sin clave de ordenación. |
| DynamoDB `t_tokens_acceso` | Clave de partición **`token` (S)**; sin clave de ordenación. Atributo adicional `expires` (cadena). |
| DynamoDB `t_productos` | Clave de partición **`tenant_id` (S)**, clave de ordenación **`producto_id` (S)**. |
| Lambdas (runtime **Python 3.12**, paquete Zip) | `CrearUsuario`, `LoginUsuario`, `ValidarTokenAcceso`, `CrearProducto`. **Timeout = 30 s** (por defecto es 3 s) en cada Lambda: Configuración → Configuración general → Tiempo de espera 0 min 30 s. |
| API Gateway `usuarios` | Recurso `/usuarios` con hijos `/crear` (POST) y `/login` (POST) (cada recurso tiene además método OPTIONS para CORS). |
| API Gateway `productos` | Recurso `/productos` con hijo `/crear` (POST). Con **Solicitud de integración** (mapping template) para pasar el header `Authorization`. |

#### Pasos numerados (como en el PDF)
1. **Crear tablas en DynamoDB** (`t_usuarios`, `t_tokens_acceso`, `t_productos`) con las claves de la tabla anterior (estado Activo).
2. **Crear Lambdas** `CrearUsuario`, `LoginUsuario`, `ValidarTokenAcceso`, `CrearProducto` (código en 2.A.1) y **configurar timeout de 30 s** en cada una.
3. **Crear API Gateway "usuarios"**: recurso `/usuarios`, sub-recursos `/crear` y `/login`, método **POST** en cada uno integrado con su Lambda correspondiente.
4. **Probar API usuarios: crear usuario**. En Postman: `POST https://<id>.execute-api.us-west-2.amazonaws.com/prod/usuarios/crear`, Body → **raw → JSON**:
   ```json
   { "user_id": "gcolchado@utec.edu.pe", "password": "123456" }
   ```
   Respuesta esperada:
   ```json
   { "statusCode": 200, "body": { "message": "User registered successfully", "user_id": "gcolchado@utec.edu.pe" } }
   ```
   En `t_usuarios` queda `user_id` y `password` = hash SHA-256 (`8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92` para "123456").
5. **Probar login**: `POST .../prod/usuarios/login` con el mismo body. Respuesta esperada:
   ```json
   { "statusCode": 200, "token": "ae975067-bdd4-4e39-89fe-272c8d499ed8" }
   ```
   En `t_tokens_acceso` aparece `token` y `expires` (ej. `2024-06-24 01:53:04`).
6. **Crear API Gateway "productos"**: recurso `/productos` → `/crear` → POST. En el método, pestaña **Solicitud de integración** → **plantilla de asignación** (mapping template) con tipo de contenido `application/json`:
   ```json
   {
     "method": "$context.httpMethod",
     "path": "$context.path",
     "headers": {
       "Authorization": "$input.params('Authorization')"
     },
     "body": $input.body
   }
   ```
   Esta es la razón por la que el Lambda lee `event['headers']['Authorization']` y `event['body']` (el evento ya no es el body plano sino este JSON armado por la plantilla). (La plantilla está en `mates1/plantilla_asignación.txt`.)
7. **Probar API productos: crear producto**. `POST https://<id>.execute-api.us-west-2.amazonaws.com/prod/productos/crear`
   - Headers: `Authorization: <token obtenido en login>`; Body raw JSON:
     ```json
     { "tenant_id": "PLAZA_VEA", "producto_id": "DET001", "nombre": "Detergente Sapolio 2.5 Kg" }
     ```
   - Con token válido: `{ "statusCode": 200 }` y el producto aparece en `t_productos` (tenant_id=PLAZA_VEA, producto_id=DET001, nombre).
   - Con token falso (la prueba usa `Authorization: 123`): 
     ```json
     { "statusCode": 403, "status": "Forbidden - Acceso No Autorizado" }
     ```

#### 2.A.1 Código de las Lambdas (completo, comentado)

**CrearUsuario** (`Lambda_CrearUsuario.py`) — recibe `user_id` y `password` directamente en el evento (sin mapping template):
```python
import boto3
import hashlib

# Hashear contraseña
def hash_password(password):
    # Retorna la contraseña hasheada (SHA-256 en hexadecimal)
    return hashlib.sha256(password.encode()).hexdigest()

# Función que maneja el registro de user y validación del password
def lambda_handler(event, context):
    try:
        # Obtener el user_id y el password del evento
        user_id = event.get('user_id')
        password = event.get('password')

        # Verificar que ambos existen
        if user_id and password:
            # Hashea la contraseña antes de almacenarla
            hashed_password = hash_password(password)
            # Conectar DynamoDB
            dynamodb = boto3.resource('dynamodb')
            t_usuarios = dynamodb.Table('t_usuarios')
            # Almacena los datos del user en la tabla de usuarios
            t_usuarios.put_item(
                Item={
                    'user_id': user_id,
                    'password': hashed_password,
                }
            )
            # Retorna 200 y mensaje de éxito
            mensaje = {
                'message': 'User registered successfully',
                'user_id': user_id
            }
            return {'statusCode': 200, 'body': mensaje}
        else:
            mensaje = {'error': 'Invalid request body: missing user_id or password'}
            return {'statusCode': 400, 'body': mensaje}

    except Exception as e:
        # Excepción: retorna 500
        print("Exception:", str(e))
        mensaje = {'error': str(e)}
        return {'statusCode': 500, 'body': mensaje}
```
Puntos clave: `event.get(...)` (no falla si falta), `put_item`, hash SHA-256, códigos 200/400/500.

**LoginUsuario** (`Lambda_LoginUsuario.py`):
```python
import boto3
import hashlib
import uuid # Genera valores únicos
from datetime import datetime, timedelta

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def lambda_handler(event, context):
    # Entrada (json)
    user_id = event['user_id']
    password = event['password']
    hashed_password = hash_password(password)
    # Proceso: buscar el usuario por su clave de partición
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_usuarios')
    response = table.get_item(Key={'user_id': user_id})
    if 'Item' not in response:
        return {'statusCode': 403, 'body': 'Usuario no existe'}
    else:
        hashed_password_bd = response['Item']['password']
        if hashed_password == hashed_password_bd:
            # Genera token (UUID) y expiración = ahora + 60 minutos
            token = str(uuid.uuid4())
            fecha_hora_exp = datetime.now() + timedelta(minutes=60)
            registro = {
                'token': token,
                'expires': fecha_hora_exp.strftime('%Y-%m-%d %H:%M:%S')
            }
            table = dynamodb.Table('t_tokens_acceso')
            dynamodbResponse = table.put_item(Item = registro)
        else:
            return {'statusCode': 403, 'body': 'Password incorrecto'}

    # Salida (json)
    return {'statusCode': 200, 'token': token}
```
Puntos clave: compara hash con hash; `uuid.uuid4()`; `timedelta(minutes=60)`; formato `'%Y-%m-%d %H:%M:%S'`; `get_item` con `Key`; revisa `'Item' not in response`.

**ValidarTokenAcceso** (`Lambda_ValidarTokenAcceso.py`):
```python
import boto3
from datetime import datetime

def lambda_handler(event, context):
    # Entrada (json): {"token": "..."}
    token = event['token']
    # Proceso
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_tokens_acceso')
    response = table.get_item(Key={'token': token})
    if 'Item' not in response:
        return {'statusCode': 403, 'body': 'Token no existe'}
    else:
        expires = response['Item']['expires']
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        # Comparación de cadenas de fecha (formato ordenable lexicográficamente)
        if now > expires:
            return {'statusCode': 403, 'body': 'Token expirado'}

    # Salida (json)
    return {'statusCode': 200, 'body': 'Token válido'}
```

**CrearProducto** (`LambdaCrearProducto.py`) — el patrón "Proteger el Lambda":
```python
import boto3
import json

def lambda_handler(event, context):
    print(event)
    # Entrada (json) -> viene del mapping template: event['body'] y event['headers']
    producto = event['body']

    # Inicio - Proteger el Lambda
    token = event['headers']['Authorization']
    lambda_client = boto3.client('lambda')
    payload_string = '{ "token": "' + token +  '" }'
    invoke_response = lambda_client.invoke(FunctionName="ValidarTokenAcceso",
                                           InvocationType='RequestResponse',  # síncrono
                                           Payload = payload_string)
    response = json.loads(invoke_response['Payload'].read())
    print(response)
    if response['statusCode'] == 403:
        return {
            'statusCode' : 403,
            'status' : 'Forbidden - Acceso No Autorizado'
        }
    # Fin - Proteger el Lambda

    # Proceso: guardar el producto completo (body) como Item
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_productos')
    response = table.put_item(Item=producto)
    # Salida (json)
    return {
        'statusCode': 200,
        'response': response
    }
```
Detalles a recordar: `boto3.client('lambda').invoke(FunctionName=..., InvocationType='RequestResponse', Payload=...)`; `invoke_response['Payload'].read()` es un stream que hay que leer y convertir con `json.loads`; el body del producto debe incluir las claves `tenant_id` y `producto_id` (clave de partición + ordenación de `t_productos`).

#### Errores comunes (deducibles del material)
- Dejar el timeout en 3 s (por defecto) -> los Lambdas encadenados pueden agotar tiempo; el taller exige 30 s.
- No configurar la plantilla de asignación en la Solicitud de integración -> `event['headers']['Authorization']` da `KeyError`.
- Falta el header `Authorization` o token inventado -> respuesta 403 "Forbidden - Acceso No Autorizado" (comportamiento esperado, no error).
- Token expirado (>60 min) -> 403 "Token expirado".
- Credenciales de AWS Academy vencidas (4 h) (aplica a Taller 2).

### 2.B Ejercicio 2 del Taller 1 — API productos completa (ejercicio propuesto)
Ver sección 3.1.

### 2.C Taller 2 — Automatizar despliegue serverless (PRIORIDAD MÁXIMA)

**Objetivo**: aprender a utilizar el **framework serverless** para automatizar el despliegue (en vez de crear Lambdas y API Gateway a mano).

#### Ejercicio 1: preparar el framework (4 pasos)
1. **Ingresar a la "MV Desarrollo"** (EC2 Ubuntu) y verificar que tiene instalados **node.js > v20**, **npm** (gestor de paquetes de node.js) y **aws CLI**:
   ```bash
   node -v        # v20.19.0
   npm -v         # 11.2.0
   aws --version  # aws-cli/2.25.2 Python/3.12.9 Linux/6.8.0-1029-aws exe/x86_64.ubuntu.22
   ```
2. **Instalar serverless**:
   ```bash
   sudo npm install -g serverless
   ```
3. **Configurar credenciales de AWS**: acceder o crear `/home/ubuntu/.aws` y crear el archivo `credentials` con el contenido indicado por el docente (las de AWS Academy → AWS Details → AWS CLI). **Solo son válidas durante el Lab de AWS Academy (4 horas)**.
   ```ini
   [default]
   aws_access_key_id=ASIA...
   aws_secret_access_key=...
   aws_session_token=...
   ```
4. **Crear usuario en https://www.serverless.com/** (Sign Up → Register, con Google/GitHub) con el correo `@utec` y un nombre de **Organization**. La organización aparece como "Current Org" (ej. `geraldocolchado`) y es el valor de `org:` en `serverless.yml`.

La MV de desarrollo se puede crear con la plantilla CloudFormation `plantilla_crear_mv.yaml` (ver 2.D).

#### Ejercicio 2: Automatizar despliegue de la API REST `api-alumnos` (6 pasos)
1. **Crear el repositorio `api-alumnos` en GitHub** y hacer `git clone` en `/home/ubuntu/lambdas/api-alumnos`. Contenido inicial: `ListarAlumnos.py` y `serverless.yml`.
2. **Modificar `org` y `role` en `serverless.yml`**: `org` = tu organización de serverless.com; `role` = `arn:aws:iam::<TU_ACCOUNT_ID>:role/LabRole`.
3. **Login**: `serverless login` (abre/muestra URL `https://app.serverless.com?client=cli&transactionId=...`; al terminar: "You have successfully signed in.").
4. **Desplegar** Lambda y API Gateway: `serverless deploy`. Salida: `Deploying "api-alumnos" to stage "dev" (us-east-1)` → `Service deployed to stack api-alumnos-dev (78s)` → `endpoint: POST - https://9voct0j1x9.execute-api.us-east-1.amazonaws.com/dev/alumnos/listar` → `functions: listar: api-alumnos-dev-listar (582 B)`.
5. **Probar en Postman**: `POST .../dev/alumnos/listar`, body raw JSON `{ "tenant_id": "UTEC" }`. Respuesta: `statusCode 200`, `tenant_id: "UTEC"`, `num_reg: 8`, `alumnos: [ {alumno_id, tenant_id, alumno_datos{fecha_nac, celular, ...}}, ...]`.
6. **Analizar el `serverless.yml` y los nombres**: `service: api-alumnos` → prefijo del Lambda `api-alumnos-dev-listar` (consola Lambda) y API Gateway `dev-api-alumnos` (consola API Gateway, protocolo REST); la clave `listar:` bajo `functions:` forma la parte final del nombre del Lambda.

#### `serverless.yml` base (`api-alumnos`, solo listar)
```yaml
org: geraldocolchado            # <-- tu Organization de serverless.com
service: api-alumnos            # nombre del servicio -> stack api-alumnos-dev, API dev-api-alumnos

provider:
  name: aws
  runtime: python3.12
  timeout: 30                   # timeout de cada Lambda (30 s, por defecto 3 s)
  iam:
    role: arn:aws:iam::498917627164:role/LabRole   # <-- tu Account ID; LabRole es el rol de AWS Academy

functions:
  listar:                       # nombre lógico -> api-alumnos-dev-listar
    handler: ListarAlumnos.lambda_handler   # archivo.función
    events:
      - http:                   # disparador API Gateway
          path: /alumnos/listar
          method: post
          cors: true
          integration: lambda   # integración Lambda (no proxy): usa event['body']
```
Observación importante: se usa `integration: lambda` (no lambda-proxy), por eso el evento llega con `event['body']` ya como diccionario (así lo usan todos los .py: `event['body']['tenant_id']`).

#### Código `ListarAlumnos.py` (completo)
```python
import boto3  # import Boto3
from boto3.dynamodb.conditions import Key  # import Boto3 conditions

def lambda_handler(event, context):
    # Entrada (json)
    print(event)
    tenant_id = event['body']['tenant_id']
    # Proceso: consulta por clave de partición
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_alumnos')
    response = table.query(
        KeyConditionExpression=Key('tenant_id').eq(tenant_id)
    )
    items = response['Items']
    num_reg = response['Count']
    print(items)
    # Salida (json)
    return {
        'statusCode': 200,
        'tenant_id': tenant_id,
        'num_reg': num_reg,
        'alumnos': items
    }
```
La tabla `t_alumnos` (clave de partición `tenant_id`, clave de ordenación `alumno_id`, deducido de las Keys usadas en `get_item`/`update_item`/`delete_item`) debe existir previamente (el material no muestra su creación; "no aparece en el material" cómo/cuándo se creó).

#### Código `CrearAlumno.py` (completo)
```python
import boto3

def lambda_handler(event, context):
    # Entrada (json)
    tenant_id = event['body']['tenant_id']
    alumno_id = event['body']['alumno_id']
    alumno_datos = event['body']['alumno_datos']
    # Proceso
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_alumnos')
    alumno = {
        'tenant_id': tenant_id,
        'alumno_id': alumno_id,
        'alumno_datos': alumno_datos
    }
    response = table.put_item(Item=alumno)
    # Salida (json)
    return {
        'statusCode': 200,
        'response': response
    }
```

#### JSON de prueba entregados
`json_listar_alumnos.txt`:
```json
{
  "tenant_id": "UTEC"
}
```
`json_crear_alumno.txt`:
```json
{
  "tenant_id": "UTEC",
  "alumno_id": "2021077990",
  "alumno_datos": {
    "nombre": "Juana del Arco",
    "sexo": "F",
    "fecha_nac": "2000-09-01",
    "celular": "999736332",
    "domicilio": {
      "direcc": "Av. Javier Prado 158",
      "distrito": "San Isidro",
      "provincia": "Lima",
      "departamento": "Lima",
      "pais": "Perú"
    }
  }
}
```

#### Ejercicio 3 (guiado): añadir `CrearAlumno` manteniendo el mismo API Gateway
Enunciado: automatizar el despliegue del Lambda `CrearAlumno` con `CrearAlumno.py` entregado y modificando el `serverless.yml`, manteniendo el mismo API Gateway. Solución (`mates2/api-alumnos-propuesto/serverless.yml`): agregar una segunda función bajo `functions:` y volver a ejecutar `serverless deploy` (el mismo servicio `api-alumnos` actualiza el mismo API `dev-api-alumnos`):
```yaml
org: geraldocolchado
service: api-alumnos

provider:
  name: aws
  runtime: python3.12
  timeout: 30
  iam:
    role: arn:aws:iam::498917627164:role/LabRole

functions:
  listar:
    handler: ListarAlumnos.lambda_handler
    events:
      - http:
          path: /alumnos/listar
          method: post
          cors: true
          integration: lambda
  crear:
    handler: CrearAlumno.lambda_handler
    events:
      - http:
          path: /alumnos/crear
          method: post
          cors: true
          integration: lambda
```
La carpeta debe contener `serverless.yml`, `ListarAlumnos.py` y `CrearAlumno.py`.

#### Errores comunes (Taller 2)
- Credenciales de AWS Academy vencidas (4 h) → `serverless deploy` falla; hay que reescribir `~/.aws/credentials` (lo indica `GUIA.md`).
- No cambiar `org` ni el ID de cuenta del rol `LabRole`.
- No hacer `serverless login` (o sesión vencida).
- Cambiar el `service` crea otra pila/API distinta; para mantener el mismo API Gateway se conserva `service: api-alumnos`.

### 2.D Plantilla CloudFormation de la MV de desarrollo (`plantilla_crear_mv.yaml`)
Crea la instancia EC2 usada como "MV Desarrollo" (con AMI `Cloud9Ubuntu22-2026-03-24T19-59`). El material solo da el archivo; el PDF del Taller 2 no explica su uso paso a paso (se infiere por el nombre y por el Paso 1 del Ejercicio 1).
```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Plantilla para crear una Maquina Virtual en EC2 usando una AMI especifica (Cloud9Ubuntu22-2026-03-24T19-59)"

Parameters:
  InstanceName:
    Type: String
    Default: "MV Reemplazar"
    Description: "Nombre de la instancia a crear"
  AMI:
    Type: String
    Default: "ami-0b33d2f1547e52c78"
    Description: "ID de AMI"

Resources:
  EC2Instance:
    Type: "AWS::EC2::Instance"
    Properties:
      Tags:
        - Key: "Name"
          Value: !Ref InstanceName
      ImageId: !Ref AMI
      InstanceType: "t3.micro"
      KeyName: "vockey"
      SecurityGroupIds:
        - !Ref InstanceSecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/sda1
          Ebs:
            VolumeSize: "20"

  InstanceSecurityGroup:
    Type: "AWS::EC2::SecurityGroup"
    Properties:
      GroupDescription: "Permitir trafico SSH y HTTP desde cualquier lugar"
      SecurityGroupIngress:
        - IpProtocol: "tcp"
          FromPort: "22"
          ToPort: "22"
          CidrIp: "0.0.0.0/0"
        - IpProtocol: "tcp"
          FromPort: "80"
          ToPort: "80"
          CidrIp: "0.0.0.0/0"

Outputs:
  InstanceId:
    Description: "ID de la instancia EC2"
    Value: !Ref EC2Instance
  InstancePublicIP:
    Description: "IP publica de la instancia"
    Value: !GetAtt EC2Instance.PublicIp
```
Resumen: Parámetros (nombre y AMI) → Recursos (instancia `t3.micro`, llave `vockey`, disco 20 GB, SG que abre 22/SSH y 80/HTTP a `0.0.0.0/0`) → Outputs (ID y IP pública con `!GetAtt EC2Instance.PublicIp`).

---

## 3. Ejercicios propuestos

> Los .md "Ejercicio Propuesto" de Canvas solo traen fecha de entrega (2026-10-26) y 20 puntos cada uno; el contenido del enunciado está en los PDF de cada Taller. Las soluciones de referencia están en `api-productos/` y `api-alumnos-completo/`.

### 3.1 Taller 1 — Ejercicio propuesto: completar el API productos (protegida)
**Enunciado (PDF Taller 1, diap. 17)**: completar el API productos (protegida) con los Lambdas siguientes, **enviando un token** para poder ejecutarlos:

| Lambda | Método | Ruta (solución) | Datos a enviar |
|---|---|---|---|
| `ListarProductos` | POST | `/productos/listar` | `tenant_id` |
| `BuscarProducto` | POST | `/productos/buscar` | `tenant_id`, `producto_id` |
| `ModificarProducto` | PUT | `/productos/modificar` | `tenant_id`, `producto_id` y datos a modificar |
| `EliminarProducto` | DELETE | `/productos/eliminar` | `tenant_id`, `producto_id` |

**Enfoque**: cada Lambda lleva el mismo bloque "proteger el Lambda" (leer `event['headers']['Authorization']`, invocar `ValidarTokenAcceso`, devolver 403 si falla) y luego usa la API de DynamoDB que corresponde: `query` (listar), `get_item` (buscar), `update_item` (modificar), `delete_item` (eliminar). Se despliegan con Serverless Framework (Taller 2), por eso se acompaña de un `serverless.yml`.

**Solución — `serverless.yml`**
```yaml
org: renzocuba          # <-- cambia esto si tu org es diferente
service: api-productos

provider:
  name: aws
  runtime: python3.12
  timeout: 30
  iam:
    role: arn:aws:iam::092781274895:role/LabRole   # <-- cambia por tu Account ID

functions:
  listar:
    handler: ListarProductos.lambda_handler
    events:
      - http:
          path: /productos/listar
          method: post
          cors: true
          integration: lambda
  buscar:
    handler: BuscarProducto.lambda_handler
    events:
      - http:
          path: /productos/buscar
          method: post
          cors: true
          integration: lambda
  modificar:
    handler: ModificarProducto.lambda_handler
    events:
      - http:
          path: /productos/modificar
          method: put
          cors: true
          integration: lambda
  eliminar:
    handler: EliminarProducto.lambda_handler
    events:
      - http:
          path: /productos/eliminar
          method: delete
          cors: true
          integration: lambda
```
**Nota**: los Lambdas de productos leen `event["headers"]["Authorization"]` y `event["body"]`. En el Taller 1 eso lo garantiza la plantilla de asignación manual de API Gateway; en el `serverless.yml` solución no hay `request: template` explícito, así que (no aparece en el material) cómo llega el header al evento al desplegar con el framework. Para el examen basta con saber que el Lambda espera ese formato y que en Postman se envía el header `Authorization`.

**ListarProductos.py**
```python
import boto3
import json
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    # Proteger el Lambda con token
    token = event["headers"]["Authorization"]
    lambda_client = boto3.client("lambda")
    payload_string = '{ "token": "' + token + '" }'
    invoke_response = lambda_client.invoke(
        FunctionName="ValidarTokenAcceso",
        InvocationType="RequestResponse",
        Payload=payload_string,
    )
    response = json.loads(invoke_response["Payload"].read())
    if response["statusCode"] == 403:
        return {"statusCode": 403, "status": "Forbidden - Acceso No Autorizado"}

    # Proceso: todos los productos de un tenant
    tenant_id = event["body"]["tenant_id"]
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("t_productos")
    response = table.query(KeyConditionExpression=Key("tenant_id").eq(tenant_id))
    items = response["Items"]

    return {
        "statusCode": 200,
        "tenant_id": tenant_id,
        "num_reg": response["Count"],
        "productos": items,
    }
```
**BuscarProducto.py** (mismo bloque de protección, luego):
```python
    tenant_id = event["body"]["tenant_id"]
    producto_id = event["body"]["producto_id"]
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("t_productos")
    response = table.get_item(Key={"tenant_id": tenant_id, "producto_id": producto_id})

    if "Item" not in response:
        return {"statusCode": 404, "body": "Producto no encontrado"}

    return {"statusCode": 200, "producto": response["Item"]}
```
**ModificarProducto.py** (mismo bloque de protección, luego):
```python
    tenant_id = event["body"]["tenant_id"]
    producto_id = event["body"]["producto_id"]
    producto_datos = event["body"]["producto_datos"]

    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("t_productos")
    response = table.update_item(
        Key={"tenant_id": tenant_id, "producto_id": producto_id},
        UpdateExpression="SET producto_datos = :datos",
        ExpressionAttributeValues={":datos": producto_datos},
        ReturnValues="UPDATED_NEW",
    )

    return {"statusCode": 200, "response": response}
```
**EliminarProducto.py** (mismo bloque de protección, luego):
```python
    tenant_id = event["body"]["tenant_id"]
    producto_id = event["body"]["producto_id"]
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("t_productos")
    response = table.delete_item(
        Key={"tenant_id": tenant_id, "producto_id": producto_id}
    )

    return {"statusCode": 200, "response": response}
```
**Bloque de protección común** (copiar en cada Lambda):
```python
token = event["headers"]["Authorization"]
lambda_client = boto3.client("lambda")
payload_string = '{ "token": "' + token + '" }'
invoke_response = lambda_client.invoke(
    FunctionName="ValidarTokenAcceso",
    InvocationType="RequestResponse",
    Payload=payload_string,
)
response = json.loads(invoke_response["Payload"].read())
if response["statusCode"] == 403:
    return {"statusCode": 403, "status": "Forbidden - Acceso No Autorizado"}
```

**JSON de prueba y guía de Postman** (`api-productos/*.json` y `GUIA.md`): en **todos** los requests se agrega el header `Authorization: <token>` (token de `/usuarios/login`, expira en 60 min).

| Operación | Método y ruta | Body |
|---|---|---|
| Listar | POST `/productos/listar` | `{ "tenant_id": "PLAZA_VEA" }` |
| Buscar | POST `/productos/buscar` | `{ "tenant_id": "PLAZA_VEA", "producto_id": "DET001" }` |
| Modificar | PUT `/productos/modificar` | `{ "tenant_id": "PLAZA_VEA", "producto_id": "DET001", "producto_datos": { "nombre": "Detergente Sapolio 5 Kg", "precio": 25.90 } }` |
| Eliminar | DELETE `/productos/eliminar` | `{ "tenant_id": "PLAZA_VEA", "producto_id": "DET001" }` |

Verificación de protección: sin header `Authorization` o con token inventado debe responder `{ "statusCode": 403, "status": "Forbidden - Acceso No Autorizado" }`.

**Pasos de la GUIA.md (flujo completo de despliegue)**
1. Conectarse a la MV: `ssh -i vockey.pem ubuntu@<IP-publica-de-tu-MV>`.
2. Actualizar credenciales (`nano ~/.aws/credentials`, formato `[default]` con `aws_access_key_id`, `aws_secret_access_key`, `aws_session_token`; vencen cada 4 h).
3. Copiar archivos a la MV: `scp -i vockey.pem -r api-productos/ ubuntu@<IP>:~/lambdas/` (o crear a mano `~/lambdas/api-productos` con nano). Estructura: `serverless.yml`, `ListarProductos.py`, `BuscarProducto.py`, `ModificarProducto.py`, `EliminarProducto.py`.
4. Editar `serverless.yml`: cambiar `org` y el Account ID del ARN `LabRole` (el Account ID se ve en la consola AWS, esquina superior derecha).
5. `serverless login` (si expiró).
6. `cd ~/lambdas/api-productos && serverless deploy` → muestra 4 URLs: `POST .../dev/productos/listar`, `POST .../dev/productos/buscar`, `PUT .../dev/productos/modificar`, `DELETE .../dev/productos/eliminar`.
7. Obtener token con `POST /usuarios/login` de la API de usuarios del Taller 1 (`{"user_id": "...", "password": "..."}`).
8. Probar en Postman con header `Authorization`.
9. Verificar protección con token falso/sin header → 403.

Prerrequisitos listados en la guía: tablas `t_usuarios`, `t_tokens_acceso`, `t_productos`; Lambdas `CrearUsuario`, `LoginUsuario`, `ValidarTokenAcceso`, `CrearProducto`; API Gateway `api-usuarios` (`POST /usuarios/crear`, `POST /usuarios/login`) y `api-productos` (`POST /productos/crear`) desplegadas; MV EC2 Ubuntu con node, npm, aws CLI y serverless.

### 3.2 Taller 2 — Ejercicio propuesto: completar API REST de alumnos
**Enunciado (PDF Taller 2, diap. 15)**:
- *Guiado*: automatizar el despliegue del Lambda `CrearAlumno` (con `CrearAlumno.py` entregado) modificando el `serverless.yml` y manteniendo el mismo API Gateway (ver 2.C Ejercicio 3).
- *Propuesto*: completar el API REST con los Lambdas **ModificarAlumno**, **EliminarAlumno** y **BuscarAlumno**; **publicar la foto de la ejecución en Postman** de la API REST.

**Solución — `serverless.yml` completo (`api-alumnos-completo`)**
```yaml
org: renzocuba
service: api-alumnos

provider:
  name: aws
  runtime: python3.12
  timeout: 30
  iam:
    role: arn:aws:iam::092781274895:role/LabRole

functions:
  listar:
    handler: ListarAlumnos.lambda_handler
    events:
      - http: { path: /alumnos/listar,   method: post,   cors: true, integration: lambda }
  crear:
    handler: CrearAlumno.lambda_handler
    events:
      - http: { path: /alumnos/crear,    method: post,   cors: true, integration: lambda }
  buscar:
    handler: BuscarAlumno.lambda_handler
    events:
      - http: { path: /alumnos/buscar,   method: post,   cors: true, integration: lambda }
  modificar:
    handler: ModificarAlumno.lambda_handler
    events:
      - http: { path: /alumnos/modificar, method: put,    cors: true, integration: lambda }
  eliminar:
    handler: EliminarAlumno.lambda_handler
    events:
      - http: { path: /alumnos/eliminar, method: delete, cors: true, integration: lambda }
```
(El archivo original escribe cada `http:` en forma de bloque multilínea; es YAML equivalente. Forma bloque:)
```yaml
      - http:
          path: /alumnos/buscar
          method: post
          cors: true
          integration: lambda
```

**BuscarAlumno.py**
```python
import boto3

def lambda_handler(event, context):
    tenant_id = event["body"]["tenant_id"]
    alumno_id = event["body"]["alumno_id"]
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("t_alumnos")
    response = table.get_item(Key={"tenant_id": tenant_id, "alumno_id": alumno_id})
    if "Item" not in response:
        return {"statusCode": 404, "body": "Alumno no encontrado"}
    return {"statusCode": 200, "alumno": response["Item"]}
```
**ModificarAlumno.py**
```python
import boto3

def lambda_handler(event, context):
    tenant_id = event["body"]["tenant_id"]
    alumno_id = event["body"]["alumno_id"]
    alumno_datos = event["body"]["alumno_datos"]
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("t_alumnos")
    response = table.update_item(
        Key={"tenant_id": tenant_id, "alumno_id": alumno_id},
        UpdateExpression="SET alumno_datos = :datos",
        ExpressionAttributeValues={":datos": alumno_datos},
        ReturnValues="UPDATED_NEW",
    )
    return {"statusCode": 200, "response": response}
```
**EliminarAlumno.py**
```python
import boto3

def lambda_handler(event, context):
    tenant_id = event["body"]["tenant_id"]
    alumno_id = event["body"]["alumno_id"]
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("t_alumnos")
    response = table.delete_item(Key={"tenant_id": tenant_id, "alumno_id": alumno_id})
    return {"statusCode": 200, "response": response}
```
**Cuerpos de prueba (deducidos del código)**: buscar y eliminar → `{"tenant_id": "UTEC", "alumno_id": "2021077990"}`; modificar → `{"tenant_id": "UTEC", "alumno_id": "2021077990", "alumno_datos": { ... }}`.

Tabla resumen CRUD (alumnos y productos usan el mismo patrón):
| Operación | Método HTTP | Operación boto3 (Table) | Lo que se pasa |
|---|---|---|---|
| Crear | POST | `put_item(Item=...)` | Item completo |
| Listar | POST | `query(KeyConditionExpression=Key('tenant_id').eq(...))` | clave de partición |
| Buscar | POST | `get_item(Key={...})` | clave de partición + clave de ordenación |
| Modificar | PUT | `update_item(Key, UpdateExpression='SET x = :v', ExpressionAttributeValues, ReturnValues='UPDATED_NEW')` | clave + datos nuevos |
| Eliminar | DELETE | `delete_item(Key={...})` | clave completa |

---

## 4. Conexiones teoría ↔ laboratorio

| Concepto de teoría | Dónde se ve en el laboratorio |
|---|---|
| Serverless = no administrar servidores, pago por uso, autoescalado | Lambdas + API Gateway + DynamoDB sin EC2 para la aplicación (la EC2 "MV Desarrollo" es solo una estación de trabajo para ejecutar `serverless deploy`). |
| FaaS: funciones sin estado disparadas por eventos | Cada operación (crear usuario, login, validar token, crear producto, listar alumnos...) es una función Lambda; el estado va a DynamoDB. |
| Capa de cómputo: **Lambda** | Python 3.12, `lambda_handler(event, context)`, timeout 30 s. |
| Capa de integración: **API Gateway** | APIs `usuarios`, `productos` (creadas a mano en Taller 1) y `dev-api-alumnos` (creada por el framework en Taller 2). |
| Capa de datos: **DynamoDB** (NoSQL, sin esquema) | `t_usuarios`, `t_tokens_acceso`, `t_productos`, `t_alumnos` (`put_item`, `get_item`, `query`, `update_item`, `delete_item`). |
| Arquitectura de referencia RESTful microservices (App → API Gateway → Lambda → DynamoDB) | Es exactamente el flujo de ambas APIs; "built-in authorization" de API Gateway se **sustituye** por el Lambda `ValidarTokenAcceso` porque Cognito no está disponible en AWS Academy. |
| Ejemplo "Aplicaciones web" (Lambda + API Gateway + DynamoDB; Cognito, Amplify) | CRUD de productos y alumnos; "usuario registrado" = `CrearUsuario` + `LoginUsuario` (versión casera de Cognito). |
| Beneficio "llegar más rápido al mercado / centrarse en construir en vez de configurar" | Serverless Framework: un `serverless deploy` crea Lambdas + API Gateway + rutas a partir de un YAML (vs. consola manual del Taller 1). |
| Beneficio "disminuya sus costos / no pagar sobreaprovisionamiento" | Modelo pago por uso de Lambda/DynamoDB/API Gateway. |
| Integración entre servicios (Lambda invoca Lambda) | `CrearProducto` → `ValidarTokenAcceso` con `invoke(RequestResponse)`. |
| Eventos como disparadores | `events: - http:` en `serverless.yml` (API Gateway como evento de Lambda). |
| Infraestructura como código | `serverless.yml` (Taller 2) y `plantilla_crear_mv.yaml` (CloudFormation) para la MV. |
| Partición multi-inquilino | `tenant_id` como clave de partición en `t_productos` y `t_alumnos` (ver nota: el material no define el término "multi-tenant"). |

---

## 5. Preguntas tipo examen

**P1. Defina arquitectura serverless y mencione tres características que ofrecen las tecnologías sin servidor.**
Tecnologías para ejecutar código, administrar datos e integrar aplicaciones **sin tener que administrar servidores**. Características: **escalado automático, alta disponibilidad integrada y facturación de pago por uso**; además eliminan aprovisionamiento de capacidad y aplicación de parches.

**P2. ¿Qué es FaaS? ¿Qué servicio AWS lo implementa?**
Tipo de servicio cloud que permite diseñar, ejecutar y gestionar paquetes de aplicación como **funciones** sin mantener infraestructura propia; modelo de ejecución **basado en eventos** sobre **contenedores sin estado**. En AWS: **AWS Lambda**.

**P3. Enumere los cuatro beneficios por los que conviene usar serverless según la clase.**
(1) Pasar de la idea al mercado más rápido; (2) disminuir costos (nunca pagar por exceso de aprovisionamiento); (3) adaptarse a escala (escala automáticamente de cero a la demanda máxima); (4) crear mejores aplicaciones con más facilidad (integraciones integradas; centrarse en construir, no en configurar).

**P4. ¿Cuáles son las tres capas de servicios serverless de AWS? Dé al menos dos servicios por capa.**
Cómputo (Lambda, Fargate), integración (EventBridge, Step Functions, SQS, SNS, API Gateway, AppSync), almacén de datos (S3, EFS, DynamoDB, RDS Proxy, Aurora Serverless, Redshift sin servidor, Neptune, OpenSearch, ElastiCache).

**P5. Compare SQS y SNS según el material.**
SQS: servicio de **colas de mensajes** para **desacoplar y escalar** microservicios, sistemas distribuidos y aplicaciones sin servidor. SNS: **mensajería** administrada para comunicación **A2A** (aplicación a aplicación) y **A2P** (aplicación a persona).

**P6. ¿Qué papel cumplen EventBridge y Step Functions en un procesamiento por lotes?**
EventBridge: bus de eventos; una **regla programada** dispara el flujo recurrente. Step Functions: **organizador visual de flujos de trabajo** que orquesta Lambdas (ejemplo ETL de calidad del aire: inventario de archivos → procesar → esperar → agregar → borrar intermedios → notificar con SNS).

**P7. Dibuje/describa la arquitectura de referencia de microservicios RESTful serverless y la función de cada componente.**
App → API Gateway (hospeda solicitudes/respuestas REST, autorización integrada, throttling, mapeo) → Lambda (lógica de negocio) → DynamoDB (almacenamiento persistente NoSQL, escala bajo demanda, sin esquema).

**P8. En el Taller 1, ¿por qué se implementó un sistema de seguridad propio en lugar de Cognito?**
Porque Cognito (servicio recomendado para usuarios, passwords y autorización) **no está disponible en AWS Academy**.

**P9. Describa los 8 pasos de flujo del sistema de seguridad del Taller 1.**
1) CrearUsuario registra (user, pass-hash) en `t_usuarios`; 2) LoginUsuario valida (user, pass) contra `t_usuarios`; 3) genera token y expiración y los guarda en `t_tokens_acceso`; 4) devuelve el token al cliente para acceder a APIs protegidas; 5) al llamar `POST /productos/crear` con token y producto, `CrearProducto` envía el token a `ValidarTokenAcceso`; 6) este valida (token, expiración) en `t_tokens_acceso`; 7) autoriza el acceso (200) o devuelve 403; 8) `CrearProducto` registra el producto en `t_productos`.

**P10. Escriba las claves de partición y ordenación de las tres tablas del Taller 1.**
`t_usuarios`: PK `user_id` (S). `t_tokens_acceso`: PK `token` (S). `t_productos`: PK `tenant_id` (S) + SK `producto_id` (S).

**P11. Escriba (fragmento) el código para hashear una contraseña con SHA-256 y generar un token que expire en 60 minutos.**
```python
import hashlib, uuid
from datetime import datetime, timedelta
hashed = hashlib.sha256(password.encode()).hexdigest()
token = str(uuid.uuid4())
expires = (datetime.now() + timedelta(minutes=60)).strftime('%Y-%m-%d %H:%M:%S')
```

**P12. Escriba el fragmento que protege un Lambda con `ValidarTokenAcceso`.**
Ver "Bloque de protección común" (3.1): leer `event['headers']['Authorization']`, `lambda_client.invoke(FunctionName="ValidarTokenAcceso", InvocationType='RequestResponse', Payload=...)`, `json.loads(invoke_response['Payload'].read())`, si `statusCode == 403` devolver 403 "Forbidden - Acceso No Autorizado".

**P13. ¿Qué JSON se coloca en la "Solicitud de integración" de API Gateway del API productos y para qué sirve?**
```json
{
  "method": "$context.httpMethod",
  "path": "$context.path",
  "headers": { "Authorization": "$input.params('Authorization')" },
  "body": $input.body
}
```
Tipo `application/json`; permite que el Lambda reciba el header `Authorization` y el body en `event['headers']` y `event['body']`.

**P14. ¿Cómo valida `ValidarTokenAcceso` que un token es válido? ¿Qué respuestas puede dar?**
`get_item` por `token` en `t_tokens_acceso`; si no hay `Item` → 403 "Token no existe"; si `now > expires` (cadenas `'%Y-%m-%d %H:%M:%S'`) → 403 "Token expirado"; si no → 200 "Token válido".

**P15. ¿Qué timeout se configura en los Lambdas y cuál es el valor por defecto?**
30 segundos; por defecto 3 segundos. En `serverless.yml` se escribe `timeout: 30` bajo `provider`.

**P16. Escriba un `serverless.yml` mínimo para desplegar un Lambda `listar` con un endpoint `POST /alumnos/listar`.**
Ver bloque en 2.C (claves: `org`, `service`, `provider{name, runtime: python3.12, timeout, iam.role}`, `functions.listar.handler`, `events - http {path, method, cors, integration: lambda}`).

**P17. ¿Qué requisitos debe tener la MV de desarrollo y qué comandos se usan para instalar y desplegar con Serverless Framework?**
node.js > v20, npm y aws CLI; `sudo npm install -g serverless`; credenciales en `/home/ubuntu/.aws/credentials`; cuenta en serverless.com (org); `serverless login`; `serverless deploy`.

**P18. ¿Cómo se llamarán el stack, el Lambda y el API Gateway si `service: api-alumnos`, stage `dev` y función `listar`?**
Stack `api-alumnos-dev`; Lambda `api-alumnos-dev-listar`; API Gateway `dev-api-alumnos` (REST).

**P19. ¿Qué cambia en `serverless.yml` para añadir `CrearAlumno` manteniendo el mismo API Gateway? ¿Y para BuscarAlumno/ModificarAlumno/EliminarAlumno?**
Agregar entradas en `functions:` con su `handler` y evento http: `crear` (POST `/alumnos/crear`), `buscar` (POST `/alumnos/buscar`), `modificar` (PUT `/alumnos/modificar`), `eliminar` (DELETE `/alumnos/eliminar`), y volver a ejecutar `serverless deploy` conservando `service: api-alumnos`.

**P20. ¿Qué método de DynamoDB (boto3) usa cada operación CRUD y con qué parámetros?**
Ver tabla CRUD en 3.2 (`put_item`, `query` con `Key(...).eq`, `get_item`, `update_item` con `UpdateExpression="SET alumno_datos = :datos"`, `delete_item`).

**P21. ¿Qué duración tienen las credenciales de AWS Academy y qué hay que hacer al vencer?**
4 horas (el material dice "solo válidas durante el Lab de AWS Academy (4 horas)"); hay que volver a copiar las credenciales actuales al archivo `~/.aws/credentials` (GUIA.md) antes de desplegar.

---

## 6. Cheat-sheet

### 6.1 Comandos
```bash
node -v ; npm -v ; aws --version            # verificar herramientas (node > v20)
sudo npm install -g serverless              # instalar Serverless Framework
mkdir -p ~/.aws && nano ~/.aws/credentials  # credenciales AWS Academy (4 h)
serverless login                            # login en serverless.com
serverless deploy                           # desplegar Lambdas + API Gateway (stage dev por defecto)
ssh -i vockey.pem ubuntu@<IP>               # conectar a la MV
scp -i vockey.pem -r api-productos/ ubuntu@<IP>:~/lambdas/   # copiar proyecto
```
`~/.aws/credentials`:
```ini
[default]
aws_access_key_id=ASIA...
aws_secret_access_key=...
aws_session_token=...
```

### 6.2 serverless.yml (plantilla)
```yaml
org: <tu-org>
service: <nombre-api>
provider:
  name: aws
  runtime: python3.12
  timeout: 30
  iam:
    role: arn:aws:iam::<ACCOUNT_ID>:role/LabRole
functions:
  <clave>:
    handler: <Archivo>.lambda_handler
    events:
      - http:
          path: /<recurso>/<accion>
          method: post          # post | put | delete
          cors: true
          integration: lambda
```
Nombres resultantes: stack `<service>-<stage>`, Lambda `<service>-<stage>-<clave>`, API `<stage>-<service>`.

### 6.3 Esqueleto Lambda con DynamoDB
```python
import boto3
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    x = event['body']['campo']                       # con integration: lambda + plantilla
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_tabla')
    table.put_item(Item={...})                                        # crear
    table.query(KeyConditionExpression=Key('tenant_id').eq(t))        # listar (r['Items'], r['Count'])
    table.get_item(Key={'tenant_id': t, 'id': i})                     # buscar ('Item' in r)
    table.update_item(Key={...}, UpdateExpression="SET datos = :d",
                      ExpressionAttributeValues={":d": datos}, ReturnValues="UPDATED_NEW")
    table.delete_item(Key={...})                                      # eliminar
    return {'statusCode': 200, 'response': r}
```

### 6.4 Seguridad con token
```python
hashlib.sha256(password.encode()).hexdigest()
str(uuid.uuid4())
(datetime.now() + timedelta(minutes=60)).strftime('%Y-%m-%d %H:%M:%S')
boto3.client('lambda').invoke(FunctionName="ValidarTokenAcceso",
    InvocationType='RequestResponse', Payload='{ "token": "' + token + '" }')
json.loads(invoke_response['Payload'].read())
# 403 -> {"statusCode": 403, "status": "Forbidden - Acceso No Autorizado"}
```
Mapping template de API Gateway (Solicitud de integración, `application/json`):
```json
{
  "method": "$context.httpMethod",
  "path": "$context.path",
  "headers": { "Authorization": "$input.params('Authorization')" },
  "body": $input.body
}
```

### 6.5 JSON de eventos / pruebas Postman (raw → JSON)
```json
{ "user_id": "gcolchado@utec.edu.pe", "password": "123456" }
{ "tenant_id": "PLAZA_VEA", "producto_id": "DET001", "nombre": "Detergente Sapolio 2.5 Kg" }
{ "tenant_id": "UTEC" }
{ "tenant_id": "UTEC", "alumno_id": "2021077990", "alumno_datos": { "nombre": "...", "sexo": "F", "fecha_nac": "2000-09-01", "celular": "...", "domicilio": { "direcc": "...", "distrito": "...", "provincia": "...", "departamento": "...", "pais": "..." } } }
```
Header protegido: `Authorization: <token>`.

### 6.6 Tablas DynamoDB (Taller 1)
| Tabla | PK | SK | Otros |
|---|---|---|---|
| `t_usuarios` | `user_id` (S) | — | `password` (hash SHA-256) |
| `t_tokens_acceso` | `token` (S) | — | `expires` ('YYYY-MM-DD HH:MM:SS') |
| `t_productos` | `tenant_id` (S) | `producto_id` (S) | `nombre`, `producto_datos`... |
| `t_alumnos` | `tenant_id` | `alumno_id` | `alumno_datos` (deducido del código) |

### 6.7 Datos rápidos
- Timeout Lambda: por defecto 3 s → configurado 30 s. Runtime: Python 3.12. Rol: `LabRole`. Credenciales Academy: 4 h. Token: 60 min.
- Servicios: cómputo (Lambda, Fargate) · integración (EventBridge, Step Functions, SQS, SNS, API Gateway, AppSync) · datos (S3, EFS, DynamoDB, RDS Proxy, Aurora Serverless, Redshift, Neptune, OpenSearch, ElastiCache).
- Códigos usados: 200 OK, 400 faltan datos, 403 no autorizado (usuario/pass/token), 404 no encontrado, 500 excepción.
