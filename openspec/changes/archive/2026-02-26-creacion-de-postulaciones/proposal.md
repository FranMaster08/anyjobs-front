## Why

Actualmente, cuando un usuario hace click en **“Postular”** dentro del detalle de una solicitud abierta, el sistema no habilita un flujo real de postulación/negociación: solo muestra un modal informativo. Esto impide que un usuario autenticado pueda:

- Presentarse (“¿quién soy?”) de forma convincente.
- Compartir su conocimiento y enfoque (“cómo lo haría / qué experiencia tengo”) para **enamorar** al cliente.
- Proponer una **estimación inicial** (precio o rango) como base de negociación.
- Dar seguimiento en un lugar central a las solicitudes donde ya participó.

Además, el producto no ofrece una vista de **“Mis solicitudes”** para que el usuario vea:
- En cuáles solicitudes ya postulé y qué propuse.
- Cuáles solicitudes tiene asignadas o asociadas a su cuenta (en este MVP, simulado).

## What Changes

- Implementar una pantalla de **creación de propuesta** que se abre al “Postular”.
  - Importante: **no postula automáticamente** al hacer click; se abre una modalidad de propuesta/negociación.
  - Contenido mínimo del formulario:
    - “¿Quién soy?” (presentación breve)
    - “Propuesta / mensaje” (enfoque, experiencia, cómo resolvería el trabajo)
    - “Estimación inicial” (importe fijo y/o rango; y condiciones básicas si aplica)
  - Acciones:
    - Enviar propuesta (simulado)
    - Cancelar y volver al detalle
    - (Opcional) guardar borrador

- Implementar una pantalla **“Mis solicitudes”** para el usuario autenticado.
  - Debe listar al menos:
    - Solicitudes en las que el usuario **ha postulado** (incluyendo su estimación y mensaje)
    - (Opcional MVP) solicitudes “asignadas”/“mías” según rol, con datos demo si aplica
  - Acciones:
    - Ver detalle de la solicitud
    - Ver propuestas (simuladas) asociadas a esa solicitud:
      - Mostrar múltiples propuestas por solicitud (varios postulantes) en formato tipo “comentario”
      - Incluir autor, reputación y acciones placeholder para “Ver perfil” y “Elegir”

- Simular comportamiento sin APIs reales:
  - La lectura de “mis solicitudes / mis propuestas” se hará con **mocks locales** (JSON en `public/mock`) y persistencia en **`localStorage`** para reflejar propuestas “enviadas” durante la sesión.
  - Seed demo:
    - Al acceder a “Mis solicitudes”, si el usuario no tiene datos, se precargan propuestas desde un mock local.
    - Al abrir “Ver propuestas” de una solicitud, se completan/siembran propuestas faltantes para simular múltiples postulantes.

## Capabilities

### New Capabilities
- `open-request-proposal-compose`: Dado un usuario con sesión iniciada, permite componer y enviar (simulado) una propuesta/negociación asociada a una solicitud abierta, incluyendo presentación y estimación.
- `my-requests-dashboard`: Pantalla “Mis solicitudes” que lista solicitudes asociadas al usuario y sus postulaciones/propuestas simuladas, con navegación a detalle.

### Modified Capabilities
- `open-request-detail-page`: El CTA “Postular” deja de ser un placeholder y pasa a abrir el flujo de propuesta.

## Impact

- **Frontend (Angular)**:
  - Nuevas rutas/pantallas: “Propuesta” y “Mis solicitudes”.
  - Componentes de formulario y validaciones básicas (campos requeridos, formatos simples).
  - Estados UX consistentes: loading, empty, error con reintento.
  - Control de acceso basado en la sesión existente (`AuthSessionService`): si no hay sesión, guiar a login/registro sin cortar el flujo.
  - Interacciones MVP (placeholders) dentro de propuestas:
    - “Ver perfil”: abre pop-up indicando “próximamente”
    - “Elegir”: abre pop-up indicando “próximamente”

- **Datos / APIs (MVP mock)**:
  - Data-access de propuestas con `InjectionToken` apuntando a `/mock/...` (similar a `OpenRequestsService`) y persistencia en `localStorage`.
  - Mock local `anyjobs/public/mock/proposals.mock.json` para simular múltiples postulantes por solicitud (candidatos con autor + reputación).
  - Persistencia en `localStorage` para reflejar propuestas enviadas y para mantener el seed demo entre recargas.

## Non-goals (por ahora)

- Backend real para postulación/negociación, mensajería real, estados reales de aprobación/rechazo, pagos.
- Notificaciones push, analítica avanzada o ranking/matching inteligente.

