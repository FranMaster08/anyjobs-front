## Purpose

Verificación de contacto (email y teléfono) durante el onboarding de registro en el frontend.

## Requirements

### Requirement: El sistema MUST soportar verificación de email y teléfono por OTP
El sistema MUST soportar la verificación de propiedad de `email` mediante código de seguridad, integrando la llamada FE→API para email. La verificación de `phoneNumber` por SMS MUST estar deshabilitada temporalmente: el sistema MUST NOT mostrar la UI de verificación por teléfono ni intentar enviar la solicitud de verificación por SMS a la API.

#### Scenario: El usuario envía un código de seguridad de email
- **WHEN** el usuario introduce un código de seguridad de email válido y confirma
- **THEN** el sistema MUST enviar un request de verificación de email a la API y MUST actualizar `emailVerified` en el estado del registro cuando sea exitoso

#### Scenario: La opción de verificación por teléfono no está disponible
- **WHEN** el usuario está en la etapa de verificación
- **THEN** el sistema MUST NOT mostrar la UI de verificación por teléfono ni el campo de código SMS. Si existe un selector entre email/teléfono, la opción de teléfono MUST estar oculta o visualmente deshabilitada como "no disponible".

### Requirement: El estado del registro MUST exponer flags de verificación
El sistema MUST mantener flags de estado equivalentes a `emailVerified: boolean` y `phoneVerified: boolean` durante el onboarding.

#### Scenario: La UI refleja el estado de verificación
- **WHEN** se completa una verificación (email o teléfono)
- **THEN** el sistema MUST reflejar el cambio de estado en la UI (p. ej. badge/estado “verificado”)

### Requirement: WORKER MUST requerir teléfono verificado para completar el onboarding mínimo
Mientras la verificación por SMS esté deshabilitada, este requisito queda **suspendido**. El sistema MUST NOT bloquear a usuarios con rol `WORKER` por falta de `phoneVerified`. El avance en el flujo de onboarding MUST depender únicamente de `emailVerified === true`.

#### Scenario: WORKER puede continuar con solo email verificado mientras SMS está deshabilitado
- **WHEN** el usuario tiene el rol `WORKER`, `emailVerified === true` y `phoneVerified === false`
- **THEN** el sistema MUST permitir continuar con el onboarding y MUST NOT mostrar mensaje de bloqueo por teléfono no verificado

### Requirement: CLIENT MUST poder continuar con una sola verificación, pero el sistema MUST recomendar completar ambas
Mientras la verificación por SMS esté deshabilitada, el sistema MUST permitir continuar al usuario `CLIENT` con `emailVerified === true` sin mostrar recomendación de verificar teléfono.

#### Scenario: CLIENT continúa con solo email verificado sin recomendación de SMS
- **WHEN** el usuario tiene solo rol `CLIENT` y `emailVerified === true`
- **THEN** el sistema MUST permitir continuar y MUST NOT mostrar recomendación de verificar teléfono mientras SMS esté deshabilitado

### Requirement: La UI de OTP MUST impedir envío si el código es inválido
El sistema MUST impedir la acción de "Verificar" cuando el código de seguridad está vacío o no cumple el formato esperado por la UI (longitud mínima de 6 caracteres).

#### Scenario: Código de seguridad incompleto bloquea verificación
- **WHEN** el usuario introduce un código de seguridad incompleto (menos de 6 caracteres)
- **THEN** el sistema MUST deshabilitar el botón de verificación y MUST mostrar un error de validación local

### Requirement: Errores de verificación MUST mapearse a errores de formulario de forma uniforme
Si la verificación del código de seguridad falla (código incorrecto), el sistema MUST mapear el error a un error del control correspondiente y MUST permitir que el usuario reintente.

#### Scenario: Código de seguridad incorrecto se refleja en el formulario
- **WHEN** la API responde con un error de código inválido (`400`)
- **THEN** el sistema MUST marcar el control del código con un error equivalente a `api` y MUST mantener al usuario en la etapa de verificación

### Requirement: Todos los textos visibles al usuario MUST usar "código de seguridad" en lugar de "OTP"
El sistema MUST reemplazar en toda la UI de verificación los textos que muestren "OTP" por "código de seguridad". Esto incluye:
- Labels de campos de entrada
- Placeholders
- Mensajes de error y validación visibles al usuario
- Mensajes de instrucción o ayuda en pantalla
- Títulos o subtítulos de la etapa de verificación

Los nombres técnicos internos (propiedades de componentes, variables TypeScript, claves de test) MUST NOT cambiarse si hacerlo rompe el contrato con la API o los tests existentes.

#### Scenario: Usuario ve "código de seguridad" en la UI de verificación de email
- **WHEN** el usuario llega a la etapa de verificación de email
- **THEN** el sistema MUST mostrar el término "código de seguridad" en todos los textos visibles relevantes y MUST NOT mostrar la palabra "OTP" en ningún texto legible por el usuario
