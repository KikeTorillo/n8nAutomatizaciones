import { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ReseñaCard from './ReseñaCard';
import EstrellaRating from './EstrellaRating';

/**
 * Sección completa de reseñas con lista y paginación
 * Muestra todas las reseñas de un negocio con filtros y ordenamiento
 *
 * @param {string} slug - Slug del negocio
 * @param {Array} resenas - Array de reseñas
 * @param {Object} paginacion - Objeto de paginación
 * @param {number} ratingPromedio - Rating promedio del negocio
 * @param {number} totalResenas - Total de reseñas
 * @param {boolean} isLoading - Estado de carga
 * @param {Object} error - Error si existe
 * @param {boolean} canResponder - Si el usuario puede responder
 * @param {function} onResponder - Callback para responder: (resenaId) => void
 * @param {function} onPageChange - Callback cambio de página: (page) => void
 * @param {function} onOrdenChange - Callback cambio de orden: (orden) => void
 * @param {string} ordenActual - Orden actual seleccionado
 * @param {string} className - Clases adicionales
 *
 * @example
 * <ReseñasSection
 *   slug={perfil.slug}
 *   resenas={resenas}
 *   paginacion={paginacion}
 *   ratingPromedio={perfil.rating_promedio}
 *   totalResenas={perfil.total_resenas}
 *   isLoading={isLoading}
 *   canResponder={user?.rol === 'admin'}
 *   onResponder={(id) => setSelectedResena(id)}
 *   onPageChange={(page) => setPage(page)}
 *   onOrdenChange={(orden) => setOrden(orden)}
 * />
 */
function ReseñasSection({
  slug,
  resenas = [],
  paginacion,
  ratingPromedio,
  totalResenas,
  isLoading,
  error,
  canResponder = false,
  onResponder,
  onPageChange,
  onOrdenChange,
  ordenActual = 'recientes',
  className,
}) {
  // Opciones de ordenamiento
  const ordenOpciones = [
    { value: 'recientes', label: 'Más recientes' },
    { value: 'antiguos', label: 'Más antiguos' },
    { value: 'rating_alto', label: 'Rating más alto' },
    { value: 'rating_bajo', label: 'Rating más bajo' },
  ];

  return (
    <div className={className}>
      {/* Header con resumen */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Reseñas</h2>
            {totalResenas > 0 && (
              <div className="flex items-center space-x-4">
                <EstrellaRating
                  rating={ratingPromedio}
                  size="lg"
                  showValue
                  totalReviews={totalResenas}
                />
              </div>
            )}
          </div>

          {/* Filtro de ordenamiento */}
          {resenas.length > 0 && (
            <div className="w-48">
              <Select
                value={ordenActual}
                onChange={(e) => onOrdenChange?.(e.target.value)}
                options={ordenOpciones}
              />
            </div>
          )}
        </div>
      </div>

      {/* Estados de carga */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Estado de error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400">Error al cargar reseñas: {error.message}</p>
        </div>
      )}

      {/* Estado vacío */}
      {!isLoading && !error && resenas.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Aún no hay reseñas
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Sé el primero en dejar una reseña de este negocio
          </p>
        </div>
      )}

      {/* Lista de reseñas */}
      {!isLoading && !error && resenas.length > 0 && (
        <>
          <div className="space-y-4">
            {resenas.map((resena) => (
              <ReseñaCard
                key={resena.id}
                resena={resena}
                canResponder={canResponder}
                onResponder={onResponder}
              />
            ))}
          </div>

          {/* Paginación */}
          {paginacion && paginacion.total_paginas > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {/* Botón anterior */}
              <Button
                variant="outline"
                onClick={() => onPageChange?.(paginacion.pagina_actual - 1)}
                disabled={paginacion.pagina_actual === 1}
                className="flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>

              {/* Indicador de página */}
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Página <span className="font-semibold">{paginacion.pagina_actual}</span> de{' '}
                <span className="font-semibold">{paginacion.total_paginas}</span>
              </span>

              {/* Botón siguiente */}
              <Button
                variant="outline"
                onClick={() => onPageChange?.(paginacion.pagina_actual + 1)}
                disabled={paginacion.pagina_actual === paginacion.total_paginas}
                className="flex items-center"
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReseñasSection;
