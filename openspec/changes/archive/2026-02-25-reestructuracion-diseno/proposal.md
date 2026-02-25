## Why

Queremos reestructurar el diseño y la experiencia de la app para que tenga una base consistente y escalable, reutilizando un patrón de UX ya probado (navegación, secciones, cards, detalle y modales) tomado como referencia de [FranMaster08/immobiliaria](https://github.com/FranMaster08/immobiliaria). Esto reduce fricción, mejora descubrimiento/conversión y acelera el desarrollo de futuras pantallas.

## What Changes

- Rediseño del **layout global**:
  - Header “sticky” con navegación a secciones (anchors) y CTAs.
  - Footer con links a secciones.
  - Comportamiento “scroll to top” al navegar entre rutas.
- Incorporación de **i18n** con selector de idioma (paridad de comportamiento con la referencia).
- Rediseño de la **landing principal** siguiendo el comportamiento de la referencia:
  - Hero en 2 columnas (info + formulario + CTAs) y media destacada con badge.
  - Sección principal de “items” (en la referencia: propiedades; en nuestro dominio: solicitudes abiertas) con grid de cards.
  - Sección de “ubicación” con imagen y **modal de mapa** (cierre por overlay y Escape; bloqueo de scroll).
  - Sección de contacto con CTAs de soporte de la plataforma (tel/mail).
- Nuevo/actualizado **detalle** de item:
  - Header de detalle con metadatos y CTAs internos (Postular/Contactar) sin exponer datos directos del solicitante.
  - **Galería** con miniaturas y **modal de galería** (cierre por overlay y Escape; bloqueo de scroll).
  - Sidebar “sticky” con módulo de acción (p. ej. “Postular”) en estado “requiere cuenta”.
  - Sección “Ofrecido por” con reputación \(0.0–5.0\) y comentarios ficticios.
  - Sección “Descripción” con texto largo (mínimo 100 caracteres cuando exista).
- Componentes compartidos equivalentes a la referencia (Badge, Icon, Button, Input/Select, Card) para consistencia visual.
 - Sistema visual consistente con tokens (paleta, tipografía, sombras, radios) para evitar estilos disparejos.

## Capabilities

### New Capabilities
- `site-shell-navigation`: Layout global (header/footer), navegación por secciones, CTAs globales y scroll-to-top en cambios de ruta.
- `app-i18n-language-selector`: Infraestructura de traducciones y selector de idioma con persistencia/estado.
- `modal-map`: Modal accesible para mapa/ubicación (overlay click, Escape, focus/scroll lock).
- `modal-gallery`: Modal accesible de galería de imágenes (overlay click, Escape, scroll lock).
- `open-request-detail-page`: Página de detalle con header + galería + sidebar de acción “requiere cuenta” + sección de oferente (reputación/comentarios) y descripción larga.

### Modified Capabilities
- `open-requests-browse`: Cambia el comportamiento y estructura del browse/landing para alinearse con el flujo completo de la referencia (hero, sección principal de cards, CTAs, secciones y navegación).

## Impact

- Rutas y navegación:
  - Nuevas rutas y/o reestructuración de rutas existentes para soportar landing + detalle como en la referencia.
  - Anchors de secciones y scroll-to-top en navegación.
- UI/Frontend:
  - Nuevos componentes compartidos (cards, badges, iconos, botones, inputs/selects) y estilos base consistentes.
  - Modales (mapa/galería) con accesibilidad y control de scroll.
- Datos / API:
  - Definir contrato mínimo para alimentar landing y detalle (imágenes, meta, oferente/reputación/comentarios, descripción larga).
  - Posible mock/local data para desarrollo mientras se define API real.
- Testing:
  - Actualización/creación de tests para navegación, modales, y componentes base.

