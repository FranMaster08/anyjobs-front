import { driver } from 'driver.js';

/** Pasos del tour guiado para la pantalla "Publicar solicitud". */
export function startPublishRequestTour(): { destroy: () => void } {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayOpacity: 0.55,
    nextBtnText: 'Siguiente',
    prevBtnText: 'Anterior',
    doneBtnText: 'Listo',
    steps: [
      {
        element: '[data-tour="publish-help-intro"]',
        popover: {
          title: 'Publicar una solicitud',
          description:
            'Este recorrido te muestra cómo completar cada sección. Puedes cerrarlo en cualquier momento; no se enviará ni borrará lo que ya escribiste.',
        },
      },
      {
        element: '[data-tour="publish-title"]',
        popover: {
          title: 'Título',
          description:
            'Escribe un título claro y específico, por ejemplo «Limpieza profunda de piso».',
        },
      },
      {
        element: '[data-tour="publish-excerpt"]',
        popover: {
          title: 'Resumen corto',
          description: 'Una sola línea que aparecerá en la tarjeta de la solicitud (máx. 160 caracteres).',
        },
      },
      {
        element: '[data-tour="publish-description"]',
        popover: {
          title: 'Descripción',
          description: 'Detalla el trabajo: alcance, horarios, materiales y cualquier condición importante.',
        },
      },
      {
        element: '[data-tour="publish-tags"]',
        popover: {
          title: 'Etiquetas',
          description: 'Separa con comas las categorías del trabajo, por ejemplo: Limpieza, Plomería.',
        },
      },
      {
        element: '[data-tour="publish-location"]',
        popover: {
          title: 'Ubicación',
          description:
            'Elige país, departamento o provincia y municipio. El barrio es opcional y puedes escribirlo libremente.',
        },
      },
      {
        element: '[data-tour="publish-budget"]',
        popover: {
          title: 'Presupuesto',
          description:
            'Indica tu presupuesto orientativo en la moneda del país elegido (por ejemplo «$120.000» en Colombia o «$60.000» en Argentina).',
        },
      },
      {
        element: '[data-tour="publish-work-conditions"]',
        popover: {
          title: 'Condiciones y recursos',
          description:
            'Opcional: indica herramientas, traslado, materiales y expectativas para que quien postule entienda mejor el trabajo.',
        },
      },
      {
        element: '[data-tour="publish-images"]',
        popover: {
          title: 'Contenido multimedia',
          description:
            'Debes adjuntar al menos un archivo (hasta 6) para que los proveedores entiendan mejor el trabajo.',
        },
      },
      {
        element: '[data-tour="publish-submit"]',
        popover: {
          title: 'Publicar',
          description:
            'Cuando todo esté completo, pulsa «Publicar solicitud». Tu email y teléfono se tomarán de tu cuenta.',
        },
      },
    ],
  });

  driverObj.drive();
  return { destroy: () => driverObj.destroy() };
}
