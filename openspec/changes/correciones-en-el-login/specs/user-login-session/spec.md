## ADDED Requirements

### Requirement: Fallos controlados de login MUST mostrar mensaje seguro unificado
Cuando falle el intento de login por credenciales inválidas o por otros fallos controlados del flujo de autenticación que el cliente clasifique como equivalentes a error de acceso (sin detalle de enumeración de usuarios), el sistema MUST mostrar exactamente el siguiente mensaje de usuario (o su equivalente tramitado por i18n con el mismo significado): «Las credenciales ingresadas no son válidas o no fue posible iniciar sesión.» Para esos fallos controlados, el sistema MUST NOT usar el texto «Error inesperado» como mensaje principal.

#### Scenario: Error de credenciales sin distinción usuario/contraseña
- **WHEN** la autenticación falla de forma controlada y el cliente aplica la política de mensaje genérico de login
- **THEN** el usuario MUST ver el mensaje unificado y MUST NOT ver indicación de que solo el usuario o solo la contraseña es incorrecta

#### Scenario: Mensajes explícitamente prohibidos
- **WHEN** el cliente muestra el error de login genérico de credenciales
- **THEN** el sistema MUST NOT mostrar como mensaje principal textos equivalentes a «El usuario no existe.» ni «La contraseña es incorrecta.»

### Requirement: El submit de login MUST ejecutarse como operación única concurrente
Durante una petición de login en curso, el sistema MUST NOT iniciar una segunda petición HTTP de login en paralelo desde el mismo flujo de formulario. El botón de envío MUST impedir nuevos envíos hasta el término de la petición en curso y MUST ofrecer feedback visual claro de que la operación está en progreso.

#### Scenario: Intentos de envío repetidos durante la petición
- **WHEN** el usuario dispara el envío del formulario varias veces mientras una petición de login sigue activa
- **THEN** el sistema MUST mantener como máximo una petición en vuelo y MUST no encolar peticiones adicionales de login hasta completar la activa

#### Scenario: Botón de envío durante carga
- **WHEN** la petición de login está en curso
- **THEN** el control de envío principal MUST permanecer deshabilitado o equivalente que impida reenvío y MUST mostrar feedback visual de progreso

### Requirement: Sesión persistida MUST ser coherente en desktop y mobile compatibles
Tras un login exitoso, el sistema MUST persistir la sesión con la misma semántica en desktop y en **Chrome Mobile** y **Safari Mobile** cuando el almacenamiento del origen está disponible. Si el almacenamiento falla o está bloqueado, el sistema MUST manejar el fallo sin exponer datos sensibles en UI, consola ni almacenamiento inseguro.

#### Scenario: Login exitoso y recarga en mobile
- **WHEN** el usuario completa un login exitoso en **Chrome Mobile** o **Safari Mobile** y recarga la aplicación
- **THEN** el sistema MUST restaurar la sesión si la persistencia sigue vigente para el origen, en línea con el comportamiento de restauración en desktop

## MODIFIED Requirements

### Requirement: Login exitoso MUST persistir sesión y reflejar estado autenticado
Cuando el login sea exitoso, el sistema MUST persistir `token` y `user` (al menos `id`, `email`, `fullName`, `roles`) y MUST reflejar estado autenticado en UI. El sistema MUST completar el cierre del flujo de login (p. ej. modal) de forma que el usuario pueda continuar la navegación en la SPA sin estado intermedio roto atribuible al cliente en desktop y en **Chrome Mobile** y **Safari Mobile**.

#### Scenario: Login exitoso
- **WHEN** la API responde con `LoginResponse { token, user }`
- **THEN** el sistema MUST guardar la sesión y MUST mostrar UI de cuenta (perfil/logout) en el header

#### Scenario: Transición estable en mobile
- **WHEN** el login es exitoso desde **Chrome Mobile** o **Safari Mobile**
- **THEN** el sistema MUST cerrar el flujo de login y MUST reflejar el estado autenticado sin exigir un segundo intento de login solo por una incoherencia del cliente en la misma sesión de uso

### Requirement: La sesión MUST restaurarse al recargar
Si existe sesión persistida, el sistema MUST restaurarla al cargar la app.

#### Scenario: Recarga con token persistido
- **WHEN** el usuario recarga el navegador con una sesión guardada
- **THEN** el sistema MUST restaurar la sesión y considerarlo autenticado

#### Scenario: Reapertura del navegador con persistencia disponible
- **WHEN** el usuario cierra y vuelve a abrir el navegador (o la pestaña) y la persistencia de sesión para el origen sigue disponible
- **THEN** el sistema MUST restaurar la sesión y considerarlo autenticado

#### Scenario: Paridad de restauración en navegadores móviles objetivo
- **WHEN** el usuario abre la app en **Chrome Mobile** o **Safari Mobile** con sesión previamente persistida para el origen
- **THEN** el sistema MUST restaurar la sesión de forma equivalente al comportamiento observado en desktop en las mismas condiciones de persistencia

## REMOVED Requirements

<!-- None -->
