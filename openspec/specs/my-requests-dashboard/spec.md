## Purpose

Definir el comportamiento y requisitos de la pantalla **“Mis solicitudes”** para un usuario autenticado, mostrando solicitudes asociadas a sus propuestas/postulaciones simuladas y permitiendo navegación a detalle.

## ADDED Requirements

### Requirement: Ruta de “Mis solicitudes”
El sistema MUST exponer una ruta dedicada para la pantalla “Mis solicitudes”.

#### Scenario: Usuario navega a “Mis solicitudes”
- **WHEN** el usuario navega a la URL de “Mis solicitudes”
- **THEN** el sistema MUST renderizar la pantalla “Mis solicitudes”

### Requirement: “Mis solicitudes” MUST requerir sesión iniciada
La pantalla “Mis solicitudes” MUST estar disponible únicamente para usuarios con sesión activa.

#### Scenario: Usuario sin sesión intenta acceder
- **WHEN** el usuario no tiene sesión iniciada y accede a “Mis solicitudes”
- **THEN** el sistema MUST bloquear el acceso y MUST mostrar CTAs para iniciar sesión o crear cuenta

#### Scenario: Usuario con sesión accede correctamente
- **WHEN** el usuario tiene sesión iniciada y accede a “Mis solicitudes”
- **THEN** el sistema MUST listar solicitudes asociadas al usuario (según datos simulados)

### Requirement: Listado MUST incluir solicitudes donde el usuario postuló
La pantalla MUST listar, como mínimo, las solicitudes en las que el usuario ha enviado una propuesta simulada.

#### Scenario: Se renderiza el listado con propuestas
- **WHEN** existen propuestas persistidas del usuario para una o más solicitudes
- **THEN** el sistema MUST mostrar un listado donde cada item referencia una solicitud y muestra un resumen de la propuesta (p. ej. estimación y extracto del mensaje)

### Requirement: Acciones por item en el listado
Cada item en “Mis solicitudes” MUST ofrecer acciones mínimas para:
- Navegar al detalle de la solicitud
- Ver la propuesta enviada (MVP: vista read-only o resumen expandible)

#### Scenario: Usuario navega al detalle desde “Mis solicitudes”
- **WHEN** el usuario activa “Ver detalle” en un item
- **THEN** el sistema MUST navegar al detalle de la solicitud correspondiente

#### Scenario: Usuario visualiza su propuesta enviada
- **WHEN** el usuario activa “Ver propuesta” en un item
- **THEN** el sistema MUST mostrar el contenido de la propuesta enviada (al menos “¿Quién soy?”, mensaje y estimación)

### Requirement: Estado vacío cuando no hay solicitudes asociadas
Si el usuario no tiene propuestas o solicitudes asociadas, la pantalla MUST mostrar un estado vacío claro.

#### Scenario: Usuario no tiene propuestas
- **WHEN** no existen propuestas persistidas para el usuario autenticado
- **THEN** el sistema MUST mostrar un empty state con un CTA para explorar solicitudes abiertas

### Requirement: Estados UX de carga y error
La pantalla MUST mostrar estados UX consistentes para carga y error al resolver datos simulados.

#### Scenario: Carga inicial muestra estado de carga
- **WHEN** “Mis solicitudes” está cargando datos simulados
- **THEN** el sistema MUST mostrar un estado de carga (skeleton o equivalente)

#### Scenario: Error al cargar muestra reintento
- **WHEN** ocurre un error al resolver datos de “Mis solicitudes”
- **THEN** el sistema MUST mostrar un estado de error con una acción “Reintentar”

