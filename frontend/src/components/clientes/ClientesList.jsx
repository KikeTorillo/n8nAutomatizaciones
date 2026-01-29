/**
 * ====================================================================
 * CLIENTES LIST - Lista con DataTable + SkeletonTable
 * ====================================================================
 *
 * Componente de lista de clientes homologado con DataTable generico.
 * Migrado de tabla HTML manual (Enero 2026).
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, Calendar, UserCircle, Edit, Building2 } from 'lucide-react';
import { DataTable, DataTableActionButton, DataTableActions } from '@/components/ui';
import EtiquetasBadges from './EtiquetasBadges';

/**
 * Componente de lista de clientes con DataTable y paginacion
 * @param {Object} props
 * @param {Array} props.clientes - Lista de clientes
 * @param {Object} props.pagination - Objeto de paginacion del backend
 * @param {boolean} props.isLoading - Estado de carga
 * @param {Function} props.onPageChange - Callback para cambio de pagina
 * @param {boolean} props.showPagination - Mostrar paginacion (default: true)
 */
function ClientesList({
  clientes,
  pagination,
  isLoading,
  onPageChange,
  showPagination = true,
}) {
  const navigate = useNavigate();

  // Definir columnas con useMemo
  const columns = useMemo(
    () => [
      {
        key: 'cliente',
        header: 'Cliente',
        width: 'xl',
        render: (row) => (
          <div className="flex items-center">
            {row.foto_url ? (
              <img
                src={row.foto_url}
                alt={row.nombre}
                className="flex-shrink-0 h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-semibold">
                  {row.nombre?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="ml-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {row.nombre}
                </span>
                {row.tipo === 'empresa' && (
                  <Building2 className="w-3.5 h-3.5 text-primary-500" />
                )}
              </div>
              {row.email && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {row.email}
                </div>
              )}
              {row.etiquetas && row.etiquetas.length > 0 && (
                <div className="mt-1">
                  <EtiquetasBadges etiquetas={row.etiquetas} size="xs" maxVisible={2} />
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'contacto',
        header: 'Contacto',
        hideOnMobile: true,
        render: (row) => (
          <div className="flex flex-col gap-1">
            {row.telefono && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                {row.telefono}
              </div>
            )}
            {row.email && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                {row.email}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'citas',
        header: 'Citas',
        hideOnMobile: true,
        render: (row) => (
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {row.total_citas || 0} citas
          </div>
        ),
      },
      {
        key: 'ultima_cita',
        header: 'Ultima Cita',
        hideOnMobile: true,
        render: (row) => {
          if (!row.ultima_cita) {
            return <span className="text-sm text-gray-400 dark:text-gray-500">Sin citas</span>;
          }
          // Extraer solo la parte de fecha (YYYY-MM-DD) ignorando la hora/timezone
          const fechaSolo = String(row.ultima_cita).split('T')[0];
          const [year, month, day] = fechaSolo.split('-');
          const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
              {fecha.toLocaleDateString('es-ES')}
            </div>
          );
        },
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (row) => (
          <span
            className={`
              px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
              ${
                row.activo
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }
            `}
          >
            {row.activo ? 'Activo' : 'Inactivo'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (row) => (
          <DataTableActions>
            <DataTableActionButton
              icon={Edit}
              label={`Editar cliente ${row.nombre}`}
              variant="primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/clientes/${row.id}`);
              }}
            />
          </DataTableActions>
        ),
      },
    ],
    [navigate]
  );

  return (
    <DataTable
      columns={columns}
      data={clientes || []}
      keyField="id"
      isLoading={isLoading}
      onRowClick={(row) => navigate(`/clientes/${row.id}`)}
      pagination={showPagination ? pagination : null}
      onPageChange={onPageChange}
      skeletonRows={10}
      emptyState={{
        icon: UserCircle,
        title: 'No hay clientes registrados',
        description: 'Comienza agregando tu primer cliente o atiende un cliente walk-in',
        actionLabel: 'Agregar Cliente',
        onAction: () => navigate('/clientes/nuevo'),
      }}
    />
  );
}

export default ClientesList;
