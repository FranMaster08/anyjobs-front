## Purpose

Definir el shell global (header/footer) y navegación por secciones (anchors) con scroll-to-top.

## ADDED Requirements

### Requirement: Shell global con header sticky
El sistema MUST renderizar un shell global que incluya un header “sticky” visible en las rutas públicas principales.

#### Scenario: Usuario visualiza el header en landing y detalle
- **WHEN** el usuario navega a la landing de solicitudes abiertas o al detalle de una solicitud
- **THEN** el sistema MUST mostrar el header global con navegación y CTAs

### Requirement: Navegación por secciones (anchors)
El header MUST incluir links a secciones de la landing y permitir navegación por anchors (p. ej. `#inicio`, `#solicitudes`, `#ubicacion`, `#contacto`).

#### Scenario: Usuario navega a una sección desde la landing
- **WHEN** el usuario está en la landing y activa un link de sección del header
- **THEN** el sistema MUST llevar el viewport a la sección correspondiente dentro de la misma página

#### Scenario: Usuario navega a una sección desde otra ruta
- **WHEN** el usuario está en una ruta distinta a la landing (p. ej. detalle) y activa un link de sección del header
- **THEN** el sistema MUST navegar a la landing y posicionarse en la sección solicitada

### Requirement: Footer con links a secciones
El sistema MUST renderizar un footer global con links de navegación a secciones equivalentes a las del header.

#### Scenario: Usuario visualiza el footer y usa un link
- **WHEN** el usuario llega al final de la página
- **THEN** el sistema MUST mostrar el footer con links operables para navegar a secciones

### Requirement: Scroll-to-top al cambiar de ruta
Al cambiar de ruta (navegación del router), el sistema MUST reposicionar el scroll al inicio de la página.

#### Scenario: Navegación a detalle reposiciona el scroll
- **WHEN** el usuario navega desde la landing al detalle de una solicitud
- **THEN** el sistema MUST ubicar el scroll en el inicio de la nueva ruta

## MODIFIED Requirements

<!-- None -->

## REMOVED Requirements

<!-- None -->

