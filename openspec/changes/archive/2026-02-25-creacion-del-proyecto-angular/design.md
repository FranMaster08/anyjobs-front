## Context

Este change crea el proyecto Angular principal **Anyjobs** usando **Angular CLI** como fuente de verdad para generación y configuración inicial.

Restricciones explícitas:

- La estructura y los pasos deben seguir **documentación oficial** (Angular y Angular CLI).
- Se debe agregar soporte de **formateo** (p. ej. Prettier) y **lint** únicamente si existe un camino documentado para integrarlo con Angular, evitando dependencias “por costumbre”.

Estado actual del repo:

- Existe un workspace Angular previo enfocado al design system bajo `design-system/` (librería `ui` + Tailwind preset basado en evidencia).
- Este change se enfoca en el **proyecto Anyjobs** (app y estructura modular). La integración con el design system se considera, pero no debe forzar tooling adicional no documentado.

## Goals / Non-Goals

**Goals:**

- Crear una app Angular **Anyjobs** con configuración inicial generada por **Angular CLI** y **TypeScript strict**.
- Definir una **estructura base** para enmarcar módulos/feature areas (core/shared/features) y su routing/lazy-loading.
- Establecer un “baseline” de calidad:
  - scripts consistentes (build/test/lint/format)
  - reglas de contribución para generar artefactos con CLI sin romper la estructura
- Mantener el set de dependencias mínimo y justificable por documentación.

**Non-Goals:**

- Implementar features de negocio (auth, jobs, perfiles, etc.) en este change.
- Definir un design system completo aquí (ya existe trabajo en `design-system/`).
- Introducir soluciones de monorepo externas (Nx, etc.) o tooling no requerido por Angular/CLI para este objetivo.

## Decisions

### 1) Ubicación del proyecto y límites del repo

- **Decisión**: crear el proyecto Anyjobs en un directorio dedicado (p. ej. `anyjobs/`) generado con Angular CLI.
- **Alternativas**:
  - Reutilizar el workspace existente `design-system/` y agregar ahí la app Anyjobs.
  - Montar el proyecto Angular en la raíz del repo.
- **Rationale**: un directorio dedicado evita mezclar concerns (evidencia/tools/openspec vs app), reduce fricción de paths y deja clara la frontera entre el design system experimental y la app principal.

### 2) Standalone-first (Angular moderno)

- **Decisión**: adoptar componentes/rutas **standalone** y configuración moderna (lo que Angular CLI genere por defecto en versiones actuales).
- **Alternativas**:
  - Basarse en `NgModules` como patrón principal.
- **Rationale**: el CLI y la documentación moderna de Angular favorecen standalone, y simplifica lazy-loading y composición por feature areas.

### 3) Estructura por “feature areas” + core/shared

- **Decisión**: estructurar `src/app/` con una convención estable:
  - `core/`: singletons, services base, interceptors/providers globales, guards, config
  - `shared/`: componentes/pipes/directivas reutilizables (sin lógica de negocio)
  - `features/<feature>/`: rutas, componentes y servicios acotados a una feature area
  - `shell/` (opcional): layout app (header/footer/nav) y composición
- **Alternativas**:
  - “type-based” (components/services por carpetas globales).
- **Rationale**: el enfoque por feature areas escala mejor y reduce acoplamiento accidental.

### 4) Routing: lazy-loading como default

- **Decisión**: definir routing inicial con lazy-loading por feature (`loadChildren` / `loadComponent`) y un app shell mínimo.
- **Rationale**: permite crecer por módulos sin que el `AppComponent` se convierta en un “god component”, y prepara el terreno para performance.

### 5) Tooling: documentación primero, dependencias mínimas

- **Decisión**: todo tooling (lint/format) debe cumplir:
  - tener pasos documentados para Angular/CLI y/o la herramienta (sin “hacky configs”)
  - no duplicar responsabilidades (un formateador principal, un linter principal)
  - scripts reproducibles (`npm run lint`, `npm run format`, etc.)
- **Nota sobre Prettier**: se integrará como formateador si la combinación Angular + Prettier está soportada y documentada; si no, se mantendrá el baseline de formato con lo provisto por el CLI/EditorConfig hasta definir una ruta documentada.

## Risks / Trade-offs

- **[Sobre-arquitectura temprana]** → Mitigación: empezar con estructura mínima (core/shared/features) y evolucionar con necesidades reales.
- **[Tooling sprawl (muchas dependencias)]** → Mitigación: criterio “documentación primero” y lista corta de herramientas.
- **[Duplicación de workspaces (Anyjobs vs design-system)]** → Mitigación: documentar la relación; evaluar consolidación en un único workspace cuando exista una ruta clara y documentada.

## Migration Plan

- Crear el proyecto Anyjobs con Angular CLI en el directorio decidido.
- Establecer estructura de carpetas y routing inicial (sin features reales).
- Agregar lint/format siguiendo pasos documentados; incluir scripts.
- Validar build/test/lint/format en un “hello world” mínimo.

## Open Questions

- ¿Se quiere **un único workspace Angular** (app + libs) o mantener app y design system separados por ahora?
- ¿Cuál es el set mínimo de feature areas iniciales (solo placeholders) para validar la estructura?
- ¿Qué estándar de formateo se adopta si la ruta Prettier+Angular requiere decisiones adicionales?

