## Why

Los fallos de login hoy se traducen en un mensaje genérico (“error inesperado”) que no orienta al usuario y oculta errores controlables, mientras que en móvil el acceso es inconsistente: a veces no entra al primer intento, la sesión no se mantiene como se espera o la navegación tras autenticarse falla. Eso erosiona confianza y aumenta abandono. Esta propuesta define un único frente en **frontend**: mensajes seguros y unificados, formulario y estados de petición predecibles, persistencia y redirección coherentes en escritorio y en Chrome Mobile / Safari Mobile.

## What Changes

- Sustituir el mensaje genérico “error inesperado” en fallos de login **controlados** por un mensaje único, seguro y alineado al producto; el texto de referencia para credenciales/red de autenticación controlada es: **“Las credenciales ingresadas no son válidas o no fue posible iniciar sesión.”** No se mostrarán mensajes que distingan usuario vs contraseña (p. ej. “El usuario no existe.” o “La contraseña es incorrecta.”).
- Ajustar el manejo de errores en cliente para mapear respuestas conocidas a mensajes seguros, sin filtrar datos sensibles a UI, consola ni almacenamiento inseguro.
- Endurecer el flujo del formulario de login: estado de carga explícito en el botón, deshabilitación durante la petición, feedback visual, **una sola petición en vuelo** (sin doble submit ni requests concurrentes de login).
- Diagnosticar y corregir en frontend la inconsistencia **mobile**: envío del formulario, escritura/lectura de sesión (token e información de usuario), redirección post-login, comportamiento al refrescar y al cerrar/reabrir el navegador; objetivo de paridad con escritorio donde aplique.
- Definir y validar la **navegación posterior al login exitoso** (destino correcto según reglas del producto) de forma idéntica en alcance funcional en desktop y mobile.
- Mantener el alcance en **cliente**; cualquier ajuste de backend solo si resulta imprescindible para el comportamiento esperado en frontend (sin rediseño del proveedor de identidad ni MFA en esta fase).

## Capabilities

### New Capabilities

_No se introducen capabilities nuevas_: las mejoras amplían y precisan el comportamiento ya cubierto por sesión y login en frontend.

### Modified Capabilities

- `user-login-session`: actualizar requisitos para (1) mensajes de error de login seguros y genéricos ante fallos de credenciales, sin enumeración de usuarios; (2) estados de carga y prevención de múltiples envíos; (3) persistencia y restauración de sesión coherentes en desktop y móvil (incl. refresh y reabrir navegador); (4) redirección post-login estable en todos los entornos de cliente objetivo; (5) compatibilidad explícita con Chrome Mobile y Safari Mobile dentro del alcance frontend.

## Impact

- **Código / módulos típicos**: componente(s) y servicio(s) del modal o pantalla de login, capa que llama al endpoint de autenticación, manejo de errores y toasts/snackbars, stores o servicios de sesión, guards/interceptores y rutas posteriores al login.
- **UX**: texto de error unificado; feedback de “en progreso” en el botón; menor confusión en móvil al reintentar o al volver a la app.
- **QA**: matriz desktop + Chrome Mobile + Safari Mobile para login, refresh, cierre/reapertura y redirección; regresión de sesión persistida.
- **APIs**: consumo igual que hoy salvo necesidad de contratos más claros para mapear errores sin fugas; coordinación puntual si hoy el cliente no puede distinguir fallos controlados.
- **Fuera del alcance de esta proposal**: logs persistentes de backend solo para esta iniciativa; cambio de proveedor de identidad; MFA; rediseño arquitectónico completo de autenticación; cambios estructurales de backend salvo los estrictamente necesarios para el comportamiento frontend acordado.

## Criterios de aceptación (resumen de producto)

- No se muestra “error inesperado” ante fallos **controlados** de login.
- Errores de credenciales: mensaje seguro y unificado; no revela si falló usuario o contraseña.
- El botón de login impide envíos múltiples y requests simultáneas mientras la petición está en curso, con feedback visual.
- Login y sesión válidos funcionan correctamente en desktop y en **Chrome Mobile** y **Safari Mobile**.
- La sesión se mantiene cuando corresponde tras autenticarse; tras refresh, si la sesión sigue vigente, el usuario permanece autenticado.
- La redirección posterior al login es correcta y consistente entre desktop y mobile.
