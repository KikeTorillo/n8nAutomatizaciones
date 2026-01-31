/**
 * ====================================================================
 * MI PLAN PAGE - PÁGINA DE PLAN DEL USUARIO
 * ====================================================================
 *
 * Permite a usuarios ver su suscripción activa, features incluidos,
 * próximo cobro, y gestionar su plan (cambiar, cancelar, pausar).
 *
 * ====================================================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  Clock,
  Check,
  AlertCircle,
  Pause,
  X,
  ArrowUpRight,
  Package,
  Zap,
} from 'lucide-react';
import {
  Button,
  Badge,
  LoadingSpinner,
  ConfirmDialog,
  BackButton,
} from '@/components/ui';
import {
  useMiSuscripcion,
  usePausarSuscripcion,
  useReactivarSuscripcion,
  useResumenUso,
  ESTADOS_SUSCRIPCION,
} from '@/hooks/suscripciones-negocio';
import {
  SuscripcionStatusBadge,
  CancelarSuscripcionDrawer,
  HistorialPagosCard,
} from '@/components/suscripciones-negocio';
import UsageIndicator from '@/components/suscripciones-negocio/UsageIndicator';
import BalanceAjustesCard from '@/components/suscripciones-negocio/BalanceAjustesCard';
import { useToast } from '@/hooks/utils';
import { formatCurrency, formatDate } from '@/lib/utils';
import CambiarPlanDrawer from '@/components/suscripciones-negocio/CambiarPlanDrawer';

/**
 * Componente de estado vacío cuando no hay suscripción
 */
function NoSuscripcionCard() {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
      <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <Package className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No tienes una suscripción activa
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Explora nuestros planes y elige el que mejor se adapte a las necesidades de tu negocio.
      </p>
      <Button
        variant="primary"
        onClick={() => navigate('/planes')}
      >
        <Zap className="w-4 h-4 mr-2" />
        Ver Planes Disponibles
      </Button>
    </div>
  );
}

/**
 * Card del plan actual
 */
function PlanActualCard({ suscripcion, onCambiarPlan, onCancelar, onPausar, onReactivar, isPending }) {
  const diasTrialRestantes = suscripcion.dias_trial_restantes;
  const esTrial = suscripcion.es_trial && diasTrialRestantes > 0;
  const isPausable = suscripcion.estado === ESTADOS_SUSCRIPCION.ACTIVA;
  const isReactivable = suscripcion.estado === ESTADOS_SUSCRIPCION.PAUSADA;
  const isCancelable =
    suscripcion.estado !== ESTADOS_SUSCRIPCION.CANCELADA &&
    suscripcion.estado !== ESTADOS_SUSCRIPCION.VENCIDA;

  // Features del plan
  const features = suscripcion.plan_features || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold">{suscripcion.plan_nombre}</h2>
              <SuscripcionStatusBadge estado={suscripcion.estado} />
            </div>
            <p className="text-primary-100 text-sm">
              Plan {suscripcion.plan_codigo}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {formatCurrency(suscripcion.precio_actual)}
            </div>
            <div className="text-primary-100 text-sm">
              /{suscripcion.periodo === 'mensual' ? 'mes' : suscripcion.periodo}
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de trial */}
      {esTrial && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {diasTrialRestantes} día{diasTrialRestantes !== 1 ? 's' : ''} restante{diasTrialRestantes !== 1 ? 's' : ''} de prueba
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Tu período de prueba terminará el {formatDate(suscripcion.fecha_fin_trial)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="p-6">
        {/* Info de fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de inicio</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatDate(suscripcion.fecha_inicio)}
              </p>
            </div>
          </div>
          {suscripcion.fecha_proximo_cobro && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Próximo cobro</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(suscripcion.fecha_proximo_cobro)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features del plan */}
        {features.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Incluido en tu plan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Descuento aplicado */}
        {(suscripcion.descuento_porcentaje || suscripcion.descuento_monto) && (
          <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">Descuento activo</Badge>
              <span className="text-sm text-green-700 dark:text-green-300">
                {suscripcion.descuento_porcentaje
                  ? `${suscripcion.descuento_porcentaje}% de descuento`
                  : `${formatCurrency(suscripcion.descuento_monto)} de descuento`}
              </span>
            </div>
          </div>
        )}

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {suscripcion.meses_activo || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Meses activo</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(suscripcion.total_pagado || 0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total pagado</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={onCambiarPlan}
            disabled={isPending}
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Cambiar Plan
          </Button>
          {isPausable && (
            <Button
              variant="outline"
              onClick={onPausar}
              disabled={isPending}
            >
              <Pause className="w-4 h-4 mr-2" />
              Pausar
            </Button>
          )}
          {isReactivable && (
            <Button
              variant="primary"
              onClick={onReactivar}
              disabled={isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Reactivar
            </Button>
          )}
          {isCancelable && (
            <Button
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={onCancelar}
              disabled={isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar Suscripción
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal Mi Plan
 */
function MiPlanPage() {
  const { success, error: showError } = useToast();

  // State
  const [confirmAction, setConfirmAction] = useState(null);
  const [showCambiarPlan, setShowCambiarPlan] = useState(false);
  const [showCancelarDrawer, setShowCancelarDrawer] = useState(false);

  // Queries
  const { data: suscripcion, isLoading, refetch } = useMiSuscripcion();
  const { data: resumenUso } = useResumenUso();

  // Mutations
  const pausarMutation = usePausarSuscripcion();
  const reactivarMutation = useReactivarSuscripcion();

  const isPending = pausarMutation.isPending || reactivarMutation.isPending;

  // Handlers
  const handleCancelar = () => {
    setShowCancelarDrawer(true);
  };

  const handleCancelarSuccess = () => {
    setShowCancelarDrawer(false);
    refetch();
  };

  const handlePausar = () => {
    setConfirmAction({
      title: 'Pausar Suscripción',
      message: '¿Estás seguro de pausar tu suscripción? No se realizarán cobros mientras esté pausada.',
      variant: 'warning',
      onConfirm: () => {
        pausarMutation.mutate(
          { id: suscripcion.id, motivo: 'Pausada por usuario' },
          {
            onSuccess: () => {
              success('Suscripción pausada. Puedes reactivarla en cualquier momento.');
              refetch();
            },
            onError: (err) => showError(err.message),
          }
        );
        setConfirmAction(null);
      },
    });
  };

  const handleReactivar = () => {
    reactivarMutation.mutate(suscripcion.id, {
      onSuccess: () => {
        success('Suscripción reactivada correctamente');
        refetch();
      },
      onError: (err) => showError(err.message),
    });
  };

  const handleCambiarPlanSuccess = () => {
    setShowCambiarPlan(false);
    refetch();
    success('Plan cambiado exitosamente');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <CreditCard className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mi Plan</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gestiona tu suscripción y visualiza los detalles de tu plan actual
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {suscripcion ? (
          <>
            <PlanActualCard
              suscripcion={suscripcion}
              onCambiarPlan={() => setShowCambiarPlan(true)}
              onCancelar={handleCancelar}
              onPausar={handlePausar}
              onReactivar={handleReactivar}
              isPending={isPending}
            />

            {/* Balance de ajustes pendientes (créditos/cargos) */}
            {suscripcion.balance_ajustes && (
              <BalanceAjustesCard
                balance={suscripcion.balance_ajustes}
                moneda={suscripcion.moneda}
              />
            )}

            {/* Uso de usuarios (Seat-based billing) */}
            {resumenUso && resumenUso.tieneSuscripcion !== false && (
              <UsageIndicator
                usuariosActuales={resumenUso.usuariosActuales}
                usuariosIncluidos={resumenUso.usuariosIncluidos}
                maxUsuariosHard={resumenUso.maxUsuariosHard}
                porcentajeUso={resumenUso.porcentajeUso}
                estadoUso={resumenUso.estadoUso}
                cobroAdicionalProyectado={resumenUso.cobroAdicionalProyectado}
                precioUsuarioAdicional={resumenUso.precioUsuarioAdicional}
                esHardLimit={resumenUso.esHardLimit}
                planNombre={resumenUso.planNombre}
              />
            )}

            {/* Historial de pagos - usa ultimos_pagos que viene con la suscripción */}
            <HistorialPagosCard
              pagos={suscripcion.ultimos_pagos}
            />
          </>
        ) : (
          <NoSuscripcionCard />
        )}
      </div>

      {/* Cambiar Plan Drawer */}
      {suscripcion && (
        <CambiarPlanDrawer
          isOpen={showCambiarPlan}
          onClose={() => setShowCambiarPlan(false)}
          suscripcion={suscripcion}
          onSuccess={handleCambiarPlanSuccess}
          isUserPage={true}
        />
      )}

      {/* Cancelar Suscripción Drawer */}
      {suscripcion && (
        <CancelarSuscripcionDrawer
          isOpen={showCancelarDrawer}
          onClose={() => setShowCancelarDrawer(false)}
          suscripcion={suscripcion}
          onSuccess={handleCancelarSuccess}
        />
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <ConfirmDialog
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={confirmAction.onConfirm}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel="Confirmar"
          variant={confirmAction.variant}
        />
      )}
    </div>
  );
}

export default MiPlanPage;
