import { driver, type DriveStep } from 'driver.js';

export interface ProfileEditTourOptions {
  isWorker: boolean;
  isClient: boolean;
}

/** Pasos del tour guiado del modal «Editar perfil». */
export function startProfileEditTour(options: ProfileEditTourOptions): { destroy: () => void } {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="profile-edit-intro"]',
      popover: {
        title: 'Editar tu perfil',
        description:
          'Este recorrido explica cada campo editable. Puedes cerrarlo cuando quieras; no se guardará nada hasta que pulses «Guardar cambios».',
      },
    },
    {
      element: '[data-tour="profile-edit-display-name"]',
      popover: {
        title: 'Nombre visible',
        description:
          'Es el nombre que verán otros usuarios en tu perfil y propuestas. Puede ser distinto de tu nombre legal.',
      },
    },
    {
      element: '[data-tour="profile-edit-country"]',
      popover: {
        title: 'País',
        description:
          'Se define al registrarte y no se puede cambiar. Determina los departamentos y municipios disponibles.',
      },
    },
    {
      element: '[data-tour="profile-edit-city"]',
      popover: {
        title: 'Departamento / provincia',
        description: 'Selecciona tu departamento o provincia dentro del país de tu cuenta.',
      },
    },
    {
      element: '[data-tour="profile-edit-municipality"]',
      popover: {
        title: 'Municipio / ciudad',
        description: 'Elige el municipio o ciudad donde trabajas o publicas solicitudes.',
      },
    },
    {
      element: '[data-tour="profile-edit-area"]',
      popover: {
        title: 'Barrio',
        description: 'Indica tu barrio o zona (por ejemplo «El Poblado»). Ayuda a ubicarte con más precisión.',
      },
    },
  ];

  if (options.isWorker) {
    steps.push(
      {
        element: '[data-tour="profile-edit-categories"]',
        popover: {
          title: 'Categorías de servicio',
          description:
            'Elige al menos una categoría que describa los trabajos que ofreces (limpieza, reparaciones, etc.).',
        },
      },
      {
        element: '[data-tour="profile-edit-headline"]',
        popover: {
          title: 'Titular / encabezado',
          description:
            'Frase corta bajo tu nombre en el perfil público. Ejemplo: «Electricista certificado · 10 años de experiencia».',
        },
      },
      {
        element: '[data-tour="profile-edit-bio"]',
        popover: {
          title: 'Descripción / biografía',
          description:
            'Texto más amplio sobre tu experiencia, servicios y disponibilidad. Aparece en tu perfil público.',
        },
      },
      {
        element: '[data-tour="profile-edit-coverage"]',
        popover: {
          title: 'Radio de cobertura',
          description: 'Opcional. Distancia aproximada en kilómetros desde tu zona en la que puedes atender trabajos.',
        },
      },
    );
  }

  if (options.isClient) {
    steps.push({
      element: '[data-tour="profile-edit-payment"]',
      popover: {
        title: 'Método de pago preferido',
        description: 'Indica cómo sueles pagar los servicios. Ayuda a alinear expectativas con los trabajadores.',
      },
    });
  }

  steps.push({
    element: '[data-tour="profile-edit-save"]',
    popover: {
      title: 'Guardar cambios',
      description:
        'Cuando termines, pulsa aquí para aplicar los cambios a tu perfil público. Puedes cancelar si no quieres guardar.',
    },
  });

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayOpacity: 0.55,
    nextBtnText: 'Siguiente',
    prevBtnText: 'Anterior',
    doneBtnText: 'Listo',
    steps,
  });

  driverObj.drive();
  return { destroy: () => driverObj.destroy() };
}
