Feature: Registro de usuario con Rol Flexible (Cliente / Trabajador / Mixto)

  Background:
    Given el usuario se encuentra en la pantalla de registro
    And el usuario no tiene una cuenta creada
    And el usuario no tiene sesión activa

  Rule: Selección obligatoria de rol operativo antes de continuar

    Scenario: El usuario intenta continuar sin seleccionar rol
      When el usuario no selecciona ningún rol
      And intenta continuar el registro
      Then el sistema no debe permitir avanzar
      And el sistema debe indicar que debe seleccionar al menos un rol

    Scenario: Selección válida de rol
      When el usuario selecciona "Solo Cliente"
      Or el usuario selecciona "Solo Trabajador"
      Or el usuario selecciona "Cliente y Trabajador"
      Then el sistema debe permitir continuar al siguiente paso

    Scenario: Rol mixto exige cumplimiento de ambos perfiles
      Given el usuario selecciona "Cliente y Trabajador"
      When continúa el proceso
      Then el sistema debe exigir los requisitos de Cliente
      And el sistema debe exigir los requisitos de Trabajador

  Rule: Datos generales obligatorios para cualquier tipo de usuario

    Scenario: Intento de registro con datos incompletos
      When el usuario omite el nombre completo
      Or omite el correo electrónico
      Or omite la contraseña
      Or omite el número de contacto
      Or omite la ubicación geográfica
      Then el sistema no debe permitir continuar
      And el sistema debe indicar que todos los campos obligatorios deben completarse

    Scenario: Nombre completo obligatorio
      When el usuario ingresa iniciales incompletas como nombre
      Then el sistema debe rechazar el registro
      And debe indicar que el nombre completo es obligatorio

    Scenario: Número de contacto requiere indicativo
      When el usuario ingresa el número sin seleccionar indicativo internacional
      Then el sistema no debe permitir continuar
      And debe indicar que el indicativo es obligatorio

    Scenario: Número de contacto no puede contener letras
      When el usuario ingresa letras en el número de contacto
      Then el sistema debe rechazar el valor ingresado

  Rule: Validaciones funcionales del correo electrónico

    Scenario: Correo con espacios
      When el usuario ingresa un correo electrónico con espacios
      Then el sistema no debe permitir avanzar
      And debe indicar que el correo no puede contener espacios

    Scenario: Correo con formato inválido
      When el usuario ingresa un correo sin formato válido
      Then el sistema debe rechazar el correo

    Scenario: Correo duplicado
      Given ya existe una cuenta con el correo ingresado
      When el usuario intenta registrarse
      Then el sistema no debe permitir el registro
      And debe indicar que el correo ya está registrado

  Rule: Reglas obligatorias de contraseña

    Scenario: Contraseña menor a 8 caracteres
      When el usuario ingresa una contraseña con menos de 8 caracteres
      Then el sistema debe rechazarla

    Scenario: Contraseña sin mayúscula
      When el usuario ingresa una contraseña sin al menos una letra mayúscula
      Then el sistema debe rechazarla

    Scenario: Contraseña sin símbolo especial
      When el usuario ingresa una contraseña sin al menos un símbolo especial
      Then el sistema debe rechazarla

    Scenario: Contraseña igual al correo
      When el usuario ingresa una contraseña idéntica al correo electrónico
      Then el sistema debe rechazarla

    Scenario: Cambio de contraseña permitido y exigible por seguridad
      Given el usuario tiene una cuenta activa
      When el usuario decide cambiar su contraseña
      Then el sistema debe permitir el cambio
      And el sistema puede exigir cambio periódico por política de seguridad

  Rule: Requisitos adicionales para Cliente

    Scenario: Cliente persona natural requiere documento y validación biométrica
      Given el usuario selecciona rol Cliente
      And selecciona Persona Natural
      When no adjunta documento de identidad válido
      Or no realiza validación biométrica o selfie
      Then el sistema no debe activar completamente la cuenta

    Scenario: Cliente persona jurídica requiere documentación empresarial
      Given el usuario selecciona rol Cliente
      And selecciona Persona Jurídica
      When no adjunta documentación empresarial válida
      Or no registra datos del representante legal
      Or no realiza validación biométrica
      Then el sistema debe dejar la cuenta en estado pendiente de validación documental

  Rule: Requisitos adicionales para Trabajador

    Scenario: Trabajador debe completar perfil profesional mínimo
      Given el usuario selecciona rol Trabajador
      When no selecciona al menos una categoría de servicio
      Or no registra mínimo dos proyectos demostrables
      Or no acredita al menos seis meses de experiencia
      Then el sistema no debe habilitar la postulación a solicitudes

    Scenario: Servicio regulado requiere certificación
      Given el trabajador selecciona un servicio que requiere licencia o certificación
      When no adjunta la certificación correspondiente
      Then el sistema no debe habilitar ese servicio

    Scenario: Trabajador sin membresía activa no puede postularse
      Given el usuario tiene rol Trabajador
      And no tiene suscripción activa
      When intenta postularse a una solicitud
      Then el sistema debe impedir la postulación

  Rule: Condiciones económicas de membresía

    Scenario: Activación de membresía requiere pago confirmado
      Given el trabajador selecciona un plan de suscripción
      When el pago no es exitoso o no está confirmado
      Then la membresía no debe activarse

    Scenario: Aceptación de comisión por transacción
      When el trabajador acepta las condiciones comerciales
      Then el sistema debe registrar la aceptación de comisión por servicio adjudicado

  Rule: Reglas de conducta y calidad del trabajador

    Scenario: Suspensión por calificación inferior al mínimo
      Given el trabajador tiene una calificación inferior a 4.0
      Then el sistema puede suspender su acceso a nuevas solicitudes

    Scenario: Incumplimiento de pagos de membresía
      Given el trabajador incumple el pago de su suscripción
      Then el sistema debe suspender el acceso a nuevas solicitudes

    Scenario: Evasión de comisión o uso indebido de datos
      When el sistema detecta contacto externo para evitar comisión
      Or detecta uso indebido de datos personales
      Then el sistema puede suspender o terminar definitivamente la cuenta

  Rule: Aceptación legal obligatoria antes de verificación

    Scenario: Intento de continuar sin aceptar condiciones legales
      When el usuario no acepta términos y condiciones
      Or no acepta política de privacidad
      Or no acepta tratamiento de datos
      Then el sistema no debe permitir avanzar a la verificación

  Rule: Verificación de cuenta obligatoria

    Scenario: Cuenta sin verificación no puede operar
      Given el usuario completó el registro
      When no confirma el código enviado al correo o número de contacto
      Then el sistema no debe permitir operar en la plataforma

  Rule: Estados iniciales de la cuenta

    Scenario: Registro pendiente de verificación
      Given el usuario completó el formulario
      And no ha confirmado el código de verificación
      Then la cuenta debe quedar en estado "Pendiente de verificación"

    Scenario: Cliente validado
      Given el usuario cumple requisitos de Cliente
      And ha completado validaciones requeridas
      Then la cuenta debe quedar en estado "Activo como cliente"

    Scenario: Trabajador con membresía activa
      Given el usuario cumple requisitos de Trabajador
      And tiene membresía activa
      And ha completado validaciones requeridas
      Then la cuenta debe quedar en estado "Activo como trabajador"

    Scenario: Usuario en modo mixto activo
      Given el usuario cumple requisitos de Cliente
      And cumple requisitos de Trabajador
      And tiene membresía activa si aplica
      Then la cuenta debe quedar en estado "Activo en modo mixto"
