import { memo, type ReactNode, type FormEvent } from 'react';
import { cn } from '@/lib/utils';
import { FormHeader } from './FormHeader';
import { FormWizardStepper, type WizardStep } from './FormWizardStepper';
import { FormFooter } from './FormFooter';
import { LoadingSpinner } from '../../atoms/LoadingSpinner';

type LucideIcon = React.ComponentType<{ className?: string }>;

interface BaseFormLayoutProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  backTo?: string;
  backLabel?: string;
  steps?: WizardStep[];
  activeStep?: number;
  completedSteps?: Set<string> | string[];
  onStepChange?: (index: number) => void;
  allowStepNavigation?: boolean;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  children?: ReactNode;
  maxWidth?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  showPreviousButton?: boolean;
  onPrevious?: () => void;
  previousLabel?: string;
  showNextButton?: boolean;
  onNext?: () => void;
  nextLabel?: string;
  stickyFooter?: boolean;
  hideFooter?: boolean;
  isSubmitting?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
}

const BaseFormLayout = memo(function BaseFormLayout({
  title,
  subtitle,
  icon,
  backTo,
  backLabel,
  steps,
  activeStep = 0,
  completedSteps = new Set<string>(),
  onStepChange,
  allowStepNavigation = false,
  onSubmit,
  children,
  maxWidth = 'max-w-4xl',
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  onCancel,
  showPreviousButton = false,
  onPrevious,
  previousLabel,
  showNextButton = false,
  onNext,
  nextLabel,
  stickyFooter = false,
  hideFooter = false,
  isSubmitting = false,
  isLoading = false,
  isDisabled = false,
  className,
}: BaseFormLayoutProps) {
  // Estado de carga inicial
  if (isLoading) {
    return (
      <div className={cn('mx-auto px-4 sm:px-6 lg:px-8 py-6', maxWidth, className)}>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSubmitting && !isDisabled) {
      onSubmit?.(e);
    }
  };

  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8 py-6', maxWidth, className)}>
      {/* Header */}
      {(title || backTo) && (
        <FormHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          backTo={backTo}
          backLabel={backLabel}
        />
      )}

      {/* Wizard stepper */}
      {steps && steps.length > 0 && (
        <FormWizardStepper
          steps={steps}
          activeStep={activeStep}
          completedSteps={completedSteps}
          onStepChange={onStepChange}
          allowNavigation={allowStepNavigation}
        />
      )}

      {/* Form */}
      <form onSubmit={handleFormSubmit}>
        {/* Card container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            {children}
          </div>

          {/* Footer */}
          {!hideFooter && (
            <div className="px-6 pb-6">
              <FormFooter
                submitLabel={submitLabel}
                cancelLabel={cancelLabel}
                onCancel={onCancel}
                showPreviousButton={showPreviousButton}
                onPrevious={onPrevious}
                previousLabel={previousLabel}
                showNextButton={showNextButton}
                onNext={onNext}
                nextLabel={nextLabel}
                isSubmitting={isSubmitting}
                isDisabled={isDisabled}
                sticky={stickyFooter}
              />
            </div>
          )}
        </div>
      </form>
    </div>
  );
});

BaseFormLayout.displayName = 'BaseFormLayout';

export { BaseFormLayout };
