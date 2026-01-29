/**
 * ====================================================================
 * EDITOR TOUR COMPONENT
 * ====================================================================
 * Componente principal que maneja el tour interactivo usando driver.js.
 * Se muestra automáticamente en la primera visita del usuario.
 */

import { useEffect, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTourSteps } from './useTourSteps';
import { useTourState } from './useTourState';

/**
 * Estilos custom para el tour (tema Nexo)
 */
const TOUR_STYLES = `
  .driver-popover {
    background: linear-gradient(135deg, #753572 0%, #1F2937 100%) !important;
    border: none !important;
    border-radius: 12px !important;
    box-shadow: 0 25px 50px -12px rgba(117, 53, 114, 0.4) !important;
  }

  .driver-popover-title {
    color: #fff !important;
    font-weight: 600 !important;
    font-size: 1.1rem !important;
  }

  .driver-popover-description {
    color: rgba(255, 255, 255, 0.9) !important;
    font-size: 0.95rem !important;
    line-height: 1.5 !important;
  }

  .driver-popover-progress-text {
    color: rgba(255, 255, 255, 0.7) !important;
  }

  .driver-popover-navigation-btns {
    gap: 8px !important;
  }

  .driver-popover-prev-btn {
    background: rgba(255, 255, 255, 0.1) !important;
    color: #fff !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px !important;
    padding: 8px 16px !important;
    font-weight: 500 !important;
    transition: all 0.2s !important;
  }

  .driver-popover-prev-btn:hover {
    background: rgba(255, 255, 255, 0.2) !important;
  }

  .driver-popover-next-btn {
    background: #fff !important;
    color: #753572 !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 8px 20px !important;
    font-weight: 600 !important;
    transition: all 0.2s !important;
  }

  .driver-popover-next-btn:hover {
    background: rgba(255, 255, 255, 0.9) !important;
    transform: translateY(-1px) !important;
  }

  .driver-popover-close-btn {
    color: rgba(255, 255, 255, 0.7) !important;
  }

  .driver-popover-close-btn:hover {
    color: #fff !important;
  }

  .driver-popover-arrow-side-left {
    border-right-color: #753572 !important;
  }

  .driver-popover-arrow-side-right {
    border-left-color: #753572 !important;
  }

  .driver-popover-arrow-side-top {
    border-bottom-color: #753572 !important;
  }

  .driver-popover-arrow-side-bottom {
    border-top-color: #753572 !important;
  }
`;

/**
 * EditorTour - Componente que maneja el tour del editor
 *
 * @param {Object} props
 * @param {boolean} props.isReady - Si el editor está listo para mostrar el tour
 * @param {boolean} props.isMobile - Si está en dispositivo móvil
 * @param {Function} props.onComplete - Callback cuando se completa el tour
 * @param {Function} props.onSkip - Callback cuando se salta el tour
 */
function EditorTour({ isReady = false, isMobile = false, onComplete, onSkip }) {
  const { shouldShowTour, completeTour } = useTourState();
  const steps = useTourSteps({ isMobile });

  // Inyectar estilos custom
  useEffect(() => {
    const styleId = 'nexo-tour-styles';
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = TOUR_STYLES;
      document.head.appendChild(styleElement);
    }

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Handler cuando se completa o salta el tour
  const handleTourEnd = useCallback((wasCompleted = true) => {
    completeTour();
    if (wasCompleted) {
      onComplete?.();
    } else {
      onSkip?.();
    }
  }, [completeTour, onComplete, onSkip]);

  // Iniciar tour cuando está listo
  useEffect(() => {
    if (!isReady || !shouldShowTour) return;

    // Pequeño delay para asegurar que los elementos están renderizados
    const timeoutId = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        overlayColor: 'rgba(0, 0, 0, 0.7)',
        stagePadding: 10,
        stageRadius: 8,
        popoverOffset: 15,
        progressText: 'Paso {{current}} de {{total}}',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Comenzar',
        steps: steps,
        onDestroyStarted: () => {
          // Se llama cuando el usuario cierra o completa el tour
          if (driverObj.hasNextStep()) {
            // Si hay más pasos, el usuario saltó el tour
            handleTourEnd(false);
          } else {
            // Si no hay más pasos, el usuario completó el tour
            handleTourEnd(true);
          }
          driverObj.destroy();
        },
      });

      driverObj.drive();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isReady, shouldShowTour, steps, handleTourEnd]);

  // Este componente no renderiza nada visualmente
  // driver.js maneja todo el overlay
  return null;
}

export default EditorTour;
