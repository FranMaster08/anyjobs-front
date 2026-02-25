## ADDED Requirements

### Requirement: Anyjobs Angular project MUST be created using Angular CLI
El sistema MUST crear el proyecto Angular **Anyjobs** usando Angular CLI como mecanismo de scaffolding, de forma reproducible y alineada con la documentación oficial de Angular/Angular CLI.

#### Scenario: Project scaffold exists
- **WHEN** se ejecuta el flujo de creación del proyecto (Angular CLI) para Anyjobs
- **THEN** el repositorio contiene la estructura base esperada de un proyecto Angular generado por CLI (por ejemplo `angular.json`, `package.json`, `src/main.ts`, `src/index.html`)

### Requirement: Anyjobs project MUST use TypeScript strict
El proyecto MUST habilitar TypeScript en modo **strict** y MUST mantener una base **100% TypeScript** (sin fuentes `.js` dentro del código de la app).

#### Scenario: Strict TypeScript is enabled
- **WHEN** se inspecciona el `tsconfig.json` del proyecto
- **THEN** `compilerOptions.strict` está habilitado y el build/compilación falla si se introducen tipos incompatibles

### Requirement: Anyjobs project MUST follow modern Angular defaults (standalone-first)
El proyecto MUST adoptar la configuración y patrones modernos que el Angular CLI genere por defecto (por ejemplo, rutas y componentes standalone cuando aplique).

#### Scenario: App bootstraps successfully
- **WHEN** se ejecuta el build de la aplicación
- **THEN** la app compila correctamente y puede arrancar sin errores en un entorno de desarrollo

### Requirement: Anyjobs project MUST expose standard scripts for build and test
El proyecto MUST exponer comandos estándar para validar el baseline del proyecto (build y tests) como parte del flujo de trabajo del equipo.

#### Scenario: Build and tests can be executed
- **WHEN** se ejecutan los scripts definidos para build y tests
- **THEN** el proyecto puede compilar y ejecutar su suite de tests base sin fallar

