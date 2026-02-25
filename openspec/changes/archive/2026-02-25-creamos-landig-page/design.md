## Context

El frontend (`anyjobs/`) está construido en Angular (v21). El cambio crea una landing/listado público para “solicitudes de trabajo abiertas”, con UI tipo cards (foto + comentario corto) y estados UX (loading/empty/error) siguiendo la estructura visual de `@reference`.

Nota de alcance: la implementación usa estilos **locales del feature** (sin depender de estilos del `design-system/` ni de evidencias/tokens externos).

Restricciones y supuestos (a validar en specs/implementación):
- Existe (o se definirá) un endpoint que devuelve solicitudes abiertas con paginación/orden.
- La solicitud puede incluir una imagen representativa; si no, se mostrará placeholder.
- El detalle de solicitud ya existe o se implementará/ajustará; esta landing debe navegar hacia ese detalle.

## Goals / Non-Goals

**Goals:**
- Añadir una ruta pública para navegar y descubrir solicitudes abiertas con un layout responsive tipo “landing”.
- Renderizar un listado de cards con información mínima y consistente (imagen, comentario/extracto, metadatos clave, CTA).
- Implementar estados UX: skeletons, vacío y error recuperable (reintento).
- Mantener buenas prácticas de accesibilidad y código (standalone components, OnPush, tipado estricto).

**Non-Goals:**
- No definir el modelo de negocio completo de “solicitudes” (eso vive en specs/API).
- No implementar flujos complejos de filtrado/búsqueda avanzada si no están en requisitos (se deja preparado para iterar).
- No introducir dependencias externas de UI; el diseño se resuelve con SCSS local + componentes de app.

## Decisions

- **Routing (Angular Router)**
  - **Decisión**: exponer `/solicitudes` para la landing y `/solicitudes/:id` como destino de navegación desde las cards (detalle placeholder hasta definir detalle real).
  - **Rationale**: mantiene el acceso directo, favorece SEO/compartición y encaja con navegación por URL.
  - **Alternativas**:
    - Reutilizar una pantalla existente de listado (si existe) con un “modo landing” → descartado si mezcla demasiadas responsabilidades o requiere cambios invasivos.

- **Arquitectura de UI (composición de componentes)**
  - **Decisión**: separar en componentes reutilizables:
    - `OpenRequestsLanding` (route-level): estructura tipo `@reference` (hero 2 columnas + “Selección destacada”), estados y paginación.
    - `OpenRequestCardComponent`: card individual con badges, imagen, título y acciones.
    - `OpenRequestDetail`: placeholder de detalle para validar navegación desde el listado.
  - **Rationale**: facilita testeo, reutilización futura (p. ej. listados embebidos) y consistencia visual.
  - **Alternativas**:
    - Un único componente grande → descartado por mantenibilidad.

- **Obtención de datos (servicio + HttpClient)**
  - **Decisión**: introducir un `OpenRequestsService` que encapsule:
    - `listOpenRequests({ page, pageSize, sort })`
    - normalización mínima de datos para la card (fallbacks)
  - **Rationale**: desacopla UI de API, centraliza paginación/errores y hace más simple migrar endpoints.
  - **Alternativas**:
    - Llamadas directas desde el componente → descartado (dificulta pruebas y reuso).

- **Datos de prueba (mock local)**
  - **Decisión**: mientras no exista API real, el service consume un mock JSON en `anyjobs/public/mock/open-requests.mock.json` con paginación simulada.
  - **Rationale**: permite iterar UI/UX y tests sin depender de backend; el swap al endpoint real se reduce a cambiar `OPEN_REQUESTS_API_URL`.

- **Estrategia de estado (loading/empty/error)**
  - **Decisión**: modelar el estado como una máquina simple:
    - `loading` → skeleton
    - `success` con `items.length > 0` → grid
    - `success` con `items.length === 0` → empty state
    - `error` → mensaje + botón “Reintentar”
  - **Rationale**: UX predecible y fácil de implementar.
  - **Alternativas**:
    - Spinner global → descartado (peor percepción y no alinea con referencia).

- **Responsive layout y densidad visual**
  - **Decisión**: usar un layout tipo `@reference`:
    - Hero 2 columnas en desktop y 1 columna en mobile/tablet.
    - Sección “Selección destacada” con grid responsive.
    y una card con ratio de imagen consistente (con `object-fit: cover`) + placeholder.
  - **Rationale**: maximiza escaneabilidad y mantiene una estructura reconocible del patrón de referencia.
  - **Alternativas**:
    - Lista vertical siempre → descartado (menos “landing”, peor comparación visual).

- **Accesibilidad y navegación**
  - **Decisión**: card clicable con foco/teclado y CTA explícito (botón/enlace) con nombres accesibles; imágenes con `alt` útil o decorativas cuando aplique.
  - **Rationale**: mejora usabilidad y cumple criterios básicos de accesibilidad.

- **Estandarización en el editor (Cursor rule)**
  - **Decisión**: añadir una regla de Cursor para que futuras ediciones de la landing mantengan la estructura `@reference`.
  - **Archivo**: `.cursor/rules/open-requests-landing-structure.mdc`

## Risks / Trade-offs

- **[Riesgo] Imágenes pesadas o ausentes →** **Mitigación**: lazy-loading, tamaños/formatos adecuados, placeholder, y recorte con `object-fit`.
- **[Riesgo] Endpoint no soporta paginación/orden estable →** **Mitigación**: definir contrato mínimo en specs; fallback a paginación simple o “ver más” si es necesario.
- **[Riesgo] Falta de campos para la card (extracto, metadatos) →** **Mitigación**: normalización con fallback (p. ej. “Sin descripción”), y marcar campos como requeridos en specs.
- **[Trade-off] Landing “pública” vs permisos/visibilidad →** **Mitigación**: especificar en specs reglas de visibilidad (solo solicitudes abiertas/publicables) y manejo de sesión si aplica.
