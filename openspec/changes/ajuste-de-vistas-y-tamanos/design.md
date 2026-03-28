## Context

Las capacidades afectadas ya existen y hoy presentan dos problemas funcionales para UX: incumplimiento visual respecto a `@reference` y comportamiento responsive inconsistente en landing, detalle y flujo de login. La implementación actual ya resuelve fetch, estados UX, navegación y parte de la composición visual, por lo que el cambio debe concentrarse en ajustar estructura de template y estilos locales sin introducir dependencias nuevas ni alterar la orquestación route-level.

Las áreas principales son:

- `open-requests-landing`: hero, grid de cards, bloque de ubicación y contacto.
- `open-request-card`: proporciones, cortes de contenido y acciones en breakpoints reducidos.
- `open-request-detail`: header, galería, layout principal y sidebar de acción.
- `shell` y puntos de entrada de autenticación: acción de login en header, modal de login y CTAs de acceso desde vistas públicas.

Restricciones relevantes:

- Mantener `loading`, `empty`, `error` y paginación.
- Conservar accesibilidad existente y reforzar foco visible, `type="button"` y `alt` útil.
- Respetar la regla del proyecto para `open-requests-landing`: hero de 2 columnas en desktop, composición basada en `@reference` y route-level component como orquestador.
- Mantener el comportamiento actual de autenticación y persistencia de sesión; el alcance es visual, estructural y responsive.

## Goals / Non-Goals

**Goals:**

- Alinear la landing con la jerarquía visual esperada en `@reference`, especialmente hero, media destacada, CTAs y sección de cards.
- Garantizar layouts estables en mobile, tablet y desktop, evitando overflow horizontal, desbordes de media y CTAs apretados.
- Unificar criterios de breakpoints, espaciado y distribución entre landing, card y detalle.
- Alinear el flujo de login con el mismo sistema visual, asegurando que modal, campos, botones y entry points sean legibles, accesibles y estables en los tres tamaños objetivo.
- Mantener intacta la lógica de datos y estados, limitando el cambio a composición y presentación.

**Non-Goals:**

- No rediseñar el flujo de negocio ni cambiar endpoints, modelos o navegación principal.
- No introducir librerías de layout, grid o responsive helpers.
- No convertir filtros placeholder en filtros funcionales.
- No modificar la semántica del login, la persistencia de sesión ni las reglas de autenticación.
- No rehacer el contenido del diseño de referencia más allá de lo necesario para cumplir estructura, orden visual y adaptabilidad.

## Decisions

### 1. Mantener los componentes route-level y ajustar la UI por capas

La landing y el detalle ya concentran correctamente fetch y estados, por lo que la implementación seguirá usando estos componentes como orquestadores. Los cambios se harán en tres niveles:

- Reordenar markup solo cuando sea necesario para reflejar la composición esperada.
- Ajustar SCSS local con breakpoints explícitos y reglas de contención.
- Mantener `open-request-card` como unidad reusable para que el grid herede el comportamiento responsive corregido.
- Mantener el login centralizado en el shell y reutilizar sus puntos de apertura desde detalle y otras vistas públicas.

**Rationale:** minimiza regresiones en datos y routing, y respeta la arquitectura existente.

**Alternatives considered:**

- Extraer nuevos subcomponentes de layout ahora mismo. Se descarta en esta etapa porque aumentaría el alcance sin resolver primero el incumplimiento visual.

### 2. Estandarizar responsive con enfoque desktop-first moderado y overrides descendentes

Se mantendrá la base visual actual, pero con breakpoints consistentes para tres rangos:

- Desktop amplio: `>= 1100px`
- Tablet / desktop reducido: `700px - 1099px`
- Mobile: `< 700px`

En cada vista se corregirán explícitamente:

- número de columnas,
- tamaños máximos de media,
- wrapping de CTAs y metadatos,
- padding interno,
- altura de imágenes y bloques sticky.

Además se añadirán reglas de seguridad para evitar overflow:

- `minmax(0, 1fr)` en grids donde corresponda,
- reducción controlada de `font-size` en títulos principales,
- `width: 100%` en botones de grupos estrechos,
- límites de altura/aspect-ratio en media,
- `box-sizing: border-box` y `min-width: 0` en controles que deban respetar el ancho disponible,
- `max-width: 100%` en paneles y formularios renderizados dentro de overlays o contenedores estrechos.

**Rationale:** el problema reportado es de adaptación entre dispositivos; la solución debe ser deliberada y verificable por breakpoint, no confiar solo en `auto-fit`.

**Alternatives considered:**

- Rehacer todo mobile-first. Es válido, pero para este ajuste incremental resulta más costoso y arriesga alterar demasiado una UI ya parcialmente construida.

### 3. Ajustar la landing para cumplir `@reference` desde estructura y no solo desde estilos

La landing ya contiene hero, listado, ubicación y contacto. El ajuste se enfocará en reforzar la composición requerida:

- Hero con dos columnas en desktop y una sola en tablet/mobile.
- Columna izquierda con badges, título, descripción, resumen, filtros placeholder y CTAs.
- Columna derecha con media destacada y badge.
- Sección inferior de cards con encabezado y acciones claras.

Se revisará especialmente:

- orden visual de bloques en hero,
- balance entre texto y media,
- ancho de campos del formulario placeholder,
- alineación de CTAs,
- separación vertical entre secciones.

**Rationale:** la referencia define una estructura, no solo un look-and-feel; si la jerarquía DOM y el layout no la reflejan, el cumplimiento seguirá siendo parcial.

**Alternatives considered:**

- Intentar resolver la discrepancia únicamente con ajustes cosméticos de SCSS. Se descarta porque parte del problema es de jerarquía y proporciones.

### 4. Corregir card y detalle como superficies responsive independientes

`open-request-card` y `open-request-detail` deben adaptarse por sí mismos, no depender solo del contenedor padre.

Para cards:

- revisar `aspect-ratio` y alturas visuales de media,
- permitir mejor wrapping de acciones,
- mantener la pareja de botones en formato horizontal y compacto cuando el ancho de la card lo permita,
- asegurar una separación visual suficiente entre ambos botones para que no se perciban pegados,
- evitar que ambos botones llenen visualmente todo el ancho del bloque de acciones si eso reduce la claridad del espacio entre ellos,
- asegurar que título y metadata no rompan el ancho disponible,
- mantener acciones primaria/secundaria operables en mobile.

Para detalle:

- colapsar layout principal a una columna antes de que el sidebar estreche demasiado el contenido,
- reducir alturas fijas de imagen en pantallas pequeñas,
- asegurar que miniaturas, header actions y sidebar no generen scroll horizontal,
- convertir sticky sidebar en bloque estático bajo cierto breakpoint.

**Rationale:** gran parte de los defectos responsive suele venir de componentes internos con tamaños rígidos.

**Alternatives considered:**

- Ajustar solo el contenedor padre. Se descarta porque no evita roturas dentro de cards, galerías o grupos de acciones.

### 5. Preservar el flujo de login como superficie sensible

El login no debe tratarse como una excepción aislada, porque aparece desde el header global y desde CTAs contextuales en detalle y composición de propuesta. Sin embargo, después de una primera implementación fallida, el cambio queda restringido: el flujo funcional de login debe preservarse exactamente como está y cualquier corrección debe concentrarse en presentación, compactación del modal y ergonomía responsive.

La decisión corregida es:

- no modificar la lógica de autenticación, persistencia o restauración de sesión,
- mantener el mismo punto de entrada en `shell` y reutilizarlo desde las vistas públicas,
- permitir ajustes mínimos y reversibles de markup/atributos del formulario cuando mejoren accesibilidad móvil o legibilidad del modal,
- compactar el modal `sm` y redistribuir sus acciones en viewports estrechos sin alterar el comportamiento del submit,
- reforzar la contención del modal y de sus controles para evitar overflow horizontal real en mobile, incluso cuando inputs y botones usen padding y border,
- priorizar consistencia visual en landing y detalle sin sacrificar la operabilidad de una superficie crítica ya funcional.

**Rationale:** el login forma parte del recorrido principal del usuario no autenticado y una regresión allí tiene más severidad que una mejora visual marginal.

**Alternatives considered:**

- Tratar login como un cambio separado. Se descarta porque los entry points ya forman parte directa del detalle y del shell público.

### 6. Verificación visual dirigida en lugar de cambios de comportamiento

La validación del cambio se enfocará en comprobar:

- landing y detalle en mobile, tablet y desktop,
- login desde header y desde CTAs públicos como verificación visual y funcional de no regresión,
- ausencia de overflow horizontal,
- ausencia de desborde real de panel, inputs y botones dentro del modal de login en viewports móviles estrechos,
- legibilidad de hero, cards, galería, sidebar y modal,
- continuidad de estados `loading`, `empty`, `error` y paginación,
- foco visible y operabilidad de CTAs.

Si existen tests cercanos útiles, se actualizarán; de lo contrario, la verificación principal será visual y manual por breakpoint.

**Rationale:** el riesgo principal es regresión visual, no lógica de negocio.

## Risks / Trade-offs

- [Ajustar demasiados estilos en una sola pasada] -> Mitigar agrupando cambios por superficie (`landing`, `card`, `detail`) y verificando cada una por breakpoint.
- [Cumplimiento visual ambiguo respecto a `@reference`] -> Mitigar usando la estructura definida en reglas del proyecto como criterio mínimo obligatorio.
- [Sidebar o galerías sigan provocando overflow en dispositivos medianos] -> Mitigar con pruebas específicas en tablet y con límites explícitos de ancho/alto.
- [Una mejora visual en login reintroduzca regresiones funcionales] -> Mitigar evitando cambios estructurales en `shell`/modal y validando el inicio de sesión antes de considerar cualquier ajuste adicional.
- [El modal de login siga desbordando en móvil por cálculo de ancho de controles] -> Mitigar añadiendo reglas de contención explícitas (`box-sizing`, `max-width`, `min-width: 0`) y validando en viewports estrechos reales.
- [Cambios visuales rompan tests existentes] -> Mitigar revisando specs/tests cercanos y actualizándolos solo si cubren comportamiento realmente afectado.
- [Degradar accesibilidad al reorganizar CTAs o media] -> Mitigar preservando labels, foco visible, `type="button"` y textos alternativos útiles.

## Migration Plan

No requiere migración de datos ni despliegue escalonado.

Implementación sugerida:

1. Ajustar `open-requests-landing` para cumplir estructura y breakpoints.
2. Ajustar `open-request-card` para que acompañe el grid sin roturas.
3. Ajustar `open-request-detail` y su sidebar/galería para mobile-tablet-desktop.
4. Preservar el login actual, reforzar la contención responsive del modal/campos y validar explícitamente que siga iniciando sesión correctamente tras los cambios en vistas públicas.
5. Verificar estados UX y navegación.
6. Ejecutar validación visual y lints/tests relevantes.

Rollback:

- Revertir cambios de template/SCSS de las vistas públicas afectadas si se detecta regresión visual severa.

## Open Questions

- ¿Existe un archivo o recurso visual adicional de `@reference` fuera de las reglas del proyecto que deba tomarse como fuente exacta?
- ¿Debe el detalle seguir una referencia visual específica o basta con asegurar composición responsive consistente con el sistema visual actual?
- ¿Se espera una matriz fija de breakpoints de diseño o podemos usar los breakpoints ya cercanos a la implementación actual y refinarlos?
- ¿Conviene sacar cualquier ajuste visual de login a un cambio separado para no mezclarlo con la responsividad de landing y detalle?
