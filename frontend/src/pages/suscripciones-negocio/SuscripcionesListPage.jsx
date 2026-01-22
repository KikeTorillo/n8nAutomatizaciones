import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Eye, MoreVertical, Pause, Play, X } from 'lucide-react';
import { Button, Badge, DropdownMenu, EmptyState } from '@/components/ui';
import { StateNavTabs } from '@/components/ui/organisms';
import { DataTable } from '@/components/ui/organisms/DataTable';
import { useSuscripciones, ESTADOS_SUSCRIPCION, ESTADO_LABELS, ESTADO_COLORS } from '@/hooks/suscripciones-negocio';
import { SuscripcionFormDrawer, SuscripcionStatusBadge } from '@/components/suscripciones-negocio';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usePagination, useFilters, normalizePagination, useModalManager } from '@/hooks/utils';

/**
 * Tabs por estado
 */
const STATE_TABS = [
  { id: 'todas', label: 'Todas', count: 0 },
  { id: ESTADOS_SUSCRIPCION.ACTIVA, label: 'Activas', count: 0, color: 'green' },
  { id: ESTADOS_SUSCRIPCION.TRIAL, label: 'En Prueba', count: 0, color: 'blue' },
  { id: ESTADOS_SUSCRIPCION.PAUSADA, label: 'Pausadas', count: 0, color: 'yellow' },
  { id: ESTADOS_SUSCRIPCION.PENDIENTE_PAGO, label: 'Pendientes', count: 0, color: 'orange' },
  { id: ESTADOS_SUSCRIPCION.CANCELADA, label: 'Canceladas', count: 0, color: 'red' },
];

/**
 * Columnas de la tabla
 */
const columns = [
  {
    key: 'cliente',
    header: 'Cliente',
    render: (row) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {row.cliente_nombre || `Cliente #${row.cliente_id}`}
        </p>
        {row.cliente_email && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {row.cliente_email}
          </p>
        )}
      </div>
    ),
  },
  {
    key: 'plan',
    header: 'Plan',
    render: (row) => (
      <div>
        <p className="font-medium">{row.plan_nombre}</p>
        <p className="text-sm text-gray-500">{formatCurrency(row.precio)}/mes</p>
      </div>
    ),
  },
  {
    key: 'estado',
    header: 'Estado',
    render: (row) => <SuscripcionStatusBadge estado={row.estado} />,
  },
  {
    key: 'fecha_inicio',
    header: 'Inicio',
    render: (row) => (
      <span className="text-gray-600 dark:text-gray-400">
        {formatDate(row.fecha_inicio)}
      </span>
    ),
  },
  {
    key: 'proximo_cobro',
    header: 'Próximo Cobro',
    render: (row) => (
      <span className="text-gray-600 dark:text-gray-400">
        {row.proxima_fecha_cobro ? formatDate(row.proxima_fecha_cobro) : '-'}
      </span>
    ),
  },
];

/**
 * Acciones por fila
 */
function RowActions({ row }) {
  return (
    <DropdownMenu
      trigger={
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      }
      items={[
        {
          label: 'Ver Detalles',
          icon: Eye,
          as: Link,
          to: `/suscripciones-negocio/suscripciones/${row.id}`,
        },
        row.estado === ESTADOS_SUSCRIPCION.ACTIVA && {
          label: 'Pausar',
          icon: Pause,
          onClick: () => {}, // TODO: Implementar
        },
        row.estado === ESTADOS_SUSCRIPCION.PAUSADA && {
          label: 'Reactivar',
          icon: Play,
          onClick: () => {}, // TODO: Implementar
        },
        row.estado !== ESTADOS_SUSCRIPCION.CANCELADA && {
          label: 'Cancelar',
          icon: X,
          onClick: () => {}, // TODO: Implementar
          variant: 'danger',
        },
      ].filter(Boolean)}
    />
  );
}

/**
 * Página de listado de suscripciones con filtros por estado
 */
function SuscripcionesListPage() {
  const [estadoFiltro, setEstadoFiltro] = useState('todas');

  // Paginación y filtros
  const { page, handlePageChange, queryParams } = usePagination({ limit: 20 });
  const { filtros, setFiltro, filtrosQuery } = useFilters({ busqueda: '' });

  // Modal
  const { openModal, closeModal, isOpen } = useModalManager({
    form: { isOpen: false, data: null },
  });

  // Query
  const { data, isLoading } = useSuscripciones({
    ...queryParams,
    ...filtrosQuery,
    estado: estadoFiltro !== 'todas' ? estadoFiltro : undefined,
  });

  const items = data?.items || [];
  const paginacion = normalizePagination(data?.paginacion);
  const total = data?.total || items.length;
  const totalPages = Math.ceil(total / queryParams.limit) || 1;

  // Actualizar conteos en tabs (simplificado - normalmente vendría del backend)
  const tabsConConteo = STATE_TABS.map((tab) => ({
    ...tab,
    count: tab.id === 'todas' ? total : undefined,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-primary-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Suscripciones
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {total} suscripciones
            </p>
          </div>
        </div>
        <Button onClick={() => openModal('form', null)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Suscripción
        </Button>
      </div>

      {/* State Tabs */}
      <StateNavTabs
        tabs={tabsConConteo}
        activeTab={estadoFiltro}
        onTabChange={setEstadoFiltro}
      />

      {/* Búsqueda */}
      <div className="flex gap-3">
        <input
          type="text"
          value={filtros.busqueda || ''}
          onChange={(e) => setFiltro('busqueda', e.target.value)}
          placeholder="Buscar por cliente..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Tabla */}
      <DataTable
        columns={[
          ...columns,
          {
            key: '_actions',
            header: '',
            align: 'right',
            render: (row) => <RowActions row={row} />,
          },
        ]}
        data={items}
        isLoading={isLoading}
        keyField="id"
        onRowClick={(row) => {
          window.location.href = `/suscripciones-negocio/suscripciones/${row.id}`;
        }}
        pagination={{
          page,
          totalPages,
          total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }}
        onPageChange={handlePageChange}
        emptyState={{
          icon: Users,
          title: 'No hay suscripciones',
          description:
            estadoFiltro !== 'todas'
              ? `No hay suscripciones con estado "${ESTADO_LABELS[estadoFiltro]}"`
              : 'Crea tu primera suscripción',
          actionLabel: estadoFiltro === 'todas' ? 'Nueva Suscripción' : undefined,
          onAction: estadoFiltro === 'todas' ? () => openModal('form', null) : undefined,
        }}
      />

      {/* Form Drawer */}
      {isOpen('form') && (
        <SuscripcionFormDrawer
          isOpen={isOpen('form')}
          onClose={() => closeModal('form')}
          mode="create"
        />
      )}
    </div>
  );
}

export default SuscripcionesListPage;
