## Why

Establecer una **línea base (baseline)** del sistema visual de una página real (Airbnb) mediante **extracción** (DOM + CSS + estilos computados) para poder recrear el diseño con alta fidelidad en implementaciones posteriores y/o para alimentar automatizaciones de UI.

El propósito inmediato de este cambio es **crear un design system basado en ese estilo**, usando como fuente la evidencia extraída y versionada en este change.

Este cambio es necesario ahora porque el flujo requiere un output **estructurado y reproducible** (JSON) con evidencia, en vez de notas manuales o valores inventados.

## What Changes

- Se captura el estilo visual de la URL objetivo con un viewport fijo (1440x900) y se normaliza en un **JSON único** con:
  - tokens (color, tipografía, radius, spacing, shadow, border, motion, breakpoints)
  - componentes representativos (Button, Link, Input) con estilos base y estados (hover/focus) cuando fue posible
  - evidencia (selectores + computed styles) y notas de limitaciones
- Se guarda el output como evidencia versionable en el repo:
  - `openspec/changes/extract-style-base-line/evidence/airbnb-home-style.json`

## Capabilities

### New Capabilities
- `style-extractor`: Dado una URL, extrae (DOM + CSS + computed styles) y produce un JSON único que describe tokens y componentes con evidencia para recreación fiel.

### Modified Capabilities
- (ninguna)

## Impact

- **Artefactos OpenSpec**: este `proposal.md` habilita `design` y `specs` en el flujo `spec-driven`.
- **Evidencia**: el JSON de extracción queda versionado bajo `openspec/changes/extract-style-base-line/evidence/`.
- **Design system**: los tokens y componentes del design system se derivarán de la evidencia (especialmente `airbnb-home-style.json`) y se formalizarán en `design.md`/`specs`.
- **Limitaciones conocidas** (ver también `meta.notes` dentro del JSON):
  - breakpoints no inferidos de forma confiable (valores en `null`)
  - variables CSS truncadas en `raw.cssVariables` por tamaño de salida
