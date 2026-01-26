import { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Trash2, HelpCircle, GripVertical } from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  ToggleSwitch
} from '@/components/ui';
import { AIGenerateButton, AISuggestionBanner } from '../AIGenerator';

/**
 * FaqEditor - Editor del bloque FAQ (Preguntas Frecuentes)
 */
function FaqEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  const [form, setForm] = useState({
    titulo_seccion: contenido.titulo_seccion || 'Preguntas Frecuentes',
    subtitulo_seccion: contenido.subtitulo_seccion || 'Encuentra respuestas a las preguntas mas comunes',
    layout: contenido.layout || 'accordion',
    permitir_multiple: contenido.permitir_multiple || false,
    items: contenido.items || [
      {
        pregunta: 'Como puedo agendar una cita?',
        respuesta: 'Puedes agendar una cita facilmente a traves de nuestro formulario de contacto o llamando a nuestro numero de telefono.'
      }
    ],
  });

  const [cambios, setCambios] = useState(false);

  const faqsVacias = !contenido.items || contenido.items.length === 0;

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      titulo_seccion: contenido.titulo_seccion || 'Preguntas Frecuentes',
      subtitulo_seccion: contenido.subtitulo_seccion || 'Encuentra respuestas a las preguntas mas comunes',
      layout: contenido.layout || 'accordion',
      permitir_multiple: contenido.permitir_multiple || false,
      items: contenido.items || [],
    }));
  }, [form, contenido]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(form);
    setCambios(false);
  };

  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo_seccion: generatedContent.titulo_seccion || prev.titulo_seccion,
      subtitulo_seccion: generatedContent.subtitulo_seccion || prev.subtitulo_seccion,
      items: generatedContent.items || prev.items,
    }));
  }, []);

  const handleAgregarFaq = () => {
    setForm({
      ...form,
      items: [...form.items, { pregunta: '', respuesta: '' }]
    });
  };

  const handleEliminarFaq = (index) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index)
    });
  };

  const handleChangeFaq = (index, campo, valor) => {
    const nuevos = [...form.items];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setForm({ ...form, items: nuevos });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {faqsVacias && (
        <AISuggestionBanner
          tipo="faq"
          industria={industria}
          onGenerate={handleAIGenerate}
        />
      )}

      {/* Configuracion general */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={
            <span className="flex items-center gap-2">
              Titulo de seccion
              <AIGenerateButton
                tipo="faq"
                campo="titulo"
                industria={industria}
                onGenerate={(text) => setForm({ ...form, titulo_seccion: text })}
                size="sm"
              />
            </span>
          }
          value={form.titulo_seccion}
          onChange={(e) => setForm({ ...form, titulo_seccion: e.target.value })}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <div className="flex items-center pt-6">
          <ToggleSwitch
            checked={form.permitir_multiple}
            onChange={(checked) => setForm({ ...form, permitir_multiple: checked })}
            label="Permitir abrir multiples"
          />
        </div>
      </div>

      <Input
        label="Subtitulo (opcional)"
        value={form.subtitulo_seccion}
        onChange={(e) => setForm({ ...form, subtitulo_seccion: e.target.value })}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Lista de preguntas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Preguntas ({form.items.length})
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={handleAgregarFaq}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar Pregunta
          </Button>
        </div>

        <div className="space-y-3">
          {form.items.map((faq, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <HelpCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pregunta {index + 1}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminarFaq(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

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
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
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
      </div>

      {/* Boton guardar */}
      {cambios && (
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" isLoading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        </div>
      )}
    </form>
  );
}

export default FaqEditor;
