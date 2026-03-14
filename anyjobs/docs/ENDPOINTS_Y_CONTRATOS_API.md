# AnyJobs Front — Endpoints y contratos (payloads)

Este documento lista **los endpoints que este front consume** y sus **contratos (request/response)**, de forma que cualquier IA pueda implementar un backend compatible.

> Fuente: contratos inferidos desde los tipos/servicios del proyecto Angular (MVP).  
> Nota: el front trae *mocks locales* por defecto (archivos `mock/*.json`). Para usar backend real, hay que configurar las URLs base (ver abajo).

## URLs base (cómo configura el front la API)

El front no usa un único `API_BASE_URL`. Usa **InjectionTokens** (una URL por “sub-API”):

- **Auth**: `AUTH_API_URL` (por defecto: `…/mock/auth`)
- **Usuarios**: `USERS_API_URL` (por defecto: `…/mock/users`)
- **Solicitudes abiertas**: `OPEN_REQUESTS_API_URL` (por defecto: `…/mock/open-requests.mock.json`)
- **Propuestas**: `PROPOSALS_API_URL` (por defecto: `…/mock/proposals.mock.json`, pero el MVP persiste en `localStorage`)
- **Config del sitio**: `SITE_CONFIG_URL` (por defecto: `…/mock/site.mock.json`)

### Recomendación de rutas en backend (para “enchufar” el front)

Para un backend real, una convención sencilla (puedes variar, pero mantén contratos):

- `AUTH_API_URL = https://<host>/auth`
- `USERS_API_URL = https://<host>/users`
- `OPEN_REQUESTS_API_URL = https://<host>/open-requests`
- `PROPOSALS_API_URL = https://<host>/proposals`
- `SITE_CONFIG_URL = https://<host>/site-config`

## Convenciones comunes

### Content-Type

- Requests con body JSON: `Content-Type: application/json`
- Responses JSON: `Content-Type: application/json; charset=utf-8`

### Autenticación (estado actual + recomendado)

- **Estado actual del front**: el código **no añade** `Authorization: Bearer ...` automáticamente (no hay interceptor HTTP).
- **Recomendación**: implementar endpoints protegidos aceptando:
  - **Cookie de sesión (same-origin)** para flujo de registro, o
  - `Authorization: Bearer <token>` para endpoints de “mi usuario” y propuestas.

Si eliges cross-origin + cookies, recuerda que el front tendría que enviar `withCredentials: true` (hoy no lo hace), así que lo más simple es **same-origin** o **Bearer token** + interceptor (cambio en front).

### Errores

El front, tal cual está, solo muestra mensajes cuando el error llega como `Error`/string; para errores HTTP típicos podría terminar en “Error inesperado”.

Para compatibilidad, se recomienda que en casos de validación el backend responda con:

- **4xx** y body JSON simple con un mensaje:

```json
{ "message": "Texto legible para usuario" }
```

o, si quieres algo más estructurado:

```json
{
  "message": "Validación fallida",
  "fieldErrors": { "email": "Email ya existe" }
}
```

(El front actualmente no parsea `fieldErrors`, pero es útil para futuras mejoras.)

### Tipos / enums usados por el front

- **UserRole**: `"CLIENT" | "WORKER"`
- **RegistrationStatus**: `"PENDING" | "ACTIVE"`
- **RegistrationStage**: `"ACCOUNT" | "VERIFY" | "LOCATION" | "ROLE_PROFILE" | "PERSONAL_INFO" | "DONE"`
- **DocumentType**: `"DNI" | "NIE" | "PASSPORT"`
- **Gender**: `"MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY"`
- **PreferredPaymentMethod**: `"CARD" | "TRANSFER" | "CASH" | "WALLET"`

## Endpoints — Auth (`AUTH_API_URL`)

### POST `/register`

**Uso en front**: pantalla de registro (stage `ACCOUNT`).

**Request (JSON)** (`RegisterRequest`):

```json
{
  "fullName": "string",
  "email": "string",
  "phoneNumber": "string",
  "password": "string",
  "roles": ["CLIENT", "WORKER"]
}
```

**Notas**:
- `email` se normaliza a minúsculas en login, pero en register el front envía tal cual (trim). Se recomienda normalizar server-side.
- `phoneNumber` se espera en formato **E.164** (ej. `+34123456789`) por el validador del front.

**Response 200 (JSON)** (`RegisterResponse`):

```json
{
  "userId": "string",
  "status": "PENDING",
  "emailVerificationRequired": true,
  "phoneVerificationRequired": false,
  "nextStage": "VERIFY"
}
```

**Semántica**:
- `nextStage` controla el siguiente paso del wizard.
- En el mock del front: `phoneVerificationRequired` suele ser `true` si `roles` incluye `WORKER`.

---

### POST `/verify-email`

**Uso en front**: stage `VERIFY` (OTP email).

**Request (JSON)** (`VerifyOtpRequest`):

```json
{ "otpCode": "string" }
```

**Response**:
- Recomendado: `204 No Content`
- El front también acepta `200` con body vacío (`void`).

**Nota importante de implementación**:
El front **no envía** `userId` ni token en este request. Para que funcione sin cambiar el front, el backend debe poder resolver “qué usuario se está verificando” mediante:
- sesión/cookie, o
- un mecanismo server-side asociado al flujo de registro.

---

### POST `/verify-phone`

Igual a `verify-email`.

**Request**:

```json
{ "otpCode": "string" }
```

**Response**: `204` recomendado.

---

### GET `/email-available?email=<email>`

**Uso en front**: validador async del campo email (debounce ~350ms).

**Query params**:
- `email` (string)

**Response 200 (JSON)**:

```json
{ "available": true }
```

---

### GET `/phone-available?phoneNumber=<e164>`

**Uso en front**: validador async del campo teléfono (debounce ~350ms).

**Query params**:
- `phoneNumber` (string, E.164)

**Response 200 (JSON)**:

```json
{ "available": true }
```

---

### POST `/login`

**Uso en front**: modal de login en `Shell`.

**Request (JSON)** (`LoginRequest`):

```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200 (JSON)** (`LoginResponse`):

```json
{
  "token": "string",
  "user": {
    "id": "string",
    "fullName": "string",
    "email": "string",
    "roles": ["CLIENT"],
    "phoneNumber": "+34123456789",
    "emailVerified": true,
    "phoneVerified": false,
    "status": "ACTIVE",
    "countryCode": "ES",
    "city": "Madrid",
    "area": "Centro",
    "coverageRadiusKm": 10,
    "workerCategories": ["string"],
    "workerHeadline": "string",
    "workerBio": "string",
    "preferredPaymentMethod": "CARD",
    "documentType": "DNI",
    "documentNumber": "string",
    "birthDate": "YYYY-MM-DD",
    "gender": "MALE",
    "nationality": "string",
    "createdAt": "2026-01-01T12:00:00.000Z"
  }
}
```

**Notas**:
- El front guarda `token` y `user` en `localStorage`, pero hoy **no lo usa** para firmar requests HTTP.
- Campos del usuario (salvo `id/fullName/email/roles`) son **opcionales**.

## Endpoints — Usuarios (`USERS_API_URL`)

Estos endpoints se usan en el wizard de registro para completar perfil. El front llama rutas bajo `/me/...`.

### PATCH `/me/location`

**Request (JSON)** (`UpdateLocationRequest`):

```json
{
  "city": "string",
  "area": "string",
  "countryCode": "string",
  "coverageRadiusKm": 10
}
```

**Reglas según el front**:
- `city` es requerido en UI.
- `coverageRadiusKm` se envía solo si el usuario eligió rol `WORKER` y el valor es numérico.
- `area`, `countryCode` se envían solo si no están vacíos.

**Response**: `204 No Content` recomendado.

---

### PATCH `/me/worker-profile`

**Request (JSON)** (`UpdateWorkerProfileRequest`):

```json
{
  "categories": ["string"],
  "headline": "string",
  "bio": "string"
}
```

**Reglas según el front**:
- Para `WORKER`, `categories` debe tener al menos 1 elemento (validación UI).
- `headline` y `bio` se envían como `undefined` si vienen vacíos (server debe aceptar ausencia).

**Response**: `204` recomendado.

---

### PATCH `/me/client-profile`

**Request (JSON)** (`UpdateClientProfileRequest`):

```json
{ "preferredPaymentMethod": "CARD" }
```

**preferredPaymentMethod**:
`"CARD" | "TRANSFER" | "CASH" | "WALLET"`

**Response**: `204` recomendado.

---

### PATCH `/me/personal-info`

**Request (JSON)** (`UpdatePersonalInfoRequest`):

```json
{
  "documentType": "DNI",
  "documentNumber": "string",
  "birthDate": "YYYY-MM-DD",
  "gender": "MALE",
  "nationality": "string"
}
```

**Reglas según el front**:
- Si el usuario NO es `WORKER` y no completa nada, el front ni siquiera llama al endpoint.
- Para `WORKER`, UI exige `documentType`, `documentNumber` (min 5, max 24) y `birthDate`.

**Response**: `204` recomendado.

## Endpoints — Solicitudes abiertas (`OPEN_REQUESTS_API_URL`)

### GET `/` (listado paginado)

**Uso en front**: `OpenRequestsLanding` (home/listado + “cargar más”).

**Query params**:
- `page` (number, mínimo 1)
- `pageSize` (number, mínimo 1; el front usa 12)
- `sort` (opcional): `"publishedAtDesc"`

**Response 200 (JSON)** (`OpenRequestsListResponse`):

```json
{
  "items": [
    {
      "id": "string",
      "imageUrl": "string",
      "imageAlt": "string",
      "excerpt": "string",
      "tags": ["string"],
      "locationLabel": "string",
      "publishedAtLabel": "string",
      "budgetLabel": "string"
    }
  ],
  "nextPage": 2,
  "hasMore": true
}
```

**Notas**:
- `items[*].excerpt` se muestra siempre (el front lo normaliza a “Sin descripción” si viene vacío).
- Paginación: el front entiende `nextPage` (number o null) y `hasMore` (boolean). Si tu backend no usa `nextPage`, puedes devolver `hasMore` y el front calculará `page+1`.

---

### GET `/{id}` (detalle)

**Uso en front**: detalle (`/solicitudes/:id`) y también para componer propuesta y “mis solicitudes”.

**Path params**:
- `id` (string)

**Response 200 (JSON)** (`OpenRequestDetail`):

```json
{
  "id": "string",
  "title": "string",
  "excerpt": "string",
  "description": "string",
  "tags": ["string"],
  "locationLabel": "string",
  "publishedAtLabel": "string",
  "budgetLabel": "string",
  "provider": {
    "name": "string",
    "badge": "string",
    "subtitle": "string"
  },
  "reputation": 4.7,
  "reviewsCount": 120,
  "providerReviews": [
    { "author": "string", "rating": 5, "dateLabel": "string", "text": "string" }
  ],
  "contactPhone": "string",
  "contactEmail": "string",
  "images": [
    { "url": "string", "alt": "string" }
  ]
}
```

**Reglas/expectativas del front**:
- `images` debe existir y ser array (puede ser `[]`).
- `title` y `excerpt` se renderizan siempre (si faltan, el front genera fallback tipo `Solicitud <id>` / “Sin descripción”).
- `reputation` se interpreta 0.0–5.0.

## Endpoints — Configuración del sitio (`SITE_CONFIG_URL`)

### GET `/` (o la ruta que asignes a `SITE_CONFIG_URL`)

**Uso en front**: carga inicial (brand/hero/textos secciones).

**Response 200 (JSON)** (`SiteConfig`):

```json
{
  "brandName": "string",
  "hero": { "title": "string", "subtitle": "string" },
  "sections": {
    "requests": { "label": "string", "title": "string", "cta": "string" },
    "location": {
      "label": "string",
      "title": "string",
      "body": "string",
      "openMap": "string",
      "viewMap": "string",
      "preview": {
        "title": "string",
        "hintNoLocation": "string",
        "hintWithLocation": "string"
      }
    },
    "contact": {
      "label": "string",
      "title": "string",
      "intro": "string",
      "phone": { "label": "string", "value": "string", "hint": "string", "href": "string" },
      "email": { "label": "string", "value": "string", "hint": "string", "href": "string" }
    }
  }
}
```

## Propuestas — estado actual del MVP y contrato recomendado

### Estado actual (importante)

En el código actual:
- La feature de propuestas (`ProposalsService`) **no llama a backend real**.
- Persiste en `localStorage` y, si está en modo mock, “seedea” desde un JSON local.

Por tanto, **no hay endpoints estrictamente necesarios** para propuestas para que el front *actual* “arranque”.

### Si quieres backend real (recomendado para producción)

El front usa estas operaciones lógicas:
- `listByUser(userId)`
- `listByRequest(requestId)`
- `getByUserAndRequest(userId, requestId)`
- `sendProposal(input)`

Un set mínimo de endpoints REST compatibles sería:

#### GET `/` con filtros

**Ejemplos**:
- `GET /proposals?userId=<id>` → lista propuestas del usuario
- `GET /proposals?requestId=<id>` → lista propuestas para una solicitud
- `GET /proposals?userId=<id>&requestId=<id>` → una propuesta (si existe) o lista de 0/1

**Response 200 (JSON)**:

```json
[
  {
    "id": "string",
    "requestId": "string",
    "userId": "string",
    "author": { "name": "string", "subtitle": "string", "rating": 4.8, "reviewsCount": 120 },
    "whoAmI": "string",
    "message": "string",
    "estimate": "string",
    "createdAt": "2026-01-01T12:00:00.000Z",
    "status": "SENT"
  }
]
```

#### POST `/`

**Request (JSON)** (`CreateProposalInput`):

```json
{
  "requestId": "string",
  "userId": "string",
  "authorName": "string",
  "authorSubtitle": "string",
  "whoAmI": "string",
  "message": "string",
  "estimate": "string"
}
```

**Response 200/201 (JSON)** (`Proposal`):

```json
{
  "id": "string",
  "requestId": "string",
  "userId": "string",
  "author": { "name": "string", "subtitle": "string" },
  "whoAmI": "string",
  "message": "string",
  "estimate": "string",
  "createdAt": "2026-01-01T12:00:00.000Z",
  "status": "SENT"
}
```

## Dependencias externas (no AnyJobs) usadas por el front

Si habilitas el mapa, Leaflet carga tiles de OpenStreetMap:

- `GET https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

Esto no es parte del backend AnyJobs, pero sí es un “endpoint” externo requerido para ver el mapa con tiles.

