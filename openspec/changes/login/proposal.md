## Why

Hoy el producto no ofrece un punto claro para **iniciar sesión** ni mantiene una **sesión persistente** (token) en frontend, lo que impide ver un **perfil** y habilitar acciones autenticadas (p. ej. postular/contactar) de forma consistente.

## What Changes

- Añadir una forma visible de **loguearse desde el header** (MVP: modal con email/password).
- Mantener una **sesión de usuario** en FE con persistencia (token + usuario en `localStorage`) y restauración al recargar.
- Exponer navegación a **“Mi perfil”** en el header cuando exista sesión.
- Añadir una página simple **`/perfil`** que muestre datos básicos del usuario y permita **cerrar sesión**.
- (Opcional UX) Desde el CTA “Postular”, guiar al usuario a loguearse (sin bloquear el flujo).

## Capabilities

### New Capabilities
- `user-login-session`: Autenticación en FE (login/logout), persistencia de sesión/token y estado de “logged in”.
- `user-profile-view`: Página de perfil básica (solo lectura) accesible tras login.

### Modified Capabilities
- *(none)*

## Impact

- **Frontend (Angular)**:
  - Cambios en `Shell` (header) para mostrar login/perfil según sesión.
  - Nuevo servicio `AuthSessionService` (signals + `localStorage`) para token/usuario.
  - Extensión de `AuthApi` para soportar `login()` (MVP con mock).
  - Nueva ruta/página `perfil` (`/perfil`).
- **API/Contratos**:
  - Añadir contratos FE para `login` (`LoginRequest`/`LoginResponse`) y shape de usuario en sesión.
  - En MVP, el backend puede ser simulado; el contrato se mantiene para reemplazar el mock luego.

