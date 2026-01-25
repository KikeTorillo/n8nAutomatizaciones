import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Button } from '../../atoms/Button';

/**
 * FormFooter - Footer con botones de acción para formularios
 *
 * @param {string} submitLabel - Texto del botón principal
 * @param {string} cancelLabel - Texto del botón cancelar
 * @param {function} onCancel - Handler para cancelar
 * @param {boolean} showPreviousButton - Mostrar botón anterior (wizard)
 * @param {function} onPrevious - Handler para anterior
 * @param {string} previousLabel - Texto del botón anterior
 * @param {boolean} showNextButton - Mostrar botón siguiente (wizard)
 * @param {function} onNext - Handler para siguiente
 * @param {string} nextLabel - Texto del botón siguiente
 * @param {boolean} isSubmitting - Estado de envío
 * @param {boolean} isDisabled - Deshabilitar botón principal
 * @param {string} className - Clases adicionales
 */
const FormFooter = memo(function FormFooter({
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  onCancel,
  showPreviousButton = false,
  onPrevious,
  previousLabel = 'Anterior',
  showNextButton = false,
  onNext,
  nextLabel = 'Siguiente',
  isSubmitting = false,
  isDisabled = false,
  sticky = false,
  className,
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 pt-6',
        'border-t border-gray-200 dark:border-gray-700 mt-6',
        sticky && 'sticky bottom-0 bg-white dark:bg-gray-900 pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6',
        className
      )}
    >
      {/* Lado izquierdo */}
      <div className="flex items-center gap-3">
        {showPreviousButton && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isSubmitting}
          >
            {previousLabel}
          </Button>
        )}
      </div>

      {/* Lado derecho */}
      <div className="flex items-center gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
        )}

        {showNextButton ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={isSubmitting || isDisabled}
            isLoading={isSubmitting}
          >
            {nextLabel}
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting || isDisabled}
            isLoading={isSubmitting}
          >
            {submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
});

FormFooter.displayName = 'FormFooter';

FormFooter.propTypes = {
  submitLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onCancel: PropTypes.func,
  showPreviousButton: PropTypes.bool,
  onPrevious: PropTypes.func,
  previousLabel: PropTypes.string,
  showNextButton: PropTypes.bool,
  onNext: PropTypes.func,
  nextLabel: PropTypes.string,
  isSubmitting: PropTypes.bool,
  isDisabled: PropTypes.bool,
  sticky: PropTypes.bool,
  className: PropTypes.string,
};

export { FormFooter };
