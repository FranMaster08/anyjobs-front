## Purpose

Definir el modal de mapa (apertura/cierre, scroll lock) y el render de ubicación + solicitudes cercanas.

## ADDED Requirements

### Requirement: Apertura de modal de mapa desde la landing
El sistema MUST permitir abrir un modal de mapa desde la sección de “ubicación” en la landing.

#### Scenario: Usuario abre el modal de mapa
- **WHEN** el usuario activa el CTA de “Ver mapa” (o equivalente) en la sección de ubicación
- **THEN** el sistema MUST abrir un modal accesible con el contenido del mapa (embed o placeholder)

### Requirement: Cierre por overlay y tecla Escape
El modal de mapa MUST poder cerrarse tanto al hacer click/tap en el overlay como al presionar Escape.

#### Scenario: Usuario cierra el modal con Escape
- **WHEN** el modal está abierto y el usuario presiona la tecla Escape
- **THEN** el sistema MUST cerrar el modal

#### Scenario: Usuario cierra el modal haciendo click fuera del panel
- **WHEN** el modal está abierto y el usuario hace click/tap en el overlay (fuera del panel)
- **THEN** el sistema MUST cerrar el modal

### Requirement: Bloqueo de scroll mientras el modal está abierto
Mientras el modal de mapa esté abierto, el sistema MUST impedir el scroll del body y MUST restaurarlo al cerrarse.

#### Scenario: Usuario intenta hacer scroll con el modal abierto
- **WHEN** el modal de mapa está abierto
- **THEN** el sistema MUST bloquear el scroll del contenido de fondo (body)

### Requirement: Render de mapa con ubicación y solicitudes cercanas
El modal de mapa MUST renderizar un mapa interactivo (Leaflet u equivalente) cuando haya ubicación disponible, mostrando:
- Un marcador de “Tu ubicación”.
- Varios marcadores cercanos de “Solicitudes abiertas” (demo) alrededor del usuario.
- Una leyenda que explique ambos tipos de marcador.

#### Scenario: Usuario abre el modal con ubicación disponible
- **WHEN** el modal se abre y existe `userLocation`
- **THEN** el sistema MUST mostrar el mapa centrado en la ubicación del usuario con marcadores visibles

#### Scenario: Usuario abre el modal sin ubicación
- **WHEN** el modal se abre y no existe `userLocation`
- **THEN** el sistema MUST mostrar un estado “Obteniendo tu ubicación…” o error si falla la geolocalización

## MODIFIED Requirements

<!-- None -->

## REMOVED Requirements

<!-- None -->

