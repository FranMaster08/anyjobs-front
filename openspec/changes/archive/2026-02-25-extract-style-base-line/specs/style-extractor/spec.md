## ADDED Requirements

### Requirement: Style extractor MUST capture a page in a browser context
El sistema MUST cargar la URL objetivo en un entorno tipo navegador y evaluar el DOM y CSS aplicado para producir resultados basados en evidencia.

#### Scenario: Successful navigation and capture start
- **WHEN** el usuario provee una URL válida
- **THEN** el sistema inicia la captura en un navegador con un viewport definido y recolecta DOM/CSS/estilos computados

### Requirement: Style extractor MUST output a single valid JSON document
El sistema MUST producir exactamente un documento JSON válido (comillas dobles, sin trailing commas) como salida principal.

#### Scenario: JSON validity
- **WHEN** la captura finaliza
- **THEN** el sistema emite un único JSON parseable por un parser estándar

### Requirement: Output JSON MUST conform to the agreed schema
El JSON emitido MUST contener todos los campos del esquema acordado (incluyendo `meta`, `sources`, `tokens`, `layout`, `components`, `global`, `raw`). El sistema MUST NOT remover ninguno de los campos base del esquema. El sistema MUST permitir agregar campos adicionales únicamente cuando sean necesarios.

#### Scenario: Required top-level keys present
- **WHEN** el sistema produce el JSON final
- **THEN** el JSON incluye `meta`, `sources`, `tokens`, `layout`, `components`, `global` y `raw`

### Requirement: Output JSON MUST include capture metadata
El JSON MUST incluir metadata de captura suficiente para reproducibilidad:
- `meta.url` MUST igualar la URL capturada
- `meta.capturedAt` MUST ser un timestamp ISO-8601
- `meta.viewport.width` y `meta.viewport.height` MUST estar presentes y representar el viewport usado

#### Scenario: Metadata is present and consistent
- **WHEN** se genera el JSON
- **THEN** `meta.url`, `meta.capturedAt` y `meta.viewport` están presentes y son consistentes con la captura

### Requirement: Style extractor MUST collect stylesheet sources
El sistema MUST listar las fuentes de estilo detectadas en el documento:
- estilos externos (`<link rel="stylesheet">`) con su `href` cuando esté disponible
- estilos inline (`<style>`) identificados como `inline:<style#N>`

#### Scenario: Stylesheets enumeration
- **WHEN** la página incluye CSS externo e inline
- **THEN** el JSON incluye `sources.stylesheets[]` con `href`, `inline` y `sizeBytes` cuando sea determinable

### Requirement: Style extractor MUST detect fonts used by the page
El sistema MUST identificar familias tipográficas presentes en estilos computados y listarlas en `sources.fonts[]` con pesos/estilos observados cuando sea posible.

#### Scenario: Font families appear in sources
- **WHEN** la página aplica una o más familias tipográficas
- **THEN** `sources.fonts[]` incluye al menos una familia y su origen (`google|self-hosted|system|unknown`) cuando se pueda inferir

### Requirement: Style extractor MUST separate tokens from components
El sistema MUST separar y estructurar:
- tokens del sistema (colores, tipografía, spacing, radius, shadow, border, motion, breakpoints) en `tokens.*`
- componentes/patrones UI en `components[]`

#### Scenario: Tokens and components both present
- **WHEN** se emite el JSON
- **THEN** existen secciones `tokens` y `components` con contenido basado en evidencia

### Requirement: Style extractor MUST use computed styles for representative elements
Cuando el CSS original sea complejo o inaccesible, el sistema MUST incluir valores computados (computed styles) para elementos representativos y estados cuando sea posible.

#### Scenario: Computed styles captured for representative elements
- **WHEN** existen elementos representativos (p. ej. link, button, input)
- **THEN** `components[].evidence[]` incluye `computedFrom: "computed"` con un `snippet` de estilos computados relevantes

### Requirement: Each component MUST include base styles and state styles when available
Cada componente en `components[]` MUST incluir:
- `base` con propiedades visuales relevantes (layout, tipografía, color, background, border, radius, shadow, etc.)
- `states.hover|active|focus|disabled` cuando se puedan capturar; si no se pueden, MUST ser `null`

#### Scenario: Missing state styles are represented as null
- **WHEN** el sistema no puede capturar un estado (p. ej. `active` o `disabled`)
- **THEN** el campo del estado correspondiente existe y su valor es `null`

### Requirement: Every token/component MUST include evidence when possible
Para trazabilidad, cada token o componente MUST incluir evidencia cuando sea posible mediante:
- selectores (`selector`)
- origen (`computedFrom: "css|computed"`)
- fragmentos (`snippet`) con valores relevantes y unidades

#### Scenario: Evidence included for sampled component
- **WHEN** el sistema muestrea un componente (p. ej. Button)
- **THEN** el componente incluye `evidence[]` con al menos un `selector` y `computedFrom`

### Requirement: Unknown or non-determinable values MUST be null with notes
Si un valor no se puede determinar de forma confiable, el sistema MUST usar `null` y MUST explicar el motivo en `meta.notes`.

#### Scenario: Breakpoints cannot be inferred
- **WHEN** no se puede inferir un breakpoint con evidencia suficiente
- **THEN** el token queda en `null` y existe una nota en `meta.notes` explicando la limitación

### Requirement: Units MUST NOT be omitted
Los valores numéricos MUST conservar unidades (p. ej. `px`, `rem`, `%`, `em`, `deg`, `ms`) cuando apliquen.

#### Scenario: Motion durations keep units
- **WHEN** se captura una duración o transición
- **THEN** el valor conserva su unidad (por ejemplo `250ms` o `0s`) en la salida

### Requirement: Extracted style JSON MUST be usable as design-system baseline
El JSON MUST contener suficiente información para derivar un design system basado en el estilo observado, incluyendo al menos:
- paleta base y color de acción (`tokens.color.palette.*`)
- tipografía base y jerarquías observadas (`tokens.typography.*`)
- escalas de forma/espaciado/sombra/motion cuando haya evidencia (`tokens.radius|spacing|shadow|motion`)
- componentes representativos con estados (como mínimo: Button, Link, Input) en `components[]`

#### Scenario: Baseline design system fields present
- **WHEN** se completa una extracción estándar
- **THEN** `tokens.color`, `tokens.typography` y `components[]` están presentes y contienen valores derivados de evidencia

