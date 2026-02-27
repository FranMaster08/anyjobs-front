Feature: Inicio de sesión (Login) con sesión activa y perfil visible

  Background:
    Given el usuario está en la pantalla principal
    And el sistema muestra controles según el estado de sesión del usuario

  Rule: El inicio de sesión requiere usuario y contraseña válidos

    Scenario: Validación de contraseña antes de intentar iniciar sesión
      Given el usuario no tiene una sesión activa
      When el usuario ingresa un usuario válido
      And el usuario ingresa una contraseña que no cumple las reglas mínimas
      Then el sistema debe indicar que la contraseña no es aceptada
      And el sistema no debe intentar iniciar sesión

    Scenario: Reglas mínimas de contraseña aceptada
      Given el usuario no tiene una sesión activa
      When el usuario ingresa una contraseña
      Then el sistema solo debe aceptar la contraseña si contiene al menos una letra mayúscula
      And el sistema solo debe aceptar la contraseña si contiene al menos un carácter especial (por ejemplo, un punto)

    Scenario: Inicio de sesión exitoso
      Given el usuario no tiene una sesión activa
      And existe una cuenta para el usuario ingresado
      And la contraseña ingresada es correcta
      When el usuario selecciona "Iniciar sesión"
      Then el sistema debe iniciar la sesión del usuario
      And el sistema debe mantener la sesión activa en el navegador mientras sea válida
      And el sistema debe mostrar el perfil del usuario autenticado
      And el sistema no debe mostrar el botón "Iniciar sesión"

  Rule: Mensajes claros cuando el inicio de sesión falla

    Scenario: Usuario no existe
      Given el usuario no tiene una sesión activa
      And no existe una cuenta para el usuario ingresado
      When el usuario selecciona "Iniciar sesión"
      Then el sistema debe mostrar una notificación en la parte inferior derecha
      And la notificación debe indicar que no existe ese usuario
      And el sistema no debe iniciar sesión

    Scenario: Contraseña incorrecta
      Given el usuario no tiene una sesión activa
      And existe una cuenta para el usuario ingresado
      And la contraseña ingresada es incorrecta
      When el usuario selecciona "Iniciar sesión"
      Then el sistema debe mostrar una notificación en la parte inferior derecha
      And la notificación debe indicar que la contraseña es incorrecta
      And el sistema no debe iniciar sesión

  Rule: Opción de crear cuenta si el usuario no tiene una

    Scenario: Acceso a crear cuenta desde el login
      Given el usuario no tiene una sesión activa
      When el usuario indica que no tiene una cuenta
      Then el sistema debe ofrecer la opción de "Crear cuenta"
      And el usuario debe poder iniciar el proceso de creación de cuenta

  Rule: Comportamiento visual según estado de sesión

    Scenario: Usuario sin sesión activa ve el control de inicio de sesión
      Given el usuario no tiene una sesión activa
      When el sistema muestra la pantalla principal
      Then el sistema debe mostrar el botón "Iniciar sesión"
      And el sistema no debe mostrar el perfil del usuario

    Scenario: Usuario con sesión activa ve su perfil y no ve el botón de login
      Given el usuario tiene una sesión activa
      When el sistema muestra la pantalla principal
      Then el sistema no debe mostrar el botón "Iniciar sesión"
      And el sistema debe mostrar el perfil del usuario autenticado