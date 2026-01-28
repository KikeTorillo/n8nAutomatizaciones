import { useState, memo } from 'react';
import { Search, User, Link2, X, UserCheck } from 'lucide-react';
import { useUsuariosDisponibles } from '@/hooks/personas';
import { useDebounce } from '@/hooks/utils';

/**
 * Selector de usuario para vincular a profesional
 * Busca usuarios que no están vinculados a ningún profesional
 */
function UsuarioSelector({ value, onChange, disabled = false }) {
  const [busqueda, setBusqueda] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedBusqueda = useDebounce(busqueda, 300);

  const { data: usuarios = [], isLoading } = useUsuariosDisponibles({
    busqueda: debouncedBusqueda,
    enabled: debouncedBusqueda.length >= 2 || !debouncedBusqueda,
  });

  // Buscar usuario seleccionado en la lista
  const usuarioSeleccionado = value ? usuarios.find((u) => u.id === value) : null;

  const handleSelect = (usuario) => {
    onChange(usuario.id);
    setBusqueda('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setBusqueda('');
  };

  // Filtrar resultados según búsqueda
  const resultados = busqueda.length >= 2
    ? usuarios.filter(
        (u) =>
          u.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
          u.nombre?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : usuarios;

  return (
    <div className="space-y-2">
      {value && usuarioSeleccionado ? (
        // Usuario seleccionado - mostrar tarjeta
        <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {usuarioSeleccionado.nombre || 'Usuario'}
                </span>
                <span className="text-xs bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded">
                  {usuarioSeleccionado.rol || 'Sin rol'}
                </span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {usuarioSeleccionado.email}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            title="Desvincular usuario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        // Buscador
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Buscar usuario por email o nombre..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-500
                focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
            />
          </div>

          {/* Dropdown de resultados */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2" />
                  Buscando usuarios...
                </div>
              ) : resultados.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {busqueda.length >= 2 ? (
                    <>
                      <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No se encontraron usuarios disponibles</p>
                      <p className="text-xs mt-1">
                        Los usuarios con profesional vinculado no aparecen aqui
                      </p>
                    </>
                  ) : (
                    <>
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Escribe al menos 2 caracteres para buscar</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {resultados.slice(0, 10).map((usuario) => (
                    <button
                      key={usuario.id}
                      type="button"
                      onClick={() => handleSelect(usuario)}
                      className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50
                        flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {usuario.nombre || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {usuario.email}
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded flex-shrink-0">
                        {usuario.rol || 'Sin rol'}
                      </span>
                    </button>
                  ))}
                  {resultados.length > 10 && (
                    <div className="p-2 text-center text-xs text-gray-500 dark:text-gray-400">
                      Mostrando 10 de {resultados.length} resultados
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Click outside handler */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default memo(UsuarioSelector);
