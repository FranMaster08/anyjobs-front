## ADDED Requirements

### Requirement: Landing pública de solicitudes abiertas
El sistema MUST exponer una vista pública tipo landing que permita descubrir solicitudes de trabajo abiertas.

#### Scenario: Usuario accede a la landing
- **WHEN** el usuario navega a la URL de la landing de solicitudes abiertas
- **THEN** el sistema MUST renderizar la pantalla de “solicitudes abiertas”

### Requirement: Carga inicial del listado
La landing MUST solicitar y renderizar un listado de solicitudes abiertas ordenadas por fecha de publicación descendente (más recientes primero).

#### Scenario: La landing carga datos correctamente
- **WHEN** la landing se inicializa
- **THEN** el sistema MUST solicitar la primera página del listado de solicitudes abiertas

#### Scenario: El orden por defecto es “más recientes”
- **WHEN** el sistema construye la solicitud de listado sin un orden explícito del usuario
- **THEN** el sistema MUST aplicar un orden por defecto equivalente a “más recientes primero”

### Requirement: Contenido mínimo por card de solicitud
Cada solicitud en el listado MUST renderizarse como una card con información mínima para escaneo rápido:
- Imagen representativa (o placeholder si no existe)
- Comentario/descripcion corta (extracto)
- Metadatos clave disponibles (p. ej. categoría/etiquetas, ubicación/remoto, fecha, presupuesto/rango)

#### Scenario: Solicitud con imagen disponible
- **WHEN** una solicitud incluye URL de imagen representativa válida
- **THEN** la card MUST renderizar dicha imagen

#### Scenario: Solicitud sin imagen disponible
- **WHEN** una solicitud no incluye imagen representativa
- **THEN** la card MUST renderizar un placeholder visual consistente

### Requirement: Estructura de landing basada en referencia
Cuando existan solicitudes para mostrar, la landing MUST seguir una estructura tipo `@reference`:
- Hero en 2 columnas (en desktop): columna izquierda de información/CTAs y columna derecha con media destacada y badge.
- Sección inferior “Selección destacada” con cards en grid.

#### Scenario: La landing renderiza hero + selección destacada
- **WHEN** la landing tiene al menos 1 solicitud en el listado
- **THEN** el sistema MUST renderizar un hero con media destacada y una sección “Selección destacada” con cards

#### Scenario: Layout responsivo del hero
- **WHEN** el viewport es de tamaño móvil o tablet
- **THEN** el hero MUST colapsar a una sola columna manteniendo legibilidad (sin overflow horizontal)

### Requirement: Solicitud destacada en el hero
La landing MUST mostrar una solicitud destacada en el hero con:
- Extracto/título principal
- Chips/metadatos (si existen)
- CTA principal para navegar al detalle

#### Scenario: Existe una solicitud destacada
- **WHEN** el listado contiene 1 o más solicitudes
- **THEN** el sistema MUST elegir una solicitud para el hero y renderizar su extracto y CTAs

### Requirement: Acciones en cards
Cada card en “Selección destacada” MUST exponer al menos una acción primaria para navegar a detalle.

#### Scenario: Usuario usa acción primaria de card
- **WHEN** el usuario activa la acción primaria de una card (p. ej. “Ver detalles”)
- **THEN** el sistema MUST navegar al detalle de la solicitud seleccionada

### Requirement: Navegación a detalle desde una card
El usuario MUST poder navegar al detalle de una solicitud desde la card correspondiente.

#### Scenario: Usuario abre el detalle desde una card
- **WHEN** el usuario hace click/tap en una card (o en su CTA principal)
- **THEN** el sistema MUST navegar al detalle de la solicitud seleccionada

### Requirement: Estados de carga (skeleton)
Durante la carga inicial del listado, la landing MUST mostrar skeletons (no un spinner global) para mantener la estructura del layout.

#### Scenario: La landing está cargando
- **WHEN** el listado aún no está disponible por estar en progreso la solicitud de datos
- **THEN** el sistema MUST mostrar skeletons de cards/listado

### Requirement: Estado vacío
Si no existen solicitudes abiertas para mostrar, la landing MUST mostrar un estado vacío con mensaje claro y sin error.

#### Scenario: No hay solicitudes abiertas
- **WHEN** la respuesta del listado contiene 0 elementos
- **THEN** el sistema MUST mostrar un empty state (sin cards) con un mensaje explicativo

### Requirement: Estado de error recuperable
Si la solicitud de listado falla, la landing MUST mostrar un estado de error y permitir reintentar.

#### Scenario: Fallo al cargar el listado
- **WHEN** la solicitud de listado devuelve error de red o servidor
- **THEN** el sistema MUST mostrar un estado de error con una acción “Reintentar”

#### Scenario: Usuario reintenta tras error
- **WHEN** el usuario activa “Reintentar”
- **THEN** el sistema MUST volver a ejecutar la solicitud de listado

### Requirement: Paginación / carga incremental
Si el backend indica que existen más resultados además de la primera página, la landing MUST ofrecer una forma de cargar más solicitudes (p. ej. botón “Ver más” o scroll infinito).

#### Scenario: Hay más resultados disponibles
- **WHEN** la respuesta del listado indica que existen resultados adicionales (p. ej. `hasMore=true` o `nextPage` presente)
- **THEN** el sistema MUST habilitar un mecanismo para cargar la siguiente página

### Requirement: Responsive layout
La landing MUST ser usable en mobile/tablet/desktop y adaptar el grid/listado para mantener legibilidad y escaneabilidad.

#### Scenario: Vista en mobile
- **WHEN** el viewport es de tamaño móvil
- **THEN** el sistema MUST mostrar un layout que priorice una columna y evite overflow horizontal

#### Scenario: Vista en desktop
- **WHEN** el viewport es de tamaño desktop
- **THEN** el sistema MUST mostrar un grid con múltiples columnas (según el diseño) manteniendo consistencia de cards

### Requirement: Accesibilidad de cards e interacciones
Los elementos interactivos de la landing MUST ser navegables por teclado y tener nombres accesibles.

#### Scenario: Navegación por teclado
- **WHEN** el usuario navega con teclado (Tab/Shift+Tab)
- **THEN** el foco MUST recorrer las cards/CTAs de forma visible y operable

#### Scenario: Texto alternativo de imágenes
- **WHEN** una imagen aporta información (no decorativa)
- **THEN** el sistema MUST proveer un `alt` útil; y si es decorativa, MUST no introducir ruido para lectores de pantalla

## MODIFIED Requirements

<!-- None -->

## REMOVED Requirements

<!-- None -->
