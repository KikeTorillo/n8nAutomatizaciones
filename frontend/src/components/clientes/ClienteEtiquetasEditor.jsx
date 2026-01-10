/**
 * ====================================================================
 * COMPONENTE - EDITOR DE ETIQUETAS DE CLIENTE (INLINE)
 * ====================================================================
 *
 * Fase 3 - Segmentación de Clientes (Ene 2026)
 * Editor inline para agregar/quitar etiquetas en ClienteDetailPage
 *
 * ====================================================================
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Tag, Check } from 'lucide-react';
import {
  useEtiquetas,
  useAgregarEtiquetaCliente,
  useQuitarEtiquetaCliente,
} from '@/hooks/useEtiquetasClientes';
import { useToast } from '@/hooks/useToast';
import EtiquetasBadges from './EtiquetasBadges';

/**
 * Editor inline de etiquetas para un cliente
 * Muestra badges editables + botón para agregar
 */
export default function ClienteEtiquetasEditor({
  clienteId,
  etiquetas = [],
  className = '',
  size = 'sm',
}) {
  const { toast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Query de todas las etiquetas disponibles
  const { data: etiquetasDisponibles = [] } = useEtiquetas();

  // Mutations
  const agregarMutation = useAgregarEtiquetaCliente();
  const quitarMutation = useQuitarEtiquetaCliente();

  // IDs de etiquetas actuales del cliente
  const etiquetaIdsActuales = useMemo(
    () => etiquetas.map((e) => e.id),
    [etiquetas]
  );

  // Etiquetas disponibles para agregar (no asignadas)
  const etiquetasParaAgregar = useMemo(
    () => etiquetasDisponibles.filter((e) => !etiquetaIdsActuales.includes(e.id)),
    [etiquetasDisponibles, etiquetaIdsActuales]
  );

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handler para quitar etiqueta
  const handleQuitar = async (etiqueta) => {
    try {
      await quitarMutation.mutateAsync({
        clienteId,
        etiquetaId: etiqueta.id,
      });
      toast.success(`Etiqueta "${etiqueta.nombre}" removida`);
    } catch (error) {
      toast.error(error.message || 'Error al quitar etiqueta');
    }
  };

  // Handler para agregar etiqueta
  const handleAgregar = async (etiqueta) => {
    try {
      await agregarMutation.mutateAsync({
        clienteId,
        etiquetaId: etiqueta.id,
      });
      toast.success(`Etiqueta "${etiqueta.nombre}" agregada`);
      setIsDropdownOpen(false);
    } catch (error) {
      toast.error(error.message || 'Error al agregar etiqueta');
    }
  };

  const isLoading = agregarMutation.isPending || quitarMutation.isPending;

  return (
    <div className={`${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Badges de etiquetas actuales */}
        {etiquetas.length > 0 ? (
          <EtiquetasBadges
            etiquetas={etiquetas}
            onRemove={handleQuitar}
            size={size}
            maxVisible={10}
          />
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            Sin etiquetas
          </span>
        )}

        {/* Botón para agregar */}
        {etiquetasParaAgregar.length > 0 && (
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isLoading}
              className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-full
                text-xs font-medium
                border border-dashed border-gray-300 dark:border-gray-600
                text-gray-500 dark:text-gray-400
                hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title="Agregar etiqueta"
            >
              <Plus className="w-3 h-3" />
              Agregar
            </button>

            {/* Dropdown de etiquetas */}
            {isDropdownOpen && (
              <div
                ref={dropdownRef}
                className="absolute z-50 mt-1 left-0 min-w-[200px] max-h-[240px] overflow-y-auto
                  bg-white dark:bg-gray-800 rounded-lg shadow-lg
                  border border-gray-200 dark:border-gray-700
                  py-1"
              >
                {etiquetasParaAgregar.map((etiqueta) => (
                  <button
                    key={etiqueta.id}
                    type="button"
                    onClick={() => handleAgregar(etiqueta)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2
                      hover:bg-gray-50 dark:hover:bg-gray-700
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: etiqueta.color }}
                    />
                    <span className="flex-1 text-gray-700 dark:text-gray-300">
                      {etiqueta.nombre}
                    </span>
                    {etiqueta.total_clientes > 0 && (
                      <span className="text-xs text-gray-400">
                        ({etiqueta.total_clientes})
                      </span>
                    )}
                  </button>
                ))}

                {etiquetasParaAgregar.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No hay más etiquetas disponibles
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
