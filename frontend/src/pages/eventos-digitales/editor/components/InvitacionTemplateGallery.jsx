/**
 * ====================================================================
 * INVITACION TEMPLATE GALLERY
 * ====================================================================
 * Wrapper de TemplateGalleryModal para el módulo de Invitaciones.
 * Usa DefaultGalleryCard del modal + preview custom con InvitacionDinamica.
 *
 * @version 1.2.0
 * @since 2026-02-05
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { TemplateGalleryModal } from '@/components/editor-framework';
import { InvitacionDinamica } from '@/components/eventos-digitales';
import { usePlantillas } from '@/hooks/otros/eventos-digitales';
import { usePlantillaPreview } from '@/hooks/otros/eventos-digitales';
import { useGoogleFonts } from '@/hooks/utils';
import { TIPOS_EVENTO_CATEGORIES } from '@/pages/eventos-digitales/constants';

// ========== INVITACION PREVIEW PANEL ==========

function InvitacionPreviewPanel({ template, onApply, isApplying, onClose }) {
  const { tema, evento, bloques } = usePlantillaPreview(template);

  // Cargar Google Fonts
  useGoogleFonts([tema.fuente_titulo, tema.fuente_cuerpo]);

  return (
    <div className="h-full flex flex-col" style={{ width: 420 }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {template.nombre}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview - InvitacionDinamica */}
      <div className="flex-1 overflow-y-auto">
        <div className="transform scale-[0.55] origin-top" style={{ width: '182%' }}>
          <InvitacionDinamica
            evento={evento}
            invitado={null}
            bloques={bloques}
            tema={tema}
            onConfirmRSVP={() => {}}
            isLoadingRSVP={false}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={onApply}
          disabled={isApplying}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          Usar esta plantilla
        </button>
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========

/**
 * InvitacionTemplateGallery
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 */
function InvitacionTemplateGallery({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { data: plantillas = [], isLoading } = usePlantillas();

  return (
    <TemplateGalleryModal
      isOpen={isOpen}
      onClose={onClose}
      templates={plantillas}
      isLoading={isLoading}
      categories={TIPOS_EVENTO_CATEGORIES}
      categoryField="tipo_evento"
      renderPreview={(template, { onApply, isApplying, onClose: closePreview }) => (
        <InvitacionPreviewPanel
          template={template}
          onApply={onApply}
          isApplying={isApplying}
          onClose={closePreview}
        />
      )}
      previewWidth={420}
      onApply={(template) => {
        navigate('/eventos-digitales/nuevo', {
          state: {
            plantilla_id: template.id,
            plantillaNombre: template.nombre,
            tema: template.tema,
          },
        });
        onClose();
      }}
      title="Plantillas de Invitación"
      subtitle="Elige un diseño y personalízalo en el editor"
      searchPlaceholder="Buscar plantillas..."
      emptyMessage="No hay plantillas disponibles"
      applyButtonText="Usar esta plantilla"
    />
  );
}

export default memo(InvitacionTemplateGallery);
