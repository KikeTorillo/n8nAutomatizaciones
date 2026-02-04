/**
 * ====================================================================
 * FAQ EDITOR (INVITACIONES)
 * ====================================================================
 * Editor del bloque de preguntas frecuentes para invitaciones.
 *
 * GUARDADO AUTOMÁTICO: Los cambios se propagan inmediatamente al store
 * y se guardan automáticamente después de 2s de inactividad.
 *
 * @version 2.0.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Migrado a guardado automático
 */

import { memo, useCallback, useMemo } from 'react';
import { HelpCircle, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui';
import { BaseAutoSaveEditor } from '@/components/editor-framework';
import { useInvitacionBlockEditor } from '../../hooks';
import { BLOCK_DEFAULTS } from '../../config';

/**
 * FaqEditor - Editor del bloque de FAQ
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque
 * @param {Function} props.onChange - Callback para cambios (guardado automático)
 * @param {Object} props.tema - Tema de la invitación
 */
function FaqEditor({ contenido, estilos, onChange, tema }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.faq,
    }),
    []
  );

  // Default item para nuevas preguntas
  const defaultItem = useMemo(
    () => ({
      pregunta: 'Nueva pregunta',
      respuesta: '',
    }),
    []
  );

  // Hook para manejo del formulario con guardado automático
  const { form, handleFieldChange, handleArrayItemAdd, handleArrayItemRemove, handleArrayItemChange } = useInvitacionBlockEditor(
    contenido,
    estilos,
    defaultValues,
    onChange
  );

  // Handlers para array de items
  const handleAgregarItem = useCallback(() => {
    handleArrayItemAdd('items', defaultItem);
  }, [handleArrayItemAdd, defaultItem]);

  const handleEliminarItem = useCallback((index) => {
    handleArrayItemRemove('items', index);
  }, [handleArrayItemRemove]);

  const handleChangeItem = useCallback((index, campo, valor) => {
    handleArrayItemChange('items', index, campo, valor);
  }, [handleArrayItemChange]);

  // Componente de preview
  const preview = useMemo(() => {
    return (
      <div className="p-4">
        <h4 className="font-bold text-center mb-2 text-gray-900 dark:text-white">
          {form.titulo_seccion || 'Preguntas Frecuentes'}
        </h4>

        {form.subtitulo_seccion && (
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
            {form.subtitulo_seccion}
          </p>
        )}

        {/* Preview de preguntas */}
        {(form.items || []).length > 0 ? (
          <div className="space-y-2">
            {(form.items || []).slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.pregunta || 'Pregunta'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
                {idx === 0 && item.respuesta && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                    {item.respuesta}
                  </p>
                )}
              </div>
            ))}

            {(form.items || []).length > 3 && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                +{form.items.length - 3} preguntas más
              </p>
            )}
          </div>
        ) : (
          <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Agrega preguntas frecuentes
            </p>
          </div>
        )}
      </div>
    );
  }, [form]);

  return (
    <BaseAutoSaveEditor preview={preview}>
      <Input
        label="Título de sección"
        value={form.titulo_seccion || ''}
        onChange={(e) => handleFieldChange('titulo_seccion', e.target.value)}
        placeholder="Preguntas Frecuentes"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Textarea
        label="Subtítulo (opcional)"
        value={form.subtitulo_seccion || ''}
        onChange={(e) => handleFieldChange('subtitulo_seccion', e.target.value)}
        placeholder="Algunas preguntas que podrías tener"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Lista de preguntas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Preguntas ({(form.items || []).length})
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={handleAgregarItem}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>

        {(form.items || []).map((item, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <HelpCircle
                  className="w-4 h-4"
                  style={{ color: tema?.color_primario || '#753572' }}
                />
                Pregunta {index + 1}
              </span>
              {(form.items || []).length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminarItem(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <Input
                label="Pregunta"
                value={item.pregunta || ''}
                onChange={(e) => handleChangeItem(index, 'pregunta', e.target.value)}
                placeholder="¿Cuál es el dress code?"
                className="dark:bg-gray-600 dark:border-gray-500"
              />

              <Textarea
                label="Respuesta"
                value={item.respuesta || ''}
                onChange={(e) => handleChangeItem(index, 'respuesta', e.target.value)}
                placeholder="El dress code es formal. Para caballeros traje y para damas vestido largo o cocktail."
                rows={3}
                className="dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Sugerencias de preguntas */}
      {(form.items || []).length === 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">
            Sugerencias de preguntas frecuentes:
          </p>
          <ul className="text-xs text-blue-600 dark:text-blue-400 ml-4 list-disc space-y-1">
            <li>¿Cuál es el dress code?</li>
            <li>¿Hay estacionamiento?</li>
            <li>¿Puedo llevar niños?</li>
            <li>¿A qué hora debo llegar?</li>
            <li>¿Hay alguna restricción alimentaria?</li>
          </ul>
        </div>
      )}
    </BaseAutoSaveEditor>
  );
}

export default memo(FaqEditor);
