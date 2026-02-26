## Why

El frontend (Angular) necesita un **flujo de registro por etapas** (onboarding progresivo) que reduzca fricción y permita capturar solo lo mínimo al inicio, manteniendo un contrato de formularios y validaciones consistente para roles **CLIENT** y **WORKER**.

Ahora es necesario para habilitar un onboarding guiado, con verificación de contacto y gating por rol, sin mezclar “registro inicial” con datos sensibles o de perfil avanzado.

## What Changes

- Añadir un **flujo de registro multi-etapa** en Angular con progreso visible:
  - **Stage 1 (ACCOUNT)**: creación de cuenta (credenciales + contacto) + selección de rol(es).
  - **Stage 2 (VERIFY)**: verificación de email y/o teléfono (OTP) con reglas por rol.
  - **Stage 3 (LOCATION)**: ubicación mínima (sin dirección exacta) y radio de cobertura solo para WORKER.
  - **Stage 4 (ROLE_PROFILE)**: mínimos por rol (CLIENT / WORKER) para poder operar.
  - **Stage 5 (opcional MVP)**: estado de verificación de identidad (Worker), sin documentos ni storage real.
- Definir **ViewModels (FE)** para Angular Reactive Forms (tipos, estados y gating por etapa/rol).
- Definir **validadores reutilizables** y reglas UI consistentes:
  - Password fuerte, email/teléfono con async validators (debounce) para “ya existe”.
  - Botones (p. ej. “Continuar”) deshabilitados si `form.invalid`.
  - Mapeo uniforme de errores API → form (`setErrors({ api: message })`).
- Definir contratos de payload FE → API (para alinear con BE):
  - `register`, `verifyEmail`, `verifyPhone`, `completeProfile` (por rol) y actualización mínima de ubicación.
- Separar explícitamente:
  - **Datos capturados en registro** vs.
  - **Datos a completar después** (perfil completo, payout, documentos, antifraude avanzado).

## Capabilities

### New Capabilities

- `user-registration`: Flujo de registro por etapas en Angular (Reactive Forms), con modelo de datos de registro, validaciones, y reglas de habilitación por etapa.
- `user-contact-verification`: Verificación de email/teléfono (OTP) y reglas de gating por rol (p. ej. teléfono obligatorio para WORKER; CLIENT puede continuar con 1 verificación, recomendado ambas).

### Modified Capabilities

<!-- None -->

## Impact

- **Frontend (Angular)**:
  - Nuevos modelos de formularios/estado (Registration VM + Form VMs por etapa).
  - Componentes/rutas para onboarding por etapas y manejo de estados (progreso, bloqueos por verificación).
  - Librería de validadores reutilizables (password, email, phone) + async validators (emailTaken/phoneTaken) con debounce.
  - Normalización de errores BE→FE para UX consistente.
  - i18n: enums/textos (roles, etapas, estados de verificación, mensajes de validación).
- **API/Contratos**:
  - Necesaria alineación con BE en payloads/responses: `RegisterRequest/Response`, `VerifyOtpRequest`, `UpdateLocationRequest`, `UpdateWorkerProfileRequest`, `UpdateClientProfileRequest`.
- **Restricciones**:
  - No capturar dirección exacta en onboarding.
  - Todo lo sensible (documento, payout) fuera del registro inicial; verificación avanzada solo como estado/flags en MVP.
