## Purpose

Definir el comportamiento y requisitos de la pantalla de **composición de propuesta** (postulación/negociación) para una solicitud abierta, incluyendo validaciones mínimas, gating por sesión y persistencia simulada sin backend real.

## ADDED Requirements

### Requirement: Ruta de composición de propuesta para una solicitud
El sistema MUST exponer una pantalla de composición de propuesta asociada a una solicitud abierta identificada por `requestId`.

#### Scenario: Usuario navega a la propuesta por URL
- **WHEN** el usuario navega a la URL de composición de propuesta para una solicitud existente
- **THEN** el sistema MUST renderizar la pantalla de propuesta vinculada a ese `requestId`

### Requirement: La propuesta MUST requerir sesión iniciada
El sistema MUST permitir componer/enviar propuestas únicamente cuando exista una sesión activa de usuario.

#### Scenario: Usuario sin sesión intenta acceder a la propuesta
- **WHEN** el usuario no tiene sesión iniciada y accede a la pantalla de propuesta
- **THEN** el sistema MUST bloquear la composición y MUST mostrar CTAs para iniciar sesión o crear cuenta

#### Scenario: Usuario con sesión puede componer propuesta
- **WHEN** el usuario tiene sesión iniciada y accede a la pantalla de propuesta
- **THEN** el sistema MUST habilitar el formulario de propuesta

### Requirement: El formulario MUST capturar presentación, mensaje y estimación
El formulario de propuesta MUST capturar como mínimo:
- “¿Quién soy?” (presentación breve)
- “Propuesta / mensaje” (cómo lo haría, experiencia, enfoque)
- “Estimación inicial” (importe o rango como texto libre en MVP)

#### Scenario: Usuario ve los campos mínimos del formulario
- **WHEN** la pantalla de propuesta se renderiza con sesión iniciada
- **THEN** el sistema MUST mostrar campos editables para “¿Quién soy?”, “Propuesta / mensaje” y “Estimación inicial”

### Requirement: Validación mínima antes de enviar
El sistema MUST impedir el envío de una propuesta si faltan campos obligatorios o el contenido es claramente insuficiente.

#### Scenario: Campos obligatorios vacíos bloquean el envío
- **WHEN** el usuario intenta enviar con “¿Quién soy?” o “Propuesta / mensaje” vacíos
- **THEN** el sistema MUST deshabilitar la acción de envío y MUST mostrar errores de validación en los campos afectados

### Requirement: Enviar propuesta MUST persistir de forma simulada
Al enviar una propuesta, el sistema MUST persistirla de forma simulada (sin backend real) asociándola a `userId` y `requestId`.

#### Scenario: Envío exitoso crea una propuesta persistida
- **WHEN** el usuario con sesión envía una propuesta válida
- **THEN** el sistema MUST guardar la propuesta en persistencia local (p. ej. `localStorage`) y MUST marcarla como enviada (p. ej. status `SENT`)

### Requirement: Confirmación de envío y navegación posterior
Tras un envío exitoso, el sistema MUST mostrar una confirmación clara y ofrecer una navegación a “Mis solicitudes” o volver al detalle.

#### Scenario: Usuario ve confirmación tras enviar
- **WHEN** el envío simulado finaliza con éxito
- **THEN** el sistema MUST mostrar un estado de confirmación y MUST ofrecer una acción para ir a “Mis solicitudes”

### Requirement: Cancelar MUST volver al detalle de la solicitud
El usuario MUST poder cancelar la composición sin enviar y volver al detalle de la solicitud.

#### Scenario: Usuario cancela la propuesta
- **WHEN** el usuario activa “Cancelar”
- **THEN** el sistema MUST navegar de vuelta al detalle de la solicitud correspondiente

### Requirement: Estados UX de carga y error
La pantalla MUST mostrar estados UX consistentes para carga y error al resolver los datos de la solicitud.

#### Scenario: Carga inicial muestra skeleton o estado de carga
- **WHEN** la pantalla de propuesta está resolviendo la información base de la solicitud
- **THEN** el sistema MUST mostrar un estado de carga (skeleton o equivalente) sin romper el layout

#### Scenario: Solicitud inexistente muestra error recuperable
- **WHEN** el `requestId` no existe o no se puede resolver la solicitud
- **THEN** el sistema MUST mostrar un estado de error con una acción para volver al listado o al detalle si aplica

