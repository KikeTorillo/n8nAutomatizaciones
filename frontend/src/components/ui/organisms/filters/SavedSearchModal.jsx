import { useState } from 'react';
import { Star, X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SavedSearchModal - Modal para guardar búsqueda actual
 *
 * @param {boolean} isOpen - Estado del modal
 * @param {Function} onClose - Callback para cerrar
 * @param {Object} filtrosActuales - Filtros a guardar
 * @param {Function} onSave - Callback tras guardar exitosamente
 * @param {Function} existeNombre - Función para verificar si existe el nombre
 */
export function SavedSearchModal({
  isOpen,
  onClose,
  filtrosActuales,
  onSave,
  existeNombre,
}) {
  const [nombre, setNombre] = useState('');
  const [esDefault, setEsDefault] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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
    setNombre('');
    setEsDefault(false);
    setError('');
    onClose?.();
  };

  const handleClose = () => {
    setNombre('');
    setEsDefault(false);
    setError('');
    onClose?.();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
          'w-full max-w-md mx-4'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          className={cn(
            'bg-white dark:bg-gray-800 rounded-xl shadow-xl',
            'border border-gray-200 dark:border-gray-700'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              Guardar búsqueda
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                'p-2 rounded-lg transition-colors',
                'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                'hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-4 space-y-4">
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
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  'text-gray-700 dark:text-gray-300',
                  'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  'bg-primary-600 text-white',
                  'hover:bg-primary-700',
                  'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                )}
              >
                <Save className="h-4 w-4" />
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default SavedSearchModal;
