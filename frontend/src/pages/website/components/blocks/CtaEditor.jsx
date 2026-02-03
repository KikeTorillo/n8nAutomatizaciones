/**
 * ====================================================================
 * CTA EDITOR (Refactorizado)
 * ====================================================================
 *
 * Editor del bloque Call To Action.
 * Usa BaseBlockEditor.
 *
 * @version 2.0.0
 * @since 2026-02-03
 */

import { useCallback, useMemo } from 'react';
import { Input, Select, Textarea } from '@/components/ui';
import { AIGenerateButton } from '../AIGenerator';
import { useBlockEditor } from '../../hooks';
import BaseBlockEditor from './BaseBlockEditor';

/**
 * CtaEditor - Editor del bloque Call To Action
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Function} props.onGuardar - Callback para guardar
 * @param {Object} props.tema - Tema del sitio
 * @param {boolean} props.isSaving - Estado de guardado
 * @param {string} props.industria - Industria para AI
 */
function CtaEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    titulo: 'Listo para empezar?',
    subtitulo: '',
    boton_texto: 'Contactar',
    boton_url: '',
    boton_secundario_texto: '',
    boton_secundario_url: '',
    estilo: 'primario',
    alineacion: 'center',
  }), []);

  // Hook para manejo del formulario
  const { form, setForm, cambios, handleSubmit, handleFieldChange } = useBlockEditor(
    contenido,
    defaultValues
  );

  // Verificar si el contenido esta vacio
  const contenidoVacio = contenido.titulo === 'Listo para empezar?' || !contenido.titulo;

  // Callback para generacion de IA de bloque completo
  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo: generatedContent.titulo || prev.titulo,
      subtitulo: generatedContent.subtitulo || prev.subtitulo,
      boton_texto: generatedContent.boton_texto || generatedContent.boton || prev.boton_texto,
    }));
  }, [setForm]);

  // Opciones de select
  const estiloOptions = [
    { value: 'primario', label: 'Color primario' },
    { value: 'secundario', label: 'Color secundario' },
    { value: 'gradiente', label: 'Gradiente' },
    { value: 'claro', label: 'Fondo claro' },
  ];

  const alineacionOptions = [
    { value: 'left', label: 'Izquierda' },
    { value: 'center', label: 'Centro' },
    { value: 'right', label: 'Derecha' },
  ];

  // Componente de preview
  const preview = useMemo(() => (
    <div
      className="rounded-lg p-6"
      style={{
        backgroundColor: form.estilo === 'claro'
          ? '#F9FAFB'
          : form.estilo === 'gradiente'
            ? undefined
            : tema?.colores?.primario || '#4F46E5',
        backgroundImage: form.estilo === 'gradiente'
          ? `linear-gradient(135deg, ${tema?.colores?.primario || '#4F46E5'}, ${tema?.colores?.secundario || '#6366F1'})`
          : undefined,
      }}
    >
      <div className={`text-${form.alineacion}`}>
        <h3
          className="text-xl font-bold mb-2"
          style={{
            color: form.estilo === 'claro'
              ? tema?.colores?.texto || '#1F2937'
              : '#FFFFFF'
          }}
        >
          {form.titulo}
        </h3>
        {form.subtitulo && (
          <p
            className="text-sm mb-4"
            style={{
              color: form.estilo === 'claro'
                ? '#6B7280'
                : 'rgba(255,255,255,0.8)'
            }}
          >
            {form.subtitulo}
          </p>
        )}
        <div className={`flex gap-3 ${
          form.alineacion === 'center' ? 'justify-center' :
          form.alineacion === 'right' ? 'justify-end' : 'justify-start'
        }`}>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              form.estilo === 'claro'
                ? 'text-white'
                : 'text-gray-900 bg-white'
            }`}
            style={{
              backgroundColor: form.estilo === 'claro'
                ? tema?.colores?.primario || '#4F46E5'
                : undefined
            }}
          >
            {form.boton_texto || 'Contactar'}
          </button>
          {form.boton_secundario_texto && (
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 ${
                form.estilo === 'claro'
                  ? 'border-gray-300 text-gray-700'
                  : 'border-white text-white'
              }`}
            >
              {form.boton_secundario_texto}
            </button>
          )}
        </div>
      </div>
    </div>
  ), [form.titulo, form.subtitulo, form.boton_texto, form.boton_secundario_texto, form.estilo, form.alineacion, tema?.colores]);

  return (
    <BaseBlockEditor
      tipo="cta"
      industria={industria}
      mostrarAIBanner={contenidoVacio}
      onAIGenerate={handleAIGenerate}
      cambios={cambios}
      handleSubmit={handleSubmit}
      onGuardar={onGuardar}
      isSaving={isSaving}
      preview={preview}
    >
      <Input
        label={
          <span className="flex items-center gap-2">
            Titulo
            <AIGenerateButton
              tipo="cta"
              campo="titulo"
              industria={industria}
              onGenerate={(text) => handleFieldChange('titulo', text)}
              size="sm"
            />
          </span>
        }
        value={form.titulo}
        onChange={(e) => handleFieldChange('titulo', e.target.value)}
        placeholder="Listo para empezar?"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Textarea
        label={
          <span className="flex items-center gap-2">
            Subtitulo (opcional)
            <AIGenerateButton
              tipo="cta"
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
        placeholder="Contactanos hoy y recibe una consulta gratuita"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={
            <span className="flex items-center gap-2">
              Texto del boton
              <AIGenerateButton
                tipo="cta"
                campo="boton"
                industria={industria}
                onGenerate={(text) => handleFieldChange('boton_texto', text)}
                size="sm"
              />
            </span>
          }
          value={form.boton_texto}
          onChange={(e) => handleFieldChange('boton_texto', e.target.value)}
          placeholder="Contactar"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Input
          label="URL del boton"
          value={form.boton_url}
          onChange={(e) => handleFieldChange('boton_url', e.target.value)}
          placeholder="/contacto"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Boton secundario (opcional)"
          value={form.boton_secundario_texto}
          onChange={(e) => handleFieldChange('boton_secundario_texto', e.target.value)}
          placeholder="Mas informacion"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Input
          label="URL secundario"
          value={form.boton_secundario_url}
          onChange={(e) => handleFieldChange('boton_secundario_url', e.target.value)}
          placeholder="/servicios"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Estilo de fondo"
          value={form.estilo}
          onChange={(e) => handleFieldChange('estilo', e.target.value)}
          options={estiloOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Select
          label="Alineacion"
          value={form.alineacion}
          onChange={(e) => handleFieldChange('alineacion', e.target.value)}
          options={alineacionOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>
    </BaseBlockEditor>
  );
}

export default CtaEditor;
