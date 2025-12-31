/**
 * Modal para ver detalle de liquidacion y registrar pago
 */

import { useState } from 'react';
import {
  Clock,
  CheckCircle,
  DollarSign,
  XCircle,
  Calendar,
  Building2,
  Percent,
  CreditCard,
  FileText,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useLiquidacionConsigna,
  useConfirmarLiquidacion,
  usePagarLiquidacion,
  useCancelarLiquidacion,
} from '@/hooks/useConsigna';

const ESTADOS = {
  borrador: { label: 'Borrador', color: 'gray', icon: Clock },
  confirmada: { label: 'Confirmada', color: 'blue', icon: CheckCircle },
  pagada: { label: 'Pagada', color: 'green', icon: DollarSign },
  cancelada: { label: 'Cancelada', color: 'red', icon: XCircle },
};

const METODOS_PAGO = [
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'otro', label: 'Otro' },
];

export default function LiquidacionDetalleModal({ liquidacion, isOpen, onClose }) {
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [datosPago, setDatosPago] = useState({
    fecha_pago: format(new Date(), 'yyyy-MM-dd'),
    metodo_pago: 'transferencia',
    referencia_pago: '',
  });
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);

  // Query para obtener detalle completo
  const { data: detalle, isLoading } = useLiquidacionConsigna(liquidacion?.id);

  // Mutations
  const confirmarMutation = useConfirmarLiquidacion();
  const pagarMutation = usePagarLiquidacion();
  const cancelarMutation = useCancelarLiquidacion();

  if (!liquidacion) return null;

  const liq = detalle || liquidacion;
  const estadoInfo = ESTADOS[liq.estado] || ESTADOS.borrador;
  const IconEstado = estadoInfo.icon;

  const colorClasses = {
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  const handleConfirmar = () => setShowConfirmar(true);
  const handleCancelar = () => setShowCancelar(true);

  const doConfirmar = () => {
    confirmarMutation.mutate(liq.id, {
      onSuccess: () => {
        setShowConfirmar(false);
        onClose();
      },
      onError: () => setShowConfirmar(false),
    });
  };

  const doCancelar = () => {
    cancelarMutation.mutate(liq.id, {
      onSuccess: () => {
        setShowCancelar(false);
        onClose();
      },
      onError: () => setShowCancelar(false),
    });
  };

  const handlePagar = () => {
    pagarMutation.mutate(
      {
        id: liq.id,
        data: datosPago,
      },
      {
        onSuccess: () => {
          setShowPagoForm(false);
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Liquidacion ${liq.folio}`} size="lg">
      <div className="space-y-6">
        {/* Estado */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full ${colorClasses[estadoInfo.color]}`}
          >
            <IconEstado className="h-4 w-4" />
            {estadoInfo.label}
          </span>
          {liq.creado_en && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Creada: {format(new Date(liq.creado_en), 'dd/MM/yyyy HH:mm', { locale: es })}
            </span>
          )}
        </div>

        {/* Info general */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Proveedor</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {liq.proveedor_nombre}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Acuerdo</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {liq.acuerdo_folio}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Periodo</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {liq.fecha_desde && format(new Date(liq.fecha_desde), 'dd/MM/yyyy', { locale: es })}
                {' - '}
                {liq.fecha_hasta && format(new Date(liq.fecha_hasta), 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Resumen</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Total Ventas:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(parseFloat(liq.subtotal_ventas || 0))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Percent className="h-3 w-3" />
                Comision ({liq.porcentaje_comision || 0}%):
              </span>
              <span className="text-red-600 dark:text-red-400">
                - {formatCurrency(parseFloat(liq.comision || 0))}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <span className="font-medium text-gray-900 dark:text-gray-100">Total a Pagar:</span>
              <span className="font-bold text-lg text-green-600 dark:text-green-400">
                {formatCurrency(parseFloat(liq.total_pagar_proveedor || 0))}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Unidades vendidas: {liq.total_unidades || 0}
            </div>
          </div>
        </div>

        {/* Info de pago (si esta pagada) */}
        {liq.estado === 'pagada' && liq.fecha_pago && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Datos del Pago
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-600 dark:text-green-400">Fecha:</span>
                <p className="font-medium text-green-800 dark:text-green-200">
                  {format(new Date(liq.fecha_pago), 'dd/MM/yyyy', { locale: es })}
                </p>
              </div>
              <div>
                <span className="text-green-600 dark:text-green-400">Metodo:</span>
                <p className="font-medium text-green-800 dark:text-green-200">
                  {METODOS_PAGO.find((m) => m.value === liq.metodo_pago)?.label || liq.metodo_pago}
                </p>
              </div>
              {liq.referencia_pago && (
                <div className="col-span-2">
                  <span className="text-green-600 dark:text-green-400">Referencia:</span>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    {liq.referencia_pago}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formulario de pago */}
        {showPagoForm && liq.estado === 'confirmada' && (
          <div className="p-4 border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <h3 className="font-medium text-primary-800 dark:text-primary-200 mb-4">
              Registrar Pago
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-primary-600 dark:text-primary-400 mb-1">
                    Fecha de Pago
                  </label>
                  <input
                    type="date"
                    value={datosPago.fecha_pago}
                    onChange={(e) => setDatosPago({ ...datosPago, fecha_pago: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-primary-600 dark:text-primary-400 mb-1">
                    Metodo de Pago
                  </label>
                  <select
                    value={datosPago.metodo_pago}
                    onChange={(e) => setDatosPago({ ...datosPago, metodo_pago: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  >
                    {METODOS_PAGO.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-primary-600 dark:text-primary-400 mb-1">
                  Referencia (opcional)
                </label>
                <input
                  type="text"
                  value={datosPago.referencia_pago}
                  onChange={(e) => setDatosPago({ ...datosPago, referencia_pago: e.target.value })}
                  placeholder="Numero de transferencia, cheque, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPagoForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handlePagar}
                  disabled={pagarMutation.isPending}
                  isLoading={pagarMutation.isPending}
                >
                  Confirmar Pago
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          {liq.estado === 'borrador' && (
            <>
              <Button onClick={handleConfirmar} disabled={confirmarMutation.isPending}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirmar Liquidacion
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancelar}
                disabled={cancelarMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </>
          )}
          {liq.estado === 'confirmada' && !showPagoForm && (
            <Button onClick={() => setShowPagoForm(true)}>
              <DollarSign className="h-4 w-4 mr-1" />
              Registrar Pago
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmar}
        onClose={() => setShowConfirmar(false)}
        onConfirm={doConfirmar}
        title="Confirmar Liquidacion"
        message="Confirmar esta liquidacion? Se marcara como lista para pago."
        confirmText="Confirmar"
        isLoading={confirmarMutation.isPending}
      />
      <ConfirmDialog
        isOpen={showCancelar}
        onClose={() => setShowCancelar(false)}
        onConfirm={doCancelar}
        title="Cancelar Liquidacion"
        message="Cancelar esta liquidacion? Los movimientos quedaran disponibles para una nueva liquidacion."
        confirmText="Cancelar Liquidacion"
        variant="danger"
        isLoading={cancelarMutation.isPending}
      />
    </Modal>
  );
}
