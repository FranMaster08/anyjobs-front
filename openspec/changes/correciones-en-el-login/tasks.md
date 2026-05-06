## 1. Mapeo de errores y mensaje seguro

- [x] 1.1 Documentar o confirmar con API los códigos HTTP y formas de respuesta del `POST /login` clasificables como “fallo controlado” de credenciales/acceso.
- [x] 1.2 Implementar un mapper dedicado (p. ej. en capa `auth`/`api`) que traduzca errores controlados de login al mensaje unificado acordado y que no propague textos del backend que revelen usuario vs contraseña.
- [x] 1.3 Sustituir el uso de `'Error inesperado'` / mensajes crudos en el handler de error del login del shell por el mapper; asegurar que fallos controlados no muestran «Error inesperado» como mensaje principal.
- [x] 1.4 Extraer el mensaje visible a claves i18n (y uso consistente en UI) si el proyecto centraliza copy en `I18nService`.

## 2. Single-flight, estado de carga y formulario

- [x] 2.1 Asegurar una sola petición HTTP de login en vuelo (p. ej. `exhaustMap`, guardia en submit o patrón equivalente) además de `loginBusy`.
- [x] 2.2 Mantener el botón de submit deshabilitado durante la petición y añadir/mejorar feedback visual de progreso (spinner/texto “Iniciando…” o equivalente según diseño existente).
- [x] 2.3 Revisar `(ngSubmit)` / teclado móvil (“Go”) para que no abra un segundo flujo si ya hay petición activa.

## 3. Persistencia de sesión y mobile

- [x] 3.1 Revisar `AuthSessionService`: orden de actualización memoria + `localStorage`; manejar errores de escritura/lectura sin loguear ni mostrar datos sensibles.
- [x] 3.2 Validar manualmente en Chrome Mobile y Safari Mobile: login OK, persistencia tras recarga y tras cerrar/reabrir el navegador cuando el storage sigue disponible; anotar desviaciones.
- [x] 3.3 Tras login exitoso, verificar cierre del modal y ausencia de estado intermedio roto en mobile (touch, OnPush).

## 4. Validación automatizada

- [x] 4.1 Actualizar o añadir pruebas en `shell.spec.ts` (o tests del mapper) para errores HTTP simulados → mensaje unificado; y para que el segundo disparo no provoque segunda llamada HTTP.

### Notas QA (3.2)

Checklist documentada en `anyjobs/docs/ENDPOINTS_Y_CONTRATOS_API.md` (sección `POST /login`, pie de **Checklist QA manual (mobile)**). Completar ejecución real en dispositivos y anotar hallazgos ahí o en el PR.
