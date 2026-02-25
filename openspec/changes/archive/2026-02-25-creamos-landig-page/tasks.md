## 1. Routing y estructura base

- [x] 1.1 Definir el path público de la landing (p. ej. `solicitudes` / `open-requests`) y documentarlo en el PR
- [x] 1.2 Crear el feature `open-requests` en `anyjobs/src/app/features/open-requests/` siguiendo el patrón de `home`
- [x] 1.3 Crear el componente route-level `open-requests-landing` (standalone) y su template/estilos
- [x] 1.4 Registrar la nueva ruta en `anyjobs/src/app/app.routes.ts` usando `loadComponent` bajo el `Shell`

## 2. Modelo de datos y data-access

- [x] 2.1 Definir tipos/DTO mínimos para renderizar una card (id, imageUrl?, excerpt, metadatos, etc.)
- [x] 2.2 Implementar `OpenRequestsService` (o data-access equivalente) que liste solicitudes abiertas con params de paginación/orden
- [x] 2.3 Implementar normalización/fallbacks (placeholder cuando no hay imagen, extracto por defecto, etc.)
- [x] 2.4 Definir contrato de “más resultados” (p. ej. `hasMore`/`nextPage`) y mapearlo en el service

## 3. Componentes UI (cards + grid)

- [x] 3.1 Crear `OpenRequestCardComponent` (standalone) con inputs tipados y API mínima
- [x] 3.2 Implementar layout de card: imagen (con recorte), comentario/extracto y metadatos visibles
- [x] 3.3 Añadir CTA principal en la card (p. ej. “Ver detalle” / “Consultar”) con `type="button"` si aplica
- [x] 3.4 Implementar grid/listado responsive en la landing (1 col mobile, 2 tablet, 3+ desktop según diseño)

## 4. Estados UX (loading / empty / error)

- [x] 4.1 Implementar estado `loading` con skeletons (sin spinner global) manteniendo el layout
- [x] 4.2 Implementar empty state cuando el listado viene vacío (mensaje claro, sin error)
- [x] 4.3 Implementar error state con botón “Reintentar”
- [x] 4.4 Conectar “Reintentar” para re-ejecutar la carga del listado

## 5. Paginación / carga incremental

- [x] 5.1 Implementar mecanismo “Ver más” (o alternativa acordada) para cargar la siguiente página cuando haya más resultados
- [x] 5.2 Asegurar que al cargar más se agregan items sin perder el scroll/estado actual
- [x] 5.3 Gestionar estados de carga incremental (loading parcial / deshabilitar botón) y errores al paginar

## 6. Navegación, accesibilidad y responsive

- [x] 6.1 Implementar navegación al detalle desde la card (click/tap en card o CTA) con el id correcto
- [x] 6.2 Asegurar navegación por teclado y foco visible en cards/CTAs
- [x] 6.3 Implementar `alt` útil cuando la imagen sea informativa y comportamiento decorativo cuando aplique
- [x] 6.4 Validar que no exista overflow horizontal en mobile y que el grid sea legible en tablet/desktop

## 7. Calidad: tests, lint y verificación manual

- [x] 7.1 Añadir tests unitarios básicos: landing (loading/empty/error/success) y card (render con/sin imagen)
- [x] 7.2 Validar que los escenarios de la spec están cubiertos por comportamiento observable en UI
- [x] 7.3 Ejecutar `npm test`/`npm run lint` en `anyjobs/` y corregir issues
- [x] 7.4 Verificación manual responsive (mobile/tablet/desktop) y navegación a detalle

## 8. Ajustes posteriores (mock + rediseño @reference)

- [x] 8.1 Añadir mock local para simular API (`anyjobs/public/mock/open-requests.mock.json` + imágenes) con paginación
- [x] 8.2 Cambiar `OpenRequestsService` para consumir el mock mientras no exista endpoint real
- [x] 8.3 Rediseñar landing y cards para calcar estructura visual de `@reference` (hero 2 columnas + “Selección destacada”)
- [x] 8.4 Añadir regla de Cursor para mantener la estructura del feature (`.cursor/rules/open-requests-landing-structure.mdc`)
