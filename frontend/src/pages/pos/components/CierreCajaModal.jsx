import { useState, useEffect, useMemo } from 'react';
import { DollarSign, Lock, FileText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Input, Drawer } from '@/components/ui';
import { useResumenSesionCaja, useCerrarSesionCaja } from '@/hooks/pos';
import { useToast } from '@/hooks/utils';

// Denominaciones del peso mexicano
const DENOMINACIONES = {
  billetes: [
    { key: 'billetes_1000', valor: 1000, label: '$1,000' },
    { key: 'billetes_500', valor: 500, label: '$500' },
    { key: 'billetes_200', valor: 200, label: '$200' },
    { key: 'billetes_100', valor: 100, label: '$100' },
    { key: 'billetes_50', valor: 50, label: '$50' },
    { key: 'billetes_20', valor: 20, label: '$20' },
  ],
  monedas: [
    { key: 'monedas_10', valor: 10, label: '$10' },
    { key: 'monedas_5', valor: 5, label: '$5' },
    { key: 'monedas_2', valor: 2, label: '$2' },
    { key: 'monedas_1', valor: 1, label: '$1' },
    { key: 'monedas_050', valor: 0.5, label: '$0.50' },
  ],
};

// Estado inicial del desglose
const DESGLOSE_INICIAL = {
  billetes_1000: 0,
  billetes_500: 0,
  billetes_200: 0,
  billetes_100: 0,
  billetes_50: 0,
  billetes_20: 0,
  monedas_10: 0,
  monedas_5: 0,
  monedas_2: 0,
  monedas_1: 0,
  monedas_050: 0,
};

/**
 * Modal para cerrar sesión de caja
 * Muestra resumen, permite ingresar monto contado y desglose de billetes
 */
export default function CierreCajaModal({
  isOpen,
  onClose,
  sesionId,
  onSuccess
}) {
  const [montoContado, setMontoContado] = useState('');
  const [notaCierre, setNotaCierre] = useState('');
  const [mostrarDesglose, setMostrarDesglose] = useState(false);
  const [desglose, setDesglose] = useState(DESGLOSE_INICIAL);

  const { success: toastSuccess, warning: toastWarning, error: toastError } = useToast();
  const { data: resumen, isLoading: isLoadingResumen } = useResumenSesionCaja(sesionId);
  const cerrarSesionMutation = useCerrarSesionCaja();

  // Calcular monto esperado del sistema
  const montoEsperado = parseFloat(resumen?.totales?.monto_esperado) || 0;
  const montoContadoNum = parseFloat(montoContado) || 0;
  const diferencia = montoContadoNum - montoEsperado;

  // Calcular total del desglose de billetes/monedas
  const totalDesglose = useMemo(() => {
    return Object.entries(desglose).reduce((total, [key, cantidad]) => {
      const denominacion = [...DENOMINACIONES.billetes, ...DENOMINACIONES.monedas].find(d => d.key === key);
      return total + (denominacion ? denominacion.valor * cantidad : 0);
    }, 0);
  }, [desglose]);

  // Resetear cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setMontoContado('');
      setNotaCierre('');
      setMostrarDesglose(false);
      setDesglose(DESGLOSE_INICIAL);
    }
  }, [isOpen]);

  // Handler para actualizar cantidad de una denominación
  const handleDenominacionChange = (key, value) => {
    const cantidad = Math.max(0, parseInt(value) || 0);
    setDesglose(prev => ({ ...prev, [key]: cantidad }));
  };

  // Aplicar total del desglose como monto contado
  const handleAplicarDesglose = () => {
    setMontoContado(totalDesglose.toFixed(2));
  };

  const handleCerrar = async () => {
    if (!montoContado) {
      toastWarning('Debes ingresar el monto contado en caja');
      return;
    }

    try {
      // Preparar datos de cierre
      const datosClerre = {
        sesion_id: sesionId,
        monto_contado: montoContadoNum,
        nota_cierre: notaCierre.trim() || undefined,
      };

      // Incluir desglose solo si se usó
      if (mostrarDesglose && totalDesglose > 0) {
        datosClerre.desglose = desglose;
      }

      const resultado = await cerrarSesionMutation.mutateAsync(datosClerre);

      const mensaje = diferencia === 0
        ? 'Caja cerrada correctamente sin diferencias'
        : diferencia > 0
          ? `Caja cerrada con sobrante de $${diferencia.toFixed(2)}`
          : `Caja cerrada con faltante de $${Math.abs(diferencia).toFixed(2)}`;

      if (diferencia === 0) {
        toastSuccess(mensaje);
      } else {
        toastWarning(mensaje);
      }

      onSuccess?.(resultado);
      onClose();
    } catch (error) {
      toastError(`Error al cerrar caja: ${error.message}`);
    }
  };

  const footerContent = (
    <>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={cerrarSesionMutation.isPending}
      >
        Cancelar
      </Button>
      <Button
        variant="danger"
        size="lg"
        onClick={handleCerrar}
        isLoading={cerrarSesionMutation.isPending}
        disabled={!montoContado}
      >
        <Lock className="h-5 w-5 mr-2" />
        Cerrar Caja
      </Button>
    </>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Cerrar Caja"
      subtitle="Revisa el resumen y cuenta el efectivo"
    >
      <div className="space-y-6">
        {isLoadingResumen ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        ) : (
          <>
            {/* Resumen de la sesión */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-500" />
                Resumen de la sesión
              </h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Monto inicial</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    ${(parseFloat(resumen?.sesion?.monto_inicial) || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Ventas efectivo</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    +${(parseFloat(resumen?.totales?.total_ventas_efectivo) || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Entradas</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    +${(parseFloat(resumen?.totales?.total_entradas) || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Salidas</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    -${(parseFloat(resumen?.totales?.total_salidas) || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Monto esperado */}
            <div className="bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4">
              <p className="text-sm font-medium text-primary-900 dark:text-primary-300 mb-1">
                Monto esperado en caja
              </p>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                ${montoEsperado.toFixed(2)}
              </p>
            </div>

            {/* Monto contado */}
            <div>
              <Input
                type="number"
                label="Monto contado en caja"
                prefix="$"
                size="lg"
                value={montoContado}
                onChange={(e) => setMontoContado(e.target.value)}
                step="0.01"
                min="0"
                placeholder={montoEsperado.toFixed(2)}
                autoFocus
              />

              {/* Botones de monto rápido */}
              <div className="mt-3 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMontoContado(montoEsperado.toFixed(2))}
                >
                  Monto exacto
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarDesglose(!mostrarDesglose)}
                >
                  <Calculator className="h-4 w-4 mr-1" />
                  Desglose de billetes
                  {mostrarDesglose ? (
                    <ChevronUp className="h-4 w-4 ml-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-1" />
                  )}
                </Button>
              </div>
            </div>

            {/* Desglose de billetes y monedas */}
            {mostrarDesglose && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-gray-500" />
                    Desglose de efectivo
                  </h3>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total contado</p>
                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      ${totalDesglose.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Billetes */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Billetes</p>
                  <div className="grid grid-cols-3 gap-2">
                    {DENOMINACIONES.billetes.map((den) => (
                      <div key={den.key} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400 w-12">{den.label}</span>
                        <input
                          type="number"
                          min="0"
                          value={desglose[den.key] || ''}
                          onChange={(e) => handleDenominacionChange(den.key, e.target.value)}
                          placeholder="0"
                          className="w-16 px-2 py-1 text-center text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          = ${(desglose[den.key] * den.valor).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monedas */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monedas</p>
                  <div className="grid grid-cols-3 gap-2">
                    {DENOMINACIONES.monedas.map((den) => (
                      <div key={den.key} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400 w-12">{den.label}</span>
                        <input
                          type="number"
                          min="0"
                          value={desglose[den.key] || ''}
                          onChange={(e) => handleDenominacionChange(den.key, e.target.value)}
                          placeholder="0"
                          className="w-16 px-2 py-1 text-center text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          = ${(desglose[den.key] * den.valor).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botón aplicar desglose */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAplicarDesglose}
                    disabled={totalDesglose === 0}
                    className="w-full"
                  >
                    Aplicar ${totalDesglose.toFixed(2)} como monto contado
                  </Button>
                </div>
              </div>
            )}

            {/* Diferencia */}
            {montoContado && (
              <div className={`
                rounded-lg p-4 border-2
                ${diferencia === 0
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                  : diferencia > 0
                    ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
                    : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
                }
              `}>
                <div className="flex items-center gap-3">
                  {diferencia === 0 ? (
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : diferencia > 0 ? (
                    <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      diferencia === 0
                        ? 'text-green-900 dark:text-green-300'
                        : diferencia > 0
                          ? 'text-yellow-900 dark:text-yellow-300'
                          : 'text-red-900 dark:text-red-300'
                    }`}>
                      {diferencia === 0 ? 'Sin diferencia' : diferencia > 0 ? 'Sobrante' : 'Faltante'}
                    </p>
                    <p className={`text-2xl font-bold ${
                      diferencia === 0
                        ? 'text-green-600 dark:text-green-400'
                        : diferencia > 0
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}>
                      ${Math.abs(diferencia).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Alerta si hay diferencia significativa */}
            {montoContado && Math.abs(diferencia) > 100 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  La diferencia es mayor a $100. Verifica el conteo antes de cerrar.
                </p>
              </div>
            )}

            {/* Nota de cierre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <FileText className="inline h-4 w-4 mr-1" />
                Nota de cierre (opcional)
              </label>
              <textarea
                value={notaCierre}
                onChange={(e) => setNotaCierre(e.target.value)}
                placeholder="Ej: Se entregó fondo a gerencia"
                rows={2}
                maxLength={500}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
            </div>
          </>
        )}

        {/* Footer con botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {footerContent}
        </div>
      </div>
    </Drawer>
  );
}
