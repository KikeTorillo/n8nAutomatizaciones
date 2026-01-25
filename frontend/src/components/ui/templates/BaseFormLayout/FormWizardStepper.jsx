import { memo } from 'react';
import PropTypes from 'prop-types';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * FormWizardStepper - Indicador de pasos para formularios wizard
 *
 * @param {Array} steps - Array de pasos [{id, label, description?}]
 * @param {number} activeStep - Índice del paso activo (0-based)
 * @param {Set|Array} completedSteps - IDs de pasos completados
 * @param {function} onStepChange - Callback (stepIndex) => void
 * @param {boolean} allowNavigation - Permitir click en pasos
 * @param {string} className - Clases adicionales
 */
const FormWizardStepper = memo(function FormWizardStepper({
  steps = [],
  activeStep = 0,
  completedSteps = new Set(),
  onStepChange,
  allowNavigation = false,
  className,
}) {
  const completedSet = completedSteps instanceof Set
    ? completedSteps
    : new Set(completedSteps);

  const handleStepClick = (index) => {
    if (allowNavigation && onStepChange) {
      onStepChange(index);
    }
  };

  return (
    <nav aria-label="Progreso" className={cn('mb-8', className)}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = completedSet.has(step.id) || index < activeStep;
          const isClickable = allowNavigation && (isCompleted || index <= activeStep);

          return (
            <li
              key={step.id}
              className={cn(
                'relative',
                index !== steps.length - 1 && 'pr-8 sm:pr-20 flex-1'
              )}
            >
              {/* Line connector */}
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-4 left-8 -right-4 sm:left-12 h-0.5',
                    isCompleted ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                  aria-hidden="true"
                />
              )}

              <button
                type="button"
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'relative flex items-center group',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default'
                )}
              >
                {/* Step circle */}
                <span
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors',
                    isCompleted && 'bg-primary-600 text-white',
                    isActive && !isCompleted && 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/30',
                    !isActive && !isCompleted && 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </span>

                {/* Step label */}
                <span className="ml-3 hidden sm:flex flex-col text-left min-w-0">
                  <span
                    className={cn(
                      'text-sm font-medium truncate',
                      (isActive || isCompleted)
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {step.description}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
});

FormWizardStepper.displayName = 'FormWizardStepper';

FormWizardStepper.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
  })).isRequired,
  activeStep: PropTypes.number,
  completedSteps: PropTypes.oneOfType([
    PropTypes.instanceOf(Set),
    PropTypes.array,
  ]),
  onStepChange: PropTypes.func,
  allowNavigation: PropTypes.bool,
  className: PropTypes.string,
};

export { FormWizardStepper };
