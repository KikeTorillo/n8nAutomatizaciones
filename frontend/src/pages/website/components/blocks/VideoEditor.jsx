import { useState, useEffect } from 'react';
import { Save, Video } from 'lucide-react';
import {
  Button,
  Checkbox,
  Input,
  Select
} from '@/components/ui';

/**
 * VideoEditor - Editor del bloque Video
 */
function VideoEditor({ contenido, onGuardar, tema, isSaving }) {
  const [form, setForm] = useState({
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

  const handleUrlChange = (url) => {
    let tipo = form.tipo;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      tipo = 'youtube';
    } else if (url.includes('vimeo.com')) {
      tipo = 'vimeo';
    }
    setForm({ ...form, url, tipo });
  };

  const tipoOptions = [
    { value: 'youtube', label: 'YouTube' },
    { value: 'vimeo', label: 'Vimeo' },
    { value: 'directo', label: 'URL directa' },
  ];

  const anchoOptions = [
    { value: 'full', label: 'Ancho completo' },
    { value: 'large', label: 'Grande (80%)' },
    { value: 'medium', label: 'Mediano (60%)' },
  ];

  const alineacionOptions = [
    { value: 'left', label: 'Izquierda' },
    { value: 'center', label: 'Centro' },
    { value: 'right', label: 'Derecha' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Título (opcional)"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Video destacado"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Select
          label="Plataforma"
          value={form.tipo}
          onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          options={tipoOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <Input
        type="url"
        label="URL del video"
        value={form.url}
        onChange={(e) => handleUrlChange(e.target.value)}
        placeholder={
          form.tipo === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
          form.tipo === 'vimeo' ? 'https://vimeo.com/...' :
          'https://ejemplo.com/video.mp4'
        }
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Input
        label="Subtítulo (opcional)"
        value={form.subtitulo}
        onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
        placeholder="Descripción del video"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Ancho"
          value={form.ancho}
          onChange={(e) => setForm({ ...form, ancho: e.target.value })}
          options={anchoOptions}
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

      {/* Opciones de reproducción */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Opciones de reproducción</h4>
        <div className="grid grid-cols-2 gap-4">
          <Checkbox
            label="Autoplay"
            checked={form.autoplay}
            onChange={(e) => setForm({ ...form, autoplay: e.target.checked })}
          />
          <Checkbox
            label="Loop (repetir)"
            checked={form.loop}
            onChange={(e) => setForm({ ...form, loop: e.target.checked })}
          />
          <Checkbox
            label="Silenciado"
            checked={form.muted}
            onChange={(e) => setForm({ ...form, muted: e.target.checked })}
          />
          <Checkbox
            label="Mostrar controles"
            checked={form.controles}
            onChange={(e) => setForm({ ...form, controles: e.target.checked })}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
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
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-3">{form.subtitulo}</p>
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

export default VideoEditor;
