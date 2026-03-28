## Why

Las vistas públicas actuales y el flujo de login no están cumpliendo de forma consistente con el diseño aprobado basado en `@reference` y presentan problemas de adaptabilidad entre mobile, tablet y desktop. Este ajuste es necesario para recuperar coherencia visual, legibilidad y usabilidad en los principales recorridos de exploración y acceso a cuenta.

## What Changes

- Ajustar la landing pública de solicitudes abiertas para que respete la composición visual y jerarquía definidas en `@reference`.
- Corregir el comportamiento responsive de los componentes visibles en vistas públicas para evitar overflow horizontal, cortes de contenido y desalineaciones entre breakpoints.
- Revisar hero, cards, grids, media destacada, CTAs y bloques de contenido para que mantengan proporciones y orden visual correctos en celular, tablet y ordenador.
- Ajustar la vista de detalle para que galería, contenido principal y módulo lateral de acción se adapten correctamente a los distintos tamaños de pantalla.
- Ajustar el flujo de login para que el modal, sus acciones, sus campos y sus puntos de entrada mantengan coherencia visual y responsive con el resto de la experiencia pública, evitando desbordes reales del viewport en móvil.
- Mantener los estados UX ya definidos (loading, empty, error y paginación) sin degradar accesibilidad ni navegación existente.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `open-requests-browse`: Ajustar los requisitos de la landing para exigir cumplimiento visual con la estructura `@reference` y comportamiento responsive consistente en hero, listado y secciones complementarias.
- `open-request-detail-page`: Ajustar los requisitos del detalle para exigir una composición responsive estable para galería, contenido y acciones en mobile, tablet y desktop.
- `user-login-session`: Ajustar los requisitos del flujo de login para exigir una presentación consistente, accesible y responsive del modal y de sus entry points en la navegación pública.

## Impact

- Frontend:
  - Ajustes en `open-requests-landing`, `open-request-card`, `open-request-detail` y superficies vinculadas al login, incluyendo templates y estilos.
- UX/UI:
  - Revisión de espaciados, tamaños, distribución de columnas, prioridades visuales, modal, CTAs y reglas de contención en breakpoints principales.
- Calidad:
  - Actualización de pruebas o validaciones enfocadas en estructura visual, responsividad, accesibilidad y cumplimiento del diseño de referencia.
- Riesgo:
  - Posibles regresiones visuales en vistas públicas si no se valida la composición completa en mobile, tablet y desktop.
