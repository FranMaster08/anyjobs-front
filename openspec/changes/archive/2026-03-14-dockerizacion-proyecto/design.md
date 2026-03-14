## Context

El repositorio `anyjobs-front` es un frontend Angular (build con `ng build`, desarrollo con `ng serve`) y hoy no existe un estándar único para ejecutar el proyecto en contenedores en:

- desarrollo local (hot reload, volumen de código, tooling);
- CI (validaciones reproducibles);
- producción (imagen mínima que sirva el build).

La propuesta define adoptar Docker multi-stage, targets (dev/ci/prod), y un runtime final mínimo/no-root sin toolchains de build.

**Restricciones clave**

- Multi-stage obligatorio.
- No incluir secretos ni `.env` en la imagen.
- Runtime final sin dependencias de desarrollo ni toolchains.
- Ejecutar como usuario no-root.
- Preparar el diseño para cache y para builds multi-plataforma cuando aplique.

## Goals / Non-Goals

**Goals:**

- Definir un Dockerfile con **targets** claros (dev/ci/prod) y un flujo consistente entre entornos.
- Lograr builds **reproducibles** (instalación determinística con lockfile y capas optimizadas para cache).
- Producir una imagen de producción **mínima**, que solo contenga los artefactos estáticos del build y el runtime mínimo para servirlos.
- Garantizar ejecución **no-root** en producción.
- Establecer una convención de uso (comandos/targets) que CI pueda integrar sin depender del entorno del runner.

**Non-Goals:**

- Definir un pipeline CI/CD específico (GitHub Actions/GitLab/Jenkins) en este artefacto.
- Resolver observabilidad/monitoring de infraestructura; solo se contemplan recomendaciones (logs/healthcheck).
- Introducir cambios funcionales en la aplicación Angular o su routing; el foco es empaquetado y ejecución.

## Decisions

1) **Dockerfile multi-stage con targets `dev`, `ci` y `prod`**

- **Decisión**: estructurar un único `Dockerfile` con stages reutilizables y targets explícitos.
- **Rationale**: evita duplicación, permite consistencia y simplifica CI (selecciona target por necesidad).
- **Alternativas**:
  - múltiples Dockerfiles (más simple al inicio, deriva en divergencia y mantenimiento mayor);
  - un único stage (rápido pero inseguro/pesado para producción).

2) **Stage de build basado en imagen oficial de Node**

- **Decisión**: usar imagen oficial de Node (LTS) para instalar dependencias y ejecutar `ng build`.
- **Rationale**: es el entorno natural para toolchain de Angular (node/npm) y facilita reproducibilidad.
- **Detalles de implementación (alto nivel)**:
  - copiar primero `package*.json` y ejecutar `npm ci` para maximizar cache;
  - copiar el resto del código y ejecutar `npm run build`.
- **Alternativas**:
  - `pnpm/yarn` (solo si el repo lo adopta formalmente);
  - imagen “slim” vs “alpine”: `alpine` puede introducir fricción con dependencias nativas; se elige según compatibilidad real del repo.

3) **Runtime de producción: servidor web mínimo y no-root**

- **Decisión**: para producción, servir el output estático (`dist/`) con un runtime mínimo tipo **nginx unprivileged** o equivalente.
- **Rationale**: para un frontend estático, un server web mínimo reduce dependencias frente a ejecutar Node en producción.
- **Alternativas consideradas**:
  - **Node distroless (`distroless/nodejs`)**: útil cuando el runtime es Node; en un frontend estático obligaría a agregar un servidor Node (p. ej. `serve`), aumentando dependencias y superficie.
  - **`gcr.io/distroless/static`**: no incluye servidor HTTP; requeriría añadir un binario servidor (no alineado a “solo runtime” sin una decisión adicional).
  - **`nginx:alpine`**: válida pero corre como root por defecto; se prefiere variante unprivileged para cumplir “no-root” por diseño.
  - **Caddy**: buen DX y TLS, pero agrega decisiones extra (configuración, defaults) no necesarias si solo se sirven estáticos.

4) **Separación clara de “imagen dev” vs “imagen prod”**

- **Decisión**: la imagen de desarrollo está pensada para iterar (volúmenes, watchers, tooling), mientras que la imagen de producción solo contiene estáticos y config mínima.
- **Rationale**: evita arrastrar tooling al runtime y mantiene seguridad/performance.
- **Trade-off**: el debugging “dentro” de la imagen prod es limitado; se hace troubleshooting con target dev o mediante logs.

5) **Cache y reproducibilidad con BuildKit**

- **Decisión**: diseñar el Dockerfile para cache eficiente (capas ordenadas) y, cuando esté habilitado BuildKit, usar cache mounts para npm.
- **Rationale**: acelera CI y builds locales sin sacrificar determinismo.
- **Alternativas**: cache externo del CI únicamente (menos portable); o sin cache (más simple, más lento).

6) **No secretos en la imagen; configuración por variables de entorno en runtime**

- **Decisión**: no incluir `.env`, tokens ni secretos en el contexto de build/imagen.
- **Rationale**: evita leak por layers/registry y separa build de despliegue.
- **Nota**: si el frontend requiere config runtime (p. ej. API base URL), se documentará una estrategia (envsubst, config endpoint, o build-time variables) en la etapa de specs/tasks.

## Risks / Trade-offs

- **[Distroless vs frontend estático]** → Mitigación: adoptar “runtime mínimo no-root” (nginx unprivileged o equivalente) como opción pragmática; documentar alternativa si más adelante se introduce SSR/Node runtime.
- **[Incompatibilidades con base `alpine`]** → Mitigación: comenzar con imagen base “slim” en build si aparecen dependencias nativas; mantener la decisión abierta hasta validar `npm ci` en contenedor.
- **[Builds multi-plataforma más lentos]** → Mitigación: activar solo cuando se requiera; usar cache y builders apropiados en CI.
- **[Menor debug interactivo en prod]** → Mitigación: healthchecks, logs estructurados, y target dev/ci para replicación.

## Migration Plan

- Introducir `Dockerfile` y `.dockerignore`.
- Documentar targets y comandos recomendados (dev/ci/prod).
- Actualizar CI para usar target `ci` (build + validaciones) y, opcionalmente, construir/publicar `prod`.
- Validar ejecución de la imagen `prod` en entorno de staging con configuración por variables de entorno.

## Open Questions

- ¿Qué runtime “mínimo” se adopta formalmente para producción (nginx unprivileged vs alternativa)?
- ¿Se necesita estrategia de configuración **en runtime** para endpoints (sin rebuild) o alcanza build-time config?
- ¿Se requiere multi-plataforma desde el inicio o se deja como opt-in del pipeline?
