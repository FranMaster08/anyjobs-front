## ADDED Requirements

### Requirement: Registro en Angular MUST implementarse como flujo multi-etapa
El sistema MUST implementar el registro en Angular como un flujo multi-etapa con un estado explícito de etapa equivalente a:
`ACCOUNT` → `VERIFY` → `LOCATION` → `ROLE_PROFILE` → `DONE`.

#### Scenario: El usuario inicia el registro
- **WHEN** el usuario navega a la ruta de registro
- **THEN** el sistema MUST inicializar la etapa `ACCOUNT` y renderizar el formulario de cuenta

#### Scenario: El usuario avanza por etapas
- **WHEN** el usuario completa una etapa válida y pulsa “Continuar”
- **THEN** el sistema MUST transicionar a la siguiente etapa permitida por las reglas de gating

### Requirement: El registro MUST usar Reactive Forms con tipado estricto
El sistema MUST implementar los formularios del registro usando Angular Reactive Forms (con TypeScript strict) y MUST exponer un ViewModel consistente para capturar datos por etapa.

#### Scenario: El formulario refleja un ViewModel estable
- **WHEN** el usuario rellena campos del formulario en una etapa
- **THEN** el sistema MUST mantener un modelo de datos en memoria que permita mapear a payloads FE→API sin transformar desde el DOM

### Requirement: Stage ACCOUNT MUST capturar los campos mínimos de cuenta y rol(es)
En `ACCOUNT`, el sistema MUST capturar como mínimo:
- `fullName`
- `email`
- `phoneNumber`
- `password`
- `acceptTerms`
- `selectedRoles` (al menos 1 entre `CLIENT` y `WORKER`)

#### Scenario: No se puede continuar si faltan campos obligatorios
- **WHEN** el usuario intenta continuar con el formulario inválido (por ejemplo, sin roles o sin aceptar términos)
- **THEN** el sistema MUST deshabilitar “Continuar” y MUST mostrar errores de validación en los campos afectados

#### Scenario: El usuario envía el registro inicial
- **WHEN** el usuario completa `ACCOUNT` con campos válidos
- **THEN** el sistema MUST construir un `RegisterRequest` que incluya `fullName`, `email`, `phoneNumber`, `password` y `roles`

### Requirement: Stage ACCOUNT MUST aplicar validaciones consistentes de UI
El sistema MUST aplicar validaciones consistentes para:
- Password fuerte (mínimo 8 caracteres y reglas de complejidad)
- Email con formato válido
- Teléfono con formato válido (E.164 recomendado)
- `acceptTerms` MUST ser `true` para permitir continuar
- `selectedRoles` MUST contener al menos 1 valor

#### Scenario: Password débil bloquea el avance
- **WHEN** el usuario introduce un password que no cumple complejidad
- **THEN** el sistema MUST marcar el campo como inválido y MUST impedir continuar

### Requirement: Stage ACCOUNT MUST validar disponibilidad de email y teléfono con validadores asíncronos
El sistema MUST validar que `email` no esté ya registrado usando un validador asíncrono con debounce, exponiendo el error `emailTaken`. La validación asíncrona de `phoneNumber` (error `phoneTaken`) MUST mantenerse en el código pero MUST quedar deshabilitada funcionalmente mientras la verificación por SMS esté deshabilitada: el sistema MUST NOT bloquear el avance por `phoneTaken` si la verificación de teléfono está deshabilitada.

#### Scenario: Email ya existe bloquea el avance
- **WHEN** el usuario introduce un email ya registrado y el validador asíncrono finaliza
- **THEN** el sistema MUST marcar el control `email` con un error equivalente a `emailTaken` y MUST impedir continuar

#### Scenario: Teléfono ya existe no bloquea el avance mientras SMS está deshabilitado
- **WHEN** el usuario introduce un teléfono ya registrado y el validador asíncrono finaliza
- **THEN** el sistema MUST NOT bloquear el avance si la verificación por SMS está deshabilitada (el error `phoneTaken` puede omitirse o ignorarse en el gating de la etapa)

### Requirement: La respuesta de registro MUST reflejar phoneVerificationRequired=false cuando SMS está deshabilitado
El sistema MUST leer el campo `phoneVerificationRequired` de la respuesta de `POST /auth/register` y MUST usar ese valor para determinar si mostrar o no la etapa de verificación de teléfono. Cuando `phoneVerificationRequired === false`, el sistema MUST omitir la UI de verificación por teléfono en el flujo.

#### Scenario: Registro retorna phoneVerificationRequired=false — UI omite verificación de teléfono
- **WHEN** la API responde a `POST /auth/register` con `phoneVerificationRequired: false`
- **THEN** el sistema MUST NOT mostrar la etapa ni el formulario de verificación por teléfono al usuario

### Requirement: Stage LOCATION MUST capturar ubicación mínima y MUST evitar dirección exacta
En `LOCATION`, el sistema MUST capturar como mínimo `city` y MUST permitir capturar `area` y `countryCode` como opcionales. El sistema MUST NOT solicitar ni persistir durante el onboarding campos de dirección exacta (p. ej. calle, número, piso, postal address).

#### Scenario: La etapa de ubicación no pide dirección exacta
- **WHEN** el usuario visualiza la etapa `LOCATION`
- **THEN** el sistema MUST mostrar campos de ciudad/área/país (según aplique) y MUST NOT mostrar campos de dirección exacta

### Requirement: Stage LOCATION MUST capturar radio de cobertura solo cuando el rol WORKER aplica
El campo `coverageRadiusKm` MUST estar disponible únicamente cuando el usuario haya seleccionado el rol `WORKER`.

#### Scenario: Usuario CLIENT no ve radio de cobertura
- **WHEN** el usuario ha seleccionado solo el rol `CLIENT`
- **THEN** el sistema MUST NOT mostrar ni enviar `coverageRadiusKm`

#### Scenario: Usuario WORKER puede configurar radio de cobertura
- **WHEN** el usuario ha seleccionado el rol `WORKER` y está en `LOCATION`
- **THEN** el sistema MUST permitir capturar `coverageRadiusKm` como parte del payload de ubicación

### Requirement: Stage ROLE_PROFILE MUST capturar mínimos por rol
En `ROLE_PROFILE`, el sistema MUST capturar mínimos por rol:
- Para `CLIENT`: MUST permitir capturar `preferredPaymentMethod` como opcional (solo preferencia UX).
- Para `WORKER`: MUST capturar `categories[]` con al menos 1 valor.

#### Scenario: WORKER requiere categorías antes de finalizar
- **WHEN** el usuario incluye el rol `WORKER` y no selecciona ninguna categoría
- **THEN** el sistema MUST impedir finalizar el registro y MUST marcar `categories` como inválido

#### Scenario: CLIENT puede finalizar sin preferencias de pago
- **WHEN** el usuario incluye solo el rol `CLIENT` y deja `preferredPaymentMethod` vacío
- **THEN** el sistema MUST permitir avanzar/finalizar si el resto de requisitos están satisfechos

### Requirement: El sistema MUST mapear errores de API a errores de formulario de forma uniforme
Cuando una llamada FE→API devuelva un error de validación, el sistema MUST reflejarlo en el/los controles del formulario usando una convención consistente (por ejemplo, un error `api` con un mensaje).

#### Scenario: Error de validación desde API se refleja en el formulario
- **WHEN** el backend devuelve un error de validación asociado a un campo (p. ej. email inválido)
- **THEN** el sistema MUST marcar el control correspondiente con un error equivalente a `api`

