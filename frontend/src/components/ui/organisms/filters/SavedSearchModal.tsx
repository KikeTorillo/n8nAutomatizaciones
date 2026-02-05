import { useState, memo, type FormEvent, type ChangeEvent } from 'react';
import { Star, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '../Modal';
import { Button } from '../../atoms/Button';

/**
 * Props del componente SavedSearchModal
 */
export interface SavedSearchModalProps {
  /** Estado del modal (abierto/cerrado) */
  isOpen: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Objeto con los filtros actuales a guardar */
  filtrosActuales?: Record<string, unknown>;
  /** Callback tras guardar exitosamente (nombre, esDefault) => void */
  onSave?: (nombre: string, esDefault: boolean) => void;
  /** Función para verificar si ya existe una búsqueda con el nombre dado */
  existeNombre?: (nombre: string) => boolean;
}

/**
 * SavedSearchModal - Modal para guardar búsqueda actual
 * Ene 2026: Refactorizado para usar componente Modal centralizado
 */
const SavedSearchModal = memo(function SavedSearchModal({
  isOpen,
  onClose,
  filtrosActuales,
  onSave,
  existeNombre,
}: SavedSearchModalProps) {
  const [nombre, setNombre] = useState('');
  const [esDefault, setEsDefault] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setNombre('');
    setEsDefault(false);
    setError('');
    onClose?.();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
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

  const handleNombreChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNombre(e.target.value);
    setError('');
  };

  const handleDefaultChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEsDefault(e.target.checked);
  };

  // Filtrar valores activos para preview
  const filtrosActivos = Object.entries(filtrosActuales || {}).filter(
    ([, value]) =>
      value !== '' && value !== null && value !== undefined && value !== false
  );

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
          <Button onClick={() => handleSubmit({ preventDefault: () => {} } as FormEvent<HTMLFormElement>)} disabled={!nombre.trim()}>
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
            onChange={handleNombreChange}
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
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Checkbox default */}
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={esDefault}
            onChange={handleDefaultChange}
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
            {filtrosActivos.map(([key, value]) => (
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

export { SavedSearchModal };
export default SavedSearchModal;
