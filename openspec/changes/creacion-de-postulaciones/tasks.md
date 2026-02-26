## 1. Routing y navegación

- [x] 1.1 Añadir ruta `mis-solicitudes` (pantalla “Mis solicitudes”) en `anyjobs/src/app/app.routes.ts`
- [x] 1.2 Añadir ruta de composición de propuesta (p. ej. `solicitudes/:id/propuesta`) y enlazarla desde el detalle
- [x] 1.3 Asegurar navegación de regreso (cancelar → detalle; confirmación → “Mis solicitudes”)

## 2. Modelo de datos y persistencia (MVP)

- [x] 2.1 Definir modelos TypeScript para propuesta (id, requestId, userId, campos, createdAt, status)
- [x] 2.2 Implementar `ProposalsService` (data-access) con persistencia en `localStorage` (clave versionada `anyjobs.proposals.v1`)
- [x] 2.3 Implementar métodos mínimos: crear/enviar propuesta, listar por usuario, obtener por `requestId`
- [x] 2.4 Manejar tolerancia a datos inválidos/cambios de versión (fallback seguro)

## 3. Pantalla: Composición de propuesta (`open-request-proposal-compose`)

- [x] 3.1 Crear componente route-level standalone para composición de propuesta con `OnPush`
- [x] 3.2 Implementar gating por sesión (`AuthSessionService`): sin sesión mostrar CTAs login/registro
- [x] 3.3 Integrar carga de resumen de solicitud (usando `OpenRequestsService`) para mostrar contexto (título/extracto/metadatos)
- [x] 3.4 Implementar formulario (Reactive Forms) con campos: “¿Quién soy?”, “Propuesta/mensaje”, “Estimación inicial”
- [x] 3.5 Añadir validaciones mínimas (requeridos, longitudes mínimas) y feedback de errores
- [x] 3.6 Implementar “Enviar propuesta” (simulado): persistir en `localStorage` y mostrar confirmación
- [x] 3.7 Implementar “Cancelar” (volver al detalle) y estados UX (loading/error)

## 4. Pantalla: “Mis solicitudes” (`my-requests-dashboard`)

- [x] 4.1 Crear componente route-level standalone para “Mis solicitudes” con `OnPush`
- [x] 4.2 Implementar gating por sesión: sin sesión mostrar CTAs login/registro
- [x] 4.3 Listar propuestas del usuario desde `ProposalsService` y resolver datos de solicitud para cada item (mínimo: extracto + presupuesto/ubicación si existe)
- [x] 4.4 Implementar acciones por item: “Ver detalle” y “Ver propuesta” (vista read-only o expansión)
- [x] 4.5 Implementar estados UX: loading, empty state (CTA a `/solicitudes`), error con reintento

## 5. Modificación del detalle de solicitud (`open-request-detail-page`)

- [x] 5.1 Reemplazar el modal placeholder de “Postular” por navegación al flujo de propuesta cuando hay sesión
- [x] 5.2 Mantener el comportamiento de usuario sin sesión (CTAs login/registro) sin enviar propuestas automáticamente
- [x] 5.3 Revisar accesibilidad: foco visible, labels, `type="button"` en botones, textos accesibles

## 6. Calidad: tests y verificación

- [x] 6.1 Añadir tests unitarios básicos para composición de propuesta (gating, validación, envío simulado)
- [x] 6.2 Añadir tests unitarios básicos para “Mis solicitudes” (empty/error/success)
- [x] 6.3 Verificación manual del flujo end-to-end: detalle → propuesta → enviar → “Mis solicitudes” refleja la propuesta
- [x] 6.4 Ejecutar lint/tests del workspace y corregir issues introducidos

