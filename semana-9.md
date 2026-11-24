# Semana 9 — Multi-tenancy (tenencia múltiple) con DynamoDB, Lambda y API Gateway

> Curso CS2032 Cloud Computing (2026-2), docente Geraldo Colchado. Este documento reúne la teoría (clase 1), los talleres 1a, 1b y 2, los archivos de apoyo (JSON y código Python de los ZIP) y los ejercicios propuestos.

## 0. Mapa de materiales revisados

| Archivo | Tipo | Resumen de 1 línea |
|---|---|---|
| `teoria/semana-9/Multi-tenancy - Teoría - V1.00.pdf` (17 págs) | PDF teoría | Qué es multi-tenancy, single vs multi tenant, 3 patrones de diseño de BD multi-tenant. |
| `laboratorio/semana-9/1. Multi-tenancy - Taller 1a - V1.00.pdf` (18 págs) | PDF Taller (prioridad) | Implementar el Patrón 1 (esquema compartido con `tenant_id`) en DynamoDB: tabla `t_alumnos`, insertar registros UTEC y UNIV2. |
| `laboratorio/semana-9/1. Multi-tenancy - Taller 1b - V1.00.pdf` (19 págs) | PDF Taller (prioridad) | Buenas prácticas de clave de partición y de ordenamiento; 3 alternativas de diseño del "Sistema Académico" (Alumnos, Cursos, Matrículas) y GSI. |
| `laboratorio/semana-9/1. Multi-tenancy - Taller 2 - V1.10.pdf` (36 págs) | PDF Taller (prioridad) | Microservicio multi-tenant: 5 funciones Lambda CRUD (Python/boto3) sobre `t_alumnos` + API REST `api-alumnos` en API Gateway (CORS, stage `prod`, Postman). |
| `laboratorio/semana-9/Materiales S09 - Taller 1.zip` | ZIP | Contiene copias idénticas de los PDF 1a y 1b y 6 JSON de alumnos (`UTEC_json_alumno_1..3`, `UNIV2_json_alumno_1..3`). |
| `laboratorio/semana-9/Materiales S09 - Taller 2.zip` y `extra/` (idéntico, verificado con `cmp`) | ZIP | Copia del PDF Taller 2, 5 códigos Lambda `.txt` y 5 JSON de entrada de prueba. |
| `laboratorio/semana-9/extra/*.txt` (10 archivos) y `extra/1. ... Taller 2 ... .pdf` | Archivos sueltos | Duplicados idénticos de lo que trae el ZIP del Taller 2 (md5/cmp verificados); no aportan contenido nuevo. |
| `laboratorio/semana-9/buscar2/Lambda_buscar2.py` | Código Python | Solución/ejemplo de la lambda `buscar2` del ejercicio propuesto del Taller 2 (get_item con 404 si no existe). |
| `laboratorio/semana-9/S09 Taller 1 - Ejercicio Propuesto.md` | Ejercicio propuesto | Entrega 2026-10-30, 40 puntos, sin descripción (enlace a Canvas). |
| `laboratorio/semana-9/S09 Taller 2 - Ejercicio propuesto.md` | Ejercicio propuesto | Entrega 2026-10-26, 20 puntos, sin descripción (enlace a Canvas). |
| `laboratorio/semana-9/dynamodb-dg.pdf` (3481 págs) + `.url` | Libro (complemento, baja prioridad) | Guía del desarrollador de DynamoDB (en español); solo consultado por grep. |
| `laboratorio/semana-9/The_DynamoDB_Book.pdf` (448 págs) | Libro (complemento, baja prioridad) | Solo consultado por grep; no contiene la palabra "multi-tenancy". |

Notas de revisión: todas las diapositivas de los 4 PDF principales fueron revisadas visualmente además del texto. La carpeta `__MACOSX` no existe/se ignoró. Los ejercicios propuestos .md no tienen enunciado propio; el enunciado real está en los PDF (Ejercicio 2 del Taller 1a, Ejercicio 2 del Taller 1b y Ejercicio 7 del Taller 2).

---

## 1. Teoría

### 1.1 Objetivos de la sesión
- Entender qué es multi-tenancy o tenencia múltiple.
- Identificar diferencias entre single tenant y multi tenant.
- Aprender patrones de diseño para bases de datos multi-tenancy.

### 1.2 Qué es la tenencia múltiple (multi-tenancy)
**Tenant** = inquilino = el cliente (empresa, universidad, usuario) que usa la aplicación.

Definición 1 (Cloudflare / Datamation): "En la informática en la nube, la tenencia múltiple significa que varios clientes de un proveedor de la nube utilizan los mismos recursos informáticos. A pesar de que comparten recursos, los clientes en la nube no saben de la existencia de otros clientes, y sus datos se mantienen totalmente separados. La arquitectura de tenencia múltiple es una característica de muchos tipos de informática en nube pública, como IaaS, PaaS, SaaS, contenedores e informática sin servidor."

Definición 2 (Oscar Blancarte): "Multi-Tenancy es un principio de arquitectura de software donde una aplicación puede albergar a múltiples clientes, de esta forma, todos trabajan sobre la misma instancia de software que se ejecuta en el mismo servidor, con la única diferencia de que los datos que pueden ver cada cliente son diferentes, logrando un efecto en el que la aplicación se pueden ver como si fuera construida exclusivamente para uno de ellos."

Ideas clave:
- Misma instancia de software + mismos recursos para todos los clientes.
- Los datos de cada cliente están lógicamente separados; el cliente no ve a los demás.
- Es característica de nube pública: IaaS, PaaS, SaaS, contenedores, serverless.

**Ejemplos usados en clase (diapositivas):** Office 365, G Suite, Netflix, Zoom (SaaS multi-tenant); el Sistema Académico de UTEC (`core.utec.edu.pe`, selector "UTEC - Barranco") y Canvas (`utec.instructure.com`) con "Copyright © 2014 UTEC". Preguntas para analizar planteadas en la diapositiva:
- ¿Qué modelo de servicio son estas aplicaciones? (SaaS: en la figura de modelos de servicio, en SaaS el proveedor administra todas las capas desde Applications hasta Networking.)
- ¿Qué modelo de despliegue? (la diapositiva muestra pública / híbrida / privada; Office 365, G Suite, Netflix y Zoom son nube pública.)
- ¿Cuántos clientes tienen? / ¿Sirven para otras universidades? / ¿Qué hardware, bases de datos y software usan? (preguntas abiertas para reflexión; no hay respuesta en el material.)

Figuras de apoyo de esa diapositiva:
- Modelo de despliegue: Pública (menor privacidad), Híbrida (alto rendimiento, bajo coste, acceso inmediato, escalabilidad), Privada (seguridad, control total, alta inversión inicial, coste continuo de mantenimiento).
- Modelo de servicio (pila): Applications, Data, Runtime, Middleware, O/S, Virtualization, Servers, Storage, Networking. On-Premises = tú administras todo; IaaS = el proveedor administra desde Virtualization hacia abajo; PaaS = el proveedor administra desde Runtime hacia abajo (tú: Applications y Data); SaaS = el proveedor administra todo.

### 1.3 Single tenant vs Multi tenant

```
Single Tenant                      Multi tenant
 [servidor/app+BD]                  [servidor/app (+ BD según patrón)]
      |                              /     |      |      \
   cliente                       cli A   cli B  cli C   cli D
```

| Aspecto | Single tenant | Multi tenant |
|---|---|---|
| Entorno | "Opción deluxe": un cliente opera en un entorno exclusivamente dedicado (software, hardware y base de datos) | Cada cliente comparte la misma aplicación de software, el hardware y eventualmente la base de datos (*) |
| Software | Puede modificar el software a su medida | La misma aplicación de software para todos los clientes |
| Rendimiento | (no se afecta por otros clientes: entorno dedicado) | Podría afectarse el rendimiento por uso intensivo de la aplicación por otros clientes |
| Costo de infraestructura | Mayor costo | Menor costo (infraestructura compartida) |
| Seguridad de los datos | Mayor seguridad | Menor seguridad |

(*) Depende del patrón de diseño de la base de datos.

### 1.4 Patrones de diseño de BD Multi-tenancy
Fuentes: Datamation y Oscar Blancarte. Son 3 patrones, ordenados de menor a mayor aislamiento.

#### Patrón 1: A Single, Shared Database Schema (esquema único y compartido)
```
 cliente1  cliente2  cliente3
      \       |       /
           [ App ]
              |
            [ DB ]  (una BD, un esquema, tablas compartidas)
```
- Una única base de datos y un único esquema; todos los tenants comparten las mismas tablas.
- **Las tablas deben tener un campo `TENANT_ID`** para identificar sus registros.
- Ejemplo de acceso: `SELECT * FROM ORDERS WHERE TENANT_ID = ?`
- (Inferencia directa de la teoría: menor aislamiento y más barato; el aislamiento depende de filtrar siempre por tenant_id. La diapositiva no lista ventajas/desventajas explícitas de este patrón.)

#### Patrón 2: Single Database, Multiple Schemas (BD única, esquemas múltiples)
```
 cliente1  cliente2  cliente3
      \       |       /
           [ App ]
        /     |      \
  [Schema1][Schema2][Schema3]   dentro de una misma BD
```
- Cada schema pertenece a un TENANT (cliente o empresa) distinto y **cada uno tiene una réplica de las tablas**.
- Ya **no es necesario segmentar con el `WHERE`** del query.
- **El reto**: conectarse al schema correcto según el cliente que hace la solicitud.

#### Patrón 3: Multiple Databases (múltiples bases de datos)
```
 cliente1  cliente2  cliente3
      \       |       /
           [ App ]
        /     |      \
     [DB1]  [DB2]   [DB3]
```
- Estrategia que permite el **mayor nivel de aislamiento y seguridad**: separa por completo la información de cada usuario en su propia base de datos.
- Implica el **mayor esfuerzo de configuración**: se debe crear una nueva BD por cada cliente que se registre.

#### Tabla comparativa de patrones
| Patrón | Aislamiento / seguridad | Esfuerzo de configuración | Cómo se separan los datos |
|---|---|---|---|
| 1. Esquema único compartido | Menor | Menor | Columna `TENANT_ID` + `WHERE TENANT_ID = ?` |
| 2. BD única, múltiples schemas | Intermedio | Intermedio (hay que conectar al schema correcto) | Un schema por tenant con réplica de tablas |
| 3. Múltiples BD | Mayor | Mayor (nueva BD por cada cliente) | Una BD por tenant |

(Las columnas "menor/intermedio" para 1 y 2 son una ordenación deducida de lo que el material afirma sobre el patrón 3 "mayor aislamiento" y single-vs-multi; la teoría solo afirma explícitamente lo del patrón 3.)

### 1.5 Cierre de la teoría (preguntas de autoevaluación de la clase)
- Explique con sus propias palabras qué es multi-tenancy.
- Explique una diferencia entre single tenant y multi tenant.
- Explique un patrón de diseño para bases de datos multi-tenancy.

### 1.6 Conceptos de DynamoDB y serverless vistos en los talleres (teoría de soporte)
**Bases de datos NoSQL**: conocimiento previo (video "NoSQL Databases Simply Explained", youtu.be/0buKQHokLK8, ~7:37; complemento: aws.amazon.com/es/nosql).

**Amazon DynamoDB** (diapositiva del Taller 1a):
- Base de datos NoSQL de **clave-valor, sin servidor (serverless)** y completamente administrada, diseñada para aplicaciones de alto rendimiento a cualquier escala.
- Rendimiento de milisegundos de un solo dígito; capacidad de rendimiento y almacenamiento prácticamente ilimitada.
- Replicación automática en varias regiones; seguridad integrada, cifrado en reposo, copias de seguridad continuas, restauraciones, caché en memoria, importación/exportación de datos.
- SLA de disponibilidad de hasta 99,999 %.
- Escala vertical y horizontalmente de forma automática.
- Capa gratuita: 25 GB de almacenamiento y hasta 200 millones de solicitudes de lectura y escritura al mes.

**Clave de partición (Taller 1b)**
- DynamoDB usa el valor de la clave de partición como entrada de una **función hash interna**; el resultado determina la **partición** donde se almacena el elemento.
- Los elementos se distribuyen entre unidades de almacenamiento de **10 GB cada una**, llamadas **particiones** (almacenamiento físico interno). Cada tabla tiene una o más particiones.
- Buena práctica: usar atributos de **cardinalidad alta** (gran cantidad de valores únicos): correo electrónico, código de empleado, código de cliente, número de sesión, número de orden.
- Tabla de uniformidad de la documentación AWS mostrada en la diapositiva:

| Valor de clave de partición | Uniformidad |
|---|---|
| User ID, donde la aplicación tiene muchos usuarios | Good |
| Status code, solo unos pocos códigos posibles | Bad |
| Fecha de creación del elemento redondeada a un periodo (día, hora, minuto) | Bad |
| Device ID, donde cada dispositivo accede a los datos en intervalos similares | Good |
| Device ID, pero uno es mucho más popular que todos los demás | Bad |

- Si una tabla tiene pocos valores de clave de partición, distribuir las escrituras entre más valores distintos; evitar un valor de clave de partición "caliente" (hot) muy solicitado que ralentice el rendimiento global.
- Observación importante: en el diseño del taller `tenant_id` se usa como clave de partición, pero si hay pocos tenants o uno muy dominante tendería a ser una clave de baja cardinalidad / caliente; por eso en el Taller 1b la alternativa de Matrículas usa la clave compuesta `tenant_id#alumno_id` (esto es una conexión razonada, la diapositiva no lo dice textualmente).

**Clave de ordenamiento (sort key)**
- La clave primaria puede ser: (a) solo clave de partición, o (b) clave de partición + clave de ordenamiento.
- **La clave primaria debe ser única en toda la tabla.**
- La clave de ordenamiento permite organizar los datos (y ampliar opciones de consulta).
- Beneficios (doc AWS en la diapositiva): (1) reúne información relacionada en un lugar para consultarla eficientemente con **consultas de rango** (operadores `begins_with`, `between`, `>`, `<`...); (2) las claves de ordenamiento compuestas permiten definir relaciones jerárquicas (uno-a-muchos) consultables en cualquier nivel. Ejemplo AWS: `[country]#[region]#[state]#[county]#[city]#[neighborhood]`.
- Ejemplo ChatMessages: partición `chatroomID` (`chatRoomId`), ordenamiento `user_name#datetime` (`chatMessageIdentifier`). Filas: houston `amsg#2011-07-09:13:01:01` "hi there"; houston `tay#2011-07-09:13:01:02` ":-)"; seattle `amsg#2017-07-22:15:14:13`; seattle `amsg#2018-08-29:12:25:32`; seattle `tay#2018-08-29:12:23:32`. Consultas: Query con partition key `seattle` y sort key "Begins with" `amsg` → 2 resultados (2017 y 2018); con `amsg#2018` → 1 resultado (`amsg#2018-08-29:12:25:32`). Ordenamiento ascendente/descendente disponible.

**Índices secundarios (diapositiva Alternativa 3)**
- **GSI (Global Secondary Index)**: índice con clave de partición y clave de ordenamiento que **pueden ser diferentes** a las de la tabla base.
- **LSI (Local Secondary Index)**: índice con **la misma clave de partición** que la tabla base pero **distinta clave de ordenamiento**.
- (Complemento, dynamodb-dg.pdf: para tablas con LSI existe un límite de 10 GB por valor de clave de partición — colección de elementos.)

**AWS Lambda (FaaS, serverless) — Taller 2**
- Ejecutar código **sin pensar en servidores** ni clústeres; no se aprovisiona ni administra infraestructura (se sube el código como .zip o imagen de contenedor).
- Servicio informático **sin servidor y basado en eventos**; puede activarse desde más de 200 servicios de AWS y aplicaciones SaaS.
- Responde automáticamente escalando, de una docena de eventos al día a cientos de miles por segundo.
- **Se paga solo por el tiempo de cómputo que se usa** (por milisegundo).
- Optimización: tamaño de memoria adecuado; simultaneidad aprovisionada para respuestas en milisegundos de dos dígitos.
- Capa gratuita: 1 millón de solicitudes al mes.

**Amazon API Gateway (serverless)**
- Servicio completamente administrado para crear, publicar, mantener, monitorear y proteger APIs a cualquier escala; las APIs actúan como "puerta de entrada" a datos, lógica empresarial o funcionalidad de los servicios de backend.
- Permite crear API RESTful y API WebSocket.
- Gestiona tráfico, compatibilidad con **CORS**, control de autorizaciones y acceso, limitación controlada (throttling), monitoreo.
- Sin pagos mínimos; se paga por las llamadas recibidas y por los datos salientes transferidos.
- Capa gratuita: 1 millón de llamadas al API al mes durante 12 meses.

---

## 2. Laboratorio

### 2.1 Taller 1a — Base de Datos NoSQL Multi-tenancy (Patrón 1 en DynamoDB)

**Objetivo:** diseñar e implementar una base de datos NoSQL multi-tenancy con el Patrón 1 (esquema compartido con campo tenant).

**Arquitectura:**
```
 usuarios de UTEC / UNIV2 / UNIV3 / UNIV4 ...
          \     |     /
        [Microservicio "alumnos"]
                |
        [Tabla DynamoDB "t_alumnos"]
```
`tenant_id` = código de la universidad **en mayúsculas**: UTEC, UNIV2, UNIV3, UNIV4, etc.

**Ejercicio 1 — pasos:**
1. **Paso 1:** en la consola de DynamoDB, "Crear tabla".
2. **Paso 2:** asignar valores:
   - Nombre de la tabla: `t_alumnos` (3 a 255 caracteres; solo letras, números, `_`, `-` y `.`).
   - Clave de partición: `tenant_id`, tipo **Cadena (String)** (1–255 caracteres, distingue mayúsculas/minúsculas; "valor hash").
   - Clave de ordenación (opcional): `alumno_id`, tipo **Cadena (String)**.
   - Configuración de la tabla: **Personalizar configuración**.
   - Configuración de capacidad de lectura/escritura → Modo de capacidad: **Bajo demanda** (on-demand: paga por lecturas/escrituras reales) en vez de Aprovisionado.
3. **Paso 3:** insertar un registro para UTEC: Explorar elementos de la tabla → "Crear elemento" → pestaña **Vista JSON** (la captura resalta la pestaña "Vista JSON" y el interruptor "Ver JSON de DynamoDB"; el JSON se pega como el de abajo y la consola lista los ítems guardados con tipos DynamoDB, p. ej. `{"fecha_nac": {"S": "2004-12-04"}}`).
   ```json
   {
     "tenant_id": "UTEC",
     "alumno_id": "202010290",
     "alumno_datos": {
       "nombre": "Juan Pérez",
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
   (Nota: en el PDF aparecen comillas tipográficas “ ” por copia; en JSON real deben ser comillas rectas.)
4. **Paso 4:** insertar dos registros adicionales para UTEC (archivos `UTEC_json_alumno_2.txt` y `UTEC_json_alumno_3.txt` del ZIP):
   - `202035215` Carlos Carrasco, M, 2004-09-01, celular 999736123, Av. Arequipa 1028, Lince.
   - `202012345` Valeria Molina, F, 2005-02-03, celular 999736741, Av. Javier Prado 1928, San Borja.
5. **Paso 5:** insertar 3 registros para UNIV2 (`UNIV2_json_alumno_1..3.txt`), mismo formato con `"tenant_id": "UNIV2"`:
   - `A2020F4565` Pedro Luna, M, 2004-12-04, 999736371, Av. El Polo 1767, Monterrico.
   - `A2020F7412` Fabricio Morales, M, 2004-09-01, 999736123, Av. Arequipa 1028, Lince.
   - `A2020F9856` Victoria Gales, F, 2005-02-03, 999736741, Av. Javier Prado 1928, San Borja.

   Todos con provincia Lima, departamento Lima, país Perú.

**Resultado esperado:** la tabla `t_alumnos` con 6 elementos (3 UTEC: 202010290, 202012345, 202035215; 3 UNIV2: A2020F4565, A2020F7412, A2020F9856), ordenados por `tenant_id` y dentro por `alumno_id`. Observación: el mismo `alumno_id` podría repetirse entre tenants porque la clave primaria es la combinación (tenant_id, alumno_id).

**Atributos:** `alumno_datos` es un atributo tipo mapa (Map) anidado con `domicilio` como mapa interno.

**Errores comunes (deducibles):** usar tipo Número en lugar de Cadena para las claves; escribir `tenant_id` en minúsculas (el enunciado exige mayúsculas); comillas tipográficas al pegar JSON; dejar de especificar la clave de ordenación.

**Ejercicio 2 (propuesto, participación activa):** diseñar e implementar en DynamoDB una tabla multi-tenancy de su preferencia e insertar **6 registros (2 por cada tenant_id)** (es decir, 3 tenants). Subir evidencia al padlet indicado por el docente: **un JSON de ejemplo y la foto de los 6 registros insertados**.

### 2.2 Taller 1b — Claves de partición y ordenamiento; diseño multi-tenant de microservicios

**Objetivos:** aprender buenas prácticas para clave de partición y de ordenamiento; diseñar tablas DynamoDB de microservicios multi-tenancy. (Teoría de este taller en 1.6.)

**Ejercicio 1: Sistema Académico** — tres microservicios: Alumnos, Cursos y Matrículas (incluye evaluaciones con sus notas). Alumnos y Cursos son iguales en las 3 alternativas.

**Microservicio Alumnos** (PK = `tenant_id`, SK = `alumno_id`, Datos):
| tenant_id | alumno_id | Datos |
|---|---|---|
| UTEC | 202310424 | {"ape_pat": "Castro", "ape_mat": "Coa", ...} |
| UNIV2 | F202400123 | {"ape_pat": "Seminario", "ape_mat": "Lezama", ...} |

**Microservicio Cursos** (PK = `tenant_id`, SK = `curso_id`, Datos):
| tenant_id | curso_id | Datos |
|---|---|---|
| UTEC | CS2032 | {"nombre": "Cloud Computing"} |
| UTEC | CS2033 | {"nombre": "Base de Datos"} |
| UTEC | CS2034 | {"nombre": "Machine Learning"} |

**Microservicio Matrículas — Alternativa 1** (patrón de acceso: consultas **por alumno_id**)
- PK = `tenant_id#alumno_id`; SK = `ciclo#curso_id#seccion_id#eval_id`.

| PK | SK | Datos |
|---|---|---|
| UTEC#202310424 | 2024-2#CS2032#1 | {"fecha_matricula": "2024-07-24"} |
| UTEC#202310424 | 2024-2#CS2032#1#PA1 | {"fecha_registro": "2024-10-13", "registrado_por": "gcolchado", "nota": 18} |
| UTEC#202310424 | 2024-2#CS2032#1#TP | {"fecha_registro": "2024-10-14", "registrado_por": "gcolchado", "nota": 15} |
| UTEC#202310424 | 2024-2#CS2032#1#EP | {"fecha_registro": "2024-10-10", "registrado_por": "gcolchado", "nota": 13} |

Se almacena en el mismo ítem-colección la matrícula (sin eval_id) y sus evaluaciones (con eval_id: PA1, TP, EP). Con `begins_with` sobre la SK se puede pedir todo un ciclo (`2024-2`), un curso en un ciclo (`2024-2#CS2032`) o una sección.

**Matrículas — Alternativa 2** (patrón de acceso: consultas **por curso_id**)
- PK = `tenant_id#curso_id`; SK = `ciclo#seccion_id#alumno_id#eval_id`.

| PK | SK | Datos |
|---|---|---|
| UTEC#CS2032 | 2024-2#1#202310424 | {"fecha_matricula": "2024-07-24"} |
| UTEC#CS2032 | 2024-2#1#202310424#PA1 | {"fecha_registro": "2024-10-13", "registrado_por": "gcolchado", "nota": 18} |
| UTEC#CS2032 | 2024-2#1#202310424#TP | {... "nota": 15} |
| UTEC#CS2032 | 2024-2#1#202310424#EP | {... "nota": 13} |

**Matrículas — Alternativa 3** (consultas por alumno_id **y** por curso_id con **GSI**)
- Tabla base: PK = `tenant_id#alumno_id`, SK = `ciclo#curso_id#seccion_id#eval_id`.
- GSI: PK2 = `tenant_id#curso_id`, SK2 = `ciclo#seccion_id#alumno_id#eval_id`.

| PK | SK | PK2 (GSI) | SK2 (GSI) | Datos |
|---|---|---|---|---|
| UTEC#202310424 | 2024-2#CS2032#1 | UTEC#CS2032 | 2024-2#1#202310424 | {"fecha_matricula": "2024-07-24"} |
| UTEC#202310424 | 2024-2#CS2032#1#PA1 | UTEC#CS2032 | 2024-2#1#202310424#PA1 | {fecha_registro 2024-10-13, gcolchado, nota 18} |
| UTEC#202310424 | 2024-2#CS2032#1#TP | UTEC#CS2032 | 2024-2#1#202310424#TP | {2024-10-14, gcolchado, 15} |
| UTEC#202310424 | 2024-2#CS2032#1#EP | UTEC#CS2032 | 2024-2#1#202310424#EP | {2024-10-10, gcolchado, 13} |

Referencia citada: `docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-indexes-general.html`.

**Cómo elegir (resumen):** Alt. 1 sirve para "¿qué cursos/notas tiene el alumno X?"; Alt. 2 para "¿qué alumnos/notas tiene el curso Y?"; Alt. 3 sirve ambos patrones de acceso usando un GSI cuya clave es la "vista invertida" (costo: un índice adicional, ya que el material solo dice que GSI permite otra PK/SK).

**Patrón multi-tenant en las claves:** el `tenant_id` va **siempre como prefijo** de la clave de partición (sola en Alumnos/Cursos o concatenada con `#` en Matrículas) de modo que cada consulta queda acotada a un tenant.

**Ejercicio 2 (propuesto): Red Social** — elaborar una propuesta de diseño multi-tenancy con DynamoDB para una red social (ej. Instagram, TikTok). **El tenant de una red social es el usuario identificado por su correo.** (Ver solución sugerida en sección 3.)

### 2.3 Taller 2 — Microservicio Multi-tenancy (Lambda + API Gateway)

**Objetivo:** diseñar e implementar un microservicio multi-tenancy con Lambda (serverless) y API Gateway (serverless).

**Arquitectura:**
```
 Postman/cliente --HTTPS--> API Gateway (REST "api-alumnos", stage prod)
        /alumnos/listar   POST   -> Lambda ListarAlumnos
        /alumnos/crear    POST   -> Lambda CrearAlumno
        /alumnos/modificar PUT   -> Lambda ModificarAlumno
        /alumnos/buscar   POST   -> Lambda BuscarAlumno
        /alumnos/eliminar DELETE -> Lambda EliminarAlumno
                                  |
                          DynamoDB t_alumnos (PK tenant_id, SK alumno_id)
```
Requisito previo: tener creada la tabla `t_alumnos` (Taller 1a).

**Configuración común al crear cada función Lambda (Ejercicio 1, Paso 2, "Crear una función"):**
- Opción: **Crear desde cero** ("Author from scratch").
- Nombre de la función: p. ej. `ListarAlumnos` (solo letras, números, guiones y guiones bajos).
- Tiempo de ejecución (runtime): **Python 3.9**.
- Arquitectura: x86_64.
- Permisos: expandir "Cambiar el rol de ejecución predeterminado" → **Uso de un rol existente** → **LabRole** (rol del laboratorio académico).
- Clic en "Crear una función".
- Luego, en el editor de código (`lambda_function.py`): pegar código y pulsar **Deploy (Ctrl+Shift+U)**; para probar: **Test (Ctrl+Shift+I)** → "Create new test event" → Event name (p. ej. `Prueba`, máx. 25 caracteres, letras/números/puntos/guiones/guiones bajos), Event sharing settings: Private, pegar Event JSON → **Save** → **Invoke**. El resultado muestra `Status: Succeeded` y `Response`.

**Estructura común del código (patrón de todas las lambdas):** (1) Entrada (json) → leer del `event`; (2) Proceso → `boto3.resource('dynamodb')` → `Table('t_alumnos')` → operación; (3) Salida (json) → diccionario con `statusCode: 200`.

#### Ejercicio 1: Lambda ListarAlumnos (Query por tenant)
```python
import boto3  # import Boto3 (SDK de AWS para Python)
from boto3.dynamodb.conditions import Key  # condiciones para Query

def lambda_handler(event, context):
    # Entrada (json)
    tenant_id = event['tenant_id']
    # Proceso
    dynamodb = boto3.resource('dynamodb')          # cliente de alto nivel
    table = dynamodb.Table('t_alumnos')            # referencia a la tabla
    response = table.query(                        # Query: usa la clave de partición
        KeyConditionExpression=Key('tenant_id').eq(tenant_id)
    )
    items = response['Items']                      # lista de elementos
    num_reg = response['Count']                    # cantidad devuelta
    # Salida (json)
    return {
        'statusCode': 200,
        'tenant_id': tenant_id,
        'num_reg': num_reg,
        'alumnos': items
    }
```
Entrada de prueba: `{"tenant_id": "UTEC"}`. Salida esperada: `statusCode` 200, `tenant_id` "UTEC", `num_reg` 3, `alumnos` con los 3 alumnos UTEC (en orden de `alumno_id`: 202010290, 202012345, 202035215). Es la lambda que usa solo la clave de partición: **aquí se materializa el aislamiento multi-tenant** (un tenant solo lista sus alumnos).

#### Ejercicio 2: Lambda CrearAlumno (put_item)
```python
import boto3

def lambda_handler(event, context):
    # Entrada (json)
    tenant_id = event['tenant_id']
    alumno_id = event['alumno_id']
    alumno_datos = event['alumno_datos']
    # Proceso
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_alumnos')
    alumno = {                                     # el ítem completo, con las 2 claves
        'tenant_id': tenant_id,
        'alumno_id': alumno_id,
        'alumno_datos': alumno_datos
    }
    response = table.put_item(Item=alumno)         # crea o REEMPLAZA el ítem
    # Salida (json)
    return {
        'statusCode': 200,
        'response': response
    }
```
Entrada de prueba:
```json
{
  "tenant_id": "UTEC",
  "alumno_id": "202099998",
  "alumno_datos": {
    "nombre": "Geraldo Colchado",
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
(Nota: el archivo de apoyo `Entrada_UTEC_json_alumno_4.txt` usa `alumno_id` "202199998"; el PDF del Ejercicio 2 usa "202099998". Para API Gateway el PDF usa 202199998 en Postman.) Observación: `put_item` no falla si ya existe; sobrescribe (comportamiento estándar de DynamoDB, no explicado en el material).

#### Ejercicio 3: Lambda ModificarAlumno (update_item)
```python
import boto3

def lambda_handler(event, context):
    # Entrada (json)
    tenant_id = event['tenant_id']
    alumno_id = event['alumno_id']
    alumno_datos = event['alumno_datos']
    # Proceso
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_alumnos')
    response = table.update_item(
        Key={                                       # clave primaria completa
            'tenant_id': tenant_id,
            'alumno_id': alumno_id
        },
        UpdateExpression="set alumno_datos=:alumno_datos",   # expresión de actualización
        ExpressionAttributeValues={                          # valor del marcador :alumno_datos
            ':alumno_datos': alumno_datos
        },
        ReturnValues="UPDATED_NEW"                  # devuelve solo los atributos actualizados
    )
    # Salida (json)
    return {
        'statusCode': 200,
        'response': response
    }
```
Entrada de prueba (PDF): mismo alumno `202099998` con `"nombre": "Geraldo Colchado Ruiz"` y `"distrito": "San Borja"` (el archivo `Entrada_UTEC_json_alumno_4 - Modificar.txt` incluye alumno_id "202099998", fecha_nac "2000-09-01", celular "999736332", direcc "Av. Javier Prado 158").
Claves: el prefijo `:` marca un valor de expresión; `set alumno_datos=:alumno_datos` reemplaza el mapa completo.

#### Ejercicio 4: Lambda BuscarAlumno (get_item)
```python
import boto3

def lambda_handler(event, context):
    # Entrada (json)
    tenant_id = event['tenant_id']
    alumno_id = event['alumno_id']
    # Proceso
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_alumnos')
    response = table.get_item(
        Key={
            'tenant_id': tenant_id,
            'alumno_id': alumno_id
        }
    )
    # Salida (json)
    return {
        'statusCode': 200,
        'response': response
    }
```
Entrada: `{"tenant_id": "UTEC", "alumno_id": "202099998"}`. La respuesta contiene `response.Item` con `alumno_datos`, etc.

#### Ejercicio 5: Lambda EliminarAlumno (delete_item)
```python
import boto3

def lambda_handler(event, context):
    # Entrada (json)
    tenant_id = event['tenant_id']
    alumno_id = event['alumno_id']
    # Proceso
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_alumnos')
    response = table.delete_item(
        Key={
            'tenant_id': tenant_id,
            'alumno_id': alumno_id
        }
    )
    # Salida (json)
    return {
        'statusCode': 200,
        'response': response
    }
```
Entrada: `{"tenant_id": "UTEC", "alumno_id": "202099998"}` (el archivo `Entrada_UTEC_json_alumno_5 - Eliminar.txt` usa "202099999").

**Tabla resumen de las 5 lambdas**
| Lambda | Operación boto3 | Entrada (event) | Clave usada | Método HTTP / ruta |
|---|---|---|---|---|
| ListarAlumnos | `table.query(KeyConditionExpression=Key('tenant_id').eq(...))` | tenant_id | solo partición | POST /alumnos/listar |
| CrearAlumno | `table.put_item(Item=...)` | tenant_id, alumno_id, alumno_datos | — | POST /alumnos/crear |
| ModificarAlumno | `table.update_item(Key, UpdateExpression, ExpressionAttributeValues, ReturnValues)` | tenant_id, alumno_id, alumno_datos | partición+orden | PUT /alumnos/modificar |
| BuscarAlumno | `table.get_item(Key=...)` | tenant_id, alumno_id | partición+orden | POST /alumnos/buscar |
| EliminarAlumno | `table.delete_item(Key=...)` | tenant_id, alumno_id | partición+orden | DELETE /alumnos/eliminar |

#### Ejercicio 6: Publicar el microservicio como API REST CRUD en API Gateway (14 pasos)
1. **Crear API REST** "api-alumnos": en API Gateway elegir tipo **API REST** (control total de la solicitud y respuesta; funciona con Lambda, HTTP, servicios AWS) → "Crear". Opciones: **Nueva API**, nombre `api-alumnos`, tipo de punto de conexión **Regional** (las regionales se implementan en la región actual; las optimizadas para la periferia usan CloudFront), tipo de IP **IPv4** → "Crear API".
2. **Crear recurso `alumnos`**: Recursos → "Crear recurso"; Recurso de proxy desactivado; Ruta de recurso `/`; Nombre del recurso `alumnos`; **marcar CORS** (crea un método OPTIONS que permite todos los orígenes, métodos y varios encabezados comunes) → "Crear recurso".
3. **Crear recurso `listar`** (hijo de `/alumnos`, ruta `/alumnos/listar`).
4. **Crear método** en `/listar`: tipo **POST**.
5. **Asociar a Lambda ListarAlumnos**: tipo de integración **Función de Lambda**; región `us-east-1`; función `ListarAlumnos` (ARN `arn:aws:lambda:us-east-1:<cuenta>:function:ListarAlumnos`) → "Crear método".
6. **Probar** (pestaña "Pruebas"): cuerpo de la solicitud `{"tenant_id": "UTEC"}` → "Pruebas". Resultado: Estado 200, cuerpo de respuesta con `statusCode`, `tenant_id`, `num_reg: 3`, `alumnos`.
7. **Habilitar CORS** en el recurso `/alumnos/listar` ("Habilitar CORS"): respuestas de puerta de enlace **Default 4XX** y **Default 5XX**; Access-Control-Allow-Methods **OPTIONS** y **POST**; Access-Control-Allow-Headers por defecto `Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`; Access-Control-Allow-Origin `*` → "Guardar". (Al guardar, API Gateway reemplaza cualquier configuración de CORS existente.)
8. **Implementar la API**: botón "Implementar API" → Etapa: **Nueva etapa** → Nombre de etapa `prod` → "Implementación".
9. **Obtener el enlace** (Etapas → prod → método POST → "URL de invocación") y probar en Postman: `POST https://c6ny37pbaj.execute-api.us-east-1.amazonaws.com/prod/alumnos/listar`, Body raw JSON `{"tenant_id": "UTEC"}` → 200 OK con los alumnos.
10. **Repetir pasos 3 al 8** para el resto de recursos, según esta estructura:
    ```
    /
    └─ /alumnos  (OPTIONS)
         ├─ /buscar    OPTIONS, POST   -> BuscarAlumno
         ├─ /crear     OPTIONS, POST   -> CrearAlumno
         ├─ /eliminar  OPTIONS, DELETE -> EliminarAlumno
         ├─ /listar    OPTIONS, POST   -> ListarAlumnos
         └─ /modificar OPTIONS, PUT    -> ModificarAlumno
    ```
    (Al habilitar CORS, marcar en Allow-Methods el método correspondiente: DELETE o PUT en lugar de POST — inferencia lógica.)
11. **Probar CrearAlumno** en Postman: `POST .../prod/alumnos/crear`, Body raw JSON con `tenant_id`, `alumno_id` "202199998" y `alumno_datos` (Geraldo Colchado, M, 2000-09-01, 999736332, Av. Javier Prado 158, San Isidro, Lima, Lima, Perú) → `statusCode` 200.
12. **Probar ModificarAlumno**: `PUT .../prod/alumnos/modificar`, Body JSON con `tenant_id` "UTEC", `alumno_id` "202199998" y `alumno_datos` modificados (en la captura: fecha_nac 1999-09-01, celular 989736332, distrito San Borja) → `statusCode` 200 y `response.Attributes`.
13. **Probar EliminarAlumno**: `DELETE .../prod/alumnos/eliminar`, Body JSON `{"tenant_id": "UTEC", "alumno_id": "202199998"}` → Status 200 OK.
14. **Probar BuscarAlumno**: `POST .../prod/alumnos/buscar`, Body JSON `{"tenant_id": "UTEC", "alumno_id": "202010290"}` → `statusCode` 200 y `response.Item` con `nombre` "Juan Pérez".

En Postman: Body → **raw** → tipo **JSON**.

Observaciones: cada API desplegada tiene un id distinto en la URL (en el PDF aparecen `c6ny37pbaj` y `l50o72cg78` en distintas capturas); la ruta es `https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/alumnos/<recurso>`. Después de agregar o cambiar recursos/métodos hay que **volver a implementar** la API (paso 8) para que se apliquen en el stage.

Errores comunes (deducibles): olvidar "Deploy" en Lambda antes de probar; olvidar re-implementar la API; elegir método HTTP distinto al de la tabla (DELETE/PUT); enviar el cuerpo sin JSON válido o sin `tenant_id`; no seleccionar LabRole (sin permisos para DynamoDB).

#### Ejercicio 7 (propuesto): Lambda `buscar2` con método GET y query string
Enunciado: investigar y crear una función Lambda "buscar2" y habilitar su acceso con método **GET** en API Gateway que reciba los parámetros como **cadena de consulta de URL (query string)**. Ejemplo:
`https://c6ny37pbaj.execute-api.us-east-1.amazonaws.com/prod/alumnos/buscar2?tenant_id=UTEC&alumno_id=202077799`
Mostrar evidencias de Postman en el padlet.

Código disponible en la carpeta del laboratorio (`buscar2/Lambda_buscar2.py`):
```python
import boto3

def lambda_handler(event, context):
    tenant_id = event["tenant_id"]
    alumno_id = event["alumno_id"]
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("t_alumnos")
    response = table.get_item(Key={"tenant_id": tenant_id, "alumno_id": alumno_id})
    if "Item" not in response:
        return {"statusCode": 404, "body": "Alumno no encontrado"}
    return {"statusCode": 200, "alumno": response["Item"]}
```
Notas: (a) el alumno de ejemplo de la URL, `202077799`, corresponde a `Entrada_UTEC_json_alumno_5.txt` (Keiko Espinoza); (b) este código lee las claves directamente de `event`; para que eso funcione con un GET con query string la integración debe entregar esos parámetros en el `event` (el material no explica cómo; con integración proxy Lambda los parámetros llegan en `event["queryStringParameters"]`, dato fuera del material); (c) añade respuesta 404 si no existe el ítem (`"Item" not in response`).

### 2.4 Archivos de apoyo (ZIP y extra)
- `UTEC_json_alumno_1/2/3.txt`: alumnos 202010290 (Juan Pérez), 202035215 (Carlos Carrasco), 202012345 (Valeria Molina).
- `UNIV2_json_alumno_1/2/3.txt`: A2020F4565 (Pedro Luna), A2020F7412 (Fabricio Morales), A2020F9856 (Victoria Gales).
- `Entrada_json_ListarAlumnos.txt`: `{"tenant_id": "UTEC"}`.
- `Entrada_UTEC_json_alumno_4.txt`: crear, alumno_id `202199998`, Geraldo Colchado, M, 2000-09-01, 999736332, Av. Javier Prado 158, San Isidro.
- `Entrada_UTEC_json_alumno_4 - Modificar.txt`: alumno_id `202099998`, nombre "Geraldo Colchado Ruiz", distrito San Borja.
- `Entrada_UTEC_json_alumno_5.txt`: alumno_id `202077799`, Keiko Espinoza, sexo "M", 2000-09-01, 999736332, San Isidro.
- `Entrada_UTEC_json_alumno_5 - Eliminar.txt`: `{"tenant_id": "UTEC", "alumno_id": "202099999"}`.
- `Lambda_*Alumno(s) - Python.txt`: los 5 códigos ya transcritos arriba.
- Inconsistencia a tener presente: los ids de ejemplo no coinciden entre archivos (202099998 vs 202199998; 202099999 en Eliminar). Para que las pruebas funcionen, el `alumno_id` de modificar/buscar/eliminar debe ser el mismo que se creó.

### 2.5 Complemento (libros, baja prioridad)
- `dynamodb-dg.pdf` (Guía del desarrollador): límite de 10 GB por valor de clave de partición en tablas con índices secundarios locales (colección de elementos). No contiene el término multi-tenancy.
- `The_DynamoDB_Book.pdf`: sin menciones de multi-tenancy (búsqueda por grep). No se integró más contenido para no inventar relaciones.

---

## 3. Ejercicios propuestos

### 3.1 S09 Taller 1 – Ejercicio Propuesto (40 pts, entrega 30-oct-2026)
El .md no trae enunciado ("sin descripción"). Por el contenido del Taller 1 los ejercicios propuestos son:
- **Taller 1a, Ejercicio 2:** tabla multi-tenancy propia con 6 registros (2 por `tenant_id`) y evidencia (JSON de ejemplo + captura).
- **Taller 1b, Ejercicio 2:** diseño multi-tenancy en DynamoDB para una **red social** donde el tenant es el usuario identificado por correo.

**Solución/enfoque Taller 1a Ej. 2 (ejemplo de enfoque):** elegir una entidad (p. ej. `t_productos`), PK `tenant_id` (String), SK `producto_id` (String); 3 tenants (p. ej. TIENDA1, TIENDA2, TIENDA3) × 2 registros; JSON de ejemplo:
```json
{
  "tenant_id": "TIENDA1",
  "producto_id": "P001",
  "producto_datos": { "nombre": "Mouse", "precio": "35.50" }
}
```
**Enfoque Taller 1b Ej. 2 (propuesta basada en las alternativas del Sistema Académico; no es solución oficial):** tenant = correo del usuario → PK `correo` (cardinalidad alta, buena práctica) y SK compuesta con `#` para agrupar tipos y ordenar por fecha:
| PK (tenant = correo) | SK | Datos |
|---|---|---|
| ana@mail.com | PERFIL | {"nombre": "Ana", ...} |
| ana@mail.com | POST#2024-10-13T10:00:00#p001 | {"texto": "...", "foto": "..."} |
| ana@mail.com | SEGUIDOR#luis@mail.com | {"desde": "2024-10-01"} |
| ana@mail.com | COMENTARIO#p001#2024-10-14T09:00:00#luis@mail.com | {"texto": "..."} |
Consultas: `Query PK=correo` (todo), con `begins_with(SK, "POST#")` (publicaciones, ordenadas cronológicamente), etc. Si se requiere acceso inverso (quién sigue a X), usar un GSI con la clave invertida (como Alternativa 3).

### 3.2 S09 Taller 2 – Ejercicio propuesto (20 pts, entrega 26-oct-2026)
Enunciado (Taller 2, Ejercicio 7): crear la lambda `buscar2` con método GET en API Gateway que reciba `tenant_id` y `alumno_id` como query string, y mostrar evidencias de Postman.

**Enfoque (basado en el material + comentarios):**
1. Crear la función `buscar2` (Python 3.9, LabRole) con el código de `buscar2/Lambda_buscar2.py`.
2. En API `api-alumnos`: crear recurso `buscar2` bajo `/alumnos`, método **GET**, integración Función de Lambda → `buscar2`.
3. Habilitar CORS, implementar en stage `prod`.
4. En Postman: `GET https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/alumnos/buscar2?tenant_id=UTEC&alumno_id=202077799` (la pestaña Params de Postman arma el query string). Antes crear ese alumno con `Entrada_UTEC_json_alumno_5.txt`.
5. Nota: el código del material lee `event["tenant_id"]`; en una integración que pase los query params dentro de `event["queryStringParameters"]` habría que leerlos de ahí (dato fuera del material, verificar en su configuración).

---

## 4. Conexiones teoría ↔ laboratorio

| Teoría | Laboratorio |
|---|---|
| Patrón 1 (esquema compartido, campo `TENANT_ID`, `WHERE TENANT_ID = ?`) | Tabla `t_alumnos` con PK `tenant_id`; `query` con `Key('tenant_id').eq(tenant_id)` equivale al `WHERE TENANT_ID = ?`. |
| Los datos de cada cliente se mantienen separados | Cada operación recibe `tenant_id` y lo usa en la clave; ListarAlumnos devuelve solo el tenant pedido. |
| Menor costo de infraestructura al compartir | Una sola tabla, un microservicio, un API para todas las universidades (UTEC, UNIV2, ...). |
| Multi-tenancy es característica de serverless/SaaS | DynamoDB, Lambda y API Gateway son servicios serverless; el microservicio "alumnos" sirve a múltiples tenants. |
| Riesgo: rendimiento afectado por otros clientes / menor seguridad | Clave de partición de alta cardinalidad y sin "hot partition" (Taller 1b); en el material no se implementa autorización por tenant. |
| Patrón 2 (schemas) y 3 (BD por cliente) | Equivalentes en DynamoDB serían una tabla por tenant (inferencia; el material solo implementa el patrón 1). |
| SaaS y modelos de servicio (pila) | Lambda = FaaS; API Gateway = puerta de entrada de APIs. |
| tenant_id en mayúsculas | `UTEC`, `UNIV2`... como valores de PK; tipo String. |
| Claves compuestas con `#` | `tenant_id#alumno_id` y SK `ciclo#curso_id#seccion_id#eval_id` en Matrículas. |

---

## 5. Preguntas tipo examen (con respuesta modelo)

1. **¿Qué es multi-tenancy?** Principio/arquitectura donde varios clientes (tenants) comparten los mismos recursos informáticos y la misma instancia de la aplicación, mientras sus datos permanecen separados y cada cliente no sabe de la existencia de los demás; la aplicación parece construida solo para él. Es típico de nube pública (IaaS, PaaS, SaaS, contenedores, serverless).
2. **Diferencie single tenant de multi tenant.** Single: entorno exclusivamente dedicado (SW, HW, BD), personalizable, mayor costo y mayor seguridad. Multi: se comparte aplicación, hardware y eventualmente BD; misma aplicación para todos; menor costo; menor seguridad; el rendimiento puede afectarse por uso intensivo de otros.
3. **Mencione los tres patrones de diseño de BD multi-tenancy.** (1) Un único esquema compartido con campo `TENANT_ID`; (2) una BD con múltiples esquemas (réplica de tablas por tenant); (3) múltiples bases de datos (una por cliente).
4. **¿Qué patrón da mayor aislamiento y cuál es su costo?** El 3 (múltiples BD): mayor aislamiento y seguridad, pero mayor esfuerzo de configuración (crear una BD por cada cliente nuevo).
5. **¿Cuál es el reto del patrón 2?** Conectarse al schema correcto según el cliente que hace la solicitud (ya no se segmenta con WHERE).
6. **Escriba la consulta SQL típica del patrón 1.** `SELECT * FROM ORDERS WHERE TENANT_ID = ?`
7. **¿Cómo se implementó el patrón 1 en DynamoDB en el taller?** Tabla `t_alumnos`, clave de partición `tenant_id` (String), clave de ordenación `alumno_id` (String), capacidad bajo demanda; registros con atributo mapa `alumno_datos`.
8. **¿Qué es una partición en DynamoDB y cómo se decide dónde se guarda un ítem?** Unidad de almacenamiento físico interno de 10 GB; el valor de la clave de partición pasa por una función hash que determina la partición.
9. **¿Qué características debe tener una buena clave de partición? Dé ejemplos buenos y malos.** Cardinalidad alta y distribución uniforme (evitar hot keys). Buenos: correo, código de empleado/cliente, número de sesión/orden, User ID con muchos usuarios. Malos: status code, fecha redondeada, Device ID con un dispositivo mucho más popular.
10. **¿Qué opciones de clave primaria existe y qué regla debe cumplir?** Solo partición, o partición + ordenamiento; la clave primaria debe ser única en toda la tabla.
11. **¿Para qué sirve la clave de ordenamiento?** Organizar los datos y ampliar las consultas: agrupar ítems relacionados y hacer consultas de rango (`begins_with`, `between`, `>`, `<`) y jerarquías (p. ej. `ciclo#curso#seccion#eval`).
12. **En ChatMessages (PK chatRoomId, SK user_name#datetime), ¿cómo obtiene los mensajes de `amsg` en Seattle en 2018?** Query con PK = seattle y SK `begins_with` `amsg#2018`.
13. **Diseñe la tabla de Matrículas para consultar por alumno** (Alt. 1): PK `tenant_id#alumno_id`, SK `ciclo#curso_id#seccion_id#eval_id`; ejemplo UTEC#202310424 / 2024-2#CS2032#1#PA1.
14. **¿Y para consultar por curso?** (Alt. 2): PK `tenant_id#curso_id`, SK `ciclo#seccion_id#alumno_id#eval_id`.
15. **¿Cómo servir ambos patrones de acceso a la vez?** Alt. 3: tabla base por alumno + **GSI** con PK `tenant_id#curso_id` y SK `ciclo#seccion_id#alumno_id#eval_id`.
16. **Diferencia GSI vs LSI.** GSI: PK y SK pueden diferir de la tabla base. LSI: misma PK que la tabla base pero distinta SK.
17. **Escriba la Lambda que lista alumnos de un tenant.** (Escribir código de 2.3 Ejercicio 1: `table.query(KeyConditionExpression=Key('tenant_id').eq(tenant_id))`, devolver `statusCode`, `tenant_id`, `num_reg`, `alumnos`.)
18. **¿Qué operación boto3 usa cada lambda de CRUD?** Crear: `put_item`; Buscar: `get_item`; Modificar: `update_item` con `UpdateExpression="set alumno_datos=:alumno_datos"`; Eliminar: `delete_item`; Listar: `query`.
19. **Escriba el JSON de entrada para eliminar un alumno.** `{"tenant_id": "UTEC", "alumno_id": "202199998"}`.
20. **Enumere las rutas y métodos del API `api-alumnos`.** /alumnos/listar POST; /alumnos/crear POST; /alumnos/modificar PUT; /alumnos/buscar POST; /alumnos/eliminar DELETE; cada recurso además con OPTIONS (CORS).
21. **Pasos para publicar una Lambda en API Gateway.** Crear API REST (Regional, IPv4) → crear recurso (con CORS) → crear método con integración Función Lambda → probar → habilitar CORS → implementar en etapa `prod` → copiar URL de invocación y probar en Postman.
22. **¿Qué es Lambda y cuál es su modelo de cobro?** Servicio FaaS serverless basado en eventos; se paga solo por el tiempo de cómputo usado (por milisegundo); 1 millón de solicitudes gratis/mes.
23. **¿Qué rol de ejecución se usó y qué runtime?** Uso de un rol existente: LabRole; Python 3.9 (x86_64).
24. **¿Qué hace `ReturnValues="UPDATED_NEW"`?** Devuelve los atributos actualizados con sus nuevos valores (se ve en `response.Attributes`).
25. **¿Cómo aísla el diseño del taller los datos de cada universidad?** Toda operación usa `tenant_id` como parte de la clave primaria; listar consulta solo por esa partición. (El material no implementa autenticación/autorización por tenant.)

---

## 6. Cheat-sheet

**Crear tabla DynamoDB (consola):** nombre `t_alumnos`; PK `tenant_id` (Cadena); SK `alumno_id` (Cadena); Personalizar configuración; capacidad **Bajo demanda**. Insertar: Crear elemento → Vista JSON.

**JSON de alumno (ítem):**
```json
{
  "tenant_id": "UTEC",
  "alumno_id": "202010290",
  "alumno_datos": {
    "nombre": "Juan Pérez", "sexo": "M", "fecha_nac": "2004-12-04", "celular": "999736371",
    "domicilio": { "direcc": "Av. El Polo 1767", "distrito": "Monterrico",
                   "provincia": "Lima", "departamento": "Lima", "pais": "Perú" }
  }
}
```

**Entradas de prueba:** listar `{"tenant_id":"UTEC"}`; buscar/eliminar `{"tenant_id":"UTEC","alumno_id":"..."}`; crear/modificar añaden `"alumno_datos":{...}`.

**Plantilla Lambda (Python):**
```python
import boto3
from boto3.dynamodb.conditions import Key   # solo para query

def lambda_handler(event, context):
    tenant_id = event['tenant_id']
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('t_alumnos')
    # query:      table.query(KeyConditionExpression=Key('tenant_id').eq(tenant_id))  -> ['Items'], ['Count']
    # put_item:   table.put_item(Item={'tenant_id':..,'alumno_id':..,'alumno_datos':..})
    # get_item:   table.get_item(Key={'tenant_id':..,'alumno_id':..})                  -> ['Item']
    # update:     table.update_item(Key={...}, UpdateExpression="set alumno_datos=:alumno_datos",
    #                  ExpressionAttributeValues={':alumno_datos': alumno_datos}, ReturnValues="UPDATED_NEW")
    # delete:     table.delete_item(Key={...})
    return {'statusCode': 200, 'response': response}
```

**Claves compuestas (patrón `#`):** `tenant_id#alumno_id` / `ciclo#curso_id#seccion_id#eval_id`; GSI: `tenant_id#curso_id` / `ciclo#seccion_id#alumno_id#eval_id`.

**API Gateway:** REST API `api-alumnos`, Regional, IPv4 → recurso `alumnos` (CORS) → subrecursos `listar`(POST), `crear`(POST), `modificar`(PUT), `buscar`(POST), `eliminar`(DELETE) → integración Función Lambda (us-east-1) → Habilitar CORS (Default 4XX y 5XX; headers `Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`; origin `*`) → Implementar API, etapa `prod`.

**URL de invocación:** `https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/alumnos/<recurso>`; buscar2: `.../prod/alumnos/buscar2?tenant_id=UTEC&alumno_id=202077799` (GET).

**Postman:** método + URL, Body → raw → JSON.

**Patrones multi-tenant:** 1 = esquema compartido + `TENANT_ID` (`WHERE TENANT_ID = ?`); 2 = BD única, schema por tenant; 3 = BD por tenant (máximo aislamiento, máximo esfuerzo).

**Single vs Multi:** dedicado/caro/seguro/personalizable vs compartido/barato/menos seguro/misma app y posible impacto de rendimiento.

**Cifras:** partición 10 GB; DynamoDB SLA 99,999 %; free tier DynamoDB 25 GB y 200 M solicitudes/mes; Lambda 1 M solicitudes/mes gratis; API Gateway 1 M llamadas/mes gratis durante 12 meses; nombre de tabla 3–255 caracteres; claves 1–255 caracteres.
