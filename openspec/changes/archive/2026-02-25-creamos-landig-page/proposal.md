## Why

Actualmente no hay una vista “tipo landing” que permita descubrir de forma rápida las solicitudes de trabajo abiertas. Esta pantalla mejora la conversión al facilitar explorar, comparar y entrar a detalle desde un listado visual y escaneable.

## What Changes

- Nueva landing pública de **solicitudes de trabajo abiertas** (open requests).
- La landing sigue una estructura visual tipo “marketplace” basada en `@reference`:
  - Hero en 2 columnas (resumen + CTAs + media destacada)
  - Sección “Selección destacada” con cards y acciones
- Listado en formato “cards” donde cada solicitud muestra:
  - Foto/imagen representativa (o placeholder si no existe)
  - Comentario/descripcion corta (extracto)
  - Metadatos clave (p. ej. categoría/etiquetas, ubicación o remoto, fecha/publicación, presupuesto/rango si aplica)
- Interacciones principales:
  - Entrar al detalle de una solicitud desde la card
  - Acciones secundarias (p. ej. “Consultar/Aplicar” o equivalente según el dominio)
- Estados y UX mínimos:
  - Carga (skeletons)
  - Vacío (sin solicitudes)
  - Error (reintento)
  - Responsive (mobile/tablet/desktop) siguiendo el patrón visual de la referencia

## Capabilities

### New Capabilities
- `open-requests-browse`: Reglas y comportamiento de la landing/listado para explorar solicitudes abiertas (estructura, datos mínimos por card, estados, y navegación a detalle).

### Modified Capabilities
<!-- None -->

## Impact

- Frontend:
  - Nueva ruta/página de landing y componentes de UI (grid/cards, hero/encabezado, acciones).
  - Gestión de estados (loading/empty/error) y responsive layout.
- Datos de prueba:
  - Mock JSON local para simular la API durante desarrollo hasta definir el endpoint real.
- Datos / APIs:
  - Consumo de endpoint para listar solicitudes abiertas (paginación/orden si aplica) y obtener imagen/extracto.
  - Definición clara de campos mínimos necesarios para renderizar cada card.
- SEO/Analítica (si aplica al producto):
  - Metadatos básicos de página y eventos de navegación/click en cards.
