## Purpose

Definir el comportamiento y requisitos de la página de detalle de una solicitud abierta (galería, sidebar de acción y sección de oferente), incluyendo CTA de postulación contextual según estado de sesión.

## ADDED Requirements

### Requirement: Ruta de detalle de solicitud
El sistema MUST exponer una ruta de detalle para una solicitud identificada por `id`.

#### Scenario: Usuario navega al detalle por URL
- **WHEN** el usuario navega a la URL del detalle de una solicitud existente
- **THEN** el sistema MUST renderizar la página de detalle de la solicitud correspondiente

### Requirement: Header de detalle con metadatos y CTAs de contacto
El detalle MUST mostrar un header con metadatos (p. ej. título/extracto, ubicación, tags, fecha, presupuesto) y acciones de producto acotadas.

La meta de fecha MUST mostrar antigüedad relativa coherente con la publicación real (p. ej. “Hace 1 día”), usando `publishedAtLabel` del modelo ya recalculado por el API.

El header MUST NOT incluir los CTAs **“Ver perfil”** ni **“Contactar”**. El acceso al perfil del creador MUST concentrarse en la sección **“Publicado por”**. Para visitantes que no son el creador, el header MAY mostrar únicamente **“Postular”** (acción que lleva al módulo de postulación en el sidebar).

#### Scenario: Usuario ve metadatos y CTA de postulación
- **WHEN** la página de detalle está renderizada y el usuario no es el creador
- **THEN** el sistema MUST mostrar metadatos clave y MAY mostrar el CTA “Postular”
- **AND** MUST NOT mostrar “Ver perfil” ni “Contactar” en el header
- **AND** la etiqueta de antigüedad MUST NOT quedar fija en “Recién publicado” para solicitudes antiguas

#### Scenario: Creador no ve CTA Postular en header
- **WHEN** el usuario autenticado es el creador de la solicitud
- **THEN** el header MUST NOT mostrar el CTA “Postular”

### Requirement: Galería en el detalle con miniaturas
El detalle MUST mostrar una galería (imagen principal + miniaturas) cuando existan múltiples imágenes asociadas a la solicitud.

#### Scenario: Solicitud con múltiples imágenes
- **WHEN** la solicitud tiene más de una imagen asociada
- **THEN** el sistema MUST mostrar miniaturas además de la imagen principal

### Requirement: Apertura de modal de galería desde el detalle
El detalle MUST permitir abrir el modal de galería al activar la imagen principal o una miniatura.

#### Scenario: Usuario abre el modal desde el detalle
- **WHEN** el usuario activa una imagen en la galería del detalle
- **THEN** el sistema MUST abrir el modal de galería para navegación ampliada

### Requirement: Sidebar sticky con formulario/acción
El detalle MUST mostrar un sidebar “sticky” con el módulo de acción principal adaptado al dominio (p. ej. “Postular”), incluyendo el estado de “requiere cuenta” cuando aplique.

#### Scenario: Usuario ve el sidebar sticky
- **WHEN** el usuario hace scroll en desktop dentro del detalle
- **THEN** el sistema MUST mantener visible el sidebar de acción mientras sea posible (sticky)

#### Scenario: Usuario con sesión ve CTA de Postular
- **WHEN** existe una sesión activa de usuario
- **THEN** el sidebar MUST mostrar un CTA principal equivalente a “Postular” (sin pedir login/registro)

### Requirement: Sección “Ofrecido por” con reputación y comentarios
El detalle MUST mostrar una sección de **publicador** (“Publicado por”) con la identidad del usuario creador cuando `ownerUserId` esté disponible, mediante el patrón compartido de enlace a perfil. El nombre visible MUST obtenerse del perfil público del usuario (`GET /users/profile/:userId`, campo `fullName`) cuando la petición tenga éxito. Reputación, cantidad de reseñas y comentarios ficticios del objeto `provider` MUST NOT mostrarse como datos reales cuando correspondan a valores demo del backend.

#### Scenario: Usuario ve nombre real del publicador
- **WHEN** el detalle incluye `ownerUserId` y el perfil público responde con `fullName`
- **THEN** el sistema MUST mostrar ese nombre en el bloque identitario enlazado al perfil
- **AND** MUST NOT mostrar únicamente el texto genérico “Publicador” si el perfil está disponible

#### Scenario: Usuario ve identidad del publicador enlazable
- **WHEN** el detalle incluye `ownerUserId`
- **THEN** el sistema MUST ofrecer navegación a `/usuarios/:userId` desde la sección “Publicado por”
- **AND** MUST NOT mostrar el bloque demo `provider` (p. ej. “Cliente” / “NUEVO”) como sustituto del publicador

#### Scenario: Usuario ve reputación del oferente solo con datos reales
- **WHEN** el detalle tiene datos de reputación verificables del publicador (contrato futuro o señal explícita no demo)
- **THEN** el sistema MAY mostrar rating y reseñas en la card del publicador

#### Scenario: Usuario ve comentarios
- **WHEN** el detalle incluye `providerReviews` con datos reales no demo
- **THEN** el sistema MUST renderizar la lista de comentarios con autor, rating (si existe) y fecha (si existe)

### Requirement: Descripción larga
El detalle MUST mostrar una descripción larga (mínimo 100 caracteres cuando exista) en la sección “Descripción”, usando `description` si está disponible y haciendo fallback a `excerpt`.

La UI MUST NOT mostrar el UUID técnico (`id`) de la solicitud en la sección de descripción ni en el flujo de éxito del detalle.

#### Scenario: Usuario lee descripción sin identificadores internos
- **WHEN** el detalle se renderiza en estado exitoso
- **THEN** la sección Descripción MUST mostrar solo contenido legible para el usuario final
- **AND** MUST NOT incluir una línea `ID: {uuid}`

### Requirement: Composición responsive del detalle
El layout del detalle (header, galería, cards de contenido, sidebar de postulación) MUST adaptarse sin overflow horizontal ni solapamientos en viewports móvil, tablet y desktop. La columna principal (`main`) MUST usar espaciado vertical consistente entre bloques (p. ej. gap ≥ 16px) de modo que **Descripción** y **Publicado por** se perciban como secciones separadas.

#### Scenario: Vista móvil apilada
- **WHEN** el viewport es estrecho (p. ej. ≤ 640px)
- **THEN** header, galería, contenido y sidebar MUST apilarse en un orden legible
- **AND** los CTAs del header MUST permanecer usables sin desbordar el ancho

#### Scenario: Separación entre Descripción y Publicado por
- **WHEN** el detalle muestra ambas secciones
- **THEN** MUST existir separación visual clara (espacio vertical) entre la card de Descripción y la card de Publicado por

#### Scenario: Vista desktop con sidebar
- **WHEN** el viewport es amplio
- **THEN** el sidebar de postulación MUST mantenerse visible según el patrón sticky existente sin tapar el contenido principal

### Requirement: Visibilidad de postulantes solo para el creador autenticado
El detalle MUST mostrar la sección de postulantes recibidos solo al creador autenticado de la solicitud, únicamente mientras la lista está cargando o se cargó con éxito. MUST NOT mostrar la tarjeta por errores de autenticación/autorización del API de propuestas (p. ej. mensaje “No autenticado.”).

#### Scenario: Visitante no ve postulantes
- **WHEN** el visitante abre `/solicitudes/:id` sin ser el owner
- **THEN** MUST NOT existir bloque “Postulantes” en el DOM renderizado

#### Scenario: Error de autenticación al listar postulaciones
- **WHEN** el creador autenticado en cliente solicita postulaciones y el API responde 401 o 403
- **THEN** MUST NOT renderizarse la tarjeta “Postulantes” con el mensaje de error del API

### Requirement: CTA “Postular” MUST abrir el flujo de propuesta
Cuando exista sesión activa, el CTA “Postular” del detalle MUST abrir el flujo de composición de propuesta asociado a la solicitud, en lugar de ejecutar una postulación inmediata.

#### Scenario: Usuario con sesión abre composición de propuesta desde el detalle
- **WHEN** el usuario tiene sesión iniciada y activa “Postular” en el detalle de una solicitud
- **THEN** el sistema MUST navegar a la pantalla de composición de propuesta asociada a esa solicitud

#### Scenario: Usuario sin sesión es guiado a autenticación
- **WHEN** el usuario no tiene sesión iniciada y activa “Postular” en el detalle de una solicitud
- **THEN** el sistema MUST guiar a iniciar sesión o crear cuenta sin enviar ninguna propuesta automáticamente

## MODIFIED Requirements

<!-- None -->

## REMOVED Requirements

<!-- None -->

