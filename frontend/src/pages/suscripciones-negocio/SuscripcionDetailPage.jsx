/**
 * ====================================================================
 * SUSCRIPCION DETAIL PAGE - VISTA DE DETALLE CON TABS
 * ====================================================================
 *
 * Página de detalle de suscripción con navegación por tabs:
 * - General: Información de la suscripción
 * - Pagos: Historial de pagos
 * - Historial: Cambios de estado y eventos
 *
 * ====================================================================
 */

import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Pause,
  Play,
  X,
  Package,
  MoreVertical,
  User,
  Receipt,
  Clock,
  Edit,
  Mail,
  Calendar,
  DollarSign,
} from 'lucide-react';
import {
  Button,
  Badge,
  DropdownMenu,
  ConfirmDialog,
  BackButton,
  LoadingSpinner,
  StateNavTabs,
} from '@/components/ui';
import {
  useSuscripcion,
  useCancelarSuscripcion,
  usePausarSuscripcion,
  useReactivarSuscripcion,
  ESTADOS_SUSCRIPCION,
} from '@/hooks/suscripciones-negocio';
import {
  SuscripcionStatusBadge,
  SuscripcionGeneralTab,
  SuscripcionPagosTab,
  SuscripcionHistorialTab,
  CambiarPlanDrawer,
} from '@/components/suscripciones-negocio';
import { useToast } from '@/hooks/utils';
import { formatCurrency, formatDate } from '@/lib/utils';

/**
 * Tabs de la página
 */
const TABS = [
  { id: 'general', label: 'General', icon: User },
  { id: 'pagos', label: 'Pagos', icon: Receipt },
  { id: 'historial', label: 'Historial', icon: Clock },
];

/**
 * Header de la suscripción con información resumida
 */
function SuscripcionHeader({ suscripcion, onPausar, onReactivar, onCancelar, onCambiarPlan, isPending }) {
  const isPausable = suscripcion.estado === ESTADOS_SUSCRIPCION.ACTIVA;
  const isReactivable = suscripcion.estado === ESTADOS_SUSCRIPCION.PAUSADA;
  const isCancelable =
    suscripcion.estado !== ESTADOS_SUSCRIPCION.CANCELADA &&
    suscripcion.estado !== ESTADOS_SUSCRIPCION.VENCIDA;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* BackButton en línea separada */}
        <div className="flex items-center gap-4 mb-4">
          <BackButton to="/suscripciones-negocio/suscripciones" label="Volver a Suscripciones" />
        </div>

        {/* Header principal */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar/Icono */}
            <div className="flex-shrink-0 h-16 w-16 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>

            <div>
              {/* Título y badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Suscripción #{suscripcion.id}
                </h1>
                <SuscripcionStatusBadge estado={suscripcion.estado} />
              </div>

              {/* Info del cliente y plan */}
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {suscripcion.cliente_nombre || `Cliente #${suscripcion.cliente_id}`}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {suscripcion.plan_nombre}
                </span>
              </div>

              {/* Detalles adicionales */}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                {suscripcion.cliente_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {suscripcion.cliente_email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(suscripcion.precio)}/mes
                </span>
                {suscripcion.proxima_fecha_cobro && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Próximo cobro: {formatDate(suscripcion.proxima_fecha_cobro)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            {isPausable && (
              <Button
                variant="outline"
                onClick={onPausar}
                disabled={isPending}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            )}
            {isReactivable && (
              <Button
                variant="primary"
                onClick={onReactivar}
                disabled={isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Reactivar
              </Button>
            )}
            {isCancelable && (
              <DropdownMenu
                trigger={
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                }
                items={[
                  {
                    label: 'Cambiar Plan',
                    icon: Package,
                    onClick: onCambiarPlan,
                  },
                  {
                    label: 'Cancelar Suscripción',
                    icon: X,
                    onClick: onCancelar,
                    variant: 'danger',
                  },
                ]}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Página de detalle de suscripción
 */
function SuscripcionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error: showError } = useToast();

  // Tab activo desde URL o default 'general'
  const activeTab = searchParams.get('tab') || 'general';
  const handleTabChange = (tabId) => setSearchParams({ tab: tabId });

  // State
  const [confirmAction, setConfirmAction] = useState(null);
  const [showCambiarPlan, setShowCambiarPlan] = useState(false);

  // Queries
  const { data: suscripcion, isLoading, refetch } = useSuscripcion(id);

  // Mutations
  const cancelarMutation = useCancelarSuscripcion();
  const pausarMutation = usePausarSuscripcion();
  const reactivarMutation = useReactivarSuscripcion();

  const isPending = cancelarMutation.isPending || pausarMutation.isPending || reactivarMutation.isPending;

  // Handlers
  const handleCancelar = () => {
    setConfirmAction({
      title: 'Cancelar Suscripción',
      message: '¿Estás seguro de cancelar esta suscripción? Esta acción no se puede deshacer.',
      variant: 'danger',
      onConfirm: () => {
        cancelarMutation.mutate(
          { id: parseInt(id), motivo_cancelacion: 'Cancelada por administrador' },
          {
            onSuccess: () => {
              success('Suscripción cancelada');
              refetch();
            },
            onError: (err) => showError(err.message),
          }
        );
        setConfirmAction(null);
      },
    });
  };

  const handlePausar = () => {
    setConfirmAction({
      title: 'Pausar Suscripción',
      message: '¿Estás seguro de pausar esta suscripción? El cliente no será cobrado mientras esté pausada.',
      variant: 'warning',
      onConfirm: () => {
        pausarMutation.mutate(
          { id: parseInt(id), motivo: 'Pausada por administrador' },
          {
            onSuccess: () => {
              success('Suscripción pausada');
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
    reactivarMutation.mutate(parseInt(id), {
      onSuccess: () => {
        success('Suscripción reactivada');
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

  // Not found state
  if (!suscripcion) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Suscripción no encontrada</p>
          <Button onClick={() => navigate('/suscripciones-negocio/suscripciones')} className="mt-4">
            Volver a Suscripciones
          </Button>
        </div>
      </div>
    );
  }

  // Renderizar tab activo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'pagos':
        return <SuscripcionPagosTab suscripcionId={parseInt(id)} />;
      case 'historial':
        return <SuscripcionHistorialTab suscripcionId={parseInt(id)} />;
      case 'general':
      default:
        return <SuscripcionGeneralTab suscripcion={suscripcion} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con info resumida */}
      <SuscripcionHeader
        suscripcion={suscripcion}
        onPausar={handlePausar}
        onReactivar={handleReactivar}
        onCancelar={handleCancelar}
        onCambiarPlan={() => setShowCambiarPlan(true)}
        isPending={isPending}
      />

      {/* Navegación de tabs */}
      <StateNavTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Contenido del tab activo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </div>

      {/* Cambiar Plan Drawer */}
      <CambiarPlanDrawer
        isOpen={showCambiarPlan}
        onClose={() => setShowCambiarPlan(false)}
        suscripcion={suscripcion}
        onSuccess={handleCambiarPlanSuccess}
      />

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

export default SuscripcionDetailPage;
