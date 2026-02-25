## 1. Scaffolding del proyecto Anyjobs (Angular CLI + strict)

- [x] 1.1 Crear el proyecto Angular **Anyjobs** usando Angular CLI en un directorio dedicado (p. ej. `anyjobs/`) con defaults modernos (standalone-first) y TypeScript strict
- [x] 1.2 Verificar que el scaffold incluye archivos base esperados (`angular.json`, `package.json`, `src/main.ts`, `src/index.html`)
- [x] 1.3 Asegurar que el proyecto es **100% TypeScript** (sin fuentes `.js` en la app) y que `compilerOptions.strict` está habilitado
- [x] 1.4 Definir scripts estándar y verificables para baseline: `build` y `test` (ejecutables en local/CI)

## 2. Estructura modular (core/shared/features) + app shell

- [x] 2.1 Crear la estructura base en `src/app/` siguiendo la convención del repo: `core/`, `shared/`, `features/` (y `shell/` si aplica)
- [x] 2.2 Implementar un **app shell** mínimo (layout) que contenga el `router-outlet` (o equivalente standalone) como punto de composición
- [x] 2.3 Definir un routing baseline que cargue al menos una ruta placeholder (sin lógica de negocio) para validar el arranque y navegación

## 3. Features: convención + generación con Angular CLI

- [x] 3.1 Documentar (en README o docs del proyecto) los comandos de Angular CLI aceptados para generar artefactos (components/services/routes) sin romper la estructura
- [x] 3.2 Crear una feature placeholder bajo `src/app/features/<feature>/` usando Angular CLI (ej. `home` o `playground`) y conectarla al routing
- [x] 3.3 Validar que la feature placeholder puede cargarse mediante lazy-loading (por ejemplo `loadComponent`/`loadChildren`) sin afectar el bootstrap

## 4. Tooling: lint y format con “documentación primero”

- [x] 4.1 Revisar documentación oficial de Angular/Angular CLI sobre linting y definir el camino recomendado para habilitar `ng lint` (sin tooling no respaldado)
- [x] 4.2 Implementar linting ejecutable vía Angular CLI (`ng lint`) para TypeScript y templates (cuando aplique) y agregar el script `lint`
- [x] 4.3 Definir un flujo de **formateo** reproducible (`format` y `format:check`), minimizando dependencias y siguiendo documentación (Angular/CLI o herramienta)
- [x] 4.4 Si se adopta Prettier: documentar su uso y justificarlo con referencias a documentación; si no, documentar el estándar de formato vigente (p. ej. EditorConfig)

## 5. Validación del baseline (reproducible)

- [x] 5.1 Ejecutar y validar `build` en un entorno limpio
- [x] 5.2 Ejecutar y validar `test` en un entorno limpio
- [x] 5.3 Ejecutar y validar `lint` (si fue habilitado) en un entorno limpio
- [x] 5.4 Ejecutar y validar `format:check` (si fue habilitado) en un entorno limpio

