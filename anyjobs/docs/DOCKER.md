## Docker (dev / CI / prod)

Este repo incluye un `Dockerfile` **multi-stage** con targets `dev`, `ci` y `prod` para estandarizar builds entre desarrollo, CI y producción.

### Targets disponibles

- **`dev`**: levanta `ng serve` dentro del contenedor (DX).
- **`ci`**: ejecuta validaciones reproducibles (lint + tests opcionales).
- **`prod`**: imagen mínima para servir estáticos del build (sin toolchains), usando `nginx` no-root.

### Desarrollo (target `dev`)

#### Opción A: docker-compose (recomendada)

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Expone `http://localhost:4200`
- Monta el código `./anyjobs` dentro del contenedor
- Mantiene `node_modules` **dentro** del contenedor (volume), sin arrastrarlos desde el host

#### Opción B: docker run (sin compose)

```bash
docker build --target dev -t anyjobs-dev .
docker run --rm -p 4200:4200 \
  -v "$PWD/anyjobs:/app" \
  -v anyjobs-node-modules:/app/node_modules \
  anyjobs-dev
```

### CI (target `ci`)

Por defecto el target `ci` ejecuta `npm run lint`. Los tests se pueden habilitar con un build-arg.

```bash
docker build --target ci -t anyjobs-ci .
```

> Nota: si `ng lint` falla en el repo, este build **debe fallar** (la idea es que CI lo detecte).

Tests opcionales:

```bash
docker build --target ci --build-arg RUN_TESTS=1 -t anyjobs-ci .
```

> Nota: `ng test` puede requerir dependencias adicionales (browser/headless) según el runner. Si el pipeline no las provee, dejá `RUN_TESTS=0` y ejecutá tests con el método actual del CI.

### Producción (target `prod`)

Build de la imagen:

```bash
docker build --target prod -t anyjobs:prod .
```

Ejecutar:

```bash
docker run --rm -p 8080:8080 anyjobs:prod
```

Abrir `http://localhost:8080`.

### Seguridad y secretos

- No se copian `.env` al contenedor (ver `.dockerignore`).
- No hornear secretos dentro de la imagen.
- La configuración de despliegue debe inyectarse por el entorno del runtime (variables / configuración externa).

### Configuración (build-time vs runtime)

Como Angular se entrega como estáticos, hay dos estrategias comunes:

- **Build-time**: el valor queda compilado en el bundle (por ejemplo, `environment.ts`, `fileReplacements` o flags de build). Útil si cada entorno tiene su propia imagen.
- **Runtime (sin rebuild)**: servir un archivo de configuración que se lea al iniciar la app (por ejemplo `assets/config.json`) y que el deployment pueda reemplazar/injectar. Útil si querés una sola imagen para múltiples entornos.

En ambos casos: **no** almacenar secretos en el frontend (todo lo embebido queda accesible al cliente).

### Healthcheck y logging (recomendaciones)

- Preferir verificación externa (ingress / load balancer) o un health endpoint simple (por ejemplo, `GET /` con `200`).
- Usar logs del runtime (stdout/stderr) y métricas del entorno; la imagen `prod` busca ser mínima y no está pensada para debug interactivo.

### Cache y reproducibilidad

- El `Dockerfile` copia primero `package*.json` y ejecuta `npm ci`, para maximizar cache.
- Con BuildKit, npm usa cache (`/root/.npm`) para acelerar builds.

### Multi-plataforma (opt-in)

Ejemplo con Buildx (amd64/arm64):

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --target prod \
  -t anyjobs:prod \
  .
```

Ejemplo (CI) con push:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --target prod \
  -t <registry>/<repo>/anyjobs:prod \
  --push \
  .
```

Ejemplo (CI) con cache remoto (opt-in):

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --target prod \
  -t <registry>/<repo>/anyjobs:prod \
  --cache-from type=registry,ref=<registry>/<repo>/anyjobs:buildcache \
  --cache-to type=registry,ref=<registry>/<repo>/anyjobs:buildcache,mode=max \
  --push \
  .
```
