import { memo, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../../atoms/Button';

interface FormFooterProps {
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  showPreviousButton?: boolean;
  onPrevious?: (e: MouseEvent<HTMLButtonElement>) => void;
  previousLabel?: string;
  showNextButton?: boolean;
  onNext?: (e: MouseEvent<HTMLButtonElement>) => void;
  nextLabel?: string;
  isSubmitting?: boolean;
  isDisabled?: boolean;
  sticky?: boolean;
  className?: string;
}

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
}: FormFooterProps) {
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPrevious?.(e);
            }}
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNext?.(e);
            }}
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

export { FormFooter };
