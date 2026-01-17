/**
 * ConfiguracionAusenciasTab - Configuración de políticas y niveles
 * Enero 2026
 */
import { useState } from 'react';
import { Settings, Layers, Sliders, RefreshCw, Info } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Button, EmptyState } from '@/components/ui';
import {
  usePoliticaVacaciones,
  useActualizarPoliticaVacaciones,
  useNivelesVacaciones,
  useCrearNivelesPreset,
} from '@/hooks/personas';
import { formatDias } from '@/hooks/personas';

/**
 * Sección de política de vacaciones
 */
function PoliticaVacacionesSection() {
  const { data: politica, isLoading } = usePoliticaVacaciones();
  const actualizarPolitica = useActualizarPoliticaVacaciones();

  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({});

  const handleEditar = () => {
    setFormData({
      dias_anticipacion_minimos: politica?.dias_anticipacion_minimos || 7,
      permite_medio_dia: politica?.permite_medio_dia ?? true,
      permite_acumular: politica?.permite_acumular ?? true,
      maximo_dias_acumulados: politica?.maximo_dias_acumulados || 10,
    });
    setEditando(true);
  };

  const handleGuardar = async () => {
    await actualizarPolitica.mutateAsync(formData);
    setEditando(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-primary-500" />
          Política de Vacaciones
        </h3>
        {!editando && (
          <Button variant="ghost" size="sm" onClick={handleEditar}>
            Editar
          </Button>
        )}
      </div>

      {editando ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Días de anticipación mínimos
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={formData.dias_anticipacion_minimos}
              onChange={(e) =>
                setFormData({ ...formData, dias_anticipacion_minimos: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="permite_medio_dia"
              checked={formData.permite_medio_dia}
              onChange={(e) =>
                setFormData({ ...formData, permite_medio_dia: e.target.checked })
              }
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="permite_medio_dia" className="text-sm text-gray-700 dark:text-gray-300">
              Permitir solicitar medio día
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="permite_acumular"
              checked={formData.permite_acumular}
              onChange={(e) =>
                setFormData({ ...formData, permite_acumular: e.target.checked })
              }
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="permite_acumular" className="text-sm text-gray-700 dark:text-gray-300">
              Permitir acumular días del año anterior
            </label>
          </div>

          {formData.permite_acumular && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Máximo días acumulados
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.maximo_dias_acumulados}
                onChange={(e) =>
                  setFormData({ ...formData, maximo_dias_acumulados: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleGuardar}
              disabled={actualizarPolitica.isPending}
            >
              {actualizarPolitica.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Anticipación mínima</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {politica?.dias_anticipacion_minimos || 7} días
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Medio día</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {politica?.permite_medio_dia ? 'Permitido' : 'No permitido'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Acumular días</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {politica?.permite_acumular
                ? `Sí, máx ${politica?.maximo_dias_acumulados || 10} días`
                : 'No'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Sección de niveles por antigüedad
 */
function NivelesVacacionesSection() {
  const { data: niveles, isLoading } = useNivelesVacaciones();
  const crearPreset = useCrearNivelesPreset();

  const handleCrearPreset = async (pais) => {
    if (window.confirm(`¿Crear niveles según la ley de ${pais === 'mexico' ? 'México (LFT)' : 'Colombia'}?`)) {
      await crearPreset.mutateAsync({ pais });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const nivelesArray = niveles || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary-500" />
          Niveles por Antigüedad
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCrearPreset('mexico')}
            disabled={crearPreset.isPending}
          >
            Preset México
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCrearPreset('colombia')}
            disabled={crearPreset.isPending}
          >
            Preset Colombia
          </Button>
        </div>
      </div>

      {nivelesArray.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Sin niveles configurados"
          description="Usa los presets para crear niveles según la ley de tu país"
          size="sm"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">
                  Nombre
                </th>
                <th className="text-center py-2 text-gray-500 dark:text-gray-400 font-medium">
                  Años mínimos
                </th>
                <th className="text-center py-2 text-gray-500 dark:text-gray-400 font-medium">
                  Días
                </th>
              </tr>
            </thead>
            <tbody>
              {nivelesArray.map((nivel) => (
                <tr
                  key={nivel.id}
                  className="border-b border-gray-100 dark:border-gray-700/50"
                >
                  <td className="py-3 text-gray-900 dark:text-white">
                    {nivel.nombre}
                  </td>
                  <td className="py-3 text-center text-gray-600 dark:text-gray-400">
                    {nivel.anios_minimos}
                  </td>
                  <td className="py-3 text-center font-medium text-primary-600 dark:text-primary-400">
                    {nivel.dias_correspondientes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Tab de Configuración
 */
function ConfiguracionAusenciasTab() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['vacaciones', 'politica'] });
    queryClient.invalidateQueries({ queryKey: ['vacaciones', 'niveles'] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuración de Ausencias
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Secciones */}
      <div className="grid gap-6">
        <PoliticaVacacionesSection />
        <NivelesVacacionesSection />
      </div>

      {/* Info */}
      <Alert variant="info" icon={Info} title="Nota">
        Las incapacidades se rigen por las reglas del IMSS y no requieren
        configuración adicional. Los días de incapacidad no afectan el saldo de vacaciones.
      </Alert>
    </div>
  );
}

export default ConfiguracionAusenciasTab;
