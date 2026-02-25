## Purpose

Definir el comportamiento y requisitos de la página de detalle de una solicitud abierta (galería, sidebar de acción y sección de oferente).

## ADDED Requirements

### Requirement: Ruta de detalle de solicitud
El sistema MUST exponer una ruta de detalle para una solicitud identificada por `id`.

#### Scenario: Usuario navega al detalle por URL
- **WHEN** el usuario navega a la URL del detalle de una solicitud existente
- **THEN** el sistema MUST renderizar la página de detalle de la solicitud correspondiente

### Requirement: Header de detalle con metadatos y CTAs de contacto
El detalle MUST mostrar un header con metadatos (p. ej. título/extracto, ubicación, tags, fecha, presupuesto) y CTAs de acción del producto.

#### Scenario: Usuario ve metadatos y CTAs
- **WHEN** la página de detalle está renderizada
- **THEN** el sistema MUST mostrar metadatos clave y CTAs como “Postular” / “Contactar” (internos) que no expongan contacto directo del solicitante

### Requirement: Galería en el detalle con miniaturas
El detalle MUST mostrar una galería (imagen principal + miniaturas) cuando existan múltiples imágenes asociadas a la solicitud.

#### Scenario: Solicitud con múltiples imágenes
- **WHEN** la solicitud tiene más de una imagen asociada
- **THEN** el sistema MUST mostrar miniaturas además de la imagen principal

### Requirement: Apertura de modal de galería desde el detalle
El detalle MUST permitir abrir el modal de galería al activar la imagen principal o una miniatura.

#### Scenario: Usuario abre el modal desde el detalle
- **WHEN** el usuario activa una imagen en la galería del detalle
- **THEN** el sistema MUST abrir el modal de galería para navegación ampliada

### Requirement: Sidebar sticky con formulario/acción
El detalle MUST mostrar un sidebar “sticky” con el módulo de acción principal adaptado al dominio (p. ej. “Postular”), incluyendo el estado de “requiere cuenta” cuando aplique.

#### Scenario: Usuario ve el sidebar sticky
- **WHEN** el usuario hace scroll en desktop dentro del detalle
- **THEN** el sistema MUST mantener visible el sidebar de acción mientras sea posible (sticky)

### Requirement: Sección “Ofrecido por” con reputación y comentarios
El detalle MUST mostrar una sección “Ofrecido por” con la identidad del oferente (nombre, badge/subtítulo si existen), reputación \(0.0–5.0\), cantidad de reseñas y comentarios ficticios.

#### Scenario: Usuario ve reputación del oferente
- **WHEN** el detalle tiene datos de oferente y reputación
- **THEN** el sistema MUST mostrar el rating y reseñas en la misma card de “Ofrecido por”

#### Scenario: Usuario ve comentarios
- **WHEN** el detalle incluye `providerReviews`
- **THEN** el sistema MUST renderizar una lista de comentarios con autor, rating (si existe) y fecha (si existe)

### Requirement: Descripción larga
El detalle MUST mostrar una descripción larga (mínimo 100 caracteres cuando exista) en la sección “Descripción”, usando `description` si está disponible y haciendo fallback a `excerpt`.

## MODIFIED Requirements

<!-- None -->

## REMOVED Requirements

<!-- None -->

