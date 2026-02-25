## ADDED Requirements

### Requirement: Apertura de modal de galería desde el detalle
El sistema MUST permitir abrir un modal de galería desde el detalle de una solicitud al activar una imagen (principal o miniatura).

#### Scenario: Usuario abre la galería desde la imagen principal
- **WHEN** el usuario hace click/tap en la imagen principal del detalle
- **THEN** el sistema MUST abrir un modal de galería mostrando la imagen seleccionada

### Requirement: Selección de miniaturas
El detalle MUST mostrar miniaturas (si existen múltiples imágenes) y MUST permitir cambiar la imagen activa al seleccionar una miniatura.

#### Scenario: Usuario selecciona una miniatura
- **WHEN** el usuario activa una miniatura distinta
- **THEN** el sistema MUST actualizar la imagen activa mostrada en el detalle

### Requirement: Navegación dentro del modal (siguiente/anterior)
Si la solicitud tiene múltiples imágenes, el modal de galería MUST permitir navegar entre imágenes (p. ej. “siguiente/anterior”).

#### Scenario: Usuario navega a la siguiente imagen
- **WHEN** el modal está abierto y el usuario activa la acción “siguiente”
- **THEN** el sistema MUST mostrar la siguiente imagen de la colección

### Requirement: Cierre por overlay y tecla Escape
El modal de galería MUST poder cerrarse tanto al hacer click/tap en el overlay como al presionar Escape.

#### Scenario: Usuario cierra el modal con Escape
- **WHEN** el modal de galería está abierto y el usuario presiona Escape
- **THEN** el sistema MUST cerrar el modal

#### Scenario: Usuario cierra el modal haciendo click fuera del panel
- **WHEN** el modal de galería está abierto y el usuario hace click/tap en el overlay
- **THEN** el sistema MUST cerrar el modal

### Requirement: Bloqueo de scroll mientras el modal está abierto
Mientras el modal de galería esté abierto, el sistema MUST impedir el scroll del body y MUST restaurarlo al cerrarse.

#### Scenario: Usuario intenta hacer scroll con el modal abierto
- **WHEN** el modal de galería está abierto
- **THEN** el sistema MUST bloquear el scroll del contenido de fondo (body)

## MODIFIED Requirements

<!-- None -->

## REMOVED Requirements

<!-- None -->

