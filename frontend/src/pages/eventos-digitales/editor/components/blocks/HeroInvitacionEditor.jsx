/**
 * ====================================================================
 * HERO INVITACION EDITOR
 * ====================================================================
 * Editor del bloque de portada para invitaciones digitales.
 * Incluye título, subtítulo, fecha, imagen de fondo y decoraciones.
 *
 * GUARDADO AUTOMÁTICO: Los cambios de contenido se propagan inmediatamente
 * al store y se guardan después de 2s de inactividad.
 * Las decoraciones guardan directo a plantilla al cambiar.
 *
 * @version 3.0.0 - Decoraciones movidas aquí desde DecorationEditorSection
 * @since 2026-02-03
 */

import { memo, useMemo, useCallback } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Input, Textarea, Select, ToggleSwitch } from '@/components/ui';
import {
  ImageField,
  AlignmentField,
  RangeField,
  ImagePositionField,
  SelectField,
  ColorField,
  BaseAutoSaveEditor,
  useBlockEditor,
} from '@/components/editor-framework';
import {
  BLOCK_DEFAULTS,
  DECORACIONES_ESQUINAS,
  ICONOS_PRINCIPALES,
  EFECTOS_TITULO,
  STICKERS_DISPONIBLES,
} from '../../config';

const MAX_STICKERS = 10;

/**
 * HeroInvitacionEditor - Editor del bloque Hero para Invitaciones
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque
 * @param {Function} props.onChange - Callback para cambios (guardado automático)
 * @param {Object} props.tema - Tema de la invitación
 * @param {Object} props.evento - Datos del evento (nombre, fecha, etc.)
 * @param {Function} props.onOpenUnsplash - Callback para abrir Unsplash
 * @param {Function} props.onUploadImage - Callback para subir imagen
 * @param {Function} props.onUpdatePlantilla - Callback para guardar decoraciones a plantilla
 */
function HeroInvitacionEditor({ contenido, estilos, onChange, tema, evento, onOpenUnsplash, onUploadImage, onUpdatePlantilla }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.hero_invitacion,
    }),
    []
  );

  // Hook para manejo del formulario con guardado automático
  const { form, handleFieldChange } = useBlockEditor(contenido, defaultValues, {
    estilos,
    onChange,
    bloqueIdKey: '_bloqueId',
  });

  // Opciones de altura
  const alturaOptions = [
    { value: 'auto', label: 'Automática' },
    { value: 'full', label: 'Pantalla completa' },
    { value: 'medium', label: 'Media pantalla' },
  ];

  // Handler para cambiar decoración de plantilla (guarda inmediato)
  const handleDecoChange = useCallback((key, value) => {
    if (!onUpdatePlantilla) return;
    onUpdatePlantilla({
      ...evento?.plantilla,
      [key]: value,
    });
  }, [onUpdatePlantilla, evento?.plantilla]);

  // Handler para toggle de sticker
  const handleToggleSticker = useCallback((emoji) => {
    if (!onUpdatePlantilla) return;
    const current = tema?.stickers || [];
    const newStickers = current.includes(emoji)
      ? current.filter((s) => s !== emoji)
      : [...current, emoji].slice(0, MAX_STICKERS);
    onUpdatePlantilla({
      ...evento?.plantilla,
      stickers: newStickers,
    });
  }, [onUpdatePlantilla, evento?.plantilla, tema?.stickers]);

  const handleRemoveSticker = useCallback((emoji) => {
    if (!onUpdatePlantilla) return;
    const current = tema?.stickers || [];
    onUpdatePlantilla({
      ...evento?.plantilla,
      stickers: current.filter((s) => s !== emoji),
    });
  }, [onUpdatePlantilla, evento?.plantilla, tema?.stickers]);

  const stickers = tema?.stickers || [];
  const stickersLlenos = stickers.length >= MAX_STICKERS;

  return (
    <BaseAutoSaveEditor>
      <Input
        label="Título principal"
        value={form.titulo || ''}
        onChange={(e) => handleFieldChange('titulo', e.target.value)}
        placeholder={evento?.nombre || 'Título del Evento'}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Textarea
        label="Subtítulo"
        value={form.subtitulo || ''}
        onChange={(e) => handleFieldChange('subtitulo', e.target.value)}
        placeholder="Mensaje de bienvenida o descripción"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <ImageField
        label="Imagen de fondo"
        value={form.imagen_url || ''}
        onChange={(val) => handleFieldChange('imagen_url', val)}
        onOpenUnsplash={onOpenUnsplash}
        onUpload={onUploadImage}
        fieldKey="imagen_url"
      />

      {form.imagen_url ? (
        <ImagePositionField
          label="Punto focal de la imagen"
          value={form.imagen_posicion || '50% 50%'}
          onChange={(val) => handleFieldChange('imagen_posicion', val)}
          imageUrl={form.imagen_url}
        />
      ) : (
        <ColorField
          label="Color de fondo"
          value={form.color_fondo_hero || tema?.color_secundario || '#fce7f3'}
          onChange={(val) => handleFieldChange('color_fondo_hero', val)}
          hint="Por defecto usa el color secundario del tema"
        />
      )}

      <AlignmentField
        label="Alineación del texto"
        value={form.alineacion || 'center'}
        onChange={(val) => handleFieldChange('alineacion', val)}
      />

      <Select
        label="Altura de la portada"
        value={form.altura || 'full'}
        onChange={(e) => handleFieldChange('altura', e.target.value)}
        options={alturaOptions}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {form.imagen_url && (
        <>
          <SelectField
            label="Tipo de overlay"
            value={form.tipo_overlay || 'uniforme'}
            onChange={(val) => handleFieldChange('tipo_overlay', val)}
            options={[
              { value: 'uniforme', label: 'Uniforme (solo oscurecer)' },
              { value: 'gradiente', label: 'Gradiente (transición al fondo)' },
            ]}
          />

          <ColorField
            label="Color del overlay"
            value={form.color_overlay || '#000000'}
            onChange={(val) => handleFieldChange('color_overlay', val)}
          />

          <RangeField
            label="Opacidad del overlay"
            value={form.imagen_overlay ?? 0.3}
            onChange={(val) => handleFieldChange('imagen_overlay', val)}
            min={0}
            max={1}
            step={0.1}
          />
        </>
      )}

      {evento?.fecha_evento ? (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mostrar fecha del evento
          </span>
          <ToggleSwitch
            enabled={form.mostrar_fecha !== false}
            onChange={(val) => handleFieldChange('mostrar_fecha', val)}
          />
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          No hay fecha configurada en el evento.
        </p>
      )}

      {evento?.hora_evento && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mostrar hora del evento
          </span>
          <ToggleSwitch
            enabled={form.mostrar_hora !== false}
            onChange={(val) => handleFieldChange('mostrar_hora', val)}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Mostrar botones de calendario
        </span>
        <ToggleSwitch
          enabled={form.mostrar_calendario !== false}
          onChange={(val) => handleFieldChange('mostrar_calendario', val)}
        />
      </div>

      {form.mostrar_calendario !== false && (
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
          Los botones de "Google Calendar" y "Descargar .ics" aparecerán en la portada.
          Desactiva esta opción si prefieres usar el bloque "Agregar al Calendario" por separado.
        </p>
      )}

      {/* ========== DECORACIONES DE PORTADA ========== */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Decoraciones de portada
        </h4>

        <div className="space-y-4">
          <SelectField
            label="Decoración de esquinas"
            value={tema?.decoracion_esquinas || 'none'}
            onChange={(val) => handleDecoChange('decoracion_esquinas', val)}
            options={DECORACIONES_ESQUINAS}
          />

          <SelectField
            label="Ícono principal"
            value={tema?.icono_principal || 'none'}
            onChange={(val) => handleDecoChange('icono_principal', val)}
            options={ICONOS_PRINCIPALES}
          />

          <SelectField
            label="Efecto de título"
            value={tema?.efecto_titulo || 'none'}
            onChange={(val) => handleDecoChange('efecto_titulo', val)}
            options={EFECTOS_TITULO}
          />

          {/* Stickers flotantes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stickers flotantes ({stickers.length}/{MAX_STICKERS})
            </label>

            {stickers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {stickers.map((emoji, idx) => (
                  <button
                    key={`${emoji}-${idx}`}
                    onClick={() => handleRemoveSticker(emoji)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
                    title="Quitar sticker"
                  >
                    <span className="text-base">{emoji}</span>
                    <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-8 gap-1">
              {STICKERS_DISPONIBLES.map((emoji) => {
                const isActive = stickers.includes(emoji);
                const isDisabled = stickersLlenos && !isActive;
                return (
                  <button
                    key={emoji}
                    onClick={() => handleToggleSticker(emoji)}
                    disabled={isDisabled}
                    className={`p-1.5 text-lg rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/30 ring-1 ring-primary-400'
                        : isDisabled
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={isActive ? 'Quitar' : isDisabled ? 'Máximo alcanzado' : 'Agregar'}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </BaseAutoSaveEditor>
  );
}

export default memo(HeroInvitacionEditor);
