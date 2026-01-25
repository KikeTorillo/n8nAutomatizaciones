import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { FormHeader } from './FormHeader';
import { FormWizardStepper } from './FormWizardStepper';
import { FormFooter } from './FormFooter';
import { LoadingSpinner } from '../../atoms/LoadingSpinner';

/**
 * BaseFormLayout - Template para páginas de formulario
 *
 * Layout estandarizado para páginas de formulario/wizard con:
 * - Header con navegación y título
 * - Stepper opcional para wizards
 * - Footer con botones de acción
 * - Estados de carga
 *
 * @example
 * // Formulario simple
 * <BaseFormLayout
 *   title="Nuevo Cliente"
 *   subtitle="Completa los datos del cliente"
 *   backTo="/clientes"
 *   onSubmit={handleSubmit}
 *   onCancel={() => navigate('/clientes')}
 *   isSubmitting={mutation.isPending}
 * >
 *   <FormGroup label="Nombre" error={errors.nombre?.message}>
 *     <Input {...register('nombre')} />
 *   </FormGroup>
 * </BaseFormLayout>
 *
 * @example
 * // Wizard multi-paso
 * <BaseFormLayout
 *   title="Nuevo Profesional"
 *   backTo="/profesionales"
 *   steps={WIZARD_STEPS}
 *   activeStep={currentStep}
 *   completedSteps={completedSteps}
 *   onStepChange={setCurrentStep}
 *   onSubmit={handleSubmit}
 *   onPrevious={handlePrevious}
 *   showPreviousButton={currentStep > 0}
 *   showNextButton={currentStep < WIZARD_STEPS.length - 1}
 *   onNext={handleNext}
 *   isSubmitting={mutation.isPending}
 * >
 *   {currentStep === 0 && <DatosPersonalesStep />}
 *   {currentStep === 1 && <ExperienciaStep />}
 *   {currentStep === 2 && <ResumenStep />}
 * </BaseFormLayout>
 */
const BaseFormLayout = memo(function BaseFormLayout({
  // Header
  title,
  subtitle,
  icon,
  backTo,
  backLabel,
  // Wizard
  steps,
  activeStep = 0,
  completedSteps = new Set(),
  onStepChange,
  allowStepNavigation = false,
  // Form
  onSubmit,
  children,
  maxWidth = 'max-w-4xl',
  // Footer
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
  // States
  isSubmitting = false,
  isLoading = false,
  isDisabled = false,
  // Styling
  className,
}) {
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

  const handleFormSubmit = (e) => {
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

BaseFormLayout.propTypes = {
  /** Título de la página */
  title: PropTypes.string,
  /** Subtítulo */
  subtitle: PropTypes.string,
  /** Icono (componente Lucide) */
  icon: PropTypes.elementType,
  /** Ruta para volver */
  backTo: PropTypes.string,
  /** Texto del botón volver */
  backLabel: PropTypes.string,
  /** Pasos del wizard */
  steps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
  })),
  /** Paso activo (0-based) */
  activeStep: PropTypes.number,
  /** IDs de pasos completados */
  completedSteps: PropTypes.oneOfType([
    PropTypes.instanceOf(Set),
    PropTypes.array,
  ]),
  /** Callback cuando cambia el paso */
  onStepChange: PropTypes.func,
  /** Permitir navegación en stepper */
  allowStepNavigation: PropTypes.bool,
  /** Handler de submit */
  onSubmit: PropTypes.func,
  /** Contenido del formulario */
  children: PropTypes.node,
  /** Ancho máximo */
  maxWidth: PropTypes.string,
  /** Texto del botón submit */
  submitLabel: PropTypes.string,
  /** Texto del botón cancelar */
  cancelLabel: PropTypes.string,
  /** Handler cancelar */
  onCancel: PropTypes.func,
  /** Mostrar botón anterior */
  showPreviousButton: PropTypes.bool,
  /** Handler anterior */
  onPrevious: PropTypes.func,
  /** Texto botón anterior */
  previousLabel: PropTypes.string,
  /** Mostrar botón siguiente */
  showNextButton: PropTypes.bool,
  /** Handler siguiente */
  onNext: PropTypes.func,
  /** Texto botón siguiente */
  nextLabel: PropTypes.string,
  /** Footer sticky */
  stickyFooter: PropTypes.bool,
  /** Ocultar footer */
  hideFooter: PropTypes.bool,
  /** Estado enviando */
  isSubmitting: PropTypes.bool,
  /** Estado cargando */
  isLoading: PropTypes.bool,
  /** Deshabilitar submit */
  isDisabled: PropTypes.bool,
  /** Clases adicionales */
  className: PropTypes.string,
};

export { BaseFormLayout };
