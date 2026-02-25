## Design system conventions (Angular + Tailwind, 100% TypeScript)

### Goals

- Mantener **una fuente de verdad** para estilos (derivada de evidencia) y consumirla de forma consistente desde:
  - Tailwind (utility-first)
  - componentes Angular (lib `ui`)

### Naming

- **Tokens lógicos (documentación/specs)**: usar *dot-notation* alineada con la evidencia cuando aplique.
  - Ejemplos: `text.primary`, `bg.page`, `action.primary`, `radius.sm`, `space.2`.
- **Keys de Tailwind**: usar *kebab-case* o *camelCase* según convención de Tailwind, priorizando consistencia.
  - Ejemplos recomendados:
    - colores semánticos: `text-primary`, `bg-page`, `action-primary`
    - radios: `radius-sm`, `radius-md`, etc. (si se modelan como alias)
- **CSS variables (si se usan)**: usar `--ds-<categoria>-<token>` en kebab-case.
  - Ejemplos: `--ds-color-action-primary`, `--ds-radius-sm`, `--ds-space-2`.
- **TypeScript**: exportar tokens como objetos tipados en `camelCase`.
  - Ejemplo: `tokens.color.actionPrimary`

### Source of truth

- **Evidencia**: `openspec/changes/extract-style-base-line/evidence/airbnb-home-style.json`
  - No se edita manualmente.
- **Derivación**:
  - Un script TypeScript lee la evidencia y genera:
    - un preset/config consumible por Tailwind
    - (opcional) un set de tokens TS para consumo directo desde Angular

### File locations

- **Tailwind config (workspace root)**:
  - `tailwind.config.ts`: configura `content` y consume preset.
  - `postcss.config.cjs`: habilita Tailwind + autoprefixer.
  - `src/styles.scss`: contiene `@tailwind base/components/utilities` + estilos base globales.
- **Breakpoints**:
  - `docs/BREAKPOINTS.md`: estado actual (`null`) y evidencia requerida para definir `screens`.
- **Token generator (workspace tooling)**:
  - `tools/tokens/`: scripts TypeScript de generación (entrada: evidencia, salida: preset/tokens).
- **Tokens (librería UI)**:
  - `projects/ui/src/lib/tokens/`: exports TypeScript tipados para consumo por componentes.
- **Components (librería UI)**:
  - `projects/ui/src/lib/components/`: componentes Angular (Button/Link/Input/…).

