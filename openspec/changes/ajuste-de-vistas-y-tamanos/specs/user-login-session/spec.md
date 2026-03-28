## ADDED Requirements

### Requirement: Puntos de entrada públicos al login
Las vistas públicas que requieran autenticación MUST reutilizar el mismo flujo de login y presentar entry points consistentes para “Iniciar sesión” y “Crear cuenta”, alineados al sistema visual público.

#### Scenario: Usuario no autenticado intenta una acción protegida desde una vista pública
- **WHEN** el usuario activa una acción pública que requiere autenticación
- **THEN** el sistema MUST ofrecer entry points coherentes para iniciar sesión o crear cuenta sin romper la composición visual de la vista actual

#### Scenario: Entry points en viewport estrecho
- **WHEN** los CTAs de autenticación se renderizan en mobile o tablet
- **THEN** el sistema MUST apilar o redistribuir las acciones para mantener legibilidad, foco visible y ausencia de overflow horizontal

## MODIFIED Requirements

### Requirement: El header MUST exponer un punto de login cuando no hay sesión
Cuando no exista sesión activa, el sistema MUST mostrar en el header una acción equivalente a “Iniciar sesión”, visible, accesible y consistente con el sistema visual de las vistas públicas.

#### Scenario: Usuario no logueado ve login
- **WHEN** el usuario carga la app sin sesión activa
- **THEN** el header MUST mostrar una acción para iniciar sesión

#### Scenario: Header público en viewport estrecho
- **WHEN** la navegación pública se renderiza en mobile o tablet sin sesión activa
- **THEN** la acción de login MUST mantenerse visible y operable sin generar overflow horizontal ni perder prioridad visual

### Requirement: El login MUST realizarse mediante un modal con email y password
El sistema MUST permitir iniciar sesión desde un modal con campos `email` y `password`, con validaciones básicas de UI, jerarquía visual clara, tamaño compacto para el contenido de autenticación y comportamiento responsive.

El modal MUST mantenerse dentro del viewport disponible, conservar legibilidad en mobile, tablet y desktop, y permitir que sus acciones principales y secundarias se apilen o redistribuyan sin romper la composición.

Los controles internos del modal MUST respetar el ancho disponible del panel en viewports estrechos; inputs, botones y bloques de formulario MUST evitar desbordes horizontales causados por padding, border o cálculos de ancho inconsistentes.

Los cambios visuales alrededor del login MUST preservar el flujo funcional existente: apertura del modal, envío de credenciales, persistencia de sesión y actualización de UI autenticada.

#### Scenario: Usuario abre modal de login
- **WHEN** el usuario activa “Iniciar sesión”
- **THEN** el sistema MUST abrir un modal de login

#### Scenario: Email inválido bloquea submit
- **WHEN** el usuario introduce un email inválido y envía
- **THEN** el sistema MUST impedir el envío y MUST mostrar error de validación

#### Scenario: Modal de login en mobile
- **WHEN** el modal de login se renderiza en un viewport móvil
- **THEN** el sistema MUST ajustar anchuras, espaciados y acciones para mantener todos los controles visibles y operables sin overflow horizontal

#### Scenario: Inputs y botones respetan el ancho del modal en mobile
- **WHEN** el modal de login se renderiza en un viewport móvil estrecho
- **THEN** el sistema MUST mantener panel, inputs y botones dentro del ancho visible del viewport, sin desborde horizontal real del contenido interactivo

#### Scenario: Modal de login compacto en desktop
- **WHEN** el modal de login se renderiza en desktop
- **THEN** el sistema MUST mantener un ancho contenido y una densidad visual acorde a un formulario corto, sin dejar una superficie vacía desproporcionada

#### Scenario: Ajuste visual no rompe el login
- **WHEN** se introducen cambios de presentación en el header, entry points o modal de login
- **THEN** el sistema MUST seguir permitiendo iniciar sesión correctamente y reflejar el estado autenticado sin regresiones funcionales

## REMOVED Requirements

<!-- None -->
