/**
 * ====================================================================
 * FELICITACIONES EDITOR
 * ====================================================================
 * Editor del bloque de felicitaciones / libro de firmas.
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import { memo, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { Input, Textarea } from '@/components/ui';
import { BaseAutoSaveEditor } from '@/components/editor-framework';
import { useInvitacionBlockEditor } from '../../hooks';
import { BLOCK_DEFAULTS } from '../../config';

function FelicitacionesEditor({ contenido, estilos, onChange, tema }) {
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.felicitaciones,
    }),
    []
  );

  const { form, handleFieldChange } = useInvitacionBlockEditor(
    contenido,
    estilos,
    defaultValues,
    onChange
  );

  const preview = useMemo(() => {
    const colorPrimario = tema?.color_primario || '#753572';

    return (
      <div className="p-4">
        <h4 className="font-bold text-center mb-2 text-gray-900 dark:text-white">
          {form.titulo || 'Libro de Firmas'}
        </h4>
        {form.subtitulo && (
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
            {form.subtitulo}
          </p>
        )}
        <div className="max-w-sm mx-auto space-y-3">
          <textarea
            placeholder={form.placeholder_mensaje || 'Escribe tus buenos deseos...'}
            disabled
            rows={3}
            className="w-full px-3 py-2 text-sm border dark:border-gray-600 dark:bg-gray-700 rounded resize-none"
          />
          <button
            className="w-full py-2 text-white text-sm rounded font-medium flex items-center justify-center gap-2"
            style={{ backgroundColor: colorPrimario }}
          >
            <MessageSquare className="w-4 h-4" />
            Enviar Felicitación
          </button>
        </div>

        {/* Preview felicitaciones */}
        <div className="mt-4 space-y-2">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm italic text-gray-600 dark:text-gray-400">
              "¡Muchas felicidades! Les deseo lo mejor..."
            </p>
            <p className="text-xs font-semibold mt-1" style={{ color: colorPrimario }}>
              — María García
            </p>
          </div>
        </div>
      </div>
    );
  }, [form, tema?.color_primario]);

  return (
    <BaseAutoSaveEditor preview={preview}>
      <Input
        label="Título"
        value={form.titulo || ''}
        onChange={(e) => handleFieldChange('titulo', e.target.value)}
        placeholder="Libro de Firmas"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Textarea
        label="Subtítulo (opcional)"
        value={form.subtitulo || ''}
        onChange={(e) => handleFieldChange('subtitulo', e.target.value)}
        placeholder="Déjanos tus buenos deseos"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Input
        label="Placeholder del mensaje"
        value={form.placeholder_mensaje || ''}
        onChange={(e) => handleFieldChange('placeholder_mensaje', e.target.value)}
        placeholder="Escribe tus buenos deseos..."
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Input
        label="Texto de agradecimiento"
        value={form.texto_agradecimiento || ''}
        onChange={(e) => handleFieldChange('texto_agradecimiento', e.target.value)}
        placeholder="¡Gracias por tus palabras!"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />
    </BaseAutoSaveEditor>
  );
}

export default memo(FelicitacionesEditor);
