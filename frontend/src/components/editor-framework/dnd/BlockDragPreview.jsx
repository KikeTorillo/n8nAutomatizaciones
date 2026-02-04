/**
 * ====================================================================
 * BLOCK DRAG PREVIEW
 * ====================================================================
 * Preview visual mejorado que se muestra durante el drag desde la paleta.
 * Incluye mini-versión del bloque y detalles del tipo.
 *
 * Componente genérico que acepta configuración de iconos/nombres desde props.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Layout } from 'lucide-react';
import { PreviewRenderer } from './PreviewRenderer';

// Iconos por defecto para bloques website
const DEFAULT_ICONS = {
  hero: Layout,
};

// Nombres por defecto
const DEFAULT_NAMES = {
  hero: 'Hero',
};

// Descripciones por defecto
const DEFAULT_DESCRIPTIONS = {
  hero: 'Seccion principal',
};

/**
 * Preview mejorado del bloque durante el drag
 *
 * @param {Object} props
 * @param {string} props.tipo - Tipo de bloque
 * @param {Object} props.tema - Tema del sitio (colores)
 * @param {Object} props.blockIcons - Mapeo tipo -> icono (opcional)
 * @param {Object} props.blockNames - Mapeo tipo -> nombre (opcional)
 * @param {Object} props.blockDescriptions - Mapeo tipo -> descripción (opcional)
 */
function BlockDragPreview({
  tipo,
  tema,
  blockIcons = {},
  blockNames = {},
  blockDescriptions = {},
}) {
  // Combinar con defaults
  const icons = { ...DEFAULT_ICONS, ...blockIcons };
  const names = { ...DEFAULT_NAMES, ...blockNames };
  const descriptions = { ...DEFAULT_DESCRIPTIONS, ...blockDescriptions };

  const Icono = icons[tipo] || Layout;
  const nombre = names[tipo] || tipo;
  const descripcion = descriptions[tipo] || 'Bloque personalizado';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
      }}
      className="w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-primary-500 overflow-hidden pointer-events-none"
      style={{
        boxShadow: '0 25px 50px -12px rgba(117, 53, 114, 0.4)',
      }}
    >
      {/* Header con icono y nombre */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-900/30 border-b border-primary-100 dark:border-primary-800">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
          <Icono className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {nombre}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {descripcion}
          </p>
        </div>
      </div>

      {/* Preview visual del bloque */}
      <div className="p-3">
        <PreviewRenderer tipo={tipo} tema={tema} />
      </div>

      {/* Footer con instruccion */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Suelta para agregar
        </p>
      </div>
    </motion.div>
  );
}

export default memo(BlockDragPreview);

export { BlockDragPreview };
