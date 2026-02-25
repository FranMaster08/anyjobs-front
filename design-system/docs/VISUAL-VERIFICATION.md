## Visual verification (baseline)

### Manual checklist (recommended now)

1. Levantar el playground:

```bash
cd design-system
npm start
```

2. Abrir `http://localhost:4200/playground` y verificar:
   - Tipografía base (body) y jerarquías `text-h1`, `text-h3`
   - Colores semánticos (`action-primary`, `text-primary`, `bg-page`)
   - Estados de componentes:
     - `aj-button`: hover, focus-visible ring, disabled
     - `aj-link`: hover underline, focus-visible ring
     - `aj-input`: focus ring, disabled

### Automated visual regression (future option)

Cuando se quiera automatizar:

- Usar Playwright para abrir `/playground` y tomar capturas por componente/estado.
- Guardar baselines bajo un directorio dedicado (p. ej. `visual-baselines/`) y ejecutar diffs en CI.

Nota: en esta etapa no se generan ni versionan imágenes automáticamente para mantener el repo liviano.

