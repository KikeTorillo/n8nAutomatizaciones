import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Pause,
  Play,
  X,
  RefreshCw,
  Package,
  MoreVertical,
} from 'lucide-react';
import { Button, Badge, DropdownMenu, ConfirmDialog } from '@/components/ui';
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
} from '@/components/suscripciones-negocio';
import { useToast } from '@/hooks/utils';
import { cn } from '@/lib/utils';

/**
 * Tabs de la página
 */
const TABS = [
  { id: 'general', label: 'General' },
  { id: 'pagos', label: 'Pagos' },
  { id: 'historial', label: 'Historial' },
];

/**
 * Página de detalle de suscripción
 */
function SuscripcionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  // State
  const [activeTab, setActiveTab] = useState('general');
  const [confirmAction, setConfirmAction] = useState(null);

  // Queries
  const { data: suscripcion, isLoading, refetch } = useSuscripcion(id);

  // Mutations
  const cancelarMutation = useCancelarSuscripcion();
  const pausarMutation = usePausarSuscripcion();
  const reactivarMutation = useReactivarSuscripcion();

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

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!suscripcion) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Suscripción no encontrada</p>
        <Button
          as={Link}
          to="/suscripciones-negocio/suscripciones"
          variant="outline"
          className="mt-4"
        >
          Volver al listado
        </Button>
      </div>
    );
  }

  const isPausable = suscripcion.estado === ESTADOS_SUSCRIPCION.ACTIVA;
  const isReactivable = suscripcion.estado === ESTADOS_SUSCRIPCION.PAUSADA;
  const isCancelable =
    suscripcion.estado !== ESTADOS_SUSCRIPCION.CANCELADA &&
    suscripcion.estado !== ESTADOS_SUSCRIPCION.VENCIDA;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/suscripciones-negocio/suscripciones')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Suscripción #{suscripcion.id}
              </h1>
              <SuscripcionStatusBadge estado={suscripcion.estado} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {suscripcion.cliente_nombre || `Cliente #${suscripcion.cliente_id}`}
              {' • '}
              {suscripcion.plan_nombre}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isPausable && (
            <Button
              variant="outline"
              onClick={handlePausar}
              disabled={pausarMutation.isPending}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </Button>
          )}
          {isReactivable && (
            <Button
              variant="primary"
              onClick={handleReactivar}
              disabled={reactivarMutation.isPending}
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
                  onClick: () => {}, // TODO: Implementar
                },
                {
                  label: 'Cancelar Suscripción',
                  icon: X,
                  onClick: handleCancelar,
                  variant: 'danger',
                },
              ]}
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'py-3 px-1 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && (
          <SuscripcionGeneralTab suscripcion={suscripcion} />
        )}
        {activeTab === 'pagos' && (
          <SuscripcionPagosTab suscripcionId={parseInt(id)} />
        )}
        {activeTab === 'historial' && (
          <SuscripcionHistorialTab suscripcionId={parseInt(id)} />
        )}
      </div>

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
