## ADDED Requirements

### Requirement: CTA “Postular” MUST abrir el flujo de propuesta
Cuando exista sesión activa, el CTA “Postular” del detalle MUST abrir el flujo de composición de propuesta asociado a la solicitud, en lugar de ejecutar una postulación inmediata.

#### Scenario: Usuario con sesión abre composición de propuesta desde el detalle
- **WHEN** el usuario tiene sesión iniciada y activa “Postular” en el detalle de una solicitud
- **THEN** el sistema MUST navegar a la pantalla de composición de propuesta asociada a esa solicitud

#### Scenario: Usuario sin sesión es guiado a autenticación
- **WHEN** el usuario no tiene sesión iniciada y activa “Postular” en el detalle de una solicitud
- **THEN** el sistema MUST guiar a iniciar sesión o crear cuenta sin enviar ninguna propuesta automáticamente

