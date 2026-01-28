import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Coins,
  RefreshCw,
  Plus,
  Check,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  History,
  Save,
  AlertCircle,
} from 'lucide-react';

import {
  Button,
  Input,
  Modal
} from '@/components/ui';
import { ConfiguracionPageLayout } from '@/components/configuracion';
import { useToast } from '@/hooks/utils';
import { monedasApi } from '@/services/api/endpoints';
import { useCurrency } from '@/hooks/utils';
import { useModalManager } from '@/hooks/utils';

/**
 * Pares de tasas de cambio predefinidos
 * El sistema trabaja principalmente con estos pares
 */
const PARES_PRINCIPALES = [
  { origen: 'USD', destino: 'MXN', nombre: 'Dólar a Peso Mexicano' },
  { origen: 'USD', destino: 'COP', nombre: 'Dólar a Peso Colombiano' },
  { origen: 'EUR', destino: 'MXN', nombre: 'Euro a Peso Mexicano' },
  { origen: 'EUR', destino: 'USD', nombre: 'Euro a Dólar' },
];

/**
 * Página de Gestión de Monedas y Tasas de Cambio
 * Fase 5 - Diciembre 2025
 */
function MonedasPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();

  // Estado de formulario
  const [nuevaTasa, setNuevaTasa] = useState('');

  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    editarTasa: { isOpen: false, data: null },
    historial: { isOpen: false, data: null },
  });

  // Query: Listar monedas
  const { data: monedas = [], isLoading: loadingMonedas } = useQuery({
    queryKey: ['monedas'],
    queryFn: async () => {
      const response = await monedasApi.listar(false);
      return response.data.data || [];
    },
  });

  // Query: Obtener tasas actuales para cada par
  const { data: tasasActuales = {}, isLoading: loadingTasas, refetch: refetchTasas } = useQuery({
    queryKey: ['tasas-cambio-actuales'],
    queryFn: async () => {
      const tasas = {};
      for (const par of PARES_PRINCIPALES) {
        try {
          const response = await monedasApi.obtenerTasa(par.origen, par.destino);
          if (response.data.data) {
            tasas[`${par.origen}_${par.destino}`] = response.data.data;
          }
        } catch {
          tasas[`${par.origen}_${par.destino}`] = null;
        }
      }
      return tasas;
    },
    staleTime: 60000, // 1 minuto
  });

  // Query: Historial de tasas para el par seleccionado
  const parSeleccionado = getModalData('historial');
  const { data: historial = [], isLoading: loadingHistorial } = useQuery({
    queryKey: ['historial-tasas', parSeleccionado?.origen, parSeleccionado?.destino],
    queryFn: async () => {
      if (!parSeleccionado) return [];
      const response = await monedasApi.obtenerHistorialTasas(
        parSeleccionado.origen,
        parSeleccionado.destino,
        30
      );
      return response.data.data || [];
    },
    enabled: !!parSeleccionado && isOpen('historial'),
  });

  // Mutation: Guardar tasa
  const guardarTasaMutation = useMutation({
    mutationFn: async ({ origen, destino, tasa }) => {
      return monedasApi.guardarTasa({
        moneda_origen: origen,
        moneda_destino: destino,
        tasa: parseFloat(tasa),
        fuente: 'manual',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasas-cambio-actuales'] });
      toast.success('Tasa de cambio actualizada');
      closeModal('editarTasa');
      setNuevaTasa('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al guardar la tasa');
    },
  });

  // Encontrar la moneda completa por código
  const getMoneda = (codigo) => monedas.find(m => m.codigo === codigo);

  // Manejar click en editar tasa
  const handleEditarTasa = (par, tasaActual) => {
    setNuevaTasa(tasaActual?.tasa?.toString() || '');
    openModal('editarTasa', par);
  };

  // Manejar guardar tasa
  const handleGuardarTasa = () => {
    const tasaEditing = getModalData('editarTasa');
    if (!tasaEditing || !nuevaTasa || parseFloat(nuevaTasa) <= 0) {
      toast.error('Ingresa una tasa válida mayor a 0');
      return;
    }
    guardarTasaMutation.mutate({
      origen: tasaEditing.origen,
      destino: tasaEditing.destino,
      tasa: nuevaTasa,
    });
  };

  // Manejar ver historial
  const handleVerHistorial = (par) => {
    openModal('historial', par);
  };

  // Formatear fecha
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isLoading = loadingMonedas || loadingTasas;

  return (
    <ConfiguracionPageLayout
      icon={Coins}
      title="Monedas y Tasas de Cambio"
      subtitle="Gestiona las tasas de conversión"
      actions={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetchTasas()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Monedas Disponibles */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Monedas Disponibles
          </h2>

          {loadingMonedas ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {monedas.map((moneda) => (
                <div
                  key={moneda.codigo}
                  className={`
                    bg-white dark:bg-gray-800 rounded-lg border p-4
                    ${moneda.activo
                      ? 'border-gray-200 dark:border-gray-700'
                      : 'border-gray-100 dark:border-gray-800 opacity-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {moneda.simbolo}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {moneda.codigo}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {moneda.nombre}
                      </div>
                    </div>
                  </div>
                  {!moneda.activo && (
                    <span className="mt-2 inline-block text-xs text-gray-400 dark:text-gray-500">
                      Inactiva
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tasas de Cambio */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Tasas de Cambio Actuales
          </h2>

          {loadingTasas ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PARES_PRINCIPALES.map((par) => {
                const key = `${par.origen}_${par.destino}`;
                const tasa = tasasActuales[key];
                const monedaOrigen = getMoneda(par.origen);
                const monedaDestino = getMoneda(par.destino);

                return (
                  <div
                    key={key}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          {monedaOrigen?.simbolo || par.origen}
                        </span>
                        <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          {monedaDestino?.simbolo || par.destino}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleVerHistorial(par)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Ver historial"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditarTasa(par, tasa)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Editar tasa"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {par.nombre}
                    </div>

                    {tasa ? (
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {tasa.tasa.toLocaleString('es-MX', {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4
                          })}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          1 {par.origen} = {tasa.tasa.toLocaleString('es-MX', { maximumFractionDigits: 2 })} {par.destino}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span>Actualizado: {formatFecha(tasa.fecha || tasa.creado_en)}</span>
                          {tasa.fuente && (
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                              {tasa.fuente}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Sin tasa configurada</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Las tasas de cambio se utilizan para mostrar equivalencias en el POS y convertir precios entre monedas.
          </p>
        </section>

        {/* Calculadora de Conversión */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Calculadora de Conversión
          </h2>
          <ConversionCalculator monedas={monedas} />
        </section>
      </div>

      {/* Modal: Editar Tasa */}
      <Modal
        isOpen={isOpen('editarTasa')}
        onClose={() => {
          closeModal('editarTasa');
          setNuevaTasa('');
        }}
        title={`Actualizar Tasa: ${getModalData('editarTasa')?.origen} → ${getModalData('editarTasa')?.destino}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ingresa la nueva tasa de cambio. Esta será la tasa vigente desde hoy.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              1 {getModalData('editarTasa')?.origen} =
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.0001"
                min="0.0001"
                value={nuevaTasa}
                onChange={(e) => setNuevaTasa(e.target.value)}
                placeholder="Ej: 17.5000"
                className="flex-1"
                autoFocus
              />
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {getModalData('editarTasa')?.destino}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                closeModal('editarTasa');
                setNuevaTasa('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarTasa}
              disabled={guardarTasaMutation.isPending || !nuevaTasa}
            >
              {guardarTasaMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Historial de Tasas */}
      <Modal
        isOpen={isOpen('historial')}
        onClose={() => closeModal('historial')}
        title={`Historial: ${getModalData('historial')?.origen} → ${getModalData('historial')?.destino}`}
        size="md"
      >
        <div className="space-y-4">
          {loadingHistorial ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : historial.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No hay historial de tasas para este par
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white dark:bg-gray-800">
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                    <th className="pb-2">Fecha</th>
                    <th className="pb-2">Tasa</th>
                    <th className="pb-2">Fuente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {historial.map((item, idx) => (
                    <tr key={idx} className="text-sm">
                      <td className="py-2 text-gray-900 dark:text-gray-100">
                        {formatFecha(item.fecha)}
                      </td>
                      <td className="py-2 font-mono text-gray-900 dark:text-gray-100">
                        {item.tasa.toLocaleString('es-MX', {
                          minimumFractionDigits: 4,
                          maximumFractionDigits: 4
                        })}
                      </td>
                      <td className="py-2 text-gray-500 dark:text-gray-400">
                        {item.fuente || 'manual'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </ConfiguracionPageLayout>
  );
}

/**
 * Componente: Calculadora de Conversión
 */
function ConversionCalculator({ monedas }) {
  const [monto, setMonto] = useState('100');
  const [origen, setOrigen] = useState('USD');
  const [destino, setDestino] = useState('MXN');
  const [resultado, setResultado] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleConvertir = async () => {
    if (!monto || parseFloat(monto) <= 0) return;

    setIsConverting(true);
    try {
      const response = await monedasApi.convertir({
        monto: parseFloat(monto),
        origen,
        destino,
      });
      setResultado(response.data.data);
    } catch (error) {
      setResultado({ error: error.response?.data?.message || 'Error al convertir' });
    } finally {
      setIsConverting(false);
    }
  };

  const monedasActivas = monedas.filter(m => m.activo);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Monto
          </label>
          <Input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            min="0.01"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            De
          </label>
          <select
            value={origen}
            onChange={(e) => setOrigen(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          >
            {monedasActivas.map(m => (
              <option key={m.codigo} value={m.codigo}>
                {m.codigo} ({m.simbolo})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            A
          </label>
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          >
            {monedasActivas.map(m => (
              <option key={m.codigo} value={m.codigo}>
                {m.codigo} ({m.simbolo})
              </option>
            ))}
          </select>
        </div>

        <Button onClick={handleConvertir} disabled={isConverting}>
          {isConverting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRightLeft className="w-4 h-4" />
          )}
          Convertir
        </Button>
      </div>

      {resultado && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          {resultado.error ? (
            <p className="text-red-600 dark:text-red-400">{resultado.error}</p>
          ) : (
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {resultado.monto_original.toLocaleString('es-MX')} {resultado.moneda_origen} =
              </div>
              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {resultado.monto_convertido.toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} {resultado.moneda_destino}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Tasa: {resultado.tasa_utilizada.toFixed(4)} | Fuente: {resultado.fuente_tasa}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MonedasPage;
