## ADDED Requirements

### Requirement: Anyjobs MUST adopt a stable app structure for modular growth
La app MUST definir una convención de estructura estable para permitir crecimiento por “feature areas”, separando responsabilidades de forma clara.

#### Scenario: Core/shared/features structure is present
- **WHEN** se inspecciona el árbol `src/app/`
- **THEN** existen ubicaciones claras para `core/`, `shared/` y `features/` (y/o `shell/` si aplica) de acuerdo con la convención documentada del proyecto

### Requirement: Anyjobs MUST provide an app shell and routing baseline
La app MUST incluir un “app shell” mínimo (layout/composición) y un baseline de routing que permita incorporar features sin reestructurar el entrypoint.

#### Scenario: Router baseline exists
- **WHEN** se inspecciona la configuración de rutas inicial
- **THEN** existe un `router-outlet` (o equivalente standalone) y al menos una ruta inicial que carga contenido placeholder (sin lógica de negocio)

### Requirement: Features MUST be added using Angular CLI and placed within the feature area
La creación de nuevas features MUST realizarse mediante Angular CLI (comandos de generación documentados) y el código resultante MUST ubicarse bajo `features/<feature>/` siguiendo la convención del proyecto.

#### Scenario: Feature generation preserves structure
- **WHEN** se genera una nueva feature (componentes/rutas/servicios) con Angular CLI según la guía del repo
- **THEN** los artefactos generados quedan bajo `src/app/features/<feature>/` y el routing se puede conectar sin mover código a carpetas globales

### Requirement: Routing MUST support lazy-loading per feature area
El routing MUST soportar lazy-loading por feature area para mantener performance y límites claros a medida que el proyecto crece.

#### Scenario: Lazy-loaded route exists
- **WHEN** se agrega una feature con routing
- **THEN** la app puede cargar esa feature mediante lazy-loading (por ejemplo `loadChildren`/`loadComponent`) sin romper el arranque de la aplicación

