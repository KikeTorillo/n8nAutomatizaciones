/**
 * ====================================================================
 * APERTURA PÚBLICO - INVITACIONES DIGITALES
 * ====================================================================
 * Wrapper que mapea bloque.contenido a props de OpeningOverlay.
 *
 * @version 2.0.0
 * @since 2026-02-05
 */

import OpeningOverlay from '../OpeningOverlay';

function AperturaPublico({ bloque, tema, isPreview }) {
  const c = bloque.contenido || {};
  return (
    <OpeningOverlay
      modo={c.modo || 'animacion'}
      tipo={c.animacion || 'sobre'}
      imagenUrl={c.imagen_url}
      imagenMarco={c.imagen_marco}
      direccionApertura={c.direccion_apertura || 'vertical'}
      texto={c.texto || 'Desliza para abrir'}
      tema={tema}
      isPreview={isPreview}
    />
  );
}

export default AperturaPublico;
