# Semana 12 — Monitoreo y Observabilidad en AWS (CloudWatch Logs/Insights) y Web Scraping serverless

Curso CS2032 Cloud Computing (Ciclo 2026-2). Docente: Geraldo Colchado. Tema: Monitoreo de Infraestructura y Aplicaciones, Cloud Observability, Taller 1 (CloudWatch: métricas y logs de Lambda) y Taller 2 (Web Scraping con framework serverless).

---

## 0. Mapa de materiales revisados

| Archivo | Tipo | Resumen de 1 línea |
|---|---|---|
| `teoria/semana-12/1a. Monitoreo de Infraestructura y Aplicaciones - Teoría - V1.00.pdf` (15 pp.) | Teoría (PDF) | Definición de monitoreo, monitoreo reactivo vs. observabilidad/proactivo, y qué es Amazon CloudWatch (beneficios, funcionamiento Collect-Monitor-Act-Analyze). |
| `teoria/semana-12/1b. Cloud observability - V1.00.pdf` (19 pp.) | Teoría (PDF) | Observabilidad: concepto, monitoring vs observability, tres pilares (métricas, trazas, registros), herramientas de SW (Gartner Magic Quadrant APM). |
| `laboratorio/semana-12/1. Monitoreo de Infraestructura y Aplicaciones - Taller 1 - V2.00.pdf` (24 pp.) | Taller (PDF) | Taller 1: registrar logs JSON en la Lambda `api-pelicula`, verlos en CloudWatch y consultarlos con Logs Insights (métricas, logs, errores) + ejercicio propuesto. |
| `laboratorio/semana-12/1. Otros Tópicos - Web Scraping - Taller 1 - V1.00.pdf` (16 pp.) | Taller (PDF) | Taller 2 (la portada dice "Taller 2"): concepto de Web Scraping y scraping de la web de Bomberos con Lambda + BeautifulSoup + DynamoDB desplegado con Serverless. |
| `laboratorio/semana-12/Materiales S12 - Taller 1.zip` (= `mats1/Materiales S12 - Taller 1.zip`, idéntico por md5) | ZIP | Contiene `api-pelicula/` (CrearPelicula.py, serverless.yml), 7 JSON de películas y `Queries_Logs_Insights.txt` (ya extraído en `mats1/`). |
| `laboratorio/semana-12/Materiales S12 - Taller 2.zip` (= `mats2/...`, idéntico) | ZIP | Contiene `api-web-scraping/` (serverless.yml, requirements.txt, scrap_table.py). |
| `mats1/api-pelicula/CrearPelicula.py` | Código | Lambda que recibe tenant_id y pelicula_datos, genera uuid y hace `put_item` en DynamoDB; imprime event y pelicula. |
| `mats1/api-pelicula/serverless.yml` | Config YAML | Servicio `api-pelicula`: Lambda `crear` (POST /pelicula/crear, integration lambda) + tabla DynamoDB `${sls:stage}-t_peliculas`. |
| `mats1/pelicula_01..06.json`, `pelicula_07_error.json` | Datos JSON | 6 películas válidas de CINEPLANET y 1 con clave mal escrita (`pelicula_patos`) para provocar error. |
| `mats1/Queries_Logs_Insights.txt` | Queries | 7 consultas de Logs Insights (métricas REPORT, filtros por tenant/género, stats, errores). |
| `mats2/api-web-scraping/scrap_table.py`, `serverless.yml`, `requirements.txt` | Código/Config | Versión del taller: scraping de tabla HTML de la web de Bomberos con requests + BeautifulSoup -> tabla `TablaWebScrapping`. |
| `mats2/api-web-scraping/scrap_table2.py`, `serverless2.yml`, `requirements2.txt` | Código/Config (extra) | Variante (probable solución al ejercicio propuesto): consume el API JSON del IGP (sismos) con `requests` -> tabla `TablaWebScrapping2`. |
| `S12 Taller 1 - Ejercicio Propuesto.md` | Ejercicio | Modificar CrearPelicula.py: try/except, formato de log estándar INFO/ERROR, queries. 30 pts. |
| `S12 Taller 2 - Ejercicio Propuesto.md` | Ejercicio | API serverless que haga scraping de los 10 últimos sismos del IGP y los guarde en DynamoDB. 30 pts. |

Ignorados: `__MACOSX`, `.claude/settings.local.json` (configuración de herramienta, no es material de curso), zips duplicados.

---

## 1. Teoría

### 1.1 Monitoreo de infraestructura y aplicaciones (Clase 1a)

**Objetivos de la sesión:** comprender qué es monitoreo; diferenciar reactivo y proactivo; conocer métricas y herramientas en AWS.

**Definición (diapositiva, fuente geekflare):** "La supervisión de la infraestructura y las aplicaciones es simplemente una **estrategia de gestión**. La estrategia de gestión implica cualquier **flujo de trabajo operativo que evalúe los recursos informáticos y las aplicaciones** para obtener **visibilidad del rendimiento, el estado y la disponibilidad** de los servicios que se ejecutan en cualquier infraestructura."

Ideas clave de la definición:
- Es una estrategia de gestión / flujo de trabajo operativo.
- Evalúa **recursos informáticos** (infraestructura) y **aplicaciones**.
- Busca visibilidad de tres aspectos: **rendimiento, estado y disponibilidad**.

#### Reactivo vs. Proactivo (monitoreo vs. observabilidad)

La diapositiva "Reactivo y Proactivo" cita (fuentes e-dea.co y norwu.com):

> "La observabilidad permite conocer el **por qué** de un mal funcionamiento en el sistema, a diferencia del monitoreo que sólo permite detectar **dónde** están las fallas. La observabilidad es la **evolución del monitoreo**, por lo tanto tiene la capacidad de **descubrir, analizar, reaccionar así como predecir** comportamientos de un sistema. También permite transformar datos en informaciones accionables para la toma de decisiones en cualquier contexto. La observabilidad comenzó a ganar terreno en **2018**, permitiendo recabar **eventos, métricas, registros y trazas** para suministrar a los desarrolladores el desempeño en tiempo real de sus sistemas de software."

Comparación (combinando el texto con el diagrama de la clase 1b "Monitoring vs Observability"):

| Aspecto | Monitoreo (reactivo) | Observabilidad (proactivo) |
|---|---|---|
| Pregunta que responde | **¿Qué? ¿Cuándo? / ¿dónde?** están las fallas | **¿Por qué? ¿Cómo?** ocurre el mal funcionamiento |
| Enfoque | Reactivo: acciones reactivas | Proactivo, predictivo y automatizado |
| Datos | Datos dispersos ("spread data"), monitoreo por componente | Datos integrados ("integrated data"), monitoreo full-stack |
| Análisis de causa raíz | Pobre ("poor root cause analysis") | Permite llegar a la causa raíz |
| Relación | Es la base | Es la **evolución** del monitoreo |

Diagrama de la diapositiva (recreado):

```
 Monitoring (gris)                                   Observability (azul)
 [Spread data] [Reactive actions] [What? When?] [Component monitoring] | [Integrated data] [Proactive actions] [Why? How?] [Full stack monitoring]
 Reactive ---- Poor root cause analysis ----------------------------- | Proactive ------- Predictive ---------- Automated  ->
```

(El gráfico del iceberg "Monitoring vs Observability" ilustra que el monitoreo es la parte visible y la observabilidad la parte profunda.)

#### Amazon CloudWatch (métricas y herramientas con AWS)

- **Definición:** "Amazon CloudWatch es un **servicio de monitoreo y observabilidad** creado para desarrolladores, ingenieros de fiabilidad de sitios (SRE), administradores de TI, propietarios de productos e ingenieros de DevOps." Tagline: *Observación de sus recursos y aplicaciones de AWS tanto en AWS como locales*.
- Proporciona datos e información procesable para monitorear aplicaciones, responder a cambios de rendimiento que afecten a todo el sistema y optimizar el uso de recursos.
- **Recopila datos operativos y de monitoreo en forma de registros (logs), métricas y eventos.** Da una vista unificada del estado operativo y visibilidad completa de recursos, aplicaciones y servicios de AWS que se ejecutan en AWS y en las instalaciones (on-premises).
- Puede usarse para: **detectar comportamientos anómalos**, **establecer alarmas**, comparar registros y métricas, **realizar acciones automatizadas**, resolver problemas y descubrir información para mantener el buen funcionamiento de las aplicaciones.

**Beneficios (diapositivas):**

| Beneficio | Detalle del material |
|---|---|
| Una sola plataforma para la observabilidad | Recopila métricas, registros y eventos de apps modernas (microservicios) y los correlaciona en una única plataforma; rompe silos de datos y da visibilidad de todo el sistema. |
| Recopilación de métricas en AWS y en las instalaciones | **Integrado de manera nativa con más de 70 servicios de AWS** (EC2, DynamoDB, S3, ECS, EKS, Lambda). Publica automáticamente **métricas detalladas de 1 minuto** y **métricas personalizadas con granularidad de hasta 1 segundo**. Entornos híbridos mediante el agente o la API de CloudWatch. |
| Mejora del rendimiento operativo y optimización de recursos | Establecer **alarmas** y **automatizar acciones** según umbrales predefinidos o algoritmos de **machine learning** que identifican comportamientos anómalos. Ej.: iniciar **EC2 Auto Scaling** automáticamente o detener una instancia para reducir facturas. **CloudWatch Events** para apps sin servidor: desencadenar flujos de trabajo con AWS Lambda, Amazon SNS y AWS CloudFormation. |
| Visibilidad y datos operativos | Vista operativa unificada, datos en tiempo real y referencia histórica. **Paneles (dashboards) automáticos**, datos con granularidad de **1 segundo** y hasta **15 meses de conservación** de métricas. Operaciones matemáticas sobre métricas (ej. sumar el uso de una flota de instancias EC2) -> **CloudWatch Metric Math**. |
| Información procesable de registros | **CloudWatch Logs Insights**: se **paga solo por las consultas que se ejecutan**, escala con el volumen de registros y complejidad de consultas, respuestas **en cuestión de segundos**. Puede **publicar métricas basadas en registros**, crear alarmas y correlacionar registros y métricas en paneles de CloudWatch. |

**Funcionamiento (diagrama de la diapositiva): cuatro etapas**

```
 Amazon CloudWatch: visibilidad completa de recursos y aplicaciones en la nube
   Collect  ->  Monitor  ->  Act  ->  Analyze
```

| Etapa | Qué hace |
|---|---|
| **Collect** (Recopilar) | Métricas y logs de todos los recursos AWS, aplicaciones y servicios que corren en AWS y en servidores on-premises. |
| **Monitor** (Monitorear) | Visualizar aplicaciones e infraestructura con **dashboards** de CloudWatch; correlacionar logs y métricas lado a lado para diagnosticar y definir alertas con **CloudWatch Alarms**. |
| **Act** (Actuar) | Automatizar respuesta a cambios operativos con **CloudWatch Events** y **Auto Scaling**. |
| **Analyze** (Analizar) | Métricas de hasta 1 segundo, retención extendida de datos (**15 meses**) y análisis en tiempo real con **CloudWatch Metric Math**. |

Casos de uso mostrados al lado del diagrama: Application Monitoring, System-wide Visibility, Resource Optimization, Unified Operational Health. Se pueden configurar acciones automatizadas (notificación, alarma, escalado automático) para **reducir el MTTR** (tiempo medio de resolución).

**Preguntas de cierre de la clase 1a** (para explicar con palabras propias): ¿Qué es monitoreo? ¿Qué diferencias hay entre reactivo y proactivo? ¿Qué métricas y herramientas hay en AWS?

### 1.2 Cloud observability (Clase 1b)

**Objetivos:** comprender qué es observabilidad; conocer cómo implementarla; conocer herramientas de software para observabilidad.

**Motivación:** imagen "System Failure" (fallas en sistemas distribuidos): en sistemas distribuidos hay fallas; se necesita visibilidad para detectarlas y entenderlas.

**Definición (fuente ayscom):** "En IT y en la nube, la observabilidad es la **capacidad de medir el estado actual de un sistema basándose en los datos que genera, como registros, métricas y trazas**. Se basa en la **telemetría** derivada de la **instrumentación** que proviene de los puntos finales y los servicios en sus entornos en la nube. En estos entornos modernos, cada componente de hardware, software e infraestructura de la nube y cada contenedor, herramienta de código abierto y microservicio genera registros de cada actividad. El **objetivo** de la observabilidad es **entender lo que está ocurriendo** en todos estos entornos y entre las tecnologías, para poder **detectar y resolver los problemas** y mantener sus sistemas **eficientes y fiables**."

**Cómo implementar observabilidad: los tres pilares** (más "User experience" en el esquema Full-Stack Observability de la diapositiva: Logs, Metrics, Traces, User Experience).

```
 Los 3 pilares de la Observabilidad
   Detección          ->   Resolución        ->   Causa raíz
   MÉTRICAS                TRAZAS                 REGISTROS (LOGS)
   ¿Tengo un problema?     ¿Dónde está el         ¿Qué está causando
                           problema?              el problema?
```

| Pilar | Definición del material | Valor / contenido |
|---|---|---|
| **Métricas (Metrics)** | **Datos numéricos** capturados a lo largo del tiempo. Pueden venir de servidores, aplicaciones, sensores IoT o casi cualquier máquina que genere datos marcados secuencialmente en el tiempo. Presentan una **medida** específica de un sistema a lo largo del **tiempo**. | Detección: responde "¿tengo un problema?". |
| **Trazas (Traces)** | Rastrean la **ruta de un evento a través de la red**; ayudan a identificar dónde ocurre un evento regularmente o se produce un **cuello de botella**. En entornos distribuidos (contenedores, microservicios) una solicitud viaja por varios sistemas; la traza incorpora la información para crear un **mapa de ese viaje**. | Captura: **intervalos (spans)** (nombre del servicio, nombre de la operación, duración y otros metadatos), **errores**, **duración de operaciones importantes** dentro de cada servicio, **atributos personalizados**. Resolución: "¿dónde está el problema?". |
| **Registros (Logs)** | Registrar los **eventos generados por el sistema** dentro de una aplicación; rastrean todo lo que pasa. Su mayor valor: dan **más información y contexto sobre por qué ocurrió un problema**, no solo los datos que identifican el evento. | Ejemplos: registros del sistema y servidor (syslog, journald); sistema de detección de intrusos y cortafuegos; feeds de redes sociales (Twitter, etc.); registros de aplicaciones/plataformas/servidores (log4j, log4net, opentelemetry, Apache, MySQL, AWS). Causa raíz: "¿qué está causando el problema?". |

**Software para observabilidad:** Gartner **Magic Quadrant for Application Performance Monitoring and Observability** (as of June 2023). Herramientas listadas en la diapositiva: **Dynatrace, Datadog, New Relic, Splunk, Honeycomb, Grafana**. En el cuadrante (imagen): Leaders: Dynatrace, Datadog, New Relic, Splunk, Honeycomb, ServiceNow (en la frontera con otros cuadrantes), Grafana Labs; Amazon Web Services aparece en el cuadrante Challengers/limite, junto a Cisco, Microsoft, IBM, Oracle; en Niche Players: Sumo Logic, SolarWinds, Broadcom, Riverbed, ManageEngine, Logz.io, Elastic (posición aproximada según la imagen; lo que se pide recordar son las herramientas listadas).

**Preguntas de cierre 1b:** ¿Qué es observabilidad de una aplicación? ¿Cómo implementarla? ¿Qué herramientas de SW recuerdas?

### 1.3 Concepto de Web Scraping (Taller 2, diapositivas de concepto)

- Cita: **"Extraer Legalmente el Contenido de la Web"**.
- "El web scraping se refiere al proceso de **extracción de contenidos y datos de sitios web mediante software**" (fuente Kinsta).
- Esquema: *Websites* (varias páginas www) -> *Web Scraping Software* -> **datos estructurados en archivo o base de datos** (base de datos, hoja de cálculo, JSON, CSV).
- Una diapositiva muestra "ejemplos de tipos de datos que puedes scrapear de la web" (imagen sin texto adicional en el material).

---

## 2. Laboratorio

### 2.1 Taller 1: CloudWatch (Métricas y Logs) con `api-pelicula`

**Objetivos del taller:**
1. Aprender a **registrar logs** en los Lambdas.
2. Aprender a **revisar logs de ejecución** de Lambdas en CloudWatch (ejecuciones correctas y errores).
3. Aprender a **consultar métricas** de Lambdas.
4. Aprender a **consultar logs** de Lambdas.

**Arquitectura:**

```
 Postman (POST) --> API Gateway (/pelicula/crear, integration: lambda)
                         |
                         v
                  Lambda api-pelicula-dev-crear (python3.12, 1024 MB, timeout 30s, LabRole)
                    |  print(event)    print(pelicula)         (stdout)
                    v                  v
              DynamoDB  dev-t_peliculas      CloudWatch Logs: grupo /aws/lambda/api-pelicula-dev-crear
              (PK tenant_id, SK uuid)        --> Logs Insights (queries)
```

Entorno: se trabaja en la **"MV Desarrollo"** (máquina virtual) con git, `sls` (Serverless Framework) y credenciales de AWS Academy.

#### Código base: `CrearPelicula.py` (completo y comentado)

```python
import boto3
import uuid
import os


def lambda_handler(event, context):
    # Entrada (json)
    print(event)  # Log json en CloudWatch  <- (flecha roja en el taller: log 1)
    tenant_id = event["body"]["tenant_id"]            # con integration: lambda el body llega en event["body"] como dict
    pelicula_datos = event["body"]["pelicula_datos"]
    nombre_tabla = os.environ["TABLE_NAME"]           # nombre de la tabla desde variable de entorno (serverless.yml)
    # Proceso
    uuidv4 = str(uuid.uuid4())                        # identificador único (será la Sort Key)
    pelicula = {
        "tenant_id": tenant_id,
        "uuid": uuidv4,
        "pelicula_datos": pelicula_datos,
    }
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(nombre_tabla)
    response = table.put_item(Item=pelicula)          # inserta en DynamoDB
    # Salida (json)
    print(pelicula)  # Log json en CloudWatch  <- (flecha roja: log 2)
    return {"statusCode": 200, "pelicula": pelicula, "response": response}
```

Puntos clave: `print(event)` registra la **entrada** (todo el evento de API Gateway, incluye `body`, `method`, `principalId`, `stage: "dev"`, `cognitoPoolClaims`, `headers`, `query`, `path`, `identity`, `stageVariables`, `requestPath: "/pelicula/crear"`); `print(pelicula)` registra la **salida/dato procesado**. Todo lo que se imprime con `print()` en Lambda va a **CloudWatch Logs**. Imprimir diccionarios (con comillas simples en Python) deja un log tipo JSON que Logs Insights puede descubrir automáticamente como campos (`tenant_id`, `pelicula_datos.nombre`...).

#### `serverless.yml` (completo)

```yaml
org: renzocuba                 # organización de Serverless (cambiar por la propia)
service: api-pelicula

provider:
  name: aws
  runtime: python3.12
  # Default memory size for functions (default: 1024MB)
  memorySize: 1024
  timeout: 30
  iam:
    role: arn:aws:iam::092781274895:role/LabRole   # cambiar por el ARN del LabRole propio
  environment:
    TABLE_NAME: ${sls:stage}-t_peliculas           # p.ej. dev-t_peliculas

functions:
  crear:
    handler: CrearPelicula.lambda_handler          # archivo.función
    events:
      - http:
          path: /pelicula/crear
          method: post
          cors: true
          integration: lambda

resources:
  Resources:
    TablaComentarios:                              # (nombre lógico del recurso en CloudFormation)
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
            KeyType: HASH                          # partition key
          - AttributeName: uuid
            KeyType: RANGE                         # sort key
        # Set the capacity to auto-scale
        BillingMode: PAY_PER_REQUEST
```

#### Ejercicio 1: Registrar logs en api-pelicula (pasos)

1. **Paso 1:** Analizar cómo se imprime en pantalla logs en formato JSON (los dos `print`).
2. **Paso 2:** Crear un repositorio en GitHub `api-pelicula` y subir los archivos indicados por el docente (contenido del ZIP `api-pelicula/`).
3. **Paso 3:** En la **MV Desarrollo**, descargar con `git clone`, **modificar en serverless.yml el `org` y el `role`** y **actualizar el archivo `credentials`** (credenciales AWS).
4. **Paso 4:** Desplegar con `$ sls deploy`.
5. **Paso 5:** Ejecutar en **Postman** e insertar las **7 películas** (`pelicula_01.json` ... `pelicula_06.json` y `pelicula_07_error.json`).

Datos de prueba (cuerpo de POST; tenant `CINEPLANET`):

| Archivo | nombre | fecha | genero | duracion_minutos |
|---|---|---|---|---|
| pelicula_01 | Super-Man: La Historia de Christopher Ree | 2024 | Documental | 104 |
| pelicula_02 | Beetlejuice Beetlejuice | 2024 | Terror | 110 |
| pelicula_03 | Godzilla Minus One Blanco y Negro | 2023 | Accion | 130 |
| pelicula_04 | Dalia y el Libro Rojo | 2023 | Animacion | 110 |
| pelicula_05 | El Apocalipsis de San Juan | 2023 | Documental | 120 |
| pelicula_06 | La Sustancia | 2024 | Terror | 140 |
| pelicula_07_error | Titanic (2007, Aventura, 170) | | | **JSON con clave `pelicula_patos` en vez de `pelicula_datos`** (provoca error) |

Ejemplo de JSON de entrada válido:

```json
{
    "tenant_id": "CINEPLANET",
    "pelicula_datos": {
        "nombre": "Beetlejuice Beetlejuice",
        "fecha": 2024,
        "genero": "Terror",
        "duracion_minutos": 110
    }
}
```

La séptima película es el caso de **error intencional**: `event["body"]["pelicula_datos"]` lanza `KeyError: 'pelicula_datos'` (línea 9 de `CrearPelicula.py`, según la captura).

#### Ejercicio 2: Ver logs en CloudWatch

Pasos (capturas del taller):
1. En la consola AWS abrir la **Lambda `api-pelicula-dev-crear`** (el diagrama muestra Lambda con API Gateway como desencadenador).
2. Pestaña **Monitorear** (Monitor) -> botón **"Ver registros de CloudWatch"**.
3. Se abre el **grupo de registros** `/aws/lambda/api-pelicula-dev-crear`, con un **flujo de registros (log stream)** por contenedor/fecha, p. ej. `2024/11/03/[$LATEST]87ad308...`.
4. En **Eventos de registro** se ven, por cada invocación, esta secuencia (ejemplo de la captura, zona horaria UTC):

```
INIT_START Runtime Version: python:3.12.v38 Runtime Version ARN: arn:aws:lambda:us-east-1::runtime:...   (solo cold start)
START RequestId: b5df1a01-e475-4368-8c37-e6346eed1357 Version: $LATEST
{'body': {'tenant_id': 'CINEPLANET', 'pelicula_datos': {...}}, 'method': 'POST', ...}     <- print(event)
{'tenant_id': 'CINEPLANET', 'uuid': '84d6f1bb-47be-4b8e-a9ff-31204106c482', 'pelicula_datos': {...}}   <- print(pelicula)
END RequestId: b5df1a01-e475-4368-8c37-e6346eed1357
REPORT RequestId: b5df1a01-... Duration: 391.75 ms Billed Duration: 392 ms Memory Size: 1024 MB Max Memory Used: ...
```

Observaciones: cada invocación = bloque **START / (prints) / END / REPORT** con el mismo `RequestId`. La primera invocación tuvo `INIT_START` (arranque en frío) y duró 391.75 ms (facturado 392 ms); la segunda 79.76 ms (facturado 80 ms). La línea **REPORT** contiene Duration, Billed Duration, Memory Size, Max Memory Used (son las "métricas" de la ejecución).

Herramienta recomendada: visualizar los logs JSON en **https://jsonviewer.stack.hu/** (pegar el JSON del `print` y ver el árbol: `body` -> `tenant_id`, `pelicula_datos` -> nombre, fecha, genero, duracion_minutos; `method: "POST"`, `stage: "dev"`, etc.). Al imprimir `pelicula` el árbol es: `tenant_id`, `uuid`, `pelicula_datos{...}`.

#### Ejercicio 3: Queries con Logs Insights — Métricas

Ir a **CloudWatch > Logs Insights**, seleccionar el grupo de registros (`/aws/lambda/api-pelicula-dev-crear`; se pueden seleccionar **máximo 50 grupos de registros**), elegir rango de tiempo (5m, 30m, 1h, 3h, 12h, personalizado; zona horaria UTC) y escribir la consulta.

Query 1 — todos los eventos en orden cronológico:

```
fields @timestamp, @message
| sort @timestamp asc
```

Query 2 — **métricas de ejecución** (solo líneas REPORT):

```
fields @timestamp, @message, @billedDuration, @memorySize, @requestId
| sort @timestamp asc
| filter @type = "REPORT"
```

Resultado esperado (captura): 7 filas (una por invocación; la última es la del error). `@billedDuration` = 392.0, 80.0, 81.0, 88.0, 80.0, 78.0, y **4.0** (la invocación fallida, 7.ª); `@memorySize` = 1.024E9 (1024 MB en bytes) en todas. Campos automáticos de Logs Insights de Lambda: `@timestamp`, `@message`, `@type`, `@billedDuration`, `@memorySize`, `@requestId` (también existen `@duration`, `@maxMemoryUsed`, etc. en Logs Insights, pero el material solo usa los listados).

#### Ejercicio 4: Queries con Logs Insights — Logs

Logs JSON con campos descubiertos automáticamente (`pelicula_datos.nombre`, etc.; los campos anidados se acceden con notación punto).

Query 3 — datos de las películas de un tenant, orden cronológico:

```
fields @timestamp, @message, pelicula_datos.nombre, pelicula_datos.genero, pelicula_datos.fecha, pelicula_datos.duracion_minutos
| sort @timestamp asc
| filter tenant_id = "CINEPLANET"
```
Resultado: 6 filas (las 6 películas válidas; Super-Man 104 Documental 2024; Beetlejuice 110 Terror 2024; Godzilla 130 Accion 2023; Dalia 110 Animacion 2023; Apocalipsis 120 Documental 2023; La Sustancia 140 Terror 2024).

Query 4 — ordenar por duración descendente:

```
fields @timestamp, @message, pelicula_datos.nombre, pelicula_datos.genero, pelicula_datos.fecha, pelicula_datos.duracion_minutos
| sort pelicula_datos.duracion_minutos desc
| filter tenant_id = "CINEPLANET"
```
Resultado: La Sustancia 140, Godzilla 130, Apocalipsis 120, Beetlejuice 110, Dalia 110, Super-Man 104.

Query 5 — filtrar por tenant **y** género:

```
fields @timestamp, @message, pelicula_datos.nombre, pelicula_datos.genero, pelicula_datos.fecha, pelicula_datos.duracion_minutos
| sort pelicula_datos.duracion_minutos desc
| filter tenant_id = "CINEPLANET" and pelicula_datos.genero = "Terror"
```
Resultado: La Sustancia (140) y Beetlejuice Beetlejuice (110).

Query 6 — **agregación** (conteo por género):

```
filter tenant_id = "CINEPLANET"
| stats count(*) by pelicula_datos.genero as genero
```
Resultado: Terror 2, Documental 2, Animacion 1, Accion 1.

#### Ejercicio 5: Queries con Logs Insights — Errores

Query 7:

```
fields @timestamp, @message
| sort @timestamp asc
| filter @message like "ERROR"
```
Resultado (captura): 1 fila: `[ERROR] KeyError: 'pelicula_datos' Traceback (most recent call last): File "/var/task/CrearPelicula.py", line 9, in lambda_handler ...` con timestamp 2024-11-03T14:17:16.613Z. Es el traceback que Lambda escribe automáticamente cuando hay una excepción no manejada; el `[ERROR]` lo añade el runtime de Lambda en el log.

#### Resumen de sintaxis de Logs Insights usada

| Comando | Uso | Ejemplo |
|---|---|---|
| `fields` | Elegir campos a mostrar | `fields @timestamp, @message` |
| `sort` | Ordenar (`asc` / `desc`) | `sort @timestamp asc` |
| `filter` | Filtrar filas; operadores `=`, `and`, `like` | `filter tenant_id = "CINEPLANET"` ; `filter @message like "ERROR"` |
| `stats ... by` | Agregar (count, etc.), con alias `as` | `stats count(*) by pelicula_datos.genero as genero` |
| Campos `@` | Campos del sistema | `@timestamp`, `@message`, `@type`, `@billedDuration`, `@memorySize`, `@requestId` |
| Campos JSON | Notación punto | `pelicula_datos.duracion_minutos` |

Los comandos se encadenan con el pipe `|`.

#### Ejercicio 6: Ejercicio propuesto (30 pts) — ver sección 3

#### Cierre Taller 1 (lo aprendido)
Registrar logs en Lambdas; revisar logs de ejecución en CloudWatch (correctas y errores); consultar métricas de Lambdas; consultar logs de Lambdas.

#### Errores comunes (Taller 1)
- **No cambiar `org` y `role`** en serverless.yml (el ARN `arn:aws:iam::092781274895:role/LabRole` pertenece a la cuenta del docente) o no actualizar `credentials` (AWS Academy cambia credenciales en cada sesión) -> el `sls deploy` falla.
- JSON de entrada con clave incorrecta (`pelicula_patos`) -> `KeyError: 'pelicula_datos'` (línea 9); sin try/except la Lambda falla.
- Olvidar seleccionar el **grupo de registros** correcto o el **rango de tiempo** en Logs Insights -> no aparecen resultados.
- Sin formato estándar, `filter @message like "ERROR"` solo atrapa el traceback del runtime.

---

### 2.2 Taller 2: Web Scraping en framework serverless

**Objetivos:** comprender qué es web scraping; realizar web scraping en la web de Bomberos (https://sgonorte.bomberosperu.gob.pe/24horas/?criterio=/).

**Arquitectura:**

```
 Cliente --GET--> API Gateway (/scrape/table) --> Lambda api-web-scraping-dev-scrape_table
                                                    |  requests.get(url) -> HTML
                                                    |  BeautifulSoup -> tabla -> filas (dict)
                                                    v
                                              DynamoDB TablaWebScrapping (PK id: S)
```
Resultado en consola del deploy: stage `dev`, región us-east-1, stack `api-web-scraping-dev`, tiempo (58s), endpoint `GET - https://<id>.execute-api.us-east-1.amazonaws.com/dev/scrape/table`, función `api-web-scraping-dev-scrape_table` de **1.7 MB** (por incluir las librerías).

#### Pasos (Ejercicio 1: Web Scraping de Web Bomberos)

1. **Paso 1:** Crear repositorio GitHub **`api-web-scraping`** y subir los archivos indicados por el docente, **previa actualización de `org` y `role`** en serverless.yml.
2. **Paso 2:** Ingresar a "MV Desarrollo".
3. **Paso 3:** Actualizar el archivo **`credentials`** en `/home/ubuntu/.aws`.
4. **Paso 4:** Ir a `/home/ubuntu/lambdas/` y descargar el repo con `git clone`.
5. **Paso 5:** Instalar las **librerías no estándar de python3 en el mismo directorio** y verificar:
   ```bash
   pip3 install -r requirements.txt -t .
   ```
   (`-t .` = target: instalar en el directorio actual, para que queden empaquetadas con la Lambda.) Se verifica con `ls -l`: aparecen carpetas `bs4`, `beautifulsoup4-4.9.3.dist-info`, `requests`, `requests-2.25.1.dist-info`, `certifi`, `chardet`, `idna`, `urllib3`, `soupsieve` junto a `scrap_table.py`, `serverless.yml`, `requirements.txt`. En serverless.yml se necesita `package: include: - ./**` para **incluir todo el contenido del directorio** (marcado en rojo en el taller).
6. **Paso 6:** Desplegar y verificar: `sls deploy`.
7. **Paso 7:** Verificar en **DynamoDB** que se grabó la información de la web: la tabla muestra 123 elementos devueltos (coinciden con "Resultado de la búsqueda: 123 registro(s)" de la web), con campos `id` (UUID), `#`, `Dirección / Distrito`, `Estado` (p. ej. ATENDIENDO), `Fecha y hora`, etc.

#### `requirements.txt` (del ZIP)

```text
beautifulsoup4==4.9.3
requests==2.25.1
```

#### `serverless.yml` (completo)

```yaml
org: renzocuba
service: api-web-scraping

provider:
  name: aws
  runtime: python3.12
  # Default memory size for functions (default: 1024MB)
  memorySize: 1024
  timeout: 30
  iam:
    role: arn:aws:iam::092781274895:role/LabRole

functions:
  scrape_table:
    handler: scrap_table.lambda_handler  # Asegúrarse de que el nombre del archivo y la función coincidan
    package:
      include:
        - ./**  # Incluir todo el contenido del directorio
    events:
      - http:
          path: /scrape/table
          method: get
          cors: true
          integration: lambda

resources:
  Resources:
    TablaWebScrapping:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: TablaWebScrapping
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH
        BillingMode: PAY_PER_REQUEST
```

#### `scrap_table.py` (completo, comentado)

```python
import requests
from bs4 import BeautifulSoup
import boto3
import uuid


def lambda_handler(event, context):
    # URL de la página web que contiene la tabla
    url = "https://sgonorte.bomberosperu.gob.pe/24horas/?criterio=/"

    # Realizar la solicitud HTTP a la página web
    response = requests.get(url)
    if response.status_code != 200:
        return {
            "statusCode": response.status_code,
            "body": "Error al acceder a la página web",
        }

    # Parsear el contenido HTML de la página web
    soup = BeautifulSoup(response.content, "html.parser")

    # Encontrar la tabla en el HTML
    table = soup.find("table")
    if not table:
        return {"statusCode": 404, "body": "No se encontró la tabla en la página web"}

    # Extraer los encabezados de la tabla
    headers = [header.text for header in table.find_all("th")]

    # Extraer las filas de la tabla
    rows = []
    for row in table.find_all("tr")[1:]:  # Omitir el encabezado
        cells = row.find_all("td")
        rows.append({headers[i + 1]: cell.text for i, cell in enumerate(cells)})
        # (headers[i+1]: se desplaza 1 porque el primer <th> se omite en el mapeo)

    # Guardar los datos en DynamoDB
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("TablaWebScrapping")

    # Eliminar todos los elementos de la tabla antes de agregar los nuevos
    scan = table.scan()
    with table.batch_writer() as batch:
        for each in scan["Items"]:
            batch.delete_item(Key={"id": each["id"]})

    # Insertar los nuevos datos
    i = 1
    for row in rows:
        row["#"] = i
        row["id"] = str(uuid.uuid4())  # Generar un ID único para cada entrada
        table.put_item(Item=row)
        i = i + 1

    # Retornar el resultado como JSON
    return {"statusCode": 200, "body": rows}
```

Flujo lógico: (1) GET a la URL, (2) validar `status_code == 200`, (3) parsear con BeautifulSoup `html.parser`, (4) `soup.find("table")`, (5) encabezados con `find_all("th")`, (6) filas con `find_all("tr")[1:]` y celdas `find_all("td")`, (7) borrar la tabla DynamoDB (scan + `batch_writer` + `delete_item`), (8) insertar cada fila con `id` = `uuid4` y `#` correlativo con `put_item`, (9) devolver `{"statusCode":200,"body":rows}`.

#### Código extra del directorio `mats2` (variante para sismos IGP — ejercicio propuesto)

No aparece en las diapositivas, pero está en la carpeta de materiales: `scrap_table2.py` + `serverless2.yml` + `requirements2.txt` (`requests==2.25.1`, sin BeautifulSoup). En vez de parsear HTML, consume un **API JSON** del IGP.

```python
import requests
import boto3
import uuid
from datetime import datetime

API_URL = "https://ultimosismo.igp.gob.pe/api/ultimo-sismo/ajaxb/{year}"
DYNAMO_TABLE = "TablaWebScrapping2"

COLUMNS = [
    "codigo", "fecha_local", "hora_local", "latitud", "longitud",
    "magnitud", "profundidad", "referencia", "intensidad",
    "reporte_acelerometrico_pdf",
]

def lambda_handler(event, context):
    year = event.get("year", datetime.utcnow().year)       # año por defecto: el actual

    response = requests.get(API_URL.format(year=year), timeout=30)
    if response.status_code != 200:
        return {"statusCode": response.status_code,
                "body": f"Error al acceder a la API: {response.status_code}"}

    data = response.json()
    if not isinstance(data, list):
        return {"statusCode": 500, "body": "Formato de respuesta inesperado"}

    # Normaliza cada item a str con solo las columnas deseadas
    rows = [{col: str(item.get(col, "") or "") for col in COLUMNS} for item in data]

    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(DYNAMO_TABLE)

    scan = table.scan(ProjectionExpression="id")            # solo trae la clave
    with table.batch_writer() as batch:                     # borra lo anterior
        for each in scan["Items"]:
            batch.delete_item(Key={"id": each["id"]})

    with table.batch_writer() as batch:                     # inserta lo nuevo
        for row in rows:
            row["id"] = str(uuid.uuid4())
            batch.put_item(Item=row)

    return {"statusCode": 200, "body": rows}
```

`serverless2.yml` difiere solo en: función `scrape_table2` (handler `scrap_table2.lambda_handler`), `path: /scrape/table2`, `method: get`, tabla `TablaWebScrapping2` (PK `id` tipo S, PAY_PER_REQUEST). Nótese que esta versión carga **todos** los sismos del año (no solo 10); para cumplir "10 últimos" habría que recortar la lista (`data[:10]`), lo cual no está en el material (inferencia, ver sección 3).

#### Errores comunes (Taller 2)
- Olvidar `pip3 install -r requirements.txt -t .` -> `ModuleNotFoundError: No module named 'bs4'/'requests'` en la Lambda.
- Olvidar `package: include: ./**` -> las librerías instaladas no se empaquetan.
- Clave `id` ausente al borrar: se usa `Key={"id": ...}`; debe coincidir con el KeySchema.
- Cambiar nombres de archivo/función sin ajustar `handler` (el comentario del yml: "Asegúrarse de que el nombre del archivo y la función coincidan").
- Si la página cambia de estructura o no hay `<table>` -> responde 404 "No se encontró la tabla en la página web".
- `scan` devuelve hasta 1 MB por llamada (limitación general de DynamoDB; no figura en el material).

#### Cierre Taller 2
Qué es Web Scraping; Web Scraping en la web de Bomberos.

---

## 3. Ejercicios propuestos

### 3.1 Taller 1 — Ejercicio propuesto (30 pts; entrega 2026-11-09)

**Enunciado:** Modificar `CrearPelicula.py`:
1. Agregar la estructura de manejo de errores `try ... except`.
2. Estandarizar el formato JSON de log para ejecuciones correctas (`"INFO"`) y errores (`"ERROR"`):
   ```
   { "tipo": "INFO" / "ERROR", "log_datos": { ... } }
   ```
3. Modificar el `print()` para que imprima ese formato estándar tanto en éxito como en error.
4. Realizar queries sobre el nuevo formato estándar.
5. (En el PDF) Subir evidencias al padlet.

**Solución/enfoque (propuesta basada en el código del taller; el material no incluye solución oficial):**

```python
import boto3
import uuid
import os
import json


def lambda_handler(event, context):
    try:
        # Entrada (json)
        tenant_id = event["body"]["tenant_id"]
        pelicula_datos = event["body"]["pelicula_datos"]
        nombre_tabla = os.environ["TABLE_NAME"]
        # Proceso
        uuidv4 = str(uuid.uuid4())
        pelicula = {
            "tenant_id": tenant_id,
            "uuid": uuidv4,
            "pelicula_datos": pelicula_datos,
        }
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table(nombre_tabla)
        response = table.put_item(Item=pelicula)
        # Log estándar de éxito
        print(json.dumps({"tipo": "INFO", "log_datos": pelicula}))
        return {"statusCode": 200, "pelicula": pelicula, "response": response}
    except Exception as e:
        # Log estándar de error
        print(json.dumps({
            "tipo": "ERROR",
            "log_datos": {"mensaje": str(e), "event": event}
        }))
        return {"statusCode": 500, "error": str(e)}
```

Notas: usar `json.dumps` produce JSON válido (comillas dobles) que Logs Insights descubre como campos `tipo` y `log_datos.*`. (Nota: en el enunciado figura `"tipo" = ...` con `=`, que es un error tipográfico; JSON válido usa `:`.)

Queries sobre el nuevo formato (ejemplos):

```
fields @timestamp, tipo, log_datos.tenant_id, log_datos.pelicula_datos.nombre
| filter tipo = "INFO"
| sort @timestamp asc

fields @timestamp, tipo, log_datos.mensaje
| filter tipo = "ERROR"

stats count(*) by tipo
```

Pruebas: insertar las películas 01-06 (INFO) y la 07 con `pelicula_patos` (ERROR por `KeyError: 'pelicula_datos'`).

### 3.2 Taller 2 — Ejercicio propuesto (30 pts; entrega 2026-11-09)

**Enunciado:** Implementar un API con el framework serverless para hacer **Web Scraping a los 10 últimos sismos reportados por el IGP** (https://ultimosismo.igp.gob.pe/productos/reportes-sismicos) y almacenarlos en una **tabla DynamoDB**. (PDF: subir evidencia al padlet indicado.)

**Enfoque basado en el material:** reutilizar la estructura del Taller 2: repo `api-web-scraping` nuevo, `serverless.yml` con función GET (`/scrape/...`), tabla DynamoDB con PK `id` (S), `requirements.txt` (requests; beautifulsoup4 si se parsea HTML), `pip3 install -r requirements.txt -t .`, `sls deploy`. Dos vías: (a) parsear el HTML de la tabla con BeautifulSoup como en `scrap_table.py`; (b) consumir el endpoint JSON del IGP como en `scrap_table2.py` (`https://ultimosismo.igp.gob.pe/api/ultimo-sismo/ajaxb/{year}`) y quedarse con los 10 primeros elementos (p. ej. `data[:10]`; el código de ejemplo guarda todos los del año). Campos que guarda la variante: codigo, fecha_local, hora_local, latitud, longitud, magnitud, profundidad, referencia, intensidad, reporte_acelerometrico_pdf, más `id` UUID.

---

## 4. Conexiones teoría <-> laboratorio

| Teoría | Laboratorio |
|---|---|
| **Logs** (pilar: contexto de por qué ocurrió el problema) | `print()` en Lambda -> CloudWatch Logs; log group `/aws/lambda/api-pelicula-dev-crear`; evento START/END/REPORT. |
| **Métricas** (datos numéricos en el tiempo) | Línea REPORT: `@billedDuration`, `@memorySize`; query con `filter @type = "REPORT"`. |
| **Causa raíz** (logs responden "¿qué causa el problema?") | Película 07 -> `[ERROR] KeyError: 'pelicula_datos'` ... `CrearPelicula.py, line 9`, hallado con `filter @message like "ERROR"`. |
| CloudWatch **Logs Insights**: pago por consulta, respuestas en segundos | Queries con `fields/sort/filter/stats`. |
| CloudWatch recopila logs, métricas y eventos; "Collect -> Monitor -> Act -> Analyze" | Collect: Lambda envía logs automáticamente; Analyze: Logs Insights; (Monitor/Act con alarmas y Auto Scaling no se practican en el taller). |
| Reactivo vs proactivo: observabilidad = "por qué" | Formato de log estándar INFO/ERROR (ejercicio propuesto) permite análisis estructurado y detección sistemática de errores en vez de revisar a mano. |
| Trazas (no se practican) | El taller no usa trazas; solo logs y métricas. |
| Web scraping: extraer datos de sitios web mediante software y guardarlos en BD/JSON/CSV | Lambda + requests + BeautifulSoup -> DynamoDB (`TablaWebScrapping`); 123 registros web = 123 ítems. |
| Microservicios/serverless (Lambda, API Gateway, DynamoDB integrados con CloudWatch) | Todos los talleres se despliegan con Serverless Framework: Lambda + API Gateway + DynamoDB; logs en CloudWatch sin configuración adicional. |

---

## 5. Preguntas tipo examen

1. **¿Qué es el monitoreo de infraestructura y aplicaciones?** Una estrategia de gestión / flujo de trabajo operativo que evalúa recursos informáticos y aplicaciones para obtener visibilidad del rendimiento, el estado y la disponibilidad de los servicios que se ejecutan en cualquier infraestructura.
2. **Diferencia entre monitoreo reactivo y observabilidad (proactivo).** El monitoreo detecta **dónde/qué/cuándo** fallan las cosas (reactivo, datos dispersos, monitoreo por componente, poco análisis de causa raíz). La observabilidad permite saber **por qué/cómo**, es la evolución del monitoreo: proactiva, predictiva, automatizada, con datos integrados y monitoreo full-stack.
3. **Defina observabilidad.** Capacidad de medir el estado actual de un sistema a partir de los datos que genera (registros, métricas y trazas), basada en telemetría derivada de la instrumentación; su objetivo es entender qué ocurre en los entornos para detectar y resolver problemas y mantener sistemas eficientes y fiables.
4. **¿Cuáles son los tres pilares de la observabilidad y qué pregunta responde cada uno?** Métricas -> detección (¿tengo un problema?); Trazas -> resolución (¿dónde está el problema?); Registros/Logs -> causa raíz (¿qué está causando el problema?). (El esquema Full-Stack Observability también añade User Experience.)
5. **¿Qué son las métricas?** Datos numéricos capturados a lo largo del tiempo, de servidores, aplicaciones, sensores IoT, etc.; una medida específica de un sistema en el tiempo.
6. **¿Qué es una traza y qué información captura?** Rastrea la ruta de un evento/solicitud a través de sistemas distribuidos (microservicios, contenedores), identificando cuellos de botella; captura intervalos (servicio, operación, duración, metadatos), errores, duración de operaciones importantes y atributos personalizados.
7. **¿Qué son los logs y para qué sirven? Dé ejemplos.** Registros de eventos generados por el sistema dentro de una aplicación; dan contexto de por qué ocurrió un problema. Ejemplos: syslog, journald, logs de IDS/firewalls, log4j, log4net, opentelemetry, Apache, MySQL, AWS.
8. **Nombre al menos cuatro herramientas de software para observabilidad.** Dynatrace, Datadog, New Relic, Splunk, Honeycomb, Grafana (Gartner Magic Quadrant APM and Observability, junio 2023).
9. **¿Qué es Amazon CloudWatch y qué datos recopila?** Servicio de monitoreo y observabilidad de AWS que recopila datos operativos y de monitoreo en forma de **registros, métricas y eventos**, de recursos en AWS y on-premises; permite alarmas, acciones automatizadas, dashboards y análisis.
10. **Cifras de CloudWatch mencionadas en clase.** Más de 70 servicios AWS integrados nativamente; métricas detalladas de 1 minuto; métricas personalizadas hasta 1 segundo; retención de métricas hasta 15 meses; Logs Insights se paga solo por consultas ejecutadas.
11. **Describa las etapas Collect, Monitor, Act, Analyze de CloudWatch.** Collect: métricas y logs de AWS/on-premises; Monitor: dashboards, correlación de logs y métricas, CloudWatch Alarms; Act: automatizar respuestas con CloudWatch Events y Auto Scaling; Analyze: métricas de 1 s, retención 15 meses, Metric Math.
12. **¿Cómo se registran logs en una Lambda de Python y dónde se ven?** Con `print()` (stdout) en el handler; se ven en CloudWatch Logs en el grupo `/aws/lambda/<nombre-función>` (p. ej. `/aws/lambda/api-pelicula-dev-crear`), accesible desde la pestaña Monitorear -> "Ver registros de CloudWatch".
13. **¿Qué líneas genera Lambda por invocación y qué contiene REPORT?** START RequestId, los prints, END RequestId, REPORT RequestId con Duration, Billed Duration, Memory Size, Max Memory Used (y INIT_START en arranque en frío).
14. **Escriba la query de Logs Insights que muestre RequestId, memoria y duración facturada de cada ejecución ordenadas por tiempo.**
    ```
    fields @timestamp, @message, @billedDuration, @memorySize, @requestId
    | sort @timestamp asc
    | filter @type = "REPORT"
    ```
15. **Escriba la query que cuente películas de CINEPLANET por género.**
    ```
    filter tenant_id = "CINEPLANET"
    | stats count(*) by pelicula_datos.genero as genero
    ```
    Resultado del taller: Terror 2, Documental 2, Animacion 1, Accion 1.
16. **Escriba la query para películas de terror de CINEPLANET ordenadas por duración descendente.**
    ```
    fields @timestamp, @message, pelicula_datos.nombre, pelicula_datos.genero, pelicula_datos.fecha, pelicula_datos.duracion_minutos
    | sort pelicula_datos.duracion_minutos desc
    | filter tenant_id = "CINEPLANET" and pelicula_datos.genero = "Terror"
    ```
17. **¿Por qué falló la película 07 y cómo se encuentra el error?** Porque el JSON trae `pelicula_patos` en vez de `pelicula_datos` -> `KeyError: 'pelicula_datos'` en la línea 9 de CrearPelicula.py. Se encuentra con `fields @timestamp, @message | sort @timestamp asc | filter @message like "ERROR"`. Su REPORT mostró billed duration 4 ms.
18. **¿Cómo estandarizaría el log para INFO y ERROR?** JSON `{"tipo": "INFO"|"ERROR", "log_datos": {...}}` impreso con `print(json.dumps(...))` dentro de `try` (INFO) y `except` (ERROR); así se pueden filtrar con `filter tipo = "ERROR"`.
19. **¿Qué es Web Scraping?** Proceso de extracción de contenidos y datos de sitios web mediante software, produciendo datos estructurados (BD, JSON, CSV...). Se enfatiza hacerlo "legalmente".
20. **Pasos para desplegar el API de scraping y por qué `pip3 install -r requirements.txt -t .`.** Repo GitHub -> editar org y role -> credentials en `/home/ubuntu/.aws` -> clone en `/home/ubuntu/lambdas/` -> `pip3 install -r requirements.txt -t .` -> `sls deploy` -> verificar en DynamoDB. `-t .` instala las librerías no estándar (bs4, requests) en el directorio del proyecto para que `package: include: ./**` las empaquete en la Lambda (el despliegue pesa 1.7 MB).

---

## 6. Cheat-sheet

### Logs Insights (de memoria)

```
fields @timestamp, @message
| sort @timestamp asc
| filter @type = "REPORT"                    # métricas Lambda: @billedDuration, @memorySize, @requestId
| filter @message like "ERROR"               # errores
| filter tenant_id = "X" and a.b = "Y"       # campos JSON anidados con punto
| stats count(*) by campo as alias           # agregación
| sort campo desc
```
Se puede seleccionar hasta 50 grupos de registros; el grupo Lambda es `/aws/lambda/<service>-<stage>-<función>`.

### Estructura de log estándar y try/except

```python
try:
    ...
    print(json.dumps({"tipo": "INFO", "log_datos": {...}}))
except Exception as e:
    print(json.dumps({"tipo": "ERROR", "log_datos": {"mensaje": str(e)}}))
```

### serverless.yml mínimo (Lambda + API + DynamoDB)

```yaml
org: <org>
service: <servicio>
provider:
  name: aws
  runtime: python3.12
  memorySize: 1024
  timeout: 30
  iam:
    role: arn:aws:iam::<cuenta>:role/LabRole
  environment:
    TABLE_NAME: ${sls:stage}-t_x
functions:
  fn:
    handler: archivo.lambda_handler
    package:
      include:
        - ./**
    events:
      - http:
          path: /ruta
          method: post|get
          cors: true
          integration: lambda
resources:
  Resources:
    Tabla:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.TABLE_NAME}
        AttributeDefinitions:
          - {AttributeName: pk, AttributeType: S}
          - {AttributeName: sk, AttributeType: S}
        KeySchema:
          - {AttributeName: pk, KeyType: HASH}
          - {AttributeName: sk, KeyType: RANGE}
        BillingMode: PAY_PER_REQUEST
```

### Python/boto3 esenciales

```python
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(nombre)
table.put_item(Item=item)
scan = table.scan()                       # scan["Items"]
with table.batch_writer() as batch:
    batch.delete_item(Key={"id": x["id"]})
    batch.put_item(Item=item)
os.environ["TABLE_NAME"]; str(uuid.uuid4())
```

### Web scraping (requests + BeautifulSoup)

```python
r = requests.get(url);  r.status_code; r.content; r.json()
soup = BeautifulSoup(r.content, "html.parser")
table = soup.find("table")
headers = [h.text for h in table.find_all("th")]
for row in table.find_all("tr")[1:]:
    cells = row.find_all("td")
```

### Comandos

```bash
git clone <repo>
pip3 install -r requirements.txt -t .
sls deploy
```
Archivo credenciales: `/home/ubuntu/.aws/credentials`. Código de taller en `/home/ubuntu/lambdas/`.

### Datos para recordar
- Monitoreo = dónde/qué/cuándo (reactivo); observabilidad = por qué/cómo (proactivo, evolución; ganó terreno en 2018).
- 3 pilares: métricas (detección), trazas (resolución/dónde), logs (causa raíz).
- CloudWatch: logs + métricas + eventos; 70+ servicios; 1 min estándar, 1 s personalizadas; 15 meses; Collect-Monitor-Act-Analyze; Logs Insights paga por consulta.
- Herramientas: Dynatrace, Datadog, New Relic, Splunk, Honeycomb, Grafana.
- JSON viewer: https://jsonviewer.stack.hu/
