## 1. Shell global y navegación

- [x] 1.1 Crear layout/shell global con header sticky + footer
- [x] 1.2 Añadir links de navegación por secciones (anchors) en header y footer
- [x] 1.3 Implementar navegación a anchors desde otras rutas (navega a landing + scroll a sección)
- [x] 1.4 Implementar “scroll to top” en cambios de ruta (NavigationEnd)

## 2. i18n y selector de idioma

- [x] 2.1 Implementar `I18nService` con diccionarios y API mínima (`t`, `lang`, `setLang`)
- [x] 2.2 Persistir idioma seleccionado (p. ej. `localStorage`) e inicializarlo al arrancar
- [x] 2.3 Añadir selector de idioma al header y conectar a `I18nService`
- [x] 2.4 Asegurar fallback cuando falten keys (idioma por defecto)

## 3. Componentes UI compartidos base

- [x] 3.1 Definir componentes base equivalentes a la referencia (Badge, Button, Icon, Card, Input, Select) o adaptar los existentes
- [x] 3.2 Unificar estilos base para consistencia entre landing y detalle (spacing, tipografía, sombras, estados hover/focus)

## 4. Landing (`open-requests-browse`) reestructurada por secciones

- [x] 4.1 Actualizar landing para incluir secciones con ids (p. ej. `inicio`, `solicitudes`, `ubicacion`, `contacto`)
- [x] 4.2 Actualizar hero a 2 columnas con: meta/rating, bloque de inputs/form y CTAs
- [x] 4.3 Actualizar sección principal de listado/grid para alinearse con la referencia (título + cards + acciones)
- [x] 4.4 Implementar acciones en cards: primaria a detalle + secundaria (comparar/no destructiva)
- [x] 4.5 Añadir sección de ubicación con CTA “ver mapa” que abra el modal
- [x] 4.6 Añadir sección de contacto con CTAs de soporte (tel/mail) y UI consistente

## 5. Modal de mapa (`modal-map`)

- [x] 5.1 Crear componente de modal reutilizable (overlay + panel) con `role="dialog"` y `aria-modal`
- [x] 5.2 Implementar cierre por overlay y por Escape
- [x] 5.3 Implementar bloqueo/restauración de scroll del body mientras el modal está abierto
- [x] 5.4 Integrar el modal en la sección de ubicación de la landing con mapa interactivo y marcadores (usuario + solicitudes cercanas demo)

## 6. Detalle (`open-request-detail-page`) + galería

- [x] 6.1 Crear/actualizar ruta de detalle y cargar datos del item por `id`
- [x] 6.2 Implementar header de detalle con metadatos + CTAs internos (sin tel/mail al solicitante)
- [x] 6.3 Implementar galería (imagen principal + miniaturas) cuando existan múltiples imágenes
- [x] 6.4 Implementar sidebar sticky con módulo de acción “requiere cuenta” (sin formulario directo)
- [x] 6.5 Integrar apertura de modal de galería desde imagen principal y miniaturas

## 7. Modal de galería (`modal-gallery`)

- [x] 7.1 Crear modal de galería con imagen activa y listado de imágenes
- [x] 7.2 Implementar navegación siguiente/anterior (si hay múltiples)
- [x] 7.3 Implementar cierre por overlay y por Escape
- [x] 7.4 Implementar bloqueo/restauración de scroll del body mientras el modal está abierto

## 8. Datos mock y wiring

- [x] 8.1 Definir shape mínimo de datos para landing y detalle (imágenes/galería, oferente/reputación/comentarios, descripción larga y CTAs internos)
- [x] 8.2 Extender mock local para soportar detalle + galería y secciones requeridas
- [x] 8.3 Ajustar services para consumir mock mientras no exista endpoint real (sin romper tipado)

## 9. Calidad: accesibilidad, tests y verificación

- [x] 9.1 Verificar navegación por teclado y estados focus en header, cards, CTAs y modales
- [x] 9.2 Añadir tests unitarios mínimos para: i18n (persistencia/fallback), modales (Escape/overlay/scroll lock), navegación a anchors
- [x] 9.3 Ejecutar `npm test`, `npm run lint` y `npm run build` y corregir incidencias

