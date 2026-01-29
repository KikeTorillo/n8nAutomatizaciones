/**
 * ====================================================================
 * CLIENTE CREDITO TAB - Tab de Crédito/Fiado
 * ====================================================================
 *
 * Tab para gestionar el crédito del cliente:
 * - Panel de estado del crédito
 * - Acciones: Suspender/Reactivar, Registrar Abono
 * - Historial de movimientos
 *
 * Enero 2026
 * ====================================================================
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { PauseCircle, PlayCircle, DollarSign, AlertTriangle } from 'lucide-react';
import { Button, ConfirmDialog } from '@/components/ui';
import { useToast } from '@/hooks/utils';
import {
  useEstadoCredito,
  useSuspenderCredito,
  useReactivarCredito,
  useRegistrarAbono,
  useMovimientosCredito,
} from '@/hooks/personas';
import {
  CreditoEstadoCard,
  AbonoFormModal,
  MovimientosTable,
} from '@/components/clientes/credito';

/**
 * Tab de crédito del cliente
 */
export default function ClienteCreditoTab({ clienteId }) {
  const { toast } = useToast();

  // Estados locales para modals
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showSuspenderModal, setShowSuspenderModal] = useState(false);
  const [motivoSuspension, setMotivoSuspension] = useState('');

  // Queries
  const { data: estadoCredito, isLoading: isLoadingEstado } = useEstadoCredito(clienteId);
  const { data: movimientosData, isLoading: isLoadingMovimientos } = useMovimientosCredito(clienteId);

  // Mutations
  const suspenderCredito = useSuspenderCredito();
  const reactivarCredito = useReactivarCredito();
  const registrarAbono = useRegistrarAbono();

  // Extraer datos
  const movimientos = movimientosData?.movimientos || [];
  const paginacion = movimientosData?.paginacion;
  const creditoActivo = estadoCredito?.permite_credito && !estadoCredito?.credito_suspendido;

  // Handlers
  const handleSuspender = async () => {
    try {
      await suspenderCredito.mutateAsync({
        clienteId,
        motivo: motivoSuspension || 'Suspendido manualmente',
      });
      toast.success('Crédito suspendido exitosamente');
      setShowSuspenderModal(false);
      setMotivoSuspension('');
    } catch (error) {
      toast.error(error.message || 'Error al suspender crédito');
    }
  };

  const handleReactivar = async () => {
    try {
      await reactivarCredito.mutateAsync(clienteId);
      toast.success('Crédito reactivado exitosamente');
    } catch (error) {
      toast.error(error.message || 'Error al reactivar crédito');
    }
  };

  const handleRegistrarAbono = async (data) => {
    try {
      await registrarAbono.mutateAsync({
        clienteId,
        monto: data.monto,
        descripcion: data.descripcion,
      });
      toast.success(`Abono de $${data.monto.toFixed(2)} registrado`);
      setShowAbonoModal(false);
    } catch (error) {
      toast.error(error.message || 'Error al registrar abono');
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel de Estado del Crédito */}
      <CreditoEstadoCard
        estadoCredito={estadoCredito}
        isLoading={isLoadingEstado}
      />

      {/* Acciones */}
      {estadoCredito?.permite_credito && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Acciones de Crédito
          </h4>
          <div className="flex flex-wrap gap-3">
            {/* Botón Suspender/Reactivar */}
            {creditoActivo ? (
              <Button
                variant="outline"
                onClick={() => setShowSuspenderModal(true)}
                disabled={suspenderCredito.isPending}
                className="text-yellow-600 border-yellow-300 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-700 dark:hover:bg-yellow-900/20"
              >
                <PauseCircle className="w-4 h-4 mr-2" />
                Suspender Crédito
              </Button>
            ) : estadoCredito?.credito_suspendido ? (
              <Button
                variant="outline"
                onClick={handleReactivar}
                disabled={reactivarCredito.isPending}
                className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                {reactivarCredito.isPending ? 'Reactivando...' : 'Reactivar Crédito'}
              </Button>
            ) : null}

            {/* Botón Registrar Abono */}
            {estadoCredito?.saldo_credito > 0 && (
              <Button
                onClick={() => setShowAbonoModal(true)}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Registrar Abono
              </Button>
            )}
          </div>

          {/* Aviso si está suspendido */}
          {estadoCredito?.credito_suspendido && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Crédito suspendido
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  El cliente no puede realizar compras a crédito hasta que se reactive.
                  {estadoCredito?.motivo_suspension && (
                    <> Motivo: {estadoCredito.motivo_suspension}</>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historial de Movimientos */}
      {estadoCredito?.permite_credito && (
        <MovimientosTable
          movimientos={movimientos}
          paginacion={paginacion}
          isLoading={isLoadingMovimientos}
        />
      )}

      {/* Modal de Abono */}
      <AbonoFormModal
        isOpen={showAbonoModal}
        onClose={() => setShowAbonoModal(false)}
        onSubmit={handleRegistrarAbono}
        isLoading={registrarAbono.isPending}
        saldoPendiente={estadoCredito?.saldo_credito || 0}
      />

      {/* Modal de Confirmación para Suspender */}
      <ConfirmDialog
        isOpen={showSuspenderModal}
        onClose={() => {
          setShowSuspenderModal(false);
          setMotivoSuspension('');
        }}
        onConfirm={handleSuspender}
        title="Suspender Crédito"
        message={
          <div className="space-y-4">
            <p>
              ¿Estás seguro de suspender el crédito de este cliente?
              El cliente no podrá realizar compras a crédito hasta que se reactive.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Motivo (opcional)
              </label>
              <textarea
                value={motivoSuspension}
                onChange={(e) => setMotivoSuspension(e.target.value)}
                placeholder="Ej: Saldo vencido, falta de pago..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        }
        confirmLabel={suspenderCredito.isPending ? 'Suspendiendo...' : 'Suspender'}
        confirmVariant="warning"
        isLoading={suspenderCredito.isPending}
      />
    </div>
  );
}

ClienteCreditoTab.propTypes = {
  clienteId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
