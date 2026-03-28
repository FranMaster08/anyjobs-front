## ADDED Requirements

<!-- None -->

## MODIFIED Requirements

### Requirement: Estructura de landing basada en referencia

Cuando existan solicitudes para mostrar, la landing MUST seguir una estructura tipo `@reference` con una composición estable y reconocible en todos los breakpoints:

- Hero en 2 columnas en desktop: columna izquierda con chips/badges, título principal, descripción breve, resumen de métricas, filtros placeholder y CTAs; columna derecha con media destacada y badge.
- Hero en una sola columna en tablet y mobile, conservando el mismo orden visual y sin overflow horizontal.
- Sección principal de listado/grid de cards con encabezado visible y acciones.
- Sección de “ubicación” con preview y CTA para abrir el modal de mapa.
- Sección de “contacto” con CTAs de soporte de la plataforma (tel/mail o equivalentes).
- Cada sección MUST exponer un ancla (id) para navegación desde header/footer.

#### Scenario: La landing renderiza hero y secciones según la referencia

- **WHEN** la landing tiene al menos 1 solicitud en el listado
- **THEN** el sistema MUST renderizar el hero, la sección principal de cards, ubicación y contacto siguiendo el orden visual definido por `@reference`

#### Scenario: Hero responsivo sin desbordes

- **WHEN** el viewport es de tamaño tablet o móvil
- **THEN** el sistema MUST colapsar el hero a una sola columna manteniendo legibilidad, orden visual y sin overflow horizontal

### Requirement: Solicitud destacada en el hero

La landing MUST mostrar una solicitud destacada en el hero con:

- Extracto o título principal.
- Chips o metadatos disponibles.
- CTAs visibles y operables.
- Integración visual con el bloque de filtros placeholder y el resumen superior, sin romper la jerarquía del hero.

#### Scenario: Existe una solicitud destacada

- **WHEN** el listado contiene 1 o más solicitudes
- **THEN** el sistema MUST elegir una solicitud para el hero y renderizar su extracto, metadatos y CTAs dentro de la composición principal del hero

### Requirement: Acciones en cards

Cada card en “Selección destacada” MUST exponer:

- Una acción primaria para navegar a detalle.
- Una acción secundaria no destructiva alineada al diseño de referencia cuando el layout la permita.

Ambas acciones MUST mantenerse operables y legibles sin provocar desbordes ni colisiones visuales en mobile, tablet y desktop.
Cuando el ancho de la card lo permita, los dos botones MUST renderizarse en una misma fila con tamaño compacto, evitando que ocupen más altura de la necesaria, conservando una separación visual clara entre ambos y sin expandirse visualmente hasta parecer un único bloque continuo.

#### Scenario: Usuario usa acción primaria de card

- **WHEN** el usuario activa la acción primaria de una card
- **THEN** el sistema MUST navegar al detalle de la solicitud seleccionada

#### Scenario: Vista estrecha conserva acciones operables

- **WHEN** la card se renderiza en un viewport estrecho
- **THEN** el sistema MUST reacomodar sus acciones para mantenerlas visibles, enfocables y sin overflow horizontal

#### Scenario: Card mantiene acciones compactas lado a lado

- **WHEN** la card dispone de ancho suficiente para mostrar sus dos acciones principales
- **THEN** el sistema MUST renderizar ambos botones en una misma fila con una altura compacta, un espaciado visible entre ellos, anchuras equilibradas y un balance visual consistente

### Requirement: Responsive layout

La landing MUST ser usable en mobile, tablet y desktop y adaptar hero, grid, cards, secciones complementarias y acciones para mantener legibilidad y escaneabilidad sin overflow horizontal.

#### Scenario: Vista en mobile

- **WHEN** el viewport es de tamaño móvil
- **THEN** el sistema MUST priorizar una sola columna, reducir proporciones rígidas y mantener CTAs, cards y bloques de contenido dentro del ancho visible

#### Scenario: Controles interactivos respetan el ancho visible en mobile

- **WHEN** la landing o sus overlays públicos se renderizan en un viewport móvil estrecho
- **THEN** el sistema MUST mantener botones, inputs, selects, formularios placeholder y paneles auxiliares dentro del ancho visible, sin desborde horizontal real causado por padding, border o cálculos de ancho

#### Scenario: Vista en tablet

- **WHEN** el viewport es de tamaño tablet
- **THEN** el sistema MUST reorganizar columnas, media y acciones para preservar jerarquía visual y evitar cortes o solapamientos

#### Scenario: Vista en desktop

- **WHEN** el viewport es de tamaño desktop
- **THEN** el sistema MUST mostrar una composición de múltiples columnas consistente con el diseño aprobado, manteniendo estabilidad visual entre hero, grid y secciones complementarias

## REMOVED Requirements

<!-- None -->
