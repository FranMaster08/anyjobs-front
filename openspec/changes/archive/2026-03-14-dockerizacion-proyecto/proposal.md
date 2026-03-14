## Why

Hoy el proyecto no cuenta con un estándar formal de containerización para desarrollo, CI y producción. Esto genera diferencias entre entornos, dificulta reproducir builds de forma confiable y aumenta el riesgo de publicar imágenes con herramientas/dependencias innecesarias para runtime.

## What Changes

- Se define un estándar oficial de **dockerización** para el repositorio.
- Se implementa un **Dockerfile multi-stage** (con targets para dev/CI/prod) que:
  - instala dependencias de forma reproducible;
  - compila el frontend Angular;
  - permite ejecutar validaciones (test/lint) como etapa opcional de CI;
  - produce una imagen final de runtime que solo contenga lo indispensable para servir el build.
- Se agrega `.dockerignore` y lineamientos para:
  - no incluir secretos (ni archivos `.env`) en la imagen;
  - ejecutar como **usuario no root**;
  - minimizar contenido del runtime;
  - compatibilidad con CI/CD y cache de build.
- Se documenta una convención de imágenes para:
  - desarrollo local;
  - validación en CI;
  - producción.
- Se deja habilitada una estrategia de build reproducible con soporte de cache y opción de build multi-plataforma (p. ej. `linux/amd64` y `linux/arm64`) cuando el pipeline lo requiera.

## Capabilities

### New Capabilities

- `containerization-foundation`: Convenciones y estándares de imágenes (dev/CI/prod) para el proyecto.
- `docker-multistage-build`: Build multi-stage reproducible (instalación, compilación, validación opcional y empaquetado final).
- `minimal-production-runtime`: Runtime de producción mínimo y no-root para servir el build del frontend (sin toolchains ni dependencias de desarrollo).

### Modified Capabilities

<!-- No hay cambios de requirements sobre capabilities existentes; esto es una capability nueva de empaquetado/operación. -->

## Impact

- **Repositorio**: se incorporan `Dockerfile`, `.dockerignore` y documentación operativa para construir/ejecutar imágenes.
- **Build/operación**: el runtime queda desacoplado del entorno local, y se publica una imagen predecible que incluye solo artefactos necesarios del build.
- **Seguridad**: se reduce la superficie de ataque al minimizar el contenido del runtime, evitar secretos embebidos y ejecutar como usuario no privilegiado.
- **CI/CD**: el pipeline podrá construir y validar imágenes versionadas (y opcionalmente publicar), con cache y posibilidad de multi-arquitectura.
- **Diagnóstico**: la imagen de producción prioriza minimalismo; la depuración interactiva se apoya en logs/healthchecks y en una imagen/target de desarrollo para troubleshooting.
