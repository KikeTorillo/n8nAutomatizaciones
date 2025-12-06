import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';

/**
 * SeparadorEditor - Editor del bloque Separador
 */
function SeparadorEditor({ contenido, onGuardar, tema, isSaving }) {
  const [form, setForm] = useState({
    estilo: contenido.estilo || 'linea', // linea, punteado, gradiente, espacio, ondulado
    grosor: contenido.grosor || 'normal', // thin, normal, thick
    ancho: contenido.ancho || 'full', // full, large, medium, small
    color: contenido.color || '', // vacío = color del tema
    espaciado: contenido.espaciado || 'normal', // small, normal, large
    icono: contenido.icono || '', // opcional: icono en el centro
  });

  const [cambios, setCambios] = useState(false);

  useEffect(() => {
    setCambios(JSON.stringify(form) !== JSON.stringify({
      estilo: contenido.estilo || 'linea',
      grosor: contenido.grosor || 'normal',
      ancho: contenido.ancho || 'full',
      color: contenido.color || '',
      espaciado: contenido.espaciado || 'normal',
      icono: contenido.icono || '',
    }));
  }, [form, contenido]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(form);
    setCambios(false);
  };

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

      default: // linea
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estilo
          </label>
          <select
            value={form.estilo}
            onChange={(e) => setForm({ ...form, estilo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="linea">Línea sólida</option>
            <option value="punteado">Punteado</option>
            <option value="gradiente">Gradiente</option>
            <option value="ondulado">Ondulado</option>
            <option value="espacio">Solo espacio</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grosor
          </label>
          <select
            value={form.grosor}
            onChange={(e) => setForm({ ...form, grosor: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={form.estilo === 'espacio'}
          >
            <option value="thin">Delgado</option>
            <option value="normal">Normal</option>
            <option value="thick">Grueso</option>
          </select>
        </div>
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
            <option value="full">Completo</option>
            <option value="large">Grande (75%)</option>
            <option value="medium">Mediano (50%)</option>
            <option value="small">Pequeño (25%)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Espaciado vertical
          </label>
          <select
            value={form.espaciado}
            onChange={(e) => setForm({ ...form, espaciado: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="small">Pequeño</option>
            <option value="normal">Normal</option>
            <option value="large">Grande</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Color (opcional)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={form.color || colorActual}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
            disabled={form.estilo === 'espacio'}
          />
          <input
            type="text"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            placeholder="Usar color del tema"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={form.estilo === 'espacio'}
          />
          {form.color && (
            <button
              type="button"
              onClick={() => setForm({ ...form, color: '' })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Resetear
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 rounded-lg">
        <div className={getEspaciadoClass()}>
          {renderSeparador()}
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

export default SeparadorEditor;
