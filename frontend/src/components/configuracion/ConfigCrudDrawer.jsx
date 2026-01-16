import { Loader2 } from 'lucide-react';
import { Button, Drawer } from '@/components/ui';

/**
 * Drawer genérico para formularios CRUD en páginas de configuración
 * Wrapper que estandariza estructura y botones de acción
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el drawer está abierto
 * @param {function} props.onClose - Handler para cerrar
 * @param {string} props.title - Título del drawer
 * @param {string} [props.subtitle] - Subtítulo descriptivo
 * @param {function} props.onSubmit - Handler del submit (handleSubmit(onSubmit))
 * @param {boolean} [props.isLoading=false] - Si está procesando
 * @param {string} [props.submitLabel="Guardar"] - Label del botón submit
 * @param {string} [props.cancelLabel="Cancelar"] - Label del botón cancelar
 * @param {boolean} [props.isEditing=false] - Si es modo edición (cambia label)
 * @param {React.ReactNode} props.children - Contenido del formulario (inputs)
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
  // Label por defecto basado en modo
  const defaultSubmitLabel = isEditing ? 'Actualizar' : 'Crear';
  const finalSubmitLabel = submitLabel || defaultSubmitLabel;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {children}

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              finalSubmitLabel
            )}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default ConfigCrudDrawer;
