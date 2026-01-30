import { useState, memo } from 'react';
import PropTypes from 'prop-types';
import { Star, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '../Modal';
import { Button } from '../../atoms/Button';

/**
 * SavedSearchModal - Modal para guardar búsqueda actual
 * Ene 2026: Refactorizado para usar componente Modal centralizado
 *
 * @param {boolean} isOpen - Estado del modal
 * @param {Function} onClose - Callback para cerrar
 * @param {Object} filtrosActuales - Filtros a guardar
 * @param {Function} onSave - Callback tras guardar exitosamente
 * @param {Function} existeNombre - Función para verificar si existe el nombre
 */
export const SavedSearchModal = memo(function SavedSearchModal({
  isOpen,
  onClose,
  filtrosActuales,
  onSave,
  existeNombre,
}) {
  const [nombre, setNombre] = useState('');
  const [esDefault, setEsDefault] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones
    const nombreTrimmed = nombre.trim();
    if (!nombreTrimmed) {
      setError('El nombre es requerido');
      return;
    }

    if (nombreTrimmed.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (existeNombre?.(nombreTrimmed)) {
      setError('Ya existe una búsqueda con este nombre');
      return;
    }

    // Guardar
    onSave?.(nombreTrimmed, esDefault);

    // Limpiar y cerrar
    handleClose();
  };

  const handleClose = () => {
    setNombre('');
    setEsDefault(false);
    setError('');
    onClose?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Guardar búsqueda"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!nombre.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo nombre */}
        <div className="space-y-1.5">
          <label
            htmlFor="search-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Nombre de la búsqueda
          </label>
          <input
            type="text"
            id="search-name"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setError('');
            }}
            placeholder="Ej: Productos activos con stock bajo"
            className={cn(
              'w-full px-3 py-2.5 text-sm rounded-lg border',
              'bg-white dark:bg-gray-700',
              error
                ? 'border-red-500 dark:border-red-400'
                : 'border-gray-300 dark:border-gray-600',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-400 dark:placeholder-gray-500',
              'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'dark:focus:ring-primary-400 dark:focus:border-primary-400'
            )}
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Checkbox default */}
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={esDefault}
            onChange={(e) => setEsDefault(e.target.checked)}
            className={cn(
              'h-4 w-4 rounded border-gray-300 dark:border-gray-600',
              'text-primary-600 focus:ring-primary-500',
              'dark:bg-gray-700'
            )}
          />
          <Star
            className={cn(
              'h-4 w-4',
              esDefault
                ? 'text-yellow-500 fill-current'
                : 'text-gray-400 dark:text-gray-500'
            )}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Usar como búsqueda predeterminada
          </span>
        </label>

        {/* Preview de filtros */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Filtros a guardar:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(filtrosActuales || {})
              .filter(
                ([, value]) =>
                  value !== '' &&
                  value !== null &&
                  value !== undefined &&
                  value !== false
              )
              .map(([key, value]) => (
                <span
                  key={key}
                  className={cn(
                    'inline-flex px-2 py-0.5 text-xs rounded-full',
                    'bg-primary-100 text-primary-700',
                    'dark:bg-primary-900/40 dark:text-primary-300'
                  )}
                >
                  {key}: {String(value)}
                </span>
              ))}
          </div>
        </div>
      </form>
    </Modal>
  );
});

SavedSearchModal.displayName = 'SavedSearchModal';

SavedSearchModal.propTypes = {
  /** Estado del modal (abierto/cerrado) */
  isOpen: PropTypes.bool.isRequired,
  /** Callback para cerrar el modal */
  onClose: PropTypes.func.isRequired,
  /** Objeto con los filtros actuales a guardar */
  filtrosActuales: PropTypes.object,
  /** Callback tras guardar exitosamente (nombre, esDefault) => void */
  onSave: PropTypes.func,
  /** Función para verificar si ya existe una búsqueda con el nombre dado */
  existeNombre: PropTypes.func,
};

export default SavedSearchModal;
