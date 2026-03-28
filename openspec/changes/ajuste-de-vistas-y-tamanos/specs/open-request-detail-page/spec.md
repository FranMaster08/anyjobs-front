## ADDED Requirements

### Requirement: Layout responsive del detalle
La página de detalle MUST adaptar su composición general para mobile, tablet y desktop sin overflow horizontal, manteniendo legibilidad entre header, galería, contenido principal y módulo de acción.

#### Scenario: Vista de detalle en mobile o tablet
- **WHEN** el detalle se renderiza en un viewport móvil o tablet
- **THEN** el sistema MUST reorganizar la composición a una sola columna o a una distribución equivalente que preserve lectura y operabilidad sin desbordes

#### Scenario: Vista de detalle en desktop
- **WHEN** el detalle se renderiza en un viewport desktop
- **THEN** el sistema MUST mantener una composición con contenido principal y módulo de acción diferenciados, alineada al diseño aprobado

## MODIFIED Requirements

### Requirement: Header de detalle con metadatos y CTAs de contacto
El detalle MUST mostrar un header con metadatos (p. ej. título/extracto, ubicación, tags, fecha, presupuesto) y CTAs de acción del producto, manteniendo una jerarquía visual clara y adaptación correcta en mobile, tablet y desktop.

#### Scenario: Usuario ve metadatos y CTAs
- **WHEN** la página de detalle está renderizada
- **THEN** el sistema MUST mostrar metadatos clave y CTAs como “Postular” / “Contactar” sin exponer contacto directo del solicitante

#### Scenario: Header en viewport estrecho
- **WHEN** el header del detalle se renderiza en un viewport estrecho
- **THEN** el sistema MUST permitir que metadatos y CTAs se reordenen o apilen sin recortar contenido ni provocar overflow horizontal

### Requirement: Galería en el detalle con miniaturas
El detalle MUST mostrar una galería (imagen principal + miniaturas) cuando existan múltiples imágenes asociadas a la solicitud, adaptando alturas, proporciones y navegación visual al tamaño de pantalla.

#### Scenario: Solicitud con múltiples imágenes
- **WHEN** la solicitud tiene más de una imagen asociada
- **THEN** el sistema MUST mostrar miniaturas además de la imagen principal

#### Scenario: Galería en viewport reducido
- **WHEN** la galería se renderiza en mobile o tablet
- **THEN** el sistema MUST ajustar la altura de la imagen principal y la disposición de miniaturas para mantener operabilidad y evitar overflow horizontal

### Requirement: Sidebar sticky con formulario/acción
El detalle MUST mostrar un módulo de acción principal adaptado al dominio (p. ej. “Postular”), incluyendo el estado de “requiere cuenta” cuando aplique.

En desktop, el módulo MUST permanecer visible como sidebar sticky mientras sea posible. En tablet y mobile, MUST integrarse como un bloque no sticky dentro del flujo vertical, manteniendo legibilidad, foco visible y acciones operables.

#### Scenario: Usuario ve el sidebar sticky en desktop
- **WHEN** el usuario hace scroll en desktop dentro del detalle
- **THEN** el sistema MUST mantener visible el módulo de acción mientras sea posible sin invadir el contenido principal

#### Scenario: Usuario ve el módulo de acción en mobile o tablet
- **WHEN** el detalle se renderiza en un viewport móvil o tablet
- **THEN** el sistema MUST mostrar el módulo de acción como un bloque integrado al flujo principal, sin sticky y sin overflow horizontal

#### Scenario: Bloque de autenticación del detalle no se desborda en mobile
- **WHEN** el módulo de acción del detalle muestra CTAs de autenticación o contacto en un viewport móvil estrecho
- **THEN** el sistema MUST mantener panel, botones y cualquier control asociado dentro del ancho visible, sin desborde horizontal real del contenido interactivo

#### Scenario: Usuario con sesión ve CTA de Postular
- **WHEN** existe una sesión activa de usuario
- **THEN** el módulo MUST mostrar un CTA principal equivalente a “Postular” sin pedir login o registro adicional

## REMOVED Requirements

<!-- None -->
