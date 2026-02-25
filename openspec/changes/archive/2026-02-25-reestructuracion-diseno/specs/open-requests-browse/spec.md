## ADDED Requirements

<!-- None -->

## MODIFIED Requirements

### Requirement: Estructura de landing basada en referencia
Cuando existan solicitudes para mostrar, la landing MUST seguir una estructura tipo `@reference` (flujo completo estilo inmobiliaria) con secciones navegables:
- Hero en 2 columnas (en desktop): columna izquierda con título/subtítulo, rating/meta, formulario/inputs (si aplica) y CTAs; columna derecha con media destacada y badge.
- Sección principal de listado/grid de cards (p. ej. “Solicitudes destacadas”).
- Sección de “ubicación” con preview y CTA para abrir el modal de mapa, mostrando marcadores de ejemplo cerca de la ubicación del usuario cuando esté disponible.
- Sección de “contacto” con CTAs de soporte de la plataforma (p. ej. tel/mail) o equivalentes del dominio.
- Cada sección MUST exponer un ancla (id) para navegación desde header/footer.

#### Scenario: La landing renderiza hero + secciones principales
- **WHEN** la landing tiene al menos 1 solicitud en el listado
- **THEN** el sistema MUST renderizar el hero y las secciones de listado, ubicación y contacto en el orden definido por el diseño

#### Scenario: Layout responsivo del hero
- **WHEN** el viewport es de tamaño móvil o tablet
- **THEN** el hero MUST colapsar a una sola columna manteniendo legibilidad (sin overflow horizontal)

### Requirement: Solicitud destacada en el hero
La landing MUST mostrar una solicitud destacada en el hero con:
- Extracto/título principal
- Chips/metadatos (si existen)
- CTAs (p. ej. “Ver detalles”, “Contactar” o equivalentes)
- Un bloque de formulario/inputs (p. ej. filtros rápidos o captura mínima) alineado a la referencia

#### Scenario: Existe una solicitud destacada
- **WHEN** el listado contiene 1 o más solicitudes
- **THEN** el sistema MUST elegir una solicitud para el hero y renderizar su extracto, metadatos y CTAs

### Requirement: Acciones en cards
Cada card en la sección principal de cards MUST exponer:
- Una acción primaria para navegar a detalle
- Una acción secundaria (p. ej. “Comparar” o equivalente) que sea no destructiva y no bloquee la navegación

#### Scenario: Usuario usa acción primaria de card
- **WHEN** el usuario activa la acción primaria de una card (p. ej. “Ver detalles”)
- **THEN** el sistema MUST navegar al detalle de la solicitud seleccionada

### Requirement: Ubicación con geolocalización y marcadores cercanos (demo)
La sección “Trabajos en tu zona” SHOULD solicitar geolocalización de forma diferida (cuando la sección sea visible o al abrir el mapa) para:
- Mostrar “tu ubicación” en el mapa.
- Mostrar marcadores cercanos para solicitudes abiertas (demo), basados en offsets alrededor de la ubicación.
- Mostrar una lista “cerca de ti” con distancias aproximadas cuando haya ubicación disponible.

#### Scenario: Usuario habilita ubicación
- **WHEN** el usuario concede acceso a ubicación
- **THEN** el sistema SHOULD mostrar el mapa con el pin del usuario y varios pins cercanos de solicitudes

## REMOVED Requirements

<!-- None -->

