# Semana 11 — Serverless: Optimización de Lambdas, Stages, UUID, Variables de entorno y Resources (+ Proyecto Final)

Curso CS2032 Cloud Computing (Ciclo 2026-2), docente Geraldo Colchado. Semana 11 = Clase 1 (Optimización de Lambdas), Taller 3 (Optimización de Lambdas / stages / curl), Taller 4 (UUID, Environment y Resources en Serverless Framework) y presentación del Proyecto Final.

## 0. Mapa de materiales revisados

| Archivo | Tipo | Resumen de 1 línea |
|---|---|---|
| `teoria/semana-11/1. Serverless - Optimiz. Lambdas - V1.30.pdf` (19 diap.) | Teoría | Memoria/CPU de Lambda, timeout máximo (900 s), cold start, concurrencia (límite 1000), 6 formas de optimizar. |
| `teoria/semana-11/2. Proyecto Final (Entrega Semana 15) V5.00.pdf` (9 diap.) | Enunciado | Proyecto final SaaS multi-tenant, serverless, EDA en AWS; rúbrica (20 pts) y plazos. |
| `laboratorio/semana-11/1. Serverless - Taller 3 - V1.11.pdf` (22 diap.) | Taller (prioridad) | Memoria por función, despliegue por stage (dev/test/prod), curl desde Linux, ejercicio propuesto de 3 funciones S3. |
| `laboratorio/semana-11/1. Serverless - Taller 4 - V1.25.pdf` (23 diap.) | Taller (prioridad) | UUID v1/v4, variables de entorno (Linux y serverless.yml), tabla DynamoDB por stage, `serverless remove`, ejercicio propuesto bucket de ingesta. |
| `laboratorio/semana-11/Materiales S11 - Taller 1.zip` (= `extra/…Taller 1.zip`, idéntico por md5) | ZIP | Proyecto `api-s3` (serverless.yml + lista_buckets.py + lista_objetos_bucket.py) y `catalogo-productos` (4 imágenes PNG: galleta01/piqueo01 small y medium). |
| `laboratorio/semana-11/Materiales S11 - Taller 2.zip` (= `extra2/…Taller 2.zip`, idéntico) | ZIP | `api-comentario` (serverless.yml, comentario.py), generar-uuid.py, variables-entorno.py/.txt, comandos-eliminar.txt, json_probar_api_rest.txt. |
| `laboratorio/semana-11/S11 Taller 1 - Ejercicio Propuesto.md` | Ejercicio (20 pts, entrega 2026-11-02) | Agregar 3 funciones S3 (crear bucket, crear directorio, subir archivo), desplegar en dev/test/prod, probar con curl y Postman, evidencias. |
| `laboratorio/semana-11/S11 Taller 2 - Ejercicio Propuesto.md` | Ejercicio (20 pts, entrega 2026-11-02) | Solo contiene una imagen (`image.png`) no disponible; el enunciado equivale al "Ejercicio 5" del Taller 4 (bucket de ingesta por stage). |
| `laboratorio/semana-11/Proyecto Final (Entrega Semana 15).md` | Tarea Canvas | 20 puntos, entrega 2026-11-23T04:59:59Z; enlaza al PDF del proyecto final. |
| `laboratorio/semana-11/extra/api-s3/*` | Código (solución del alumno) | serverless.yml con 5 funciones + .py de crear_bucket, crear_directorio, subir_archivo (más los 2 originales). |
| `laboratorio/semana-11/extra/catalogo-productos/*` | Imágenes | Imágenes chicas y medianas del catálogo (duplicadas con el ZIP del Taller 1). |
| `laboratorio/semana-11/extra2/*` | Código | Copia de los materiales del Taller 2 (idénticos al ZIP salvo `org:` en serverless.yml). |
| `laboratorio/semana-11/tarea1/*` | Código + JSON de prueba | Solución del ejercicio propuesto del Taller 1 (5 funciones, JSON de entrada de cada una; `lista_objetos_bucket.py` más robusto). |
| `laboratorio/semana-11/tarea2/*` | Código | Solución del ejercicio propuesto del Taller 4 (bucket de ingesta por stage + guardar el JSON en S3). |
| `laboratorio/semana-11/.claude/settings.local.json`, `__MACOSX` | Ignorados | Configuración de herramienta, no es material del curso. |

---

## 1. Teoría

### 1.1 Objetivos de la sesión (Clase 1: Optimización de Lambdas)
- Entender la memoria RAM y CPU usada por Lambda.
- Conocer el tiempo de ejecución máximo de Lambda.
- Comprender el concepto de Cold Start.
- Entender la concurrencia de ejecución de lambdas.
- Conocer cómo optimizar o mejorar el tiempo de ejecución del Lambda.

Contenido de la clase: 1 Objetivo, 2 Memoria RAM y CPU, 3 Tiempo de ejecución máximo, 4 Cold Start, 5 Concurrencia, 6 Optimización, 7 Cierre.

### 1.2 Memoria RAM y CPU de Lambda
Cuota de AWS (documentación citada: *Cuotas de Lambda*, `gettingstarted-limits`):

| Recurso | Cuota |
|---|---|
| Asignación de memoria de función | De **128 MB a 10 240 MB**, en incrementos de **1 MB** |

- **Lambda asigna potencia de CPU en proporción a la cantidad de memoria configurada.** No se configura la CPU directamente: se sube/baja la **Memoria (MB)** y con ello la CPU.
- **A 1769 MB, la función tiene el equivalente de una vCPU.**
- Noticia AWS (28-jul-2021, "AWS Lambda ahora admite hasta 10 GB de memoria y 6 núcleos de vCPU" en Baréin, Osaka y Hong Kong): el máximo es **10 240 MB (10 GB)**, más de tres veces el límite anterior de **3008 MB**; como la CPU es proporcional a la memoria, los clientes tienen acceso hasta **6 vCPU**. Beneficia a cargas intensivas en cómputo: machine learning, generación de modelos, genómica, HPC (computación de alto rendimiento), trabajos por lotes, ETL y procesamiento multimedia.
- Consecuencia práctica (taller): más memoria = más CPU = potencialmente menor tiempo de ejecución; hay que "elegir la configuración de memoria correcta" (ver 1.6).

### 1.3 Tiempo de ejecución máximo de Lambda
| Recurso | Cuota |
|---|---|
| Tiempo de espera (timeout) de la función | **900 segundos (15 minutos)** |

(En el `serverless.yml` del laboratorio se usa `timeout: 20` segundos.)

### 1.4 Cold Start
Cita de la diapositiva (fuente: aprendewebdev.com), resumida sin perder datos:
- Lambda corre las funciones en un **contenedor**. Si la función está corriendo, el contenedor está activo y listo para nuevas ejecuciones: función **activa (warm)**.
- Si nadie la llama, tras un tiempo de inactividad (**~10 min**) el contenedor se "enfría" (**cold**) y la función pasa a **inactiva**; el proveedor **elimina ese contenedor**.
- Al llamar a una función inactiva, el proveedor debe **provisionar una máquina, crear el contenedor y ejecutar el código** → latencia adicional. En los peores casos la función puede tardar **hasta 5 segundos** en responder.
- **Definición: cold start = el delay que se produce cuando se llama a una función inactiva.** Con funciones calientes (warm) no hay ese delay porque AWS **reutiliza el mismo contenedor**.
- **Factor que aumenta el cold start: el peso del código (dependencias incluidas)**; a mayor peso, más le cuesta a AWS copiar el código al nuevo contenedor y correrlo.

**Descomposición de una ejecución de función** (diapositiva de video, fuente youtu.be/BhQh9QZdiKQ):

```
 1 Code Download  ->  2 Start Execution Environment  ->  3 Execute Init Code  ->  4 Execute Handler Code
 |<------- Full Cold Start ------->|                    |<-- Partial Cold Start -->|   Warm Start
```
- Pasos 1+2: **Full Cold Start**. Paso 3 (código de inicialización: imports, lectura de variables de entorno, etc. fuera del handler): **Partial Cold Start**. Paso 4 (handler): **Warm Start**.
- Ejemplo de la diapositiva: el código fuera del handler (imports de librerías, extracción de variables de entorno `process.env…`) corresponde al "Init code"; el `exports.handler` es el "Handler code" (y la conexión a BD se crea dentro).

### 1.5 Concurrencia de ejecución de lambdas
Cita AWS (docs `lambda-concurrency`):
- **Concurrencia = número de solicitudes en curso (in-flight) que la función atiende al mismo tiempo.**
- Por **cada solicitud concurrente**, Lambda aprovisiona una **instancia separada de su entorno de ejecución**. Al recibir más solicitudes, Lambda escala automáticamente el número de entornos hasta alcanzar el límite de concurrencia de la cuenta.
- **Por defecto: límite total de 1000 ejecuciones concurrentes entre todas las funciones de una región AWS** (por cuenta).

Ejemplo de la diapositiva (10 solicitudes, entornos A–F; eje Time):
```
A: [1 Init|Invoke]            [6 Invoke]
B:  [2 Init|Invoke]           [7 Invoke]
C:  [3 Init|Invoke]           [8 Invoke]
D:       [4 Init|Invoke]            [10 Invoke]
E:         [5 Init|Invoke]
F:                     [9 Init|Invoke]
```
Lectura: las solicitudes 1–5 y 9 requieren **crear un entorno nuevo** (fase **Init** + Invoke = cold start); las solicitudes 6, 7, 8 y 10 **reutilizan** un entorno ya libre (solo Invoke, warm). Hay hasta 5-6 entornos distintos (A–F) porque varias solicitudes se solapan en el tiempo.

### 1.6 Optimización del tiempo de ejecución (6 puntos de la diapositiva)
1. **Measure current performance** (medir con **CloudWatch**).
2. **Keep your functions warm** (hacer "ping" cada *n* minutos para evitar que el contenedor se enfríe).
3. **Choose the right memory settings** (elegir bien la memoria; recuerde: más memoria → más CPU).
4. **Store dependencies external to your function** (**Lambda Layers**).
5. **Keep your function small and single-purpose** (función pequeña y de propósito único).
6. **Simultaneidad aprovisionada (Provisioned Concurrency)** — **reduce el cold start** (docs `provisioned-concurrency`).

Fuentes citadas: khalilstemmler.com "5 ways to manage Lambda cold starts"; documentación de AWS.

### 1.7 Preguntas de cierre de la clase (autoevaluación del docente)
Explique con sus propias palabras: (a) cómo se maneja RAM y CPU en Lambda; (b) cuál es el tiempo máximo de ejecución; (c) qué es cold start; (d) cómo es la concurrencia; (e) cómo optimizar el tiempo de ejecución. (Respuestas modelo en la sección 5.)

### 1.8 Conceptos de apoyo vistos en los talleres (teoría breve)
- **Stage (etapa)**: entorno de despliegue (dev = desarrollo, test = pruebas/QA, prod = producción). Serverless Framework crea **recursos independientes por stage** (Lambdas distintas, API Gateway distinto, tablas distintas), con el nombre del stage en el nombre del recurso: stack `api-s3-dev`, `api-s3-test`, `api-s3-prod`. Stage por defecto: `dev`; se cambia con `--stage`.
- **UUID** (identificador único universal): **Versión 1** = generado con **marca de tiempo (timestamp) y la dirección MAC** del computador que lo generó; **Versión 4** = generado con **números aleatorios**. En Python: `uuid.uuid1()`, `uuid.uuid4()`. El taller usa **UUID v1** como clave de ordenamiento en DynamoDB (el v1 incluye el tiempo, por lo que el orden/unicidad se relaciona con el momento de creación; esto último es inferencia directa de la definición, la diapositiva solo dice "timestamp y MAC").
- **Variables de entorno**: variables del sistema operativo (Linux: `printenv`, `export`) y de Lambda (sección *Variables de entorno* de la configuración; "se cifran en reposo con la clave del servicio Lambda predeterminada"). En Python se leen con `os.environ["NOMBRE"]`.
- **Ingesta Push**: estrategia en la que la propia aplicación (el lambda) **empuja** el dato (JSON del comentario) a un bucket S3 de ingesta (Ejercicio 5 del Taller 4).
- **Multi-tenancy** (proyecto final): varios clientes (*tenants*) comparten la misma solución; en los ejemplos del taller `tenant_id` es la **clave de partición** de DynamoDB. **Patrón 2 de BD multi-tenant: Single Database, Multiple Schemas** (para SQL, un único RDS).

### 1.9 Proyecto Final (resumen teórico/enunciado; ver detalle en sección 3)
Competencia 4.1 (nivel 3): "Crea, selecciona, adapta y aplica técnicas, recursos y herramientas modernas para la práctica de la computación y comprende sus limitaciones." Solución **SaaS** con arquitectura **multi-tenancy, serverless y basada en eventos (EDA)**.

---

## 2. Laboratorio

### 2.A Taller 3 — Optimización de Lambdas (stages y curl)

**Objetivos**: aprender a optimizar tiempos de ejecución de Lambdas; desplegar lambdas/API Gateway en diferentes etapas; ejecutar un API REST desde Linux.

**Contenido**: Ej.1 Configuración de memoria RAM; Ej.2 Stage o etapa del Lambda/API G.; Ej.3 Ejecutar API REST desde Linux; Ej.4 Ejercicio propuesto.

#### Ejercicio 1: Configuración de memoria RAM
**Paso 0.** Crear en S3 (supermercado) los buckets y "directorios" siguientes, y subir las imágenes indicadas por el docente:

| Bucket | Directorios |
|---|---|
| `catalogo-productos` | `imagenes-chicas`, `imagenes-medianas` |
| `documentos-ventas` | `boletas`, `facturas` |
| `documentos-compras` | `ordenes-compra`, `facturas`, `guias-remision` |

(El ZIP del Taller 1 trae `catalogo-productos/imagenes-chicas/galleta01-small.png, piqueo01-small.png` y `imagenes-medianas/galleta01-medium.PNG, piqueo01-medium.PNG`.) Instrucción: **analice la memoria RAM asignada a cada lambda en serverless.yml.**

**Arquitectura**: Cliente (Postman/curl) → **API Gateway REST** (stage) → 2 **Lambdas** Python → **S3** (boto3) con el rol `LabRole`.

**Paso 1.** Implementar un lambda que liste todos los buckets y otro que liste todos los objetos de un bucket; **ambos publicados en el mismo API REST** en API Gateway; automatizar con `$ serverless deploy`. Se usa el código Python del docente. **Nota: actualizar el archivo `credentials`, el `org` y el `role`.** Salida esperada del deploy (stage dev, us-east-1; tardó 84 s; paquete 746 B por función):
```
Deploying api-s3 to stage dev (us-east-1)
Service deployed to stack api-s3-dev (84s)
endpoints:
  GET  - https://v6fak03vga.execute-api.us-east-1.amazonaws.com/dev/s3/lista-buckets
  POST - https://v6fak03vga.execute-api.us-east-1.amazonaws.com/dev/s3/bucket/lista-objetos
functions:
  lista_buckets: api-s3-dev-lista_buckets (746 B)
  lista_objetos_bucket: api-s3-dev-lista_objetos_bucket (746 B)
```

**serverless.yml del Taller 3 (completo, versión del docente):**
```yaml
org: geraldocolchado          # organización de Serverless Dashboard (cambiar por la propia)
service: api-s3               # nombre del servicio -> stack api-s3-<stage>

provider:
  name: aws
  runtime: python3.13
  # Default memory size for functions (default: 256MB)
  memorySize: 256             # memoria por defecto de TODAS las funciones
  timeout: 20                 # segundos (máximo Lambda: 900)
  iam:
    role: arn:aws:iam::447891120606:role/LabRole   # rol existente (AWS Academy); usar el ARN de la propia cuenta

functions:
  lista_buckets:
    handler: lista_buckets.lambda_handler   # archivo.función
    memorySize: 512                         # SOBRESCRIBE el valor global solo para esta función
    events:
      - http:
          path: /s3/lista-buckets
          method: get
          cors: true
          integration: lambda               # integración tipo "lambda" (no proxy): el body llega ya como dict en event['body']
  lista_objetos_bucket:
    handler: lista_objetos_bucket.lambda_handler   # hereda memorySize: 256
    events:
      - http:
          path: /s3/bucket/lista-objetos
          method: post
          cors: true
          integration: lambda
```
Punto clave a analizar: `lista_buckets` = **512 MB** (override por función), `lista_objetos_bucket` = **256 MB** (valor del provider). En la consola (Lambda → Configuración general → Memoria) se verifica 256 MB y 512 MB respectivamente. (En esa captura la columna "Tiempo de ejecución" mostraba Python 3.9.)

**Código Lambda `lista_buckets.py`:**
```python
import boto3

def lambda_handler(event, context):
    # Entrada
    # Proceso
    s3 = boto3.client('s3')
    response = s3.list_buckets()
    lista = []
    for bucket in response['Buckets']:
        lista.append(bucket["Name"])
    # Salida
    return {
        'statusCode': 200,
        'lista_buckets': lista
    }
```

**Código Lambda `lista_objetos_bucket.py`:**
```python
import boto3

def lambda_handler(event, context):
    # Entrada (json)
    nombre_bucket = event['body']['bucket']
    # Proceso
    s3 = boto3.client('s3')
    response = s3.list_objects(Bucket=nombre_bucket)
    lista = []
    for obj in response['Contents']:      # falla (KeyError) si el bucket está vacío: no existe 'Contents'
        lista.append(obj['Key'])
    return {
        'statusCode': 200,
        'bucket': nombre_bucket,
        'lista_objetos': lista
    }
```

**Paso 2.** Probar en Postman y **validar y analizar el tiempo de ejecución** (capturas de la diapositiva, workspace "UTEC 2023-1 / api-s3"):
- `GET https://v6fak03vga.execute-api.us-east-1.amazonaws.com/dev/s3/lista-buckets` → **200 OK, 1412 ms, 884 B**; JSON `{"statusCode":200,"lista_buckets":[ "api-dev-serverlessdeploymentbucket-…", "api-prueba-dev-…", "api-s3-dev-…", "gcolchado-123", "gcolchado-sec1", "gcolchado-sec1-s11", … ]}`.
- `POST …/dev/s3/bucket/lista-objetos` con Body (raw, JSON) `{"bucket": "gcolchado-sec1"}` → **200 OK, 2.0 s, 675 B**; respuesta `{"statusCode":200,"bucket":"gcolchado-sec1","lista_objetos":["documentos/","documentos/1. Almacenamiento y Bases de Datos - Taller 1 - V1.00.pdf","fotos/","fotos/shakira01.jpg"]}`.
- Observación: el primer llamado incluye cold start (tiempos de 1-2 s); comparar luego llamadas repetidas (warm) y distintas memorias.

**Paso 3.** Analizar lo creado en consola: Lambdas `api-s3-dev-lista_objetos_bucket` y `api-s3-dev-lista_buckets` (paquete Zip) y API Gateway `dev-api-s3` (id v6fak03vga, protocolo REST) con árbol de recursos: `/s3` → `/bucket` → `/lista-objetos` (POST); `/s3` → `/lista-buckets` (GET).

#### Ejercicio 2: Stage o Etapa del Lambda/API Gateway
1. Con dev satisfactorio, **desplegar en el entorno de pruebas**:
   ```bash
   serverless deploy --stage test
   ```
   Salida: `Deploying api-s3 to stage test (us-east-1)`, `Service deployed to stack api-s3-test (38s)`; endpoints `GET https://v1zxhd0j6d.execute-api.us-east-1.amazonaws.com/test/s3/lista-buckets` y `POST …/test/s3/bucket/lista-objetos`; funciones `api-s3-test-lista_buckets` y `api-s3-test-lista_objetos_bucket` (753 B).
2. Probar en Postman.
3. Analizar: **son Lambdas diferentes y el API Gateway también es diferente** al de dev (`test-api-s3`, id v1zxhd0j6d; `dev-api-s3`, id v6fak03vga).
4. QA da el OK → **desplegar en producción**: `serverless deploy --stage prod` (stack `api-s3-prod`, 90 s, endpoints `https://m1n1z5u30d.execute-api.us-east-1.amazonaws.com/prod/s3/...`, funciones `api-s3-prod-lista_buckets` y `api-s3-prod-lista_objetos_bucket`).
5. Probar en Postman.
6. Analizar: **6 Lambdas** (2 por stage) y **3 API Gateways** (`dev-api-s3`, `test-api-s3`, `prod-api-s3`).

Regla: la URL incluye el stage (`/dev/`, `/test/`, `/prod/`); nombre de función = `<service>-<stage>-<función>`.

#### Ejercicio 3: Ejecutar API REST desde Linux (curl)
```bash
# Paso 1: listar buckets (GET)
curl https://v6fak03vga.execute-api.us-east-1.amazonaws.com/dev/s3/lista-buckets

# Paso 2: listar objetos de un bucket (POST con JSON)
curl -X POST https://v6fak03vga.execute-api.us-east-1.amazonaws.com/dev/s3/bucket/lista-objetos \
  -H 'Content-Type: application/json' -d '{"bucket":"gcolchado-sec1"}'
```
Resultado esperado: el mismo JSON que en Postman impreso en la terminal (`{"statusCode": 200, "lista_buckets": [...]}` y `{"statusCode": 200, "bucket": "gcolchado-sec1", "lista_objetos": [...]}`). Flags: `-X POST` método, `-H` cabecera, `-d` cuerpo.

#### Ejercicio 4 (propuesto): ver sección 3.1 (Taller 1/Taller 3 Ejercicio Propuesto).

**Cierre Taller 3 — qué aprendimos**: optimizar tiempos de ejecución de Lambdas; desplegar lambdas/API G. en diferentes etapas; ejecutar un API REST desde Linux.

---

### 2.B Taller 4 — UUID, Environment y Resources en Serverless Framework

**Objetivos**: usar UUID; usar variables de entorno; crear recursos (DynamoDB) por stage; eliminar lo desplegado.

#### Ejercicio 1: UUID
- Teoría: ver 1.8. Pasos: (1) ingresar a la máquina virtual **"MV Desarrollo"**; (2) crear el directorio `/home/ubuntu/python`; (3) crear y ejecutar `generar-uuid.py`; (4) ejecutar el programa.
```python
import uuid
uuidv1 = str(uuid.uuid1())    # versión 1: timestamp + MAC
uuidv4 = str(uuid.uuid4())    # versión 4: números aleatorios
print("UUID en V1: ", uuidv1)
print("UUID en V4: ", uuidv4)
```
Ejecución: `python3 generar-uuid.py`. Resultado: imprime dos UUID (formato `xxxxxxxx-xxxx-Mxxx-xxxx-xxxxxxxxxxxx`, el dígito M es la versión 1 ó 4; ejemplo real en DynamoDB del taller: `cf32d529-194d-11ee-9f51-41757142260f`, un v1).

#### Ejercicio 2: Variables de entorno
```bash
$ printenv                                  # paso 1: ver variables de entorno de Linux
$ NOMBRE_ALUMNO="Geraldo Colchado Ruiz"      # paso 2: crear (variable de shell)
$ NOMBRE_EMPRESA="UTEC"
$ export NOMBRE_ALUMNO                      # export: la hace variable de entorno (heredada por procesos hijos, p.ej. python)
$ export NOMBRE_EMPRESA
$ printenv                                  # paso 3: verificar -> NOMBRE_ALUMNO=Geraldo Colchado Ruiz ... NOMBRE_EMPRESA=UTEC
$ echo $NOMBRE_ALUMNO                       # (variables-entorno.txt)
$ echo $NOMBRE_EMPRESA
```
Paso 4: `/home/ubuntu/python/variables-entorno.py`:
```python
import os
alumno = os.environ["NOMBRE_ALUMNO"]
empresa = os.environ["NOMBRE_EMPRESA"]
print(alumno)
print(empresa)
```
Paso 5: `python3 variables-entorno.py` → imprime `Geraldo Colchado Ruiz` y `UTEC`. (Sin `export`, Python no vería la variable: `KeyError`; esto es consecuencia estándar de `os.environ`, el material solo muestra el caso con `export`.)

#### Ejercicio 3: Resources (DynamoDB) por stage
**Enunciado**: elaborar un lambda que reciba un `tenant_id` y un texto y lo almacene en una tabla DynamoDB. Condiciones:
- Publicar como **API REST con API Gateway**.
- **Tabla con nombre diferente según el stage** (una para desarrollo, otra para test, otra para producción); usar **variables de entorno**.
- **`tenant_id` = clave de partición (HASH)** y **`uuid` = clave de ordenamiento (RANGE)**, con **UUID v1**.
- **Automatizar el despliegue con serverless; la tabla se crea automáticamente desde ahí** (sección `resources`).

**Arquitectura**: Postman/curl → API Gateway (`/{stage}/comentario/crear`, POST) → Lambda `crear` (env `TABLE_NAME`) → DynamoDB `{stage}-t_comentarios`.

**serverless.yml (api-comentario) completo:**
```yaml
org: geraldocolchado
service: api-comentario

provider:
  name: aws
  runtime: python3.13
  # Default memory size for functions (default: 1024MB)
  memorySize: 1024
  timeout: 20
  iam:
    role: arn:aws:iam::344491983971:role/LabRole
  environment:                                  # variables de entorno de TODAS las lambdas
    TABLE_NAME: ${sls:stage}-t_comentarios      # ${sls:stage} = dev | test | prod

functions:
  crear:
    handler: comentario.lambda_handler
    events:
      - http:
          path: /comentario/crear
          method: post
          cors: true
          integration: lambda

resources:                                      # CloudFormation crudo
  Resources:
    TablaComentarios:                           # ID lógico del recurso
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.TABLE_NAME}   # reutiliza la variable
        AttributeDefinitions:                   # solo atributos que son clave
          - AttributeName: tenant_id
            AttributeType: S                    # S = String
          - AttributeName: uuid
            AttributeType: S
        KeySchema:
          - AttributeName: tenant_id
            KeyType: HASH                       # clave de partición
          - AttributeName: uuid
            KeyType: RANGE                      # clave de ordenamiento
        # Set the capacity to auto-scale
        BillingMode: PAY_PER_REQUEST            # pago por uso (sin capacidad provisionada)
```
Sintaxis de variables: `${sls:stage}` (stage actual), `${self:provider.environment.TABLE_NAME}` (referencia a otro valor del mismo archivo).

**Código Lambda `comentario.py` (completo):**
```python
import boto3
import uuid
import os

def lambda_handler(event, context):
    # Entrada (json)
    print(event)
    tenant_id = event['body']['tenant_id']
    texto = event['body']['texto']
    nombre_tabla = os.environ["TABLE_NAME"]      # nombre de tabla según stage
    # Proceso
    uuidv1 = str(uuid.uuid1())
    comentario = {
        'tenant_id': tenant_id,
        'uuid': uuidv1,
        'detalle': {
          'texto': texto
        }
    }
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(nombre_tabla)
    response = table.put_item(Item=comentario)
    # Salida (json)
    print(comentario)
    return {
        'statusCode': 200,
        'comentario': comentario,
        'response': response
    }
```
**JSON de prueba (`json_probar_api_rest.txt`):**
```json
{
    "tenant_id": "gcolchado@utec.edu.pe",
    "texto": "Este es mi primer comentario"
}
```
**Pasos:**
1. En "MV Desarrollo" actualizar `/home/ubuntu/.aws/credentials`.
2. Crear el repositorio `api-comentario` en GitHub con los archivos del docente; analizarlos; `git clone` en `/home/ubuntu/`.
3. Despliegue en stage de desarrollo: `serverless login` y `serverless deploy`.
4. Probar en Postman: `POST https://2togxfsrsj.execute-api.us-east-1.amazonaws.com/dev/comentario/crear` con el JSON; verificar en Lambda → Configuración → **Variables de entorno** (1): clave `TABLE_NAME` = `dev-t_comentarios` (cifrada en reposo con la clave predeterminada de Lambda), y en la tabla `dev-t_comentarios` la fila: `tenant_id = gcolchado@utec.edu.pe`, `uuid = cf32d529-194d-11ee-9f51-41757142260f`, `detalle = {"texto": {"S": "Este es mi primer comentario"}}` (formato JSON-DynamoDB con tipo `S`).
5. `serverless deploy --stage test` y `serverless deploy --stage prod`.
6. Probar en Postman y verificar variables de entorno y tablas de test y producción (`test-t_comentarios`, `prod-t_comentarios`).

Errores comunes: no actualizar `credentials`, `org` o ARN de `role` (cada cuenta tiene su ID, el del material difiere: 447891120606, 344491983971); olvidar `serverless login` (org); `event['body']` sin integración `lambda` no es dict; nombre de tabla/bucket duplicado entre stages (por eso se antepone `${sls:stage}`); `AttributeDefinitions` solo con claves.

#### Ejercicio 4: Eliminar lo desplegado
Desde `/home/ubuntu/api-comentario`:
```bash
serverless remove                # stage dev (por defecto)
serverless remove --stage test
serverless remove --stage prod
```
Verificar que se eliminaron **API Gateway, Lambdas y DynamoDB** de dev, test y prod.

#### Ejercicio 5 (propuesto): ver sección 3.2.

**Cierre Taller 4 — qué aprendimos**: utilizar UUID; utilizar variables de entorno; crear recursos (DynamoDB) por stage; eliminar lo desplegado.

---

## 3. Ejercicios propuestos y Proyecto Final

### 3.1 S11 Taller 1 (Taller 3 de las diapositivas) — Ejercicio Propuesto (20 pts, entrega 2-nov-2026)
**Enunciado:**
- Modificar el `serverless.yml` para agregar **3 funciones**: (1) crear un nuevo bucket; (2) crear un nuevo directorio en un bucket existente; (3) subir un archivo (*) en un directorio de un bucket existente.
- Desplegar en los stages **dev, test y prod**.
- Probar el API REST desde Linux con **curl**.
- Mostrar evidencias de ejecución en Linux y Postman e imágenes de buckets, directorios y archivos. (El PDF del Taller 3 añade: poner la evidencia en un Word/Excel/PowerPoint y subirla al padlet del profesor.)
- (*) Referencia del PDF: gist de ross-humphrey (subida de archivos a S3 con boto3).

**Solución (de `tarea1/` y `extra/api-s3/`):**

`serverless.yml` (se añaden 3 funciones POST):
```yaml
org: renzocuba
service: api-s3

provider:
  name: aws
  runtime: python3.13
  memorySize: 256
  timeout: 20
  iam:
    role: arn:aws:iam::092781274895:role/LabRole

functions:
  lista_buckets:
    handler: lista_buckets.lambda_handler
    memorySize: 512
    events:
      - http: { path: /s3/lista-buckets, method: get, cors: true, integration: lambda }
  lista_objetos_bucket:
    handler: lista_objetos_bucket.lambda_handler
    events:
      - http: { path: /s3/bucket/lista-objetos, method: post, cors: true, integration: lambda }
  crear_bucket:
    handler: crear_bucket.lambda_handler
    events:
      - http: { path: /s3/crear-bucket, method: post, cors: true, integration: lambda }
  crear_directorio:
    handler: crear_directorio.lambda_handler
    events:
      - http: { path: /s3/bucket/crear-directorio, method: post, cors: true, integration: lambda }
  subir_archivo:
    handler: subir_archivo.lambda_handler
    events:
      - http: { path: /s3/bucket/subir-archivo, method: post, cors: true, integration: lambda }
```
(En los archivos originales cada `http:` está en formato expandido, con `path`, `method`, `cors`, `integration` en líneas separadas; es YAML equivalente.)

`crear_bucket.py`:
```python
import boto3

def lambda_handler(event, context):
    nombre_bucket = event['body']['nombre_bucket']
    s3 = boto3.client('s3')
    s3.create_bucket(Bucket=nombre_bucket)
    return {
        'statusCode': 200,
        'nombre_bucket': nombre_bucket,
        'message': f'Bucket {nombre_bucket} creado exitosamente'
    }
```
`crear_directorio.py` (en S3 un "directorio" es un objeto vacío cuya clave termina en `/`):
```python
import boto3

def lambda_handler(event, context):
    nombre_bucket = event['body']['nombre_bucket']
    nombre_directorio = event['body']['nombre_directorio']
    s3 = boto3.client('s3')
    s3.put_object(Bucket=nombre_bucket, Key=nombre_directorio + '/')
    return {
        'statusCode': 200,
        'nombre_bucket': nombre_bucket,
        'nombre_directorio': nombre_directorio,
        'message': f'Directorio {nombre_directorio}/ creado en bucket {nombre_bucket}'
    }
```
`subir_archivo.py`:
```python
import boto3

def lambda_handler(event, context):
    nombre_bucket = event['body']['nombre_bucket']
    nombre_directorio = event['body']['nombre_directorio']
    nombre_archivo = event['body']['nombre_archivo']
    contenido = event['body']['contenido']
    s3 = boto3.client('s3')
    key = nombre_directorio + '/' + nombre_archivo      # clave = directorio/archivo
    s3.put_object(
        Bucket=nombre_bucket,
        Key=key,
        Body=contenido.encode('utf-8')                  # Body en bytes
    )
    return {
        'statusCode': 200,
        'nombre_bucket': nombre_bucket,
        'key': key,
        'message': f'Archivo {nombre_archivo} subido a {nombre_bucket}/{key}'
    }
```
`lista_objetos_bucket.py` (versión de `tarea1/`, tolera bucket vacío):
```python
import boto3

def lambda_handler(event, context):
    nombre_bucket = event['body']['bucket']
    s3 = boto3.client('s3')
    response = s3.list_objects(Bucket=nombre_bucket)
    lista = []
    if 'Contents' in response:
        for obj in response['Contents']:
            lista.append(obj['Key'])
    return {'statusCode': 200, 'bucket': nombre_bucket, 'lista_objetos': lista}
```
JSON de entrada para probar (de `tarea1/*.json`):
```json
{ "nombre_bucket": "mi-bucket-utec-2026" }                                                  // crear_bucket
{ "nombre_bucket": "mi-bucket-utec-2026", "nombre_directorio": "documentos" }              // crear_directorio
{ "nombre_bucket": "mi-bucket-utec-2026", "nombre_directorio": "documentos",
  "nombre_archivo": "prueba.txt", "contenido": "Este es el contenido del archivo de prueba" } // subir_archivo
{ "bucket": "nombre-de-tu-bucket" }                                                        // lista_objetos_bucket
```
(Los comentarios `//` son solo anotación; JSON real no los admite.)

Pruebas con curl (sustituyendo la URL por la de cada stage):
```bash
curl -X POST https://<id>.execute-api.us-east-1.amazonaws.com/dev/s3/crear-bucket \
  -H 'Content-Type: application/json' -d '{"nombre_bucket":"mi-bucket-utec-2026"}'
curl -X POST https://<id>.execute-api.us-east-1.amazonaws.com/dev/s3/bucket/crear-directorio \
  -H 'Content-Type: application/json' -d '{"nombre_bucket":"mi-bucket-utec-2026","nombre_directorio":"documentos"}'
curl -X POST https://<id>.execute-api.us-east-1.amazonaws.com/dev/s3/bucket/subir-archivo \
  -H 'Content-Type: application/json' \
  -d '{"nombre_bucket":"mi-bucket-utec-2026","nombre_directorio":"documentos","nombre_archivo":"prueba.txt","contenido":"hola"}'
```
Despliegue: `serverless deploy`, `serverless deploy --stage test`, `serverless deploy --stage prod`. Nota: los buckets S3 tienen nombre **único global**; el mismo nombre no se puede crear dos veces (al probar en 3 stages usar nombres distintos, p.ej. con el stage; inferencia, no dicha en el material). Todo se archiva como evidencia (capturas de curl, Postman, consola S3).

### 3.2 S11 Taller 2 (Taller 4 de las diapositivas) — Ejercicio Propuesto (20 pts, entrega 2-nov-2026)
El .md solo contiene una imagen (`image.png`) que no está en la carpeta; el contenido equivalente está en el PDF del Taller 4, Ejercicio 5:
- **Investigar** (docs serverless.com/framework/docs) y modificar `serverless.yml` para **crear automáticamente un bucket S3 de ingesta por stage**.
- Modificar `comentario.lambda_handler` para **grabar el JSON del comentario como archivo en el bucket S3 de ingesta que le corresponde según stage** (estrategia de **"Ingesta Push"**).

**Solución (de `tarea2/`):**
```yaml
provider:
  ...
  environment:
    TABLE_NAME: ${sls:stage}-t_comentarios
    BUCKET_INGESTA: ${sls:stage}-ingesta-092781274895   # único global: stage + ID de cuenta

resources:
  Resources:
    TablaComentarios:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.TABLE_NAME}
        AttributeDefinitions:
          - AttributeName: tenant_id
            AttributeType: S
          - AttributeName: uuid
            AttributeType: S
        KeySchema:
          - AttributeName: tenant_id
            KeyType: HASH
          - AttributeName: uuid
            KeyType: RANGE
        BillingMode: PAY_PER_REQUEST
    BucketIngesta:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${self:provider.environment.BUCKET_INGESTA}
```
```python
import boto3, uuid, os, json

def lambda_handler(event, context):
    tenant_id = event["body"]["tenant_id"]
    texto = event["body"]["texto"]
    nombre_tabla = os.environ["TABLE_NAME"]
    bucket_ingesta = os.environ["BUCKET_INGESTA"]

    uuidv1 = str(uuid.uuid1())
    comentario = {"tenant_id": tenant_id, "uuid": uuidv1, "detalle": {"texto": texto}}

    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(nombre_tabla)
    table.put_item(Item=comentario)                       # 1) guardar en DynamoDB

    s3 = boto3.client("s3")
    key = f"{tenant_id}/{uuidv1}.json"                    # 2) un archivo por comentario, "carpeta" por tenant
    s3.put_object(Bucket=bucket_ingesta, Key=key,
                  Body=json.dumps(comentario).encode("utf-8"))

    return {"statusCode": 200, "comentario": comentario,
            "bucket_ingesta": bucket_ingesta, "key": key}
```
Resultado esperado: tras `serverless deploy` por stage existen `dev-ingesta-<cuenta>`, `test-ingesta-<cuenta>`, `prod-ingesta-<cuenta>`; cada POST crea una fila en DynamoDB y un objeto `tenant_id/uuid.json` en el bucket de su stage. `json.dumps` es necesario porque `put_object` requiere bytes/str.

### 3.3 Proyecto Final (Entrega Semana 15; exposición en Semana 16)
Tarea Canvas: **20 puntos**, entrega **2026-11-23T04:59:59Z** (equivale al domingo 22-nov-2026 23:59, hora Perú, como dice el PDF). Semanas 11 a 15, exposición en la 16.

**Competencia 4.1 (nivel 3)**: crea, selecciona, adapta y aplica técnicas, recursos y herramientas modernas para la práctica de la computación y comprende sus limitaciones.

**Integrantes**: mantener el mismo grupo que el Proyecto Parcial (grupos de hasta 5 personas).

**Funcionalidad**: implementar una solución tecnológica **Software as a Service (SaaS)**. **Arquitectura**: **Multi-tenancy, Serverless, Basada en eventos (EDA)**.

**Tipo de SaaS según el grupo de Canvas:**

| Grupo | Tipo | Descripción | Ejemplos |
|---|---|---|---|
| 1 | CRM | Customer Relationship Management: clientes, oportunidades comerciales, ventas y relaciones comerciales | Salesforce, Zoho CRM, Odoo CRM |
| 2 | HCM | Human Capital Management: empleados, nóminas, talento, contratación y desempeño | SAP HCM, BambooHR, Workday |
| 3 | LMS | Learning Management System: cursos, contenidos educativos, evaluaciones y seguimiento de estudiantes | Canvas, MoodleCloud, TalentLMS |
| 4 | PPM | Project Portfolio Management: proyectos, portafolios, recursos, presupuestos y prioridades | Monday, Smartsheet, Planview |
| 5 | FSM | Field Service Management: técnicos, visitas, órdenes de trabajo y servicios en campo | Salesforce Field Service, ServiceTitan, Jobber |
| 6 | ITSM | IT Service Management: incidentes, problemas, cambios y solicitudes de servicios TI | ServiceNow ITSM, Jira Service Management, Freshservice |

**Requerimientos:**
- Implementar el SaaS **en AWS**: multi-tenancy, serverless y basado en eventos; basarse en las funcionalidades del tipo de SaaS del grupo.
- **FrontEnd**: cualquier framework, desplegado en **Amplify**.
- **BackEnd**:
  - **Mínimo 5 microservicios serverless protegidos (API Gateway + Lambda)**, **cada uno con su propia base de datos**.
  - Si requiere **SQL**: crear **un único RDS** usando el patrón **BD Multi-tenancy – Patrón 2: Single Database, Multiple Schemas**. Si requiere **NoSQL**: **DynamoDB**.
  - Para cada microservicio presentar **Diagrama Entidad-Relación (SQL) o estructura JSON (NoSQL)**.
  - **Cada microservicio con mínimo 30 000 registros ficticios divididos en 3 tenants.**
  - Usar adicionalmente **S3, SNS y SQS**.
  - **Automatizar todo el despliegue con Serverless Framework.**
- Presentar un **Diagrama de Arquitectura de Solución**.
- Realizar la **demo con 2 tenants**.

**Rúbrica (20 puntos):**

| Criterio | Puntos |
|---|---|
| Diagrama de Arquitectura de Solución | 2 |
| BackEnd | 8 |
| FrontEnd | 6 |
| Exposición presencial | 1 |
| Exposición virtual con ACL (avance proporcional al 30% hasta sábado 14-nov) | 3 |
| **Total** | **20** |

Si no se presenta a la **exposición presencial**, la evaluación será desaprobatoria (**sobre nota 10 como máximo**).

**Entregables (fin de Semana 15; plazo máximo domingo 22-nov-2026 23:59, en Canvas):**
1. **Informe en Word o PDF** con evidencia de todo lo solicitado, **enlaces públicos a repositorios de código fuente** y **diseño de la base de datos de cada microservicio**.
2. **Resumen en PowerPoint** con todo lo solicitado.
3. **Exposición presencial y demo durante la semana 16.**

**Enfoque basado en el material (cómo se conecta con los talleres):** cada microservicio = un proyecto serverless (como `api-comentario`) con `provider.environment` + `resources` (DynamoDB con `tenant_id` como HASH y `uuid` v1 como RANGE) + funciones `http` con `integration: lambda`; desplegar por stage; S3 para ingesta (Ejercicio 5); SNS/SQS para eventos (EDA; el material de esta semana no da código de SNS/SQS). No se afirma nada más allá del enunciado.

---

## 4. Conexiones teoría ↔ laboratorio

| Teoría (Clase 1) | Laboratorio |
|---|---|
| Memoria 128–10 240 MB y CPU proporcional | `memorySize: 256` global y `memorySize: 512` en `lista_buckets` (Taller 3); `memorySize: 1024` en `api-comentario` (Taller 4); verificación 256/512 MB en consola. |
| Timeout máx. 900 s | `timeout: 20` en todos los `serverless.yml`. |
| Cold start (~10 min inactividad, hasta ~5 s) | Tiempos en Postman: GET 1412 ms y POST 2.0 s en la primera llamada; análisis de tiempo de ejecución (Ej.1 Paso 2). |
| Cold start crece con el peso del código | Paquetes de 746–753 B (funciones muy pequeñas, "small and single-purpose"). |
| Código Init fuera del handler = partial cold start | `import boto3` / `import os` al inicio de los .py; `boto3.client(...)` dentro del handler. |
| Función pequeña y de un solo propósito | Una Lambda por operación (`lista_buckets`, `lista_objetos_bucket`, `crear_bucket`, …). |
| Concurrencia: un entorno por solicitud concurrente; límite 1000 por región | Un mismo API recibe peticiones concurrentes; cada stage tiene Lambdas separadas (6 Lambdas en 3 stages) con entornos propios. |
| Medir con CloudWatch | Deploy muestra "Need a faster logging experience than CloudWatch?"; `print(event)` en comentario.py se ve en logs. |
| Provisioned concurrency / keep warm / Layers | No se practican en los talleres (solo mencionados en teoría). |
| Stages dev/test/prod | `serverless deploy --stage test|prod`; recursos separados; `${sls:stage}` en nombres de tabla y bucket. |
| Multi-tenancy (proyecto) | `tenant_id` como clave de partición en DynamoDB; demo con 2 tenants. |
| EDA / S3 + SNS + SQS | Ingesta Push a S3 (Ej.5 Taller 4) como primer paso hacia arquitectura basada en eventos. |
| Serverless Framework automatiza todo | `serverless deploy` / `remove`; el proyecto final exige automatizar con el framework. |

---

## 5. Preguntas tipo examen (con respuesta modelo)

1. **¿Cómo se maneja la memoria RAM y la CPU en AWS Lambda?** Se configura solo la memoria (128 MB a 10 240 MB, en incrementos de 1 MB); Lambda asigna CPU proporcional a la memoria. A 1769 MB equivale a 1 vCPU; con 10 GB se llega a hasta 6 vCPU.
2. **¿Cuál es el tiempo de ejecución máximo de una Lambda?** 900 segundos (15 minutos).
3. **Defina cold start y qué lo agrava.** Es el delay al invocar una función inactiva: el proveedor debe provisionar máquina, crear el contenedor y ejecutar el código. Tras ~10 min sin uso el contenedor se elimina; puede tardar hasta ~5 s. Aumenta con el peso del código y dependencias.
4. **¿Qué es una función warm?** Una función cuyo contenedor sigue activo; AWS reutiliza el contenedor y no hay delay de cold start.
5. **Etapas de la ejecución de una función y qué tipo de arranque representa cada una.** 1 Code Download y 2 Start Execution Environment = full cold start; 3 Execute Init Code = partial cold start; 4 Execute Handler Code = warm start.
6. **Defina concurrencia en Lambda y su límite por defecto.** Número de solicitudes en curso atendidas simultáneamente; cada solicitud concurrente usa una instancia separada del entorno de ejecución; límite por defecto 1000 ejecuciones concurrentes entre todas las funciones de una región.
7. **En el ejemplo de 10 solicitudes (entornos A–F), ¿cuáles sufren Init?** Las que crean un entorno nuevo (1, 2, 3, 4, 5 y 9); las solicitudes 6, 7, 8 y 10 reutilizan un entorno libre y solo hacen Invoke.
8. **Liste las 6 formas de optimizar el tiempo de ejecución vistas en clase.** Medir (CloudWatch); mantener caliente (ping cada n min); elegir la memoria correcta; dependencias externas (Lambda Layers); función pequeña y de propósito único; simultaneidad aprovisionada (reduce cold start).
9. **En un serverless.yml, ¿cómo asigno 512 MB solo a una función y 256 MB al resto?** `provider.memorySize: 256` y en esa función `memorySize: 512` (override por función).
10. **¿Qué comando despliega en test y qué ocurre con los recursos?** `serverless deploy --stage test`; se crean Lambdas y un API Gateway distintos (p.ej. `api-s3-test-lista_buckets`, `test-api-s3`) con otra URL (`/test/...`).
11. **¿Cuántas Lambdas y API Gateways existen tras desplegar `api-s3` (2 funciones) en dev, test y prod?** 6 Lambdas y 3 API Gateway.
12. **Escriba los curl para listar buckets (GET) y listar objetos de un bucket (POST).** `curl <url>/dev/s3/lista-buckets` y `curl -X POST <url>/dev/s3/bucket/lista-objetos -H 'Content-Type: application/json' -d '{"bucket":"gcolchado-sec1"}'`.
13. **Diferencia entre UUID v1 y v4.** v1 usa timestamp y dirección MAC del equipo; v4 usa números aleatorios. Python: `uuid.uuid1()`, `uuid.uuid4()`.
14. **Cree una variable de entorno en Linux y léala en Python.** `NOMBRE_EMPRESA="UTEC"; export NOMBRE_EMPRESA`; en Python `import os; os.environ["NOMBRE_EMPRESA"]`. `printenv` las lista.
15. **Escriba el recurso DynamoDB del serverless.yml con `tenant_id` HASH y `uuid` RANGE y nombre según stage.** Ver cheat-sheet (6.2): `TableName: ${self:provider.environment.TABLE_NAME}` con `TABLE_NAME: ${sls:stage}-t_comentarios`, `BillingMode: PAY_PER_REQUEST`.
16. **¿Cómo pasa el nombre de tabla al Lambda y cómo lo lee?** Definido en `provider.environment.TABLE_NAME`; el Lambda lo lee con `os.environ["TABLE_NAME"]`; en la consola aparece en Configuración → Variables de entorno (`dev-t_comentarios`).
17. **¿Cómo se elimina todo lo desplegado de los tres stages?** `serverless remove`, `serverless remove --stage test`, `serverless remove --stage prod` (elimina API Gateway, Lambdas y DynamoDB).
18. **¿Cómo crear un "directorio" y subir un archivo a S3 con boto3?** Directorio: `s3.put_object(Bucket=b, Key='dir/')`; archivo: `s3.put_object(Bucket=b, Key='dir/archivo.txt', Body=contenido.encode('utf-8'))`.
19. **Requisitos de BackEnd del Proyecto Final.** ≥5 microservicios serverless protegidos (API Gateway + Lambda) cada uno con su BD; SQL → un único RDS, patrón 2 Single Database Multiple Schemas; NoSQL → DynamoDB; DER o JSON por microservicio; ≥30 000 registros ficticios en 3 tenants por microservicio; S3, SNS y SQS; despliegue con Serverless Framework.
20. **Rúbrica del Proyecto Final.** Diagrama de arquitectura 2, BackEnd 8, FrontEnd 6, exposición presencial 1, exposición virtual con ACL 3 (avance 30% al sábado 14-nov); total 20. Sin exposición presencial: máximo 10.

---

## 6. Cheat-sheet

### 6.1 Cifras clave
| Dato | Valor |
|---|---|
| Memoria Lambda | 128 MB – 10 240 MB (pasos de 1 MB); 1769 MB ≈ 1 vCPU; máx. 6 vCPU; antes 3008 MB |
| Timeout máx. | 900 s (15 min) |
| Inactividad para cold | ~10 min; cold start hasta ~5 s |
| Concurrencia por defecto | 1000 por región/cuenta |
| Proyecto final | ≥5 microservicios, ≥30 000 registros c/u, 3 tenants, demo con 2 tenants |

### 6.2 serverless.yml mínimo (API + env + DynamoDB + S3)
```yaml
org: <mi-org>
service: api-comentario
provider:
  name: aws
  runtime: python3.13
  memorySize: 1024            # global (override por función con memorySize)
  timeout: 20
  iam:
    role: arn:aws:iam::<cuenta>:role/LabRole
  environment:
    TABLE_NAME: ${sls:stage}-t_comentarios
    BUCKET_INGESTA: ${sls:stage}-ingesta-<cuenta>
functions:
  crear:
    handler: comentario.lambda_handler      # archivo.función
    events:
      - http:
          path: /comentario/crear
          method: post                      # get | post
          cors: true
          integration: lambda
resources:
  Resources:
    TablaComentarios:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.TABLE_NAME}
        AttributeDefinitions:
          - AttributeName: tenant_id
            AttributeType: S
          - AttributeName: uuid
            AttributeType: S
        KeySchema:
          - AttributeName: tenant_id
            KeyType: HASH
          - AttributeName: uuid
            KeyType: RANGE
        BillingMode: PAY_PER_REQUEST
    BucketIngesta:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${self:provider.environment.BUCKET_INGESTA}
```

### 6.3 Código Lambda (patrón)
```python
import boto3, uuid, os, json
def lambda_handler(event, context):
    x = event['body']['campo']              # integration: lambda -> body ya es dict
    tabla = boto3.resource('dynamodb').Table(os.environ["TABLE_NAME"])
    tabla.put_item(Item={'tenant_id': t, 'uuid': str(uuid.uuid1()), 'detalle': {'texto': x}})
    s3 = boto3.client('s3')
    s3.list_buckets()['Buckets']            # lista de dicts con 'Name'
    s3.list_objects(Bucket=b)['Contents']   # lista de dicts con 'Key'
    s3.create_bucket(Bucket=b)
    s3.put_object(Bucket=b, Key='dir/', )   # crear directorio
    s3.put_object(Bucket=b, Key='dir/a.txt', Body=txt.encode('utf-8'))
    return {'statusCode': 200, 'mensaje': 'ok'}
```

### 6.4 Comandos
```bash
serverless login
serverless deploy                      # stage dev
serverless deploy --stage test
serverless deploy --stage prod
serverless remove [--stage test|prod]
printenv ; export VAR="valor" ; echo $VAR
python3 generar-uuid.py
curl <url>                                                       # GET
curl -X POST <url> -H 'Content-Type: application/json' -d '{"k":"v"}'
```
Archivo de credenciales en la VM: `/home/ubuntu/.aws/credentials` (actualizar al iniciar el laboratorio); repo clonado en `/home/ubuntu/api-comentario`; código de prueba en `/home/ubuntu/python`.

### 6.5 Convenciones de nombres
`<service>-<stage>-<función>` (Lambda); `<stage>-<service>` en consola (API Gateway, p.ej. `dev-api-s3`, `prod-api-s3`; stack `<service>-<stage>`); URL `https://<id>.execute-api.us-east-1.amazonaws.com/<stage>/<path>`.
