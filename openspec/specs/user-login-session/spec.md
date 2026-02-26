## Purpose

Definir requisitos de autenticación en frontend (login/logout) y persistencia/restauración de sesión (token + usuario) para habilitar UI contextual y acceso a áreas autenticadas.

## ADDED Requirements

### Requirement: El header MUST exponer un punto de login cuando no hay sesión
Cuando no exista sesión activa, el sistema MUST mostrar en el header una acción equivalente a “Iniciar sesión”.

#### Scenario: Usuario no logueado ve login
- **WHEN** el usuario carga la app sin sesión activa
- **THEN** el header MUST mostrar una acción para iniciar sesión

### Requirement: El login MUST realizarse mediante un modal con email y password
El sistema MUST permitir iniciar sesión desde un modal con campos `email` y `password`, con validaciones básicas de UI.

#### Scenario: Usuario abre modal de login
- **WHEN** el usuario activa “Iniciar sesión”
- **THEN** el sistema MUST abrir un modal de login

#### Scenario: Email inválido bloquea submit
- **WHEN** el usuario introduce un email inválido y envía
- **THEN** el sistema MUST impedir el envío y MUST mostrar error de validación

### Requirement: Login exitoso MUST persistir sesión y reflejar estado autenticado
Cuando el login sea exitoso, el sistema MUST persistir `token` y `user` (al menos `id`, `email`, `fullName`, `roles`) y MUST reflejar estado autenticado en UI.

#### Scenario: Login exitoso
- **WHEN** la API responde con `LoginResponse { token, user }`
- **THEN** el sistema MUST guardar la sesión y MUST mostrar UI de cuenta (perfil/logout) en el header

### Requirement: La sesión MUST restaurarse al recargar
Si existe sesión persistida, el sistema MUST restaurarla al cargar la app.

#### Scenario: Recarga con token persistido
- **WHEN** el usuario recarga el navegador con una sesión guardada
- **THEN** el sistema MUST restaurar la sesión y considerarlo autenticado

### Requirement: Logout MUST limpiar la sesión persistida
El sistema MUST permitir cerrar sesión y MUST limpiar cualquier persistencia asociada.

#### Scenario: Usuario hace logout
- **WHEN** el usuario ejecuta “Logout”
- **THEN** el sistema MUST eliminar `token`/`user` persistidos y MUST volver a estado no autenticado

## MODIFIED Requirements

<!-- None -->

## REMOVED Requirements

<!-- None -->

