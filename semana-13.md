# Semana 13 — Arquitectura basada en eventos (Event-driven architecture): SNS, S3, Lambda y DynamoDB

> Curso CS2032 Cloud Computing (Ciclo 2026-2). Docente: Geraldo Colchado. Material: 1 PDF de teoría, 2 PDF de Taller (SNS), 2 ejercicios propuestos (.md), materiales (zips idénticos a mats1/mats2), tareas hw1 y hw2.

## 0. Mapa de materiales revisados

| Archivo | Tipo | Resumen de 1 línea |
|---|---|---|
| `teoria/semana-13/Arquitectura basada en eventos - Teoría - V1.01.pdf` (25 diapositivas) | Teoría | Qué es EDA (productor, enrutador, consumidor), cuándo usarla, EventBridge vs SNS, patrones sync/acoplado vs async/desacoplado, pub/sub y fan-out (SNS+SQS). |
| `laboratorio/semana-13/1. Arquitectura orientada a eventos - Taller 1 - V1.00.pdf` (23 diap.) | Taller (prioridad) | SNS: teoría breve (A2A/A2P) + Ejercicio 1 "Nuevo Alumno en UTEC" (Lambda CrearAlumno -> SNS -> correo + Lambda -> DynamoDB, filtro tenant_id) + propuesto (subscriber de seguridad). |
| `laboratorio/semana-13/1. Arquitectura orientada a eventos - Taller 2 - V1.01.pdf` (16 diap.; duplicado idéntico en `mats2/`) | Taller (prioridad) | Ejercicio 1 "Nuevo Archivo en UTEC" (S3 -> Lambda LeerMetadataArchivo -> SNS -> correo + Lambda -> DynamoDB) + propuesto (curso y alumno desde el nombre del archivo). |
| `S13 Taller 1 - Ejercicio Propuesto.md` | Enunciado Canvas | Entrega 2026-11-21T04:59:59Z, 20 puntos, "(sin descripción)"; el contenido real es el propuesto del PDF Taller 1. |
| `S13 Taller 2 - Ejercicio Propuesto.md` | Enunciado Canvas | Igual (20 puntos); el contenido real es el propuesto del PDF Taller 2. |
| `Materiales S13 - Taller 1.zip` (= `mats1/...zip`, md5 igual) | ZIP | Contiene los mismos archivos que `mats1/` (Entrada_UTEC_json_alumno.txt, Filtro.txt, 2 Lambdas, event01.drawio). |
| `Materiales S13 - Taller 2.zip` (= `mats2/...zip` salvo empaquetado) | ZIP | Mismos archivos que `mats2/` (archivo01/02.txt, Filtro.txt, Lambdas CrearArchivo_UTEC y LeerMetadata V1/V2/V3, event02.drawio, PDF Taller 2). |
| `mats1/Entrada_UTEC_json_alumno.txt` | JSON de prueba | Alumno Carla Espinoza, tenant UTEC, id 2020777990. |
| `mats1/Filtro.txt`, `mats2/Filtro.txt` | JSON | Política de filtro `{"tenant_id": ["UTEC"]}` (idénticos). |
| `mats1/Lambda_CrearAlumno_y_SNS - Python.txt` | Código | Lambda CrearAlumno: guarda en `t_alumnos` y publica en SNS `NuevoAlumno`. |
| `mats1/Lambda_CrearAlumno_Canvas - Python.txt` | Código | Lambda suscriptora: lee mensaje SNS y escribe en `t_alumnos_canvas`. |
| `mats1/event01.drawio` | Diagrama XML | Página "Taller 1 SNS" y "Taller 1 SNS - Propuesto" (añade CrearAlumno_Seguridad -> t_alumnos_seguridad). |
| `mats2/Lambda_LeerMetadataArchivo V1/V2/V3` | Código | V1 plantilla Hello + print(event); V2 extrae metadata; V3 publica en SNS. |
| `mats2/Lambda_CrearArchivo_UTEC - Python.txt` | Código | Lambda suscriptora: SNS -> `t_archivos_UTEC`. |
| `mats2/archivo01.txt`, `archivo02.txt` | Archivos de prueba | Contenido "Prueba 1" / "Prueba 2" para subir a S3. |
| `mats2/event02.drawio` | Diagrama XML | Páginas "Taller" y "Propuesto": Bucket S3 -> LeerMetadataArchivo -> SNS -> (filtro UTEC) correo a docente y CrearArchivo_UTEC -> t_archivos_UTEC. |
| `hw1/1_CrearAlumno_Seguridad_lambda.py` | Solución tarea | Lambda CrearAlumno_Seguridad -> `t_alumnos_seguridad` (con nombre y celular). |
| `hw1/2_filtro_sns.json` | Solución tarea | Filtro tenant_id UTEC. |
| `hw1/3_test_UTEC.json`, `hw1/4_test_UNIV2.json` | JSON de prueba | Casos UTEC (202199992, "Tu Nombre") y UNIV2 (2021G64747, Juan Carrasco). |
| `hw2/1_LeerMetadataArchivo_lambda.py` | Solución tarea | LeerMetadata con `unquote_plus`, curso_id y alumno_id del nombre del archivo, publica en SNS. |
| `hw2/2_CrearArchivo_UTEC_lambda.py` | Solución tarea | Escribe `archivo_datos` (incluye curso_id y alumno_id) en `t_archivos_UTEC`. |
| `hw2/3_filtro_sns.json` | Solución tarea | Filtro tenant_id UTEC. |
| `hw2/4_archivos_para_subir.txt` y `hw2/archivos/*.txt` | Guía de prueba | Archivos CS2032_202199992_tarea1.txt, CS3061_202199993_informe.txt (UTEC) y CS2032_2021G64747_tarea1.txt (UNIV2). |

Nota: `__MACOSX` ignorado; los archivos de mats1/mats2 son duplicados de los zips (md5 idéntico).

---

## 1. Teoría

### 1.1 Objetivos de la sesión
- Comprender qué es una arquitectura basada en eventos.
- Identificar cuándo conviene usarla.
- Aprender el patrón de diseño **pub/sub - fan out**.
- Conocer qué servicios de AWS se pueden usar para EDA.

### 1.2 Definición
> "Sistemas desacoplados que se ejecutan en respuesta a eventos."

- La EDA **usa eventos para desencadenar y establecer comunicación entre servicios desacoplados**; es común en aplicaciones modernas creadas con **microservicios** (fuente de la diapositiva: aws.amazon.com/es/event-driven-architecture).
- **Evento** = un **cambio de estado** o una actualización (ej.: un elemento colocado en el carro de compras de un e-commerce).
- Un evento puede:
  - **Llevar el estado** (event carrying state): el elemento comprado, su precio y la dirección de entrega.
  - Ser un **identificador / notificación**: "se envió una orden".

### 1.3 Los tres componentes clave
| Componente | Rol |
|---|---|
| **Productor de eventos** (event producer) | Publica el evento hacia el enrutador. |
| **Enrutador de eventos** (event router / bus / broker) | Ingiere, **filtra** y envía (push) los eventos a los consumidores apropiados. |
| **Consumidor de eventos** (event consumer) | Recibe y procesa el evento. |

- Productor y consumidor están **desacoplados**: pueden **escalarse, actualizarse e implementarse de manera independiente**.
- "El productor no necesita saber quién consume el evento; los consumidores tampoco necesitan conocer al productor."

```
 PRODUCTOR ──publica──▶ ENRUTADOR / BUS (filtra, enruta) ──▶ CONSUMIDOR A
                                                        ├──▶ CONSUMIDOR B
                                                        └──▶ CONSUMIDOR C
```

### 1.4 Ejemplos de las diapositivas
**E-commerce (diagrama AWS)**: productores = sitio web retail (evento "New order"), app móvil ("Question about stock"), punto de venta ("Return"); un **Event Router** ingiere/filtra/empuja a consumidores: **Warehouse Mgmt DB** (actualiza inventario y disponibilidad), **Finance System** (actualiza según venta y devolución), **Customer Relations** (responde a pedido y consulta). Beneficio señalado: el sitio reacciona a cambios de varias fuentes en picos de demanda **sin bloquear la aplicación ni sobreaprovisionar recursos**.

**Tienda online (diagrama "¿Qué es una arquitectura basada en eventos?")**: Servicio de Pedidos (productor) publica `PedidoCreado { pedidoId: 1234, clienteId: 567, total: 89.90 }` en el bus; el bus lo entrega a todos los interesados: Servicio de Inventario (descuenta stock), Servicio de Notificaciones (envía email al cliente), Servicio de Analítica (registra la venta para reportes). Cada servicio procesa de forma independiente.

**Beneficios (diapositiva)**:
- **Desacoplamiento** entre componentes.
- **Escalabilidad**: cada servicio escala de forma independiente.
- **Resiliencia**: si un servicio está caído, los eventos no se pierden.
- **Fácil de extender**: nuevos servicios pueden suscribirse sin cambiar el productor.

### 1.5 ¿Cuándo utilizarla? (casos de uso de la diapositiva)
1. Supervisión del estado de los recursos y alertas.
2. Procesamiento en paralelo y distribución ramificada (fan-out).
3. Integración de sistemas heterogéneos.
4. Replicación de datos entre cuentas y regiones.

### 1.6 ¿Cómo implementarla en AWS? Dos tipos de enrutadores
La diapositiva "¿Por dónde comenzar?" (aparece resaltado "launched in July 2019" junto a EventBridge): los dos tipos principales de enrutadores son **buses de eventos** y **temas de eventos**.

| | **Amazon EventBridge** | **Amazon SNS** |
|---|---|---|
| Crea | **Buses de eventos** | **Temas de eventos** (topics) |
| Cuándo | Cuando se desea crear una aplicación que **reacciona a eventos de aplicaciones SaaS, servicios de AWS o aplicaciones personalizadas** | Cuando se quiere una aplicación que reacciona a **eventos de alto rendimiento y baja latencia** publicados por otras aplicaciones, microservicios o servicios de AWS, o aplicaciones que necesitan **gran difusión (miles o millones de puntos de conexión)** |
| Esquema | Usa un **esquema predefinido** para los eventos; permite crear **reglas** que se aplican a **todo el cuerpo del evento** para filtrarlo antes de enviarlo a consumidores | Los temas son **independientes del esquema** de eventos que se publiquen |

### 1.7 Patrones de diseño
**Monolito vs microservicios** (diapositiva Deep Dive EventBridge): Monolith "does everything"; Microservices "does one thing".

**Dos patrones de comunicación entre aplicaciones** (diapositiva Solutions Architect Slides):
1. **Síncrona** (aplicación a aplicación): Buying Service <-> Shipping Service directamente.
2. **Asíncrona / basada en eventos** (aplicación a cola a aplicación): Buying Service -> Queue -> Shipping Service.

**Síncrono y acoplado**:
- Ejemplo v1: Cliente `POST /order` -> Order service `POST /invoice` -> Invoice service; respuestas `201` en cadena de vuelta al cliente.
- Ejemplo "Architecture v2": Order service llama directamente a Invoice, Fulfillment y Forecasting service. Sigue siendo **Synchronous + Coupled**: cada nuevo consumidor obliga a modificar el productor.

**Asíncrono y desacoplado — Fan Out (abanico)**:
- Order service publica en un **enrutador de eventos** (Amazon EventBridge) con **reglas de enrutamiento/filtrado**, que distribuye a varios servicios (Invoice, Fulfillment, Forecasting...). Solo los consumidores cuya regla coincide reciben el evento (en la diapositiva sólo Forecasting aparece resaltado como destino).
- Características: **Asynchronous, Decoupled**.

**Pub/Sub - Fan Out con SNS** ("What if you want to send one message to many receivers?"):
```
Integración directa:                  Pub/Sub:
Buying ─▶ Email notification          Buying ─▶ [SNS Topic] ─▶ Email notification
       ├▶ Fraud Service                                    ├▶ Fraud Service
       ├▶ Shipping Service                                 ├▶ Shipping Service
       └▶ SQS Queue                                        └▶ SQS Queue
```
- En la integración directa el productor conoce y llama a cada receptor; con pub/sub el productor publica **una vez** en el **tema SNS** y SNS reparte a todos los suscriptores.

**SNS + SQS: Fan Out**: Buying Service -> SNS Topic -> varias **SQS Queue** (una por consumidor) -> Fraud Service y Shipping Service. Cada cola conserva los mensajes de su consumidor.

**Origen y destino de SNS (diapositiva)**:
- Publicadores/fuentes de eventos que publican en SNS: CloudWatch Alarms, AWS Budgets, Lambda, Auto Scaling Group (notificaciones), S3 Bucket (eventos), DynamoDB, CloudFormation (cambios de estado), AWS DMS (nueva réplica), RDS Events, etc.
- **Suscriptores**: SQS, Lambda, Kinesis Data Firehose, correos electrónicos, SMS y notificaciones móviles, puntos de enlace HTTP(S).

### 1.8 Preguntas de cierre de la clase (auto-evaluación)
Explicar con propias palabras: (1) qué es EDA; (2) cuándo conviene; (3) patrón pub/sub - fan out; (4) qué servicios AWS sirven para EDA (EventBridge y SNS como enrutadores; Lambda, SQS, etc. como consumidores/destinos). Las respuestas están en la sección 5.

### 1.9 Amazon SNS (diapositivas del Taller 1)
- **Definición**: servicio de mensajería **completamente administrado** para comunicación **aplicación a aplicación (A2A)** y **aplicación a persona (A2P)**; mensajería de publicación/suscripción; notificaciones push móviles, correo electrónico, SMS.
- **A2A**: temas para mensajería de alto rendimiento, de muchos a muchos, basada en push entre sistemas distribuidos, microservicios y aplicaciones sin servidor controladas por eventos. Distribuye mensajes a muchos suscriptores: colas **Amazon SQS**, funciones **AWS Lambda**, puntos de enlace **HTTP/S** y **Amazon Kinesis Data Firehose**.
- **A2P**: envía notificaciones push a apps móviles, mensajes de texto (SMS) y correos electrónicos; distribuye por tema o publica directamente a endpoints móviles.
- **Diagrama Pub/Sub de SNS**: Publisher (sistemas distribuidos, microservicios, otros servicios AWS) -> Amazon SNS -> **SNS Topic** (desacopla publicadores de suscriptores) -> **Message Filtering & Fanout** (filtra según políticas de filtro de suscripción y entrega) -> Subscribers (Lambda, SQS, Kinesis Data Firehose, HTTP/S, Email). Además **Dead-letter Queue**: si un endpoint no está disponible, los mensajes pueden retenerse para análisis o reprocesamiento.
- **SMS**: publicar mensajes de texto a millones de usuarios vía tema o directamente a dispositivos.
- **Push móvil**: 1) crear una *platform application* (representa un servicio de notificación push de un proveedor como Apple, Google, Amazon o Microsoft); 2) agregar *endpoints* (dispositivo móvil, iPhone/Android); 3) publicar mensajes (por tema o directo).
- **Tipos de tema (consola al crearlo)** — el tipo no se puede modificar una vez creado:

| | **FIFO** | **Estándar** |
|---|---|---|
| Orden | Clasificación de mensajes **estrictamente conservada** | Clasificación de **mejor esfuerzo** |
| Entrega | **Entrega única** de mensajes (sin duplicados) | **Al menos una vez** |
| Rendimiento | Alto, hasta 300 publicaciones por segundo | Mayor rendimiento en publicaciones por segundo |
| Protocolos de suscripción | **SQS** | SQS, Lambda, HTTP, SMS, correo electrónico, puntos de enlace de aplicaciones móviles |

El nombre del tema: máximo 256 caracteres; alfanuméricos, guiones (-) y guiones bajos (_). En el taller se usa **Estándar**.

### 1.10 Conceptos clave que se usan en el laboratorio (según el material)
- **Atributos de mensaje (MessageAttributes)**: el publicador adjunta `tenant_id` como atributo `String`; la **política de filtro de suscripción** (JSON) de cada suscripción decide si el mensaje se entrega a ese suscriptor. Con filtro `tenant_id = UTEC` un mensaje con `UNIV2` **no** se entrega.
- **Multi-tenant**: `tenant_id` identifica a la universidad (UTEC, UNIV1, UNIV2...). Es la clave de partición en DynamoDB.
- El **Lambda publicador** no sabe cuántos ni cuáles son los suscriptores: se puede añadir uno nuevo (Seguridad) sin modificarlo.

---

## 2. Laboratorio

### 2.1 Taller 1 — Evento "Nuevo Alumno en UTEC" (SNS)

**Objetivo**: diseño e implementación de una arquitectura de solución basada en eventos con SNS.

**Arquitectura (diagrama "Evento Nuevo Alumno")**:
```
Lambda CrearAlumno ──JSON datos nuevo alumno──▶ Amazon SNS (tema NuevoAlumno)
      │                                              ├─[filtro tenant_id="UTEC"]──▶ e-mail a empresa de Merchandising
      ▼                                              └─[filtro tenant_id="UTEC"]──▶ Lambda CrearAlumno_Canvas ──▶ DynamoDB t_alumnos_canvas
 DynamoDB t_alumnos (según Lambda_CrearAlumno_y_SNS)
```
Propuesto (hw1): se añade un tercer suscriptor con filtro tenant_id="UTEC": Lambda **CrearAlumno_Seguridad** -> tabla **t_alumnos_seguridad**.

**Pasos**
1. **Crear tema** `NuevoAlumno` en SNS (botón "Crear un tema"), tipo **Estándar**, nombre `NuevoAlumno`.
2. **Modificar la Lambda `CrearAlumno`** para publicar en el tema (agregar `import boto3`, bloque "Publicar en SNS"). Código completo de `mats1/Lambda_CrearAlumno_y_SNS - Python.txt`:
```python
import json
import boto3

def lambda_handler(event, context):
    # Entrada (json)
    tenant_id = event['tenant_id']
    alumno_id = event['alumno_id']
    alumno_datos = event['alumno_datos']
    # Proceso: grabar en DynamoDB
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_alumnos')
    alumno = {
        'tenant_id': tenant_id,
        'alumno_id': alumno_id,
        'alumno_datos': alumno_datos
    }
    response = table.put_item(Item=alumno)
    # Publicar en SNS
    sns_client = boto3.client('sns')
    response_sns = sns_client.publish(
        TopicArn = 'arn:aws:sns:us-east-1:447891120606:NuevoAlumno',  # ARN del tema (cuenta del docente)
        Subject = 'Nuevo Alumno',
        Message = json.dumps(alumno),            # el mensaje SNS es un STRING JSON
        MessageAttributes = {
            'tenant_id': {'DataType': 'String', 'StringValue': tenant_id}   # atributo sobre el que filtra la suscripción
        }
    )
    print(response_sns)
    # Salida (json)
    return {
        'statusCode': 200,
        'response': response
    }
```
   (La diapositiva sólo muestra el bloque SNS y la salida con `...`; el resto proviene del archivo de materiales. El ARN tiene forma `arn:aws:sns:<región>:<cuenta>:<tema>`; cada estudiante debe poner el suyo.)
3. **Suscripción de correo** al tema `NuevoAlumno`: ARN del tema; **Protocolo: Correo electrónico**; Punto de enlace: el correo (de preferencia @gmail). Activar **Política de filtro de suscripciones = Habilitado** y en el editor JSON:
```json
{
  "tenant_id": [
    "UTEC"
  ]
}
```
   Crear la suscripción ("Una vez creada la suscripción, debe confirmarla"): **ingresar al correo y confirmar el enlace**.
4. **Crear tabla DynamoDB** `t_alumnos_canvas`: **clave de partición `tenant_id`** (String), **clave de ordenación `alumno_id`** (String).
5. **Crear Lambda `CrearAlumno_Canvas`** que reciba el JSON y lo grabe en `t_alumnos_canvas`:
```python
import json
import boto3

def lambda_handler(event, context):
    # Entrada (json): un evento SNS llega como event['Records'][0]['Sns']['Message'] (string)
    print(event)  # Revisar en CloudWatch
    alumno_json = json.loads(event['Records'][0]['Sns']['Message'])
    # Proceso
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_alumnos_canvas')
    alumno = {
        'tenant_id': alumno_json['tenant_id'],
        'alumno_id': alumno_json['alumno_id'],
        'alumno_nombre': alumno_json['alumno_datos']['nombre']
    }
    print(alumno)  # Revisar en CloudWatch
    response = table.put_item(Item=alumno)
    # Salida (json)
    return {'statusCode': 200, 'response': response}
```
6. **Suscripción Lambda**: al tema `NuevoAlumno`; Protocolo **AWS Lambda**; Punto de enlace = ARN de la función (`arn:aws:lambda:us-east-1:447891120606:function:CrearAlumno_Canvas`); filtro habilitado con el mismo JSON `tenant_id = ["UTEC"]`.
7. **Prueba positiva** (ejecutar Lambda `CrearAlumno` con este evento de prueba): debe llegar correo y grabarse registro. Resultado esperado en `t_alumnos_canvas`: `tenant_id=UTEC`, `alumno_id=202199991`, `alumno_nombre=Juan Colchado`.
```json
{
  "tenant_id": "UTEC",
  "alumno_id": "202199991",
  "alumno_datos": {
    "nombre": "Juan Colchado",
    "sexo": "M",
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
8. **Prueba negativa**: mismo JSON con `"tenant_id": "UNIV2"`, `alumno_id "2021G64747"`, nombre "Juan Carrasco": **no** debe llegar correo y **no** se graba registro en `t_alumnos_canvas` (la tabla sigue con solo el registro UTEC). Nota: sí se graba en `t_alumnos` porque esa escritura la hace CrearAlumno directamente (no depende del filtro).

**Estructura del evento SNS recibido por la Lambda** (lo que accede el código): `event['Records'][0]['Sns']['Message']` es un string JSON -> `json.loads(...)`. (El PDF imprime `print(event)` para revisarlo en CloudWatch; la forma de acceso es la del código.)

**Propuesto / hw1 (adicionar subscriber de seguridad)** — solución en `hw1/`:
- Tabla `t_alumnos_seguridad` (el código la usa con `tenant_id` e `alumno_id`; se asume mismas claves que el Canvas — el material no muestra su creación).
- Lambda `CrearAlumno_Seguridad` (guarda además el celular):
```python
import json
import boto3

def lambda_handler(event, context):
    print(event)  # Revisar en CloudWatch
    alumno_json = json.loads(event['Records'][0]['Sns']['Message'])
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_alumnos_seguridad')
    alumno = {
        'tenant_id': alumno_json['tenant_id'],
        'alumno_id': alumno_json['alumno_id'],
        'alumno_nombre': alumno_json['alumno_datos']['nombre'],
        'alumno_celular': alumno_json['alumno_datos']['celular']
    }
    print(alumno)
    response = table.put_item(Item=alumno)
    return {'statusCode': 200, 'response': response}
```
- Suscripción Lambda al tema `NuevoAlumno` con filtro `{"tenant_id": ["UTEC"]}`.
- Pruebas: `3_test_UTEC.json` (UTEC, 202199992, "Tu Nombre", celular 999736332) -> graba; `4_test_UNIV2.json` (UNIV2, 2021G64747) -> no graba.
- Entrega: evidencia al **padlet** indicado por el docente.

**Errores comunes / puntos de atención (deducidos del material)**
- No confirmar el enlace del correo -> la suscripción queda pendiente y no llegan correos.
- Olvidar el atributo `tenant_id` en `MessageAttributes` -> el filtro no puede evaluarse (con política de filtro por atributos el mensaje no coincide). (Inferencia estándar de SNS; el material sólo muestra que el atributo se envía.)
- Leer `event['tenant_id']` en la Lambda suscriptora: el evento viene envuelto en `Records[0].Sns.Message` y hay que hacer `json.loads`.
- Clave de la tabla con tipo distinto a String o con nombres distintos a los del código.
- Poner un `TopicArn` ajeno (la cuenta 447891120606 es la del docente).
- La Lambda necesita permisos para publicar en SNS y escribir en DynamoDB (el material no muestra la configuración de roles; no afirmar más).

### 2.2 Taller 2 — Evento "Nuevo Archivo en UTEC" (S3 + SNS)

**Objetivo**: igual que Taller 1 (arquitectura basada en eventos con SNS), ahora con S3 como productor.

**Arquitectura**:
```
Bucket S3 ──(evento ObjectCreated)──▶ Lambda LeerMetadataArchivo ──JSON con metadata──▶ SNS (tema TemaNuevoArchivo)
                                                                          ├─[tenant_id='UTEC']▶ e-mail a docente
                                                                          └─[tenant_id='UTEC']▶ Lambda CrearArchivo_UTEC ▶ DynamoDB t_archivos_UTEC
```

**Pasos**
1. **Crear bucket S3** con nombre único (ej. `gcolchado3`) y carpetas: `universidades/` con subcarpetas `UNIV2/`, `UNIV3/`, `UTEC/`.
2. **Crear Lambda `LeerMetadataArchivo`** con el código plantilla (V1):
```python
import json

def lambda_handler(event, context):
    print(event)  # Revisar en Cloud Watch
    # TODO implement
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
```
3. **Configurar notificación de evento en el bucket** (pestaña Propiedades -> "Crear notificación de eventos"): nombre del evento `NuevoArchivo`; tipo de evento: **Todos los eventos de creación de objetos** (`s3:ObjectCreated:*`); Destino: **Función Lambda** -> elegir `LeerMetadataArchivo`; Guardar cambios. El enunciado dice "cuando se creen archivos .txt" (el filtro de sufijo no se ve en las capturas; no afirmar su valor exacto).
4. **Subir archivo** a `universidades/UTEC/` (`archivo01.txt`) y revisar logs de la Lambda en **CloudWatch**. Evento S3 obtenido:
```python
{'Records': [{'eventVersion': '2.1', 'eventSource': 'aws:s3', 'awsRegion': 'us-east-1',
  'eventTime': '2022-10-17T22:28:40.885Z', 'eventName': 'ObjectCreated:Put',
  'userIdentity': {'principalId': 'AWS:AROAWQSDEEHPHKPNON4UA:user2087205=Test_Student'},
  'requestParameters': {'sourceIPAddress': '148.102.115.41'},
  'responseElements': {'x-amz-request-id': 'R8TNAZMC5FZA7MC7', 'x-amz-id-2': '...'},
  's3': {'s3SchemaVersion': '1.0', 'configurationId': 'NuevoArchivo',
         'bucket': {'name': 'gcolchado3', 'ownerIdentity': {'principalId': 'A24RZ2Q7S369PD'}, 'arn': 'arn:aws:s3:::gcolchado3'},
         'object': {'key': 'universidades/UTEC/archivo01.txt', 'size': 6,
                    'eTag': '5bc8c567a89112d5f408a8af4f17970d', 'sequencer': '00634DD718D7C9D664'}}}]}
```
   Campos usados: `Records[0].eventTime`, `Records[0].s3.bucket.name`, `Records[0].s3.object.key`, `Records[0].s3.object.size`.
5. **Modificar Lambda (V2)** para extraer la metadata (tenant se obtiene del 2.º segmento de la ruta: `universidades/<TENANT>/archivo`):
```python
import json

def lambda_handler(event, context):
    print(event)  # Revisar en Cloud Watch
    # Entrada (json)
    archivo_id = event['Records'][0]['s3']['object']['key']
    tenant_id = archivo_id.split('/')[1]  # UTEC, UNIV1, etc.
    archivo_last_modified = event['Records'][0]['eventTime']
    archivo_size = event['Records'][0]['s3']['object']['size']
    bucket_name = event['Records'][0]['s3']['bucket']['name']
    archivo = {
        'tenant_id': tenant_id,
        'archivo_id': archivo_id,
        'archivo_datos': {
            'last_modified': archivo_last_modified,
            'size': archivo_size,
            'bucket_name': bucket_name
        }
    }
    print(archivo)
    # TODO implement
    return {'statusCode': 200, 'body': json.dumps('Hello from Lambda!')}
```
   Resultado en CloudWatch: `{'tenant_id': 'UTEC', 'archivo_id': 'universidades/UTEC/archivo01.txt', 'archivo_datos': {'last_modified': '2022-10-17T23:25:28.543Z', 'size': 6, 'bucket_name': 'gcolchado3'}}`.
6. **Crear tema** SNS `TemaNuevoArchivo`.
7. **Modificar Lambda (V3)** para publicar en el tema:
```python
import json
import boto3

def lambda_handler(event, context):
    # Entrada (json)
    archivo_id = event['Records'][0]['s3']['object']['key']
    tenant_id = archivo_id.split('/')[1]  # UTEC, UNIV1, etc.
    archivo_last_modified = event['Records'][0]['eventTime']
    archivo_size = event['Records'][0]['s3']['object']['size']
    bucket_name = event['Records'][0]['s3']['bucket']['name']
    archivo = {
        'tenant_id': tenant_id,
        'archivo_id': archivo_id,
        'archivo_datos': {
            'last_modified': archivo_last_modified,
            'size': archivo_size,
            'bucket_name': bucket_name
        }
    }
    # Publicar en SNS
    sns_client = boto3.client('sns')
    response_sns = sns_client.publish(
        TopicArn = 'arn:aws:sns:us-east-1:447891120606:TemaNuevoArchivo',
        Subject = 'Nuevo Archivo',
        Message = json.dumps(archivo),
        MessageAttributes = {
            'tenant_id': {'DataType': 'String', 'StringValue': tenant_id}
        }
    )
    # TODO implement
    return {'statusCode': 200, 'body': response_sns}
```
8. **Suscripción de correo** al tema `TemaNuevoArchivo` con filtro `tenant_id = 'UTEC'` (`{"tenant_id": ["UTEC"]}`); confirmar enlace en el correo. (El diagrama dice "e-mail a docente".)
9. **Prueba**: subir archivo a `universidades/UTEC/` -> llega correo (asunto "Nuevo Archivo", remitente "AWS Notifications", cuerpo = JSON: `{"tenant_id": "UTEC", "archivo_id": "universidades/UTEC/archivo01.txt", "archivo_datos": {"last_modified": "2022-10-17T23:48:49.916Z", "size": 6, "bucket_name": "gcolchado3"}}`).
10. **Prueba negativa**: subir a `universidades/UNIV2/` -> **no** llega correo.
11. **Crear tabla DynamoDB** `t_archivos_UTEC`: clave de partición `tenant_id` (S), clave de ordenación `archivo_id` (S).
12. **Crear Lambda `CrearArchivo_UTEC`**:
```python
import json
import boto3

def lambda_handler(event, context):
    # Entrada (json)
    print(event)  # Revisar en CloudWatch
    archivo_json = json.loads(event['Records'][0]['Sns']['Message'])
    # Proceso
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_archivos_UTEC')
    archivo = {
        'tenant_id': archivo_json['tenant_id'],
        'archivo_id': archivo_json['archivo_id'],
        'archivo_datos': archivo_json['archivo_datos']
    }
    print(archivo)  # Revisar en CloudWatch
    response = table.put_item(Item=archivo)
    # Salida (json)
    return {'statusCode': 200, 'response': response}
```
13. **Suscripción de la Lambda** `CrearArchivo_UTEC` al tema `TemaNuevoArchivo` con filtro `tenant_id = 'UTEC'`.
14. Subir archivo a `universidades/UTEC/` -> se graba registro (en la captura: `tenant_id=UTEC`, `archivo_id=universidades/UTEC/archivo02.txt`, `archivo_datos={size: N 6, last_modified: S ..., bucket_name: S gcolchado3}` — DynamoDB muestra los tipos: `N` número, `S` string, `M` mapa).
15. Subir a `universidades/UNIV2/` -> **no** se graba registro.

**Evolución del código LeerMetadataArchivo**: V1 (solo `print(event)` + Hello) -> V2 (extrae `archivo` y lo imprime) -> V3 (importa boto3 y publica en SNS con atributo `tenant_id`; ya sin `print`).

**Ejercicio propuesto / hw2**: identificar en la metadata del archivo el **código del curso** y el **código del alumno**, grabarlos en `t_archivos_UTEC`; presentar evidencia en el padlet. Convención de nombre: `CURSO_ALUMNO_descripcion.txt` (ej. `universidades/UTEC/CS2032_202199992_tarea1.txt`). Solución (`hw2/1_LeerMetadataArchivo_lambda.py`):
```python
import json
import boto3
from urllib.parse import unquote_plus

def lambda_handler(event, context):
    print(event)  # Revisar en CloudWatch
    # Entrada (json): la key viene codificada en URL en eventos S3 (espacios como '+', acentos como %XX)
    archivo_id = unquote_plus(event['Records'][0]['s3']['object']['key'])
    tenant_id = archivo_id.split('/')[1]  # UTEC, UNIV1, etc.
    archivo_last_modified = event['Records'][0]['eventTime']
    archivo_size = event['Records'][0]['s3']['object']['size']
    bucket_name = event['Records'][0]['s3']['bucket']['name']

    # Metadata nueva: codigo de curso y codigo de alumno
    nombre_archivo = archivo_id.split('/')[-1]            # CS2032_202199992_tarea1.txt
    partes = nombre_archivo.rsplit('.', 1)[0].split('_')  # ['CS2032', '202199992', 'tarea1']
    if len(partes) >= 2:
        curso_id = partes[0]
        alumno_id = partes[1]
    else:
        curso_id = 'DESCONOCIDO'
        alumno_id = 'DESCONOCIDO'

    archivo = {
        'tenant_id': tenant_id,
        'archivo_id': archivo_id,
        'archivo_datos': {
            'last_modified': archivo_last_modified,
            'size': archivo_size,
            'bucket_name': bucket_name,
            'curso_id': curso_id,
            'alumno_id': alumno_id
        }
    }
    print(archivo)  # Revisar en CloudWatch

    # Publicar en SNS
    sns_client = boto3.client('sns')
    response_sns = sns_client.publish(
        TopicArn = 'arn:aws:sns:us-east-1:092781274895:TemaNuevoArchivo',
        Subject = 'Nuevo Archivo',
        Message = json.dumps(archivo),
        MessageAttributes = {
            'tenant_id': {'DataType': 'String', 'StringValue': tenant_id}
        }
    )
    return {'statusCode': 200, 'body': response_sns}
```
- `CrearArchivo_UTEC` (hw2/2) **no cambia en lógica**: sigue copiando `archivo_json['archivo_datos']`, que ahora ya incluye `curso_id` y `alumno_id` (la solución sólo agrega un comentario). Filtro `{"tenant_id": ["UTEC"]}`.
- Pruebas (`hw2/4_archivos_para_subir.txt`): subir a `universidades/UTEC/` -> `CS2032_202199992_tarea1.txt` y `CS3061_202199993_informe.txt` (debe llegar correo y grabar tabla; contenido "da igual", los txt contienen 7 bytes); subir a `universidades/UNIV2/` -> `CS2032_2021G64747_tarea1.txt` (NO correo ni tabla).
- Resultado esperado para el primero: `tenant_id=UTEC`, `archivo_id=universidades/UTEC/CS2032_202199992_tarea1.txt`, `archivo_datos={last_modified, size, bucket_name, curso_id: 'CS2032', alumno_id: '202199992'}`.
- Observación: el `TopicArn` de hw2 usa cuenta `092781274895` (la del estudiante) y el de los talleres `447891120606` (docente); hay que usar la propia.

**Errores comunes Taller 2**
- Que el evento S3 apunte a un bucket o prefijo distinto: la Lambda no se dispara.
- Asumir `split('/')[1]` sin respetar la estructura `universidades/<tenant>/archivo` (índice 0 = `universidades`, 1 = tenant).
- No decodificar la key (`unquote_plus`) cuando el nombre tiene espacios o caracteres especiales (mejora de hw2).
- Nombre de archivo sin `_` -> hw2 pone `DESCONOCIDO`.
- No confirmar la suscripción de correo.

---

## 3. Ejercicios propuestos y tareas (hw)

| Ejercicio | Enunciado | Solución / enfoque (del material) |
|---|---|---|
| **S13 Taller 1 - Ejercicio Propuesto** (Canvas, 20 pts, entrega 2026-11-21T04:59:59Z) | "Adicione un subscriber para notificar al sistema de seguridad de UTEC." Evidencia al padlet. | hw1: tabla `t_alumnos_seguridad`, Lambda `CrearAlumno_Seguridad` (nombre + celular), suscripción Lambda al tema `NuevoAlumno` con filtro `tenant_id=["UTEC"]`; probar `3_test_UTEC.json` (graba) y `4_test_UNIV2.json` (no graba). Diagrama: tercer ramal del SNS con filtro. |
| **S13 Taller 2 - Ejercicio Propuesto** (Canvas, 20 pts, misma fecha) | "Identificar en la metadata del archivo el código del curso y el código de alumno. Diseñe e implemente los cambios. Se requiere que se grabe esa metadata en la tabla t_archivos_UTEC." Evidencia al padlet. | hw2: parsear el nombre `CURSO_ALUMNO_descripcion.txt` en LeerMetadataArchivo, añadir `curso_id` y `alumno_id` dentro de `archivo_datos`, el resto de la arquitectura queda igual. Probar con los 3 archivos de `hw2/archivos`. |

Ambos .md de Canvas tienen descripción vacía: no hay requisitos adicionales en ellos.

Pasos resumidos de hw1: (1) crear tabla -> (2) crear Lambda -> (3) suscribirla al tema con filtro -> (4) probar UTEC y UNIV2 -> (5) revisar CloudWatch y la tabla.
Pasos resumidos de hw2: (1) modificar LeerMetadataArchivo (parseo) -> (2) (opcional) ajustar CrearArchivo_UTEC -> (3) subir los 3 archivos -> (4) verificar correo (2 correos, UTEC) y 2 registros en tabla.

---

## 4. Conexiones teoría ↔ laboratorio

| Teoría | Laboratorio |
|---|---|
| Productor de eventos | Lambda `CrearAlumno` (Taller 1); Bucket S3 con su notificación -> Lambda `LeerMetadataArchivo` (Taller 2, que además actúa como productor hacia SNS). |
| Enrutador de eventos (temas) | Amazon SNS: temas `NuevoAlumno` y `TemaNuevoArchivo`. (EventBridge, el otro enrutador, no se usa en laboratorio.) |
| Consumidores | Correo electrónico, Lambdas `CrearAlumno_Canvas`, `CrearAlumno_Seguridad`, `CrearArchivo_UTEC` y sus tablas DynamoDB. |
| Filtrado del enrutador | Política de filtro de suscripción `{"tenant_id": ["UTEC"]}` + atributo `tenant_id` en `MessageAttributes`. |
| Pub/Sub - fan out | Un mensaje publicado -> varios suscriptores (correo + Lambda, + seguridad en el propuesto). |
| Desacoplamiento / extensibilidad | Añadir el suscriptor de Seguridad sin tocar `CrearAlumno`. |
| Evento como estado vs identificador | El mensaje SNS lleva el estado (JSON del alumno o metadata del archivo). |
| Servicios que publican en SNS (S3, Lambda...) | S3 emite evento -> Lambda; Lambda publica en SNS. |
| Suscriptores de SNS (Lambda, email, SQS...) | Se usan email y Lambda; SQS/HTTP/SMS/Firehose sólo en teoría. |
| Síncrono acoplado vs asíncrono desacoplado | Alternativa síncrona: CrearAlumno llamaría directamente a cada sistema; con SNS solo publica. |
| Casos de uso (integración de sistemas heterogéneos, procesamiento en paralelo) | Merchandising (correo), Canvas (DB), Seguridad (DB) reciben el mismo evento en paralelo. |

---

## 5. Preguntas tipo examen

1. **¿Qué es una arquitectura basada en eventos?** Sistemas desacoplados que se ejecutan en respuesta a eventos; los eventos (cambios de estado o actualizaciones) desencadenan y comunican servicios desacoplados, típica de microservicios.
2. **¿Cuáles son los tres componentes clave?** Productores, enrutadores y consumidores de eventos. El productor publica al enrutador, que filtra y envía a los consumidores.
3. **¿Qué ventajas aporta el desacoplamiento productor/consumidor?** Escalar, actualizar e implementar de forma independiente; el productor no conoce a los consumidores; nuevos servicios se suscriben sin cambiar el productor; resiliencia (si un servicio cae los eventos no se pierden).
4. **Dé dos tipos de contenido de un evento.** Puede llevar el estado (ítem, precio, dirección) o ser un identificador/notificación (se envió una orden).
5. **¿Cuándo conviene usar EDA?** Supervisión de estado de recursos y alertas; procesamiento en paralelo/distribución ramificada; integración de sistemas heterogéneos; replicación de datos entre cuentas y regiones.
6. **Compare EventBridge y SNS.** EventBridge: buses de eventos, reacciona a eventos de SaaS, servicios AWS o apps propias, esquema predefinido y reglas sobre todo el cuerpo del evento. SNS: temas, alto rendimiento y baja latencia, gran difusión (miles/millones de endpoints), independiente del esquema del evento.
7. **Compare comunicación síncrona acoplada y asíncrona desacoplada.** Síncrona: aplicación a aplicación (ej. Order -> Invoice por POST con respuesta 201), añadir consumidores exige modificar al productor. Asíncrona: aplicación -> cola/enrutador -> aplicación (Buying -> Queue -> Shipping); productor y consumidores independientes.
8. **Explique el patrón pub/sub - fan out.** Un productor publica un mensaje una vez en un tema (SNS) y el servicio lo distribuye a todos los suscriptores (email, fraude, envíos, cola SQS...); evita integraciones directas productor-receptor.
9. **¿Qué es SNS y qué significan A2A y A2P?** Servicio de mensajería pub/sub completamente administrado. A2A: aplicación a aplicación (SQS, Lambda, HTTP/S, Kinesis Data Firehose). A2P: aplicación a persona (push móvil, SMS, correo).
10. **¿Qué es el patrón SNS + SQS fan out?** Un tema SNS con varias colas SQS suscritas, cada cola con su consumidor (ej. Fraud y Shipping), de modo que cada consumidor procesa a su ritmo.
11. **Tema FIFO vs Estándar en SNS.** FIFO: orden estrictamente conservado, entrega única, hasta 300 publicaciones/s, suscripción sólo SQS. Estándar: mejor esfuerzo en orden, entrega al menos una vez, mayor rendimiento, protocolos SQS, Lambda, HTTP, SMS, correo, móvil. El tipo no puede cambiarse tras crear el tema.
12. **¿Cómo se logra que solo el tenant UTEC reciba notificación?** Publicar con `MessageAttributes` `tenant_id` (String) y crear suscripciones con política de filtro `{"tenant_id": ["UTEC"]}`.
13. **Escriba el filtro JSON de suscripción para UTEC.** `{ "tenant_id": [ "UTEC" ] }`.
14. **Escriba el fragmento Python que publica en SNS.** Ver cheat-sheet (boto3 `sns_client.publish(TopicArn, Subject, Message=json.dumps(...), MessageAttributes)`).
15. **¿Cómo lee una Lambda suscrita a SNS el mensaje?** `json.loads(event['Records'][0]['Sns']['Message'])`.
16. **¿Cómo obtiene LeerMetadataArchivo el tenant y la metadata?** `key = event['Records'][0]['s3']['object']['key']`; `tenant_id = key.split('/')[1]`; `eventTime`, `size`, `bucket.name` de las rutas indicadas.
17. **Describa la arquitectura del Taller 2.** Bucket S3 con evento de creación de objetos -> Lambda LeerMetadataArchivo -> tema SNS TemaNuevoArchivo -> (filtro UTEC) correo al docente y Lambda CrearArchivo_UTEC -> DynamoDB t_archivos_UTEC.
18. **Claves de las tablas del laboratorio.** `t_alumnos_canvas`: partición `tenant_id`, ordenación `alumno_id` (String). `t_archivos_UTEC`: partición `tenant_id`, ordenación `archivo_id` (String).
19. **¿Qué debe ocurrir al subir un archivo a universidades/UNIV2/?** La Lambda se ejecuta y publica con tenant_id=UNIV2, pero el filtro UTEC impide correo y registro en tabla.
20. **¿Cómo extender para el curso y el alumno (propuesto T2)?** Parsear el nombre `CURSO_ALUMNO_descripcion.txt` (`split('_')`), agregar `curso_id` y `alumno_id` a `archivo_datos`; la Lambda de DynamoDB los guarda tal cual. Para nuevo subscriber (T1) basta una nueva Lambda + tabla + suscripción con filtro, sin tocar CrearAlumno.

---

## 6. Cheat-sheet

**Publicar en SNS (boto3)**
```python
sns_client = boto3.client('sns')
response_sns = sns_client.publish(
    TopicArn = 'arn:aws:sns:us-east-1:<cuenta>:NuevoAlumno',
    Subject = 'Nuevo Alumno',
    Message = json.dumps(alumno),
    MessageAttributes = {
        'tenant_id': {'DataType': 'String', 'StringValue': tenant_id}
    }
)
```

**Política de filtro de suscripción**
```json
{ "tenant_id": [ "UTEC" ] }
```

**Entrada de Lambda suscrita a SNS**
```python
alumno_json = json.loads(event['Records'][0]['Sns']['Message'])
```

**Escribir en DynamoDB**
```python
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('t_alumnos_canvas')
response = table.put_item(Item=alumno)
```
Tabla: partición `tenant_id` (S), ordenación `alumno_id` / `archivo_id` (S).

**Evento S3 -> Lambda (campos)**
```python
key    = event['Records'][0]['s3']['object']['key']      # universidades/UTEC/archivo01.txt
size   = event['Records'][0]['s3']['object']['size']
bucket = event['Records'][0]['s3']['bucket']['name']
when   = event['Records'][0]['eventTime']
tenant = key.split('/')[1]
# hw2: key = unquote_plus(key); curso, alumno = nombre.rsplit('.',1)[0].split('_')[:2]
```

**Estructuras de evento (resumen)**
- S3: `{"Records":[{"eventSource":"aws:s3","eventName":"ObjectCreated:Put","eventTime":"...","s3":{"bucket":{"name":..,"arn":..},"object":{"key":..,"size":..,"eTag":..}}}]}`
- SNS: `{"Records":[{"Sns":{"Message":"<string JSON>", ...}}]}` (según el acceso del código; el resto de campos no aparece en el material).

**Mensaje del taller (alumno)**: `{tenant_id, alumno_id, alumno_datos:{nombre, sexo, fecha_nac, celular, domicilio:{direcc, distrito, provincia, departamento, pais}}}`.
**Mensaje del taller (archivo)**: `{tenant_id, archivo_id, archivo_datos:{last_modified, size, bucket_name[, curso_id, alumno_id]}}`.

**Valores del laboratorio**
- Temas: `NuevoAlumno`, `TemaNuevoArchivo` (Estándar). Lambdas: `CrearAlumno`, `CrearAlumno_Canvas`, `CrearAlumno_Seguridad`, `LeerMetadataArchivo`, `CrearArchivo_UTEC`. Tablas: `t_alumnos`, `t_alumnos_canvas`, `t_alumnos_seguridad`, `t_archivos_UTEC`. Evento S3: `NuevoArchivo` / `s3:ObjectCreated:*`. Carpetas: `universidades/{UTEC,UNIV2,UNIV3}/`. Región `us-east-1`.

**Conceptos para recordar**: EDA = productor + enrutador + consumidor; EventBridge (bus, reglas, esquema) vs SNS (tema, alto throughput, fan-out); sync acoplado vs async desacoplado; pub/sub = publicar una vez, N suscriptores; SNS FIFO (SQS, 300 pub/s, orden) vs Estándar (mejor esfuerzo, at-least-once); SNS soporta DLQ y filtrado.
