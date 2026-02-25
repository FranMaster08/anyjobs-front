## ADDED Requirements

### Requirement: Selector de idioma en runtime
El sistema MUST ofrecer un selector de idioma visible (p. ej. en el header) que permita cambiar el idioma en runtime sin recargar la página.

#### Scenario: Usuario cambia idioma y la UI actualiza textos
- **WHEN** el usuario selecciona un idioma distinto en el selector
- **THEN** el sistema MUST actualizar los textos de UI renderizados al idioma seleccionado sin recargar

### Requirement: Persistencia del idioma seleccionado
El idioma seleccionado MUST persistirse para que se mantenga entre recargas y nuevas sesiones.

#### Scenario: Usuario recarga la página
- **WHEN** el usuario recarga el navegador tras haber seleccionado un idioma
- **THEN** el sistema MUST inicializar el idioma usando la preferencia persistida

### Requirement: Fallback de traducciones
Si una clave de traducción no existe en el idioma actual, el sistema MUST usar un fallback consistente (p. ej. idioma por defecto) y MUST evitar romper el render.

#### Scenario: Falta una clave en el idioma actual
- **WHEN** la UI intenta renderizar una clave que no existe en el diccionario del idioma actual
- **THEN** el sistema MUST renderizar el valor de fallback y continuar funcionando

## MODIFIED Requirements

<!-- None -->

## REMOVED Requirements

<!-- None -->

