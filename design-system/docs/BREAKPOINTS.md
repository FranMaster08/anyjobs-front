## Breakpoints

### Current state

La evidencia base (`openspec/changes/extract-style-base-line/evidence/airbnb-home-style.json`) contiene:

- `tokens.breakpoints.values[*].value = null`
- `meta.notes` incluye un aviso `breakpoints.unresolved`

Por lo tanto, **este design system NO define breakpoints propios todavía**. No se inventan valores.

### Implications

- Tailwind seguirá usando sus breakpoints por defecto **hasta** que exista evidencia suficiente para proponer un set propio.
- Cualquier set futuro de `screens` deberá ser derivado con trazabilidad desde:
  - media queries observables en CSS accesible, y/o
  - evidencia multi-viewport capturada y versionada.

### Next evidence required

- Capturar evidencia en múltiples viewports (p. ej. mobile/tablet/desktop) y versionarla en `openspec/.../evidence/`.
- Si es posible, extraer media queries relevantes del CSS accesible y mapearlas a tokens `bp.*`.

