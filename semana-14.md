# Semana 14 — Otros tópicos: AWS Well-Architected y Arquitectura basada en eventos (SQS, DLQ, SNS, EventBridge)

> Curso CS2032 Cloud Computing (Ciclo 2026-2), docente Geraldo Colchado. La semana tiene 1 clase de teoría (AWS Well-Architected) y 2 talleres (Taller 3: SQS + DLQ; Taller 4: SNS + SQS + EventBridge + filtros). Este documento reúne el contenido de las diapositivas (texto e imágenes), los archivos de apoyo (código, JSON, diagramas) y las lecturas complementarias.

---

## 0. Mapa de materiales revisados

| Archivo | Tipo | Resumen de 1 línea |
|---|---|---|
| `teoria/semana-14/1. Otros tópicos - Teoría 1 - V1.10.pdf` (21 diap.) | Teoría (PDF) | AWS Well-Architected: qué es, 6 pilares, enfoques (lentes) y el enfoque Serverless con 4 escenarios (RESTful microservices, Web application, Event-driven x2 diap.). |
| `teoria/semana-14/wellarchitected-serverless-applications.pdf` (104 pág.) | Lectura complementaria | Serverless Applications Lens (2024): 8 áreas, principios de diseño, 6 escenarios, preguntas por pilar. Relacionada directamente con la clase. |
| `teoria/semana-14/wellarchitected-container-build.pdf` (63 pág.) | Lectura complementaria | Container Build Lens: definiciones, principios (imagen mínima, multi-stage, tags inmutables, escaneo) y preguntas por pilar. |
| `teoria/semana-14/wellarchitected-data-analytics.pdf` (142 pág.) | Lectura complementaria | Data Analytics Lens (dic-2023): 15 principios de diseño por pilar, 7 escenarios (data lake, streaming, data mesh...). |
| `teoria/semana-14/wellarchitected-machine-learning.pdf` (195 pág.) | Lectura complementaria | Machine Learning Lens (jul-2023): ciclo de vida ML, 10 principios, buenas prácticas MLOE/MLSEC/MLREL/MLPERF/MLCOST/MLSUS. |
| `laboratorio/semana-14/1. Arquitectura basada en eventos - Taller 3 - V2.06.pdf` (28 diap.) (= copia en mats1 y en ZIP Taller 1) | Taller (PDF) | **Taller 3**: SQS. Ej.1 Despacho de pedidos (API GW + Lambda + SQS + DynamoDB), Ej.2 propuesto, Ej.3 DLQ (alta de alumno en Canvas). |
| `laboratorio/semana-14/1. Arquitectura basada en eventos - Taller 4 - V1.00.pdf` (18 diap.) (= copia en mats2 y en ZIP Taller 2) | Taller (PDF) | **Taller 4**: SNS + SQS + EventBridge. Ej.1 Evento "Nueva lectura sensor IoT" con filtros, Ej.2 propuesto (sensor TEMP). |
| `mats1/lambda_RegistrarPedido.py` | Código Python | Lambda que recibe el pedido (event) y lo envía a SQS (`send_message`). |
| `mats1/lambda_ProcesarPedido.py` | Código Python | Lambda que lee hasta 3 mensajes de SQS (`receive_message`, long polling 10 s), los guarda en DynamoDB y los borra de la cola. |
| `mats1/lambda_RegistrarCanvas.py` | Código Python | Lambda que imprime el evento y lanza `Exception("Error")` para forzar el fallo y que el mensaje llegue a la DLQ. |
| `mats1/pedido 1..5.json` | JSON de prueba | 5 pedidos de `tenant_id = PLAZA_VEA` (pedido_id 1 a 5) para enviar por Postman. |
| `mats1/UTEC_json_alumno.json` | JSON de prueba | Mensaje de alumno (tenant UTEC, alumno_id 202310295) para la cola `sqs-registrar-canvas`. |
| `mats1/despacho_pedidos.drawio` + `.drawio.png` | Diagrama (XML drawio / imagen) | Arquitectura desacoplada y asíncrona de despacho de pedidos (misma que diap. 7 del Taller 3). |
| `mats1/canvas_DLQ.drawio` + `canvas_DLQ_guiado.drawio.png` | Diagrama | Registrar alumno en Canvas con SQS y DLQ: JSON -> sqs-registrar-canvas -> Lambda RegistrarCanvas (2 reintentos) -> si falla, sqs-registrar-canvas-dlq. |
| `mats1/Patrones de comunicación entre aplicaciones.PNG` | Imagen | Dos patrones: comunicación síncrona (app a app) vs asíncrona/basada en eventos (app -> cola -> app). |
| `mats1/Materiales S14 - Taller 1.zip` | ZIP | Contenido idéntico a mats1 (PDF Taller 3, pedidos, lambdas, drawio, PNG). Verificado. |
| `mats2/Lambda - GenerarEventoSensorIoT - Python.py` | Código Python | Simula sensor CO2 (400-1000 PPM) y publica en SNS con `MessageAttributes`. |
| `mats2/Lambda - InsertarEventoSensorIoT - Python.py` | Código Python | Lambda disparada por SQS: extrae `Message` del sobre SNS y hace `put_item` en DynamoDB. |
| `mats2/Filtro 1.json`, `Filtro 2.json` | JSON (políticas de filtro SNS) | Filtro 1 (correo): tenant FAB1 + sensor CO2 + medicion > 800. Filtro 2 (cola SQS): tenant FAB1. |
| `mats2/Política_acceso_SQS.json` | JSON (política IAM de recurso) | Permite que el servicio SNS haga `sqs:SendMessage` en la cola `ColaSensorIoTFAB1` solo si el origen es el tema `TemaSensorIoT`. |
| `mats2/event04.drawio` (2 páginas: "taller" y "propuesto") | Diagrama (XML comprimido) | Arquitectura del Taller 4; la página "propuesto" agrega el 2.o correo con filtro sensor TEMP > 40 CELSIUS. |
| `mats2/Materiales S14 - Taller 2.zip` | ZIP | Contenido idéntico a mats2. Verificado. |
| `S14 Taller 1 - Ejercicio Propuesto.md`, `S14 Taller 2 - Ejercicio Propuesto.md` | Metadatos de tareas Canvas | Solo indican entrega 2026-11-23 04:59:59 UTC, 20 puntos cada uno, "(sin descripción)". El enunciado real está en los PDF (Ej. 2 de cada taller). |

Duplicados ignorados (md5 idéntico): PDFs Taller 3 y 4 de la raíz, de mats y de los ZIP; archivos dentro de los ZIP; `__MACOSX`.

---

## 1. Teoría

### 1.1 Objetivo de la sesión (diap. 3)
- Comprender qué es **AWS Well-Architected**.
- Identificar los **6 pilares** del AWS Well-Architected.
- Conocer algunos escenarios del **enfoque (lens) de Aplicaciones sin servidor (Serverless)**.
- Cierre de la clase (diap. 20): el alumno debe poder explicar con sus palabras (a) qué es AWS Well-Architected, (b) uno de los 6 pilares y (c) un escenario del enfoque Serverless.

### 1.2 Qué es AWS Well-Architected (alcance, diap. 5)
Definición de la diapositiva (fuente: aws.amazon.com/es/architecture/well-architected):
- AWS Well-Architected **ayuda a los arquitectos de la nube a crear una infraestructura segura, de alto rendimiento, resistente y eficiente** para una **variedad de aplicaciones y cargas de trabajo**.
- Está **creado en torno a seis pilares** (excelencia operativa, seguridad, fiabilidad, eficiencia de rendimiento, optimización de costos y sostenibilidad).
- Ofrece un **enfoque coherente** para que clientes y socios **evalúen arquitecturas** e implementen **diseños escalables**.
- El **AWS Well-Architected Framework incluye**: **enfoques de dominios específicos**, **laboratorios prácticos** y la **AWS Well-Architected Tool**.
- La **AWS Well-Architected Tool** está **disponible sin costo** en la **consola de administración de AWS**; permite **evaluar regularmente las cargas de trabajo, identificar los problemas de alto riesgo y registrar las mejoras**.

Resumen mnemotécnico: *Framework = 6 pilares + enfoques (lenses) + laboratorios + Tool gratuita en la consola.*

### 1.3 Los 6 pilares (diap. 7-10)
Imagen de la diap. 7: hexágono con los seis pilares alrededor del logo "AWS Well-Architected": **Seguridad, Rendimiento Eficiente, Sostenibilidad, Optimización de Costes, Excelencia Operacional, Fiabilidad**.

| Pilar | Enfoque (según las diapositivas, con lo resaltado en amarillo) | Temas clave |
|---|---|---|
| **Excelencia operativa** | **Ejecutar y monitorear los sistemas** y **mejorar constantemente los procesos** y procedimientos. | **Automatización de cambios**, **respuesta a eventos**, **definición de estándares para administrar las operaciones diarias**. |
| **Seguridad** | **Proteger la información y los sistemas**. | **Confidencialidad** e **integridad de los datos**, administración de **permisos de usuarios**, establecimiento de **controles para detectar eventos de seguridad**. |
| **Fiabilidad** (confiabilidad) | Cargas de trabajo que realizan las funciones previstas y **cómo recuperarse rápidamente de los errores para cumplir con las demandas**. | **Diseño de sistemas distribuidos**, **planificación de la recuperación**, adaptación a requisitos cambiantes. |
| **Eficacia/eficiencia del rendimiento** | **Asignación estructurada y simplificada de TI** y de los recursos informáticos. | **Selección de los tipos y tamaños de recursos optimizados para los requisitos de la carga de trabajo**, **supervisión del rendimiento**, **mantenimiento de la eficacia a medida que evolucionan las necesidades** de la empresa. |
| **Optimización de costos** | **Evitar gastos innecesarios.** | Comprender el tiempo dedicado y el control de la asignación de fondos, **selección de recursos para el tipo y cantidad adecuados**, **escalado** para cumplir necesidades **sin gastos excesivos**. |
| **Sostenibilidad** | **Minimizar los impactos ambientales de ejecutar cargas de trabajo en la nube.** | **Modelo de responsabilidad compartida** para la sostenibilidad, comprensión del impacto y **maximización del uso** para minimizar los recursos necesarios y reducir impactos posteriores. |

Frase para memorizar los 6: **OSFR-PCS**: Operational excellence, Security, Reliability, Performance efficiency, Cost optimization, Sustainability (nombres en español en la clase: excelencia operativa, seguridad, fiabilidad, eficiencia/eficacia de rendimiento, optimización de costos, sostenibilidad).

### 1.4 Enfoques / Lenses (diap. 12)
- Los **enfoques de AWS Well-Architected** **amplían la orientación** del framework para **abordar dominios tecnológicos e industriales específicos**.
- Ejemplos listados en la diapositiva: **machine learning (ML)**, **análisis de datos**, **sin servidor (serverless)**, **computación de alto rendimiento (HPC)**, **IoT**, **SAP**, **streaming de contenido multimedia**, **sector de los videojuegos**, **redes híbridas** y **servicios de finanzas**.
- Regla: **para evaluar por completo sus cargas de trabajo, utilice los enfoques correspondientes junto con el AWS Well-Architected Framework y los seis pilares** (el lens complementa, no reemplaza al framework).

### 1.5 Enfoque (lens): Aplicaciones Serverless (diap. 14-18)
- Documento: **Serverless Applications Lens - AWS Well-Architected Framework** (fecha de publicación mostrada en la diapositiva: 14 de julio de 2022; el PDF de lectura complementaria es la edición 2024).
- "Cubre **escenarios comunes de aplicaciones serverless** e identifica **elementos clave** para asegurar que las cargas de trabajo estén **arquitecturadas según las mejores prácticas**."
- En la clase se muestran **4 diapositivas de escenarios** (de los 6 escenarios del lens: RESTful microservices, Alexa skills, Mobile backend, Streaming processing, Web application, Event-driven architectures; ver sección 7). Los escenarios vistos en clase son los 3 siguientes.

#### Escenario A — RESTful microservices (diap. 15)
```
 App  --1-->  Amazon API Gateway --2--> AWS Lambda --3--> Amazon DynamoDB (4)
(cliente)  <--        (HTTPS/REST)        (lógica de negocio)    (almacenamiento persistente)
```
1. **Clientes** usan los microservicios mediante **llamadas HTTP API**. Idealmente, los consumidores deben tener un **contrato de servicio fuertemente definido** con la API (expectativas consistentes de nivel de servicio y control de cambios).
2. **Amazon API Gateway** aloja las solicitudes y respuestas HTTP RESTful. Provee **autorización integrada (built-in authorization)**, **throttling**, seguridad, tolerancia a fallos, mapeo de request/response y optimizaciones de rendimiento.
3. **AWS Lambda** contiene la **lógica de negocio** para procesar las llamadas y usa DynamoDB como almacenamiento persistente.
4. **Amazon DynamoDB** **almacena persistentemente los datos** del microservicio y **escala según la demanda**. Como los microservicios suelen hacer "una cosa bien", se usa un almacén **NoSQL sin esquema (schemaless)**.

#### Escenario B — Web application (diap. 16)
```
Cliente --> Amazon CloudFront --> Amazon S3 (estáticos: HTML, CSS, JS, imágenes)
   |            |
   |            +--> Amazon API Gateway --> AWS Lambda --> Amazon DynamoDB
   +--> Amazon Cognito (user pools: autenticación)  (los tokens se usan al llamar a API Gateway)
```
Numeración de la figura: 1 Cognito, 2 CloudFront, 3 S3, 4 API Gateway, 5 Lambda, 6 DynamoDB.
1. **Amazon Cognito user pools**: **administración de usuarios** y proveedores de identidad; **los tokens emitidos por Cognito se usan para autenticar** al hacer solicitudes a API Gateway.
2. **Amazon CloudFront**: mejor experiencia al **acelerar la entrega de contenido** estático y de llamadas al backend; **acerca el contenido a los clientes** mediante los Puntos de Presencia (PoPs) globales; también puede **cachear llamadas a la API** para reducir cómputo en el backend y da ruteo de red óptimo para llamadas no cacheables.
3. **Amazon S3**: **aloja los activos estáticos** de la aplicación web (HTML, CSS, JavaScript, imágenes); el contenido se sirve de forma segura vía CloudFront.
4. **Amazon API Gateway**: **endpoint HTTPS seguro**; la web hace llamadas **REST API** a un **endpoint HTTPS público** con dominio propio o el dominio único que da API Gateway.
5. **AWS Lambda**: operaciones **CRUD** (crear, leer, actualizar, borrar) sobre DynamoDB.
6. **Amazon DynamoDB**: almacén **NoSQL** que **escala elásticamente** con la aplicación.

#### Escenario C — Event-driven architectures (diap. 17-18)
Texto de la diapositiva 17:
- Las arquitecturas dirigidas por eventos son una forma **popular y preferible** de construir **aplicaciones grandes, distribuidas, basadas en microservicios**; ayuda a construir soluciones **escalables, resilientes, ágiles y costo-efectivas**.
- Con servicios serverless de AWS se logran aplicaciones **escalables y tolerantes a fallos**.
- **Amazon SQS** para **comunicación confiable y duradera entre microservicios**.
- **Amazon SNS (topics)** para **fan-out** de eventos.
- **Amazon EventBridge** si se necesita **filtrado y ruteo de eventos**.
- Casos de uso típicos: **comunicación entre microservicios**; integración con aplicaciones SaaS de terceros; replicación de datos entre cuentas y regiones (cross-account / cross-region); **procesamiento paralelo de eventos, fanout**.

Diapositiva 18 (arquitectura de referencia): **toda arquitectura dirigida por eventos tiene 3 partes principales**:
1. **Event sources** (fuentes de eventos): otros servicios AWS, tus microservicios o aplicaciones, o SaaS de terceros.
2. **Event routers** (ruteadores): reglas que coinciden con partes específicas del evento y envían a destinos; se describen reglas y destinos con **Amazon EventBridge**.
3. **Event destinations** (destinos/targets).

Diagrama de la diapositiva: Event sources (AWS Services, Custom Apps, SaaS Apps) -> buses de EventBridge (Default event bus, Custom event bus, Partner event bus, este último con "Event source" de SaaS) -> **Rules** -> **Targets**. Targets mostrados: Lambda, EC2, Batch, ECS, Step Functions, Redshift, EC2 Image Builder, SNS, **SQS**, Glue, Systems Manager (Run Command, Automation, OpsItem), CodePipeline, CodeBuild, Kinesis Data Streams, CloudWatch Log Group, API Gateway, SageMaker, Kinesis Data Firehose, EventBridge (otro event bus), API Destination (SaaS/custom apps), Inspector, Amazon MQ, Systems Manager Incident Manager.

### 1.6 Patrones de comunicación entre aplicaciones (imagen de mats1)
Existen **dos patrones**:
```
1) Síncrono (aplicación a aplicación)        2) Asíncrono / basado en eventos (aplicación a cola a aplicación)
   Buying Service <------> Shipping Service     Buying Service ---> [ Queue ] ---> Shipping Service
```
- **Síncrono**: los servicios se comunican directamente; están acoplados (el emisor depende de que el receptor esté disponible).
- **Asíncrono/basado en eventos**: hay una cola en medio; **desacopla** productor y consumidor (es la base del Taller 3: "arquitectura desacoplada y asíncrona").

### 1.7 Conceptos de arquitectura basada en eventos (de los talleres)

**Amazon SQS (Simple Queue Service)** (Taller 3, diap. 5; fuente aws.amazon.com/es/sqs):
- "Colas de mensajes completamente administradas para microservicios, sistemas distribuidos y aplicaciones sin servidor."
- Es un **servicio de colas de mensajes completamente administrado que permite desacoplar y ajustar la escala** de microservicios, sistemas distribuidos y aplicaciones sin servidor.
- Elimina la complejidad y gastos del middleware orientado a mensajes; permite **enviar, almacenar y recibir mensajes** entre componentes de software de cualquier volumen **sin pérdida de mensajes** ni necesidad de que otros servicios estén disponibles.
- Se usa desde consola, CLI o SDK.
- **Dos tipos de cola**:

| | **Estándar** | **FIFO** |
|---|---|---|
| Orden | **No se conserva el orden** (orden de **mejor esfuerzo**) | Se conserva: **primero en entrar, primero en salir** |
| Entrega | **Al menos una vez** | **Procesamiento único** (exactamente una vez) |
| Rendimiento | **Capacidad de procesamiento máxima** | (según la consola: entrega primero en entrar/primero en salir; procesamiento único) |

- La consola advierte: **"No puede cambiar el tipo de cola después de crear una cola."**
- Nombre de cola: distingue mayúsculas/minúsculas, hasta **80 caracteres**; permite alfanuméricos, guiones (-) y guiones bajos (_).
- En el taller se usa siempre **cola Estándar** (consecuencia: los despachadores no reciben pedidos necesariamente en orden; ver Taller 3).
- En la lista de colas aparecen los contadores **Mensajes disponibles** (listos para recibirse) y **Mensajes en tránsito** (recibidos por un consumidor pero aún no borrados).

**Dead Letter Queue (DLQ - cola de mensajes fallidos)** (Taller 3, diap. 21):
- "Una cola de mensajes fallidos (DLQ) es un tipo especial de cola de mensajes que **almacena temporalmente los mensajes que un sistema de software no puede procesar debido a errores**."
- En SQS se configura en la cola **origen**: opción *Cola de mensajes fallidos* (Habilitada), se elige la ARN de la DLQ y **Recepciones máximas** (rango permitido 1 a 1000). Cuando un mensaje se recibe más veces que ese máximo sin ser borrado, SQS lo mueve a la DLQ.
- En el taller: **Recepciones máximas = 2** ("2 reintentos fallidos").

**Amazon SNS (Simple Notification Service)** (Taller 4): servicio de **publicación/suscripción (pub/sub)**; se publica un mensaje en un **tema (topic)** y SNS lo entrega a todas las **suscripciones** (correo, cola SQS, etc.); cada suscripción puede tener su propia **política de filtro**. En el lens Serverless se indica "para **fan-out** de eventos use SNS topics". (La definición literal de SNS como pub/sub proviene del Serverless Lens: "fully managed messaging service for pub/sub patterns using asynchronous event notifications and mobile push notifications".)

**Amazon EventBridge** (Taller 4): en el taller se usa una **regla de tipo "Programar" (schedule)** que invoca una Lambda cada 1 minuto (simula el sensor). En teoría se usa como **ruteador de eventos** (reglas -> destinos).

**Política de filtro de suscripción SNS** (Taller 4): JSON en el que cada clave es un atributo del mensaje y su valor es una lista de valores aceptados, o una condición numérica `{"numeric": [">", 800]}`. Entre claves distintas rige **AND** (todas deben cumplirse); dentro de la lista de una misma clave rige **OR**. (La regla AND/OR no se enuncia en las diapositivas; se deduce del diagrama "tenant_id = FAB1 **y** sensor_id = CO2 **y** medición > 800 PPM".)

**Multi-tenant**: los JSON usan `tenant_id` (PLAZA_VEA, UTEC, FAB1) como clave de partición en DynamoDB; la clave de ordenación es el identificador del evento (`pedido_id` o `lectura_id`).

### 1.8 Comparaciones útiles

| Tema | Comparación |
|---|---|
| Síncrono vs asíncrono | Síncrono: servicio A llama directo a B (acoplamiento, A espera). Asíncrono: A deja el evento en una cola/tema y sigue; B lo procesa cuando puede (desacoplado, tolera caídas de B). |
| SQS vs SNS vs EventBridge (según el lens Serverless de la clase) | **SQS**: comunicación confiable y duradera entre microservicios (cola). **SNS**: **fan-out** de eventos a varios suscriptores. **EventBridge**: **filtrado y ruteo** de eventos con reglas y destinos. |
| Cola Estándar vs FIFO | Estándar: al menos una vez, orden de mejor esfuerzo, máximo throughput. FIFO: orden estricto, procesamiento único. |
| Push vs pull | En Taller 3 el consumo es **pull**: la Lambda ProcesarPedido llama `receive_message` (long polling). En Taller 3 Ej. 3 y Taller 4 el consumo es por **desencadenador (trigger) SQS -> Lambda** (event source mapping): llega `event['Records']`. |
| Filtro SNS a correo vs a cola | Correo: Filtro 1 (FAB1 + CO2 + >800). Cola SQS: Filtro 2 (solo FAB1). |


---

## 2. Laboratorio

Región usada en todos los talleres: **us-east-1** (N. Virginia). Los IDs de cuenta que aparecen en el código (498917627164, 447891120606, 630428322104) son de las cuentas de los autores de las diapositivas: **hay que reemplazarlos por los del propio alumno** (en el Taller 4 el PDF resalta en amarillo el ARN del tema SNS que se debe reemplazar; en el Taller 3 se indica "reemplace el queue_url").

---

### 2.1 TALLER 3 — SQS (Simple Queue Service) y DLQ

**Objetivo (diap. 3):** "Diseño e implementación de una Arquitectura de Solución basada en eventos con el servicio SQS - Simple Queue Service."

**Contenido:** 1 Objetivo, 2 SQS, 3 Ejercicio 1: Despacho de pedidos, 4 Ejercicio 2: Propuesto, 5 DLQ, 6 Ejercicio 3: DLQ, 7 Cierre.

#### 2.1.1 Ejercicio 1 — Despacho de Pedidos (arquitectura desacoplada y asíncrona)

**Arquitectura (diap. 7):**
```
Cliente (Registrar Pedido)
   |  POST /pedidos/registrar            (Amazon API Gateway "pedidos" = Microservicio pedidos)
   v
[API Gateway] --> Lambda RegistrarPedido --{JSON "Evento Nuevo Pedido"}--> [SQS sqs-pedidos "Cola Pedidos"]
                                                                                   |
Despachador 1/2/3 --GET /pedidos/procesar--> [API Gateway] --> Lambda ProcesarPedido <---- (receive_message)
                                                                  |
                                                                  v
                                                       DynamoDB t_pedidos_procesados
```
- Los **Despachadores 1, 2 y 3** (cada uno con su camión) son consumidores que "simulan" ejecutar el API de procesar. Varios consumidores leen de la **misma cola**.
- Evento: **Nuevo Pedido** (JSON).

**Pasos numerados:**

1. **Crear la cola de pedidos `sqs-pedidos`**: SQS -> Crear una cola -> Tipo **Estándar** (orden de mejor esfuerzo, entrega al menos una vez) -> Nombre `sqs-pedidos`. (Recordar: el tipo no se puede cambiar después.)
2. **Crear Lambda `RegistrarPedido`** con **tiempo de espera (timeout) de 20 segundos** y **reemplazar el `queue_url`** por la URL de la propia cola (código en 2.1.4).
3. **Crear API Gateway `pedidos`** con el **recurso `/pedidos/registrar`**, **método POST** que ejecute la Lambda anterior y **habilitar CORS**. Configuración CORS vista en la captura: *Respuestas de puerta de enlace*: marcar **Default 4XX** y **Default 5XX**; *Access-Control-Allow-Methods*: marcar **POST** (OPTIONS aparece sin marcar en la captura).
4. **Probar con Postman registrando un pedido**: método **POST** a `https://<id>.execute-api.us-east-1.amazonaws.com/prod/pedidos/registrar`, Body -> **raw** -> **JSON** (contenido de `pedido 1.json`). Respuesta esperada: `Status: 200 OK` y `{"statusCode": 200, ...}` (la Lambda devuelve también `respuesta`, la respuesta de `send_message`).
5. **Verificar en la cola `sqs-pedidos` que llegó el mensaje**: la lista de colas muestra **Mensajes disponibles = 1**, Mensajes en tránsito = 0; al abrir el mensaje (Cuerpo) se ve el JSON del pedido serializado (con `"pais": "Perú"` por `json.dumps`).
6. **Registrar los otros 4 mensajes por Postman** (pedido 2 a 5): la cola muestra **Mensajes disponibles = 5**.
7. **Crear la tabla DynamoDB `t_pedidos_procesados`**: **Clave de partición `tenant_id` (String, S)**, **Clave de ordenación `pedido_id` (Number, N)**. Estado Activo.
8. **Crear Lambda `ProcesarPedido`** con **timeout de 20 segundos** (código en 2.1.4; usa `WaitTimeSeconds=10`, por eso el timeout por defecto de 3 s no alcanzaría).
9. En API Gateway `pedidos` **crear el recurso `/pedidos/procesar`** con **método GET** que ejecute la Lambda anterior y **habilitar CORS** (en CORS: Default 4XX, Default 5XX y método **GET** marcados).
10. **Ejecutar el API en Postman simulando al Despachador 1**: `GET .../prod/pedidos/procesar`. Resultado de la captura: `statusCode 200` y `pedidos_procesados` con los pedidos **1 y 4** (PLAZA_VEA).
11. **Verificar que se grabaron en la tabla**: en DynamoDB aparecen los ítems `PLAZA_VEA / 1` y `PLAZA_VEA / 4` (columna `pedido_datos` con mapa `direccion_entrega` -> `distrito` {"S": "La Molina"} / "San Isidro", etc.). Nótese el formato DynamoDB `{"S": ...}`.
12. **Ejecutar el API hasta procesar los 5 pedidos simulando al Despachador 2 y 3 y analizar.**
   - Análisis esperado (derivado del código y de lo observado): cada invocación toma **como máximo 3 mensajes**; al ser cola **Estándar**, los pedidos **no salen en orden** (el Despachador 1 recibió el 1 y el 4, no el 1, 2 y 3; una recepción puede devolver menos de 3 porque SQS muestrea servidores), y un mensaje **ya borrado no se entrega a otro despachador**, así que cada pedido lo procesa **un solo despachador** (el reparto de trabajo entre consumidores competidores). Total grabado tras las llamadas necesarias: 5 filas.

**Errores comunes / puntos de atención:**
- Olvidar cambiar `queue_url` por la URL de la cola propia.
- Dejar el timeout de Lambda en 3 s: `receive_message` con `WaitTimeSeconds=10` (long polling) falla por timeout -> por eso 20 s.
- No habilitar CORS o no marcar el método (POST/GET) en cada recurso.
- Olvidar desplegar el API (la URL de Postman usa la etapa `prod`).
- No borrar el mensaje (`delete_message`): reaparecería tras el *visibility timeout* y otro despachador lo volvería a procesar (duplicados). (Consecuencia del comportamiento de SQS; el código del taller sí lo borra tras guardar.)
- Permisos IAM de la Lambda (SQS/DynamoDB): el material no detalla este paso; se asume el rol de laboratorio de la cuenta.

#### 2.1.2 Ejercicio 2 — Propuesto (Taller 3) — 20 puntos, entrega 2026-11-23 04:59:59 UTC
Enunciado (diap. 17):
- Modificar la Lambda `ProcesarPedido` para que **reciba como entrada un `despachador_id`** (`"DESP-01"`, `"DESP-02"`, `"DESP-03"`) y se **grabe como campo** en la tabla `t_pedidos_procesados` para identificar al despachador que procesó cada pedido. Hay que **cambiar el método a POST** en API Gateway en `pedidos/procesar`.
- En la **respuesta** de la Lambda agregar un campo con la **cantidad de pedidos procesados**:
```json
{
  "statusCode": 200,
  "cantidad_pedidos_procesados": 3,
  "pedidos_procesados": [ ... ]
}
```
(Ver solución propuesta en la sección 3.)

#### 2.1.3 Ejercicio 3 — DLQ: registrar alumno en Canvas con SQS y DLQ

**Objetivo (diap. 19):** agregar una **cola de mensajes fallidos (DLQ)** en caso **falle el registro de un nuevo alumno en Canvas**.

**Arquitectura (diapositiva 20 / `canvas_DLQ_guiado.drawio.png`):**
```
JSON alumno --> [SQS sqs-registrar-canvas] --Desencadenar Lambda (2 reintentos)--> Lambda RegistrarCanvas
                        |
                        +-- si falla la Lambda, el mensaje se envía a --> [SQS sqs-registrar-canvas-dlq]
```
Mensaje de ejemplo (`UTEC_json_alumno.json`): tenant UTEC, alumno_id 202310295, Claudia Espinoza (ver 2.1.4).

**Pasos:**
1. **Crear la DLQ `sqs-registrar-canvas-dlq`** (cola SQS normal que hará de cola de fallidos).
2. **Crear la cola `sqs-registrar-canvas`** y en su configuración **Cola de mensajes fallidos -> Habilitada**; en *Elegir cola* poner la ARN `arn:aws:sqs:us-east-1:<cuenta>:sqs-registrar-canvas-dlq`; **Recepciones máximas = 2** (valor permitido 1-1000) para que el mensaje se envíe a la DLQ **luego de 2 reintentos fallidos**.
3. **Crear la Lambda `RegistrarCanvas`** que **genere una excepción** (simulando que falla): `print(event)` y `raise Exception("Error")`.
4. En la cola `sqs-registrar-canvas` configurar un **desencadenador de Lambda** (pestaña *Desencadenadores de Lambda*; lista UUID + ARN `arn:aws:lambda:us-east-1:<cuenta>:function:RegistrarCanvas`) para que procese el mensaje.
5. **Enviar un mensaje** en `sqs-registrar-canvas` (Enviar y recibir mensajes -> pegar el JSON del alumno -> "El mensaje se ha enviado y está listo para ser recibido"). **Validar**: (a) en **CloudWatch** los **2 reintentos con error**, **cada 30 segundos**; (b) que se genere **1 mensaje en `sqs-registrar-canvas-dlq`**.
   - Captura: primero `sqs-registrar-canvas` con **Mensajes en tránsito = 1** (se está procesando/reintentando) y DLQ en 0; luego `sqs-registrar-canvas` 0/0 y **`sqs-registrar-canvas-dlq` con Mensajes disponibles = 1**.

**Por qué "cada 30 segundos":** el mensaje queda "en tránsito" y, al fallar la Lambda (no se borra), vuelve a estar visible cuando vence el tiempo de visibilidad; el intervalo observado entre reintentos es de 30 s (diapositiva). Tras la **2.ª recepción** se supera el máximo configurado y SQS lo mueve a la DLQ.

**Errores comunes:** no habilitar la DLQ o poner mal la ARN; olvidar el trigger Lambda; esperar menos de ~1 minuto; confundir "reintentos" con "recepciones máximas" (en la consola el parámetro se llama *Recepciones máximas*).

#### 2.1.4 Código y JSON del Taller 3 (completo)

**`lambda_RegistrarPedido.py`** — productor: envía el pedido a la cola.
```python
import json
import boto3

def lambda_handler(event, context):
    pedido = json.dumps(event)          # el body del POST llega ya como dict en 'event' -> se serializa a texto

    # Create SQS client
    sqs = boto3.client('sqs')
    queue_url = 'https://sqs.us-east-1.amazonaws.com/498917627164/sqs-pedidos'   # <- reemplazar por la URL de TU cola

    # Send message to SQS queue
    response = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=(pedido)             # el cuerpo del mensaje es un string
    )

    # Salida (json)
    return {
        'statusCode': 200,
        'respuesta': response            # incluye MessageId, MD5OfMessageBody, etc.
    }
```

**`lambda_ProcesarPedido.py`** — consumidor (pull): lee hasta 3 mensajes, los guarda en DynamoDB y los borra.
```python
import json
import boto3

def lambda_handler(event, context):

    # Create SQS client
    sqs = boto3.client('sqs')
    queue_url = 'https://sqs.us-east-1.amazonaws.com/498917627164/sqs-pedidos'

    # Receive message from SQS queue
    response = sqs.receive_message(
        QueueUrl=queue_url,
        MaxNumberOfMessages=3,   # máximo de mensajes por invocación (despachador)
        WaitTimeSeconds=10       # long polling: espera hasta 10 s a que haya mensajes
    )

    print(response)

    messages = response.get('Messages', [])    # si la cola está vacía no existe la clave 'Messages'
    pedidos = []
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_pedidos_procesados')

    for message in messages:
        pedido = json.loads(message['Body'])    # texto -> dict
        print(pedido)
        pedidos.append(pedido)
        response_dynamodb = table.put_item(Item=pedido)   # requiere tenant_id (PK) y pedido_id (SK)
        receipt_handle = message['ReceiptHandle']
        # Delete received message from queue (sin esto el mensaje reaparece)
        sqs.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=receipt_handle
        )

    return {
        'statusCode': 200,
        'pedidos_procesados': pedidos
    }
```
Detalles que se preguntan: `Messages` (lista), `Body`, `ReceiptHandle` (necesario para borrar), `MaxNumberOfMessages`, `WaitTimeSeconds`.

**`lambda_RegistrarCanvas.py`** — Lambda que falla a propósito:
```python
import json

def lambda_handler(event, context):
    # TODO implement
    print(event)
    raise Exception("Error")      # fuerza el fallo -> el mensaje no se borra -> reintento -> DLQ

    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')     # nunca se alcanza
    }
```

**`pedido 1.json`** (los pedidos 2-5 tienen la misma estructura):
```json
{
  "tenant_id": "PLAZA_VEA",
  "pedido_id": 1,
  "pedido_datos": {
    "cliente_id": "jperez@gmail.com",
    "fecha_compra": "2024-06-01T14:30:00Z",
    "items": [
      { "item_id": "001", "product_name": "Detergente",  "quantity": 2, "price": "60.99" },
      { "item_id": "002", "product_name": "Lavavajilla", "quantity": 1, "price": "10.35" }
    ],
    "direccion_entrega": {
      "calle": "Avenida Los Frutales 123",
      "distrito": "La Molina",
      "provincia": "Lima",
      "pais": "Perú"
    }
  }
}
```
Resumen de los otros pedidos (todos `tenant_id: PLAZA_VEA`):

| pedido_id | cliente_id | fecha_compra | Ítems (producto x cantidad @ precio) | Distrito |
|---|---|---|---|---|
| 1 | jperez@gmail.com | 2024-06-01T14:30:00Z | Detergente x2 @60.99; Lavavajilla x1 @10.35 | La Molina |
| 2 | gcolchado@gmail.com | 2024-06-01T15:30:00Z | Jamonada x1 @10.35; Pan Bimbo x2 @25.50 | Miraflores |
| 3 | sencalada@gmail.com | 2024-06-01T16:30:00Z | Papaya x1 @15.19; Naranja x3 @12.50 | Miraflores |
| 4 | pontaneda@gmail.com | 2024-06-01T17:35:15Z | Pollo x3 @48.99; Carne x2 @60.35 | San Isidro |
| 5 | crojo@gmail.com | 2024-06-01T18:35:15Z | Vino x5 @120.99; Papas Fritas x4 @50.00 | San Isidro |

Nota: `price` es **string** (no número) en los JSON; esto importa porque DynamoDB `put_item` con `boto3.resource` **no acepta `float`** (por eso los precios son strings).

**`UTEC_json_alumno.json`** (mensaje para la DLQ):
```json
{
  "tenant_id": "UTEC",
  "alumno_id": "202310295",
  "alumno_datos": {
    "nombre": "Claudia Espinoza",
    "sexo": "M",
    "fecha_nac": "2004-12-04",
    "celular": "999736371",
    "domicilio": {
      "direcc": "Av. El Polo 1767",
      "distrito": "Monterrico",
      "provincia": "Lima",
      "departamento": "Lima",
      "pais": "Perú"
    }
  }
}
```

---

### 2.2 TALLER 4 — SNS + SQS + EventBridge (Evento "Nueva Lectura Sensor IoT")

**Objetivo (diap. 3):** "Diseño e implementación de una Arquitectura de Solución basada en eventos con el servicio **SNS - Simple Notification Service** y **SQS - Simple Queue Service**."

**Contenido:** 1 Objetivo, 2 Ejercicio 1: Evento Nueva Lectura Sensor IoT, 3 Ejercicio 2: Propuesto, 4 Cierre.

#### 2.2.1 Arquitectura (diap. 5 y `event04.drawio`, página "taller")
```
EventBridge regla "SimuladorSensorIoT" (cada 1 min)
        |
        v
Lambda GenerarEventoSensorIoT --{JSON "Medición Sensor IoT"}--> SNS tema "TemaSensorIoT"
                                                                   |
        +----------------------------------------------------------+---------------------------+
        | filtro: tenant_id="FAB1" y sensor_id="CO2" y medición > 800 PPM                       | filtro: tenant_id="FAB1"
        v                                                                                       v
   Suscripción e-mail (correo)                                       SQS "ColaSensorIoTFAB1" --trigger--> Lambda InsertarEventoSensorIoT
                                                                                                             |
                                                                                                             v
                                                                                       DynamoDB "t_sensor_iot_FAB1"
```
Resumen: el sensor genera un evento -> SNS lo **distribuye (fan-out)** a dos destinos con **filtros distintos**: alertas por correo solo para lecturas altas y almacenamiento de todas las lecturas de FAB1 vía cola + Lambda + DynamoDB.

#### 2.2.2 Pasos numerados (Ejercicio 1)

1. **Crear el tema SNS `TemaSensorIoT`** (el material solo indica el nombre del tema). Guardar su **ARN** (en el ejemplo `arn:aws:sns:us-east-1:447891120606:TemaSensorIoT`).
2. **Crear la Lambda `GenerarEventoSensorIoT`** con el código de 2.2.4 (**reemplazar el `TopicArn`** —marcado en amarillo— por el del propio tema). Simula un sensor de CO2 con lectura aleatoria **entre 400 y 1000 PPM**. Publica el evento en SNS con `MessageAttributes`.
3. **Crear una suscripción de correo electrónico válido** al tema `TemaSensorIoT` y colocar la **política de filtro** (Filtro 1):
```json
{
  "tenant_id": ["FAB1"],
  "sensor_id": ["CO2"],
  "medicion": [ { "numeric": [">", 800] } ]
}
```
   (Hay que **confirmar la suscripción** desde el correo recibido para que se active; paso estándar de SNS, no detallado en las diapositivas.)
4. **Crear la regla de EventBridge `SimuladorSensorIoT`** que llame a la Lambda `GenerarEventoSensorIoT` **cada 1 minuto**:
   - *Definición de detalles*: Nombre `SimuladorSensorIoT`; **Bus de eventos: `default`**; regla habilitada; **Tipo de regla: "Programar"** (no "Regla con un patrón de eventos").
   - *Definir programación*: **"Un horario que se ejecuta con una frecuencia periódica; p. ej., cada 10 minutos"** -> **Frecuencia: Valor 1, Unidad Minutos**.
   - *Seleccionar destinos*: Destino 1 -> **Tipos de destino: Servicio de AWS** -> **Seleccione un destino: Función Lambda** -> Función `GenerarEventoSensorIoT`. (Nota de consola: al usar la consola EventBridge configura automáticamente los permisos del destino.) -> Siguiente -> **Crear regla**.
5. **Esperar unos 6 minutos y verificar si llegó algún correo** notificando este filtro (solo llegan las lecturas > 800 PPM; como la lectura es aleatoria 400-1000, no todas las ejecuciones generan correo).
6. **Crear la tabla DynamoDB `t_sensor_iot_FAB1`**: **clave de partición `tenant_id` (S)**, **clave de ordenación `lectura_id` (S)**.
7. **Crear la Lambda `InsertarEventoSensorIoT`** con el código de 2.2.4.
8. **Crear la cola SQS `ColaSensorIoTFAB1`** que **desencadene** la Lambda `InsertarEventoSensorIoT` (trigger) y con **política de acceso** que permita al tema SNS `TemaSensorIoT` enviarle mensajes (JSON de 2.2.5).
9. **Suscribir la cola `ColaSensorIoTFAB1` al tema `TemaSensorIoT`** con la **política de filtro** (Filtro 2):
```json
{ "tenant_id": ["FAB1"] }
```
10. **Validar** que se registren lecturas del sensor CO2 en `t_sensor_iot_FAB1`. Ejemplo de la captura (una por minuto):

| tenant_id | lectura_id | lectura_datos |
|---|---|---|
| FAB1 | CO2.2022-10-26.01:45:48.591414 | {"unidad_medida": {"S": "PPM"}, "medicion": {"N": "807"}} |
| FAB1 | CO2.2022-10-26.01:46:48.060123 | {"unidad_medida": {"S": "PPM"}, "medicion": {"N": "948"}} |
| FAB1 | CO2.2022-10-26.01:47:48.047735 | {"unidad_medida": {"S": "PPM"}, "medicion": {"N": "785"}} |

   Observación: se guardan **todas** las lecturas (incluida 785 < 800) porque el filtro de la cola es solo `tenant_id = FAB1`; el correo, en cambio, solo recibe las > 800.

**Errores comunes:**
- No reemplazar el `TopicArn` por el propio.
- No confirmar la suscripción de correo.
- Olvidar la **política de acceso de la cola** (sin ella SNS no puede enviar a SQS y la tabla queda vacía).
- Que el nombre de tabla en la Lambda (`t_sensor_iot_FAB1`) no coincida (en la diapositiva se ve una comilla tipográfica `’` en el nombre: copiar el código del archivo `.py`, no de la diapositiva).
- Filtro mal escrito: los valores van en **listas** (`["FAB1"]`); el numérico es `{"numeric": [">", 800]}`.
- No poner `MessageAttributes` al publicar: el filtro (que se evalúa sobre los atributos) no tendría sobre qué actuar.
- Olvidar que el mensaje que llega a la Lambda desde SQS está **envuelto**: `event['Records'][0]['body']` es el sobre SNS (JSON) y el evento real está en `['Message']` (de ahí el doble `json.loads`).

#### 2.2.3 Ejercicio 2 — Propuesto (Taller 4) — 20 puntos, entrega 2026-11-23 04:59:59 UTC
Enunciado (diap. 15-16, diagrama `event04.drawio` página "propuesto"):
1. En la Lambda `GenerarEventoSensorIoT` agregar para `tenant_id = "FAB1"` un **nuevo `sensor_id = "TEMP"`** que genere aleatoriamente una **lectura entre 10 y 60 °C** y use `unidad_medida = "CELSIUS"`.
2. Agregar una **suscripción de otro correo electrónico** con el filtro resaltado: **`tenant_id = "FAB1"` y `sensor_id = "TEMP"` y `medición > 40 CELSIUS`**.
3. Verificar que se **inserten** las lecturas del nuevo sensor en la tabla DynamoDB y que **llegue el correo** cuando se cumpla el filtro.
4. Mostrar **evidencia de correo y registros en tabla en el padlet** indicado por el docente.

Diagrama propuesto: el tema SNS tiene ahora **3 ramas**: correo 1 (FAB1 + CO2 + >800 PPM), cola SQS -> Lambda -> DynamoDB (FAB1) y **correo 2 (FAB1 + TEMP + >40 CELSIUS)**. (Solución propuesta en la sección 3.)

#### 2.2.4 Código del Taller 4 (completo, comentado)

**`Lambda - GenerarEventoSensorIoT - Python.py`**
```python
import json
import random
from datetime import datetime
import boto3

def lambda_handler(event, context):
    # Simulacion de Lectura de Sensor
    tenant_id = "FAB1"
    sensor_id = "CO2"
    now = datetime.now()
    fecha_hora = str(now.date()) + "." + str(now.time())     # p.ej. 2022-10-26.01:45:48.591414
    medicion = random.randint(400, 1000)  # Desde 400 a 1000 PPM (Nivel de CO2)
    unidad_medida = "PPM"

    lectura_sensor = {
        'tenant_id': tenant_id,                       # clave de partición en DynamoDB
        'lectura_id': sensor_id + "." + fecha_hora,   # clave de ordenación: "CO2.<fecha>.<hora>"
        'lectura_datos': {
            'medicion': medicion,
            'unidad_medida': unidad_medida
        }
    }
    print(lectura_sensor)  # Para logs en Cloud Watch
    # Publicar en SNS
    sns_client = boto3.client('sns')
    response_sns = sns_client.publish(
        TopicArn = 'arn:aws:sns:us-east-1:447891120606:TemaSensorIoT',   # <- reemplazar por tu ARN
        Subject = 'Nueva Lectura Sensor',
        Message = json.dumps(lectura_sensor),        # el cuerpo del evento (string JSON)
        MessageAttributes = {                        # atributos sobre los que actúan los filtros
            'tenant_id': {'DataType': 'String', 'StringValue': tenant_id },
            'sensor_id': {'DataType': 'String', 'StringValue': sensor_id },
            'medicion':  {'DataType': 'Number', 'StringValue': str(medicion) }   # Number pero el valor va como str
        }
    )
    return {
        'statusCode': 200,
        'body': response_sns
    }
```

**`Lambda - InsertarEventoSensorIoT - Python.py`**
```python
import json
import boto3

def lambda_handler(event, context):
    # Entrada (json)
    body = json.loads(event['Records'][0]['body'])      # 1.er parseo: el sobre SNS que SQS entrega en 'body'
    lectura_sensor = json.loads(body['Message'])        # 2.o parseo: el 'Message' publicado por GenerarEvento...
    # Proceso
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_sensor_iot_FAB1')
    response = table.put_item(Item=lectura_sensor)      # tenant_id (PK) + lectura_id (SK) + lectura_datos
    print(lectura_sensor)  # Para logs en Cloud Watch
    # Salida (json)
    return {
        'statusCode': 200,
        'response': response
    }
```
Nota: el código procesa solo `Records[0]` (un mensaje por invocación); con lotes mayores quedarían registros sin procesar (observación derivada del código).

#### 2.2.5 Política de acceso de la cola SQS (`Política_acceso_SQS.json`)
Permite que **SNS envíe mensajes a la cola** únicamente desde el tema indicado:
```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "sns.amazonaws.com"
      },
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:630428322104:ColaSensorIoTFAB1",
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "arn:aws:sns:us-east-1:630428322104:TemaSensorIoT"
        }
      }
    }
  ]
}
```
Lectura por partes: **Effect Allow**; **Principal** = servicio `sns.amazonaws.com`; **Action** `sqs:SendMessage`; **Resource** = ARN de la cola destino; **Condition** `ArnEquals` sobre `aws:SourceArn` = ARN del tema (evita que cualquier otro tema/cuenta escriba en la cola). Se pega en la cola: *Política de acceso* -> editar.

#### 2.2.6 Filtros (`Filtro 1.json` y `Filtro 2.json`)
| Archivo | Destino | Contenido | Significado |
|---|---|---|---|
| Filtro 1 | Suscripción de correo | `{"tenant_id":["FAB1"],"sensor_id":["CO2"],"medicion":[{"numeric":[">",800]}]}` | Solo FAB1 **y** CO2 **y** medición > 800 |
| Filtro 2 | Suscripción SQS `ColaSensorIoTFAB1` | `{"tenant_id":["FAB1"]}` | Todo lo de la fábrica FAB1 |

Operadores numéricos de SNS vistos: `">"`. (Otros operadores no aparecen en el material.)

---

## 3. Ejercicios propuestos

Ambos "Ejercicio Propuesto" de Canvas (S14 Taller 1 y S14 Taller 2) valen **20 puntos** y vencen el **2026-11-23 04:59:59 UTC**; los `.md` no tienen descripción, el enunciado real es el "Ejercicio 2 - Propuesto" de cada PDF. Las soluciones siguientes son **propuestas de enfoque** construidas a partir del código del material (no hay solución oficial en los archivos).

### 3.1 Taller 1 (= Taller 3 del PDF): ProcesarPedido con `despachador_id` y contador

**Enunciado:** Modificar `ProcesarPedido` para recibir `despachador_id` ("DESP-01", "DESP-02", "DESP-03"), grabarlo como campo en `t_pedidos_procesados`; cambiar el método de `/pedidos/procesar` a **POST**; agregar a la respuesta `cantidad_pedidos_procesados`.

**Enfoque:**
1. En API Gateway cambiar `/pedidos/procesar` de GET a **POST** (habilitar CORS con POST) y desplegar de nuevo. El despachador envía el body `{"despachador_id": "DESP-01"}`.
2. Con integración Lambda (la usada en el taller, donde `event` es el body JSON, como en `RegistrarPedido` que hace `json.dumps(event)`), el valor llega en `event['despachador_id']`.
3. Agregar `pedido['despachador_id'] = despachador_id` **antes** de `put_item`.
4. Devolver `len(pedidos)`.

```python
import json
import boto3

def lambda_handler(event, context):
    despachador_id = event['despachador_id']          # "DESP-01" | "DESP-02" | "DESP-03"

    sqs = boto3.client('sqs')
    queue_url = 'https://sqs.us-east-1.amazonaws.com/<cuenta>/sqs-pedidos'

    response = sqs.receive_message(
        QueueUrl=queue_url,
        MaxNumberOfMessages=3,
        WaitTimeSeconds=10
    )
    messages = response.get('Messages', [])
    pedidos = []
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_pedidos_procesados')

    for message in messages:
        pedido = json.loads(message['Body'])
        pedido['despachador_id'] = despachador_id      # <- nuevo campo grabado en DynamoDB
        pedidos.append(pedido)
        table.put_item(Item=pedido)
        sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=message['ReceiptHandle'])

    return {
        'statusCode': 200,
        'cantidad_pedidos_procesados': len(pedidos),   # <- nuevo campo de la respuesta
        'pedidos_procesados': pedidos
    }
```
Nota: si el API usara integración *proxy* el body llegaría como string en `event['body']` (`json.loads(event['body'])`); el material usa la forma `event` = body, así que se mantiene `event['despachador_id']`.
Evidencia sugerida: Postman POST con cada DESP-0X y la tabla mostrando el campo `despachador_id`.

### 3.2 Taller 2 (= Taller 4 del PDF): sensor TEMP + segundo correo

**Enunciado:** agregar `sensor_id = "TEMP"` (FAB1, lectura 10-60 °C, `unidad_medida = "CELSIUS"`); suscribir otro correo con filtro `tenant_id = FAB1`, `sensor_id = TEMP`, `medicion > 40`; verificar inserción en DynamoDB y correo; evidencia en el padlet.

**Enfoque:**
1. En `GenerarEventoSensorIoT` generar **también** (en la misma invocación) la lectura TEMP y publicar un segundo mensaje a SNS (o convertir el bloque de publicación en una función y llamarla dos veces):
```python
import json, random
from datetime import datetime
import boto3

sns_client = boto3.client('sns')
TOPIC_ARN = 'arn:aws:sns:us-east-1:<cuenta>:TemaSensorIoT'

def publicar(tenant_id, sensor_id, medicion, unidad_medida):
    now = datetime.now()
    fecha_hora = str(now.date()) + "." + str(now.time())
    lectura_sensor = {
        'tenant_id': tenant_id,
        'lectura_id': sensor_id + "." + fecha_hora,       # CO2.<fecha> o TEMP.<fecha>: distingue sensores en la SK
        'lectura_datos': {'medicion': medicion, 'unidad_medida': unidad_medida}
    }
    print(lectura_sensor)
    return sns_client.publish(
        TopicArn=TOPIC_ARN,
        Subject='Nueva Lectura Sensor',
        Message=json.dumps(lectura_sensor),
        MessageAttributes={
            'tenant_id': {'DataType': 'String', 'StringValue': tenant_id},
            'sensor_id': {'DataType': 'String', 'StringValue': sensor_id},
            'medicion':  {'DataType': 'Number', 'StringValue': str(medicion)}
        }
    )

def lambda_handler(event, context):
    r1 = publicar("FAB1", "CO2",  random.randint(400, 1000), "PPM")
    r2 = publicar("FAB1", "TEMP", random.randint(10, 60),    "CELSIUS")
    return {'statusCode': 200, 'body': [r1, r2]}
```
2. Nueva suscripción de correo (otro e-mail, confirmarla) con política de filtro:
```json
{
  "tenant_id": ["FAB1"],
  "sensor_id": ["TEMP"],
  "medicion": [ { "numeric": [">", 40] } ]
}
```
3. La suscripción de la cola (filtro `tenant_id = FAB1`) ya recibe las lecturas TEMP **sin cambios** porque el filtro solo mira el tenant; `InsertarEventoSensorIoT` las guarda en `t_sensor_iot_FAB1` con `lectura_id` que empieza por `TEMP.`.
4. Correo 1 (filtro CO2) **no** recibirá TEMP (sensor_id distinto) y correo 2 no recibirá CO2: demostrar con el filtro por `sensor_id`.
5. Esperar varios minutos (la regla corre cada 1 min; TEMP > 40 ocurre ~ 20/51 de las veces, lectura 10-60) y capturar correo y tabla para el padlet.

---

## 4. Conexiones teoría ↔ laboratorio

| Teoría (Well-Architected / Serverless Lens) | Dónde aparece en los talleres |
|---|---|
| Escenario **Event-driven architectures**: SQS para comunicación **confiable y duradera**, SNS para **fan-out**, EventBridge para **filtrado y ruteo** | Taller 3: **SQS** entre RegistrarPedido y ProcesarPedido. Taller 4: **SNS fan-out** a correo y a SQS; **EventBridge** (regla programada) como disparador. |
| 3 partes: **event sources, event routers, event destinations** | Taller 4: fuente = Lambda GenerarEvento (disparada por EventBridge), router = tema SNS con filtros por suscripción, destinos = correo y cola SQS -> Lambda -> DynamoDB. |
| Casos de uso: **comunicación entre microservicios**, **procesamiento paralelo / fanout** | Taller 3: microservicio `pedidos` desacoplado (registrar vs procesar) y 3 despachadores consumiendo en paralelo. Taller 4: fanout a 2 destinos. |
| Escenario **RESTful microservices**: API Gateway -> Lambda -> DynamoDB (NoSQL schemaless, escala por demanda) | Taller 3 Ej.1: API Gateway `pedidos` con `/pedidos/registrar` y `/pedidos/procesar`, Lambdas y DynamoDB `t_pedidos_procesados`. |
| Pilar **Fiabilidad**: "recuperarse rápidamente de los errores", diseño de sistemas distribuidos | **DLQ** (Taller 3 Ej.3): los mensajes que fallan no se pierden; quedan en `sqs-registrar-canvas-dlq` para análisis/reproceso. La cola desacopla productor y consumidor. (El Serverless Lens, REL 2, recomienda "usar un mecanismo de dead-letter queue para retener, investigar y reintentar transacciones fallidas".) |
| Pilar **Excelencia operativa**: monitorear, responder a eventos | Uso de **CloudWatch** para validar reintentos (`print` de event) y logs de Lambda; EventBridge automatiza la ejecución periódica. |
| Pilar **Seguridad**: permisos y controles | **Política de acceso SQS** con `Principal` sns.amazonaws.com y `Condition` `aws:SourceArn` (mínimo privilegio); API Gateway con autorización integrada (teoría). |
| Pilar **Optimización de costos** / serverless pay-per-use | Todos los componentes (Lambda, SQS, SNS, DynamoDB, API Gateway, EventBridge) son administrados y pagan por uso (afirmación del Serverless Lens: Lambda no cuesta en reposo). |
| Pilar **Eficiencia de rendimiento**: asignar recursos adecuados | Timeout de Lambda ajustado a 20 s por el long polling (10 s); `MaxNumberOfMessages=3`. El Serverless Lens recomienda timeout "unos segundos por encima del promedio de ejecución". |
| Patrón **síncrono vs asíncrono** (imagen "Patrones de comunicación") | Cliente -> API GW -> Lambda -> SQS: la respuesta HTTP no espera al despacho; el despacho se hace después. |
| **Multi-tenant** (`tenant_id`) | Claves de DynamoDB en ambos talleres: `tenant_id` (PK) + `pedido_id`/`lectura_id` (SK). |

---

## 5. Preguntas tipo examen (con respuesta modelo)

**P1. ¿Qué es AWS Well-Architected y qué incluye?**
Es un conjunto de buenas prácticas que ayuda a los arquitectos a crear infraestructura segura, de alto rendimiento, resistente y eficiente para diversas cargas de trabajo; se basa en seis pilares y ofrece un enfoque coherente para evaluar arquitecturas e implementar diseños escalables. El Framework incluye enfoques (lenses) de dominios específicos, laboratorios prácticos y la AWS Well-Architected Tool (gratuita en la consola) para evaluar cargas, identificar riesgos altos y registrar mejoras.

**P2. Enumere los 6 pilares y explique brevemente uno.**
Excelencia operativa, seguridad, fiabilidad, eficiencia/eficacia del rendimiento, optimización de costos y sostenibilidad. Ejemplo: *Fiabilidad* = que la carga de trabajo cumpla las funciones previstas y pueda recuperarse rápidamente de errores; temas: diseño de sistemas distribuidos, planificación de la recuperación, adaptación a requisitos cambiantes.

**P3. ¿Qué es un enfoque (lens) de Well-Architected? Dé ejemplos.**
Amplía la guía del framework para dominios tecnológicos/industriales específicos (ML, análisis de datos, serverless, HPC, IoT, SAP, streaming multimedia, videojuegos, redes híbridas, servicios financieros). Se usa junto con el framework y los seis pilares.

**P4. ¿Cuáles son las tres partes de una arquitectura dirigida por eventos y qué servicio AWS describe reglas y destinos?**
Fuentes de eventos (servicios AWS, microservicios/aplicaciones, SaaS), ruteadores de eventos y destinos de eventos. Reglas y destinos se describen con Amazon EventBridge.

**P5. En el escenario de aplicaciones serverless "Web application", ¿qué función cumple cada servicio?**
Cognito: usuarios/identidad, tokens para autenticar contra API Gateway. CloudFront: acelera entrega y puede cachear la API. S3: contenido estático. API Gateway: endpoint HTTPS/REST. Lambda: operaciones CRUD. DynamoDB: NoSQL que escala elásticamente.

**P6. ¿Qué servicio usaría para (a) comunicación confiable y duradera entre microservicios, (b) fan-out, (c) filtrado y ruteo de eventos?**
(a) SQS; (b) SNS topics; (c) EventBridge (según el escenario Event-driven del lens serverless).

**P7. Diferencie síncrono y asíncrono (basado en eventos) con el ejemplo Buying/Shipping Service.**
Síncrono: Buying llama directamente a Shipping (app a app), acoplados. Asíncrono: Buying envía a una cola y Shipping consume de la cola (app -> cola -> app); desacoplado.

**P8. ¿Qué es SQS y qué tipos de cola ofrece? ¿Cuál se usó y qué implica?**
Servicio de colas administrado que desacopla y escala microservicios/sistemas distribuidos/aplicaciones sin servidor. Estándar (máximo throughput, orden de mejor esfuerzo, al menos una vez) y FIFO (primero en entrar primero en salir, procesamiento único). Se usó Estándar: no se garantiza el orden y puede haber entregas duplicadas; el tipo no se puede cambiar tras crear la cola.

**P9. En el Taller 3 Ej.1, ¿por qué el Despachador 1 recibió los pedidos 1 y 4 y no 1, 2, 3? ¿Qué parámetros de `receive_message` se usaron?**
Cola estándar: orden de mejor esfuerzo, y una recepción puede devolver menos mensajes que el máximo. Se usó `MaxNumberOfMessages=3` y `WaitTimeSeconds=10` (long polling). Cada mensaje se borra con `delete_message(ReceiptHandle)` tras guardarlo, por eso otro despachador no lo reprocesa.

**P10. ¿Por qué el timeout de las Lambdas del taller es 20 s?**
Porque `ProcesarPedido` espera hasta 10 s en `receive_message` (long polling) y el timeout por defecto de Lambda sería insuficiente; así se evita que termine por timeout.

**P11. Defina DLQ y explique cómo se configuró en el Taller 3.**
Cola especial que almacena temporalmente los mensajes que el sistema no puede procesar por errores. Se creó `sqs-registrar-canvas-dlq`; en `sqs-registrar-canvas` se habilitó la cola de mensajes fallidos eligiendo la ARN de la DLQ con *Recepciones máximas = 2* (rango 1-1000); se creó el trigger Lambda `RegistrarCanvas`, que lanza `raise Exception("Error")`. Resultado: 2 intentos con error en CloudWatch (cada 30 s) y 1 mensaje en la DLQ.

**P12. Escriba el código mínimo de la Lambda que falla y explique por qué el mensaje no se pierde.**
```python
def lambda_handler(event, context):
    print(event)
    raise Exception("Error")
```
Al fallar la Lambda, el mensaje no se borra de la cola; vuelve a recibirse y, al superar las recepciones máximas, SQS lo mueve a la DLQ, donde queda disponible para análisis/reproceso.

**P13. Describa la arquitectura del Taller 4 (flujo completo).**
EventBridge (regla programada cada 1 min `SimuladorSensorIoT`) -> Lambda `GenerarEventoSensorIoT` (CO2 aleatorio 400-1000 PPM) -> publica en SNS `TemaSensorIoT` con MessageAttributes -> (a) suscripción de correo con filtro FAB1 + CO2 + medicion > 800; (b) cola SQS `ColaSensorIoTFAB1` con filtro tenant_id=FAB1 -> trigger Lambda `InsertarEventoSensorIoT` -> DynamoDB `t_sensor_iot_FAB1`.

**P14. Escriba la política de filtro SNS para "tenant FAB1, sensor CO2, medición mayor a 800".**
```json
{ "tenant_id": ["FAB1"], "sensor_id": ["CO2"], "medicion": [ { "numeric": [">", 800] } ] }
```

**P15. ¿Para qué sirve la política de acceso de la cola SQS en el Taller 4 y qué elementos clave tiene?**
Permite que SNS envíe mensajes a la cola: `Effect: Allow`, `Principal: {"Service": "sns.amazonaws.com"}`, `Action: sqs:SendMessage`, `Resource`: ARN de la cola, `Condition: ArnEquals aws:SourceArn` = ARN del tema SNS (solo ese tema puede escribir).

**P16. ¿Por qué `InsertarEventoSensorIoT` hace `json.loads` dos veces?**
`event['Records'][0]['body']` contiene el sobre JSON que SNS entrega a SQS; el evento real está como texto JSON en `body['Message']`, por lo que se requiere un segundo `json.loads`.

**P17. ¿Cómo se simula el sensor y cómo se dispara periódicamente?**
La Lambda genera `random.randint(400, 1000)` PPM; una regla EventBridge de tipo "Programar" con frecuencia periódica (valor 1, unidad minutos) y destino Lambda la invoca cada minuto.

**P18. ¿Qué claves tienen las tablas DynamoDB de los talleres y por qué?**
`t_pedidos_procesados`: partición `tenant_id` (S), ordenación `pedido_id` (N). `t_sensor_iot_FAB1`: partición `tenant_id` (S), ordenación `lectura_id` (S). El `tenant_id` identifica al cliente/fábrica (multi-tenant) y la ordenación identifica de forma única cada pedido/lectura dentro del tenant.

**P19. En el Ejercicio propuesto 2 del Taller 4, ¿qué cambios hacen falta y qué filtro lleva el nuevo correo?**
Agregar sensor TEMP (FAB1, 10-60 °C, CELSIUS) en la Lambda generadora, nueva suscripción de correo con filtro `tenant_id=FAB1`, `sensor_id=TEMP`, `medicion > 40`; verificar tabla y correo; evidencias en el padlet.

**P20. Mencione tres casos de uso típicos de las arquitecturas dirigidas por eventos (lens Serverless).**
Comunicación entre microservicios; integración con aplicaciones SaaS de terceros; replicación de datos entre cuentas y regiones; procesamiento paralelo de eventos/fanout (cualquier tres).

---

## 6. Cheat-sheet (para escribir de memoria)

### 6.1 Cliente SQS con boto3
```python
sqs = boto3.client('sqs')
# Enviar
sqs.send_message(QueueUrl=queue_url, MessageBody=json.dumps(obj))
# Recibir (long polling)
r = sqs.receive_message(QueueUrl=queue_url, MaxNumberOfMessages=3, WaitTimeSeconds=10)
for m in r.get('Messages', []):
    obj = json.loads(m['Body'])
    sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=m['ReceiptHandle'])
```
URL de cola: `https://sqs.us-east-1.amazonaws.com/<id_cuenta>/<nombre_cola>`.

### 6.2 Lambda disparada por SQS (trigger)
```python
def lambda_handler(event, context):
    body = json.loads(event['Records'][0]['body'])   # mensaje de SQS
    # Si el origen es SNS -> SQS: body es el sobre SNS
    dato = json.loads(body['Message'])
```
Si la función **lanza excepción**, el mensaje no se borra -> reintento -> tras *Recepciones máximas* va a la **DLQ**.

### 6.3 DLQ (consola SQS)
- Crear primero `<cola>-dlq`; en la cola origen: *Cola de mensajes fallidos* = **Habilitada**, *Elegir cola* = ARN de la DLQ (`arn:aws:sqs:us-east-1:<cuenta>:sqs-registrar-canvas-dlq`), **Recepciones máximas** = 2 (1-1000).
- Trigger: cola -> *Desencadenadores de Lambda* -> función.
- Verificar: CloudWatch (reintentos cada 30 s) y *Mensajes disponibles* = 1 en la DLQ.

### 6.4 Publicar en SNS con atributos
```python
sns = boto3.client('sns')
sns.publish(
    TopicArn='arn:aws:sns:us-east-1:<cuenta>:TemaSensorIoT',
    Subject='Nueva Lectura Sensor',
    Message=json.dumps(evento),
    MessageAttributes={
        'tenant_id': {'DataType': 'String', 'StringValue': 'FAB1'},
        'medicion':  {'DataType': 'Number', 'StringValue': str(medicion)}
    })
```

### 6.5 Políticas de filtro SNS
```json
{ "tenant_id": ["FAB1"] }
```
```json
{ "tenant_id": ["FAB1"], "sensor_id": ["CO2"], "medicion": [ { "numeric": [">", 800] } ] }
```
Regla: claves distintas = AND; varios valores de una lista = OR (deducido). Numéricos: `{"numeric": [">", N]}`.

### 6.6 Política de acceso SQS para SNS
```json
{ "Statement": [ {
    "Effect": "Allow",
    "Principal": { "Service": "sns.amazonaws.com" },
    "Action": "sqs:SendMessage",
    "Resource": "arn:aws:sqs:us-east-1:<cuenta>:ColaSensorIoTFAB1",
    "Condition": { "ArnEquals": { "aws:SourceArn": "arn:aws:sns:us-east-1:<cuenta>:TemaSensorIoT" } }
} ] }
```

### 6.7 DynamoDB desde Lambda
```python
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('t_pedidos_procesados')
table.put_item(Item=dict_con_tenant_id_y_pedido_id)
```
Tablas: `t_pedidos_procesados` (PK `tenant_id` S, SK `pedido_id` N), `t_sensor_iot_FAB1` (PK `tenant_id` S, SK `lectura_id` S).

### 6.8 EventBridge programado
Regla `SimuladorSensorIoT`: bus `default`, tipo **Programar**, frecuencia periódica 1 minuto, destino **Servicio de AWS -> Función Lambda -> GenerarEventoSensorIoT**.

### 6.9 API Gateway (Taller 3)
`pedidos` -> `/pedidos/registrar` **POST** -> Lambda RegistrarPedido; `/pedidos/procesar` **GET** (luego POST en el propuesto) -> Lambda ProcesarPedido. Habilitar CORS (Default 4XX y 5XX + método). Etapa `prod`. Prueba Postman: POST/raw/JSON.

### 6.10 Datos para recordar
- Los 6 pilares; 3 partes de una arquitectura de eventos; SQS (cola) vs SNS (fan-out) vs EventBridge (filtrado/ruteo).
- Lambdas con timeout 20 s (Taller 3). Región us-east-1.
- CO2: 400-1000 PPM, alerta > 800. Propuesto: TEMP 10-60 °C, alerta > 40 CELSIUS.
- Espera de verificación en Taller 4: unos 6 minutos.

---

## 7. Complemento: Well-Architected (lecturas)

Contexto: los 4 PDF son **lentes (lenses)** oficiales de AWS Well-Architected; todos se basan en los **6 pilares** (excelencia operativa, seguridad, fiabilidad, eficiencia de rendimiento, optimización de costos, sostenibilidad), cuyas definiciones en el Framework (según el ML Lens) son: **Operational excellence**: ejecutar, monitorear y obtener información de las cargas; focos: organization, prepare, operate, evolve. **Security**: proteger información, sistemas y activos; focos: fundamentos de seguridad, IAM, detección, protección de infraestructura, protección de datos, respuesta a incidentes, seguridad de aplicaciones. **Reliability**: recuperarse de interrupciones y adquirir recursos dinámicamente; focos: foundations, workload architecture, change management, failure management. **Performance efficiency**: uso eficiente de recursos; focos: selection, review, monitoring, trade-offs. **Cost optimization**: refinamiento continuo, sistemas conscientes del costo; focos: Cloud Financial Management, expenditure and usage awareness, resource cost-effectiveness, demand/supply, optimization. **Sustainability**: impactos ambientales, energía; focos: región, alineación a la demanda, software y arquitectura, datos, hardware y servicios, procesos y cultura.

### 7.1 Serverless Applications Lens (104 pág.; el más relacionado con la clase)
- **Qué es**: describe el lens para aplicaciones serverless: escenarios comunes y elementos clave para arquitecturas según buenas prácticas. Dirigido a CTOs, arquitectos, desarrolladores y operaciones.
- **8 áreas** a considerar (definiciones): **Compute layer** (Lambda — stateless; API Gateway — REST API con tráfico, autorización, monitoreo y versionado; Step Functions — orquestación de workflows), **Data layer** (DynamoDB + Streams + DAX; S3; OpenSearch; AppSync), **Messaging and streaming layer** (SNS pub/sub; Kinesis; Data Firehose), **User management and identity layer** (Cognito user pools y federated identities), **Edge layer** (CloudFront), **Systems monitoring and deployment** (CloudWatch, X-Ray, AWS SAM), **Deployment approaches**, **Lambda version control**.
- **Enfoques de despliegue**: *All-at-once* (rápido, riesgo en rollback; para entornos no críticos), *Blue/Green* (casi sin downtime; tráfico al entorno green mientras blue sigue caliente; API Gateway permite % de tráfico), *Canary/Linear* (1-10 % inicial, luego aumentos; Lambda aliases + CodeDeploy; hooks pre/post-tráfico y alarmas de CloudWatch para rollback automático).
- **Lambda versioning**: versiones inmutables, ARN único por versión, auditables en CloudTrail; los **alias** (dev, beta, prod) permiten promover versiones sin cambiar la configuración del llamador.
- **Principios de diseño (7)**: *Speedy, simple, singular* (funciones breves de un solo propósito); *Think concurrent requests, not total requests*; *Share nothing* (sin estado local, usar almacenamiento persistente); *Assume no hardware affinity*; *Orchestrate your application with state machines, not functions*; *Use events to trigger transactions*; *Design for failures and duplicates* (operaciones idempotentes y reintentos).
- **6 escenarios**: RESTful microservices, Alexa skills, Mobile backend, Streaming processing, Web application, **Event-driven architectures** (3 partes: sources, routers, destinations; SQS/SNS/EventBridge; EventBridge permite esquemas OpenAPI 3 y JSONSchema Draft4; integración con X-Ray para trazado; nota: EventBridge puede añadir latencia -> si es crítica usar SNS y SQS para filtrado y ruteo).
- **Preguntas por pilar** (solo las específicas de serverless): OPS 1 (¿cómo entiende la salud de su aplicación serverless? métricas y alertas, logging centralizado y estructurado, trazado distribuido), OPS 2 (gestión del ciclo de vida: prototipado con IaC, configuración, pruebas, despliegue); SEC 1 (controlar acceso a la API: 5 mecanismos en API Gateway = **AWS_IAM, Cognito user pools, Lambda authorizer, resource policies, mutual TLS**), SEC 2 (límites de seguridad: mínimo privilegio, no compartir rol IAM entre funciones), SEC 3 (seguridad de aplicación: validar/sanitizar eventos, validación de request en API Gateway, OWASP); REL 1 (regular tasas de entrada: throttling, 429), REL 2 (resiliencia: fallos parciales/transitorios, duplicados -> idempotencia, transacciones largas -> state machines, **DLQ** para retener/investigar/reintentar; Kinesis/DynamoDB Streams reintentan el lote completo; opciones de Lambda: max retry attempts, max record age, destination on failure, bisect batch); PERF (caching en API Gateway, content encoding, timeout de Lambda unos segundos sobre el promedio); COST 1 (pago por valor; Lambda asigna CPU/red/IOPS proporcional a la memoria; no cuesta en reposo); Sostenibilidad: no hay prácticas únicas de este lens.
- **Conclusión del lens**: probar rutas de fallo (fiabilidad), diseñar desde las expectativas del cliente (rendimiento), ajustar recursos (costos), automatizar respuesta a eventos (operaciones), proteger activos en cada capa (seguridad).
- *Conexión con la clase*: la diapositiva de Event-driven y la de RESTful/Web application provienen de aquí; el DLQ del Taller 3 corresponde a REL 2.

### 7.2 Container Build Lens (63 pág.)
- **Alcance**: se centra en el **diseño y construcción de contenedores e imágenes**; fuera de alcance: orquestación y prácticas generales de desarrollo.
- **Definiciones clave**: *Container* (instancia ejecutable de una imagen; comparte el kernel del host; capa R/W efímera), *Container image* (plantilla de solo lectura, inmutable, creada por capas desde un **Dockerfile**), *Container runtime*, *Base image* (FROM scratch), *Parent image* (referenciada en FROM), *Gold image* (imagen estándar de la organización), *Image layers*, *Image scanning*, *Container registry* (OCI), *CI/CD*, *Multi-stage build*, *Microservice*.
- **Principios de diseño**: minimizar el tamaño de imagen (menos superficie de ataque, arranque más rápido); **build en múltiples etapas**; estandarizar en la empresa (imagen padre/gold); **validar y restringir versiones** (tags inmutables, no usar `latest`); **estrategia de escaneo de imágenes** (estático y dinámico, en CI/CD al hacer push); contenedores **stateless** (el estado y la fuente de verdad van fuera del contenedor).
- **Preguntas** (ID): OPS_01 ciclo de vida de contenedores/imágenes; OPS_02 cumplimiento de objetivos de negocio (health checks, logs externos); SEC_01 mínimo privilegio (por defecto hay aislamiento de procesos); SEC_02 acceso a infraestructura de build; SEC_03 vulnerabilidades en imágenes (escanear); SEC_04 límites de la imagen (minimizar superficie de ataque); SEC_05 datos (no codificar secretos en la imagen); REL_01 límites de CPU y RAM; REL_02 datos persistentes (volúmenes); REL_03 automatizar build y test (pruebas locales); REL_05 salud del contenedor (health checks); PERF_01 reducir tamaño (imágenes padre pequeñas); PERF_02 tiempo de pull (registro cercano al clúster); PERF_06 caché de capas; COST_01/04 evitar costos innecesarios y reducir tamaño de imágenes; SUSTAINABILITY_01-03 (manifiestos actualizados, servidores de build dinámicos).
- **Escenarios**: asegurar pipelines de build de contenedores (flujo: push de código -> análisis estático -> build del artefacto -> repositorio de artefactos -> build de imagen y push con **tag immutability** -> escaneo de la imagen (p. ej. Amazon ECR) -> escaneo de manifiestos de despliegue -> pruebas de aceptación -> despliegue); mejorar CI/CD en rendimiento y costo; mejorar rendimiento del build de imágenes.

### 7.3 Data Analytics Lens (142 pág., dic-2023)
- **Qué es**: colección de mejores prácticas probadas para cargas de trabajo de analítica; incluye lista de contexto (nombre, KPIs, dueños, etc.).
- **15 principios de diseño por pilar**:

| Pilar | Principios |
|---|---|
| Excelencia operativa | 1 Monitorear la salud de la carga de analítica; 2 Modernizar el despliegue de jobs y aplicaciones |
| Seguridad | 3 Diseñar plataformas de datos para gobernanza y cumplimiento; 4 Implementar control de acceso a datos; 5 Controlar el acceso a la infraestructura |
| Fiabilidad | 6 Diseñar resiliencia; 7 Gobernar cambios de datos y metadatos |
| Eficiencia de rendimiento | 8 Mejor cómputo; 9 Mejor almacenamiento; 10 Mejor formato de archivo y particionamiento |
| Optimización de costos | 11 Cómputo/almacenamiento rentables según uso; 12 Modelos de responsabilidad financiera; 13 Gestionar el costo en el tiempo; 14 Modelos de precio óptimos |
| Sostenibilidad | 15 Guía de implementación de sostenibilidad |

- Ejemplos de buenas prácticas: BP 1.1 validar la calidad de datos de origen (completitud, exactitud, unicidad); BP 1.2 monitorear métricas operativas de jobs y disponibilidad de datos; BP 3.1 privacy by design; BP 3.6 políticas de cifrado; BP 4.3 modelos de autorización de datos; BP 6.1 ilustrar dependencias del flujo de datos; BP 6.3 notificar fallos de jobs ETL; BP 7.1 Data Catalog central; BP 7.3 trazar linaje de datos.
- **7 escenarios**: data discovery (5 pasos; empieza por definir el valor de negocio), modern data architecture, batch data processing, **streaming ingest and stream processing** (5 constructos: fuentes de datos, ingesta, almacenamiento de stream, procesamiento, destinos; servicios: Kinesis Data Streams, MSK, Firehose, Glue Streaming, Flink), operational analytics, data visualization, **data mesh** (propiedad descentralizada por dominios, "data products", gobernanza federada; más complejidad pero mejor búsqueda, acceso, seguridad y escalabilidad).
- *Conexión*: la parte de streaming/IoT (sensores, Kinesis, Firehose) se relaciona con el Taller 4 (sensor IoT -> SNS/SQS -> DynamoDB), aunque el taller no usa Kinesis.

### 7.4 Machine Learning Lens (195 pág., jul-2023)
- **Qué es**: guía para diseñar y operar cargas de ML; las cargas ML aprenden de datos en un ciclo iterativo y continuo (monitoreo y reentrenamiento por cambio de datos).
- **Ciclo de vida ML (6 fases)**: identificación del objetivo de negocio, encuadre del problema ML, procesamiento de datos (recolección, preprocesamiento, ingeniería de características), desarrollo del modelo (entrenamiento, ajuste, evaluación), despliegue (inferencia) y monitoreo.
- **10 principios de diseño**: asignar propiedad; proveer protección; habilitar resiliencia; habilitar reutilización; habilitar reproducibilidad (versionar infraestructura, datos, modelos, código); optimizar recursos; reducir costo; habilitar automatización (CI/CD/**CT** — entrenamiento continuo); habilitar mejora continua; minimizar impacto ambiental.
- **Buenas prácticas por pilar (prefijos)**: MLOE-01..16 (p. ej. MLOE-02 acordar nivel de explicabilidad con SageMaker Clarify, MLOE-07 sistema de linaje, MLOE-12 MLOps y CI/CD, MLOE-15 observabilidad del modelo), MLSEC-01..13 (MLSEC-03 mínimo privilegio, MLSEC-10 data poisoning), MLREL-01..13 (MLREL-01 APIs para abstraer cambios, MLREL-07 consistencia de features entrenamiento/inferencia, MLREL-12 autoescalado del endpoint), MLCOST-01..29 (MLCOST-02 servicios administrados para reducir TCO, MLCOST-03 verificar si ML es la solución correcta), MLSUS-01..16 (MLSUS-03 regiones sostenibles, MLSUS-16 reentrenar solo cuando sea necesario). Performance: prefijo MLPER (p. ej. MLPER-01 determinar KPIs, MLPER-02 usar servicios ML/IA de propósito específico, MLPER-03 definir métricas de evaluación).
- *Fase "Business goal"*: definir el problema y el valor de negocio medible; evaluar si ML es el enfoque correcto.

> Nota sobre profundidad: estos 4 PDF son de baja prioridad; se extrajo definiciones, principios, listas de preguntas/BP y escenarios, sin resumir su contenido completo. En el examen lo más probable (por la clase) es: definición de Well-Architected, 6 pilares, lenses y los escenarios serverless.
