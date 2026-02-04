/**
 * ====================================================================
 * BLOCK PALETTE
 * ====================================================================
 * Paleta de bloques centralizada con soporte para dos variantes visuales:
 * - grid: Cards verticales en grid (usado en Website)
 * - list: Items horizontales en lista (usado en Invitaciones)
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import BlockCategoryGroup from './BlockCategoryGroup';
import DraggableBlockCard from './DraggableBlockCard';
import DraggableBlockItem from './DraggableBlockItem';
import { agruparBloquesPorCategoria, getBlockColor } from './paletteUtils';

/**
 * BlockPalette - Paleta de bloques centralizada
 *
 * @param {Object} props
 * @param {Array} props.bloques - Lista de bloques disponibles
 *   Cada bloque debe tener: {tipo, nombre/label, icon, descripcion, categoria?}
 * @param {Object} props.categorias - Mapa de categorías {key: {label, orden}}
 * @param {Function} props.onAgregarBloque - Callback al agregar un bloque (tipo) => void
 * @param {boolean} props.disabled - Si la paleta está deshabilitada
 * @param {string} props.variant - 'grid' | 'list' (default: 'grid')
 * @param {boolean} props.isInDrawer - Si está en drawer móvil
 * @param {Object} props.colorConfig - Configuración de colores
 *   {mode: 'unique' | 'uniform', colors?: {tipo: {bg, text, dark}}}
 * @param {boolean} props.showHeader - Si mostrar el header (default: true)
 * @param {string} props.headerTitle - Título del header (default: 'Agregar bloque')
 * @param {string} props.headerSubtitle - Subtítulo del header
 * @param {string} props.disabledMessage - Mensaje cuando está deshabilitado
 * @param {string} props.draggablePrefix - Prefijo para IDs draggables
 */
function BlockPalette({
  bloques = [],
  categorias = {},
  onAgregarBloque,
  disabled = false,
  variant = 'grid',
  isInDrawer = false,
  colorConfig = { mode: 'uniform' },
  showHeader = true,
  headerTitle = 'Agregar bloque',
  headerSubtitle = 'Arrastra al canvas o haz clic para agregar',
  disabledMessage = 'Selecciona una página para agregar bloques',
  draggablePrefix = 'palette',
}) {
  // Normalizar bloques (soportar tanto 'nombre' como 'label')
  const bloquesNormalizados = useMemo(
    () =>
      bloques.map((b) => ({
        ...b,
        nombre: b.nombre || b.label,
      })),
    [bloques]
  );

  // Agrupar bloques por categoría
  const bloquesPorCategoria = useMemo(() => {
    // Si no hay categorías definidas, agrupar por 'categoria' del bloque
    if (Object.keys(categorias).length === 0) {
      // Crear categorías dinámicamente desde los bloques
      const catsFromBloques = {};
      bloquesNormalizados.forEach((b) => {
        if (b.categoria && !catsFromBloques[b.categoria]) {
          catsFromBloques[b.categoria] = { label: b.categoria, orden: 99 };
        }
      });
      return agruparBloquesPorCategoria(bloquesNormalizados, catsFromBloques);
    }

    return agruparBloquesPorCategoria(bloquesNormalizados, categorias);
  }, [bloquesNormalizados, categorias]);

  // Componente de bloque según variante
  const BlockComponent = variant === 'list' ? DraggableBlockItem : DraggableBlockCard;

  return (
    <div className="h-full flex flex-col">
      {/* Header - oculto si isInDrawer o showHeader=false */}
      {showHeader && !isInDrawer && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {headerTitle}
          </h3>
          {headerSubtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {headerSubtitle}
            </p>
          )}
        </div>
      )}

      {/* Contenido */}
      <div
        className={cn(
          'flex-1 overflow-y-auto',
          isInDrawer ? 'p-2' : 'p-4',
          variant === 'list' && 'space-y-4'
        )}
      >
        {/* Mensaje de deshabilitado */}
        {disabled && disabledMessage && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4 text-center">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {disabledMessage}
            </p>
          </div>
        )}

        {/* Bloques agrupados por categoría */}
        {bloquesPorCategoria.map(([categoria, bloquesCat]) => (
          <BlockCategoryGroup
            key={categoria}
            titulo={categorias[categoria]?.label || categoria}
            variant={variant}
            isInDrawer={isInDrawer}
          >
            {bloquesCat.map((bloque) => (
              <BlockComponent
                key={bloque.tipo}
                tipo={bloque.tipo}
                nombre={bloque.nombre}
                descripcion={bloque.descripcion}
                icon={bloque.icon}
                color={
                  variant === 'list' && colorConfig.mode === 'uniform'
                    ? null // DraggableBlockItem usa inline style con null
                    : getBlockColor(bloque.tipo, colorConfig)
                }
                onClick={() => onAgregarBloque?.(bloque.tipo)}
                disabled={disabled}
                isInDrawer={isInDrawer}
                draggablePrefix={draggablePrefix}
              />
            ))}
          </BlockCategoryGroup>
        ))}
      </div>
    </div>
  );
}

export default memo(BlockPalette);
