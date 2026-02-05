import { FormDrawer } from '@/components/ui';

/**
 * @deprecated Usar FormDrawer directamente.
 * Wrapper de compatibilidad que delega a FormDrawer.
 */
function ConfigCrudDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  onSubmit,
  isLoading = false,
  submitLabel,
  cancelLabel = 'Cancelar',
  isEditing = false,
  children,
}) {
  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      onSubmit={onSubmit}
      isSubmitting={isLoading}
      submitLabel={submitLabel}
      cancelLabel={cancelLabel}
      mode={isEditing ? 'edit' : 'create'}
    >
      {children}
    </FormDrawer>
  );
}

export default ConfigCrudDrawer;
