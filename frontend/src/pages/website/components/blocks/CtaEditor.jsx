import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

/**
 * CtaEditor - Editor del bloque Call To Action
 */
function CtaEditor({ contenido, onGuardar, tema, isSaving }) {
  const [form, setForm] = useState({
    titulo: contenido.titulo || '¿Listo para empezar?',
    subtitulo: contenido.subtitulo || '',
    boton_texto: contenido.boton_texto || 'Contactar',
    boton_url: contenido.boton_url || '',
    boton_secundario_texto: contenido.boton_secundario_texto || '',
    boton_secundario_url: contenido.boton_secundario_url || '',
    estilo: contenido.estilo || 'primario',
    alineacion: contenido.alineacion || 'center',
  });

  const [cambios, setCambios] = useState(false);

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      titulo: contenido.titulo || '¿Listo para empezar?',
      subtitulo: contenido.subtitulo || '',
      boton_texto: contenido.boton_texto || 'Contactar',
      boton_url: contenido.boton_url || '',
      boton_secundario_texto: contenido.boton_secundario_texto || '',
      boton_secundario_url: contenido.boton_secundario_url || '',
      estilo: contenido.estilo || 'primario',
      alineacion: contenido.alineacion || 'center',
    }));
  }, [form, contenido]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(form);
    setCambios(false);
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Título"
        value={form.titulo}
        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
        placeholder="¿Listo para empezar?"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Textarea
        label="Subtítulo (opcional)"
        value={form.subtitulo}
        onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
        placeholder="Contáctanos hoy y recibe una consulta gratuita"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Texto del botón principal"
          value={form.boton_texto}
          onChange={(e) => setForm({ ...form, boton_texto: e.target.value })}
          placeholder="Contactar"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Input
          label="URL del botón"
          value={form.boton_url}
          onChange={(e) => setForm({ ...form, boton_url: e.target.value })}
          placeholder="/contacto"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Botón secundario (opcional)"
          value={form.boton_secundario_texto}
          onChange={(e) => setForm({ ...form, boton_secundario_texto: e.target.value })}
          placeholder="Más información"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Input
          label="URL secundario"
          value={form.boton_secundario_url}
          onChange={(e) => setForm({ ...form, boton_secundario_url: e.target.value })}
          placeholder="/servicios"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Estilo de fondo"
          value={form.estilo}
          onChange={(e) => setForm({ ...form, estilo: e.target.value })}
          options={estiloOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Select
          label="Alineación"
          value={form.alineacion}
          onChange={(e) => setForm({ ...form, alineacion: e.target.value })}
          options={alineacionOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      {/* Preview */}
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

export default CtaEditor;
