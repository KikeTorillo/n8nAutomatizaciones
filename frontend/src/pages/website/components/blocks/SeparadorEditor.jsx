/**
 * ====================================================================
 * SEPARADOR EDITOR (Refactorizado)
 * ====================================================================
 *
 * Editor del bloque Separador.
 * Usa BaseBlockEditor y ColorPickerField.
 *
 * @version 2.0.0
 * @since 2026-02-03
 */

import { memo, useMemo } from 'react';
import { Select } from '@/components/ui';
import { BaseBlockEditor, useBlockEditor } from '@/components/editor-framework';
import { ColorPickerField } from './fields';

/**
 * SeparadorEditor - Editor del bloque Separador
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Function} props.onGuardar - Callback para guardar
 * @param {Object} props.tema - Tema del sitio
 * @param {boolean} props.isSaving - Estado de guardado
 */
function SeparadorEditor({ contenido, onGuardar, tema, isSaving }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(() => ({
    estilo: 'linea',
    grosor: 'normal',
    ancho: 'full',
    color: '',
    espaciado: 'normal',
    icono: '',
  }), []);

  // Hook para manejo del formulario
  const { form, cambios, handleSubmit, handleFieldChange } = useBlockEditor(
    contenido,
    defaultValues
  );

  const colorActual = form.color || tema?.colores?.primario || '#E5E7EB';
  const isEspacioOnly = form.estilo === 'espacio';

  // Helpers para preview
  const getGrosorPx = () => {
    switch (form.grosor) {
      case 'thin': return '1px';
      case 'thick': return '4px';
      default: return '2px';
    }
  };

  const getAnchoClass = () => {
    switch (form.ancho) {
      case 'small': return 'max-w-xs';
      case 'medium': return 'max-w-md';
      case 'large': return 'max-w-2xl';
      default: return 'w-full';
    }
  };

  const getEspaciadoClass = () => {
    switch (form.espaciado) {
      case 'small': return 'py-4';
      case 'large': return 'py-12';
      default: return 'py-8';
    }
  };

  // Opciones de select
  const estiloOptions = [
    { value: 'linea', label: 'Linea solida' },
    { value: 'punteado', label: 'Punteado' },
    { value: 'gradiente', label: 'Gradiente' },
    { value: 'ondulado', label: 'Ondulado' },
    { value: 'espacio', label: 'Solo espacio' },
  ];

  const grosorOptions = [
    { value: 'thin', label: 'Delgado' },
    { value: 'normal', label: 'Normal' },
    { value: 'thick', label: 'Grueso' },
  ];

  const anchoOptions = [
    { value: 'full', label: 'Completo' },
    { value: 'large', label: 'Grande (75%)' },
    { value: 'medium', label: 'Mediano (50%)' },
    { value: 'small', label: 'Pequeno (25%)' },
  ];

  const espaciadoOptions = [
    { value: 'small', label: 'Pequeno' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Grande' },
  ];

  // Renderizado del separador para preview
  const renderSeparador = () => {
    const baseClasses = `mx-auto ${getAnchoClass()}`;

    switch (form.estilo) {
      case 'punteado':
        return (
          <div
            className={baseClasses}
            style={{
              borderTop: `${getGrosorPx()} dashed ${colorActual}`,
            }}
          />
        );

      case 'gradiente':
        return (
          <div
            className={`${baseClasses} rounded-full`}
            style={{
              height: getGrosorPx(),
              background: `linear-gradient(90deg, transparent, ${colorActual}, transparent)`,
            }}
          />
        );

      case 'espacio':
        return <div className={`${baseClasses} h-8`} />;

      case 'ondulado':
        return (
          <svg
            className={`${baseClasses} overflow-visible`}
            height="20"
            viewBox="0 0 200 20"
            preserveAspectRatio="none"
          >
            <path
              d="M0 10 Q 25 0, 50 10 T 100 10 T 150 10 T 200 10"
              fill="none"
              stroke={colorActual}
              strokeWidth={form.grosor === 'thin' ? 1 : form.grosor === 'thick' ? 3 : 2}
            />
          </svg>
        );

      default:
        return (
          <div
            className={baseClasses}
            style={{
              borderTop: `${getGrosorPx()} solid ${colorActual}`,
            }}
          />
        );
    }
  };

  // Componente de preview
  const preview = useMemo(() => (
    <div className={getEspaciadoClass()}>
      {renderSeparador()}
    </div>
  ), [form.estilo, form.grosor, form.ancho, form.espaciado, colorActual]);

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
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Estilo"
          value={form.estilo}
          onChange={(e) => handleFieldChange('estilo', e.target.value)}
          options={estiloOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Select
          label="Grosor"
          value={form.grosor}
          onChange={(e) => handleFieldChange('grosor', e.target.value)}
          options={grosorOptions}
          disabled={isEspacioOnly}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Ancho"
          value={form.ancho}
          onChange={(e) => handleFieldChange('ancho', e.target.value)}
          options={anchoOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
        <Select
          label="Espaciado vertical"
          value={form.espaciado}
          onChange={(e) => handleFieldChange('espaciado', e.target.value)}
          options={espaciadoOptions}
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <ColorPickerField
        label="Color (opcional)"
        value={form.color}
        onChange={(val) => handleFieldChange('color', val)}
        defaultColor={colorActual}
        disabled={isEspacioOnly}
      />
    </BaseBlockEditor>
  );
}

export default memo(SeparadorEditor);
