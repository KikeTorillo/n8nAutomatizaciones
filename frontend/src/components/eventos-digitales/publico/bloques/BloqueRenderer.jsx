/**
 * ====================================================================
 * BLOQUE RENDERER - INVITACIONES DIGITALES
 * ====================================================================
 * Componente que renderiza dinámicamente un bloque según su tipo.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo, Suspense } from 'react';
import { BLOQUES_PUBLICOS } from './index';

function BloqueRenderer({
  bloque,
  evento,
  invitado,
  tema,
  ubicaciones,
  isVisible,
  onScrollToContent,
  onConfirmRSVP,
  isLoadingRSVP,
  qrImage,
  loadingQR,
}) {
  if (!bloque || !bloque.visible) return null;

  const BloqueComponent = BLOQUES_PUBLICOS[bloque.tipo];

  if (!BloqueComponent) {
    console.warn(`Bloque tipo "${bloque.tipo}" no tiene componente público`);
    return null;
  }

  return (
    <Suspense
      fallback={
        <div className="py-20 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
        </div>
      }
    >
      <BloqueComponent
        bloque={bloque}
        evento={evento}
        invitado={invitado}
        tema={tema}
        ubicaciones={ubicaciones || evento?.ubicaciones}
        isVisible={isVisible}
        onScrollToContent={onScrollToContent}
        onConfirm={onConfirmRSVP}
        isLoading={isLoadingRSVP}
        qrImage={qrImage}
        loadingQR={loadingQR}
      />
    </Suspense>
  );
}

export default memo(BloqueRenderer);
