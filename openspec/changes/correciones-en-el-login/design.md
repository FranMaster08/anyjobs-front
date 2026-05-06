## Context

Hoy el login vive en el **shell** (`Shell`): modal con formulario reactivo, `AuthApi.login`, `AuthSessionService` para persistir `token` y `user` en **localStorage** (claves `anyjobs.auth.*`), y manejo de error que usa `Error.message` o el literal **"Error inesperado"** (`shell.ts` y `api-error.utils.ts`). Eso cumple funcionalmente en desktop en muchos casos, pero falla en **claridad** (mensaje genérico) y puede contribuir a **inconsistencias en mobile** si hay carreras de envío, estados intermedios tras escribir en storage o cierres del modal antes de completar actualización de vista. No hay guards de ruta obligatorios en `app.routes.ts`; la “navegación post-login” es principalmente **cerrar modal + reflejar sesión en header** y continuar en la ruta actual.

Restricciones: alcance **frontend**; mensajes sin enumeración de usuarios; sin exponer datos sensibles en UI, consola o almacenamiento inseguro.

## Goals / Non-Goals

**Goals:**

- Mensaje de fallo **controlado** de login unificado y seguro (texto acordado en proposal), sin variantes que distingan usuario vs contraseña.
- **Una petición de login en vuelo**: sin doble envío ni paralelismo accidental; botón deshabilitado y feedback visual mientras dura la petición.
- Paridad funcional **desktop vs mobile** (Chrome Mobile / Safari Mobile) en envío, persistencia, recarga y reapertura del navegador cuando el entorno permite localStorage.
- Transición post-login **coherente**: modal cerrado, formulario saneado, UI autenticada visible; sin estados rotos ni navegación colgada en SPA.

**Non-Goals:**

- MFA, cambio de IdP, rediseño arquitectónico completo de auth.
- Logging persistente en backend solo por esta iniciativa.
- Corregir limitaciones inherentes del motor (p. ej. modo privado con storage bloqueado) más allá de fallar de forma segura y predecible.

## Decisions

1. **Capa única para mapear errores HTTP → mensaje seguro de login**  
   - **Decisión:** Introducir (o extender) un helper específico para errores del endpoint de login que clasifique respuestas **conocidas** (401/403/422/400 según contrato real) y devuelva el mensaje unificado propuesto; errores **no controlados** pueden seguir usando un mensaje genérico distinto solo si no revelan detalle técnico.  
   - **Alternativa:** Seguir usando `toApiErrorMessage` genérico en todos los flujos — **rechazada** porque propaga mensajes del backend que pueden violar política de no enumeración.  
   - **Nota:** `AuthApi.login` puede envolver `HttpClient.post` con `pipe(catchError(...))` **o** el shell puede usar el mapper antes de `loginError.set`, pero **un solo lugar** debe definir la política de texto para login.

2. **Prevención de doble envío con patrón “single flight”**  
   - **Decisión:** Además de `loginBusy`, usar **`exhaustMap` / guardia temprana** desde el disparador del submit (o cancelación explícita de la suscripción anterior) para que un segundo submit durante la petición no abra otro flujo HTTP. Los signals solos no bastan ante doble tap en el mismo ciclo si hay dos rutas de entrada al submit.  
   - **Alternativa:** Solo `[disabled]` en el botón — **insuficiente** ante accesibilidad/programático y race antes del próximo ciclo de detección de cambios.

3. **Persistencia: mantener localStorage con lectura/escritura defensiva**  
   - **Decisión:** Conservar `AuthSessionService` y las mismas claves para no fragmentar sesión; revalidar que **escritura y lectura** ocurren de forma atómica desde la perspectiva de UI (sesión en memoria actualizada junto con storage) y que errores de `QuotaExceeded` / `SecurityError` no dejan mensajes crudos al usuario — mapearlos al mensaje seguro de fallo de sesión o mensaje neutro sin datos sensibles.  
   - **Alternativa:** sessionStorage — **fuera de alcance** salvo evidencia fuerte de ITP/Safari; implicaría migración de datos.

4. **Navegación post-login en SPA sin guards**  
   - **Decisión:** Tras éxito, **cerrar modal**, limpiar error, opcionalmente **reset del formulario** (ya existe), y asegurar **estabilidad de zona Angular** (`ChangeDetectorRef`/`markForCheck` solo si OnPush bloquea señales en algún caso edge en mobile). Si más adelante existe `returnUrl`, centralizar navegación en un único método; en el estado actual, documentar que “destino correcto” = **ruta actual + UI autenticada** salvo producto defina otra regla.  
   - **Alternativa:** `router.navigate` fijo a `/home` — solo si producto lo exige; hoy sería cambio de comportamiento no explícito en proposal.

5. **Pruebas manuales y automatizables**  
   - **Decisión:** Añadir pruebas unitarias en shell (o servicio de login extraído) para: mensaje unificado ante `HttpErrorResponse` simulado; que el segundo submit no dispare segunda llamada; estado `loginBusy` durante la petición. E2E mobile opcional según tooling del repo.

## Risks / Trade-offs

- **[Riesgo]** Backend devuelve mensajes detallados en body — **Mitigación:** no mostrar `error.error` crudo; mapear por status/código estable.
- **[Riesgo]** Safari / storage particionado o bloqueado — **Mitigación:** tratar como fallo controlado con mensaje seguro; no asumir persistencia.
- **[Riesgo]** Regresión en mock (`/mock/`) — **Mitigación:** alinear mock con mismos códigos/mensajes que entorno real para pruebas coherentes.
- **[Trade-off]** Mensaje único reduce diagnóstico para el usuario final — aceptado por seguridad y consistencia con proposal.

## Migration Plan

1. Implementar mapper de errores y single-flight en el flujo de login.
2. Ajustar copy vía i18n si el mensaje vive en catálogos (preferible a string hardcodeado disperso).
3. Verificar en desktop + Chrome Android/iOS + Safari iOS: login ok, refresh, kill app y reabrir.
4. Rollback: revertir commit; no hay migración de datos de usuario.

## Open Questions

- Contrato exacto de errores del endpoint `/login` (status y payload) para el mapa definitivo clasificado como “controlado”.
- Si el producto define **URL de retorno** explícita tras login en algún flujo (p. ej. deep link) — incorporar navegación explícita en esa pieza cuando exista.
