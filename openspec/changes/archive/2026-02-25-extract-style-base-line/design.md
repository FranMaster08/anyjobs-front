## Context

Este change (`extract-style-base-line`) ya capturó y versionó evidencia de estilo visual a partir de una URL real en un JSON único:

- Evidencia: `openspec/changes/extract-style-base-line/evidence/airbnb-home-style.json`

El objetivo declarado en `proposal.md` es usar esa evidencia para **crear un design system basado en el estilo extraído**, separando tokens (variables/sistema) de componentes (patrones UI).

Estado de la evidencia (según `meta.notes` del JSON):

- `raw.cssVariables` está truncado a 250 entradas por tamaño de salida (la extracción original detectó 1732).
- `tokens.breakpoints.*` no pudo inferirse de forma confiable y queda en `null`.

Señales de estilo presentes en la evidencia (ejemplos concretos):

- Tipografía base: `tokens.typography.body` con `fontSize: "14px"` y `lineHeight: "20.02px"`, y familia `"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif`.
- Color de marca: `tokens.color.palette.brand.palette.rausch = "#FF385C"` (y variantes `#E00B41`, `#92174D`, `#460479`).
- Radios disponibles en variables: `raw.cssVariables` incluye `--corner-radius-*` (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `28px`, `32px`).
- Elevación/sombras disponibles en variables: `raw.cssVariables` incluye `--elevation-*` y `--elevation-elevation*` (box-shadow y border).
- Motion disponible en variables: `raw.cssVariables` incluye `--motion-springs-*-duration` (ms) y curvas (`--motion-*-curve-animation-timing-function`).

## Goals / Non-Goals

**Goals:**

- Definir un **design system** cuyo punto de partida sea la evidencia `airbnb-home-style.json`, con:
  - tokens normalizados (colores, tipografía, radius, spacing, sombra/elevación, bordes, motion, breakpoints si aplica)
  - componentes objetivo (al menos Button, Link, Input; y los que aparezcan en la evidencia o se detecten como necesarios) mapeados a tokens
  - reglas de uso (p. ej. jerarquía tipográfica, estados hover/focus) sustentadas en evidencia
- Establecer una convención de **fuente de verdad**:
  - la evidencia queda inmutable/versionada
  - el design system se deriva de esa evidencia mediante artefactos formales (specs) y, luego, implementación
- Mantener trazabilidad: cada token/decisión debe poder referenciar el origen (selector/variable CSS) dentro del JSON.

**Non-Goals:**

- Rediseñar o “mejorar” el estilo: este change no propone cambios estéticos, solo derivación del sistema.
- Replicar el 100% de Airbnb: el design system se basará en el estilo observado, pero no pretende ser una copia completa de toda su UI.
- Inventar breakpoints o valores ausentes: si no se puede inferir, deben permanecer `null` hasta obtener evidencia adicional.

## Decisions

1) **La evidencia JSON es la fuente de verdad**

- Se mantendrá `evidence/airbnb-home-style.json` como artefacto inmutable de referencia.
- Cualquier token del design system debe poder mapearse a:
  - `tokens.*` del JSON (si ya existe), o
  - `raw.cssVariables` (si el sistema está expresado en variables), o
  - `components[].evidence[].snippet` (estilos computados).

2) **Derivación de tokens con prioridad en variables CSS cuando existan**

- Para tokens con mejor cobertura en `raw.cssVariables`, se priorizará derivar desde ahí:
  - **Radius**: mapear `--corner-radius-*` a `tokens.radius.scale` del design system (p. ej. 4/8/12/16/20/24/28/32px).
  - **Shadow/Elevation**: mapear `--elevation-*` y `--elevation-elevation*` a `tokens.shadow.scale` y/o un set extendido de elevaciones.
  - **Motion**: usar `--motion-springs-*-duration` (ms) y curvas `--motion-*-curve-animation-timing-function` para `tokens.motion`.
- Para tokens donde la evidencia actual sea incompleta (p. ej. `shadow.*` aparece `null` en `tokens.shadow.scale`), se tomará como señal primaria la variable CSS equivalente presente en `raw.cssVariables`.

3) **Color: separar paleta (neutrales + brand) de semántica**

- Paleta:
  - neutrales desde `tokens.color.palette.neutrals` (ej. `#000000`, `#222222`, `#FFFFFF`, `#F7F7F7`)
  - brand desde `tokens.color.palette.brand` (ej. `#FF385C`, `#E00B41`, `#92174D`, `#460479`)
- Semántica:
  - `text.primary = "rgb(34, 34, 34)"`
  - `bg.page = "rgb(255, 255, 255)"`
  - `action.primary = "#FF385C"`
  - otros semánticos solo se agregarán si existe evidencia suficiente.

4) **Tipografía: adoptar la “carta” y jerarquías observadas**

- Mantener como base:
  - `body`: `14px / 20.02px` con la familia observada en la evidencia
- Jerarquías iniciales:
  - `h1`: `28px`, `700`, `40.040001px`
  - `h2`: `14px`, `400`, `20.02px`
  - `h3`: `14px`, `500`, `18px`
- La escala podrá expandirse cuando haya evidencia adicional (p. ej. párrafos, captions, labels, etc.).

5) **Breakpoints: no definir sin evidencia**

- Dado que `tokens.breakpoints.values` está en `null`, no se definirá un set de breakpoints en specs hasta obtener evidencia:
  - de media queries accesibles, o
  - de comportamiento observado en más viewports y/o páginas.

6) **Formato de entrega del design system: Angular + Tailwind**

- El design system se implementará como componentes Angular y se consumirá a través de Tailwind.
- Los tokens derivados de la evidencia se mapearán a configuración/preset de Tailwind (p. ej. `theme.extend`) y, cuando aplique, a CSS variables para uso consistente en componentes.

7) **Implementación: 100% TypeScript + prácticas oficiales de Angular**

- Toda la base de código del design system se implementará en **TypeScript** (sin JavaScript) y con **tipado estricto**.
- La arquitectura, estructura de proyecto y patrones (componentes, DI, formularios, RxJS, etc.) seguirán prácticas recomendadas por la **documentación oficial de Angular**.

## Risks / Trade-offs

- **[Evidencia incompleta por truncado de variables]** → Mitigación: repetir extracción en modo “full” (o dividir evidencia en varios archivos) para no truncar `raw.cssVariables`, o generar un artefacto adicional con el dump completo de variables.
- **[Muestreo de componentes no representativo]** (componentes con backgrounds transparentes o bordes 0px en los samples) → Mitigación: en specs, priorizar variables del sistema (`raw.cssVariables`) y ampliar evidencia capturando elementos más “canónicos” (CTAs, inputs con borde, cards con elevación).
- **[Breakpoints desconocidos]** → Mitigación: capturar evidencia en múltiples viewports y/o extraer media queries desde CSS accesible; mientras tanto mantener `null`.
- **[CORS / CSS inaccesible por reglas cross-origin]** → Mitigación: basarse en computed styles + variables leídas desde hojas accesibles; si se necesita, capturar CSS desde red (HAR) o con herramientas locales fuera de restricciones.

## Migration Plan

- Sin migración de producción en esta fase. La “migración” es conceptual:
  - evidence → specs (contrato) → implementación del design system.

## Open Questions

- ¿Cuál será el set mínimo de componentes objetivo además de Button/Link/Input (p. ej. Card, Navbar, SearchBar)?
- ¿Cómo se validará fidelidad visual (tests de regresión visual, snapshots, checklist manual)?
