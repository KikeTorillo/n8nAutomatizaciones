/**
 * ====================================================================
 * SEPARADOR EDITOR (COMMON BLOCK)
 * ====================================================================
 * Editor de bloque separador/divisor compartido entre editores.
 * Configurable para diferentes estilos y opciones según el editor.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import { Select } from '@/components/ui';
import { ColorField, NumberField } from '../../fields';
import BaseBlockEditor from '../../blocks/BaseBlockEditor';
import BaseAutoSaveEditor from '../../blocks/BaseAutoSaveEditor';
import { useCommonBlockEditor } from '../hooks';
import { SEPARADOR_DEFAULTS } from '../config';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

// ========== ESTILOS PREDEFINIDOS ==========

// Estilos básicos (ambos editores)
const ESTILOS_BASICOS = [
  { value: 'linea', label: 'Línea sólida' },
  { value: 'espacio', label: 'Espacio en blanco' },
  { value: 'ondas', label: 'Ondas decorativas' },
];

// Estilos adicionales (minimal)
const ESTILOS_MINIMAL = [
  ...ESTILOS_BASICOS,
  { value: 'flores', label: 'Flores' },
];

// Estilos adicionales (full)
const ESTILOS_FULL = [
  ...ESTILOS_BASICOS,
  { value: 'punteado', label: 'Punteado' },
  { value: 'gradiente', label: 'Gradiente' },
  { value: 'ondulado', label: 'Ondulado' },
];

// ========== RENDER HELPERS ==========

/**
 * Renderiza el separador según el estilo
 */
function renderSeparador(estilo, config) {
  const { color, altura = 40, grosor = 'normal', ancho = 'full' } = config;

  const getGrosorPx = () => {
    switch (grosor) {
      case 'thin': return '1px';
      case 'thick': return '4px';
      default: return '2px';
    }
  };

  const getAnchoClass = () => {
    switch (ancho) {
      case 'small': return 'max-w-xs';
      case 'medium': return 'max-w-md';
      case 'large': return 'max-w-2xl';
      default: return 'w-full';
    }
  };

  const baseClasses = `mx-auto ${getAnchoClass()}`;

  switch (estilo) {
    case 'linea':
      return (
        <div className="flex items-center justify-center" style={{ height: altura }}>
          <div
            className={baseClasses}
            style={{ borderTop: `${getGrosorPx()} solid ${color}` }}
          />
        </div>
      );

    case 'espacio':
      return <div style={{ height: altura }} />;

    case 'ondas':
    case 'ondulado':
      return (
        <div className="flex items-center justify-center" style={{ height: altura }}>
          <svg
            viewBox="0 0 200 20"
            className={`${baseClasses} overflow-visible`}
            style={{ height: Math.min(altura, 40) }}
            preserveAspectRatio="none"
          >
            <path
              d="M0 10 Q 25 0 50 10 T 100 10 T 150 10 T 200 10"
              fill="none"
              stroke={color}
              strokeWidth={grosor === 'thin' ? 1 : grosor === 'thick' ? 3 : 2}
            />
          </svg>
        </div>
      );

    case 'flores':
      return (
        <div className="flex items-center justify-center" style={{ height: altura }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-px" style={{ backgroundColor: color }} />
            <svg viewBox="0 0 24 24" className="w-6 h-6" style={{ fill: color }}>
              <path d="M12 2C13.1 2 14 2.9 14 4C14 4.74 13.6 5.39 13 5.73V7H14C15.1 7 16 7.9 16 9V10C17.1 10 18 10.9 18 12C18 13.1 17.1 14 16 14V15C16 16.1 15.1 17 14 17H13V18.27C13.6 18.61 14 19.26 14 20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20C10 19.26 10.4 18.61 11 18.27V17H10C8.9 17 8 16.1 8 15V14C6.9 14 6 13.1 6 12C6 10.9 6.9 10 8 10V9C8 7.9 8.9 7 10 7H11V5.73C10.4 5.39 10 4.74 10 4C10 2.9 10.9 2 12 2Z" />
            </svg>
            <div className="w-16 h-px" style={{ backgroundColor: color }} />
          </div>
        </div>
      );

    case 'punteado':
      return (
        <div className="flex items-center justify-center" style={{ height: altura }}>
          <div
            className={baseClasses}
            style={{ borderTop: `${getGrosorPx()} dashed ${color}` }}
          />
        </div>
      );

    case 'gradiente':
      return (
        <div className="flex items-center justify-center" style={{ height: altura }}>
          <div
            className={`${baseClasses} rounded-full`}
            style={{
              height: getGrosorPx(),
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            }}
          />
        </div>
      );

    default:
      return <div style={{ height: altura }} />;
  }
}

// ========== COMPONENTE PRINCIPAL ==========

/**
 * SeparadorEditor - Editor del bloque separador
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque (solo autoSave mode)
 * @param {Function} props.onChange - Callback para autoSave mode
 * @param {Function} props.onGuardar - Callback para manualSave mode
 * @param {Object} props.tema - Tema del editor
 * @param {boolean} props.isSaving - Estado de guardado (solo manualSave)
 * @param {Object} props.config - Configuración personalizada
 * @param {Array} props.config.estiloOptions - Opciones de estilo
 * @param {boolean} props.config.showGrosor - Mostrar selector de grosor
 * @param {boolean} props.config.showAncho - Mostrar selector de ancho
 * @param {boolean} props.config.showEspaciado - Mostrar selector de espaciado
 */
function SeparadorEditor({
  contenido,
  estilos,
  onChange,
  onGuardar,
  tema,
  isSaving,
  config = {},
}) {
  const {
    estiloOptions = ESTILOS_BASICOS,
    showGrosor = false,
    showAncho = false,
    showEspaciado = false,
  } = config;

  // Determinar modo
  const isAutoSaveMode = Boolean(onChange);

  // Valores por defecto según el modo
  const defaultValues = useMemo(
    () => ({
      estilo: 'linea',
      color: '',
      altura: 40,
      grosor: 'normal',
      ancho: 'full',
      espaciado: 'normal',
    }),
    []
  );

  // Hook unificado
  const { form, handleFieldChange, handleSubmit, cambios } = useCommonBlockEditor(
    contenido,
    {
      defaultValues,
      estilos,
      onChange,
      onGuardar,
    }
  );

  // Color final (del formulario o del tema)
  const colorFinal = form.color || tema?.color_primario || tema?.colores?.primario || THEME_FALLBACK_COLORS.invitacion.primario;

  // Opciones de select
  const grosorOptions = [
    { value: 'thin', label: 'Delgado' },
    { value: 'normal', label: 'Normal' },
    { value: 'thick', label: 'Grueso' },
  ];

  const anchoOptions = [
    { value: 'full', label: 'Completo' },
    { value: 'large', label: 'Grande (75%)' },
    { value: 'medium', label: 'Mediano (50%)' },
    { value: 'small', label: 'Pequeño (25%)' },
  ];

  const espaciadoOptions = [
    { value: 'small', label: 'Pequeño' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Grande' },
  ];

  // Componente de preview
  const preview = useMemo(() => {
    const getEspaciadoClass = () => {
      switch (form.espaciado) {
        case 'small': return 'py-4';
        case 'large': return 'py-12';
        default: return 'py-8';
      }
    };

    return (
      <div className={showEspaciado ? getEspaciadoClass() : 'p-4'}>
        {renderSeparador(form.estilo || 'linea', {
          color: colorFinal,
          altura: form.altura || 40,
          grosor: form.grosor || 'normal',
          ancho: form.ancho || 'full',
        })}
      </div>
    );
  }, [form, colorFinal, showEspaciado]);

  // Campos del formulario
  const formFields = (
    <>
      <Select
        label="Estilo del separador"
        value={form.estilo || 'linea'}
        onChange={(e) => handleFieldChange('estilo', e.target.value)}
        options={estiloOptions}
        className="dark:bg-gray-700 dark:border-gray-600"
      />

      {showGrosor && form.estilo !== 'espacio' && (
        <Select
          label="Grosor"
          value={form.grosor || 'normal'}
          onChange={(e) => handleFieldChange('grosor', e.target.value)}
          options={grosorOptions}
          className="dark:bg-gray-700 dark:border-gray-600"
        />
      )}

      {showAncho && (
        <Select
          label="Ancho"
          value={form.ancho || 'full'}
          onChange={(e) => handleFieldChange('ancho', e.target.value)}
          options={anchoOptions}
          className="dark:bg-gray-700 dark:border-gray-600"
        />
      )}

      {showEspaciado && (
        <Select
          label="Espaciado vertical"
          value={form.espaciado || 'normal'}
          onChange={(e) => handleFieldChange('espaciado', e.target.value)}
          options={espaciadoOptions}
          className="dark:bg-gray-700 dark:border-gray-600"
        />
      )}

      {!showEspaciado && (
        <NumberField
          label="Altura (px)"
          value={form.altura || 40}
          onChange={(val) => handleFieldChange('altura', val)}
          min={10}
          max={200}
          step={10}
        />
      )}

      {form.estilo !== 'espacio' && (
        <ColorField
          label="Color (opcional)"
          value={form.color || ''}
          onChange={(val) => handleFieldChange('color', val)}
          placeholder="Usa color del tema por defecto"
        />
      )}

      {/* Info */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          El separador agrega espacio visual entre secciones.
          {form.estilo === 'espacio' && ' El estilo "Espacio" solo agrega espacio en blanco.'}
        </p>
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
      tipo="separador"
      mostrarAIBanner={false}
      cambios={cambios}
      handleSubmit={handleSubmit}
      onGuardar={onGuardar}
      isSaving={isSaving}
      preview={preview}
    >
      {formFields}
    </BaseBlockEditor>
  );
}

// ========== EXPORTS ==========

export default memo(SeparadorEditor);

// Configuraciones predefinidas para cada editor
export const SEPARADOR_CONFIG_MINIMAL = {
  estiloOptions: ESTILOS_MINIMAL,
  showGrosor: false,
  showAncho: false,
  showEspaciado: false,
};

export const SEPARADOR_CONFIG_FULL = {
  estiloOptions: ESTILOS_FULL,
  showGrosor: true,
  showAncho: true,
  showEspaciado: true,
};
