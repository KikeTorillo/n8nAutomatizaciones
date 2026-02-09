import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Clock, DollarSign, Plus, User } from 'lucide-react';
import { Button, Drawer, Input } from '@/components/ui';
import { useMovimientosCaja, useRegistrarMovimientoCaja } from '@/hooks/pos';
import { useToast } from '@/hooks/utils';

/**
 * Drawer para ver y registrar movimientos de caja (entradas/salidas)
 */
export default function MovimientosCajaDrawer({
  isOpen,
  onClose,
  sesionId
}) {
  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState('entrada');
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');

  const { success: toastSuccess, warning: toastWarning, error: toastError } = useToast();
  const { data: movimientos, isLoading } = useMovimientosCaja(sesionId);
  const registrarMutation = useRegistrarMovimientoCaja();

  const handleRegistrar = async () => {
    if (!monto || parseFloat(monto) <= 0) {
      toastWarning('El monto debe ser mayor a 0');
      return;
    }

    if (!motivo.trim()) {
      toastWarning('Debes indicar el motivo del movimiento');
      return;
    }

    try {
      await registrarMutation.mutateAsync({
        sesionId,
        data: {
          tipo,
          monto: parseFloat(monto),
          motivo: motivo.trim()
        }
      });

      const tipoMsg = tipo === 'entrada' ? 'Entrada' : 'Salida';
      toastSuccess(`${tipoMsg} registrada: $${parseFloat(monto).toFixed(2)} - ${motivo}`);

      // Resetear formulario
      setShowForm(false);
      setMonto('');
      setMotivo('');
    } catch (error) {
      toastError(`Error al registrar: ${error.message}`);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular totales
  const totalEntradas = (movimientos || [])
    .filter(m => m.tipo === 'entrada')
    .reduce((sum, m) => sum + parseFloat(m.monto), 0);

  const totalSalidas = (movimientos || [])
    .filter(m => m.tipo === 'salida')
    .reduce((sum, m) => sum + parseFloat(m.monto), 0);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Movimientos de Caja"
      subtitle="Entradas y salidas de efectivo"
    >
      <div className="space-y-6">
        {/* Resumen */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Entradas</span>
            </div>
            <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
              ${totalEntradas.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">Salidas</span>
            </div>
            <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
              ${totalSalidas.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Botón agregar */}
        {!showForm && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Movimiento
          </Button>
        )}

        {/* Formulario */}
        {showForm && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Registrar movimiento</h4>

            {/* Tipo de movimiento */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTipo('entrada')}
                className={`
                  flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all
                  ${tipo === 'entrada'
                    ? 'bg-green-100 dark:bg-green-900/50 border-green-500 ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-800'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-green-300'
                  }
                `}
              >
                <ArrowDownCircle className={`h-5 w-5 ${tipo === 'entrada' ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`font-medium ${tipo === 'entrada' ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  Entrada
                </span>
              </button>
              <button
                onClick={() => setTipo('salida')}
                className={`
                  flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all
                  ${tipo === 'salida'
                    ? 'bg-red-100 dark:bg-red-900/50 border-red-500 ring-2 ring-red-500 ring-offset-2 dark:ring-offset-gray-800'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-red-300'
                  }
                `}
              >
                <ArrowUpCircle className={`h-5 w-5 ${tipo === 'salida' ? 'text-red-600' : 'text-gray-400'}`} />
                <span className={`font-medium ${tipo === 'salida' ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  Salida
                </span>
              </button>
            </div>

            {/* Monto */}
            <Input
              type="number"
              label="Monto"
              prefix="$"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              step="0.01"
              min="0.01"
              placeholder="0.00"
              autoFocus
            />

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Motivo
              </label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={tipo === 'entrada' ? 'Ej: Cambio de billete grande' : 'Ej: Pago a proveedor'}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setMonto('');
                  setMotivo('');
                }}
                disabled={registrarMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant={tipo === 'entrada' ? 'success' : 'danger'}
                size="sm"
                onClick={handleRegistrar}
                isLoading={registrarMutation.isPending}
                className="flex-1"
              >
                {tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
              </Button>
            </div>
          </div>
        )}

        {/* Lista de movimientos */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Historial de movimientos
          </h4>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          ) : !movimientos || movimientos.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No hay movimientos registrados
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {movimientos.map((mov) => (
                <div
                  key={mov.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border
                    ${mov.tipo === 'entrada'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }
                  `}
                >
                  {mov.tipo === 'entrada' ? (
                    <ArrowDownCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <ArrowUpCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {mov.motivo}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{formatearFecha(mov.creado_en)}</span>
                      {mov.usuario_nombre && (
                        <>
                          <User className="h-3 w-3 ml-2" />
                          <span>{mov.usuario_nombre}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className={`
                    font-bold text-lg
                    ${mov.tipo === 'entrada'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                    }
                  `}>
                    {mov.tipo === 'entrada' ? '+' : '-'}${parseFloat(mov.monto).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
