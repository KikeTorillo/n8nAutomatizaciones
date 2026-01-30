import { useState, useRef } from 'react';
import { UserCircle, Search, X, Plus, Check } from 'lucide-react';
import { useBuscarClientes, useCrearCliente } from '@/hooks/personas';
import { useDebounce, useClickOutsideRef } from '@/hooks/utils';
import { Button, Input } from '@/components/ui';

/**
 * ClienteSelector - Selector de cliente para POS
 * Nov 2025: Componente para asociar cliente a ventas POS
 *
 * Características:
 * - Búsqueda por nombre/teléfono
 * - Crear cliente rápido inline
 * - Opción "Venta sin cliente" (default)
 *
 * @param {Object} props
 * @param {Object|null} props.value - Cliente seleccionado ({ id, nombre, telefono })
 * @param {Function} props.onChange - Callback cuando cambia la selección
 * @param {string} props.placeholder - Texto placeholder
 * @param {boolean} props.disabled - Deshabilitado
 */
export default function ClienteSelector({
  value = null,
  onChange,
  placeholder = 'Cliente (opcional)',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCliente, setNewCliente] = useState({ nombre: '', telefono: '' });
  const dropdownRef = useRef(null);

  // Debounce del término de búsqueda para evitar requests excesivos
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Búsqueda de clientes
  const { data: clientes, isLoading: searching } = useBuscarClientes(debouncedSearchTerm, {
    tipo: 'nombre',
    limit: 5,
  });

  // Mutación para crear cliente
  const crearCliente = useCrearCliente();

  // Cerrar dropdown al hacer clic fuera (hook centralizado)
  useClickOutsideRef(dropdownRef, () => {
    setIsOpen(false);
    setShowCreateForm(false);
  }, isOpen);

  // Seleccionar cliente
  const handleSelect = (cliente) => {
    onChange({
      id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
    });
    setIsOpen(false);
    setSearchTerm('');
    setShowCreateForm(false);
  };

  // Limpiar selección
  const handleClear = () => {
    onChange(null);
  };

  // Crear cliente rápido
  const handleCreateCliente = async (e) => {
    e.preventDefault();
    if (!newCliente.nombre.trim()) return;

    try {
      const cliente = await crearCliente.mutateAsync({
        nombre: newCliente.nombre.trim(),
        telefono: newCliente.telefono.trim() || undefined,
        como_conocio: 'pos',
      });

      handleSelect(cliente);
      setNewCliente({ nombre: '', telefono: '' });
    } catch {
      // Error manejado por el hook
    }
  };

  // Si hay cliente seleccionado, mostrar badge
  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 rounded-lg">
        <UserCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-cyan-900 dark:text-cyan-300 truncate">{value.nombre}</p>
          {value.telefono && (
            <p className="text-xs text-cyan-600 dark:text-cyan-400 truncate">{value.telefono}</p>
          )}
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-cyan-500 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input de búsqueda */}
      <div
        className={`relative cursor-pointer ${disabled ? 'opacity-50' : ''}`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
          <UserCircle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <span className="text-gray-500 dark:text-gray-400 text-sm">{placeholder}</span>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Lista de resultados */}
          <div className="max-h-48 overflow-y-auto">
            {searching && (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                Buscando...
              </div>
            )}

            {!searching && searchTerm.length >= 2 && clientes?.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                No se encontraron clientes
              </div>
            )}

            {!searching && clientes?.map((cliente) => (
              <button
                key={cliente.id}
                type="button"
                onClick={() => handleSelect(cliente)}
                className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <UserCircle className="w-8 h-8 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {cliente.nombre}
                  </p>
                  {cliente.telefono && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{cliente.telefono}</p>
                  )}
                </div>
                <Check className="w-4 h-4 text-cyan-500 dark:text-cyan-400 opacity-0 group-hover:opacity-100" />
              </button>
            ))}

            {searchTerm.length < 2 && !showCreateForm && (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                Escribe al menos 2 caracteres para buscar
              </div>
            )}
          </div>

          {/* Formulario para crear cliente rápido */}
          {showCreateForm ? (
            <form onSubmit={handleCreateCliente} className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Nombre del cliente *"
                  value={newCliente.nombre}
                  onChange={(e) => setNewCliente({ ...newCliente, nombre: e.target.value })}
                  className="text-sm"
                  required
                />
                <Input
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  value={newCliente.telefono}
                  onChange={(e) => setNewCliente({ ...newCliente, telefono: e.target.value })}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="flex-1"
                    isLoading={crearCliente.isPending}
                    disabled={!newCliente.nombre.trim()}
                  >
                    Crear
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="w-full px-3 py-2 flex items-center justify-center gap-2 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Crear cliente nuevo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
