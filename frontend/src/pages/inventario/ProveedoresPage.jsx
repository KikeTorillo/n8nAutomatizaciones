import { Building2, Phone, Mail, Globe, MapPin, Edit, Trash2 } from 'lucide-react';
import {
  Badge,
  DataTableActions,
  DataTableActionButton,
  ListadoCRUDPage
} from '@/components/ui';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import { useProveedores, useEliminarProveedor } from '@/hooks/inventario';
import ProveedorFormDrawer from '@/components/inventario/ProveedorFormDrawer';

/**
 * Configuracion de columnas para la tabla de proveedores
 */
const COLUMNS = [
  {
    key: 'nombre',
    header: 'Proveedor',
    width: 'lg',
    render: (row) => (
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {row.nombre}
        </div>
        {row.razon_social && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.razon_social}
          </div>
        )}
        {row.rfc && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            RFC: {row.rfc}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'contacto',
    header: 'Contacto',
    hideOnMobile: true,
    render: (row) => (
      <div className="space-y-1">
        {row.telefono && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Phone className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
            {row.telefono}
          </div>
        )}
        {row.email && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Mail className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
            {row.email}
          </div>
        )}
        {row.sitio_web && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Globe className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
            <a
              href={row.sitio_web}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
              onClick={(e) => e.stopPropagation()}
            >
              Ver sitio
            </a>
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'ubicacion',
    header: 'Ubicacion',
    hideOnMobile: true,
    render: (row) => (
      row.ciudad || row.estado ? (
        <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500 mt-0.5" />
          <div>
            {row.ciudad}
            {row.ciudad && row.estado && ', '}
            {row.estado}
          </div>
        </div>
      ) : (
        <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
      )
    ),
  },
  {
    key: 'terminos',
    header: 'Terminos',
    hideOnMobile: true,
    render: (row) => (
      <div className="text-sm space-y-1">
        <div className="text-gray-600 dark:text-gray-400">
          <span className="font-medium">Credito:</span>{' '}
          {row.dias_credito > 0 ? `${row.dias_credito} dias` : 'Contado'}
        </div>
        {row.dias_entrega_estimados && (
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">Entrega:</span> {row.dias_entrega_estimados} dias
          </div>
        )}
        {row.monto_minimo_compra && (
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">Min:</span> $
            {row.monto_minimo_compra.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'activo',
    header: 'Estado',
    align: 'center',
    render: (row) => (
      <Badge variant={row.activo ? 'success' : 'default'} size="sm">
        {row.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
];

/**
 * Filtros iniciales
 */
const INITIAL_FILTERS = {
  busqueda: '',
  activo: true,
  ciudad: '',
};

/**
 * Acciones por fila de proveedor
 */
function ProveedorRowActions({ row, onEdit, onDelete }) {
  return (
    <DataTableActions>
      <DataTableActionButton
        icon={Edit}
        label="Editar"
        onClick={() => onEdit(row)}
        variant="primary"
      />
      <DataTableActionButton
        icon={Trash2}
        label="Eliminar"
        onClick={() => onDelete(row)}
        variant="danger"
      />
    </DataTableActions>
  );
}

/**
 * Mapper para transformar data del template a props del FormDrawer
 */
const mapFormData = (data) => ({
  proveedor: data,
  mode: data ? 'edit' : 'create',
});

/**
 * Pagina principal de Gestion de Proveedores
 * Migrado a ListadoCRUDPage - reduccion de ~60% del codigo
 */
function ProveedoresPage() {
  return (
    <ListadoCRUDPage
      // Layout
      title="Proveedores"
      icon={Building2}
      PageLayout={InventarioPageLayout}

      // Data
      useListQuery={useProveedores}
      dataKey="proveedores"

      // Mutations
      useDeleteMutation={useEliminarProveedor}
      deleteMutationOptions={{
        entityName: 'proveedor',
        getName: (p) => p.nombre,
      }}

      // Table
      columns={COLUMNS}
      rowActions={(row, handlers) => (
        <ProveedorRowActions row={row} {...handlers} />
      )}
      emptyState={{
        icon: Building2,
        title: 'No hay proveedores',
        description: 'Comienza agregando tu primer proveedor',
        actionLabel: 'Nuevo Proveedor',
      }}

      // Filters
      initialFilters={INITIAL_FILTERS}
      filterPersistId="inventario.proveedores"
      limit={20}

      // Modals
      FormDrawer={ProveedorFormDrawer}
      mapFormData={mapFormData}

      // Actions
      newButtonLabel="Nuevo Proveedor"
    />
  );
}

export default ProveedoresPage;
