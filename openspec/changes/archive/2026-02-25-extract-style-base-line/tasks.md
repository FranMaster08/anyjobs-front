## 1. Setup (Angular + Tailwind + TypeScript strict)

- [x] 1.1 Crear workspace Angular y una librería de design system (p. ej. `ui`/`design-system`) en TypeScript
- [x] 1.2 Habilitar TypeScript strict en el workspace (sin JavaScript) y alinear configuración con recomendaciones oficiales de Angular
- [x] 1.3 Integrar Tailwind en Angular (build + purge/content paths) y validar que compile en dev/prod
- [x] 1.4 Definir convención de nombres de tokens (kebab/camel) y ubicación de archivos (tokens, preset Tailwind, estilos globales)

## 2. Token pipeline (evidence → tokens → Tailwind)

- [x] 2.1 Crear un script TypeScript que lea `openspec/changes/extract-style-base-line/evidence/airbnb-home-style.json`
- [x] 2.2 Derivar y materializar paleta en Tailwind (`theme.extend.colors`) usando `tokens.color.palette.neutrals` y `tokens.color.palette.brand`
- [x] 2.3 Mapear semánticos mínimos (`text.primary`, `bg.page`, `action.primary`) a aliases Tailwind (p. ej. `text-primary`, `bg-page`, `action-primary`)
- [x] 2.4 Derivar tipografía base en Tailwind (`fontFamily`, `fontSize`, `lineHeight`, `fontWeight`) desde `tokens.typography.body` y `tokens.typography.scale`
- [x] 2.5 Derivar radius scale desde variables CSS (p. ej. `--corner-radius-*`) y mapearlo a Tailwind (`borderRadius`)
- [x] 2.6 Derivar sombras/elevación desde `raw.cssVariables` (`--elevation-*`, `--elevation-elevation*`) y mapearlo a Tailwind (`boxShadow`)
- [x] 2.7 Derivar motion desde `raw.cssVariables` (`--motion-springs-*-duration`, curvas `--motion-*-curve-animation-timing-function`) y exponerlo como tokens consumibles (Tailwind + utilidades)
- [x] 2.8 Dejar breakpoints en estado “unknown” (sin inventar): documentar `null` y preparar pipeline para incorporar evidencia futura

## 3. Global styles (baseline)

- [x] 3.1 Implementar estilos globales base en Angular (html/body) alineados con `global.htmlBody` (font smoothing, background, color)
- [x] 3.2 Definir estrategia de CSS variables (si aplica) para que Tailwind y componentes compartan fuente de verdad

## 4. Component library (Angular components)

- [x] 4.1 Crear componente `Button` en Angular con variantes mínimas (default/primary) y estados (hover/focus/disabled) basados en evidencia y tokens
- [x] 4.2 Crear componente `Link` en Angular (default/hover/focus) alineado con `component.link.1` y tokens de color/motion
- [x] 4.3 Crear componente `Input` en Angular (base/focus/disabled) alineado con `component.input.1` y tokens
- [x] 4.4 Documentar mapeo de tokens usados por cada componente (qué token impulsa color/radius/spacing/shadow/motion)

## 5. Quality gates (Angular-recommended practices)

- [x] 5.1 Configurar linting/formatting para TypeScript (y templates) siguiendo prácticas oficiales de Angular
- [x] 5.2 Agregar tests unitarios básicos para componentes (render + estados clave) y verificación de tokens (snapshot del preset Tailwind)
- [x] 5.3 Agregar Storybook o un playground equivalente para visualizar tokens y componentes (con ejemplos reproducibles)
- [x] 5.4 Definir verificación de fidelidad visual (baseline screenshots / regresión visual) para componentes clave

## 6. Evidence completeness (iteración)

- [x] 6.1 Expandir evidencia: capturar componentes más representativos (CTA con fondo, input con borde, card con elevación) y actualizar/añadir archivo(s) en `evidence/`
- [x] 6.2 Re-ejecutar extracción sin truncar `raw.cssVariables` (split de archivos o modo “full”) para mejorar derivación de tokens
- [x] 6.3 Capturar evidencia de breakpoints (múltiples viewports y/o media queries) y actualizar tokens de `breakpoints` cuando sea determinable

