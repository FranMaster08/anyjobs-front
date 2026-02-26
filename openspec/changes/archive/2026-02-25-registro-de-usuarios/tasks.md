## 1. Estructura y routing del feature

- [x] 1.1 Crear el slice de feature para registro (p. ej. `features/auth/registration/`) con componentes standalone
- [x] 1.2 Definir rutas lazy-loaded para el flujo de registro y un entry component/página de “Registro”
- [x] 1.3 Añadir navegación básica entre etapas (sin API) para validar estructura

## 2. Modelos de estado y ViewModels (tipados)

- [x] 2.1 Definir `RegistrationStateVM` (stage, roles, flags de verificación, active/listable) en un archivo de modelos compartido del feature
- [x] 2.2 Definir `RegisterFormVM` (ACCOUNT) y su `FormGroup` (Reactive Forms) con tipado estricto
- [x] 2.3 Definir `LocationFormVM` (LOCATION) y su `FormGroup`
- [x] 2.4 Definir `WorkerProfileFormVM` y `ClientProfileFormVM` (ROLE_PROFILE) y sus `FormGroup`
- [x] 2.5 Implementar un `RegistrationStateService` (o store simple) para mantener `stage`, roles y flags durante el flujo

## 3. Validadores reutilizables (sync)

- [x] 3.1 Implementar validador de password fuerte (min 8 + complejidad) reutilizable
- [x] 3.2 Implementar validadores de formato para email y teléfono (E.164 recomendado para teléfono)
- [x] 3.3 Implementar validación `acceptTerms === true` y `selectedRoles.length >= 1`
- [x] 3.4 Aplicar validadores a los formularios de `ACCOUNT`, `LOCATION` y `ROLE_PROFILE` según spec

## 4. Servicio de API y contratos FE→API

- [x] 4.1 Crear servicio `AuthApi` (o equivalente) con método `register(RegisterRequest)`
- [x] 4.2 Crear métodos `verifyEmail(VerifyOtpRequest)` y `verifyPhone(VerifyOtpRequest)` usando token de sesión (sin `userId` en request)
- [x] 4.3 Crear servicio `UserApi` (o equivalente) con métodos `updateLocation(UpdateLocationRequest)`, `updateWorkerProfile(UpdateWorkerProfileRequest)`, `updateClientProfile(UpdateClientProfileRequest)`
- [x] 4.4 Implementar mappers VM→Request para cada llamada (ACCOUNT → RegisterRequest, LOCATION → UpdateLocationRequest, perfiles → Update*ProfileRequest)

## 5. Etapa ACCOUNT (UI + submit)

- [x] 5.1 Implementar pantalla/step `ACCOUNT` con campos mínimos (`fullName`, `email`, `phoneNumber`, `password`, `acceptTerms`, `selectedRoles`)
- [x] 5.2 Deshabilitar “Continuar” cuando `form.invalid` y mostrar errores locales por campo
- [x] 5.3 Implementar submit de `ACCOUNT`: llamar `register` y persistir en estado local flags/respuesta necesarios para decidir siguiente etapa
- [x] 5.4 Cablear transición a `VERIFY` tras `register` exitoso

## 6. Validadores asíncronos (emailTaken/phoneTaken)

- [x] 6.1 Implementar endpoints/métodos necesarios en `AuthApi` para comprobar disponibilidad (si existen) o definir fallback de validación en submit
- [x] 6.2 Implementar async validators con debounce para `emailTaken` y `phoneTaken`
- [x] 6.3 Integrar async validators en el `FormGroup` de `ACCOUNT` y mostrar mensajes de error

## 7. Etapa VERIFY (OTP + gating por rol)

- [x] 7.1 Implementar step `VERIFY` con inputs OTP y botones de “Verificar email” / “Verificar teléfono”
- [x] 7.2 Bloquear envío de verificación si OTP vacío o inválido (validación local)
- [x] 7.3 Implementar llamadas `verifyEmail` y `verifyPhone` y actualizar `emailVerified` / `phoneVerified` en el estado
- [x] 7.4 Implementar gating: si incluye rol `WORKER`, exigir `phoneVerified === true` para permitir continuar
- [x] 7.5 Implementar comportamiento CLIENT: permitir continuar con 1 verificación completada y mostrar recomendación de completar ambas
- [x] 7.6 Mapear errores de OTP (inválido/expirado/etc.) al control OTP con error uniforme `api`

## 8. Etapa LOCATION (mínima + sin dirección exacta)

- [x] 8.1 Implementar step `LOCATION` con `city` requerido y `area`/`countryCode` opcionales
- [x] 8.2 Asegurar que no existan campos de dirección exacta en UI ni en modelos/payloads
- [x] 8.3 Mostrar `coverageRadiusKm` solo si incluye rol `WORKER` y tratarlo como opcional
- [x] 8.4 Implementar submit: llamar `updateLocation` enviando solo campos presentes

## 9. Etapa ROLE_PROFILE (mínimos por rol)

- [x] 9.1 Implementar step `ROLE_PROFILE` que renderice secciones según roles seleccionados
- [x] 9.2 Para `WORKER`: implementar selección de `categories[]` (min 1) y bloquear finalizar si no cumple
- [x] 9.3 Para `CLIENT`: implementar `preferredPaymentMethod` como opcional
- [x] 9.4 Implementar submit: llamar `updateWorkerProfile` si incluye WORKER y `updateClientProfile` si incluye CLIENT

## 10. Definición FE de “active/listable” y finalización del flujo

- [x] 10.1 Definir “active” como onboarding mínimo completado desde FE
- [x] 10.2 Definir “listable” para WORKER como `phoneVerified === true` y `categories.length >= 1`
- [x] 10.3 Implementar transición a `DONE` y pantalla final/resumen (p. ej. “Cuenta creada” + próximos pasos)

## 11. Manejo uniforme de errores API y UX states

- [x] 11.1 Implementar un mapper de errores API→Form (por campo y/o global) con convención `api`
- [x] 11.2 Implementar estados de carga por submit/verificación (loading/disabled)
- [x] 11.3 Implementar manejo de error recuperable con reintento en cada step (cuando aplique)

## 12. i18n, enums y textos

- [x] 12.1 Definir enums/consts para roles, etapas, métodos de pago, y estados de verificación
- [x] 12.2 Crear textos i18n para labels, ayudas y mensajes de validación (password, email, phone, OTP, términos)
- [x] 12.3 Asegurar consistencia de mensajes entre steps (mismo tono y mismas claves)

## 13. Tests y verificación

- [x] 13.1 Añadir tests unitarios para validadores (password, email, phone, OTP)
- [x] 13.2 Añadir tests del `RegistrationStateService` (transiciones y gating por rol)
- [x] 13.3 Añadir tests de integración básicos del flujo “happy path” (CLIENT y WORKER)
- [x] 13.4 Verificar criterios: WORKER no finaliza sin `phoneVerified` y sin `categories`, y no hay dirección exacta en registro
