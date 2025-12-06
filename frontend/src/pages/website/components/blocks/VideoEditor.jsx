import { useState, useEffect } from 'react';
import { Save, Video, Play, Loader2 } from 'lucide-react';

/**
 * VideoEditor - Editor del bloque Video
 */
function VideoEditor({ contenido, onGuardar, tema, isSaving }) {
  const [form, setForm] = useState({
    titulo: contenido.titulo || '',
    subtitulo: contenido.subtitulo || '',
    url: contenido.url || '',
    tipo: contenido.tipo || 'youtube', // youtube, vimeo, directo
    autoplay: contenido.autoplay || false,
    loop: contenido.loop || false,
    muted: contenido.muted || false,
    controles: contenido.controles !== false,
    ancho: contenido.ancho || 'full', // full, large, medium
    alineacion: contenido.alineacion || 'center',
  });

  const [cambios, setCambios] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      titulo: contenido.titulo || '',
      subtitulo: contenido.subtitulo || '',
      url: contenido.url || '',
      tipo: contenido.tipo || 'youtube',
      autoplay: contenido.autoplay || false,
      loop: contenido.loop || false,
      muted: contenido.muted || false,
      controles: contenido.controles !== false,
      ancho: contenido.ancho || 'full',
      alineacion: contenido.alineacion || 'center',
    }));
  }, [form, contenido]);

  // Generar URL de embed
  useEffect(() => {
    if (!form.url) {
      setEmbedUrl('');
      return;
    }

    let url = '';
    if (form.tipo === 'youtube') {
      // Extraer ID de YouTube
      const match = form.url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (match) {
        url = `https://www.youtube.com/embed/${match[1]}`;
        const params = [];
        if (form.autoplay) params.push('autoplay=1');
        if (form.loop) params.push(`loop=1&playlist=${match[1]}`);
        if (form.muted) params.push('mute=1');
        if (!form.controles) params.push('controls=0');
        if (params.length > 0) url += '?' + params.join('&');
      }
    } else if (form.tipo === 'vimeo') {
      // Extraer ID de Vimeo
      const match = form.url.match(/vimeo\.com\/(\d+)/);
      if (match) {
        url = `https://player.vimeo.com/video/${match[1]}`;
        const params = [];
        if (form.autoplay) params.push('autoplay=1');
        if (form.loop) params.push('loop=1');
        if (form.muted) params.push('muted=1');
        if (params.length > 0) url += '?' + params.join('&');
      }
    } else {
      url = form.url;
    }

    setEmbedUrl(url);
  }, [form.url, form.tipo, form.autoplay, form.loop, form.muted, form.controles]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar({ ...form, embed_url: embedUrl });
    setCambios(false);
  };

  // Detectar tipo de video automáticamente
  const handleUrlChange = (url) => {
    let tipo = form.tipo;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      tipo = 'youtube';
    } else if (url.includes('vimeo.com')) {
      tipo = 'vimeo';
    }
    setForm({ ...form, url, tipo });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título (opcional)
          </label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Video destacado"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plataforma
          </label>
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
            <option value="directo">URL directa</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL del video
        </label>
        <input
          type="url"
          value={form.url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={
            form.tipo === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
            form.tipo === 'vimeo' ? 'https://vimeo.com/...' :
            'https://ejemplo.com/video.mp4'
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subtítulo (opcional)
        </label>
        <input
          type="text"
          value={form.subtitulo}
          onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
          placeholder="Descripción del video"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ancho
          </label>
          <select
            value={form.ancho}
            onChange={(e) => setForm({ ...form, ancho: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="full">Ancho completo</option>
            <option value="large">Grande (80%)</option>
            <option value="medium">Mediano (60%)</option>
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

      {/* Opciones de reproducción */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Opciones de reproducción</h4>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.autoplay}
              onChange={(e) => setForm({ ...form, autoplay: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Autoplay</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.loop}
              onChange={(e) => setForm({ ...form, loop: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Loop (repetir)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.muted}
              onChange={(e) => setForm({ ...form, muted: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Silenciado</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.controles}
              onChange={(e) => setForm({ ...form, controles: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Mostrar controles</span>
          </label>
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 rounded-lg p-4">
        {form.titulo && (
          <h4 className="font-bold text-center mb-3" style={{ color: tema?.colores?.texto }}>
            {form.titulo}
          </h4>
        )}
        <div
          className={`
            ${form.ancho === 'large' ? 'max-w-4xl' : form.ancho === 'medium' ? 'max-w-2xl' : ''}
            ${form.alineacion === 'center' ? 'mx-auto' : form.alineacion === 'right' ? 'ml-auto' : ''}
          `}
        >
          {embedUrl ? (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-50">Ingresa una URL para previsualizar</p>
              </div>
            </div>
          )}
        </div>
        {form.subtitulo && (
          <p className="text-sm text-center text-gray-500 mt-3">{form.subtitulo}</p>
        )}
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

export default VideoEditor;
