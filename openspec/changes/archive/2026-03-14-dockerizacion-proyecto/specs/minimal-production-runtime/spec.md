## ADDED Requirements

### Requirement: Runtime de producción mínimo para servir estáticos
La imagen `prod` SHALL servir el output estático del build del frontend (por ejemplo, `dist/`) usando un runtime mínimo adecuado para estáticos.

#### Scenario: Contenido servido desde artefactos del build
- **WHEN** se ejecuta el contenedor de producción
- **THEN** el servidor entrega contenido desde el directorio de artefactos del build y no requiere toolchains de compilación

### Requirement: Ejecución como usuario no-root
El contenedor de producción MUST ejecutarse como un usuario no privilegiado (no-root).

#### Scenario: Proceso sin UID 0
- **WHEN** el contenedor `prod` inicia
- **THEN** el proceso principal corre con un UID/GID no-root

### Requirement: Contenido mínimo en la imagen final
La imagen `prod` MUST incluir únicamente:
- artefactos estáticos del build,
- configuración mínima del servidor/runtime,
y MUST NOT incluir caches, temporales o dependencias de desarrollo.

#### Scenario: Imagen final sin dependencias de desarrollo
- **WHEN** se construye el target `prod`
- **THEN** los artefactos copiados al runtime final excluyen archivos de desarrollo y temporales

### Requirement: Compatibilidad con builds multi-plataforma (opt-in)
La estrategia de build SHALL permitir, cuando el pipeline lo requiera, producir imágenes para al menos `linux/amd64` y `linux/arm64`.

#### Scenario: Build multi-arquitectura en CI
- **WHEN** el pipeline ejecuta un build multi-plataforma
- **THEN** se generan imágenes para las arquitecturas configuradas sin cambios en el código de la aplicación
