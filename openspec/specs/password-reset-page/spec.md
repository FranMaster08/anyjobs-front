## Purpose

Página pública de recuperación y restablecimiento de contraseña en `/recuperar-contrasena`.

## Requirements

### Requirement: Password recovery page MUST be reachable at /recuperar-contrasena

The system MUST expose a public route `/recuperar-contrasena` that does not require an authenticated session. When the URL contains query parameter `token`, the page MUST show the new-password form. When `token` is absent, the page MUST show a form to request recovery by email.

#### Scenario: User opens reset link from email
- **WHEN** the user navigates to `/recuperar-contrasena?token=<value>`
- **THEN** the page MUST display fields for new password and password confirmation, not the email request form

#### Scenario: User opens recovery without token
- **WHEN** the user navigates to `/recuperar-contrasena` without `token`
- **THEN** the page MUST display an email field and submit action for forgot-password

### Requirement: Reset form MUST validate password match and strength before submit

The reset form MUST apply the same strong password rules as user registration (`strongPasswordValidator`: minimum 8 characters, uppercase, lowercase, digit, symbol). The form MUST include password confirmation and MUST block submit when values do not match.

#### Scenario: Mismatched passwords block submit
- **WHEN** the user enters different values in password and confirmation
- **THEN** the UI MUST show a validation error and MUST NOT call the reset API

### Requirement: Page MUST show loading, success, and error states

While calling the API, the page MUST show a loading state and MUST disable duplicate submits. On successful reset, the page MUST show a clear success message and MUST offer navigation to login (e.g. link to home with `?login=1` or explicit «Iniciar sesión»). On API errors for invalid/expired/used token, the page MUST show a user-friendly error without exposing internal details.

#### Scenario: Successful reset offers login
- **WHEN** `POST /auth/reset-password` succeeds
- **THEN** the page MUST show success copy and MUST provide an action to open the login flow

#### Scenario: Invalid token shows controlled error
- **WHEN** the API returns `400` for an invalid token
- **THEN** the page MUST show an error state explaining the link is invalid or expired and MUST NOT display stack traces or raw API payloads

### Requirement: Visual design MUST match application look and feel

The page MUST use existing design tokens and patterns: `--aj-color-primary`, `--aj-radius-*`, `.fieldLabel`, `.fieldControl`, `.btn`, typography and spacing consistent with registration and login modal. Layout MUST be usable on desktop and mobile viewports.

#### Scenario: Page uses shared field and button styles
- **WHEN** the recovery page is rendered
- **THEN** inputs and primary actions MUST use the same CSS classes/tokens as registration or login forms

### Requirement: Forgot-password submit MUST show generic success

After submitting an email for recovery, the UI MUST display the generic success message from the API regardless of whether the account exists. The UI MUST NOT state that the email was or was not found.

#### Scenario: Email request shows same success for any email
- **WHEN** the user submits the forgot-password form with any valid email format
- **THEN** the UI MUST show the generic success message from `POST /auth/forgot-password`
