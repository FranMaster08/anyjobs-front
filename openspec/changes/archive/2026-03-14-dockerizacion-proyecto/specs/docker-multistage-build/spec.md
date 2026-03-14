## ADDED Requirements

### Requirement: Dockerfile multi-stage obligatorio
El proyecto SHALL incluir un `Dockerfile` basado en multi-stage builds, separando como mínimo:
- instalación de dependencias,
- build de la aplicación,
- empaquetado del runtime final.

#### Scenario: Runtime final sin toolchain de build
- **WHEN** se construye la imagen de producción (`prod`)
- **THEN** la imagen final no contiene compiladores, CLIs de build (p. ej. Angular CLI) ni dependencias de desarrollo

### Requirement: Instalación reproducible de dependencias
El stage de dependencias/build MUST instalar dependencias de forma reproducible usando el lockfile del proyecto (por ejemplo, `npm ci` cuando corresponda).

#### Scenario: Instalación determinística
- **WHEN** el pipeline ejecuta el build de imagen en CI
- **THEN** la instalación de dependencias respeta el lockfile y falla si el lockfile es inconsistente

### Requirement: Validaciones opcionales en target de CI
El estándar SHALL permitir un target de CI que ejecute validaciones (por ejemplo, lint y/o tests) como parte del build del contenedor.

#### Scenario: Ejecución de validaciones en CI
- **WHEN** CI construye el target `ci`
- **THEN** se ejecutan las validaciones configuradas y el build falla si alguna validación falla

### Requirement: Soporte de cache de build
El Dockerfile SHALL estar estructurado para maximizar cache (copiar manifests antes que el código) y MAY usar mecanismos de cache del builder cuando estén disponibles.

#### Scenario: Rebuild incremental
- **WHEN** solo cambian archivos de aplicación sin cambios en `package*.json`
- **THEN** el build reutiliza capas cacheadas de instalación de dependencias cuando el builder lo permite
