import { memo, forwardRef, type ReactNode } from 'react';
import { Drawer } from './Drawer';
import { Button } from '../atoms/Button';
import type { DrawerSize } from './Drawer';

export interface FormDrawerProps {
  /** Estado del drawer (abierto/cerrado) */
  isOpen: boolean;
  /** Callback para cerrar el drawer */
  onClose: () => void;
  /** Tamaño del drawer */
  size?: DrawerSize;
  /** Desactivar padding del contenido */
  noPadding?: boolean;

  /** Título manual (prioridad sobre auto-generado) */
  title?: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Nombre de la entidad para auto-generar título */
  entityName?: string;
  /** Modo del formulario */
  mode?: 'create' | 'edit';

  /** Handler del submit del form */
  onSubmit: (e: React.FormEvent) => void;
  /** Estado de envío */
  isSubmitting?: boolean;
  /** Label del botón submit (override) */
  submitLabel?: string;
  /** Label del botón cancelar */
  cancelLabel?: string;

  /** Ocultar footer default */
  hideFooter?: boolean;
  /** Footer custom (reemplaza el default) */
  footer?: ReactNode;
  /** Contenido antes del form (preview, etc.) */
  header?: ReactNode;

  children: ReactNode;
}

/**
 * FormDrawer - Drawer con form integrado y footer de botones estándar
 *
 * Compone Drawer + form + footer con Cancelar/Submit.
 * Si se pasa `entityName` + `mode`, auto-genera el título.
 */
const FormDrawer = memo(forwardRef<HTMLDivElement, FormDrawerProps>(function FormDrawer(
  {
    isOpen,
    onClose,
    size = 'xl',
    noPadding = false,
    title,
    subtitle,
    entityName,
    mode = 'create',
    onSubmit,
    isSubmitting = false,
    submitLabel,
    cancelLabel = 'Cancelar',
    hideFooter = false,
    footer,
    header,
    children,
  },
  ref
) {
  // Auto-generar título si no se pasa uno explícito
  const resolvedTitle = title ?? (entityName
    ? (mode === 'edit' ? `Editar ${entityName}` : `Nuevo/a ${entityName}`)
    : undefined
  );

  // Label del botón submit
  const resolvedSubmitLabel = submitLabel ?? (mode === 'edit' ? 'Actualizar' : 'Crear');

  // Footer por defecto
  const defaultFooter = !hideFooter && (
    <div className="flex gap-3">
      <Button
        type="button"
        variant="secondary"
        className="flex-1"
        onClick={onClose}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        className="flex-1"
        isLoading={isSubmitting}
        disabled={isSubmitting}
      >
        {resolvedSubmitLabel}
      </Button>
    </div>
  );

  return (
    <Drawer
      ref={ref}
      isOpen={isOpen}
      onClose={onClose}
      title={resolvedTitle}
      subtitle={subtitle}
      size={size}
      noPadding={noPadding}
      disableClose={isSubmitting}
    >
      {header}
      <form onSubmit={onSubmit} className="flex flex-col h-full">
        <div className="flex-1 space-y-4">
          {children}
        </div>
        {footer ?? defaultFooter}
      </form>
    </Drawer>
  );
}));

FormDrawer.displayName = 'FormDrawer';

export { FormDrawer };
