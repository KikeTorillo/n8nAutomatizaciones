import { useState, useEffect, useCallback } from 'react';
import { Save, Image, Sparkles } from 'lucide-react';
import {
  Button,
  Checkbox,
  Input,
  Select,
  Textarea
} from '@/components/ui';
import { AIGenerateButton, AISuggestionBanner } from '../AIGenerator';

/**
 * HeroEditor - Editor del bloque Hero
 */
function HeroEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  const [form, setForm] = useState({
    titulo: contenido.titulo || '',
    subtitulo: contenido.subtitulo || '',
    cta_texto: contenido.cta_texto || '',
    cta_url: contenido.cta_url || '',
    imagen_fondo: contenido.imagen_fondo || '',
    alineacion: contenido.alineacion || 'center',
    overlay: contenido.overlay !== false,
  });

  const [cambios, setCambios] = useState(false);

  // Verificar si el contenido está esencialmente vacío
  const contenidoVacio = !contenido.titulo && !contenido.subtitulo;

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      titulo: contenido.titulo || '',
      subtitulo: contenido.subtitulo || '',
      cta_texto: contenido.cta_texto || '',
      cta_url: contenido.cta_url || '',
      imagen_fondo: contenido.imagen_fondo || '',
      alineacion: contenido.alineacion || 'center',
      overlay: contenido.overlay !== false,
    }));
  }, [form, contenido]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(form);
    setCambios(false);
  };

  // Callback para generación de IA de bloque completo
  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo: generatedContent.titulo || prev.titulo,
      subtitulo: generatedContent.subtitulo || prev.subtitulo,
      cta_texto: generatedContent.boton_texto || generatedContent.boton || prev.cta_texto,
    }));
  }, []);

  const alineacionOptions = [
    { value: 'left', label: 'Izquierda' },
    { value: 'center', label: 'Centro' },
    { value: 'right', label: 'Derecha' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Banner de sugerencia IA para contenido vacío */}
      {contenidoVacio && (
        <AISuggestionBanner
          tipo="hero"
          industria={industria}
          onGenerate={handleAIGenerate}
        />
      )}

      {/* Título con botón IA */}
      <div className="relative">
        <Input
          label={
            <span className="flex items-center gap-2">
              Título principal
              <AIGenerateButton
                tipo="hero"
                campo="titulo"
                industria={industria}
                onGenerate={(text) => setForm({ ...form, titulo: text })}
                size="sm"
              />
            </span>
          }
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Bienvenido a nuestro negocio"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      {/* Subtítulo con botón IA */}
      <div className="relative">
        <Textarea
          label={
            <span className="flex items-center gap-2">
              Subtítulo
              <AIGenerateButton
                tipo="hero"
                campo="subtitulo"
                industria={industria}
                contexto={{ titulo: form.titulo }}
                onGenerate={(text) => setForm({ ...form, subtitulo: text })}
                size="sm"
              />
            </span>
          }
          value={form.subtitulo}
          onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
          placeholder="Una descripción breve de lo que hacemos"
          rows={2}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={
            <span className="flex items-center gap-2">
              Texto del botón
              <AIGenerateButton
                tipo="hero"
                campo="boton"
                industria={industria}
                onGenerate={(text) => setForm({ ...form, cta_texto: text })}
                size="sm"
              />
            </span>
          }
          value={form.cta_texto}
          onChange={(e) => setForm({ ...form, cta_texto: e.target.value })}
          placeholder="Contactar"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Input
          label="URL del botón"
          value={form.cta_url}
          onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
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
        onChange={(e) => setForm({ ...form, imagen_fondo: e.target.value })}
        placeholder="https://ejemplo.com/imagen.jpg"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Alineación"
          value={form.alineacion}
          onChange={(e) => setForm({ ...form, alineacion: e.target.value })}
          options={alineacionOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <div className="flex items-center pt-6">
          <Checkbox
            label="Overlay oscuro"
            checked={form.overlay}
            onChange={(e) => setForm({ ...form, overlay: e.target.checked })}
          />
        </div>
      </div>

      {/* Preview */}
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
            {form.titulo || 'Título del Hero'}
          </h3>
          <p className="text-white/80 text-sm mb-4">
            {form.subtitulo || 'Subtítulo descriptivo'}
          </p>
          {form.cta_texto && (
            <button className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium">
              {form.cta_texto}
            </button>
          )}
        </div>
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

export default HeroEditor;
