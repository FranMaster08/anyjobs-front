## Context

El cambio introduce un flujo de registro **multi-etapa** en el frontend **Anyjobs (Angular)**, usando **Reactive Forms** y TypeScript **strict** (standalone-first).

Motivación y alcance funcional están definidos en `proposal.md`:
- Onboarding progresivo para reducir fricción.
- Soporte de roles `CLIENT` y `WORKER` (uno o ambos).
- Verificación de contacto (email/teléfono) con gating por rol.
- Captura mínima en registro (sin dirección exacta ni datos sensibles).

Restricciones clave:
- No capturar dirección exacta durante onboarding.
- Verificación avanzada de identidad (WORKER) es opcional en MVP y se modela como **estado**, no como upload/almacenamiento real.
- Contratos FE→API deben ser explícitos para alinear backend sin acoplar el UI a detalles de persistencia.

## Goals / Non-Goals

**Goals:**
- Definir una **arquitectura FE** clara para el registro por etapas (estado, navegación, persistencia temporal y gating).
- Modelar los **ViewModels** de registro y formularios por etapa (tipados) y su relación con payloads FE→API.
- Establecer un set de **validadores reutilizables** (sync + async) y un **mapeo uniforme de errores** API→Form.
- Asegurar reglas de negocio mínimas:
  - WORKER requiere `phoneVerified` para continuar/activar el rol.
  - WORKER requiere al menos 1 `category` antes de quedar “operable/listable” desde FE.

**Non-Goals:**
- Definir modelo de datos definitivo de backend o persistencia/DB.
- Implementar pagos/payout, documentos sensibles o antifraude avanzado.
- Diseñar UI final pixel-perfect (esto vive en implementación y, si aplica, en specs/UI guidelines).

## Decisions

### 1) Máquina de estados simple para etapas (Registration State)

**Decisión:** Representar el progreso como un estado explícito `stage` (`ACCOUNT` → `VERIFY` → `LOCATION` → `ROLE_PROFILE` → `DONE`) más flags (`emailVerified`, `phoneVerified`) y roles seleccionados.

**Rationale:** Evita lógica dispersa en componentes. Hace que el gating sea declarativo y testeable (p. ej. “WORKER necesita phoneVerified”).

**Alternativas consideradas:**
- Derivar etapa de `router.url` y/o de formularios completos: más frágil y difícil de sincronizar con verificación.
- FSM compleja (lib externa): overhead no justificado para MVP.

### 2) Diseño Angular: standalone-first + feature slice

**Decisión:** Implementar el flujo dentro de un slice de feature (p. ej. `features/auth/registration/` o similar), usando rutas y componentes **standalone**.

**Rationale:** Alinea con defaults modernos de Angular CLI y reduce el acoplamiento. Facilita lazy-loading del onboarding.

### 3) Reactive Forms tipados y ViewModels por etapa

**Decisión:** Usar Reactive Forms con tipado estricto (cuando aplique) y definir VMs por etapa:
- `RegisterFormVM` (ACCOUNT)
- `LocationFormVM` (LOCATION)
- `WorkerProfileFormVM` / `ClientProfileFormVM` (ROLE_PROFILE)
- `RegistrationStateVM` para orquestación

**Rationale:** Mejora robustez con TypeScript strict, reduce errores de mapeo y estandariza payload mapping a API.

### 4) Validación consistente: sync + async validators reutilizables

**Decisión:** Centralizar validadores en utilidades reutilizables:
- Password fuerte (mínimo + complejidad).
- Validadores de formato email/teléfono.
- Async validators con debounce para `emailTaken` / `phoneTaken`.

**Rationale:** UX consistente, menos duplicación y mejores garantías en multistep forms.

**Alternativas consideradas:**
- Validación “solo server-side”: peor UX y más reintentos.
- Validación duplicada por componente: mantenimiento costoso.

### 5) Gating por rol y reglas de “operabilidad”

**Decisión:** Definir reglas en FE (y reflejarlas en contratos/flags de respuesta):
- WORKER: requiere `phoneVerified === true` para permitir avanzar a ciertos pasos y/o activar estado final.
- WORKER: requiere `categories.length >= 1` antes de marcar etapa `DONE` (o antes de permitir finalizar “perfil mínimo”).
- CLIENT: puede continuar con 1 verificación (email o phone) pero se recomienda completar ambas.

**Rationale:** Mantiene el onboarding alineado con el modelo de negocio sin pedir datos sensibles en registro inicial.

### 6) Contratos FE→API como boundary estable

**Decisión:** Encapsular las llamadas en un servicio (p. ej. `AuthApi` / `UserApi`) y mapear de VMs a requests:
- `RegisterRequest/Response`
- `VerifyOtpRequest` (email / phone)
- `UpdateLocationRequest`
- `UpdateWorkerProfileRequest` / `UpdateClientProfileRequest`

**Rationale:** Aísla UI de cambios de backend, permite mocks, y habilita evolucionar specs sin tocar componentes.

### 7) Manejo uniforme de errores API → Forms

**Decisión:** Normalizar errores de validación a nivel de servicio/mapper y aplicar `control.setErrors({ api: message })` o errores por campo.

**Rationale:** Mensajes consistentes y fácil instrumentación de UX (p. ej. resaltar campo inválido).

## Risks / Trade-offs

- **[Riesgo] Contratos API incompletos/variables** → **Mitigación:** definir specs por capability (incluyendo ejemplos de payload) y usar adaptadores/mappers en FE para tolerar cambios.
- **[Riesgo] Async validators (email/phone taken) requieren endpoints** → **Mitigación:** degradar a validación en submit si endpoints no están listos, manteniendo interfaz del validator.
- **[Riesgo] Verificación OTP depende de estrategia (email vs phone obligatorios)** → **Mitigación:** modelar estrategia por flags (`emailVerificationRequired`, `phoneVerificationRequired`, `nextStage`) en `RegisterResponse` y mantener gating configurable.
- **[Trade-off] Más pasos = más complejidad de UX** → **Mitigación:** progreso visible, guardado temporal (estado en memoria/almacenamiento ligero si aplica) y copy claro por etapa.

## Migration Plan

- Introducir rutas/componentes del registro de forma aislada (lazy-loaded) sin afectar flujos existentes.
- Implementar “happy path” primero (ACCOUNT → VERIFY → LOCATION → ROLE_PROFILE) y luego endurecer gating (WORKER phone + categories) con tests.
- Rollback: feature flag o rollback de ruta si el backend aún no soporta OTP/validadores async.

## Open Questions

Para acelerar implementación en MVP, asumimos las opciones más simples (y ajustaremos si backend requiere otra cosa):

- `verifyEmail`/`verifyPhone`: usar **token de sesión/autenticación** (sin `userId` en el request). El `userId` se toma del contexto de sesión si se necesita en FE (p. ej. para telemetría/local state), no como parámetro obligatorio del contrato.
- WORKER en MVP: exigir **solo teléfono verificado** (`phoneVerified === true`). Email verificado queda recomendado pero no bloqueante.
- `coverageRadiusKm`: capturarlo en `LOCATION` **solo si** el rol incluye `WORKER` y tratarlo como **opcional** (si no se completa, se omite del request).
- “active/listable”: definirlo como **gating en FE** (sin depender de un `status` del backend):
  - “active” cuando el usuario completa el flujo mínimo del onboarding.
  - “listable” para WORKER solo cuando `phoneVerified === true` y `categories.length >= 1`.
