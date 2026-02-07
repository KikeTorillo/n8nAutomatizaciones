import { useMemo } from 'react';
import { INVITACION_TEMA_DEFAULT } from '@/pages/eventos-digitales/constants';
import { generarPreviewData } from '@/utils/plantillaDummyData';

/**
 * Encapsula la lógica de preview de plantilla:
 * - Merge TEMA_DEFAULT + plantilla.tema
 * - Genera datos dummy con generarPreviewData()
 * - Prefiere bloques_plantilla reales si existen (fix bug imágenes)
 *
 * @param {Object} plantilla - Objeto plantilla (debe tener .tema, .tipo_evento, .bloques_plantilla)
 * @param {{ temaDefaults?: Object, tipoEventoFallback?: string }} options
 * @returns {{ tema: Object, evento: Object, bloques: Array }}
 */
export function usePlantillaPreview(plantilla, { temaDefaults, tipoEventoFallback = 'boda' } = {}) {
  const defaults = temaDefaults || INVITACION_TEMA_DEFAULT;

  const tema = useMemo(
    () => ({ ...defaults, ...(plantilla?.tema || {}) }),
    [defaults, plantilla?.tema]
  );

  const tipoEvento = plantilla?.tipo_evento || tipoEventoFallback;

  const { evento, bloques } = useMemo(() => {
    const base = generarPreviewData(tipoEvento, tema);
    // Usar bloques reales de la plantilla si existen (tienen imágenes Unsplash)
    if (plantilla?.bloques_plantilla?.length > 0) {
      return {
        evento: { ...base.evento, bloques_invitacion: plantilla.bloques_plantilla },
        bloques: plantilla.bloques_plantilla,
      };
    }
    return base;
  }, [tipoEvento, tema, plantilla?.bloques_plantilla]);

  return { tema, evento, bloques };
}
