## Purpose

Definir requisitos de autenticación en frontend (login/logout) y persistencia/restauración de sesión (token + usuario) para habilitar UI contextual y acceso a áreas autenticadas.

## Requirements

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

### Requirement: Login modal MUST link to password recovery

When the login modal is open and the user is not authenticated, the system MUST display a visible link or action such as «¿Olvidaste tu contraseña?» that navigates to `/recuperar-contrasena` (without a token query parameter).

#### Scenario: User navigates from login to recovery
- **WHEN** the user opens the login modal and activates the forgot-password link
- **THEN** the application MUST navigate to `/recuperar-contrasena` and MUST close or leave the modal according to existing shell navigation patterns

### Requirement: Login exitoso MUST persistir sesión y reflejar estado autenticado

Cuando el login sea exitoso, el sistema MUST persistir `token` y `user` (al menos `id`, `email`, `fullName`, `roles`) y MUST reflejar estado autenticado en UI. La existencia del token persistido MUST NOT ser la única prueba de autenticación tras un `401` de sesión inválida.

#### Scenario: Login exitoso
- **WHEN** la API responde con `LoginResponse { token, user }`
- **THEN** el sistema MUST guardar la sesión y MUST mostrar UI de cuenta (perfil/logout) en el header

#### Scenario: Token inválido tras login previo
- **WHEN** existe token persistido pero el backend rechaza el Bearer
- **THEN** el sistema MUST considerar al usuario no autenticado aunque el token aún estuviera en almacenamiento antes de la limpieza

### Requirement: La sesión MUST restaurarse al recargar solo si sigue siendo válida

Si existe sesión persistida, el sistema MAY restaurarla temporalmente al cargar la app para UX, pero MUST NOT ejecutar cargas de datos privados que dependan únicamente de la existencia del token en almacenamiento sin validación. Si la validación (petición protegida o probe acordado en diseño) devuelve `401`, el sistema MUST invalidar la sesión de forma centralizada y MUST tratar al usuario como no autenticado.

#### Scenario: Recarga con token persistido válido
- **WHEN** el usuario recarga el navegador con una sesión guardada y el backend acepta el token en la primera validación protegida
- **THEN** el sistema MUST mantener estado autenticado y MUST permitir cargas privadas normales

#### Scenario: Recarga con token persistido inválido o expirado
- **WHEN** el usuario recarga con `token` en `localStorage` pero el backend responde `401` en validación o primera petición protegida
- **THEN** el sistema MUST eliminar persistencia de sesión, MUST actualizar `isLoggedIn` a falso y MUST NOT mostrar datos privados del usuario

### Requirement: Logout MUST limpiar la sesión persistida

El sistema MUST permitir cerrar sesión y MUST limpiar cualquier persistencia asociada mediante el mismo mecanismo de limpieza que la expiración (sin mensaje de sesión expirada salvo que el producto lo requiera explícitamente en logout).

#### Scenario: Usuario hace logout
- **WHEN** el usuario ejecuta “Logout”
- **THEN** el sistema MUST eliminar `token`/`user` persistidos y MUST volver a estado no autenticado

### Requirement: Vistas privadas MUST NOT cargar datos sin sesión válida

Las vistas que requieren autenticación (perfil, mis solicitudes, crear solicitud, composer de propuestas, etc.) MUST comprobar estado autenticado real antes de disparar peticiones privadas y MUST abrir el flujo de login si no hay sesión válida.

#### Scenario: Acceso a ruta privada sin token
- **WHEN** el usuario navega a una vista privada sin sesión válida
- **THEN** el sistema MUST NOT cargar datos privados del backend y MUST ofrecer el flujo de login (`?login=1` o patrón shell existente)

#### Scenario: Acceso a ruta privada con token inválido
- **WHEN** el usuario navega a una vista privada con token persistido inválido
- **THEN** la primera petición protegida MUST provocar limpieza centralizada y el usuario MUST NOT seguir viéndose como logueado en header ni en la vista
