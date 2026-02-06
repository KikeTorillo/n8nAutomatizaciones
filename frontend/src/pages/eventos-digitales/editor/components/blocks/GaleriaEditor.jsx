/**
 * ====================================================================
 * GALERIA EDITOR (INVITACIONES) - ADAPTER
 * ====================================================================
 * Adapter que usa el GaleriaEditor común del framework con configuración
 * específica para invitaciones. Incluye selector de marco de fotos.
 *
 * @version 4.0.0 - Marco de fotos movido aquí desde DecorationEditorSection
 * @since 2026-02-04
 */

import { memo, useCallback } from 'react';
import {
  GaleriaEditor as CommonGaleriaEditor,
  GALERIA_CONFIG_MINIMAL,
} from '@/components/editor-framework/common-blocks';
import { SelectField } from '@/components/editor-framework';
import { MARCOS_FOTOS } from '../../config';

/**
 * GaleriaEditor - Editor del bloque de galería para invitaciones
 *
 * @param {Array} galeria - Galería del evento (desde el backend)
 * @param {Function} onOpenUnsplash - Callback para abrir Unsplash
 * @param {Function} onUploadImage - Callback para subir imagen
 * @param {Function} onUpdatePlantilla - Callback para guardar marco a plantilla
 */
function GaleriaEditor({
  contenido,
  estilos,
  onChange,
  tema,
  evento,
  galeria = [],
  onOpenUnsplash,
  onUploadImage,
  onUpdatePlantilla,
}) {
  const handleMarcoChange = useCallback((value) => {
    if (!onUpdatePlantilla) return;
    onUpdatePlantilla({
      ...evento?.plantilla,
      marco_fotos: value,
    });
  }, [onUpdatePlantilla, evento?.plantilla]);

  return (
    <>
      <CommonGaleriaEditor
        contenido={contenido}
        estilos={estilos}
        onChange={onChange}
        tema={tema}
        galeria={galeria}
        config={GALERIA_CONFIG_MINIMAL}
        onOpenUnsplash={onOpenUnsplash}
        onUploadImage={onUploadImage}
      />

      {/* Marco de fotos - guarda directo a plantilla */}
      <div className="px-4 pb-4">
        <SelectField
          label="Marco de fotos"
          value={tema?.marco_fotos || 'none'}
          onChange={handleMarcoChange}
          options={MARCOS_FOTOS}
        />
      </div>
    </>
  );
}

export default memo(GaleriaEditor);
