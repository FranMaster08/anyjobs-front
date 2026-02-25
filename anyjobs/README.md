# Anyjobs

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Estructura del proyecto (convención)

Este repo organiza el código por **feature areas** (en vez de “type-based”) para escalar mejor:

- `src/app/core/`: providers/servicios singleton, configuración global, utilidades transversales
- `src/app/shared/`: componentes/pipes/directivas reutilizables (sin lógica de negocio)
- `src/app/features/<feature>/`: rutas, componentes y servicios acotados a una feature
- `src/app/shell/`: layout/composición (contiene el `router-outlet`)

## Generación con Angular CLI (mantener la estructura)

Ejemplos de comandos aceptados para generar código **sin romper la convención**:

```bash
# Shell (layout)
ng generate component shell/shell --standalone

# Feature "home"
ng generate component features/home/home --standalone

# Componente dentro de una feature
ng generate component features/<feature>/components/<name> --standalone

# Servicio dentro de una feature (ajustar el path según corresponda)
ng generate service features/<feature>/data-access/<name>
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
