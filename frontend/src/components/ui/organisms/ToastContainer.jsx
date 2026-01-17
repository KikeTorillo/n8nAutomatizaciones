import { Toast } from '@/components/ui';
import { useToast } from '@/hooks/useToast';

/**
 * Contenedor de toasts posicionado en la esquina superior derecha
 * Renderiza todos los toasts activos del sistema
 */
function ToastContainer() {
  const { toasts, remove } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={remove}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
