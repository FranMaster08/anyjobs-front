## Why

Necesitamos crear el proyecto Angular **Anyjobs** con una estructura clara y escalable para organizar módulos/feature areas desde el inicio, evitando refactors costosos más adelante.

Esto se debe hacer ahora para establecer una base consistente (Angular CLI + convenciones oficiales) y asegurar que el equipo trabaje con el mismo estándar de estructura, lint y formateo.

## What Changes

- Se crea el proyecto Angular “Anyjobs” usando **Angular CLI** y configuración alineada con la **documentación oficial de Angular**.
- Se define la **estructura base** del repositorio/proyecto para enmarcar módulos/feature modules y un “app shell” (routing, layout, core/shared) de forma consistente.
- Se habilita **formatting** y **linting** únicamente con herramientas y pasos respaldados por la documentación oficial (evitando instalaciones no recomendadas/irrelevantes).
- Se documenta cómo generar nuevos módulos/artefactos con el CLI para mantener el estándar de estructura.

## Capabilities

### New Capabilities

- `anyjobs-angular-project`: Crear y mantener el proyecto Angular Anyjobs (generado con Angular CLI) con configuración base y estructura inicial lista para crecer por módulos/feature areas.
- `anyjobs-project-structure`: Definir la convención de estructura (core/shared/features, routing, boundaries) y guías de generación con Angular CLI para mantener consistencia.
- `anyjobs-tooling-format-lint`: Establecer formatting y linting (y su ejecución en scripts) siguiendo documentación oficial, minimizando dependencias y evitando “tooling por moda”.

### Modified Capabilities

- (ninguna)

## Impact

- **Código/estructura**: se agregará un nuevo árbol de proyecto Angular (carpetas `src/`, config de workspace, etc.) y documentación de convenciones.
- **Tooling**: se incorporarán configuraciones y scripts de lint/format (solo si están indicados por documentación oficial).
- **Build/CI**: el proyecto deberá poder compilar y ejecutar checks básicos (build/lint/format) como parte del flujo de trabajo.

