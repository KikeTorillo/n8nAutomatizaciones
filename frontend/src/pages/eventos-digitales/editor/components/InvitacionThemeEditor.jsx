/**
 * ====================================================================
 * INVITACION THEME EDITOR
 * ====================================================================
 * Editor de colores para invitaciones digitales.
 * Versión simplificada con 2 colores y temas rápidos por tipo de evento.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { useState, useEffect, memo } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Palette, Check, RotateCcw, Loader2 } from 'lucide-react';

/**
 * Temas rápidos por tipo de evento
 */
const TEMAS_POR_TIPO = {
  boda: [
    { id: 'elegante', nombre: 'Elegante', colores: { primario: '#753572', secundario: '#D4AF37' } },
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#EC4899', secundario: '#F9A8D4' } },
    { id: 'dorado', nombre: 'Dorado', colores: { primario: '#D97706', secundario: '#FDE68A' } },
    { id: 'azul', nombre: 'Azul', colores: { primario: '#3B82F6', secundario: '#93C5FD' } },
    { id: 'verde', nombre: 'Verde', colores: { primario: '#059669', secundario: '#6EE7B7' } },
  ],
  xv_anos: [
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#DB2777', secundario: '#F9A8D4' } },
    { id: 'morado', nombre: 'Morado', colores: { primario: '#8B5CF6', secundario: '#C4B5FD' } },
    { id: 'turquesa', nombre: 'Turquesa', colores: { primario: '#14B8A6', secundario: '#5EEAD4' } },
    { id: 'dorado', nombre: 'Dorado', colores: { primario: '#B45309', secundario: '#FDE68A' } },
    { id: 'rosa_gold', nombre: 'Rosa Gold', colores: { primario: '#F472B6', secundario: '#D4AF37' } },
  ],
  bautizo: [
    { id: 'celeste', nombre: 'Celeste', colores: { primario: '#38BDF8', secundario: '#BAE6FD' } },
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#F472B6', secundario: '#FBCFE8' } },
    { id: 'verde', nombre: 'Verde', colores: { primario: '#34D399', secundario: '#A7F3D0' } },
    { id: 'blanco', nombre: 'Blanco', colores: { primario: '#6B7280', secundario: '#F3F4F6' } },
    { id: 'dorado', nombre: 'Dorado', colores: { primario: '#D4AF37', secundario: '#FEF3C7' } },
  ],
  cumpleanos: [
    { id: 'fiesta', nombre: 'Fiesta', colores: { primario: '#F59E0B', secundario: '#EF4444' } },
    { id: 'morado', nombre: 'Morado', colores: { primario: '#8B5CF6', secundario: '#A78BFA' } },
    { id: 'azul', nombre: 'Azul', colores: { primario: '#3B82F6', secundario: '#60A5FA' } },
    { id: 'verde', nombre: 'Verde', colores: { primario: '#10B981', secundario: '#34D399' } },
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#EC4899', secundario: '#F472B6' } },
  ],
  corporativo: [
    { id: 'azul', nombre: 'Corporativo', colores: { primario: '#1E40AF', secundario: '#3B82F6' } },
    { id: 'gris', nombre: 'Elegante', colores: { primario: '#374151', secundario: '#6B7280' } },
    { id: 'verde', nombre: 'Moderno', colores: { primario: '#059669', secundario: '#10B981' } },
    { id: 'morado', nombre: 'Creativo', colores: { primario: '#7C3AED', secundario: '#8B5CF6' } },
    { id: 'rojo', nombre: 'Impactante', colores: { primario: '#DC2626', secundario: '#EF4444' } },
  ],
  otro: [
    { id: 'primario', nombre: 'Clásico', colores: { primario: '#753572', secundario: '#F59E0B' } },
    { id: 'azul', nombre: 'Azul', colores: { primario: '#3B82F6', secundario: '#60A5FA' } },
    { id: 'verde', nombre: 'Verde', colores: { primario: '#10B981', secundario: '#34D399' } },
    { id: 'morado', nombre: 'Morado', colores: { primario: '#8B5CF6', secundario: '#A78BFA' } },
    { id: 'rosa', nombre: 'Rosa', colores: { primario: '#EC4899', secundario: '#F472B6' } },
  ],
};

/**
 * InvitacionThemeEditor - Editor de colores para invitaciones
 *
 * @param {Object} props
 * @param {Object} props.evento - Evento con plantilla actual
 * @param {Function} props.onActualizar - Callback para guardar cambios
 * @param {boolean} props.isLoading - Estado de carga
 */
function InvitacionThemeEditor({ evento, onActualizar, isLoading = false }) {
  const plantillaActual = evento?.plantilla || {};
  const tipoEvento = evento?.tipo || 'otro';

  const [colores, setColores] = useState({
    primario: plantillaActual.color_primario || '#753572',
    secundario: plantillaActual.color_secundario || '#F59E0B',
  });

  const [colorEditando, setColorEditando] = useState(null);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);

  // Obtener temas para el tipo de evento actual
  const temasDisponibles = TEMAS_POR_TIPO[tipoEvento] || TEMAS_POR_TIPO.otro;

  // Detectar cambios
  useEffect(() => {
    const hayCambios =
      colores.primario !== (plantillaActual.color_primario || '#753572') ||
      colores.secundario !== (plantillaActual.color_secundario || '#F59E0B');
    setCambiosPendientes(hayCambios);
  }, [colores, plantillaActual]);

  // Sincronizar con plantilla externa
  useEffect(() => {
    setColores({
      primario: plantillaActual.color_primario || '#753572',
      secundario: plantillaActual.color_secundario || '#F59E0B',
    });
  }, [plantillaActual.color_primario, plantillaActual.color_secundario]);

  const handleColorChange = (color) => {
    if (!colorEditando) return;
    setColores((prev) => ({ ...prev, [colorEditando]: color }));
  };

  const handleAplicarTema = (tema) => {
    setColores({ ...tema.colores });
    setColorEditando(null);
  };

  const handleGuardar = () => {
    onActualizar({
      ...plantillaActual,
      color_primario: colores.primario,
      color_secundario: colores.secundario,
    });
  };

  const handleRestaurar = () => {
    setColores({
      primario: plantillaActual.color_primario || '#753572',
      secundario: plantillaActual.color_secundario || '#F59E0B',
    });
    setColorEditando(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Colores</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Personaliza los colores de tu invitación
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Temas rápidos */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Temas rápidos
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {temasDisponibles.map((tema) => (
              <button
                key={tema.id}
                onClick={() => handleAplicarTema(tema)}
                className="group relative"
                title={tema.nombre}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
                  <div
                    className="w-full h-1/2"
                    style={{ backgroundColor: tema.colores.primario }}
                  />
                  <div
                    className="w-full h-1/2"
                    style={{ backgroundColor: tema.colores.secundario }}
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
            Colores personalizados
          </h4>

          <div className="space-y-3">
            {[
              { key: 'primario', label: 'Color primario' },
              { key: 'secundario', label: 'Color secundario' },
            ].map(({ key, label }) => (
              <div key={key}>
                <button
                  onClick={() => setColorEditando(colorEditando === key ? null : key)}
                  className={`
                    w-full flex items-center justify-between p-2 rounded-lg border
                    transition-colors
                    ${
                      colorEditando === key
                        ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 uppercase">
                      {colores[key]}
                    </span>
                    <div
                      className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: colores[key] }}
                    />
                  </div>
                </button>

                {/* Color picker expandido */}
                {colorEditando === key && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <HexColorPicker
                      color={colores[key]}
                      onChange={handleColorChange}
                      style={{ width: '100%' }}
                    />
                    <input
                      type="text"
                      value={colores[key]}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="mt-2 w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-center uppercase"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Vista previa
          </h4>
          <div
            className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <h3
              className="font-bold text-lg mb-2"
              style={{ color: colores.primario }}
            >
              {evento?.nombre || 'Tu Evento'}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Texto de ejemplo para previsualizar los colores.
            </p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: colores.primario }}
              >
                Primario
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: colores.secundario }}
              >
                Secundario
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer con acciones */}
      {cambiosPendientes && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex gap-2">
            <button
              onClick={handleRestaurar}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
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

export default memo(InvitacionThemeEditor);
