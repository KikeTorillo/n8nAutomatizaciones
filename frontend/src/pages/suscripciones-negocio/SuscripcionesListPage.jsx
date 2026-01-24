import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, Eye, MoreVertical, Pause, Play, X } from 'lucide-react';
import { Button, DropdownMenu, SearchInput } from '@/components/ui';
import { StateNavTabs } from '@/components/ui/organisms';
import { DataTable } from '@/components/ui/organisms/DataTable';
import { useSuscripciones, ESTADOS_SUSCRIPCION, ESTADO_LABELS } from '@/hooks/suscripciones-negocio';
import {
  SuscripcionFormDrawer,
  SuscripcionStatusBadge,
  SuscripcionesNegocioPageLayout,
} from '@/components/suscripciones-negocio';
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
  const navigate = useNavigate();
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

  // Actualizar conteos en tabs
  const tabsConConteo = STATE_TABS.map((tab) => ({
    ...tab,
    count: tab.id === 'todas' ? total : undefined,
  }));

  return (
    <SuscripcionesNegocioPageLayout
      icon={Users}
      title="Lista de Suscripciones"
      subtitle={`${total} suscripciones`}
      actions={
        <Button onClick={() => openModal('form', null)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Suscripción
        </Button>
      }
    >
      {/* State Tabs para filtrar por estado */}
      <StateNavTabs
        tabs={tabsConConteo}
        activeTab={estadoFiltro}
        onTabChange={setEstadoFiltro}
        className="mb-4"
      />

      {/* Búsqueda */}
      <SearchInput
        value={filtros.busqueda || ''}
        onChange={(e) => setFiltro('busqueda', e.target.value)}
        placeholder="Buscar por cliente..."
        className="max-w-md mb-6"
      />

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
        onRowClick={(row) => navigate(`/suscripciones-negocio/suscripciones/${row.id}`)}
        pagination={{
          page,
          limit: queryParams.limit,
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
    </SuscripcionesNegocioPageLayout>
  );
}

export default SuscripcionesListPage;
