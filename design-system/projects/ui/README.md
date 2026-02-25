# Ui

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.0.

## Component + token mapping (evidence-derived)

Los componentes de esta librería se estilizan con Tailwind y tokens derivados de la evidencia del change `extract-style-base-line`.

- `aj-button` (`components/button`)
  - **Color**: `action-primary`, `bg-page`, `text-primary`, `neutral.neutral-5`
  - **Radius**: `--ds-radius-xl`
  - **Motion**: `duration-fast`, `ease-standard`
- `aj-link` (`components/link`)
  - **Color**: `action-primary`
  - **Motion**: `duration-[250ms]`, `ease-[cubic-bezier(0.2,0,0,1)]`
  - **Focus shape**: `--ds-radius-tiny`
- `aj-input` (`components/input`)
  - **Color**: `bg-page`, `text-primary`, `neutral.neutral-2`
  - **Radius**: `--ds-radius-xl`
  - **Motion**: `duration-fast`, `ease-standard`
  - **Focus ring**: `--ds-color-action-primary`

Fuente: `openspec/changes/extract-style-base-line/evidence/airbnb-home-style.json` y `design-system/tailwind.preset.ts`.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the library, run:

```bash
ng build ui
```

This command will compile your project, and the build artifacts will be placed in the `dist/` directory.

### Publishing the Library

Once the project is built, you can publish your library by following these steps:

1. Navigate to the `dist` directory:
   ```bash
   cd dist/ui
   ```

2. Run the `npm publish` command to publish your library to the npm registry:
   ```bash
   npm publish
   ```

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

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
