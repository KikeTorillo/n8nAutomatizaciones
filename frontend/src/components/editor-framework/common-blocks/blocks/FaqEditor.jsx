/**
 * ====================================================================
 * FAQ EDITOR (COMMON BLOCK)
 * ====================================================================
 * Editor de bloque de preguntas frecuentes compartido entre editores.
 * Configurable con slots opcionales para IA.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useCallback, useMemo } from 'react';
import { HelpCircle, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Button, Input, Textarea, ToggleSwitch } from '@/components/ui';
import BaseBlockEditor from '../../blocks/BaseBlockEditor';
import BaseAutoSaveEditor from '../../blocks/BaseAutoSaveEditor';
import { useCommonBlockEditor } from '../hooks';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

// ========== SUGERENCIAS DE PREGUNTAS ==========

const SUGERENCIAS_MINIMAL = [
  '¿Cuál es el dress code?',
  '¿Hay estacionamiento?',
  '¿Puedo llevar niños?',
  '¿A qué hora debo llegar?',
  '¿Hay alguna restricción alimentaria?',
];

// ========== COMPONENTE PRINCIPAL ==========

/**
 * FaqEditor - Editor del bloque de FAQ
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque (solo autoSave mode)
 * @param {Function} props.onChange - Callback para autoSave mode
 * @param {Function} props.onGuardar - Callback para manualSave mode
 * @param {Object} props.tema - Tema del editor
 * @param {boolean} props.isSaving - Estado de guardado (solo manualSave)
 * @param {string} props.industria - Industria para IA (solo website)
 * @param {Object} props.config - Configuración personalizada
 * @param {boolean} props.config.showLayout - Mostrar selector de layout
 * @param {boolean} props.config.showPermitirMultiple - Mostrar toggle permitir múltiple
 * @param {boolean} props.config.showAI - Habilitar slots de IA
 * @param {boolean} props.config.showSugerencias - Mostrar sugerencias de preguntas
 * @param {Object} props.config.defaultItem - Valores por defecto para nuevas preguntas
 * @param {Object} props.config.fieldMapping - Mapeo de nombres de campos
 * @param {React.Component} props.AIBannerComponent - Componente de banner de IA (slot)
 * @param {React.Component} props.AIGenerateButtonComponent - Componente de botón de IA (slot)
 * @param {React.Component} props.SectionTitleFieldComponent - Componente de título con IA (slot)
 * @param {React.Component} props.ArrayItemsEditorComponent - Componente para renderizar items
 */
function FaqEditor({
  contenido,
  estilos,
  onChange,
  onGuardar,
  tema,
  isSaving,
  industria = 'default',
  config = {},
  AIBannerComponent,
  AIGenerateButtonComponent,
  SectionTitleFieldComponent,
  ArrayItemsEditorComponent,
}) {
  const {
    showLayout = false,
    showPermitirMultiple = false,
    showAI = false,
    showSugerencias = true,
    defaultItem = { pregunta: 'Nueva pregunta', respuesta: '' },
    fieldMapping = null,
  } = config;

  // Determinar modo
  const isAutoSaveMode = Boolean(onChange);

  // Mapear campos si es necesario
  const mapField = useCallback((standardName) => {
    if (!fieldMapping) return standardName;
    return fieldMapping[standardName] || standardName;
  }, [fieldMapping]);

  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    [mapField('titulo')]: 'Preguntas Frecuentes',
    [mapField('subtitulo')]: '',
    items: [],
    ...(showLayout && { layout: 'accordion' }),
    ...(showPermitirMultiple && { permitir_multiple: false }),
  }), [mapField, showLayout, showPermitirMultiple]);

  // Hook unificado
  const {
    form,
    setForm,
    handleFieldChange,
    handleSubmit,
    cambios,
    handleArrayItemAdd,
    handleArrayItemRemove,
    handleArrayItemChange,
  } = useCommonBlockEditor(contenido, {
    defaultValues,
    estilos,
    onChange,
    onGuardar,
  });

  // Obtener valores usando el mapeo
  const getValue = useCallback((standardName) => {
    const fieldName = mapField(standardName);
    return form[fieldName];
  }, [form, mapField]);

  const setValue = useCallback((standardName, value) => {
    const fieldName = mapField(standardName);
    handleFieldChange(fieldName, value);
  }, [handleFieldChange, mapField]);

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

  // Verificar si el contenido está vacío (para mostrar banner de IA)
  const faqsVacias = !contenido.items || contenido.items.length === 0;

  // Callback para generación de IA de bloque completo
  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      [mapField('titulo')]: generatedContent.titulo_seccion || generatedContent.titulo || prev[mapField('titulo')],
      [mapField('subtitulo')]: generatedContent.subtitulo_seccion || generatedContent.subtitulo || prev[mapField('subtitulo')],
      items: generatedContent.items || prev.items,
    }));
  }, [setForm, mapField]);

  // Colores del tema
  const colorPrimario = tema?.color_primario || tema?.colores?.primario || THEME_FALLBACK_COLORS.invitacion.primario;

  // Componente de preview
  const preview = useMemo(() => {
    const titulo = getValue('titulo');
    const subtitulo = getValue('subtitulo');
    const items = form.items || [];

    return (
      <div className="p-4">
        <h4 className="font-bold text-center mb-2 text-gray-900 dark:text-white">
          {titulo || 'Preguntas Frecuentes'}
        </h4>

        {subtitulo && (
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
            {subtitulo}
          </p>
        )}

        {items.length > 0 ? (
          <div className="space-y-2">
            {items.slice(0, 3).map((item, idx) => (
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

            {items.length > 3 && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                +{items.length - 3} preguntas más
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
  }, [getValue, form.items]);

  // Campos del formulario
  const formFields = (
    <>
      {/* Configuración general */}
      {isAutoSaveMode ? (
        <>
          <Input
            label="Título de sección"
            value={getValue('titulo') || ''}
            onChange={(e) => setValue('titulo', e.target.value)}
            placeholder="Preguntas Frecuentes"
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />

          <Textarea
            label="Subtítulo (opcional)"
            value={getValue('subtitulo') || ''}
            onChange={(e) => setValue('subtitulo', e.target.value)}
            placeholder="Algunas preguntas que podrías tener"
            rows={2}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            {SectionTitleFieldComponent && showAI ? (
              <SectionTitleFieldComponent
                value={getValue('titulo') || ''}
                onChange={(val) => setValue('titulo', val)}
                tipo="faq"
                industria={industria}
              />
            ) : (
              <Input
                label="Título"
                value={getValue('titulo') || ''}
                onChange={(e) => setValue('titulo', e.target.value)}
                placeholder="Preguntas Frecuentes"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            )}

            {showPermitirMultiple && (
              <div className="flex items-center pt-6">
                <ToggleSwitch
                  checked={form.permitir_multiple || false}
                  onChange={(checked) => handleFieldChange('permitir_multiple', checked)}
                  label="Permitir abrir múltiples"
                />
              </div>
            )}
          </div>

          <Input
            label="Subtítulo (opcional)"
            value={getValue('subtitulo') || ''}
            onChange={(e) => setValue('subtitulo', e.target.value)}
            placeholder="Encuentra respuestas a las preguntas más comunes"
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </>
      )}

      {/* Lista de preguntas */}
      {ArrayItemsEditorComponent && !isAutoSaveMode ? (
        // Usar componente de website si está disponible
        <ArrayItemsEditorComponent
          items={form.items || []}
          label="Preguntas"
          onAgregar={handleAgregarItem}
          onEliminar={handleEliminarItem}
          itemName="Pregunta"
          itemIcon={HelpCircle}
          iconColor="text-blue-500"
          renderItem={(faq, index) => (
            <>
              <Input
                label={
                  showAI && AIGenerateButtonComponent ? (
                    <span className="flex items-center gap-2">
                      Pregunta
                      <AIGenerateButtonComponent
                        tipo="faq"
                        campo="pregunta"
                        industria={industria}
                        onGenerate={(text) => handleChangeItem(index, 'pregunta', text)}
                        size="sm"
                      />
                    </span>
                  ) : (
                    'Pregunta'
                  )
                }
                value={faq.pregunta || ''}
                onChange={(e) => handleChangeItem(index, 'pregunta', e.target.value)}
                placeholder="¿Cómo puedo...?"
                className="mb-3 dark:bg-gray-600 dark:border-gray-500"
              />

              <Textarea
                label={
                  showAI && AIGenerateButtonComponent ? (
                    <span className="flex items-center gap-2">
                      Respuesta
                      <AIGenerateButtonComponent
                        tipo="faq"
                        campo="respuesta"
                        industria={industria}
                        contexto={{ pregunta: faq.pregunta }}
                        onGenerate={(text) => handleChangeItem(index, 'respuesta', text)}
                        size="sm"
                      />
                    </span>
                  ) : (
                    'Respuesta'
                  )
                }
                value={faq.respuesta || ''}
                onChange={(e) => handleChangeItem(index, 'respuesta', e.target.value)}
                placeholder="La respuesta a la pregunta..."
                rows={3}
                className="dark:bg-gray-600 dark:border-gray-500"
              />
            </>
          )}
        />
      ) : (
        // Lista simple para invitaciones
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
                    style={{ color: colorPrimario }}
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
      )}

      {/* Sugerencias de preguntas (solo invitaciones y cuando está vacío) */}
      {showSugerencias && isAutoSaveMode && (form.items || []).length === 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">
            Sugerencias de preguntas frecuentes:
          </p>
          <ul className="text-xs text-blue-600 dark:text-blue-400 ml-4 list-disc space-y-1">
            {SUGERENCIAS_MINIMAL.map((sugerencia, idx) => (
              <li key={idx}>{sugerencia}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  // Renderizar según el modo
  if (isAutoSaveMode) {
    return (
      <BaseAutoSaveEditor preview={preview}>
        {formFields}
      </BaseAutoSaveEditor>
    );
  }

  return (
    <BaseBlockEditor
      tipo="faq"
      industria={industria}
      mostrarAIBanner={showAI && faqsVacias}
      onAIGenerate={handleAIGenerate}
      AIBannerComponent={AIBannerComponent}
      cambios={cambios}
      handleSubmit={handleSubmit}
      onGuardar={onGuardar}
      isSaving={isSaving}
      preview={preview}
    >
      {formFields}
    </BaseBlockEditor>
  );
}

// ========== EXPORTS ==========

export default memo(FaqEditor);

// Configuraciones predefinidas para cada editor
export const FAQ_CONFIG_MINIMAL = {
  showLayout: false,
  showPermitirMultiple: false,
  showAI: false,
  showSugerencias: true,
  defaultItem: { pregunta: 'Nueva pregunta', respuesta: '' },
  fieldMapping: {
    titulo: 'titulo_seccion',
    subtitulo: 'subtitulo_seccion',
  },
};

export const FAQ_CONFIG_FULL = {
  showLayout: true,
  showPermitirMultiple: true,
  showAI: true,
  showSugerencias: false,
  defaultItem: { pregunta: '', respuesta: '' },
  fieldMapping: {
    titulo: 'titulo_seccion',
    subtitulo: 'subtitulo_seccion',
  },
};
