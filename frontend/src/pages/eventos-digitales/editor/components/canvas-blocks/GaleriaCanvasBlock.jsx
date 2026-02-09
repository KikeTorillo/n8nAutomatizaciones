/**
 * Galería Canvas Block — Invitaciones wrapper
 */

import { memo, useCallback } from 'react';
import { GaleriaCanvasBlock as SharedGaleriaCanvasBlock } from '@/components/editor-framework';
import { MarcoFoto } from '@/pages/eventos-digitales/components';

function GaleriaCanvasBlock({ bloque, tema, galeria = [] }) {
  const contenido = bloque.contenido || {};
  const usar_galeria_evento = contenido.usar_galeria_evento ?? true;

  const imagenesOverride = usar_galeria_evento && galeria.length > 0 ? galeria : undefined;

  const renderImageWrapper = useCallback((children, _img, currentTema) => (
    <MarcoFoto
      marco={currentTema?.marco_fotos}
      colorPrimario={currentTema?.color_primario}
      colorSecundario={currentTema?.color_secundario}
    >
      {children}
    </MarcoFoto>
  ), []);

  return (
    <SharedGaleriaCanvasBlock
      bloque={bloque}
      tema={tema}
      fallbackContext="invitacion"
      imagenes={imagenesOverride}
      showLightbox
      renderImageWrapper={renderImageWrapper}
    />
  );
}

export default memo(GaleriaCanvasBlock);
