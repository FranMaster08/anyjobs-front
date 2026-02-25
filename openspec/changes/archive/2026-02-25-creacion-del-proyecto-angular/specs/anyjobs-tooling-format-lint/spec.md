## ADDED Requirements

### Requirement: Anyjobs MUST provide linting runnable via Angular CLI
El proyecto MUST proveer linting ejecutable vía Angular CLI (por ejemplo `ng lint`) y su configuración MUST seguir un camino respaldado por documentación oficial.

#### Scenario: Lint command runs successfully
- **WHEN** se ejecuta el comando de lint definido por el proyecto
- **THEN** el lint corre sobre TypeScript y templates (cuando aplique) y retorna éxito cuando el código cumple las reglas

### Requirement: Anyjobs MUST provide a formatting workflow
El proyecto MUST proveer un flujo de formateo consistente para el código fuente (TypeScript y templates), ejecutable mediante scripts reproducibles.

#### Scenario: Format check exists
- **WHEN** se ejecuta el comando de verificación de formato
- **THEN** el comando retorna éxito si el formato del repo cumple el estándar definido por el proyecto

### Requirement: If Prettier is used, it MUST be integrated following documented guidance
Si el proyecto adopta Prettier, su instalación e integración MUST seguir guías documentadas para Angular y Prettier (sin configuraciones “hacky” ni herramientas duplicadas).

#### Scenario: Prettier integration is documented
- **WHEN** existe Prettier como dependencia del proyecto
- **THEN** el repositorio incluye documentación de uso (comandos y alcance) y el formateo se puede ejecutar de forma reproducible en local/CI

### Requirement: Tooling dependencies MUST be minimal and justified
Las dependencias de tooling (lint/format) MUST ser las mínimas necesarias para cumplir los objetivos y MUST estar justificadas con referencias a documentación (Angular/CLI o herramienta) dentro del repositorio.

#### Scenario: Tooling decisions are traceable
- **WHEN** se revisa la documentación del proyecto
- **THEN** existe una sección que lista las herramientas de lint/format adoptadas y referencia la documentación que respalda su integración

