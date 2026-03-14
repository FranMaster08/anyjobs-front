## Purpose

Definir estándares de dockerización (dev/CI/prod) para que el proyecto sea reproducible, seguro y consistente entre entornos.

## ADDED Requirements

### Requirement: Dockerización estandarizada por targets
El proyecto SHALL proveer una forma estándar y documentada de construir imágenes para `dev`, `ci` y `prod` a partir de un mismo `Dockerfile` multi-stage, de modo que el resultado no dependa del entorno del host.

#### Scenario: Construcción por target
- **WHEN** un usuario o el pipeline construye la imagen con un target válido (`dev`, `ci` o `prod`)
- **THEN** el build completa usando el `Dockerfile` provisto y produce un artefacto coherente con el target seleccionado

### Requirement: Exclusión de archivos no necesarios del contexto de build
El repositorio SHALL incluir un `.dockerignore` que excluya al menos `node_modules/`, artefactos de build (p. ej. `dist/`), directorios temporales y archivos sensibles típicos (p. ej. `.env*`) del contexto de build.

#### Scenario: Build sin arrastrar `node_modules` del host
- **WHEN** se ejecuta `docker build` desde el root del proyecto
- **THEN** el contexto de build no incluye `node_modules/` locales ni artefactos generados previamente

### Requirement: No inclusión de secretos en la imagen
Las imágenes construidas por el estándar de dockerización MUST NOT contener secretos (tokens, credenciales) ni archivos `.env` dentro de capas del contenedor.

#### Scenario: Configuración por runtime
- **WHEN** el despliegue requiere configuración (por ejemplo, endpoints o flags)
- **THEN** dicha configuración se inyecta en runtime (variables de entorno / configuración externa) y no se hornea dentro de la imagen
