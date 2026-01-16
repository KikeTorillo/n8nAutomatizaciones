import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import Modal from './Modal';
import Button from '../atoms/Button';

/**
 * Componente de diálogo de confirmación
 * @param {boolean} isOpen - Estado del diálogo
 * @param {function} onClose - Callback para cerrar
 * @param {function} onConfirm - Callback al confirmar
 * @param {string} title - Título del diálogo
 * @param {string} message - Mensaje principal
 * @param {string} confirmText - Texto del botón confirmar (default: "Confirmar")
 * @param {string} cancelText - Texto del botón cancelar (default: "Cancelar")
 * @param {string} variant - Estilo visual: 'danger', 'warning', 'success', 'info' (default: 'warning')
 * @param {boolean} isLoading - Estado de carga del botón confirmar
 * @param {boolean} disabled - Deshabilitar botón confirmar (para validaciones externas)
 * @param {React.ReactNode} children - Contenido adicional (ej: alertas, textarea)
 * @param {string} size - Tamaño del modal: 'sm', 'md' (default: 'sm')
 */
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  isLoading = false,
  disabled = false,
  children,
  size = 'sm'
}) {
  const handleConfirm = () => {
    onConfirm();
  };

  // Configuración de variantes
  const variants = {
    danger: {
      icon: XCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      confirmButton: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-500'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      confirmButton: 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500'
    },
    info: {
      icon: Info,
      iconColor: 'text-primary-600 dark:text-primary-400',
      iconBg: 'bg-primary-100 dark:bg-primary-900/30',
      confirmButton: 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500'
    }
  };

  const config = variants[variant] || variants.warning;
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size} showCloseButton={false}>
      <div className={children ? '' : 'text-center'}>
        {/* Ícono */}
        <div className={`${children ? '' : 'mx-auto'} flex items-center justify-center h-12 w-12 rounded-full ${config.iconBg} mb-4`}>
          <Icon className={`h-6 w-6 ${config.iconColor}`} />
        </div>

        {/* Título */}
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>

        {/* Mensaje */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {message}
        </p>

        {/* Contenido adicional (children) */}
        {children && (
          <div className="mb-6">
            {children}
          </div>
        )}

        {/* Botones */}
        <div className={`flex gap-3 ${children ? 'justify-end pt-4 border-t border-gray-200 dark:border-gray-700' : 'justify-center'}`}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="px-6"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={isLoading || disabled}
            className={`px-6 ${config.confirmButton}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
