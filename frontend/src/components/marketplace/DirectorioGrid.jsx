import { ChevronLeft, ChevronRight, Store } from 'lucide-react';
import { Button } from '@/components/ui';
import NegocioCard from './NegocioCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

/**
 * Grid de negocios con paginación
 * Muestra tarjetas de negocios en un grid responsivo
 *
 * @param {Array} perfiles - Array de perfiles de negocios
 * @param {Object} paginacion - Objeto de paginación del backend
 * @param {number} paginacion.pagina_actual - Página actual
 * @param {number} paginacion.total_paginas - Total de páginas
 * @param {number} paginacion.total_registros - Total de registros
 * @param {number} paginacion.limite - Límite por página
 * @param {boolean} isLoading - Estado de carga
 * @param {Object} error - Error si existe
 * @param {function} onPageChange - Callback cuando cambia de página: (page) => void
 * @param {string} className - Clases adicionales
 *
 * @example
 * <DirectorioGrid
 *   perfiles={perfiles}
 *   paginacion={paginacion}
 *   isLoading={isLoading}
 *   error={error}
 *   onPageChange={(page) => setFiltros(prev => ({ ...prev, pagina: page }))}
 * />
 */
function DirectorioGrid({
  perfiles = [],
  paginacion,
  isLoading,
  error,
  onPageChange,
  className,
}) {
  // Estado de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
        <div className="text-red-600 dark:text-red-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Error al cargar negocios
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{error.message || 'Intenta nuevamente más tarde'}</p>
      </div>
    );
  }

  // Estado vacío (sin resultados)
  if (!perfiles || perfiles.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
        <Store className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No se encontraron negocios
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Intenta ajustar los filtros para ver más resultados
        </p>
      </div>
    );
  }

  // Datos de paginación
  const paginaActual = paginacion?.pagina_actual || 1;
  const totalPaginas = paginacion?.total_paginas || 1;
  const totalRegistros = paginacion?.total_registros || perfiles.length;

  return (
    <div className={className}>
      {/* Header con contador de resultados */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando <span className="font-semibold text-gray-900 dark:text-gray-100">{perfiles.length}</span> de{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">{totalRegistros}</span> negocios
        </p>
      </div>

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {perfiles.map((perfil) => (
          <NegocioCard key={perfil.id || perfil.slug} perfil={perfil} />
        ))}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
          {/* Botón anterior */}
          <Button
            variant="outline"
            onClick={() => onPageChange(paginaActual - 1)}
            disabled={paginaActual === 1}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          {/* Indicador de página */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Página <span className="font-semibold">{paginaActual}</span> de{' '}
              <span className="font-semibold">{totalPaginas}</span>
            </span>

            {/* Números de página (solo en desktop) */}
            {totalPaginas <= 7 && (
              <div className="hidden md:flex items-center space-x-1 ml-4">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`
                      px-3 py-1 text-sm rounded-md transition-colors
                      ${
                        page === paginaActual
                          ? 'bg-primary-600 text-white font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón siguiente */}
          <Button
            variant="outline"
            onClick={() => onPageChange(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            className="flex items-center"
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default DirectorioGrid;
