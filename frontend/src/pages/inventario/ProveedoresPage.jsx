import { useState, useMemo } from 'react';
import { Building2, Plus, Edit, Trash2, Phone, Mail, Globe, MapPin } from 'lucide-react';
import { useModalManager } from '@/hooks/utils';
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  DataTableActionButton,
  DataTableActions,
  FilterPanel
} from '@/components/ui';
import { useToast } from '@/hooks/utils';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useProveedores,
  useEliminarProveedor,
} from '@/hooks/inventario';
import ProveedorFormDrawer from '@/components/inventario/ProveedorFormDrawer';

/**
 * Página principal de Gestión de Proveedores
 */
function ProveedoresPage() {
  const { success: showSuccess, error: showError } = useToast();

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    activo: true,
    ciudad: '',
  });

  // Estado de modales unificado
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    eliminar: { isOpen: false, data: null },
  });

  // Queries
  const { data: proveedoresData, isLoading: cargandoProveedores } = useProveedores(filtros);
  const proveedores = proveedoresData?.proveedores || [];
  const total = proveedoresData?.total || 0;

  // Mutations
  const eliminarMutation = useEliminarProveedor();

  // Handlers de filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      activo: true,
      ciudad: '',
    });
  };

  // Handlers de acciones
  const handleNuevoProveedor = () => {
    openModal('form', { mode: 'create', proveedor: null });
  };

  const handleEditarProveedor = (proveedor) => {
    openModal('form', { mode: 'edit', proveedor });
  };

  const handleAbrirModalEliminar = (proveedor) => {
    openModal('eliminar', proveedor);
  };

  const handleEliminar = () => {
    const proveedorSeleccionado = getModalData('eliminar');
    eliminarMutation.mutate(proveedorSeleccionado.id, {
      onSuccess: () => {
        showSuccess('Proveedor eliminado correctamente');
        closeModal('eliminar');
      },
      onError: (err) => {
        showError(err.response?.data?.mensaje || 'Error al eliminar proveedor');
      },
    });
  };

  return (
    <InventarioPageLayout
      icon={Building2}
      title="Proveedores"
      subtitle={`${total} proveedor${total !== 1 ? 'es' : ''} en total`}
      actions={
        <Button
          variant="primary"
          onClick={handleNuevoProveedor}
          icon={Plus}
          className="w-full sm:w-auto"
        >
          Nuevo Proveedor
        </Button>
      }
    >

        {/* Filtros */}
        <FilterPanel
          filters={filtros}
          onFilterChange={handleFiltroChange}
          onClearFilters={handleLimpiarFiltros}
          searchKey="busqueda"
          searchPlaceholder="Buscar por nombre, RFC, email..."
          filterConfig={[
            {
              key: 'ciudad',
              label: 'Ciudad',
              type: 'text',
              placeholder: 'Filtrar por ciudad',
            },
            {
              key: 'activo',
              label: 'Solo activos',
              type: 'checkbox',
              checkboxLabel: 'Solo proveedores activos',
            },
          ]}
          defaultExpanded={false}
          className="mb-6"
        />

        {/* Tabla de Proveedores */}
        <DataTable
          columns={[
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
              header: 'Ubicación',
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
              header: 'Términos',
              hideOnMobile: true,
              render: (row) => (
                <div className="text-sm space-y-1">
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Crédito:</span>{' '}
                    {row.dias_credito > 0 ? `${row.dias_credito} días` : 'Contado'}
                  </div>
                  {row.dias_entrega_estimados && (
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Entrega:</span> {row.dias_entrega_estimados} días
                    </div>
                  )}
                  {row.monto_minimo_compra && (
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Mín:</span> $
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
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <DataTableActions>
                  <DataTableActionButton
                    icon={Edit}
                    label="Editar"
                    onClick={() => handleEditarProveedor(row)}
                    variant="primary"
                  />
                  <DataTableActionButton
                    icon={Trash2}
                    label="Eliminar"
                    onClick={() => handleAbrirModalEliminar(row)}
                    variant="danger"
                  />
                </DataTableActions>
              ),
            },
          ]}
          data={proveedores}
          isLoading={cargandoProveedores}
          emptyState={{
            icon: Building2,
            title: 'No hay proveedores',
            description: 'Comienza agregando tu primer proveedor',
            actionLabel: 'Nuevo Proveedor',
            onAction: handleNuevoProveedor,
          }}
          skeletonRows={5}
        />

      {/* Modal de Formulario */}
      <ProveedorFormDrawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        proveedor={getModalData('form')?.proveedor}
        mode={getModalData('form')?.mode || 'create'}
      />

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDialog
        isOpen={isOpen('eliminar')}
        onClose={() => closeModal('eliminar')}
        onConfirm={handleEliminar}
        title="Eliminar Proveedor"
        message={`¿Estás seguro de que deseas eliminar el proveedor "${getModalData('eliminar')?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </InventarioPageLayout>
  );
}

export default ProveedoresPage;
