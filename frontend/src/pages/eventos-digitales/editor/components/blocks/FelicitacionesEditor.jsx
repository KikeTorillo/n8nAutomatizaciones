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
import { Input, Textarea } from '@/components/ui';
import { BaseAutoSaveEditor, useBlockEditor } from '@/components/editor-framework';
import { BLOCK_DEFAULTS } from '../../config';

function FelicitacionesEditor({ contenido, estilos, onChange }) {
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.felicitaciones,
    }),
    []
  );

  const { form, handleFieldChange } = useBlockEditor(contenido, defaultValues, {
    estilos,
    onChange,
    bloqueIdKey: '_bloqueId',
  });

  return (
    <BaseAutoSaveEditor>
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
