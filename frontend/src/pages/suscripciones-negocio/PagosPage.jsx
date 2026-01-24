import { Receipt, Eye, MoreVertical, RefreshCw } from 'lucide-react';
import { Button, Badge, DropdownMenu, SearchInput } from '@/components/ui';
import { ListadoCRUDPage } from '@/components/ui/templates';
import { usePagos, ESTADO_PAGO_LABELS, ESTADO_PAGO_COLORS, METODO_PAGO_LABELS } from '@/hooks/suscripciones-negocio';
import { SuscripcionesNegocioPageLayout } from '@/components/suscripciones-negocio';
import { formatCurrency, formatDate } from '@/lib/utils';

/**
 * Columnas de la tabla
 */
const columns = [
  {
    key: 'fecha',
    header: 'Fecha',
    render: (row) => (
      <span className="text-gray-600 dark:text-gray-400">
        {formatDate(row.fecha_pago || row.creado_en)}
      </span>
    ),
  },
  {
    key: 'suscripcion',
    header: 'Suscripción',
    render: (row) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {row.cliente_nombre || `#${row.suscripcion_id}`}
        </p>
        {row.plan_nombre && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {row.plan_nombre}
          </p>
        )}
      </div>
    ),
  },
  {
    key: 'monto',
    header: 'Monto',
    render: (row) => (
      <div>
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(row.monto)}
        </span>
        {row.moneda && row.moneda !== 'MXN' && (
          <span className="text-sm text-gray-500 ml-1">{row.moneda}</span>
        )}
      </div>
    ),
  },
  {
    key: 'metodo_pago',
    header: 'Método',
    render: (row) => (
      <span className="text-gray-600 dark:text-gray-400">
        {METODO_PAGO_LABELS[row.metodo_pago] || row.metodo_pago || '-'}
      </span>
    ),
  },
  {
    key: 'estado',
    header: 'Estado',
    render: (row) => {
      const color = ESTADO_PAGO_COLORS[row.estado];
      const variantMap = {
        yellow: 'warning',
        green: 'success',
        red: 'error',
        purple: 'primary',
        orange: 'warning',
      };
      return (
        <Badge variant={variantMap[color] || 'default'} size="sm">
          {ESTADO_PAGO_LABELS[row.estado] || row.estado}
        </Badge>
      );
    },
  },
  {
    key: 'referencia',
    header: 'Referencia',
    render: (row) => (
      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
        {row.referencia_externa || row.gateway_transaction_id || '-'}
      </span>
    ),
  },
];

/**
 * Acciones por fila (solo lectura)
 */
function RowActions({ row, onEdit }) {
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
          onClick: () => onEdit(row),
        },
      ]}
    />
  );
}

/**
 * Página de historial de pagos (solo lectura)
 */
function PagosPage() {
  return (
    <ListadoCRUDPage
      title="Historial de Pagos"
      icon={Receipt}
      PageLayout={SuscripcionesNegocioPageLayout}
      useListQuery={usePagos}
      columns={columns}
      showNewButton={false}
      rowActions={(row, handlers) => <RowActions row={row} {...handlers} />}
      emptyState={{
        title: 'No hay pagos registrados',
        description: 'Los pagos de suscripciones aparecerán aquí',
      }}
      initialFilters={{ busqueda: '', estado: '' }}
      renderFilters={({ filtros, setFiltro, limpiarFiltros, resetPage }) => (
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={filtros.busqueda || ''}
            onChange={(e) => {
              setFiltro('busqueda', e.target.value);
              resetPage();
            }}
            placeholder="Buscar por cliente o referencia..."
            className="flex-1 max-w-md"
          />
          <select
            value={filtros.estado || ''}
            onChange={(e) => {
              setFiltro('estado', e.target.value);
              resetPage();
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="completado">Completado</option>
            <option value="fallido">Fallido</option>
            <option value="reembolsado">Reembolsado</option>
          </select>
          {(filtros.busqueda || filtros.estado) && (
            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          )}
        </div>
      )}
      exportConfig={{
        filename: 'pagos_suscripciones',
        columns: ['fecha', 'cliente', 'plan', 'monto', 'metodo', 'estado', 'referencia'],
        mapRow: (row) => ({
          fecha: formatDate(row.fecha_pago || row.creado_en),
          cliente: row.cliente_nombre || `Suscripción #${row.suscripcion_id}`,
          plan: row.plan_nombre || '-',
          monto: row.monto,
          metodo: METODO_PAGO_LABELS[row.metodo_pago] || row.metodo_pago || '-',
          estado: ESTADO_PAGO_LABELS[row.estado] || row.estado,
          referencia: row.referencia_externa || row.gateway_transaction_id || '-',
        }),
      }}
    />
  );
}

export default PagosPage;
