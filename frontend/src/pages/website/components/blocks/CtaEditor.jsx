import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';

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
    estilo: contenido.estilo || 'primario', // primario, secundario, outline
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título
        </label>
        <input
          type="text"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="¿Listo para empezar?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subtítulo (opcional)
        </label>
        <textarea
          value={form.subtitulo}
          onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
          placeholder="Contáctanos hoy y recibe una consulta gratuita"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Texto del botón principal
          </label>
          <input
            type="text"
            value={form.boton_texto}
            onChange={(e) => setForm({ ...form, boton_texto: e.target.value })}
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
            value={form.boton_url}
            onChange={(e) => setForm({ ...form, boton_url: e.target.value })}
            placeholder="/contacto"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Botón secundario (opcional)
          </label>
          <input
            type="text"
            value={form.boton_secundario_texto}
            onChange={(e) => setForm({ ...form, boton_secundario_texto: e.target.value })}
            placeholder="Más información"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL secundario
          </label>
          <input
            type="text"
            value={form.boton_secundario_url}
            onChange={(e) => setForm({ ...form, boton_secundario_url: e.target.value })}
            placeholder="/servicios"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estilo de fondo
          </label>
          <select
            value={form.estilo}
            onChange={(e) => setForm({ ...form, estilo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="primario">Color primario</option>
            <option value="secundario">Color secundario</option>
            <option value="gradiente">Gradiente</option>
            <option value="claro">Fondo claro</option>
          </select>
        </div>
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

export default CtaEditor;
