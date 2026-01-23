import { useState } from 'react';
import {
  Plug,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { Button, DropdownMenu, Badge } from '@/components/ui';
import { ListadoCRUDPage } from '@/components/ui/templates';
import {
  useConectores,
  useEliminarConector,
  useVerificarConector,
} from '@/hooks/suscripciones-negocio';
import {
  ConectorFormDrawer,
  ConectorStatusBadge,
} from '@/components/suscripciones-negocio';

/**
 * Nombres de gateways
 */
const GATEWAY_NAMES = {
  mercadopago: 'MercadoPago',
  stripe: 'Stripe',
  paypal: 'PayPal',
  conekta: 'Conekta',
};

/**
 * Colores por gateway
 */
const GATEWAY_COLORS = {
  mercadopago: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  stripe: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  paypal: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  conekta: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

/**
 * Columnas para la tabla
 */
const columns = [
  {
    key: 'gateway',
    header: 'Gateway',
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${GATEWAY_COLORS[row.gateway] || 'bg-gray-100'}`}>
          <Plug className="w-4 h-4" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {row.nombre_display || GATEWAY_NAMES[row.gateway] || row.gateway}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {GATEWAY_NAMES[row.gateway]}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: 'entorno',
    header: 'Entorno',
    render: (row) => (
      <Badge variant={row.entorno === 'production' ? 'error' : 'info'} size="sm">
        {row.entorno === 'production' ? 'Produccion' : 'Sandbox'}
      </Badge>
    ),
  },
  {
    key: 'api_key_hint',
    header: 'API Key',
    render: (row) => (
      <code className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
        {row.api_key_hint || '•••••••••'}
      </code>
    ),
  },
  {
    key: 'verificado',
    header: 'Estado',
    render: (row) => <ConectorStatusBadge conector={row} size="sm" />,
  },
  {
    key: 'es_principal',
    header: 'Principal',
    render: (row) =>
      row.es_principal ? (
        <Badge variant="success" size="sm">
          <Shield className="w-3 h-3 mr-1" />
          Principal
        </Badge>
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
];

/**
 * Acciones por fila
 */
function RowActions({ row, onEdit, onDelete, onVerify, isVerifying }) {
  return (
    <DropdownMenu
      trigger={
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      }
      items={[
        {
          label: 'Verificar conexion',
          icon: RefreshCw,
          onClick: () => onVerify(row),
          disabled: isVerifying,
        },
        {
          label: 'Editar',
          icon: Pencil,
          onClick: () => onEdit(row),
        },
        {
          label: 'Eliminar',
          icon: Trash2,
          onClick: () => onDelete(row),
          variant: 'danger',
        },
      ]}
    />
  );
}

/**
 * Vista de cards para conectores
 */
function ConectoresCardsView({ items, isLoading, handlers }) {
  const verificarMutation = useVerificarConector();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 animate-pulse"
          >
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((conector) => (
        <div
          key={conector.id}
          className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${GATEWAY_COLORS[conector.gateway] || 'bg-gray-100'}`}>
              <Plug className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              {conector.es_principal && (
                <Badge variant="success" size="sm">
                  <Shield className="w-3 h-3 mr-1" />
                  Principal
                </Badge>
              )}
              <Badge variant={conector.entorno === 'production' ? 'error' : 'info'} size="sm">
                {conector.entorno === 'production' ? 'Prod' : 'Sandbox'}
              </Badge>
            </div>
          </div>

          {/* Info */}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {conector.nombre_display || GATEWAY_NAMES[conector.gateway]}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {GATEWAY_NAMES[conector.gateway]}
          </p>

          {/* API Key Hint */}
          <div className="mb-4">
            <code className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded">
              {conector.api_key_hint || '•••••••••'}
            </code>
          </div>

          {/* Estado */}
          <div className="mb-4">
            <ConectorStatusBadge conector={conector} showLastVerified />
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => verificarMutation.mutate(conector.id)}
              disabled={verificarMutation.isPending}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${verificarMutation.isPending ? 'animate-spin' : ''}`}
              />
              Verificar
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlers.onEdit(conector)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => handlers.onDelete(conector)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Pagina de gestion de conectores de pago
 */
function ConectoresPage() {
  const [verificandoId, setVerificandoId] = useState(null);
  const verificarMutation = useVerificarConector({
    onSettled: () => setVerificandoId(null),
  });

  const handleVerify = (conector) => {
    setVerificandoId(conector.id);
    verificarMutation.mutate(conector.id);
  };

  return (
    <ListadoCRUDPage
      title="Conectores de Pago"
      subtitle="Configura Stripe, MercadoPago y otros gateways"
      icon={Plug}
      useListQuery={useConectores}
      useDeleteMutation={useEliminarConector}
      columns={columns}
      FormDrawer={ConectorFormDrawer}
      mapFormData={(data) => ({
        conector: data,
        mode: data ? 'edit' : 'create',
      })}
      newButtonLabel="Agregar Conector"
      rowActions={(row, handlers) => (
        <RowActions
          row={row}
          {...handlers}
          onVerify={handleVerify}
          isVerifying={verificandoId === row.id}
        />
      )}
      viewModes={[
        { id: 'table', label: 'Tabla', icon: Plug },
        { id: 'cards', label: 'Cards', icon: Plug, component: ConectoresCardsView },
      ]}
      defaultViewMode="cards"
      emptyState={{
        icon: Plug,
        title: 'No hay conectores de pago',
        description:
          'Configura tu primer conector para empezar a procesar pagos con Stripe, MercadoPago u otros gateways.',
      }}
      deleteMutationOptions={{
        confirmTitle: 'Eliminar conector',
        confirmMessage:
          'Esta seguro de eliminar este conector? Esta accion no se puede deshacer y podria afectar los cobros en proceso.',
      }}
    />
  );
}

export default ConectoresPage;
