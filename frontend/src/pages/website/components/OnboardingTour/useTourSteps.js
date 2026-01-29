/**
 * ====================================================================
 * USE TOUR STEPS HOOK
 * ====================================================================
 * Definición de los pasos del tour interactivo del editor.
 * Cada paso guía al usuario a través de las funcionalidades principales.
 */

import { useMemo } from 'react';

/**
 * Selectores CSS para los elementos del tour
 * Estos deben coincidir con los elementos en WebsiteEditorPage
 */
const TOUR_SELECTORS = {
  PALETTE: '[data-tour="block-palette"]',
  CANVAS: '[data-tour="editor-canvas"]',
  PROPERTIES: '[data-tour="properties-panel"]',
  BREAKPOINTS: '[data-tour="breakpoint-selector"]',
  PUBLISH: '[data-tour="publish-button"]',
};

/**
 * Hook que retorna los pasos del tour configurados para driver.js
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.isMobile - Si está en dispositivo móvil
 * @returns {Array} Array de pasos del tour
 */
export function useTourSteps({ isMobile = false } = {}) {
  const steps = useMemo(() => {
    const baseSteps = [
      {
        element: TOUR_SELECTORS.PALETTE,
        popover: {
          title: 'Paleta de Bloques',
          description: isMobile
            ? 'Toca el botón + para ver los bloques disponibles. Selecciona uno para agregarlo a tu página.'
            : 'Arrastra bloques desde aquí para construir tu sitio. Cada bloque tiene un propósito específico.',
          side: isMobile ? 'bottom' : 'right',
          align: 'start',
        },
      },
      {
        element: TOUR_SELECTORS.CANVAS,
        popover: {
          title: 'Canvas del Editor',
          description: 'Tu sitio se visualiza aquí en tiempo real. Haz clic en cualquier bloque para seleccionarlo y editarlo.',
          side: 'left',
          align: 'center',
        },
      },
      {
        element: TOUR_SELECTORS.PROPERTIES,
        popover: {
          title: 'Panel de Propiedades',
          description: isMobile
            ? 'Al seleccionar un bloque, aparecerá este panel para personalizar su contenido, colores y estilos.'
            : 'Personaliza cada bloque seleccionado. Edita textos, colores, imágenes y más desde este panel.',
          side: 'left',
          align: 'start',
        },
      },
      {
        element: TOUR_SELECTORS.BREAKPOINTS,
        popover: {
          title: 'Vista Responsive',
          description: 'Previsualiza cómo se verá tu sitio en desktop, tablet y móvil. Asegúrate de que luzca bien en todos los dispositivos.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: TOUR_SELECTORS.PUBLISH,
        popover: {
          title: 'Publicar tu Sitio',
          description: 'Cuando estés listo, haz clic aquí para publicar tu sitio y hacerlo visible al mundo.',
          side: 'bottom',
          align: 'end',
        },
      },
    ];

    return baseSteps;
  }, [isMobile]);

  return steps;
}

export { TOUR_SELECTORS };
export default useTourSteps;
