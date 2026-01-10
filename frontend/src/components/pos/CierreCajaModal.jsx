import { useState, useEffect } from 'react';
import { DollarSign, Lock, FileText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useResumenSesionCaja, useCerrarSesionCaja } from '@/hooks/usePOS';
import { useToast } from '@/hooks/useToast';

/**
 * Modal para cerrar sesión de caja
 * Muestra resumen y permite ingresar monto contado
 */
export default function CierreCajaModal({
  isOpen,
  onClose,
  sesionId,
  onSuccess
}) {
  const [montoContado, setMontoContado] = useState('');
  const [notaCierre, setNotaCierre] = useState('');

  const { success: toastSuccess, warning: toastWarning, error: toastError } = useToast();
  const { data: resumen, isLoading: isLoadingResumen } = useResumenSesionCaja(sesionId);
  const cerrarSesionMutation = useCerrarSesionCaja();

  // Calcular monto esperado del sistema
  const montoEsperado = parseFloat(resumen?.totales?.monto_esperado) || 0;
  const montoContadoNum = parseFloat(montoContado) || 0;
  const diferencia = montoContadoNum - montoEsperado;

  // Resetear cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setMontoContado('');
      setNotaCierre('');
    }
  }, [isOpen]);

  const handleCerrar = async () => {
    if (!montoContado) {
      toastWarning('Debes ingresar el monto contado en caja');
      return;
    }

    try {
      const resultado = await cerrarSesionMutation.mutateAsync({
        sesion_id: sesionId,
        monto_contado: montoContadoNum,
        nota_cierre: notaCierre.trim() || undefined
      });

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cerrar Caja"
      subtitle="Revisa el resumen y cuenta el efectivo"
      size="md"
      footer={footerContent}
      disableClose={cerrarSesionMutation.isPending}
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
                inputSize="lg"
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
              </div>
            </div>

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
      </div>
    </Modal>
  );
}
