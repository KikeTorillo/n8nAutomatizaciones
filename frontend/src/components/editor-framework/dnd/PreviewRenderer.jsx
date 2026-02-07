/**
 * ====================================================================
 * PREVIEW RENDERER
 * ====================================================================
 * Renderiza mini-versiones visuales de cada tipo de bloque
 * para mostrar durante el drag desde la paleta.
 *
 * Los previews se registran desde cada módulo via previewRegistry.
 * Este componente solo consulta el registry y muestra un fallback genérico.
 */

import { memo } from 'react';
import { getBlockPreview } from './previewRegistry';

/**
 * Renderiza un preview visual del tipo de bloque
 * @param {Object} props
 * @param {string} props.tipo - Tipo de bloque
 * @param {Object} props.tema - Tema del sitio (colores)
 */
function PreviewRenderer({ tipo, tema }) {
  const Preview = getBlockPreview(tipo);
  if (Preview) return <Preview tipo={tipo} tema={tema} />;

  return (
    <div className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
      <span className="text-xs text-gray-400">Preview</span>
    </div>
  );
}

export default memo(PreviewRenderer);

export { PreviewRenderer };
