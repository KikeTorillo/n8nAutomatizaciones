import { useState, useEffect } from 'react';
import { Save, Image, Loader2 } from 'lucide-react';

/**
 * HeroEditor - Editor del bloque Hero
 */
function HeroEditor({ contenido, onGuardar, tema, isSaving }) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título principal
        </label>
        <input
          type="text"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Bienvenido a nuestro negocio"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subtítulo
        </label>
        <textarea
          value={form.subtitulo}
          onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
          placeholder="Una descripción breve de lo que hacemos"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Texto del botón
          </label>
          <input
            type="text"
            value={form.cta_texto}
            onChange={(e) => setForm({ ...form, cta_texto: e.target.value })}
            placeholder="Contactar"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL del botón
          </label>
          <input
            type="text"
            value={form.cta_url}
            onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
            placeholder="/contacto"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Image className="w-4 h-4 inline mr-1" />
          URL imagen de fondo
        </label>
        <input
          type="url"
          value={form.imagen_fondo}
          onChange={(e) => setForm({ ...form, imagen_fondo: e.target.value })}
          placeholder="https://ejemplo.com/imagen.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alineación
          </label>
          <select
            value={form.alineacion}
            onChange={(e) => setForm({ ...form, alineacion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="left">Izquierda</option>
            <option value="center">Centro</option>
            <option value="right">Derecha</option>
          </select>
        </div>
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.overlay}
              onChange={(e) => setForm({ ...form, overlay: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Overlay oscuro</span>
          </label>
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
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar cambios
          </button>
        </div>
      )}
    </form>
  );
}

export default HeroEditor;
