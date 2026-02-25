## Tooling (lint + formato)

### Lint (`ng lint`)

Este proyecto usa `ng lint` con ESLint via `angular-eslint`, porque el comando `ng lint` requiere configurar un builder de lint y la documentación oficial del CLI indica agregar un paquete que lo implemente.

Referencias:

- Angular CLI `ng lint`: `https://angular.dev/cli/lint`
- `angular-eslint`: `https://github.com/angular-eslint/angular-eslint`

### Formato (Prettier)

Se usa Prettier como formateador ejecutable vía scripts reproducibles:

- `npm run format`
- `npm run format:check`

Referencias:

- Prettier CLI: `https://prettier.io/docs/en/cli.html`

### Principio (dependencias mínimas)

No se instalan integraciones extra (por ejemplo “prettier+eslint plugins”) a menos que exista una necesidad clara y un camino documentado para mantenerlo sin fricción.
