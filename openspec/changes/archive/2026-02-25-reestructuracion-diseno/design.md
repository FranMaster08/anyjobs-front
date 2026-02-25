## Context

El proyecto `anyjobs/` es una app Angular (v21) con routing standalone-first. Queremos reestructurar el diseño y UX para acercarnos al comportamiento del proyecto de referencia (React + Tailwind + React Router) en [FranMaster08/immobiliaria](https://github.com/FranMaster08/immobiliaria), pero implementándolo en Angular:

- Layout global con header sticky, navegación por secciones (anchors), CTAs y footer.
- Comportamiento “scroll to top” al cambiar de ruta.
- i18n con selector de idioma (cambio en runtime + persistencia).
- Landing con hero + grid de cards + secciones extra (ubicación con modal de mapa; contacto).
- Detalle con galería (modal) + sidebar sticky con formulario/CTA.

Restricciones:
- Evitar dependencias externas no necesarias; preferir capacidades nativas de Angular + utilidades propias (por ejemplo, i18n runtime vía service/diccionarios).
- Mantener accesibilidad: teclado, Escape para cerrar modales, overlay click, y evitar scroll del body cuando un modal está abierto.

## Goals / Non-Goals

**Goals:**
- Replicar el **comportamiento** del flujo Home/Detail del repo de referencia (no su stack) en Angular.
- Definir una arquitectura UI consistente: “shell” global + features, componentes compartidos y modales reutilizables.
- Permitir cambio de idioma en runtime (selector) y mantener textos centralizados.
- Mantener rendimiento y DX: lazy-loading por feature, componentes OnPush, tipado estricto, tests básicos para modales/navegación.

**Non-Goals:**
- No migrar Tailwind ni React; la referencia es funcional/UX.
- No definir lógica de negocio final de “solicitudes” (open requests) ni contratos API definitivos.
- No implementar un CMS ni gestión avanzada de contenido; se parte con mocks/datos mínimos.

## Decisions

- **Arquitectura de navegación (Shell + anchors)**
  - **Decisión**: mantener un `Shell` Angular como layout global (header/footer + `router-outlet`) y permitir anchors de secciones en la landing (p. ej. `#inicio`, `#propiedades`, `#ubicacion`, `#contacto`).
  - **Rationale**: replica el patrón del repo de referencia y mantiene límites claros entre layout y features.
  - **Alternativas**:
    - Navegación por anchors sin shell (solo en una página) → dificulta reuso global y coherencia.

- **Scroll-to-top en cambios de ruta**
  - **Decisión**: implementar un listener de router (NavigationEnd) que haga `window.scrollTo(0,0)` al cambiar de ruta.
  - **Rationale**: paridad con `ScrollToTop` de la referencia; reduce fricción al navegar a detalle y volver.
  - **Alternativas**:
    - Confiar en comportamiento por defecto del navegador → inconsistente.

- **i18n runtime (selector de idioma)**
  - **Decisión**: implementar un `I18nService` (diccionarios en TS/JSON) con estado en signal y persistencia en `localStorage`; exponer `t(key)` y `lang`.
  - **Rationale**: Angular i18n “built-in” es principalmente compile-time; necesitamos runtime switch como la referencia (`useI18n`).
  - **Alternativas**:
    - Añadir librería (p. ej. Transloco/ngx-translate) → posible, pero se evita por ahora para minimizar dependencias.

- **Modales reutilizables (mapa y galería)**
  - **Decisión**: crear componentes modales reutilizables que:
    - cierran con Escape
    - cierran al click en overlay (fuera del panel)
    - bloquean scroll del body mientras están abiertos
    - cumplen accesibilidad mínima (`role="dialog"`, `aria-modal="true"`, labels)
  - **Rationale**: encapsula comportamiento “completo” del repo de referencia (MapModal, GalleryModal).
  - **Alternativas**:
    - Implementación ad-hoc por pantalla → duplicación y riesgo de inconsistencias.

- **Páginas y features**
  - **Decisión**: estructurar por feature area:
    - `features/open-requests/` (landing/browse + secciones)
    - `features/open-request-detail/` (detalle)
    - `shell/` (layout)
    - `components/` (Badge/Icon/Button/Card/Input/Select/Modal)
  - **Rationale**: alinea con convención existente del repo y con el crecimiento modular.

- **Datos y mocks**
  - **Decisión**: soportar mocks locales para poder construir UX y pruebas sin depender de API. El shape final se definirá en specs, pero el mock debe cubrir: listado + detalle + galería.
  - **Rationale**: permite iterar UI y validar flujos de navegación y modales.

- **Sistema visual consistente (tokens)**
  - **Decisión**: centralizar paleta, tipografía, sombras y radios como tokens CSS globales (variables) y reutilizarlos en features/componentes.
  - **Rationale**: evitar colores/estilos “sueltos”, mantener consistencia y reducir deuda visual al iterar pantallas.

## Risks / Trade-offs

- **[Riesgo] i18n runtime “casero” crece en complejidad →** **Mitigación**: mantener API mínima (`t`, `lang`, `setLang`), y si se expande (pluralización/formatos) evaluar librería.
- **[Riesgo] Diferencias entre domain (propiedades) y open requests →** **Mitigación**: definir claramente campos mínimos en specs; mantener textos y labels adaptables.
- **[Riesgo] Accesibilidad de modales (focus trap) →** **Mitigación**: empezar con Escape/overlay/scroll lock y añadir focus management como requisito si es necesario.
- **[Trade-off] Replicar “todo el comportamiento” vs scope →** **Mitigación**: priorizar navegación, modales, layout y secciones; features adicionales (zoom in/out en mapa, etc.) se especifican explícitamente.

## Migration Plan

1. Introducir shell global con header/footer y navegación.
2. Implementar i18n service + selector en header.
3. Reestructurar landing con secciones y cards.
4. Implementar modales (mapa/galería) reutilizables y conectarlos a landing/detalle.
5. Implementar detalle con galería y sidebar sticky.
6. Conectar a datos reales cuando exista API (swap de datasource y tipos).

## Open Questions

- ¿Qué secciones deben existir exactamente en la landing para el dominio “solicitudes” (¿todas: inicio/propiedades/ubicación/contacto)?
- ¿El “booking sidebar” del detalle se convierte en “postular/consultar”, o es un formulario de contacto?
- ¿Qué fuente de iconos y estilo de badges/botones se usará (SVG inline vs set propio)?

