## 1. Estructura base de dockerización

- [x] 1.1 Crear `Dockerfile` multi-stage con targets `dev`, `ci` y `prod`
- [x] 1.2 Definir un `.dockerignore` que excluya `node_modules/`, `dist/`, temporales y `.env*`
- [x] 1.3 Documentar en README/guía interna cómo construir cada target (comandos de ejemplo)

## 2. Target de desarrollo (`dev`)

- [x] 2.1 Implementar target `dev` orientado a iteración (tooling + puerto + comando de arranque)
- [x] 2.2 Configurar volumen/mount recomendado para código (sin arrastrar `node_modules` del host)
- [x] 2.3 Verificar que `dev` permite iniciar la app y ver cambios (DX) sin modificar el runtime de producción

## 3. Target de CI (`ci`)

- [x] 3.1 Implementar target `ci` que ejecute `npm ci` usando el lockfile del repo (`anyjobs/package-lock.json`)
- [x] 3.2 Ejecutar `npm run lint` dentro del target `ci`
- [x] 3.3 Ejecutar tests dentro del target `ci` (o dejarlo como paso opcional parametrizable) y hacer fallar el build si fallan
- [x] 3.4 Asegurar que el Dockerfile maximiza cache (copiar manifests antes del código) y documentar el comportamiento esperado

## 4. Build de producción (stage de build)

- [x] 4.1 Implementar stage de build que compile el frontend (`npm run build`) y produzca el output en `dist/`
- [x] 4.2 Copiar únicamente archivos necesarios al stage final (sin caches/temporales/devDependencies)
- [x] 4.3 Verificar que el build funciona desde un entorno limpio (sin depender de artefactos locales)

## 5. Runtime de producción (`prod`) mínimo y no-root

- [x] 5.1 Elegir e implementar runtime de estáticos mínimo no-root (p. ej. `nginxinc/nginx-unprivileged` o equivalente) como base del target `prod`
- [x] 5.2 Configurar el server para servir el output `dist/` correctamente (incluyendo fallback de SPA si aplica)
- [x] 5.3 Verificar que el proceso corre como usuario no-root en el contenedor `prod`
- [x] 5.4 Validar que la imagen final no contiene toolchains (Angular CLI, npm tooling) ni dependencias de desarrollo

## 6. Seguridad y configuración

- [x] 6.1 Asegurar que `.env` y secretos nunca se copian al contexto/imagen (validar `.dockerignore` y `COPY` explícitos)
- [x] 6.2 Definir y documentar la estrategia de configuración (build-time vs runtime) para endpoints/flags sin hornear secretos
- [x] 6.3 Agregar recomendaciones de healthcheck y logging (sin depender de debug interactivo en `prod`)

## 7. Multiplataforma (opt-in)

- [x] 7.1 Documentar cómo construir multi-plataforma (amd64/arm64) con Buildx cuando el pipeline lo requiera
- [x] 7.2 (Opcional) Agregar ejemplo de comandos de CI para build/push multi-arquitectura con cache
