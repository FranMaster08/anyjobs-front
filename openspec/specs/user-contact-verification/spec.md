## ADDED Requirements

### Requirement: El sistema MUST soportar verificación de email y teléfono por OTP
El sistema MUST soportar la verificación de propiedad de `email` y/o `phoneNumber` mediante códigos OTP, integrando llamadas FE→API separadas para email y teléfono.

#### Scenario: El usuario envía un OTP de email
- **WHEN** el usuario introduce un código OTP de email válido y confirma
- **THEN** el sistema MUST enviar un request de verificación de email a la API y MUST actualizar `emailVerified` en el estado del registro cuando sea exitoso

#### Scenario: El usuario envía un OTP de teléfono
- **WHEN** el usuario introduce un código OTP de teléfono válido y confirma
- **THEN** el sistema MUST enviar un request de verificación de teléfono a la API y MUST actualizar `phoneVerified` en el estado del registro cuando sea exitoso

### Requirement: El estado del registro MUST exponer flags de verificación
El sistema MUST mantener flags de estado equivalentes a `emailVerified: boolean` y `phoneVerified: boolean` durante el onboarding.

#### Scenario: La UI refleja el estado de verificación
- **WHEN** se completa una verificación (email o teléfono)
- **THEN** el sistema MUST reflejar el cambio de estado en la UI (p. ej. badge/estado “verificado”)

### Requirement: WORKER MUST requerir teléfono verificado para completar el onboarding mínimo
Si el usuario selecciona el rol `WORKER`, el sistema MUST exigir `phoneVerified === true` para permitir completar el onboarding mínimo (finalizar etapa de verificación o finalizar el flujo, según estrategia).

#### Scenario: WORKER intenta continuar sin teléfono verificado
- **WHEN** el usuario tiene el rol `WORKER` y `phoneVerified === false` e intenta continuar
- **THEN** el sistema MUST bloquear el avance y MUST mostrar un mensaje de que el teléfono debe verificarse

### Requirement: CLIENT MUST poder continuar con una sola verificación, pero el sistema MUST recomendar completar ambas
Si el usuario selecciona solo el rol `CLIENT`, el sistema MUST permitir continuar con al menos una verificación completada (`emailVerified === true` OR `phoneVerified === true`) y MUST recomendar completar ambas.

#### Scenario: CLIENT continúa con solo email verificado
- **WHEN** el usuario tiene solo rol `CLIENT`, `emailVerified === true` y `phoneVerified === false`
- **THEN** el sistema MUST permitir continuar y MUST mostrar una recomendación para verificar el teléfono

#### Scenario: CLIENT continúa con solo teléfono verificado
- **WHEN** el usuario tiene solo rol `CLIENT`, `phoneVerified === true` y `emailVerified === false`
- **THEN** el sistema MUST permitir continuar y MUST mostrar una recomendación para verificar el email

### Requirement: La UI de OTP MUST impedir envío si el código es inválido
El sistema MUST impedir la acción de “Verificar” cuando el OTP está vacío o no cumple el formato esperado por la UI (p. ej. longitud mínima).

#### Scenario: OTP incompleto bloquea verificación
- **WHEN** el usuario introduce un OTP incompleto
- **THEN** el sistema MUST deshabilitar el botón de verificación y MUST mostrar un error de validación local

### Requirement: Errores de verificación MUST mapearse a errores de formulario de forma uniforme
Si la verificación OTP falla (código incorrecto/expirado/intentos agotados), el sistema MUST mapear el error a un error del control correspondiente (por ejemplo, un error `api`) y MUST permitir reintentos según política de backend.

#### Scenario: OTP incorrecto se refleja en el formulario
- **WHEN** la API responde con un error de OTP inválido
- **THEN** el sistema MUST marcar el control OTP con un error equivalente a `api` y MUST mantener al usuario en la etapa de verificación

