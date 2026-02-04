/**
 * ====================================================================
 * FAQ EDITOR (Refactorizado)
 * ====================================================================
 *
 * Editor del bloque FAQ (Preguntas Frecuentes).
 * Usa BaseBlockEditor y componentes de fields.
 *
 * @version 2.0.0
 * @since 2026-02-03
 */

import { memo, useCallback, useMemo } from 'react';
import { HelpCircle } from 'lucide-react';
import { Input, Textarea, ToggleSwitch } from '@/components/ui';
import { AIGenerateButton } from '../AIGenerator';
import { useBlockEditor, useArrayItems } from '../../hooks';
import BaseBlockEditor from './BaseBlockEditor';
import { SectionTitleField, ArrayItemsEditor } from './fields';

/**
 * FaqEditor - Editor del bloque FAQ
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Function} props.onGuardar - Callback para guardar
 * @param {Object} props.tema - Tema del sitio
 * @param {boolean} props.isSaving - Estado de guardado
 * @param {string} props.industria - Industria para AI
 */
function FaqEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    titulo_seccion: 'Preguntas Frecuentes',
    subtitulo_seccion: 'Encuentra respuestas a las preguntas mas comunes',
    layout: 'accordion',
    permitir_multiple: false,
    items: [
      {
        pregunta: 'Como puedo agendar una cita?',
        respuesta: 'Puedes agendar una cita facilmente a traves de nuestro formulario de contacto o llamando a nuestro numero de telefono.'
      }
    ],
  }), []);

  // Default item para nuevas FAQs
  const defaultFaq = useMemo(() => ({
    pregunta: '',
    respuesta: '',
  }), []);

  // Hook para manejo del formulario
  const { form, setForm, cambios, handleSubmit, handleFieldChange } = useBlockEditor(
    contenido,
    defaultValues
  );

  // Hook para manejo del array de items
  const {
    handleAgregar: handleAgregarFaq,
    handleEliminar: handleEliminarFaq,
    handleChange: handleChangeFaq,
  } = useArrayItems(setForm, 'items', defaultFaq);

  // Verificar si el contenido está vacío
  const faqsVacias = !contenido.items || contenido.items.length === 0;

  // Callback para generación de IA de bloque completo
  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo_seccion: generatedContent.titulo_seccion || prev.titulo_seccion,
      subtitulo_seccion: generatedContent.subtitulo_seccion || prev.subtitulo_seccion,
      items: generatedContent.items || prev.items,
    }));
  }, [setForm]);

  // Renderizador de cada FAQ item
  const renderFaqItem = useCallback((faq, index) => (
    <>
      <Input
        label={
          <span className="flex items-center gap-2">
            Pregunta
            <AIGenerateButton
              tipo="faq"
              campo="pregunta"
              industria={industria}
              onGenerate={(text) => handleChangeFaq(index, 'pregunta', text)}
              size="sm"
            />
          </span>
        }
        value={faq.pregunta}
        onChange={(e) => handleChangeFaq(index, 'pregunta', e.target.value)}
        placeholder="Como puedo...?"
        className="mb-3 dark:bg-gray-600 dark:border-gray-500"
      />

      <Textarea
        label={
          <span className="flex items-center gap-2">
            Respuesta
            <AIGenerateButton
              tipo="faq"
              campo="respuesta"
              industria={industria}
              contexto={{ pregunta: faq.pregunta }}
              onGenerate={(text) => handleChangeFaq(index, 'respuesta', text)}
              size="sm"
            />
          </span>
        }
        value={faq.respuesta}
        onChange={(e) => handleChangeFaq(index, 'respuesta', e.target.value)}
        placeholder="La respuesta a la pregunta..."
        rows={3}
        className="dark:bg-gray-600 dark:border-gray-500"
      />
    </>
  ), [industria, handleChangeFaq]);

  // Componente de preview
  const preview = useMemo(() => (
    <>
      <h4 className="font-bold text-center mb-4 text-gray-900 dark:text-white">
        {form.titulo_seccion}
      </h4>
      <div className="space-y-2">
        {form.items.slice(0, 2).map((faq, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="font-medium text-sm text-gray-900 dark:text-white mb-1">
              {faq.pregunta || 'Pregunta...'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {faq.respuesta ? faq.respuesta.substring(0, 80) + '...' : 'Respuesta...'}
            </p>
          </div>
        ))}
      </div>
    </>
  ), [form.titulo_seccion, form.items]);

  return (
    <BaseBlockEditor
      tipo="faq"
      industria={industria}
      mostrarAIBanner={faqsVacias}
      onAIGenerate={handleAIGenerate}
      cambios={cambios}
      handleSubmit={handleSubmit}
      onGuardar={onGuardar}
      isSaving={isSaving}
      preview={preview}
    >
      {/* Configuracion general */}
      <div className="grid grid-cols-2 gap-4">
        <SectionTitleField
          value={form.titulo_seccion}
          onChange={(val) => handleFieldChange('titulo_seccion', val)}
          tipo="faq"
          industria={industria}
        />
        <div className="flex items-center pt-6">
          <ToggleSwitch
            checked={form.permitir_multiple}
            onChange={(checked) => handleFieldChange('permitir_multiple', checked)}
            label="Permitir abrir multiples"
          />
        </div>
      </div>

      <Input
        label="Subtitulo (opcional)"
        value={form.subtitulo_seccion}
        onChange={(e) => handleFieldChange('subtitulo_seccion', e.target.value)}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Lista de preguntas */}
      <ArrayItemsEditor
        items={form.items}
        label="Preguntas"
        onAgregar={handleAgregarFaq}
        onEliminar={handleEliminarFaq}
        itemName="Pregunta"
        itemIcon={HelpCircle}
        iconColor="text-blue-500"
        renderItem={renderFaqItem}
      />
    </BaseBlockEditor>
  );
}

export default memo(FaqEditor);
