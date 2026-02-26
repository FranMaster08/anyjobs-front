## Purpose

Definir requisitos de la vista “Mi perfil” accesible tras login, mostrando información relevante del usuario (según datos disponibles en sesión) y ofreciendo acciones básicas como navegar y cerrar sesión.

## ADDED Requirements

### Requirement: El sistema MUST exponer la ruta /perfil
El sistema MUST exponer una ruta equivalente a `/perfil` para visualizar el perfil del usuario.

#### Scenario: Usuario navega a /perfil
- **WHEN** el usuario navega a `/perfil`
- **THEN** el sistema MUST renderizar la vista de perfil

### Requirement: Sin sesión, /perfil MUST mostrar estado vacío
Si no existe sesión activa, la vista MUST mostrar un estado vacío con instrucciones para iniciar sesión.

#### Scenario: Usuario sin sesión
- **WHEN** el usuario navega a `/perfil` sin sesión
- **THEN** el sistema MUST mostrar un mensaje de “no hay sesión” y una acción para volver a una ruta pública

### Requirement: Con sesión, /perfil MUST mostrar información del usuario
Si existe sesión activa, la vista MUST mostrar al menos `fullName`, `email`, `id` y `roles`. MAY mostrar información adicional si está disponible (verificación, ubicación, identidad, preferencias).

#### Scenario: Usuario con sesión ve datos básicos
- **WHEN** el usuario navega a `/perfil` con sesión activa
- **THEN** el sistema MUST mostrar nombre, email, id y roles

### Requirement: /perfil MUST permitir logout
La vista MUST incluir una acción de logout que cierre la sesión del usuario.

#### Scenario: Logout desde perfil
- **WHEN** el usuario activa “Logout” en la vista de perfil
- **THEN** el sistema MUST cerrar la sesión y MUST reflejar el estado no autenticado

## MODIFIED Requirements

<!-- None -->

## REMOVED Requirements

<!-- None -->

