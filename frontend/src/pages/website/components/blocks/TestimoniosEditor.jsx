/**
 * ====================================================================
 * TESTIMONIOS EDITOR (Refactorizado)
 * ====================================================================
 *
 * Editor del bloque Testimonios.
 * Usa BaseBlockEditor y ArrayItemsEditor con estrellas.
 *
 * @version 2.0.0
 * @since 2026-02-03
 */

import { memo, useCallback, useMemo } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { Input, Select, Textarea } from '@/components/ui';
import { BaseBlockEditor, useBlockEditor, useArrayItems } from '@/components/editor-framework';
import { AISuggestionBanner } from '../AIGenerator';
import { SectionTitleField, ArrayItemsEditor } from './fields';

/**
 * TestimoniosEditor - Editor del bloque Testimonios
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Function} props.onGuardar - Callback para guardar
 * @param {Object} props.tema - Tema del sitio
 * @param {boolean} props.isSaving - Estado de guardado
 * @param {string} props.industria - Industria para AI
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

  // Verificar si el contenido esta vacio
  const testimoniosVacios = !contenido.testimonios || contenido.testimonios.length === 0 ||
    (contenido.testimonios.length === 1 && !contenido.testimonios[0]?.texto);

  // Callback para generacion de IA de bloque completo
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

  // Opciones de select
  const estiloOptions = [
    { value: 'cards', label: 'Tarjetas' },
    { value: 'carousel', label: 'Carrusel' },
    { value: 'simple', label: 'Simple' },
  ];

  // Renderizador de cada testimonio
  const renderTestimonioItem = useCallback((testimonio, index) => (
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
          placeholder="Cargo o ubicacion"
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
  ), [handleChange]);

  // Componente de preview
  const preview = useMemo(() => (
    <>
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
    </>
  ), [form.titulo, form.testimonios, tema?.colores]);

  return (
    <BaseBlockEditor
      tipo="testimonios"
      industria={industria}
      mostrarAIBanner={testimoniosVacios}
      onAIGenerate={handleAIGenerate}
      AIBannerComponent={AISuggestionBanner}
      cambios={cambios}
      handleSubmit={handleSubmit}
      onGuardar={onGuardar}
      isSaving={isSaving}
      preview={preview}
    >
      <div className="grid grid-cols-2 gap-4">
        <SectionTitleField
          label="Titulo de seccion"
          value={form.titulo}
          onChange={(val) => handleFieldChange('titulo', val)}
          tipo="testimonios"
          industria={industria}
        />
        <Select
          label="Estilo de presentacion"
          value={form.estilo}
          onChange={(e) => handleFieldChange('estilo', e.target.value)}
          options={estiloOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <Input
        label="Subtitulo (opcional)"
        value={form.subtitulo}
        onChange={(e) => handleFieldChange('subtitulo', e.target.value)}
        placeholder="Opiniones reales de clientes satisfechos"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Lista de testimonios */}
      <ArrayItemsEditor
        items={form.testimonios}
        label="Testimonios"
        onAgregar={handleAgregar}
        onEliminar={handleEliminar}
        itemName="Testimonio"
        itemIcon={MessageSquare}
        iconColor="text-yellow-500"
        showDragHandle={true}
        renderItem={renderTestimonioItem}
      />
    </BaseBlockEditor>
  );
}

export default memo(TestimoniosEditor);
