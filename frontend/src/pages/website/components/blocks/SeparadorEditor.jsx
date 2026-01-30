import { useMemo } from 'react';
import { Save } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { useBlockEditor } from '../../hooks';

/**
 * SeparadorEditor - Editor del bloque Separador
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

  const estiloOptions = [
    { value: 'linea', label: 'Línea sólida' },
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
    { value: 'small', label: 'Pequeño (25%)' },
  ];

  const espaciadoOptions = [
    { value: 'small', label: 'Pequeño' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Grande' },
  ];

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-4">
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
          disabled={form.estilo === 'espacio'}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Color (opcional)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={form.color || colorActual}
            onChange={(e) => handleFieldChange('color', e.target.value)}
            className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            disabled={form.estilo === 'espacio'}
          />
          <Input
            value={form.color}
            onChange={(e) => handleFieldChange('color', e.target.value)}
            placeholder="Usar color del tema"
            disabled={form.estilo === 'espacio'}
            className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          />
          {form.color && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleFieldChange('color', '')}
            >
              Resetear
            </Button>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
        <div className={getEspaciadoClass()}>
          {renderSeparador()}
        </div>
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

export default SeparadorEditor;
