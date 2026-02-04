/**
 * ====================================================================
 * VIDEO EDITOR (COMMON BLOCK)
 * ====================================================================
 * Editor de bloque de video compartido entre editores.
 * Configurable para diferentes opciones según el editor.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo, useState, useEffect, useCallback } from 'react';
import { Video, Play, ExternalLink } from 'lucide-react';
import { Input, Textarea, Select, ToggleSwitch, Checkbox } from '@/components/ui';
import { UrlField } from '../../fields';
import BaseBlockEditor from '../../blocks/BaseBlockEditor';
import BaseAutoSaveEditor from '../../blocks/BaseAutoSaveEditor';
import { useCommonBlockEditor } from '../hooks';
import {
  detectarPlataformaVideo,
  extraerIdYoutube,
  extraerIdVimeo,
  VIDEO_PLATAFORMAS,
} from '../config';

// ========== OPCIONES DE SELECT ==========

const TIPO_OPTIONS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'mp4', label: 'MP4 directo' },
];

const ANCHO_OPTIONS = [
  { value: 'full', label: 'Ancho completo' },
  { value: 'large', label: 'Grande (80%)' },
  { value: 'medium', label: 'Mediano (60%)' },
];

const ALINEACION_OPTIONS = [
  { value: 'left', label: 'Izquierda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Derecha' },
];

// ========== HELPERS ==========

/**
 * Genera URL de embed con parámetros
 */
function generarEmbedUrlConParams(url, tipo, opciones = {}) {
  const { autoplay = false, loop = false, muted = false, controles = true } = opciones;

  if (tipo === 'youtube') {
    const videoId = extraerIdYoutube(url);
    if (!videoId) return '';

    const params = new URLSearchParams();
    if (autoplay) params.set('autoplay', '1');
    if (loop) {
      params.set('loop', '1');
      params.set('playlist', videoId);
    }
    if (muted) params.set('mute', '1');
    if (!controles) params.set('controls', '0');

    const paramStr = params.toString();
    return `https://www.youtube.com/embed/${videoId}${paramStr ? '?' + paramStr : ''}`;
  }

  if (tipo === 'vimeo') {
    const videoId = extraerIdVimeo(url);
    if (!videoId) return '';

    const params = new URLSearchParams();
    if (autoplay) params.set('autoplay', '1');
    if (loop) params.set('loop', '1');
    if (muted) params.set('muted', '1');

    const paramStr = params.toString();
    return `https://player.vimeo.com/video/${videoId}${paramStr ? '?' + paramStr : ''}`;
  }

  return url;
}

// ========== COMPONENTE PRINCIPAL ==========

/**
 * VideoEditor - Editor del bloque de video
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque (solo autoSave mode)
 * @param {Function} props.onChange - Callback para autoSave mode
 * @param {Function} props.onGuardar - Callback para manualSave mode
 * @param {Object} props.tema - Tema del editor
 * @param {boolean} props.isSaving - Estado de guardado (solo manualSave)
 * @param {Object} props.config - Configuración personalizada
 * @param {boolean} props.config.showLoop - Mostrar opción loop
 * @param {boolean} props.config.showMuted - Mostrar opción muted
 * @param {boolean} props.config.showAncho - Mostrar selector de ancho
 * @param {boolean} props.config.showAlineacion - Mostrar selector de alineación
 * @param {Object} props.config.fieldMapping - Mapeo de nombres de campos (invitaciones usa nombres diferentes)
 */
function VideoEditor({
  contenido,
  estilos,
  onChange,
  onGuardar,
  tema,
  isSaving,
  config = {},
}) {
  const {
    showLoop = false,
    showMuted = false,
    showAncho = false,
    showAlineacion = false,
    fieldMapping = null,
  } = config;

  // Determinar modo
  const isAutoSaveMode = Boolean(onChange);

  // Mapear campos si es necesario (invitaciones usa nombres diferentes)
  const mapField = useCallback((standardName) => {
    if (!fieldMapping) return standardName;
    return fieldMapping[standardName] || standardName;
  }, [fieldMapping]);

  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    [mapField('titulo')]: '',
    [mapField('subtitulo')]: '',
    [mapField('url')]: '',
    [mapField('tipo')]: 'youtube',
    autoplay: false,
    [mapField('controles')]: true,
    ...(showLoop && { loop: false }),
    ...(showMuted && { muted: false }),
    ...(showAncho && { ancho: 'full' }),
    ...(showAlineacion && { alineacion: 'center' }),
  }), [mapField, showLoop, showMuted, showAncho, showAlineacion]);

  // Hook unificado
  const { form, setForm, handleFieldChange, handleSubmit, cambios } = useCommonBlockEditor(
    contenido,
    {
      defaultValues,
      estilos,
      onChange,
      onGuardar,
    }
  );

  // Obtener valores usando el mapeo
  const getValue = useCallback((standardName) => {
    const fieldName = mapField(standardName);
    return form[fieldName];
  }, [form, mapField]);

  const setValue = useCallback((standardName, value) => {
    const fieldName = mapField(standardName);
    handleFieldChange(fieldName, value);
  }, [handleFieldChange, mapField]);

  // Estado para URL de embed
  const [embedUrl, setEmbedUrl] = useState('');

  // Generar URL de embed cuando cambian los parámetros
  useEffect(() => {
    const url = getValue('url');
    const tipo = getValue('tipo');
    const controles = getValue('controles');

    if (!url) {
      setEmbedUrl('');
      return;
    }

    const opciones = {
      autoplay: form.autoplay,
      loop: form.loop,
      muted: form.muted,
      controles: controles !== false,
    };

    setEmbedUrl(generarEmbedUrlConParams(url, tipo, opciones));
  }, [getValue, form.autoplay, form.loop, form.muted]);

  // Detectar tipo de video por URL
  const handleUrlChange = useCallback((url) => {
    const tipoDetectado = detectarPlataformaVideo(url);
    const tipoMapeado = tipoDetectado === VIDEO_PLATAFORMAS.LOCAL ? 'mp4' : tipoDetectado;

    setForm(prev => ({
      ...prev,
      [mapField('url')]: url,
      [mapField('tipo')]: tipoMapeado,
    }));
  }, [setForm, mapField]);

  // Submit personalizado que incluye embed_url (solo para website/manualSave)
  const customOnGuardar = useCallback((data) => {
    if (onGuardar) {
      onGuardar({ ...data, embed_url: embedUrl });
    }
  }, [onGuardar, embedUrl]);

  // Colores del tema
  const colorPrimario = tema?.color_primario || tema?.colores?.primario || '#753572';

  // Extraer ID de YouTube para thumbnail
  const youtubeId = getValue('tipo') === 'youtube' ? extraerIdYoutube(getValue('url')) : null;

  // Componente de preview
  const preview = useMemo(() => {
    const titulo = getValue('titulo');
    const subtitulo = getValue('subtitulo');
    const url = getValue('url');
    const tipo = getValue('tipo');
    const ancho = form.ancho || 'full';
    const alineacion = form.alineacion || 'center';

    const anchoClass = showAncho
      ? ancho === 'large' ? 'max-w-4xl' : ancho === 'medium' ? 'max-w-2xl' : ''
      : '';

    const alineacionClass = showAlineacion
      ? alineacion === 'center' ? 'mx-auto' : alineacion === 'right' ? 'ml-auto' : ''
      : '';

    return (
      <div className="p-4">
        {titulo && (
          <h4 className="font-bold text-center mb-2 text-gray-900 dark:text-white">
            {titulo}
          </h4>
        )}

        {subtitulo && (
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
            {subtitulo}
          </p>
        )}

        <div className={`${anchoClass} ${alineacionClass}`}>
          {url ? (
            isAutoSaveMode ? (
              // Preview estático para autoSave (thumbnail)
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                {tipo === 'youtube' && youtubeId ? (
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
              // Preview con iframe para manualSave
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-50">URL no válida</p>
                    </div>
                  </div>
                )}
              </div>
            )
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
      </div>
    );
  }, [getValue, form.ancho, form.alineacion, embedUrl, youtubeId, colorPrimario, isAutoSaveMode, showAncho, showAlineacion]);

  // Campos del formulario
  const formFields = (
    <>
      {/* Título y tipo en grid para manualSave, separados para autoSave */}
      {isAutoSaveMode ? (
        <>
          <Input
            label="Título de sección (opcional)"
            value={getValue('titulo') || ''}
            onChange={(e) => setValue('titulo', e.target.value)}
            placeholder="Nuestra Historia"
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />

          <Textarea
            label="Subtítulo (opcional)"
            value={getValue('subtitulo') || ''}
            onChange={(e) => setValue('subtitulo', e.target.value)}
            placeholder="Un video especial para ti"
            rows={2}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Título (opcional)"
            value={getValue('titulo') || ''}
            onChange={(e) => setValue('titulo', e.target.value)}
            placeholder="Video destacado"
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <Select
            label="Plataforma"
            value={getValue('tipo') || 'youtube'}
            onChange={(e) => setValue('tipo', e.target.value)}
            options={TIPO_OPTIONS}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </div>
      )}

      {/* Configuración del video */}
      <div className={isAutoSaveMode ? "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4" : ""}>
        {isAutoSaveMode && (
          <>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Video className="w-4 h-4" />
              Configuración del video
            </h4>

            <Select
              label="Tipo de video"
              value={getValue('tipo') || 'youtube'}
              onChange={(e) => setValue('tipo', e.target.value)}
              options={TIPO_OPTIONS}
              className="dark:bg-gray-600 dark:border-gray-500"
            />
          </>
        )}

        {isAutoSaveMode ? (
          <UrlField
            label="URL del video"
            value={getValue('url') || ''}
            onChange={handleUrlChange}
            placeholder={
              getValue('tipo') === 'youtube'
                ? 'https://www.youtube.com/watch?v=...'
                : getValue('tipo') === 'vimeo'
                ? 'https://vimeo.com/...'
                : 'https://ejemplo.com/video.mp4'
            }
          />
        ) : (
          <Input
            type="url"
            label="URL del video"
            value={getValue('url') || ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={
              getValue('tipo') === 'youtube'
                ? 'https://www.youtube.com/watch?v=...'
                : getValue('tipo') === 'vimeo'
                ? 'https://vimeo.com/...'
                : 'https://ejemplo.com/video.mp4'
            }
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        )}

        {getValue('url') && getValue('tipo') === 'youtube' && isAutoSaveMode && (
          <a
            href={getValue('url')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Ver video en YouTube
          </a>
        )}
      </div>

      {/* Subtítulo para manualSave */}
      {!isAutoSaveMode && (
        <Input
          label="Subtítulo (opcional)"
          value={getValue('subtitulo') || ''}
          onChange={(e) => setValue('subtitulo', e.target.value)}
          placeholder="Descripción del video"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      )}

      {/* Ancho y alineación (solo website) */}
      {(showAncho || showAlineacion) && (
        <div className="grid grid-cols-2 gap-4">
          {showAncho && (
            <Select
              label="Ancho"
              value={form.ancho || 'full'}
              onChange={(e) => handleFieldChange('ancho', e.target.value)}
              options={ANCHO_OPTIONS}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          )}
          {showAlineacion && (
            <Select
              label="Alineación"
              value={form.alineacion || 'center'}
              onChange={(e) => handleFieldChange('alineacion', e.target.value)}
              options={ALINEACION_OPTIONS}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          )}
        </div>
      )}

      {/* Opciones de reproducción */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Opciones de reproducción
        </h4>

        {isAutoSaveMode ? (
          // Toggles para autoSave
          <>
            <div className="flex items-center justify-between">
              <ToggleSwitch
                checked={form.autoplay || false}
                onChange={(checked) => handleFieldChange('autoplay', checked)}
                label="Reproducción automática"
              />
            </div>

            <div className="flex items-center justify-between">
              <ToggleSwitch
                checked={getValue('controles') !== false}
                onChange={(checked) => setValue('controles', checked)}
                label="Mostrar controles"
              />
            </div>
          </>
        ) : (
          // Checkboxes para manualSave
          <div className="grid grid-cols-2 gap-4">
            <Checkbox
              label="Autoplay"
              checked={form.autoplay || false}
              onChange={(e) => handleFieldChange('autoplay', e.target.checked)}
            />
            {showLoop && (
              <Checkbox
                label="Loop (repetir)"
                checked={form.loop || false}
                onChange={(e) => handleFieldChange('loop', e.target.checked)}
              />
            )}
            {showMuted && (
              <Checkbox
                label="Silenciado"
                checked={form.muted || false}
                onChange={(e) => handleFieldChange('muted', e.target.checked)}
              />
            )}
            <Checkbox
              label="Mostrar controles"
              checked={getValue('controles') !== false}
              onChange={(e) => setValue('controles', e.target.checked)}
            />
          </div>
        )}

        {form.autoplay && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Nota: Algunos navegadores bloquean la reproducción automática con sonido
          </p>
        )}
      </div>
    </>
  );

  // Renderizar según el modo
  if (isAutoSaveMode) {
    return (
      <BaseAutoSaveEditor preview={preview}>
        {formFields}
      </BaseAutoSaveEditor>
    );
  }

  return (
    <BaseBlockEditor
      tipo="video"
      mostrarAIBanner={false}
      cambios={cambios}
      handleSubmit={handleSubmit}
      onGuardar={customOnGuardar}
      isSaving={isSaving}
      preview={preview}
    >
      {formFields}
    </BaseBlockEditor>
  );
}

// ========== EXPORTS ==========

export default memo(VideoEditor);

// Configuraciones predefinidas para cada editor
export const VIDEO_CONFIG_INVITACIONES = {
  showLoop: false,
  showMuted: false,
  showAncho: false,
  showAlineacion: false,
  fieldMapping: {
    titulo: 'titulo_seccion',
    subtitulo: 'subtitulo_seccion',
    url: 'video_url',
    tipo: 'video_tipo',
    controles: 'mostrar_controles',
  },
};

export const VIDEO_CONFIG_WEBSITE = {
  showLoop: true,
  showMuted: true,
  showAncho: true,
  showAlineacion: true,
  fieldMapping: null,
};
