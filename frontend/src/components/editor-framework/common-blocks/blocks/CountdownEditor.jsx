/**
 * ====================================================================
 * COUNTDOWN EDITOR (COMMON BLOCK)
 * ====================================================================
 * Editor de bloque de cuenta regresiva compartido entre editores.
 * Configurable para diferentes estilos y opciones según el editor.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo, useCallback } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { Input, Select, ToggleSwitch } from '@/components/ui';
import { DateTimeField } from '../../fields';
import BaseBlockEditor from '../../blocks/BaseBlockEditor';
import BaseAutoSaveEditor from '../../blocks/BaseAutoSaveEditor';
import { useCommonBlockEditor } from '../hooks';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

// ========== OPCIONES DE SELECT ==========

const ESTILO_OPTIONS_MINIMAL = [
  { value: 'cajas', label: 'Cajas separadas' },
  { value: 'inline', label: 'En línea' },
  { value: 'circular', label: 'Circular' },
];

const ACCION_OPTIONS = [
  { value: 'ocultar', label: 'Ocultar bloque' },
  { value: 'mostrar_mensaje', label: 'Mostrar mensaje' },
];

const FONDO_OPTIONS = [
  { value: 'color', label: 'Color sólido' },
  { value: 'gradiente', label: 'Gradiente' },
  { value: 'imagen', label: 'Imagen de fondo' },
];

// ========== HELPERS ==========

/**
 * Calcula el tiempo restante hasta una fecha
 */
function calcularTiempoRestante(fechaObjetivo) {
  if (!fechaObjetivo) return null;

  const fecha = new Date(fechaObjetivo);
  const ahora = new Date();
  const diff = fecha - ahora;

  if (diff <= 0) return null;

  return {
    dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutos: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    segundos: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

/**
 * Genera fecha por defecto (30 días en el futuro)
 */
function generarFechaDefault() {
  const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return defaultDate.toISOString().slice(0, 16);
}

// ========== COMPONENTE PRINCIPAL ==========

/**
 * CountdownEditor - Editor del bloque de cuenta regresiva
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque (solo autoSave mode)
 * @param {Function} props.onChange - Callback para autoSave mode
 * @param {Function} props.onGuardar - Callback para manualSave mode
 * @param {Object} props.tema - Tema del editor
 * @param {boolean} props.isSaving - Estado de guardado (solo manualSave)
 * @param {Object} props.evento - Datos del evento (invitaciones) para fecha fallback
 * @param {string} props.industria - Industria para IA (solo website)
 * @param {Object} props.config - Configuración personalizada
 * @param {boolean} props.config.showSubtitulo - Mostrar campo de subtítulo
 * @param {boolean} props.config.showEstiloVisual - Mostrar selector de estilo visual (invitaciones)
 * @param {boolean} props.config.showUnidadesIndividuales - Mostrar toggles individuales de unidades
 * @param {boolean} props.config.showMostrarSegundos - Mostrar toggle único de segundos
 * @param {boolean} props.config.showApariencia - Mostrar sección de apariencia (fondo/colores)
 * @param {boolean} props.config.showBotonCTA - Mostrar campos de botón CTA
 * @param {boolean} props.config.showAccionFinalizado - Mostrar selector de acción al finalizar
 * @param {Array} props.config.estiloOptions - Opciones de estilo visual
 * @param {React.Component} props.AIBannerComponent - Componente de banner de IA (slot)
 * @param {React.Component} props.AIGenerateButtonComponent - Componente de botón de IA (slot)
 */
function CountdownEditor({
  contenido,
  estilos,
  onChange,
  onGuardar,
  tema,
  isSaving,
  evento,
  industria = 'default',
  config = {},
  AIBannerComponent,
  AIGenerateButtonComponent,
}) {
  const {
    showSubtitulo = false,
    showEstiloVisual = false,
    showUnidadesIndividuales = false,
    showMostrarSegundos = false,
    showApariencia = false,
    showBotonCTA = false,
    showAccionFinalizado = false,
    estiloOptions = ESTILO_OPTIONS_MINIMAL,
  } = config;

  // Determinar modo
  const isAutoSaveMode = Boolean(onChange);

  // Determinar si mostrar IA (solo website y si hay componentes)
  const showAI = Boolean(AIBannerComponent || AIGenerateButtonComponent);

  // Default date
  const defaultDateStr = useMemo(() => generarFechaDefault(), []);

  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    titulo: isAutoSaveMode ? 'Faltan' : 'Gran Inauguración',
    ...(showSubtitulo && { subtitulo: 'No te pierdas este evento especial' }),
    // fecha_objetivo solo para website (manualSave). En invitaciones usa evento.fecha_evento
    ...(!isAutoSaveMode && { fecha_objetivo: defaultDateStr }),
    texto_finalizado: '¡Llegó el gran día!',
    ...(showEstiloVisual && { estilo: 'cajas' }),
    ...(showMostrarSegundos && { mostrar_segundos: false }),
    ...(showUnidadesIndividuales && {
      mostrar_dias: true,
      mostrar_horas: true,
      mostrar_minutos: true,
      mostrar_segundos: true,
    }),
    ...(showAccionFinalizado && { accion_finalizado: 'ocultar' }),
    ...(showApariencia && {
      fondo_tipo: 'color',
      fondo_valor: THEME_FALLBACK_COLORS.common.fondoOscuro,
      color_texto: THEME_FALLBACK_COLORS.common.textoBlanco,
    }),
    ...(showBotonCTA && {
      boton_texto: '',
      boton_url: '',
    }),
  }), [defaultDateStr, isAutoSaveMode, showSubtitulo, showEstiloVisual, showMostrarSegundos, showUnidadesIndividuales, showAccionFinalizado, showApariencia, showBotonCTA]);

  // Pre-procesar contenido para fecha_objetivo (solo website, no invitaciones)
  const processedContenido = useMemo(() => ({
    ...contenido,
    // Solo procesar fecha_objetivo en website mode (manualSave)
    ...(!isAutoSaveMode && contenido.fecha_objetivo && {
      fecha_objetivo: contenido.fecha_objetivo.slice(0, 16),
    }),
  }), [contenido, isAutoSaveMode]);

  // Hook unificado
  const {
    form,
    setForm,
    handleFieldChange,
    handleSubmit,
    cambios,
  } = useCommonBlockEditor(processedContenido, {
    defaultValues,
    estilos,
    onChange,
    onGuardar,
  });

  // Fecha objetivo: en invitaciones (autoSave) siempre usa evento.fecha_evento
  // En website (manualSave) usa form.fecha_objetivo
  const fechaObjetivoFinal = useMemo(() => {
    if (isAutoSaveMode) {
      // Invitaciones: siempre usar fecha del evento
      return evento?.fecha_evento || defaultDateStr;
    }
    // Website: usar fecha del formulario
    return form.fecha_objetivo || defaultDateStr;
  }, [isAutoSaveMode, form.fecha_objetivo, evento?.fecha_evento, defaultDateStr]);

  // Calcular tiempo restante para preview
  const tiempoRestante = useMemo(() =>
    calcularTiempoRestante(fechaObjetivoFinal),
  [fechaObjetivoFinal]);

  // Verificar si el contenido está vacío (para mostrar banner de IA)
  // En invitaciones no verificamos fecha_objetivo porque viene del evento
  const esVacio = isAutoSaveMode ? !contenido.titulo : !contenido.titulo && !contenido.fecha_objetivo;

  // Callback para generación de IA de bloque completo
  const handleAIGenerate = useCallback((generatedContent) => {
    setForm(prev => ({
      ...prev,
      titulo: generatedContent.titulo || prev.titulo,
      ...(showSubtitulo && { subtitulo: generatedContent.subtitulo || prev.subtitulo }),
    }));
  }, [setForm, showSubtitulo]);

  // Submit personalizado que convierte fecha a ISO (solo para website/manualSave)
  const customOnGuardar = useCallback((data) => {
    if (onGuardar) {
      const formToSave = {
        ...data,
        fecha_objetivo: data.fecha_objetivo ? new Date(data.fecha_objetivo).toISOString() : null,
      };
      onGuardar(formToSave);
    }
  }, [onGuardar]);

  // Colores del tema
  const colorPrimario = tema?.color_primario || tema?.colores?.primario || THEME_FALLBACK_COLORS.invitacion.primario;

  // Componente de preview
  const preview = useMemo(() => {
    // Preview para invitaciones (autoSave)
    if (isAutoSaveMode) {
      const estilo = form.estilo || 'cajas';

      const renderUnidad = (valor, label) => (
        <div
          className={`${
            estilo === 'cajas'
              ? 'p-3 rounded-lg bg-gray-100 dark:bg-gray-700'
              : estilo === 'circular'
              ? 'w-16 h-16 rounded-full flex flex-col items-center justify-center'
              : ''
          }`}
          style={
            estilo === 'circular'
              ? { border: `2px solid ${colorPrimario}` }
              : {}
          }
        >
          <span
            className="text-2xl font-bold block"
            style={{ color: colorPrimario }}
          >
            {valor}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        </div>
      );

      return (
        <div className="p-6 text-center">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {form.titulo || 'Faltan'}
          </h4>

          {tiempoRestante ? (
            <div
              className={`${
                estilo === 'inline'
                  ? 'flex items-center justify-center gap-2'
                  : `grid grid-cols-${form.mostrar_segundos ? '4' : '3'} gap-3`
              }`}
            >
              {renderUnidad(tiempoRestante.dias, 'días')}
              {estilo === 'inline' && <span className="text-gray-400">:</span>}
              {renderUnidad(tiempoRestante.horas, 'hrs')}
              {estilo === 'inline' && <span className="text-gray-400">:</span>}
              {renderUnidad(tiempoRestante.minutos, 'min')}
              {form.mostrar_segundos && (
                <>
                  {estilo === 'inline' && <span className="text-gray-400">:</span>}
                  {renderUnidad(tiempoRestante.segundos, 'seg')}
                </>
              )}
            </div>
          ) : (
            <p className="text-lg font-medium" style={{ color: colorPrimario }}>
              {form.texto_finalizado || '¡Llegó el gran día!'}
            </p>
          )}
        </div>
      );
    }

    // Preview para website (manualSave)
    return (
      <div
        className="rounded-lg p-6 text-center"
        style={{ backgroundColor: form.fondo_tipo === 'color' ? form.fondo_valor : THEME_FALLBACK_COLORS.common.fondoOscuro }}
      >
        <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: colorPrimario }} />
        <h4 className="font-bold text-lg mb-1" style={{ color: form.color_texto }}>
          {form.titulo || 'Título'}
        </h4>
        {showSubtitulo && form.subtitulo && (
          <p className="text-sm opacity-80" style={{ color: form.color_texto }}>
            {form.subtitulo}
          </p>
        )}
        <div className="flex justify-center gap-4 mt-4">
          {form.mostrar_dias !== false && (
            <div className="text-2xl font-bold" style={{ color: form.color_texto }}>
              {tiempoRestante?.dias || '00'}
            </div>
          )}
          {form.mostrar_horas !== false && (
            <div className="text-2xl font-bold" style={{ color: form.color_texto }}>
              {tiempoRestante?.horas || '00'}
            </div>
          )}
          {form.mostrar_minutos !== false && (
            <div className="text-2xl font-bold" style={{ color: form.color_texto }}>
              {tiempoRestante?.minutos || '00'}
            </div>
          )}
          {form.mostrar_segundos !== false && (
            <div className="text-2xl font-bold" style={{ color: form.color_texto }}>
              {tiempoRestante?.segundos || '00'}
            </div>
          )}
        </div>
      </div>
    );
  }, [form, tiempoRestante, colorPrimario, isAutoSaveMode, showSubtitulo]);

  // Campos del formulario
  const formFields = (
    <>
      {/* Título */}
      {isAutoSaveMode ? (
        <Input
          label="Título"
          value={form.titulo || ''}
          onChange={(e) => handleFieldChange('titulo', e.target.value)}
          placeholder="Faltan"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      ) : (
        <Input
          label={
            showAI && AIGenerateButtonComponent ? (
              <span className="flex items-center gap-2">
                Título del evento
                <AIGenerateButtonComponent
                  tipo="countdown"
                  campo="titulo"
                  industria={industria}
                  onGenerate={(text) => handleFieldChange('titulo', text)}
                  size="sm"
                />
              </span>
            ) : (
              'Título del evento'
            )
          }
          value={form.titulo || ''}
          onChange={(e) => handleFieldChange('titulo', e.target.value)}
          placeholder="Gran Inauguración"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      )}

      {/* Subtítulo (solo website) */}
      {showSubtitulo && (
        <Input
          label="Subtítulo"
          value={form.subtitulo || ''}
          onChange={(e) => handleFieldChange('subtitulo', e.target.value)}
          placeholder="No te pierdas este evento especial"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      )}

      {/* Fecha objetivo - Solo para website (manualSave). En invitaciones usa evento.fecha_evento */}
      {!isAutoSaveMode && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-700 dark:text-blue-300">Fecha y hora objetivo</span>
          </div>
          <Input
            type="datetime-local"
            value={form.fecha_objetivo || ''}
            onChange={(e) => handleFieldChange('fecha_objetivo', e.target.value)}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </div>
      )}

      {/* Texto al finalizar */}
      <Input
        label="Texto al finalizar"
        value={form.texto_finalizado || ''}
        onChange={(e) => handleFieldChange('texto_finalizado', e.target.value)}
        placeholder="¡Llegó el gran día!"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Estilo visual (invitaciones) */}
      {showEstiloVisual && (
        <Select
          label="Estilo visual"
          value={form.estilo || 'cajas'}
          onChange={(e) => handleFieldChange('estilo', e.target.value)}
          options={estiloOptions}
          className="dark:bg-gray-700 dark:border-gray-600"
        />
      )}

      {/* Mostrar segundos (invitaciones) */}
      {showMostrarSegundos && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mostrar segundos
            </span>
            <ToggleSwitch
              enabled={form.mostrar_segundos === true}
              onChange={(val) => handleFieldChange('mostrar_segundos', val)}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
            Añade la unidad de segundos a la cuenta regresiva.
          </p>
        </>
      )}

      {/* Unidades a mostrar (website) */}
      {showUnidadesIndividuales && (
        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col items-center">
            <ToggleSwitch
              checked={form.mostrar_dias !== false}
              onChange={(checked) => handleFieldChange('mostrar_dias', checked)}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Días</span>
          </div>
          <div className="flex flex-col items-center">
            <ToggleSwitch
              checked={form.mostrar_horas !== false}
              onChange={(checked) => handleFieldChange('mostrar_horas', checked)}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Horas</span>
          </div>
          <div className="flex flex-col items-center">
            <ToggleSwitch
              checked={form.mostrar_minutos !== false}
              onChange={(checked) => handleFieldChange('mostrar_minutos', checked)}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minutos</span>
          </div>
          <div className="flex flex-col items-center">
            <ToggleSwitch
              checked={form.mostrar_segundos !== false}
              onChange={(checked) => handleFieldChange('mostrar_segundos', checked)}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Segundos</span>
          </div>
        </div>
      )}

      {/* Al finalizar (website) */}
      {showAccionFinalizado && (
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Al finalizar"
            value={form.accion_finalizado || 'ocultar'}
            onChange={(e) => handleFieldChange('accion_finalizado', e.target.value)}
            options={ACCION_OPTIONS}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          <Input
            label="Mensaje de finalización"
            value={form.texto_finalizado || ''}
            onChange={(e) => handleFieldChange('texto_finalizado', e.target.value)}
            placeholder="¡El evento ha comenzado!"
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
        </div>
      )}

      {/* Apariencia (website) */}
      {showApariencia && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Apariencia</h4>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de fondo"
              value={form.fondo_tipo || 'color'}
              onChange={(e) => handleFieldChange('fondo_tipo', e.target.value)}
              options={FONDO_OPTIONS}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <Input
              label={form.fondo_tipo === 'imagen' ? 'URL de imagen' : 'Color de fondo'}
              type={form.fondo_tipo === 'imagen' ? 'url' : 'color'}
              value={form.fondo_valor || THEME_FALLBACK_COLORS.common.fondoOscuro}
              onChange={(e) => handleFieldChange('fondo_valor', e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div className="mt-3">
            <Input
              label="Color de texto"
              type="color"
              value={form.color_texto || THEME_FALLBACK_COLORS.common.textoBlanco}
              onChange={(e) => handleFieldChange('color_texto', e.target.value)}
              className="w-20"
            />
          </div>
        </div>
      )}

      {/* Botón CTA opcional (website) */}
      {showBotonCTA && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Botón (opcional)</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Texto del botón"
              value={form.boton_texto || ''}
              onChange={(e) => handleFieldChange('boton_texto', e.target.value)}
              placeholder="Registrarse"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <Input
              label="URL del botón"
              value={form.boton_url || ''}
              onChange={(e) => handleFieldChange('boton_url', e.target.value)}
              placeholder="#contacto"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
        </div>
      )}
    </>
  );

  // Renderizar según el modo
  if (isAutoSaveMode) {
    // Sin preview - el canvas ya está visible al lado
    return (
      <BaseAutoSaveEditor>
        {formFields}
      </BaseAutoSaveEditor>
    );
  }

  return (
    <BaseBlockEditor
      tipo="countdown"
      industria={industria}
      mostrarAIBanner={showAI && esVacio}
      onAIGenerate={handleAIGenerate}
      AIBannerComponent={AIBannerComponent}
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

export default memo(CountdownEditor);

// Configuraciones predefinidas para cada editor
export const COUNTDOWN_CONFIG_MINIMAL = {
  showSubtitulo: false,
  showEstiloVisual: true,
  showUnidadesIndividuales: false,
  showMostrarSegundos: true,
  showApariencia: false,
  showBotonCTA: false,
  showAccionFinalizado: false,
  estiloOptions: ESTILO_OPTIONS_MINIMAL,
};

export const COUNTDOWN_CONFIG_FULL = {
  showSubtitulo: true,
  showEstiloVisual: false,
  showUnidadesIndividuales: true,
  showMostrarSegundos: false,
  showApariencia: true,
  showBotonCTA: true,
  showAccionFinalizado: true,
  estiloOptions: [],
};
