## 1. Landing publica

- [x] 1.1 Ajustar la estructura de `open-requests-landing` para que el hero respete la composición `@reference` con columna izquierda de contenido y columna derecha de media destacada.
- [x] 1.2 Corregir los breakpoints y reglas de contención de `open-requests-landing.scss` para evitar overflow horizontal en mobile, tablet y desktop reducido.
- [x] 1.3 Revisar la jerarquía visual y el espaciado de hero, secciones, ubicación y contacto para mantener coherencia con el diseño aprobado.
- [x] 1.4 Validar que skeleton, empty, error y paginación sigan funcionando sin degradación visual tras los ajustes de layout.

## 2. Cards y listado

- [x] 2.1 Ajustar `open-request-card` para que media, título, metadatos y acciones se adapten sin cortes ni solapamientos en viewports estrechos.
- [x] 2.2 Reorganizar las acciones primaria y secundaria de la card para que sigan siendo visibles, enfocables, compactas, una al lado de la otra cuando el ancho lo permita y con separación visual suficiente.
- [x] 2.3 Verificar que el grid de solicitudes mantenga consistencia visual y estabilidad de columnas en combinación con los cambios de la landing.

## 3. Detalle de solicitud

- [x] 3.1 Ajustar el header de `open-request-detail` para que metadatos y CTAs puedan apilarse o redistribuirse sin overflow horizontal.
- [x] 3.2 Corregir galería, imagen principal y miniaturas para que mantengan proporciones y operabilidad en mobile, tablet y desktop.
- [x] 3.3 Adaptar el layout principal del detalle para usar sidebar sticky en desktop y bloque integrado no sticky en tablet/mobile.
- [x] 3.4 Verificar que el módulo de acción siga reflejando correctamente los estados con y sin sesión después de los cambios visuales.

## 4. Flujo de login

- [x] 4.1 Preservar el punto de entrada de login en `shell` sin cambios estructurales que comprometan el flujo funcional existente.
- [x] 4.2 Corregir el modal de login con ajustes visuales mínimos y reversibles para mantenerlo compacto, legible y responsive sin alterar su comportamiento original.
- [x] 4.3 Reforzar la contención del modal de login en mobile para que panel, inputs y botones no se desborden por padding, border o anchos calculados.
- [x] 4.4 Mantener los CTAs de autenticación en vistas públicas reutilizando el flujo actual, sin introducir nueva lógica ni navegación.
- [x] 4.5 Verificar que el flujo de login siga iniciando sesión, persistiendo y restaurando el estado autenticado después de los ajustes aplicados fuera de auth.

## 5. Validacion

- [x] 5.1 Ejecutar revisión visual de landing, detalle y login, incluyendo entry points desde header y detalle, para confirmar cumplimiento de `@reference`, compactación del modal y ausencia de overflow evidente.
- [x] 5.2 Validar en viewport móvil estrecho que el modal de login no presente desborde horizontal real en panel, inputs ni botones.
- [x] 5.3 Actualizar o ajustar pruebas cercanas solo cuando aporten cobertura útil para los cambios de estructura y responsividad.
- [x] 5.4 Ejecutar lints y validaciones relevantes sobre los archivos modificados y corregir cualquier regresión introducida.
