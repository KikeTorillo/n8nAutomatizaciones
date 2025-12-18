import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Star } from 'lucide-react';
import useSucursalStore from '@/store/sucursalStore';
import { useSucursalesUsuario } from '@/hooks/useSucursales';
import useAuthStore from '@/store/authStore';

/**
 * Selector de sucursal para el header
 * Permite cambiar la sucursal activa del contexto de trabajo
 */
function SucursalSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Auth store para obtener el usuario actual
  const { user } = useAuthStore();

  // Sucursal store
  const { sucursalActiva, sucursalesDisponibles, setSucursalActiva, setSucursalesDisponibles } =
    useSucursalStore();

  // Fetch sucursales del usuario
  const { data: sucursales = [] } = useSucursalesUsuario(user?.id);

  // Sincronizar sucursales disponibles con el store
  useEffect(() => {
    if (sucursales.length > 0) {
      setSucursalesDisponibles(sucursales);
    }
  }, [sucursales, setSucursalesDisponibles]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // No mostrar si solo hay una sucursal o ninguna
  if (sucursalesDisponibles.length <= 1) {
    return null;
  }

  // Handler para seleccionar sucursal
  const handleSelect = (sucursal) => {
    setSucursalActiva(sucursal);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón del selector */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
          {sucursalActiva?.nombre || 'Seleccionar'}
        </span>
        {sucursalActiva?.es_matriz && (
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Sucursal de trabajo
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {sucursalesDisponibles.map((sucursal) => (
              <button
                key={sucursal.id}
                type="button"
                onClick={() => handleSelect(sucursal)}
                className={`w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  sucursalActiva?.id === sucursal.id
                    ? 'bg-primary-50 dark:bg-primary-900/30'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {sucursal.nombre}
                      </span>
                      {sucursal.es_matriz && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                          <Star className="w-3 h-3 mr-0.5" />
                          Matriz
                        </span>
                      )}
                    </div>
                    {sucursal.codigo && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {sucursal.codigo}
                      </span>
                    )}
                  </div>
                </div>

                {sucursalActiva?.id === sucursal.id && (
                  <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SucursalSelector;
