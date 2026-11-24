# Casos grandes de examen — generador del PDF

Genera `../Casos_Grandes_Microservicios_AWS.pdf` (HTML → PDF con Chromium headless).

```bash
node build.mjs                 # los 6 casos
node build.mjs clinica,banco   # solo algunos
PDF_OUT=/ruta/salida.pdf node build.mjs
```

- `cases/*.mjs` — un archivo por caso: enunciado, microservicios, endpoints (JSON de entrada/salida), eventos, flujos, seguridad y la función `diagrama()`.
- `lib/diagram.mjs` + `lib/layout.mjs` — motor de diagramas SVG con íconos oficiales de AWS (`icons/`).
- `lib/html.mjs`, `lib/case.mjs`, `lib/front.mjs`, `lib/style.css` — maquetación.
- Requiere Node 18+ y un Chromium (por defecto el de Playwright en `~/.cache/ms-playwright`; otro con `CHROME=/ruta/chrome`).
