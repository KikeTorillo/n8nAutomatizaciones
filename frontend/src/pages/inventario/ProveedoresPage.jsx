import { useState } from 'react';
import { Building2, Plus, Edit, Trash2, Phone, Mail, Globe, MapPin, Search, X } from 'lucide-react';
import { useModalManager } from '@/hooks/useModalManager';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { useToast } from '@/hooks/useToast';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useProveedores,
  useEliminarProveedor,
} from '@/hooks/useProveedores';
import ProveedorFormModal from '@/components/inventario/ProveedorFormModal';

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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={filtros.busqueda}
                  onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Buscar por nombre, RFC, email..."
                />
              </div>
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                value={filtros.ciudad}
                onChange={(e) => handleFiltroChange('ciudad', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Filtrar por ciudad"
              />
            </div>

            {/* Botones */}
            <div className="flex items-end space-x-2">
              <Button
                variant="secondary"
                onClick={handleLimpiarFiltros}
                icon={X}
                className="flex-1"
              >
                Limpiar
              </Button>
            </div>
          </div>

          {/* Toggle Activo */}
          <div className="mt-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filtros.activo}
                onChange={(e) => handleFiltroChange('activo', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 bg-white dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Solo proveedores activos</span>
            </label>
          </div>
        </div>

        {/* Tabla de Proveedores */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {cargandoProveedores ? (
            <SkeletonTable rows={5} columns={6} />
          ) : proveedores.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No hay proveedores"
              description="Comienza agregando tu primer proveedor"
              actionLabel="Nuevo Proveedor"
              onAction={handleNuevoProveedor}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Términos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {proveedores.map((proveedor) => (
                    <tr key={proveedor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {/* Proveedor */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {proveedor.nombre}
                          </div>
                          {proveedor.razon_social && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {proveedor.razon_social}
                            </div>
                          )}
                          {proveedor.rfc && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              RFC: {proveedor.rfc}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {proveedor.telefono && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                              {proveedor.telefono}
                            </div>
                          )}
                          {proveedor.email && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                              {proveedor.email}
                            </div>
                          )}
                          {proveedor.sitio_web && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Globe className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                              <a
                                href={proveedor.sitio_web}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                              >
                                Ver sitio
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Ubicación */}
                      <td className="px-6 py-4">
                        {proveedor.ciudad || proveedor.estado ? (
                          <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500 mt-0.5" />
                            <div>
                              {proveedor.ciudad}
                              {proveedor.ciudad && proveedor.estado && ', '}
                              {proveedor.estado}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>

                      {/* Términos */}
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Crédito:</span>{' '}
                            {proveedor.dias_credito > 0
                              ? `${proveedor.dias_credito} días`
                              : 'Contado'}
                          </div>
                          {proveedor.dias_entrega_estimados && (
                            <div className="text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Entrega:</span>{' '}
                              {proveedor.dias_entrega_estimados} días
                            </div>
                          )}
                          {proveedor.monto_minimo_compra && (
                            <div className="text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Mín:</span> $
                              {proveedor.monto_minimo_compra.toLocaleString('es-MX', {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <Badge variant={proveedor.activo ? 'success' : 'default'} size="sm">
                          {proveedor.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditarProveedor(proveedor)}
                            icon={Edit}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleAbrirModalEliminar(proveedor)}
                            icon={Trash2}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Modal de Formulario */}
      <ProveedorFormModal
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        proveedor={getModalData('form')?.proveedor}
        mode={getModalData('form')?.mode || 'create'}
      />

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        isOpen={isOpen('eliminar')}
        onClose={() => closeModal('eliminar')}
        title="Eliminar Proveedor"
        size="md"
      >
        {(() => {
          const proveedorEliminar = getModalData('eliminar');
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Estás seguro de que deseas eliminar el proveedor{' '}
                <strong className="text-gray-900 dark:text-gray-100">
                  {proveedorEliminar?.nombre}
                </strong>
                ?
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Esta acción no se puede deshacer.
              </p>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => closeModal('eliminar')}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleEliminar}
                  isLoading={eliminarMutation.isPending}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </InventarioPageLayout>
  );
}

export default ProveedoresPage;
