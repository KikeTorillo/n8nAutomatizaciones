import { useCallback, useMemo } from 'react';
import { Save, Plus, Trash2, Star } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Textarea
} from '@/components/ui';
import { AIGenerateButton, AISuggestionBanner } from '../AIGenerator';
import { useBlockEditor, useArrayItems } from '../../hooks';

/**
 * TestimoniosEditor - Editor del bloque Testimonios
 */
function TestimoniosEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    titulo: 'Lo que dicen nuestros clientes',
    subtitulo: '',
    testimonios: [{ autor: '', cargo: '', texto: '', estrellas: 5, foto: '' }],
    estilo: 'cards',
  }), []);

  // Default item para nuevos testimonios
  const defaultTestimonio = useMemo(() => ({
    autor: '',
    cargo: '',
    texto: '',
    estrellas: 5,
    foto: '',
  }), []);

  // Hook para manejo del formulario
  const { form, setForm, cambios, handleSubmit, handleFieldChange } = useBlockEditor(
    contenido,
    defaultValues
  );

  // Hook para manejo del array de testimonios
  const {
    handleAgregar,
    handleEliminar,
    handleChange,
  } = useArrayItems(setForm, 'testimonios', defaultTestimonio);

  // Verificar si el contenido está esencialmente vacío
  const testimoniosVacios = !contenido.testimonios || contenido.testimonios.length === 0 ||
    (contenido.testimonios.length === 1 && !contenido.testimonios[0]?.texto);

  // Callback para generación de IA de bloque completo
  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo: generatedContent.titulo || prev.titulo,
      testimonios: generatedContent.items ? generatedContent.items.map(item => ({
        texto: item.texto || '',
        autor: item.autor || '',
        cargo: item.cargo || '',
        estrellas: 5,
        foto: '',
      })) : prev.testimonios,
    }));
  }, [setForm]);

  const estiloOptions = [
    { value: 'cards', label: 'Tarjetas' },
    { value: 'carousel', label: 'Carrusel' },
    { value: 'simple', label: 'Simple' },
  ];

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-4">
      {/* Banner de sugerencia IA para contenido vacío */}
      {testimoniosVacios && (
        <AISuggestionBanner
          tipo="testimonios"
          industria={industria}
          onGenerate={handleAIGenerate}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={
            <span className="flex items-center gap-2">
              Título de sección
              <AIGenerateButton
                tipo="testimonios"
                campo="titulo"
                industria={industria}
                onGenerate={(text) => handleFieldChange('titulo', text)}
                size="sm"
              />
            </span>
          }
          value={form.titulo}
          onChange={(e) => handleFieldChange('titulo', e.target.value)}
          placeholder="Lo que dicen nuestros clientes"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Select
          label="Estilo de presentación"
          value={form.estilo}
          onChange={(e) => handleFieldChange('estilo', e.target.value)}
          options={estiloOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <Input
        label="Subtítulo (opcional)"
        value={form.subtitulo}
        onChange={(e) => handleFieldChange('subtitulo', e.target.value)}
        placeholder="Opiniones reales de clientes satisfechos"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Lista de testimonios */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Testimonios ({form.testimonios.length})
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAgregar}
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>

        <div className="space-y-3">
          {form.testimonios.map((testimonio, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Testimonio {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminar(index)}
                  className="text-gray-400 hover:text-red-500 dark:hover:bg-gray-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Textarea
                  value={testimonio.texto}
                  onChange={(e) => handleChange(index, 'texto', e.target.value)}
                  placeholder="El texto del testimonio..."
                  rows={3}
                  className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={testimonio.autor}
                    onChange={(e) => handleChange(index, 'autor', e.target.value)}
                    placeholder="Nombre del cliente"
                    size="sm"
                    className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                  />
                  <Input
                    value={testimonio.cargo}
                    onChange={(e) => handleChange(index, 'cargo', e.target.value)}
                    placeholder="Cargo o ubicación"
                    size="sm"
                    className="dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Estrellas:</span>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleChange(index, 'estrellas', n)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            n <= testimonio.estrellas
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <Input
                    type="url"
                    value={testimonio.foto}
                    onChange={(e) => handleChange(index, 'foto', e.target.value)}
                    placeholder="URL foto (opcional)"
                    size="sm"
                    className="flex-1 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
        <h4 className="font-bold text-center mb-4" style={{ color: tema?.colores?.texto }}>
          {form.titulo}
        </h4>
        {form.testimonios[0] && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
            <div className="flex justify-center mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-4 h-4 ${
                    n <= (form.testimonios[0].estrellas || 5)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm italic text-gray-600 dark:text-gray-300 mb-2">
              "{form.testimonios[0].texto || 'Excelente servicio...'}"
            </p>
            <p className="text-xs font-medium" style={{ color: tema?.colores?.primario }}>
              - {form.testimonios[0].autor || 'Cliente'}
              {form.testimonios[0].cargo && `, ${form.testimonios[0].cargo}`}
            </p>
          </div>
        )}
      </div>

      {/* Botón guardar */}
      {cambios && (
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        </div>
      )}
    </form>
  );
}

export default TestimoniosEditor;
