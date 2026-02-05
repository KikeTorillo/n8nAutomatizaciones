import { memo } from 'react';
import { Toast } from '@/components/ui';
import { useToast } from '@/hooks/utils';
import type { ToastType } from '@/types/ui';

/** Interface para un toast individual */
interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

/** Interface para el hook useToast */
interface UseToastResult {
  toasts: ToastItem[];
  remove: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

/**
 * Contenedor de toasts posicionado en la esquina superior derecha
 * Renderiza todos los toasts activos del sistema
 *
 * Memoizado para evitar re-renders innecesarios cuando cambian
 * estados no relacionados en componentes padre.
 */
const ToastContainer = memo(function ToastContainer() {
  const { toasts, remove } = useToast() as UseToastResult;

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
});

ToastContainer.displayName = 'ToastContainer';

/** Props exportadas (vacías pero para consistencia) */
export interface ToastContainerProps {}

export { ToastContainer };
