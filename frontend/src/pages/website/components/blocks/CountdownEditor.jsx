import { useState, useEffect, useCallback } from 'react';
import { Save, Clock, Calendar } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  ToggleSwitch
} from '@/components/ui';
import { AIGenerateButton, AISuggestionBanner } from '../AIGenerator';

/**
 * CountdownEditor - Editor del bloque Countdown (Contador Regresivo)
 */
function CountdownEditor({ contenido, onGuardar, tema, isSaving, industria = 'default' }) {
  // Default date: 30 days from now
  const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const defaultDateStr = defaultDate.toISOString().slice(0, 16);

  const [form, setForm] = useState({
    titulo: contenido.titulo || 'Gran Inauguracion',
    subtitulo: contenido.subtitulo || 'No te pierdas este evento especial',
    fecha_objetivo: contenido.fecha_objetivo ? contenido.fecha_objetivo.slice(0, 16) : defaultDateStr,
    mostrar_dias: contenido.mostrar_dias !== false,
    mostrar_horas: contenido.mostrar_horas !== false,
    mostrar_minutos: contenido.mostrar_minutos !== false,
    mostrar_segundos: contenido.mostrar_segundos !== false,
    texto_finalizado: contenido.texto_finalizado || 'El evento ha comenzado!',
    accion_finalizado: contenido.accion_finalizado || 'ocultar',
    fondo_tipo: contenido.fondo_tipo || 'color',
    fondo_valor: contenido.fondo_valor || '#1F2937',
    color_texto: contenido.color_texto || '#FFFFFF',
    boton_texto: contenido.boton_texto || '',
    boton_url: contenido.boton_url || '',
  });

  const [cambios, setCambios] = useState(false);

  const esVacio = !contenido.titulo && !contenido.fecha_objetivo;

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      titulo: contenido.titulo || 'Gran Inauguracion',
      subtitulo: contenido.subtitulo || 'No te pierdas este evento especial',
      fecha_objetivo: contenido.fecha_objetivo ? contenido.fecha_objetivo.slice(0, 16) : defaultDateStr,
      mostrar_dias: contenido.mostrar_dias !== false,
      mostrar_horas: contenido.mostrar_horas !== false,
      mostrar_minutos: contenido.mostrar_minutos !== false,
      mostrar_segundos: contenido.mostrar_segundos !== false,
      texto_finalizado: contenido.texto_finalizado || 'El evento ha comenzado!',
      accion_finalizado: contenido.accion_finalizado || 'ocultar',
      fondo_tipo: contenido.fondo_tipo || 'color',
      fondo_valor: contenido.fondo_valor || '#1F2937',
      color_texto: contenido.color_texto || '#FFFFFF',
      boton_texto: contenido.boton_texto || '',
      boton_url: contenido.boton_url || '',
    }));
  }, [form, contenido, defaultDateStr]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert datetime-local to ISO string
    const formToSave = {
      ...form,
      fecha_objetivo: new Date(form.fecha_objetivo).toISOString(),
    };
    onGuardar(formToSave);
    setCambios(false);
  };

  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo: generatedContent.titulo || prev.titulo,
      subtitulo: generatedContent.subtitulo || prev.subtitulo,
    }));
  }, []);

  const fondoOptions = [
    { value: 'color', label: 'Color solido' },
    { value: 'gradiente', label: 'Gradiente' },
    { value: 'imagen', label: 'Imagen de fondo' },
  ];

  const accionOptions = [
    { value: 'ocultar', label: 'Ocultar bloque' },
    { value: 'mostrar_mensaje', label: 'Mostrar mensaje' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {esVacio && (
        <AISuggestionBanner
          tipo="countdown"
          industria={industria}
          onGenerate={handleAIGenerate}
        />
      )}

      {/* Contenido principal */}
      <Input
        label={
          <span className="flex items-center gap-2">
            Titulo del evento
            <AIGenerateButton
              tipo="countdown"
              campo="titulo"
              industria={industria}
              onGenerate={(text) => setForm({ ...form, titulo: text })}
              size="sm"
            />
          </span>
        }
        value={form.titulo}
        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
        placeholder="Gran Inauguracion"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Input
        label="Subtitulo"
        value={form.subtitulo}
        onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
        placeholder="No te pierdas este evento especial"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Fecha objetivo */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-medium text-blue-700 dark:text-blue-300">Fecha y hora objetivo</span>
        </div>
        <Input
          type="datetime-local"
          value={form.fecha_objetivo}
          onChange={(e) => setForm({ ...form, fecha_objetivo: e.target.value })}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      {/* Unidades a mostrar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="flex flex-col items-center">
          <ToggleSwitch
            checked={form.mostrar_dias}
            onChange={(checked) => setForm({ ...form, mostrar_dias: checked })}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dias</span>
        </div>
        <div className="flex flex-col items-center">
          <ToggleSwitch
            checked={form.mostrar_horas}
            onChange={(checked) => setForm({ ...form, mostrar_horas: checked })}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Horas</span>
        </div>
        <div className="flex flex-col items-center">
          <ToggleSwitch
            checked={form.mostrar_minutos}
            onChange={(checked) => setForm({ ...form, mostrar_minutos: checked })}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minutos</span>
        </div>
        <div className="flex flex-col items-center">
          <ToggleSwitch
            checked={form.mostrar_segundos}
            onChange={(checked) => setForm({ ...form, mostrar_segundos: checked })}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Segundos</span>
        </div>
      </div>

      {/* Al finalizar */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Al finalizar"
          value={form.accion_finalizado}
          onChange={(e) => setForm({ ...form, accion_finalizado: e.target.value })}
          options={accionOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Input
          label="Mensaje de finalizacion"
          value={form.texto_finalizado}
          onChange={(e) => setForm({ ...form, texto_finalizado: e.target.value })}
          placeholder="El evento ha comenzado!"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      {/* Apariencia */}
      <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Apariencia</h4>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo de fondo"
            value={form.fondo_tipo}
            onChange={(e) => setForm({ ...form, fondo_tipo: e.target.value })}
            options={fondoOptions}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <Input
            label={form.fondo_tipo === 'imagen' ? 'URL de imagen' : 'Color de fondo'}
            type={form.fondo_tipo === 'imagen' ? 'url' : 'color'}
            value={form.fondo_valor}
            onChange={(e) => setForm({ ...form, fondo_valor: e.target.value })}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </div>

        <div className="mt-3">
          <Input
            label="Color de texto"
            type="color"
            value={form.color_texto}
            onChange={(e) => setForm({ ...form, color_texto: e.target.value })}
            className="w-20"
          />
        </div>
      </div>

      {/* Boton CTA opcional */}
      <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Boton (opcional)</h4>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Texto del boton"
            value={form.boton_texto}
            onChange={(e) => setForm({ ...form, boton_texto: e.target.value })}
            placeholder="Registrarse"
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <Input
            label="URL del boton"
            value={form.boton_url}
            onChange={(e) => setForm({ ...form, boton_url: e.target.value })}
            placeholder="#contacto"
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Preview */}
      <div
        className="rounded-lg p-6 text-center"
        style={{ backgroundColor: form.fondo_tipo === 'color' ? form.fondo_valor : '#1F2937' }}
      >
        <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: tema?.color_primario || '#753572' }} />
        <h4 className="font-bold text-lg mb-1" style={{ color: form.color_texto }}>
          {form.titulo || 'Titulo'}
        </h4>
        <p className="text-sm opacity-80" style={{ color: form.color_texto }}>
          {form.subtitulo || 'Subtitulo'}
        </p>
        <div className="flex justify-center gap-4 mt-4">
          {form.mostrar_dias && <div className="text-2xl font-bold" style={{ color: form.color_texto }}>00</div>}
          {form.mostrar_horas && <div className="text-2xl font-bold" style={{ color: form.color_texto }}>00</div>}
          {form.mostrar_minutos && <div className="text-2xl font-bold" style={{ color: form.color_texto }}>00</div>}
          {form.mostrar_segundos && <div className="text-2xl font-bold" style={{ color: form.color_texto }}>00</div>}
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

export default CountdownEditor;
