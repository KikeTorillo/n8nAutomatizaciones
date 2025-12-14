import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Palette, Type, Check, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Temas predefinidos
 */
const TEMAS_PREDEFINIDOS = [
  {
    id: 'default',
    nombre: 'Clásico',
    colores: {
      primario: '#4F46E5',
      secundario: '#6366F1',
      fondo: '#FFFFFF',
      texto: '#1F2937',
    },
  },
  {
    id: 'dark',
    nombre: 'Oscuro',
    colores: {
      primario: '#8B5CF6',
      secundario: '#A78BFA',
      fondo: '#111827',
      texto: '#F9FAFB',
    },
  },
  {
    id: 'nature',
    nombre: 'Natural',
    colores: {
      primario: '#059669',
      secundario: '#10B981',
      fondo: '#ECFDF5',
      texto: '#064E3B',
    },
  },
  {
    id: 'sunset',
    nombre: 'Atardecer',
    colores: {
      primario: '#DC2626',
      secundario: '#F97316',
      fondo: '#FFF7ED',
      texto: '#7C2D12',
    },
  },
  {
    id: 'ocean',
    nombre: 'Océano',
    colores: {
      primario: '#0284C7',
      secundario: '#38BDF8',
      fondo: '#F0F9FF',
      texto: '#0C4A6E',
    },
  },
];

/**
 * Fuentes disponibles
 */
const FUENTES_DISPONIBLES = [
  { id: 'inter', nombre: 'Inter', familia: 'Inter, sans-serif' },
  { id: 'roboto', nombre: 'Roboto', familia: 'Roboto, sans-serif' },
  { id: 'poppins', nombre: 'Poppins', familia: 'Poppins, sans-serif' },
  { id: 'montserrat', nombre: 'Montserrat', familia: 'Montserrat, sans-serif' },
  { id: 'playfair', nombre: 'Playfair Display', familia: '"Playfair Display", serif' },
  { id: 'lato', nombre: 'Lato', familia: 'Lato, sans-serif' },
];

/**
 * ThemeEditor - Editor de tema del sitio
 */
function ThemeEditor({ config, onActualizar }) {
  const temaActual = config?.tema || {};

  const [tema, setTema] = useState({
    colores: {
      primario: temaActual.colores?.primario || '#4F46E5',
      secundario: temaActual.colores?.secundario || '#6366F1',
      fondo: temaActual.colores?.fondo || '#FFFFFF',
      texto: temaActual.colores?.texto || '#1F2937',
    },
    fuente_titulos: temaActual.fuente_titulos || 'inter',
    fuente_cuerpo: temaActual.fuente_cuerpo || 'inter',
  });

  const [colorEditando, setColorEditando] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);

  // Detectar cambios
  useEffect(() => {
    const temaOriginal = config?.tema || {};
    const hayCambios = JSON.stringify(tema) !== JSON.stringify({
      colores: {
        primario: temaOriginal.colores?.primario || '#4F46E5',
        secundario: temaOriginal.colores?.secundario || '#6366F1',
        fondo: temaOriginal.colores?.fondo || '#FFFFFF',
        texto: temaOriginal.colores?.texto || '#1F2937',
      },
      fuente_titulos: temaOriginal.fuente_titulos || 'inter',
      fuente_cuerpo: temaOriginal.fuente_cuerpo || 'inter',
    });
    setCambiosPendientes(hayCambios);
  }, [tema, config]);

  const handleColorChange = (color) => {
    if (!colorEditando) return;
    setTema(prev => ({
      ...prev,
      colores: { ...prev.colores, [colorEditando]: color }
    }));
  };

  const handleAplicarTema = (temaPredefinido) => {
    setTema(prev => ({
      ...prev,
      colores: { ...temaPredefinido.colores }
    }));
    setColorEditando(null);
  };

  const handleGuardar = async () => {
    setIsLoading(true);
    try {
      await onActualizar(tema);
      toast.success('Tema guardado');
      setCambiosPendientes(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar tema');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestaurar = () => {
    const temaOriginal = config?.tema || {};
    setTema({
      colores: {
        primario: temaOriginal.colores?.primario || '#4F46E5',
        secundario: temaOriginal.colores?.secundario || '#6366F1',
        fondo: temaOriginal.colores?.fondo || '#FFFFFF',
        texto: temaOriginal.colores?.texto || '#1F2937',
      },
      fuente_titulos: temaOriginal.fuente_titulos || 'inter',
      fuente_cuerpo: temaOriginal.fuente_cuerpo || 'inter',
    });
    setColorEditando(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Tema</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Personaliza colores y tipografía
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Temas predefinidos */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Temas rápidos
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {TEMAS_PREDEFINIDOS.map((temaPred) => (
              <button
                key={temaPred.id}
                onClick={() => handleAplicarTema(temaPred)}
                className="group relative"
                title={temaPred.nombre}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
                  <div
                    className="w-full h-1/2"
                    style={{ backgroundColor: temaPred.colores.primario }}
                  />
                  <div
                    className="w-full h-1/2"
                    style={{ backgroundColor: temaPred.colores.fondo }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Colores */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colores
          </h4>

          <div className="space-y-3">
            {[
              { key: 'primario', label: 'Color primario' },
              { key: 'secundario', label: 'Color secundario' },
              { key: 'fondo', label: 'Fondo' },
              { key: 'texto', label: 'Texto' },
            ].map(({ key, label }) => (
              <div key={key}>
                <button
                  onClick={() => setColorEditando(colorEditando === key ? null : key)}
                  className={`
                    w-full flex items-center justify-between p-2 rounded-lg border
                    transition-colors
                    ${colorEditando === key
                      ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 uppercase">
                      {tema.colores[key]}
                    </span>
                    <div
                      className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: tema.colores[key] }}
                    />
                  </div>
                </button>

                {/* Color picker expandido */}
                {colorEditando === key && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <HexColorPicker
                      color={tema.colores[key]}
                      onChange={handleColorChange}
                      style={{ width: '100%' }}
                    />
                    <input
                      type="text"
                      value={tema.colores[key]}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="mt-2 w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-center uppercase"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fuentes */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Type className="w-4 h-4" />
            Tipografía
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Títulos</label>
              <select
                value={tema.fuente_titulos}
                onChange={(e) => setTema(prev => ({ ...prev, fuente_titulos: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                {FUENTES_DISPONIBLES.map(fuente => (
                  <option key={fuente.id} value={fuente.id}>
                    {fuente.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Cuerpo</label>
              <select
                value={tema.fuente_cuerpo}
                onChange={(e) => setTema(prev => ({ ...prev, fuente_cuerpo: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                {FUENTES_DISPONIBLES.map(fuente => (
                  <option key={fuente.id} value={fuente.id}>
                    {fuente.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Vista previa
          </h4>
          <div
            className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            style={{ backgroundColor: tema.colores.fondo }}
          >
            <h3
              className="font-bold text-lg mb-2"
              style={{ color: tema.colores.primario }}
            >
              Título de ejemplo
            </h3>
            <p
              className="text-sm mb-3"
              style={{ color: tema.colores.texto }}
            >
              Este es un texto de ejemplo para previsualizar los colores del tema.
            </p>
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: tema.colores.primario }}
            >
              Botón de acción
            </button>
          </div>
        </div>
      </div>

      {/* Footer con acciones */}
      {cambiosPendientes && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex gap-2">
            <button
              onClick={handleRestaurar}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Descartar
            </button>
            <button
              onClick={handleGuardar}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeEditor;
