# Semana 15 — Desarrollo ágil, Inteligencia Artificial (Rekognition) y Protección de Secretos

> Curso CS2032 Cloud Computing (Ciclo 2026-2). Docente: Geraldo Colchado. Taller 2 con apoyo de José Paca (exalumno).
> Este documento reemplaza el estudio de todos los PDF, ZIP y el .md de la semana 15. Lo que **no** está en el material y es aporte de este resumen (p. ej. código de solución de ejercicios) se marca como *[Propuesta]*.

---

## 0. Mapa de materiales revisados

| Archivo | Tipo | Resumen de 1 línea |
|---|---|---|
| `teoria/semana-15/1. Otros tópicos - Teoría 2 - V1.00.pdf` (17 pág.) | Teoría | Clase 1 "Desarrollo ágil de software": ágil vs tradicional, Scrum (roles, proceso), entornos de desarrollo, DevOps. |
| `laboratorio/semana-15/1. Inteligencia Artificial - Teoría - V1.00.pdf` (13 pág.) | Teoría adicional | Definición de IA, casos de uso y servicios de IA/ML de AWS (Polly, Transcribe, Comprehend, Lex, Rekognition, Textract, SageMaker, Forecast, Fraud Detector, Personalize, Bedrock). |
| `laboratorio/semana-15/1. Taller Visión Artificial - V1.00.pdf` (20 pág.) | Taller 1 (prioridad) | Demos de Amazon Rekognition (imágenes y video) y API REST serverless que detecta etiquetas en una imagen de S3. |
| `laboratorio/semana-15/Taller Secretos - V1.10.pdf` (25 pág.) | Taller 2 (prioridad) | Concepto de secreto; Parameter Store vs Secrets Manager; RDS MySQL dev/test/prod; API Lambda que lee secretos de SSM; ejercicio de rotación. |
| `laboratorio/semana-15/Materiales S15 - Taller 1.zip` | ZIP Taller 1 | `DetectarEtiquetas.py`, `serverless.yml`, colección Postman, imágenes de prueba (etiquetas, famosos, texto, EPI) y copia del PDF del taller. |
| `laboratorio/semana-15/Materiales S15 - Taller 2.zip` | ZIP Taller 2 | `ListarAlumnos.py`, `serverless.yml`, `requirements.txt`, `comandos.txt` (CLI+SQL), `modificar_password.txt`, diagrama `Secretos.drawio(.png)` y copia del PDF. |
| `laboratorio/semana-15/S15 Taller 2 - Ejercicio Propuesto.md` | Ejercicio | Entrega 2026-11-29, 50 pts: Ej.1 (20) migrar a Secrets Manager; Ej.2 (30) rotación cada 10 min con EventBridge+Lambda. |

Notas de revisión: los PDF dentro de los ZIP son idénticos a los PDF sueltos (mismo tamaño). Se ignoró `__MACOSX` (no había). El PNG `Secretos.drawio.png` es una versión **anterior** del diagrama de la diapositiva (usa nombres `svc_dev/svc_test/svc_prod` y "password"; la diapositiva usa `user_dev/user_test/user_prod`). Las imágenes de prueba (JPG/PNG de famosos, vehículo, EPI) son solo insumos de las demos; no hay más texto sobre ellas en el material.

---

## 1. Teoría

### 1.1 Desarrollo ágil de software (Clase 1 – "Otros tópicos")

**Objetivos de la sesión:** diferenciar metodología ágil vs tradicional; conocer a alto nivel Scrum; comprender la importancia de los entornos de desarrollo de software; tener nociones de DevOps.

**Contenido:** 1 Objetivo, 2 Ágil vs Tradicional, 3 Scrum, 4 Entornos de desarrollo, 5 DevOps, 6 Cierre.

#### 1.1.1 Metodología Ágil vs Tradicional

Definiciones literales de la diapositiva (fuente: eniun.com):

- **Tradicional:** "se define el proyecto desde el inicio y se crea un plan detallado con **contratos estrictos**."
- **Ágil:** "se comienza definiendo las **funcionalidades básicas** del proyecto garantizando la **entrega continua de software de valor** que se va mejorando de forma continuada en cada iteración. En lugar de contratos estrictos, se mantienen **reuniones constantes con el cliente** y se **adapta el proyecto a sus necesidades**."

| Aspecto | Tradicional | Ágil |
|---|---|---|
| Definición del proyecto | Todo se define al inicio, plan detallado | Se empieza por funcionalidades básicas |
| Relación con cliente | Contratos estrictos | Reuniones constantes con el cliente |
| Entrega | Fases secuenciales; el despliegue llega al final | Entrega continua de software de valor, mejorado en cada iteración |
| Cambio | Se resiste (plan cerrado) | Se adapta al cambio |
| Estructura (diagrama) | Una sola línea de fases: **Plan → Análisis → Diseño → Construcción → Prueba → Despliegue** | Iteración 1, N, N+1: cada iteración repite el ciclo Plan, Análisis, Diseño, Construcción, Prueba, Despliegue |

Diagrama (de la diapositiva):

```
TRADICIONAL (una pasada, secuencial):
 [Plan] -> [Análisis] -> [Diseño] -> [Construcción] -> [Prueba] -> [Despliegue]

ÁGIL (iteraciones, cada una con el ciclo completo):
 ( Iter.1: Plan-Análisis-Diseño-Construcción-Prueba-Despliegue )
   -> ( Iter.N ... ) -> ( Iter.N+1 ... )   => valor entregado continuamente
```

#### 1.1.2 Metodología Scrum

Citas de la diapositiva (fuente eniun.com):

- Scrum es "una metodología de **desarrollo ágil de software** que ayuda a los equipos a **desarrollar productos en periodos cortos**, permitiendo obtener de forma rápida **feedback por parte del cliente**, adaptaciones y una mejora continuada."
- El desarrollo ágil (*Agile Methodology*) "es una metodología de desarrollo de software basada en el **desarrollo iterativo e incremental**, donde los requisitos y soluciones van evolucionando según las necesidades del proyecto."
- "En las metodologías ágiles la **adaptación al cambio** forma parte del proceso natural del proyecto."

**Roles Scrum** (diagrama "Equipo Central de Scrum"):

| Rol | Características (de la diapositiva) | Función |
|---|---|---|
| **Cliente / Stakeholder** | Externo al equipo central | Proporciona sus requerimientos al Product Owner; recibe lanzamientos incrementales del producto. |
| **Product Owner (Dueño del Producto)** — "Voz del cliente" | 1 persona, tiempo parcial o completo. Orientada al negocio | Comunica los requerimientos empresariales priorizados al Equipo Scrum; elabora el **Backlog de Producto Priorizado** y define los **Criterios de Aceptación**; entrega el valor del negocio al cliente mediante lanzamientos incrementales. |
| **Scrum Master** | 1 persona, tiempo parcial o completo. **Coach y facilitador** de Scrum | Asegura un ambiente laboral adecuado al Equipo Scrum. |
| **Equipo de Desarrollo (Equipo Scrum)** | De **3 a 9** personas a tiempo completo (recomendado). Especialistas | Crea los entregables del proyecto; demuestra el incremento del producto al Product Owner en la **reunión de revisión del sprint**. |

```
Cliente/Stakeholder --requerimientos--> Product Owner <--> Scrum Master
        ^                                      |                |
        |----- lanzamientos incrementales -----|                v
                                        Equipo Scrum (3-9) <----+
                         (demuestra incremento en la revisión del sprint)
```

**Proceso Scrum** (dos diagramas; los valores aparecen en ellos):

| Elemento | Detalle |
|---|---|
| **Product Backlog** (funcionalidades del producto) | Lista de funcionalidades/historias de usuario, épicas, diseño de arquitectura, proceso de negocio y características; lo gestiona el responsable del producto (Product Owner). |
| **Reunión de Planificación** | Equipo selecciona del Product Backlog las tareas del sprint (en el diagrama detallado: reunión de planificación del sprint, **hasta 8 horas**). |
| **Sprint Backlog** | Tareas asignadas al sprint. |
| **Sprint** | Iteración de **2-4 semanas** (diagrama 1) / **1-4 semanas** (diagrama 2). "Sin cambios en duración ni objetivos". Se mide con gráfico de evolución (**burndown chart**). |
| **Reunión diaria (Daily)** | Cada **24 horas**; dura **15 minutos** (diagrama 2). Participa el Scrum Master. |
| **Revisión del sprint** | **2-4 horas**; se presenta/demuestra el incremento. |
| **Retrospectiva** | **1-3 horas**; el equipo reflexiona sobre el sprint y mejora; realimenta el siguiente ciclo (flecha de vuelta al product backlog). |

Diagrama:

```
Product Backlog -> [Reunión de Planificación (<=8h)] -> Sprint Backlog
     -> SPRINT (1-4 sem; Reunión diaria 15 min cada 24 h)
     -> Revisión del Sprint (2-4 h) -> Retrospectiva (1-3 h) -> (vuelve al Product Backlog / siguiente sprint)
```

> Nota: las dos diapositivas dan rangos distintos para el sprint (2-4 vs 1-4 semanas); ambos aparecen en el material. Para el examen conviene decir "sprint corto de pocas semanas (1/2 a 4)".

#### 1.1.3 Entornos de desarrollo de software

Dos infografías (EDteam). Entornos y propósito:

| # | Entorno | Descripción (diapositiva) |
|---|---|---|
| 1 | **Desarrollo local** | Lo que el programador ve en su computadora; donde trabaja cada programador. |
| 2 | **Integración** (solo en la 2.ª infografía, 5 entornos) | Se unen los cambios de todos los programadores y se usan pruebas automatizadas para corregir conflictos. |
| 3 (o 2) | **Pruebas** | Los testers prueban el software/producto para encontrar o reportar fallas. |
| 4 (o 3) | **Staging** | Copia del entorno de producción para probar el software antes de lanzarlo al público; pruebas de confiabilidad. |
| 5 (o 4) | **Producción** | Lo que el usuario final ve; publicación final de los cambios con los que interactúa el usuario final. |

```
Versión 4 entornos: Desarrollo local -> Pruebas -> Staging -> Producción
Versión 5 entornos: Desarrollo local -> Integración -> Pruebas -> Staging -> Producción
```

Conexión con el laboratorio: el Taller 2 implementa justamente tres ambientes (**dev, test, prod**) con esquemas, usuarios y despliegues (`sls deploy --stage ...`) separados.

#### 1.1.4 DevOps

- **Qué es (diapositiva):** una **cultura de buenas prácticas** que **integra las tareas de desarrollo y operaciones**, asegurando la **entrega de nuevas funcionalidades y la estabilidad del proyecto de forma continua y rápida**.
  - **Dev:** los developers crean las funcionalidades del proyecto.
  - **Ops:** Operaciones se encarga de la estabilidad e infraestructura (nube).
- **CI (Continuous Integration):** el código de los programadores se integra automáticamente usando tests.
- **CD (Continuous Deployment):** se hace build, pruebas y despliegue a producción automático (flujo: Build → Test → Test → Deploy).
- **Ciclo infinito (∞) Dev/Ops** del segundo diagrama: **Plan → Code → Build → Test → Release → Deploy → Operate → Monitor** (y vuelve a Plan). Elementos asociados mostrados: Source Code, Version Control, Development, Automation, Quality Control (lado Dev); Infrastructure as Code, Provisioning, Configuration Management, Virtualization, Containerization, Visualizations, Logging (lado Ops); y al centro Continuous Integration / Continuous Delivery or Deployment (CI/CD).

**Preguntas de cierre de la clase (autoevaluación):** diferencia ágil vs tradicional; describa Scrum; qué entornos de desarrollo son los recomendados; qué es DevOps.

---

### 1.2 Inteligencia Artificial (teoría adicional)

**Objetivo:** comprender qué es la Inteligencia Artificial. Contenido: Objetivo, Inteligencia Artificial, Cierre.

**Motivación (diapositiva):** noticia "China: autorizan al primer taxi aéreo autónomo de pasajeros (abril 2024)" — taxi aéreo de despegue y aterrizaje vertical eléctrico.

**Definición (IBM):** "La inteligencia artificial, o IA, es **tecnología que permite que las computadoras simulen la inteligencia humana y las capacidades humanas de resolución de problemas**."

**Principales casos de uso y valor generado** (diapositiva con iconos):

| Caso de uso | Nota |
|---|---|
| Reconocimiento de voz | |
| Procesamiento de Lenguaje Natural | |
| Visión Artificial | |
| Predicciones, Recomendación | |
| Creación de contenido (**GenAI**, IA generativa) | |
| **Robótica** | Fábricas inteligentes, drones militares |
| Valor generado | UX (User Experience: look, feel, usability), Eficiencia, datos estructurados/semiestructurados/no estructurados como insumo, Sensores IoT, Prevención |

**Servicios de IA/ML en AWS (por categoría):**

| Categoría | Servicios |
|---|---|
| Reconocimiento de voz | **Polly**, **Transcribe** |
| Procesamiento de Lenguaje Natural | **Comprehend**, **Lex** |
| Visión Artificial | **Rekognition**, **Textract** |
| Predicciones, Recomendación | **SageMaker**, **Forecast**, **Fraud Detector**, **Personalize** |
| Creación de contenido (GenAI) | **Bedrock** |

**Qué hace cada servicio (según el diagrama "AWS AI & ML Services" de la diapositiva; entre paréntesis el tipo de dato: audio, tabular, texto, imagen, todo):**

| Servicio | Usos listados |
|---|---|
| **AWS Forecast** | Retail forecasting; demand forecasting (pronóstico de demanda). |
| **AWS Personalize** | Recomendación; personalización. |
| **Amazon Rekognition** | Detección de objetos; detección de texto; moderación de imágenes; detección de actividad (video). |
| **AWS SageMaker** | Tabular: regresión, clasificación, clustering. Texto: clasificación de texto, clasificación automática (machine classification), topic modelling. Imagen: clasificación de imágenes, detección de objetos, segmentación semántica/de instancias. (Plataforma para construir modelos ML propios.) |
| **AWS Lex** | Chatbots conversacionales; chatbots de BI. |
| **AWS Textract** | Extracción de documentos; redacción de documentos; extracción de tablas. |
| **AWS Polly** | Convertir blog a podcast; dictado de texto (texto a voz). |
| **AWS Comprehend** | Análisis de sentimiento; topic modeling; extracción de frases clave; detección de entidades; clasificación. |
| **AWS Transcribe** | Crear transcripciones; redacción de contenido; filtrado de vocabulario (voz a texto). |
| **Fraud Detector, Bedrock** | Solo se nombran en la categoría (predicción/fraude; IA generativa); el material no detalla más. |

**Cierre (autoevaluación):** ¿Qué es la Inteligencia Artificial?

---

### 1.3 Visión Artificial y Amazon Rekognition (parte teórica del Taller 1)

- **Visión artificial:** categoría de IA (ver 1.2) cuyos servicios AWS son **Rekognition** (imágenes/video) y **Textract** (documentos).
- **Amazon Rekognition (diapositiva):** "Servicio de **análisis visual basado en aprendizaje profundo**. Busque, verifique y organice millones de imágenes y videos." "**Automatice y reduzca el costo** del reconocimiento de imágenes y el análisis de videos con el machine learning." "Agregue rápidamente a las aplicaciones **API de visión artificial previamente entrenadas o personalizables** sin necesidad de crear modelos e infraestructura de machine learning (ML) desde cero."
- **Demos de imágenes disponibles en la consola de Rekognition** (menú "Demostraciones"): Detección de etiquetas, Propiedades de la imagen, Moderación de imágenes, Análisis facial, Comparación de rostros, Face Liveness (nuevo), Reconocimiento de famosos, Texto en la imagen, Detección de EPI (equipo de protección personal). Otras opciones del menú: Moderación personalizada (nuevo), Análisis masivo (nuevo), **Etiquetas personalizadas** ("Utilizar etiquetas personalizadas").
- **Demos de video:** Análisis de videos almacenados; **Transmisión de eventos de video** (análisis en tiempo real de secuencias de video en directo basado en ML para detectar etiquetas como **personas, mascotas y paquetes**). La demo muestra una solicitud JSON `startStreamProcessorRequest` con `name: "package"`, `startSelector.kvsProducerTimestamp`, `stopSelector.maxDuration: 12`. (Utiliza Kinesis Video Streams como indica `kvsProducerTimestamp`; el material solo muestra el nombre del campo.)
- **Detección de etiquetas:** reconoce automáticamente objetos, conceptos, escenas y acciones en las imágenes y proporciona una **puntuación de confianza** por etiqueta. Ejemplo de la demo (skateboard en calle): Neighborhood 99.9 %, City 99.9 %, Road 99.9 %, Street 99.9 %, Urban 99.9 %, Person 98.7 %.

---

### 1.4 Secretos y servicios AWS para almacenarlos (parte teórica del Taller 2)

**Concepto de "secreto":** en informática, información confidencial como **claves API, contraseñas, credenciales de bases de datos** o cualquier dato que otorgue acceso a sistemas y servicios. La **gestión de secretos** es crucial en el desarrollo de software para proteger estos datos del acceso no autorizado.

**Rotación de secretos:** proceso de **cambiar regularmente la información confidencial** (contraseñas, claves de acceso) para mejorar la seguridad.

**Comparación (tabla de la diapositiva; ref. tutorialsdojo):**

| Característica | Systems Manager – Parameter Store | AWS Secrets Manager |
|---|---|---|
| Tamaño máximo del valor | 4 KB (standard) u 8 KB (advanced) (la fila dice "4096 characters") | 64 KB |
| Cifrado con KMS | Sí | Sí |
| Referenciable desde CloudFormation | Sí | Sí |
| Generador de passwords incorporado | No | **Sí** |
| Rotación automática de secretos | No | **Sí** |
| Acceso cross-account | No | **Sí** |
| Costo adicional | **Gratis** para parámetros *standard*; los *advanced* se cobran por parámetro y por transacción de API | Sí (tiene costo) |

**Cuándo usar cada uno (deducido de la tabla):** Parameter Store para secretos/configuración simples sin costo; Secrets Manager cuando se necesita rotación automática, generación de passwords, acceso cross-account o valores grandes (64 KB).

**Tipos de parámetro usados en el taller:** `SecureString` (cifrado, nivel/capa "Estándar" en la consola).

---

## 2. Laboratorio

### 2.1 Taller 1 — Visión Artificial: API REST con Rekognition

**Objetivos:** explorar casos de uso de visión artificial con imágenes y videos; implementar una API REST para visión artificial.

**Agenda del taller:** 1 Objetivo, 2 Visión artificial, 3 AWS Rekognition, 4 Demos con imágenes, 5 Demos con videos, 6 API REST de visión artificial con Rekognition, 7 Cierre.

#### Arquitectura

```
Cliente (Postman)
   | POST https://<id>.execute-api.us-east-1.amazonaws.com/dev/images/etiquetas
   |   body JSON: {"bucket_name": "...", "image_name": "..."}
   v
API Gateway (integration: lambda, cors: true)
   v
Lambda (python3.13, 1024 MB, timeout 20 s, role LabRole)  -- DetectarEtiquetas.lambda_handler
   |--> Rekognition.detect_labels(Image=S3Object{Bucket,Name}, MaxLabels=10, MinConfidence=80)
   |<-- S3 (imagen: bucket gcr-data-01, key images/skateboard_resized.jpg)
   v
Respuesta: {"statusCode": 200, "etiquetas": [{"nombre": ..., "porcentaje_confianza": ...}, ...]}
```

#### Demostraciones previas (consola de Rekognition)

Con las imágenes del ZIP (`images/`): **a. detección etiquetas** (`landscape_resized.jpg`, `skateboard_resized.jpg`), **b. famosos** (Famoso 1-4.png), **c. texto en la imagen** (`vehiculo 1.png`), **d. detección de EPI** (imagen 1-4.jpg). Se prueban las demos de imágenes (menú Demostraciones) y de video (análisis de videos almacenados; transmisión de eventos de video), y luego se **compara la respuesta de la API propia con la demo de AWS**.

#### Pasos numerados

1. **Crear un bucket de S3 y subir las imágenes** indicadas por el docente. En el ejemplo: bucket `gcr-data-01`, carpeta (prefijo) `images/`, objetos `landscape_resized.jpg` y `skateboard_resized.jpg`.
2. **Analizar el código del lambda y modificar `org` y `role` en `serverless.yml`** (`org`: su organización de Serverless Dashboard; `role`: ARN del `LabRole` de su cuenta).
3. **Crear un repositorio GitHub** llamado `api-vision-artificial` y subir los archivos.
4. **Ingresar a la MV (máquina virtual) "Desarrollo"**, actualizar el archivo `credentials` en `/home/ubuntu/.aws/`, ir a `/home/ubuntu/serverless/` y hacer `git clone` del repositorio `api-vision-artificial`.
5. Ir a `/home/ubuntu/serverless/api-vision-artificial/` y ejecutar `serverless login`.
6. **Desplegar:** `serverless deploy`. Salida esperada:
   ```
   Deploying "api-vision-artificial" to stage "dev" (us-east-1)
   ✓ Service deployed to stack api-vision-artificial-dev (37s)
   endpoint: POST - https://dilg7fvwu3.execute-api.us-east-1.amazonaws.com/dev/images/etiquetas
   functions:
     listar: api-vision-artificial-dev-listar (1.2 kB)
   ```
7. **Probar con la colección Postman** y comparar con la demo de AWS. Request: `POST` con body raw JSON:
   ```json
   {
     "bucket_name": "gcr-data-01",
     "image_name": "images/skateboard_resized.jpg"
   }
   ```
   Respuesta esperada (valores de la captura):
   ```json
   {
     "statusCode": 200,
     "etiquetas": [
       {"nombre": "Neighborhood", "porcentaje_confianza": 99.99998474121094},
       {"nombre": "City", "porcentaje_confianza": 99.98229217529297},
       {"nombre": "Road", "porcentaje_confianza": 99.97169494628906}
     ]
   }
   ```
   (siguen más etiquetas hasta MaxLabels=10 y confianza >= 80; en la demo de AWS: Neighborhood, City, Road, Street, Urban, Person...).

#### Código completo comentado — `DetectarEtiquetas.py`

```python
import json
import boto3

def lambda_handler(event, context):
    # Inicializar los clientes S3 y Rekognition
    s3_client = boto3.client('s3')
    rekognition_client = boto3.client('rekognition')

    # Obtener el bucket y el nombre del archivo de la imagen del evento
    # (event['body'] es un dict porque API Gateway usa integration: lambda)
    bucket = event['body']['bucket_name']
    image_name = event['body']['image_name']

    # Llamar a Rekognition para detectar etiquetas en la imagen
    response = rekognition_client.detect_labels(
        Image={
            'S3Object': {
                'Bucket': bucket,
                'Name': image_name
            }
        },
        MaxLabels=10,        # máximo número de etiquetas a devolver
        MinConfidence=80     # umbral de confianza mínima (%)
    )

    # Guardar en json las etiquetas detectadas (también podría ir a S3, DynamoDB, etc.)
    lista = []
    for label in response['Labels']:
        etiqueta = {
            'nombre': label['Name'],
            'porcentaje_confianza': label['Confidence']
        }
        lista.append(etiqueta)

    return {
        'statusCode': 200,
        'etiquetas': lista
    }
```

Observaciones: el cliente `s3_client` se crea pero no se usa (Rekognition lee directamente el objeto S3). La respuesta usa `statusCode` dentro del JSON de retorno porque con `integration: lambda` el Lambda devuelve el cuerpo tal cual.

#### `serverless.yml`

```yaml
org: geraldocolchado          # CAMBIAR por su org
service: api-vision-artificial

provider:
  name: aws
  runtime: python3.13
  memorySize: 1024
  timeout: 20
  iam:
    role: arn:aws:iam::178398338251:role/LabRole   # CAMBIAR por el ARN de su LabRole

functions:
  listar:
    handler: DetectarEtiquetas.lambda_handler   # archivo.función
    events:
      - http:
          path: /images/etiquetas
          method: post
          cors: true
          integration: lambda
```

#### Colección Postman (`api-vision-artificial.postman_collection.json`)

Un request llamado `detectar-etiquetas`: método `POST`, URL `https://dilg7fvwu3.execute-api.us-east-1.amazonaws.com/dev/images/etiquetas` (path: `dev/images/etiquetas`), body raw (lenguaje JSON) con `bucket_name` e `image_name`. Debe reemplazarse la URL por la propia tras desplegar.

#### Errores comunes / puntos de atención (derivados del material)

- Olvidar cambiar `org` y `role` en `serverless.yml` → fallo de deploy.
- Credenciales (`~/.aws/credentials`) desactualizadas en la MV → fallo de deploy.
- No haber hecho `serverless login` antes del deploy.
- Bucket/clave mal escritos en el body (la clave debe incluir el prefijo: `images/skateboard_resized.jpg`) y bucket en la misma región que Rekognition (el taller usa `us-east-1`).
- Cambiar `MinConfidence`/`MaxLabels` altera cuántas etiquetas se devuelven (el código lo indica como ajustable).

#### Resultado esperado

API desplegada en stage `dev`, endpoint POST `/images/etiquetas`; la respuesta lista etiquetas con su confianza y es comparable con la demo "Detección de etiquetas" de la consola de AWS.

---

### 2.2 Taller 2 — Protección de Secretos

**Objetivos:** entender qué es un secreto; protegerlos; utilizarlos; entender qué es la rotación de secretos.

**Agenda:** 1 Objetivo, 2 Concepto: secretos, 3 Servicios AWS para secretos, 4 Arquitectura, 5 Crear RDS MySQL para dev/test/prod, 6 Crear secretos para dev/test/prod, 7 Crear API REST para dev/test/prod con MySQL, 8 Ejercicio propuesto: Rotación de secretos (EventBridge y Lambda o Secrets Manager), 9 Cierre.

#### Arquitectura de solución ("Microservicio Alumnos")

```
Laptop -> Internet -> Amazon API Gateway (api-alumnos)
                          |
                          v
         Lambdas: CrearAlumno | ListarAlumnos | ModificarAlumno | BuscarAlumno | EliminarAlumno
              ^  (leen password y endpoint)                 |
              |                                             v
   AWS Systems Manager Parameter Store          RDS MySQL "alumnos"
   (user_dev/password_dev, user_test/..., user_prod/...)   Esquemas: dev, test, prod
                                                           Usuarios: user_dev, user_test, user_prod
```

En la práctica del taller solo se implementa `ListarAlumnos`. Un esquema por ambiente y un usuario por esquema (principio de mínimo acceso: `user_dev` solo tiene permisos sobre `dev.*`, etc.).

#### Parte A — Crear RDS MySQL (dev, test, prod)

1. **Paso 1:** ingresar a **CloudShell** (icono de terminal en la barra superior de la consola AWS); ya tiene `credentials` configurado, AWS CLI y un cliente MySQL.
2. **Paso 2:** crear la instancia RDS (≈ **US$ 15 al mes**, aviso en la diapositiva):
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier alumnos \
     --db-instance-class db.t3.micro \
     --engine mysql \
     --master-username admin \
     --master-user-password MiClaveSegura123 \
     --allocated-storage 20 \
     --publicly-accessible \
     --region us-east-1
   ```
   Esperar estado **Disponible** en Aurora and RDS > Bases de datos.
3. **Paso 3:** obtener **punto de enlace (endpoint)** y **puerto (3306)** en "Conectividad y seguridad" (ej.: `alumnos.cbukem62s2x7.us-east-1.rds.amazonaws.com`). **Abrir el puerto 3306 a cualquier origen (0.0.0.0/0, MYSQL/Aurora, TCP)** en el Grupo de Seguridad de la instancia.
   - (*) **Solo para temas académicos.** En producción: dar acceso a la BD solo en la red privada de la cuenta, con reglas de entrada solo desde grupos de seguridad o dentro de la misma **VPC** donde está la BD para las lambdas u otros servicios serverless.
4. **Paso 4:** conectarse y crear esquemas, tablas, usuarios y permisos:
   ```bash
   mysql -h alumnos.cbukem62s2x7.us-east-1.rds.amazonaws.com -P 3306 -u admin -p
   ```
   (pide el password interactivamente). Sentencias SQL entregadas (`comandos.txt`):
   ```sql
   -- Dev
   CREATE DATABASE dev;
   USE dev;
   CREATE TABLE alumnos (
     alumno_id VARCHAR(20) NOT NULL PRIMARY KEY,
     apellidos VARCHAR(100) NOT NULL,
     nombres VARCHAR(100) NOT NULL
   );
   INSERT INTO alumnos (alumno_id, apellidos, nombres) VALUES
   ('2025100001', 'Delgado Ríos', 'Juan'),
   ('2025100002', 'Ruiz Hinojosa', 'Fernanda'),
   ('2025100003', 'Colchado Li', 'Carolina');
   SELECT * FROM alumnos;
   -- Test y Prod: idéntico con CREATE DATABASE test; USE test; ... / CREATE DATABASE prod; USE prod; ...

   -- Verificación
   SHOW DATABASES;
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'dev';  -- (test, prod)

   -- Usuarios por esquema
   CREATE USER 'user_dev' IDENTIFIED BY 'xyz-324@54';
   GRANT ALL PRIVILEGES ON dev.* TO 'user_dev';
   CREATE USER 'user_test' IDENTIFIED BY 'hghgOF#526';
   GRANT ALL PRIVILEGES ON test.* TO 'user_test';
   CREATE USER 'user_prod' IDENTIFIED BY '646gcbnxc%';
   GRANT ALL PRIVILEGES ON prod.* TO 'user_prod';

   SELECT user FROM mysql.user WHERE user like 'user%';
   ```
   Resultado esperado: `SHOW DATABASES` muestra `dev, information_schema, mysql, performance_schema, prod, sys, test` (7 filas); `SELECT * FROM alumnos` devuelve 3 filas; los usuarios `user_dev, user_prod, user_test` existen.

#### Parte B — Crear secretos en Parameter Store

**Paso 1:** desde CloudShell crear 3 secretos (passwords) y 1 parámetro (punto de enlace), todos `SecureString`:

```bash
aws ssm put-parameter --name "/rds_mysql_alumnos/user_dev/password"  --value "xyz-324@54"  --type SecureString
aws ssm put-parameter --name "/rds_mysql_alumnos/user_test/password" --value "hghgOF#526"  --type SecureString
aws ssm put-parameter --name "/rds_mysql_alumnos/user_prod/password" --value "646gcbnxc%"  --type SecureString
aws ssm put-parameter --name "/rds_mysql_alumnos/punto_enlace" \
  --value "alumnos.cbukem62s2x7.us-east-1.rds.amazonaws.com" --type SecureString
```

Convención de nombres jerárquica: `/rds_mysql_alumnos/<usuario>/password` y `/rds_mysql_alumnos/punto_enlace`. En la consola (Systems Manager > Almacén de parámetros > Mis parámetros) aparecen 4 parámetros, tipo `SecureString`, capa `Estándar`.

#### Parte C — API REST (api-alumnos-rds) para dev, test y prod

**Paso 1:** analizar el código, subirlo a GitHub y desplegar con Serverless Framework:

```bash
git clone ...                       # el repositorio api-alumnos-rds
pip3 install -r requirements.txt -t .   # instala pymysql en el directorio (se empaqueta con la lambda)
sls deploy                          # stage por defecto: dev
sls deploy --stage test
sls deploy --stage prod
```
Validar en la consola Lambda (`api-alumnos-rds-dev-listar`, `...-test-listar`, `...-prod-listar`) las **4 variables de entorno** (valores de la captura):

| Clave | dev | test | prod |
|---|---|---|---|
| DB_HOST | `/rds_mysql_alumnos/punto_enlace` | igual | igual |
| DB_NAME | `dev` | `test` | `prod` |
| DB_PASSWORD | `/rds_mysql_alumnos/user_dev/password` | `.../user_test/password` | `.../user_prod/password` |
| DB_USER | `user_dev` | `user_test` | `user_prod` |

Punto clave: las variables de entorno **no contienen el secreto, sino el nombre del parámetro** de Parameter Store; el valor real se obtiene en tiempo de ejecución con `ssm.get_parameter(..., WithDecryption=True)`.

**Paso 2:** probar las APIs en el navegador: `https://<id>.execute-api.us-east-1.amazonaws.com/{dev|test|prod}/alumnos/listar`. Respuesta esperada:
```json
{"statusCode":200,"body":[["2025100001","Delgado Ríos","Juan"],["2025100002","Ruiz Hinojosa","Fernanda"],["2025100003","Colchado Li","Carolina"]]}
```
(cada ambiente tiene su propio `<id>` de API Gateway).

#### `serverless.yml` de api-alumnos-rds

```yaml
org: geraldocolchado
service: api-alumnos-rds

provider:
  name: aws
  runtime: python3.13
  memorySize: 1024
  timeout: 20
  iam:
    role: arn:aws:iam::339712924490:role/LabRole
  environment:
    DB_HOST: /rds_mysql_alumnos/punto_enlace                     # nombre del parámetro SSM
    DB_USER: user_${sls:stage}                                   # user_dev / user_test / user_prod
    DB_PASSWORD: /rds_mysql_alumnos/user_${sls:stage}/password   # nombre del parámetro SSM
    DB_NAME: ${sls:stage}                                        # esquema dev / test / prod

functions:
  listar:
    handler: ListarAlumnos.lambda_handler
    package:
      include:
        - ./**  # Incluir todo el contenido del directorio (incluye pymysql instalado con pip -t .)
    events:
      - http:
          path: /alumnos/listar
          method: get
          cors: true
          integration: lambda
```
- `${sls:stage}` es la variable de Serverless con el stage (por defecto `dev`; se cambia con `--stage`). Así un mismo código y YAML genera 3 ambientes.
- `requirements.txt`: `pymysql==1.2.0`.

#### Código completo comentado — `ListarAlumnos.py`

```python
import boto3
import pymysql
import os

def lambda_handler(event, context):
    # Parámetros de conexión (puedes usar Parameter Store o Secrets Manager para mayor seguridad)
    SSM_host = os.environ['DB_HOST']          # nombre del parámetro con el endpoint
    user = os.environ['DB_USER']              # usuario en claro (no es secreto aquí)
    SSM_password = os.environ['DB_PASSWORD']  # nombre del parámetro con el password
    database = os.environ['DB_NAME']

    # Recuperar los secretos
    ssm = boto3.client('ssm')
    response = ssm.get_parameter(
        Name=SSM_host,
        WithDecryption=True  # Si es un parámetro seguro (SecureString)
    )
    host = response['Parameter']['Value']
    response = ssm.get_parameter(
        Name=SSM_password,
        WithDecryption=True
    )
    password = response['Parameter']['Value']

    try:
        connection = pymysql.connect(
            host=host,
            user=user,
            password=password,
            db=database,
            connect_timeout=5
        )

        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM alumnos;")  # Ajusta el nombre de la tabla
            results = cursor.fetchall()

        return {
            "statusCode": 200,
            "body": results
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "error": str(e)
        }

    finally:
        if connection:      # (ojo: si pymysql.connect falla, 'connection' no existe -> NameError)
            connection.close()
```

Observación de código: si `pymysql.connect` lanza excepción, la variable `connection` no está definida y el `finally` provocaría `NameError`; el código del material no lo previene (inicializar `connection = None` antes del `try` lo evitaría) *[observación de este resumen]*.

#### Rotación de secretos — material de apoyo (`modificar_password.txt`)

Sentencia SQL para cambiar el password de un usuario en la BD (parte del ejercicio de rotación):
```sql
ALTER USER 'user_test' IDENTIFIED BY 'hghgOF#526';
FLUSH PRIVILEGES;
```

#### Errores comunes (derivados del material)

- Guardar el secreto en variables de entorno de la lambda en claro (se muestran cifradas solo con la clave KMS predeterminada de Lambda y son visibles en la consola); el taller usa el **nombre** del parámetro y recupera con `WithDecryption=True`.
- Olvidar `--type SecureString` (el parámetro quedaría sin cifrar) o `WithDecryption=True` (la lambda recibiría el valor cifrado).
- Olvidar `pip3 install -r requirements.txt -t .` → la lambda no encuentra `pymysql`.
- Puerto 3306 no abierto en el Security Group → timeout de conexión (`connect_timeout=5`).
- Cambiar el password en la BD pero no en Parameter Store (o viceversa) → autenticación fallida; por eso la rotación debe actualizar **ambos**.
- Dejar 3306 abierto a 0.0.0.0/0 y `--publicly-accessible` solo es aceptable en entorno académico.
- El RDS genera costo (~US$ 15/mes): eliminarlo al terminar *(recomendación inferida del aviso de costo)*.

#### Resultado esperado

Tres APIs (dev/test/prod) que listan los 3 alumnos de su propio esquema usando usuarios distintos cuyos passwords viven en Parameter Store (SecureString).

---

## 3. Ejercicios propuestos

**Fuente:** `S15 Taller 2 - Ejercicio Propuesto.md` y diapositiva "Ejercicio Propuesto – Rotación de Secretos". Entrega: **2026-11-29 04:59:59 UTC**. Puntos: **50**. Canvas: curso 24645, tarea 350106.

> Nota del enunciado: en la realidad se suele cambiar los passwords **como mínimo cada 30 días**. El servicio **AWS Secrets Manager permite rotar los passwords de manera automática**.

### Ejercicio 1 (20 pts) — api-alumnos-rds-v2 con AWS Secrets Manager

**Enunciado:** implementar `api-alumnos-rds-v2` reemplazando el almacenamiento y recuperación de secretos con **AWS Secrets Manager** en lugar de "Systems Manager – Parameter Store".

**Enfoque (basado en el código del taller; el código siguiente es *[Propuesta]*):**

1. Crear los secretos en Secrets Manager (uno por usuario, p. ej. `/rds_mysql_alumnos/user_dev/password`; y otro para el punto de enlace o dejarlo en el mismo secreto en JSON).
   ```bash
   aws secretsmanager create-secret --name "/rds_mysql_alumnos/user_dev/password" --secret-string "xyz-324@54"
   ```
2. En `serverless.yml` las variables de entorno siguen guardando solo **nombres** de secretos (misma estructura que en v2, `service: api-alumnos-rds-v2`).
3. En `ListarAlumnos.py` reemplazar el cliente `ssm` por `secretsmanager`:
   ```python
   import boto3, pymysql, os

   def get_secret(client, name):
       # SecretString contiene el texto del secreto
       return client.get_secret_value(SecretId=name)['SecretString']

   def lambda_handler(event, context):
       sm = boto3.client('secretsmanager')
       host     = get_secret(sm, os.environ['DB_HOST'])
       password = get_secret(sm, os.environ['DB_PASSWORD'])
       user, database = os.environ['DB_USER'], os.environ['DB_NAME']
       connection = None
       try:
           connection = pymysql.connect(host=host, user=user, password=password,
                                        db=database, connect_timeout=5)
           with connection.cursor() as cursor:
               cursor.execute("SELECT * FROM alumnos;")
               results = cursor.fetchall()
           return {"statusCode": 200, "body": results}
       except Exception as e:
           return {"statusCode": 500, "error": str(e)}
       finally:
           if connection:
               connection.close()
   ```
4. Desplegar con `sls deploy`, `sls deploy --stage test`, `sls deploy --stage prod` y probar `/alumnos/listar`.

Diferencias a destacar (del material): Secrets Manager admite 64 KB, generador de passwords, **rotación automática** y acceso cross-account, pero **tiene costo**; Parameter Store standard es gratis.

### Ejercicio 2 (30 pts) — Rotación de secretos cada 10 minutos

**Enunciado:** implementar rotación para cambiar **cada 10 minutos** el password de `user_dev`, `user_test` y `user_prod` **tanto en la BD `alumnos` como en Parameter Store**. **Se recomienda usar una regla en EventBridge que invoque a una lambda** que cambie el password y almacene en Parameter Store el nuevo password.

**Enfoque:**

```
EventBridge (regla programada rate(10 minutes))
      |
      v
Lambda rotar_passwords
   1) genera password nuevo por usuario
   2) ALTER USER 'user_x' IDENTIFIED BY '<nuevo>'; FLUSH PRIVILEGES;   (conexión como admin)
   3) ssm.put_parameter(Name="/rds_mysql_alumnos/user_x/password", Value=<nuevo>, Type="SecureString", Overwrite=True)
```

*[Propuesta]* de código y de `serverless.yml`:

```python
import boto3, pymysql, os, secrets, string

USUARIOS = ['user_dev', 'user_test', 'user_prod']

def generar_password(n=16):
    alfabeto = string.ascii_letters + string.digits + "-_#%@"   # evitar ' y \ para no romper el SQL
    return ''.join(secrets.choice(alfabeto) for _ in range(n))

def lambda_handler(event, context):
    ssm = boto3.client('ssm')
    host = ssm.get_parameter(Name=os.environ['DB_HOST'], WithDecryption=True)['Parameter']['Value']
    admin_pwd = ssm.get_parameter(Name=os.environ['ADMIN_PASSWORD'], WithDecryption=True)['Parameter']['Value']
    # (el password de admin también debe estar guardado de forma segura)
    conn = pymysql.connect(host=host, user='admin', password=admin_pwd, connect_timeout=5)
    try:
        with conn.cursor() as cur:
            for u in USUARIOS:
                nuevo = generar_password()
                cur.execute(f"ALTER USER '{u}' IDENTIFIED BY %s", (nuevo,))  # igual que modificar_password.txt
                cur.execute("FLUSH PRIVILEGES")
                ssm.put_parameter(Name=f"/rds_mysql_alumnos/{u}/password",
                                  Value=nuevo, Type="SecureString", Overwrite=True)
        conn.commit()
    finally:
        conn.close()
    return {"statusCode": 200}
```

```yaml
functions:
  rotar:
    handler: RotarPasswords.lambda_handler
    events:
      - schedule: rate(10 minutes)     # crea la regla de EventBridge
```

Puntos clave: el `ALTER USER ... ; FLUSH PRIVILEGES;` es el que aparece en `modificar_password.txt`; hay que actualizar **BD y Parameter Store** (si solo uno, las APIs fallan con "Access denied"); la lambda de las APIs debe **leer el parámetro en cada invocación** (no cachearlo) para tomar el nuevo password; alternativa (indicada en el enunciado): usar la rotación automática de **AWS Secrets Manager**. (Detalle de la configuración exacta de EventBridge no está en el material; la sintaxis `schedule: rate(...)` es de Serverless Framework y es una propuesta.)

---

## 4. Conexiones teoría ↔ laboratorio

| Teoría | Laboratorio |
|---|---|
| Servicios de IA en AWS: categoría "Visión Artificial" = Rekognition + Textract | Taller 1 usa **Rekognition** (`detect_labels`) desde una lambda; las demos de "Texto en la imagen" y documentos se relacionan con Textract/Rekognition (imagen de prueba `vehiculo 1.png` de la carpeta "texto en la imagen"). |
| Rekognition: "API de visión artificial previamente entrenadas sin crear modelos de ML desde cero" | La API del taller solo llama al servicio gestionado con `boto3`; no hay entrenamiento de modelo. |
| Entornos de desarrollo (desarrollo local → pruebas → staging → producción) | Taller 2: tres ambientes **dev/test/prod** con esquema, usuario, parámetros y stage `--stage` propios. |
| DevOps: IaC, CI/CD, automatización, "Infrastructure as Code" | `serverless.yml` + `sls deploy` = infraestructura como código; repositorio GitHub + `git clone` en la MV de desarrollo. |
| DevOps: Monitor/Operate | Se valida variables de entorno y se prueban las URLs (`/dev/`, `/test/`, `/prod/`). |
| Ágil: entregas incrementales en sprints | Los talleres se hacen por pasos incrementales (funciona un listar; el resto de lambdas del diagrama quedan pendientes). |
| Concepto de secreto/rotación | Parameter Store `SecureString` + lambda con `WithDecryption=True`; ejercicio de rotación (EventBridge + Lambda o Secrets Manager). |
| Comparación Parameter Store vs Secrets Manager | Taller usa Parameter Store (gratis, sin rotación); Ejercicio 1 migra a Secrets Manager; Ejercicio 2 implementa la rotación a mano (Secrets Manager la haría automática). |
| Principio de seguridad: acceso mínimo | Un usuario por esquema; nota de producción: acceso a RDS solo por VPC/security groups, no 0.0.0.0/0. |
| Serverless Framework | Ambos talleres usan `serverless.yml` (python3.13, 1024 MB, timeout 20, `LabRole`, `integration: lambda`, `cors: true`). |

---

## 5. Preguntas tipo examen

1. **Diferencia entre metodología ágil y tradicional.**
   Tradicional: se define todo el proyecto al inicio, plan detallado y contratos estrictos, fases secuenciales (plan, análisis, diseño, construcción, prueba, despliegue). Ágil: se empieza por funcionalidades básicas, entrega continua de software de valor por iteraciones, reuniones constantes con el cliente y adaptación al cambio.

2. **¿Qué es Scrum?**
   Metodología de desarrollo ágil (iterativo e incremental) que ayuda a los equipos a desarrollar productos en periodos cortos (sprints), obteniendo feedback rápido del cliente, adaptaciones y mejora continuada.

3. **Roles de Scrum y su función.**
   Product Owner (voz del cliente, orientado al negocio, gestiona Product Backlog priorizado y criterios de aceptación); Scrum Master (coach y facilitador, asegura buen ambiente de trabajo); Equipo de desarrollo (3 a 9 personas especialistas, crean los entregables). Además el cliente/stakeholder aporta requerimientos.

4. **Describa el proceso Scrum (eventos y duraciones).**
   Product Backlog → reunión de planificación (hasta 8 h) → Sprint Backlog → Sprint (1-4 semanas, sin cambios en duración ni objetivos) con reunión diaria de 15 min cada 24 h → revisión del sprint (2-4 h) → retrospectiva (1-3 h) → siguiente ciclo. Se sigue el avance con un burndown chart.

5. **¿Qué entornos de desarrollo se recomiendan y para qué sirve cada uno?**
   Desarrollo local (el programador), integración (une cambios de todos y corre pruebas automatizadas), pruebas (testers hallan fallas), staging (copia de producción para pruebas de confiabilidad antes de lanzar), producción (lo que ve el usuario final).

6. **¿Qué es DevOps? ¿Qué son CI y CD?**
   Cultura de buenas prácticas que integra desarrollo y operaciones para entregar nuevas funcionalidades y mantener estabilidad de forma continua y rápida. CI: integración continua, el código se integra automáticamente con tests. CD: build, pruebas y despliegue a producción automático. Ciclo: plan, code, build, test, release, deploy, operate, monitor.

7. **Defina Inteligencia Artificial.**
   Tecnología que permite que las computadoras simulen la inteligencia humana y las capacidades humanas de resolución de problemas.

8. **Nombre servicios de IA de AWS por categoría.**
   Voz: Polly (texto a voz), Transcribe (voz a texto). Lenguaje natural: Comprehend (sentimiento, entidades, frases clave, clasificación), Lex (chatbots). Visión: Rekognition (objetos, texto, moderación, video), Textract (extracción de documentos y tablas). Predicción/recomendación: SageMaker, Forecast, Fraud Detector, Personalize. IA generativa: Bedrock.

9. **¿Qué es Amazon Rekognition y qué demos de imagen ofrece?**
   Servicio de análisis visual basado en aprendizaje profundo para buscar, verificar y organizar imágenes y videos con APIs preentrenadas o personalizables, sin construir modelos ML. Demos: detección de etiquetas, propiedades de la imagen, moderación, análisis facial, comparación de rostros, face liveness, reconocimiento de famosos, texto en la imagen, detección de EPI; en video: análisis de videos almacenados y transmisión de eventos de video.

10. **Escriba la llamada boto3 que detecta etiquetas en una imagen de S3 con máximo 10 etiquetas y confianza mínima 80.**
    ```python
    rekognition_client = boto3.client('rekognition')
    response = rekognition_client.detect_labels(
        Image={'S3Object': {'Bucket': bucket, 'Name': image_name}},
        MaxLabels=10, MinConfidence=80)
    ```
    Las etiquetas están en `response['Labels']` (campos `Name`, `Confidence`).

11. **Escriba el `serverless.yml` mínimo de una lambda expuesta como POST `/images/etiquetas`.**
    Ver sección 2.1: `service`, `provider` (name aws, runtime python3.13, memorySize 1024, timeout 20, iam.role LabRole) y `functions.listar` con `handler: DetectarEtiquetas.lambda_handler` y `events: - http: {path: /images/etiquetas, method: post, cors: true, integration: lambda}`.

12. **¿Qué es un secreto y qué es la rotación de secretos?**
    Secreto: información confidencial (claves API, contraseñas, credenciales de BD) que da acceso a sistemas. Rotación: cambiar regularmente esa información para mejorar la seguridad (en la práctica, mínimo cada 30 días).

13. **Compare Parameter Store y Secrets Manager.**
    Ambos cifran con KMS y se referencian desde CloudFormation. Secrets Manager además: generador de passwords, rotación automática, acceso cross-account, valores hasta 64 KB, pero con costo. Parameter Store: valores 4 KB (standard) u 8 KB (advanced), gratis para standard (advanced se cobra por parámetro y transacción), sin rotación automática.

14. **Escriba el comando CLI para guardar el password de `user_dev` de forma cifrada en Parameter Store.**
    ```bash
    aws ssm put-parameter --name "/rds_mysql_alumnos/user_dev/password" --value "xyz-324@54" --type SecureString
    ```

15. **¿Cómo recupera la lambda el password y por qué la variable de entorno no lo contiene?**
    La variable `DB_PASSWORD` contiene el **nombre** del parámetro (`/rds_mysql_alumnos/user_${sls:stage}/password`); en ejecución `ssm.get_parameter(Name=..., WithDecryption=True)['Parameter']['Value']` devuelve el valor descifrado. Así el secreto no queda en el código ni en el YAML.

16. **¿Cómo un mismo `serverless.yml` genera ambientes dev, test y prod?**
    Con `${sls:stage}` en `DB_USER`, `DB_PASSWORD` y `DB_NAME`, y desplegando con `sls deploy`, `sls deploy --stage test`, `sls deploy --stage prod`.

17. **Escriba las sentencias SQL para crear el usuario de `dev` con permisos solo sobre su esquema y cambiar el password de `user_test`.**
    ```sql
    CREATE USER 'user_dev' IDENTIFIED BY 'xyz-324@54';
    GRANT ALL PRIVILEGES ON dev.* TO 'user_dev';
    ALTER USER 'user_test' IDENTIFIED BY 'hghgOF#526';
    FLUSH PRIVILEGES;
    ```

18. **Describa la arquitectura de protección de secretos del taller.**
    Cliente → Internet → API Gateway `api-alumnos` → lambdas (Crear/Listar/Modificar/Buscar/Eliminar Alumno) → RDS MySQL `alumnos` con esquemas dev/test/prod y usuarios user_dev/test/prod; las lambdas obtienen usuarios/passwords de Systems Manager Parameter Store.

19. **¿Qué advertencia de seguridad se da sobre abrir el puerto 3306 a 0.0.0.0/0?**
    Solo es válido para fines académicos; en producción se debe dar acceso solo desde la red privada de la cuenta mediante reglas de entrada a grupos de seguridad o dentro de la misma VPC de las lambdas/servicios serverless.

20. **Ejercicio: ¿cómo rotaría cada 10 minutos los passwords de los 3 usuarios?**
    Regla EventBridge programada (cada 10 min) que invoca una lambda que genera un password nuevo, ejecuta `ALTER USER ... IDENTIFIED BY ...; FLUSH PRIVILEGES;` en la BD y actualiza el parámetro SecureString en Parameter Store (put-parameter con overwrite). Alternativa: Secrets Manager con rotación automática.

---

## 6. Cheat-sheet

### Scrum / ágil / DevOps (memorizar)
- Ágil = iterativo e incremental, entrega continua, cliente involucrado, adaptación al cambio. Tradicional = plan inicial detallado, contratos estrictos, fases secuenciales.
- Roles: Product Owner, Scrum Master, Equipo de Desarrollo (3-9). Artefactos: Product Backlog, Sprint Backlog, burndown. Eventos: planificación (<=8 h), daily (15 min), revisión (2-4 h), retrospectiva (1-3 h). Sprint 1-4 semanas.
- Entornos: local → (integración) → pruebas → staging → producción.
- DevOps: Dev + Ops, CI/CD; ciclo Plan-Code-Build-Test-Release-Deploy-Operate-Monitor.

### Servicios IA AWS
Voz: Polly, Transcribe | NLP: Comprehend, Lex | Visión: Rekognition, Textract | Predicción: SageMaker, Forecast, Fraud Detector, Personalize | GenAI: Bedrock.

### Parameter Store vs Secrets Manager
| | Parameter Store | Secrets Manager |
|---|---|---|
| Tamaño | 4/8 KB | 64 KB |
| KMS / CloudFormation | Sí / Sí | Sí / Sí |
| Generador password, rotación, cross-account | No | Sí |
| Costo | Gratis (standard) | Sí |

### boto3
```python
rek = boto3.client('rekognition')
rek.detect_labels(Image={'S3Object': {'Bucket': b, 'Name': k}}, MaxLabels=10, MinConfidence=80)
# -> response['Labels'][i]['Name'], ['Confidence']

ssm = boto3.client('ssm')
ssm.get_parameter(Name=n, WithDecryption=True)['Parameter']['Value']
# (propuesta, no vista en clase) ssm.put_parameter(Name=n, Value=v, Type='SecureString', Overwrite=True)
# (propuesta) boto3.client('secretsmanager').get_secret_value(SecretId=n)['SecretString']

pymysql.connect(host=h, user=u, password=p, db=d, connect_timeout=5)
with connection.cursor() as cursor:
    cursor.execute("SELECT * FROM alumnos;"); rows = cursor.fetchall()
```

### AWS CLI
```bash
aws rds create-db-instance --db-instance-identifier alumnos --db-instance-class db.t3.micro \
  --engine mysql --master-username admin --master-user-password <pwd> \
  --allocated-storage 20 --publicly-accessible --region us-east-1
aws ssm put-parameter --name "/ruta/param" --value "valor" --type SecureString
mysql -h <endpoint> -P 3306 -u admin -p
```

### SQL
```sql
CREATE DATABASE dev; USE dev;
CREATE TABLE alumnos (alumno_id VARCHAR(20) NOT NULL PRIMARY KEY, apellidos VARCHAR(100) NOT NULL, nombres VARCHAR(100) NOT NULL);
INSERT INTO alumnos (alumno_id, apellidos, nombres) VALUES ('2025100001','Delgado Ríos','Juan');
CREATE USER 'user_dev' IDENTIFIED BY '<pwd>';
GRANT ALL PRIVILEGES ON dev.* TO 'user_dev';
ALTER USER 'user_dev' IDENTIFIED BY '<nuevo>'; FLUSH PRIVILEGES;
SHOW DATABASES;  SELECT user FROM mysql.user WHERE user like 'user%';
```

### serverless.yml (plantilla de los talleres)
```yaml
org: <org>
service: <nombre>
provider:
  name: aws
  runtime: python3.13
  memorySize: 1024
  timeout: 20
  iam:
    role: arn:aws:iam::<cuenta>:role/LabRole
  environment:
    DB_HOST: /rds_mysql_alumnos/punto_enlace
    DB_USER: user_${sls:stage}
    DB_PASSWORD: /rds_mysql_alumnos/user_${sls:stage}/password
    DB_NAME: ${sls:stage}
functions:
  listar:
    handler: Archivo.lambda_handler
    package:
      include:
        - ./**
    events:
      - http:
          path: /alumnos/listar      # taller 1: /images/etiquetas con method: post
          method: get
          cors: true
          integration: lambda
```

### Comandos de despliegue
```bash
git clone <repo>
pip3 install -r requirements.txt -t .      # requirements.txt: pymysql==1.2.0
serverless login                            # (taller 1) sls = serverless
serverless deploy | sls deploy [--stage test|prod]
```

### JSON de prueba (Taller 1)
```json
{"bucket_name": "gcr-data-01", "image_name": "images/skateboard_resized.jpg"}
```
Respuesta: `{"statusCode":200,"etiquetas":[{"nombre":"...","porcentaje_confianza":99.9}]}`.

### Rutas/nombres a recordar
- Parámetros SSM: `/rds_mysql_alumnos/user_dev|user_test|user_prod/password`, `/rds_mysql_alumnos/punto_enlace` (SecureString).
- URL APIs: `/{stage}/alumnos/listar` (GET) y `/dev/images/etiquetas` (POST).
- MV Desarrollo: `/home/ubuntu/.aws/credentials`, `/home/ubuntu/serverless/<repo>`.
- RDS: puerto 3306, `db.t3.micro`, 20 GB, ~US$15/mes. Passwords se cambian como mínimo cada 30 días en la realidad.
