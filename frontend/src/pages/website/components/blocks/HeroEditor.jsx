/**
 * ====================================================================
 * HERO EDITOR (Refactorizado)
 * ====================================================================
 *
 * Editor del bloque Hero.
 * Usa BaseBlockEditor.
 *
 * @version 2.0.0
 * @since 2026-02-03
 */

import { memo, useCallback, useMemo } from 'react';
import { Image } from 'lucide-react';
import { Checkbox, Input, Select, Textarea } from '@/components/ui';
import { BaseBlockEditor, useBlockEditor } from '@/components/editor-framework';
import { AIGenerateButton, AISuggestionBanner } from '../AIGenerator';

/**
 * HeroEditor - Editor del bloque Hero
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Function} props.onGuardar - Callback para guardar
 * @param {Object} props.tema - Tema del sitio
 * @param {boolean} props.isSaving - Estado de guardado
 * @param {string} props.industria - Industria para AI
 */
function HeroEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    titulo: '',
    subtitulo: '',
    cta_texto: '',
    cta_url: '',
    imagen_fondo: '',
    alineacion: 'center',
    overlay: true,
  }), []);

  // Hook para manejo del formulario
  const { form, setForm, cambios, handleSubmit, handleFieldChange } = useBlockEditor(
    contenido,
    defaultValues
  );

  // Verificar si el contenido esta vacio
  const contenidoVacio = !contenido.titulo && !contenido.subtitulo;

  // Callback para generacion de IA de bloque completo
  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo: generatedContent.titulo || prev.titulo,
      subtitulo: generatedContent.subtitulo || prev.subtitulo,
      cta_texto: generatedContent.boton_texto || generatedContent.boton || prev.cta_texto,
    }));
  }, [setForm]);

  // Opciones de select
  const alineacionOptions = [
    { value: 'left', label: 'Izquierda' },
    { value: 'center', label: 'Centro' },
    { value: 'right', label: 'Derecha' },
  ];

  // Componente de preview
  const preview = useMemo(() => (
    <div
      className="rounded-lg overflow-hidden relative"
      style={{
        backgroundColor: tema?.colores?.primario || '#4F46E5',
        backgroundImage: form.imagen_fondo ? `url(${form.imagen_fondo})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {form.overlay && form.imagen_fondo && (
        <div className="absolute inset-0 bg-black/50" />
      )}
      <div className={`relative p-8 text-${form.alineacion}`}>
        <h3 className="text-xl font-bold text-white mb-2">
          {form.titulo || 'Titulo del Hero'}
        </h3>
        <p className="text-white/80 text-sm mb-4">
          {form.subtitulo || 'Subtitulo descriptivo'}
        </p>
        {form.cta_texto && (
          <button className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium">
            {form.cta_texto}
          </button>
        )}
      </div>
    </div>
  ), [form.titulo, form.subtitulo, form.cta_texto, form.imagen_fondo, form.overlay, form.alineacion, tema?.colores?.primario]);

  return (
    <BaseBlockEditor
      tipo="hero"
      industria={industria}
      mostrarAIBanner={contenidoVacio}
      onAIGenerate={handleAIGenerate}
      AIBannerComponent={AISuggestionBanner}
      cambios={cambios}
      handleSubmit={handleSubmit}
      onGuardar={onGuardar}
      isSaving={isSaving}
      preview={preview}
    >
      <Input
        label={
          <span className="flex items-center gap-2">
            Titulo principal
            <AIGenerateButton
              tipo="hero"
              campo="titulo"
              industria={industria}
              onGenerate={(text) => handleFieldChange('titulo', text)}
              size="sm"
            />
          </span>
        }
        value={form.titulo}
        onChange={(e) => handleFieldChange('titulo', e.target.value)}
        placeholder="Bienvenido a nuestro negocio"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Textarea
        label={
          <span className="flex items-center gap-2">
            Subtitulo
            <AIGenerateButton
              tipo="hero"
              campo="subtitulo"
              industria={industria}
              contexto={{ titulo: form.titulo }}
              onGenerate={(text) => handleFieldChange('subtitulo', text)}
              size="sm"
            />
          </span>
        }
        value={form.subtitulo}
        onChange={(e) => handleFieldChange('subtitulo', e.target.value)}
        placeholder="Una descripcion breve de lo que hacemos"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={
            <span className="flex items-center gap-2">
              Texto del boton
              <AIGenerateButton
                tipo="hero"
                campo="boton"
                industria={industria}
                onGenerate={(text) => handleFieldChange('cta_texto', text)}
                size="sm"
              />
            </span>
          }
          value={form.cta_texto}
          onChange={(e) => handleFieldChange('cta_texto', e.target.value)}
          placeholder="Contactar"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Input
          label="URL del boton"
          value={form.cta_url}
          onChange={(e) => handleFieldChange('cta_url', e.target.value)}
          placeholder="/contacto"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <Input
        type="url"
        label={
          <span className="flex items-center gap-1">
            <Image className="w-4 h-4" />
            URL imagen de fondo
          </span>
        }
        value={form.imagen_fondo}
        onChange={(e) => handleFieldChange('imagen_fondo', e.target.value)}
        placeholder="https://ejemplo.com/imagen.jpg"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Alineacion"
          value={form.alineacion}
          onChange={(e) => handleFieldChange('alineacion', e.target.value)}
          options={alineacionOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <div className="flex items-center pt-6">
          <Checkbox
            label="Overlay oscuro"
            checked={form.overlay}
            onChange={(e) => handleFieldChange('overlay', e.target.checked)}
          />
        </div>
      </div>
    </BaseBlockEditor>
  );
}

export default memo(HeroEditor);
