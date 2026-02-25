## Angular CLI: comandos y convención del repo

### Principio

Los artefactos se generan con **Angular CLI** y se ubican respetando la estructura por **feature areas**:

- `src/app/core/`
- `src/app/shared/`
- `src/app/features/<feature>/`
- `src/app/shell/`

### Comandos comunes

```bash
# Levantar dev server
ng serve

# Build
ng build

# Tests
ng test
```

### Generación de artefactos (ejemplos)

```bash
# Shell (layout)
ng generate component shell/shell --standalone

# Feature (ruta/página) bajo features/<feature>/
ng generate component features/<feature>/<feature> --standalone

# Componente interno de una feature
ng generate component features/<feature>/components/<name> --standalone

# Servicio asociado a una feature
ng generate service features/<feature>/data-access/<name>
```
