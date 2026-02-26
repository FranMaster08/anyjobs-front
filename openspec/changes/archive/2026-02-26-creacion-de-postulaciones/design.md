## Context

El frontend (`anyjobs/`) está construido en Angular (standalone components + signals + `OnPush`). Hoy, en el detalle de una solicitud abierta (`/solicitudes/:id`) el CTA **“Postular”** abre un modal placeholder (simulado) y no existe una pantalla para componer una propuesta ni una vista de “Mis solicitudes”.

En el proyecto ya existe un patrón de **APIs mock** (por ejemplo `OpenRequestsService` consumiendo un JSON local en `public/mock/` y `AuthApi`/`UserApi` con endpoints `/mock/*`), además de sesión persistida con `AuthSessionService` (`localStorage`).

Este change introduce dos pantallas nuevas (composición de propuesta + “Mis solicitudes”) y un flujo que conecta desde el detalle de solicitud.

## Goals / Non-Goals

**Goals:**
- Reemplazar el placeholder de “Postular” por un flujo real (MVP) de **composición de propuesta**: “¿Quién soy?”, “Propuesta/mensaje” y “Estimación inicial”.
- Añadir la pantalla **“Mis solicitudes”** para que el usuario autenticado pueda ver solicitudes donde postula y revisar lo enviado.
- Simular comportamiento sin backend real usando una combinación de:
  - Mock local (JSON en `public/mock/`) para datos base si aplica
  - Persistencia en `localStorage` para que el envío de propuesta se refleje en la UI entre recargas
- Mantener estados UX consistentes (loading/empty/error) y accesibilidad (foco visible, `type="button"`, nombres accesibles).

**Non-Goals:**
- Backend real de postulación/negociación, chat/mensajería, aprobaciones/rechazos y pagos.
- Reglas de negocio definitivas de pricing, comisiones, o verificación de disponibilidad.
- Notificaciones y analítica avanzada.

## Decisions

- **Estilos y consistencia visual (MVP, SCSS local + tokens globales)**
  - **Decisión**: resolver el UI con SCSS local por feature (sin introducir dependencias nuevas), reutilizando los tokens/variables globales ya existentes (colores, sombras, radios, foco visible).
  - **Rationale**: acelera la iteración y mantiene consistencia visual con el resto del producto sin acoplar a un design-system externo.
  - **Detalles implementados (a alto nivel)**:
    - Cards con sombra y borde sutil; hover con elevación suave.
    - Chips/pills para estado y metadatos.
    - Tipografía con jerarquía clara y pesos normalizados (evitar “todo en negrita”).
    - Acciones con botones homogéneos (grid 2 columnas), separación visible (`gap`) y `box-sizing: border-box` para sizing consistente.
    - Bloque de propuestas como “comentarios” (una card por propuesta) para legibilidad.
    - Estimación con tratamiento tipográfico numérico (tabular-nums) para “look & feel” de precio.
    - Accesibilidad: foco visible y `type="button"` en botones.
  - **Alternativas**:
    - Mover todo a estilos globales → descartado para evitar efectos colaterales.

- **Routing / navegación**
  - **Decisión**: exponer una pantalla de propuesta como ruta dedicada, enlazada desde el detalle:
    - `solicitudes/:id/propuesta` (compose)
    - y una ruta “Mis solicitudes”: `mis-solicitudes`
  - **Rationale**: una ruta dedicada permite deep-linking, refresco sin perder el estado final (si se guarda borrador) y es más fácil de testear que un modal grande.
  - **Alternativas**:
    - Mantenerlo como modal (dentro del detalle) → descartado por complejidad de formulario + navegación + estados y por escalabilidad futura.

- **Gating por autenticación**
  - **Decisión**: el flujo de propuesta se habilita solo con sesión activa (`AuthSessionService.vm().isLoggedIn`).
    - Si no hay sesión, el CTA debe guiar a login/registro sin romper la navegación del usuario (mantener “volver atrás” al detalle).
  - **Rationale**: la propuesta se asocia a un usuario; además el producto ya tiene sesión persistida y un header contextual.

- **Modelo de datos de propuesta (MVP)**
  - **Decisión**: definir una entidad FE “Proposal” mínima:
    - `id`, `requestId`, `userId`, `whoAmI`, `message`, `estimate` (valor o rango como string), `createdAt`, `status` (p. ej. `SENT`)
    - Extensión MVP para simular múltiples postulantes: `author` opcional (nombre/subtítulo + reputación demo).
  - **Rationale**: esto permite simular envío y poblar “Mis solicitudes” sin inventar un backend.
  - **Alternativas**:
    - Reusar directamente el texto del formulario sin estructura → descartado (dificulta listado y evolución).

- **Persistencia y simulación (sin backend)**
  - **Decisión**: persistir propuestas enviadas (y opcionalmente borradores) en `localStorage`, en una clave versionada (p. ej. `anyjobs.proposals.v1`), indexada por `userId`.
  - **Rationale**: el usuario verá reflejado “en qué postuló y qué propuso” incluso al recargar, cumpliendo el objetivo del MVP.
  - **Alternativas**:
    - Solo mock JSON estático → descartado porque no refleja “enviar propuesta” en la UI.

- **Simulación de múltiples postulantes por solicitud (demo)**
  - **Decisión**: usar un mock local `public/mock/proposals.mock.json` que defina, por `requestId`, una lista de candidatos (propuestas) para simular competencia real.
  - **Rationale**: permite validar el UI/UX de “ver propuestas” (lista) y acciones futuras (perfil/elección) sin backend.
  - **Comportamiento**:
    - Seed inicial: si el usuario no tiene propuestas, se siembra desde el mock.
    - Seed por solicitud: al expandir/consultar propuestas de una solicitud, se asegura que existan varias propuestas para esa solicitud (p. ej. 4 en `req-1001`) aunque haya data previa en `localStorage`.

- **Acciones “Ver perfil” / “Elegir” como WIP**
  - **Decisión**: habilitar los botones y mostrar un modal/popup “próximamente / en desarrollo” al click (en lugar de dejarlos deshabilitados).
  - **Rationale**: comunica intención y reduce fricción UX (el usuario entiende que existe la acción, pero aún no está implementada).

- **Composición de UI (responsabilidades)**
  - **Decisión**: mantener los componentes route-level como orquestadores de estados y usar servicios para acceso a datos:
    - `OpenRequestProposalCompose` (route-level): carga resumen de la solicitud, gestiona formulario, valida y “envía” (simulado).
    - `MyRequestsDashboard` (route-level): lista solicitudes con propuestas del usuario; navega al detalle y/o a ver propuesta.
    - `ProposalsService` (data-access): CRUD mínimo (crear/listar por usuario; leer por request).
  - **Rationale**: mantiene consistencia con `OpenRequestsLanding`/`OpenRequestDetail` y evita acoplar UI a storage/HTTP.

- **Integración con open requests existentes**
  - **Decisión**: para renderizar “Mis solicitudes” se cruzará `requestId` de cada propuesta con la data de `OpenRequestsService` (detalle o lista) para mostrar al menos: título/extracto + ubicación + presupuesto (si existe).
  - **Rationale**: reaprovecha mocks existentes y evita duplicar catálogos.

## Risks / Trade-offs

- **[Riesgo] Inconsistencias entre `localStorage` y mocks (requestId inexistente) →** Mitigación: fallback de UI (“Solicitud no disponible”) y tolerancia a faltantes.
- **[Riesgo] Persistencia rompe si cambia el shape →** Mitigación: clave versionada (`v1`) y migración simple (reset) en MVP.
- **[Trade-off] Estimación como string vs modelo monetario →** Mitigación: en MVP mantener `estimate` libre (string) y definir contrato real en backend más adelante.
- **[Trade-off] Flujo de login desde postular →** Mitigación: mantener navegación simple (volver al detalle) y permitir retomar el flujo tras login en una iteración posterior.

