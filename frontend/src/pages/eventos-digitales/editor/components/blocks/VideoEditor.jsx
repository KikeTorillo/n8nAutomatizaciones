/**
 * ====================================================================
 * VIDEO EDITOR (INVITACIONES)
 * ====================================================================
 * Editor del bloque de video para invitaciones digitales.
 *
 * GUARDADO AUTOMÁTICO: Los cambios se propagan inmediatamente al store
 * y se guardan automáticamente después de 2s de inactividad.
 *
 * @version 2.0.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Migrado a guardado automático
 */

import { memo, useMemo } from 'react';
import { Video, Play, ExternalLink } from 'lucide-react';
import { Input, Textarea, Select, ToggleSwitch } from '@/components/ui';
import { UrlField, BaseAutoSaveEditor } from '@/components/editor-framework';
import { useInvitacionBlockEditor } from '../../hooks';
import { BLOCK_DEFAULTS } from '../../config';

/**
 * VideoEditor - Editor del bloque de video
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque
 * @param {Function} props.onChange - Callback para cambios (guardado automático)
 * @param {Object} props.tema - Tema de la invitación
 */
function VideoEditor({ contenido, estilos, onChange, tema }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.video,
    }),
    []
  );

  // Hook para manejo del formulario con guardado automático
  const { form, handleFieldChange } = useInvitacionBlockEditor(
    contenido,
    estilos,
    defaultValues,
    onChange
  );

  // Opciones de tipo de video
  const tipoOptions = [
    { value: 'youtube', label: 'YouTube' },
    { value: 'vimeo', label: 'Vimeo' },
    { value: 'mp4', label: 'MP4 directo' },
  ];

  // Extraer ID de YouTube
  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/
    );
    return match ? match[1] : null;
  };

  // Componente de preview
  const preview = useMemo(() => {
    const colorPrimario = tema?.color_primario || '#753572';
    const youtubeId = form.video_tipo === 'youtube' ? getYouTubeId(form.video_url) : null;

    return (
      <div className="p-4">
        {form.titulo_seccion && (
          <h4 className="font-bold text-center mb-2 text-gray-900 dark:text-white">
            {form.titulo_seccion}
          </h4>
        )}

        {form.subtitulo_seccion && (
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
            {form.subtitulo_seccion}
          </p>
        )}

        {/* Preview del video */}
        {form.video_url ? (
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            {form.video_tipo === 'youtube' && youtubeId ? (
              <img
                src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <Video className="w-12 h-12 text-gray-600" />
              </div>
            )}
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colorPrimario }}
              >
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Video className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Agrega un video
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }, [form, tema?.color_primario]);

  return (
    <BaseAutoSaveEditor preview={preview}>
      <Input
        label="Título de sección (opcional)"
        value={form.titulo_seccion || ''}
        onChange={(e) => handleFieldChange('titulo_seccion', e.target.value)}
        placeholder="Nuestra Historia"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Textarea
        label="Subtítulo (opcional)"
        value={form.subtitulo_seccion || ''}
        onChange={(e) => handleFieldChange('subtitulo_seccion', e.target.value)}
        placeholder="Un video especial para ti"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Configuración del video */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Video className="w-4 h-4" />
          Configuración del video
        </h4>

        <Select
          label="Tipo de video"
          value={form.video_tipo || 'youtube'}
          onChange={(e) => handleFieldChange('video_tipo', e.target.value)}
          options={tipoOptions}
          className="dark:bg-gray-600 dark:border-gray-500"
        />

        <UrlField
          label="URL del video"
          value={form.video_url || ''}
          onChange={(val) => handleFieldChange('video_url', val)}
          placeholder={
            form.video_tipo === 'youtube'
              ? 'https://www.youtube.com/watch?v=...'
              : form.video_tipo === 'vimeo'
              ? 'https://vimeo.com/...'
              : 'https://ejemplo.com/video.mp4'
          }
        />

        {form.video_url && form.video_tipo === 'youtube' && (
          <a
            href={form.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Ver video en YouTube
          </a>
        )}
      </div>

      {/* Opciones de reproducción */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Opciones de reproducción
        </h4>

        <div className="flex items-center justify-between">
          <ToggleSwitch
            checked={form.autoplay || false}
            onChange={(checked) => handleFieldChange('autoplay', checked)}
            label="Reproducción automática"
          />
        </div>

        <div className="flex items-center justify-between">
          <ToggleSwitch
            checked={form.mostrar_controles !== false}
            onChange={(checked) => handleFieldChange('mostrar_controles', checked)}
            label="Mostrar controles"
          />
        </div>

        {form.autoplay && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Nota: Algunos navegadores bloquean la reproducción automática con sonido
          </p>
        )}
      </div>
    </BaseAutoSaveEditor>
  );
}

export default memo(VideoEditor);
