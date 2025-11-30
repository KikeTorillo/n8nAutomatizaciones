import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Edit, Trash2, Phone, Mail, Globe, MapPin, Search, X, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import InventarioNavTabs from '@/components/inventario/InventarioNavTabs';
import {
  useProveedores,
  useEliminarProveedor,
} from '@/hooks/useProveedores';
import ProveedorFormModal from '@/components/inventario/ProveedorFormModal';

/**
 * Página principal de Gestión de Proveedores
 */
function ProveedoresPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    activo: true,
    ciudad: '',
  });

  // Estado de modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);

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
    setProveedorSeleccionado(null);
    setModalMode('create');
    setIsFormModalOpen(true);
  };

  const handleEditarProveedor = (proveedor) => {
    setProveedorSeleccionado(proveedor);
    setModalMode('edit');
    setIsFormModalOpen(true);
  };

  const handleAbrirModalEliminar = (proveedor) => {
    setProveedorSeleccionado(proveedor);
    setModalEliminarAbierto(true);
  };

  const handleEliminar = () => {
    eliminarMutation.mutate(proveedorSeleccionado.id, {
      onSuccess: () => {
        showSuccess('Proveedor eliminado correctamente');
        setModalEliminarAbierto(false);
        setProveedorSeleccionado(null);
      },
      onError: (err) => {
        showError(err.response?.data?.mensaje || 'Error al eliminar proveedor');
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Volver al Inicio</span>
        </button>

        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona productos, proveedores y stock
        </p>
      </div>

      {/* Tabs de navegación */}
      <InventarioNavTabs />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header de sección */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Proveedores</h2>
                <p className="text-sm text-gray-600">
                  {total} proveedor{total !== 1 ? 'es' : ''} en total
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={handleNuevoProveedor}
              icon={Plus}
            >
              Nuevo Proveedor
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filtros.busqueda}
                  onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Buscar por nombre, RFC, email..."
                />
              </div>
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                value={filtros.ciudad}
                onChange={(e) => handleFiltroChange('ciudad', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Solo proveedores activos</span>
            </label>
          </div>
        </div>

        {/* Tabla de Proveedores */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {cargandoProveedores ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Cargando proveedores...</span>
            </div>
          ) : proveedores.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay proveedores
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza agregando tu primer proveedor
              </p>
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={handleNuevoProveedor}
                  icon={Plus}
                >
                  Nuevo Proveedor
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Términos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {proveedores.map((proveedor) => (
                    <tr key={proveedor.id} className="hover:bg-gray-50">
                      {/* Proveedor */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {proveedor.nombre}
                          </div>
                          {proveedor.razon_social && (
                            <div className="text-sm text-gray-500">
                              {proveedor.razon_social}
                            </div>
                          )}
                          {proveedor.rfc && (
                            <div className="text-xs text-gray-400 mt-1">
                              RFC: {proveedor.rfc}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {proveedor.telefono && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              {proveedor.telefono}
                            </div>
                          )}
                          {proveedor.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {proveedor.email}
                            </div>
                          )}
                          {proveedor.sitio_web && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Globe className="h-4 w-4 mr-2 text-gray-400" />
                              <a
                                href={proveedor.sitio_web}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800"
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
                          <div className="flex items-start text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                            <div>
                              {proveedor.ciudad}
                              {proveedor.ciudad && proveedor.estado && ', '}
                              {proveedor.estado}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>

                      {/* Términos */}
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="text-gray-600">
                            <span className="font-medium">Crédito:</span>{' '}
                            {proveedor.dias_credito > 0
                              ? `${proveedor.dias_credito} días`
                              : 'Contado'}
                          </div>
                          {proveedor.dias_entrega_estimados && (
                            <div className="text-gray-600">
                              <span className="font-medium">Entrega:</span>{' '}
                              {proveedor.dias_entrega_estimados} días
                            </div>
                          )}
                          {proveedor.monto_minimo_compra && (
                            <div className="text-gray-600">
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
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            proveedor.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {proveedor.activo ? 'Activo' : 'Inactivo'}
                        </span>
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
      </div>

      {/* Modal de Formulario */}
      <ProveedorFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        proveedor={proveedorSeleccionado}
        mode={modalMode}
      />

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        isOpen={modalEliminarAbierto}
        onClose={() => setModalEliminarAbierto(false)}
        title="Eliminar Proveedor"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar el proveedor{' '}
            <strong className="text-gray-900">
              {proveedorSeleccionado?.nombre}
            </strong>
            ?
          </p>

          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer.
          </p>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setModalEliminarAbierto(false)}
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
      </Modal>
    </div>
  );
}

export default ProveedoresPage;
