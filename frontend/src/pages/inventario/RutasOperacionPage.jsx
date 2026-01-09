import { useState } from 'react';
import { Route, Plus, Edit, Trash2, Search, X, Zap, Truck, ShoppingCart, Factory, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Drawer from '@/components/ui/Drawer';
import { useToast } from '@/hooks/useToast';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useRutasOperacion,
  useInicializarRutas,
  useCrearRuta,
  useActualizarRuta,
  useEliminarRuta,
} from '@/hooks/useInventario';

// Tipos de ruta con sus iconos y colores
const TIPOS_RUTA = {
  compra: { label: 'Compra', icon: ShoppingCart, color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' },
  transferencia: { label: 'Transferencia', icon: Truck, color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300' },
  dropship: { label: 'Dropship', icon: Route, color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300' },
  fabricacion: { label: 'Fabricación', icon: Factory, color: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' },
};

// Formulario inicial vacío
const FORM_INICIAL = {
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo: 'compra',
  prioridad: 10,
  lead_time_dias: 0,
  activo: true,
  es_default: false,
};

/**
 * Página principal de Gestión de Rutas de Operación
 * Permite configurar rutas de reabastecimiento: compra, transferencia, dropship, fabricación
 */
function RutasOperacionPage() {
  const { success: showSuccess, error: showError } = useToast();

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo: '',
    activo: true,
  });

  // Estado de modales/drawers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [formData, setFormData] = useState(FORM_INICIAL);

  // Queries
  const { data: rutasData, isLoading: cargandoRutas } = useRutasOperacion({
    tipo: filtros.tipo || undefined,
    activo: filtros.activo,
  });
  const rutas = rutasData || [];

  // Filtro local por búsqueda
  const rutasFiltradas = rutas.filter(ruta => {
    if (!filtros.busqueda) return true;
    const busqueda = filtros.busqueda.toLowerCase();
    return (
      ruta.codigo?.toLowerCase().includes(busqueda) ||
      ruta.nombre?.toLowerCase().includes(busqueda) ||
      ruta.descripcion?.toLowerCase().includes(busqueda)
    );
  });

  // Mutations
  const inicializarMutation = useInicializarRutas();
  const crearMutation = useCrearRuta();
  const actualizarMutation = useActualizarRuta();
  const eliminarMutation = useEliminarRuta();

  // Handlers de filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      tipo: '',
      activo: true,
    });
  };

  // Handlers de acciones
  const handleNuevaRuta = () => {
    setRutaSeleccionada(null);
    setFormData(FORM_INICIAL);
    setModalMode('create');
    setIsFormOpen(true);
  };

  const handleEditarRuta = (ruta) => {
    setRutaSeleccionada(ruta);
    setFormData({
      codigo: ruta.codigo || '',
      nombre: ruta.nombre || '',
      descripcion: ruta.descripcion || '',
      tipo: ruta.tipo || 'compra',
      prioridad: ruta.prioridad || 10,
      lead_time_dias: ruta.lead_time_dias || 0,
      activo: ruta.activo !== false,
      es_default: ruta.es_default || false,
    });
    setModalMode('edit');
    setIsFormOpen(true);
  };

  const handleAbrirModalEliminar = (ruta) => {
    setRutaSeleccionada(ruta);
    setModalEliminarAbierto(true);
  };

  const handleFormChange = (campo, valor) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleGuardar = async () => {
    try {
      if (modalMode === 'create') {
        await crearMutation.mutateAsync(formData);
        showSuccess('Ruta creada exitosamente');
      } else {
        await actualizarMutation.mutateAsync({ id: rutaSeleccionada.id, ...formData });
        showSuccess('Ruta actualizada exitosamente');
      }
      setIsFormOpen(false);
    } catch (err) {
      showError(err.response?.data?.mensaje || 'Error al guardar ruta');
    }
  };

  const handleEliminar = async () => {
    try {
      await eliminarMutation.mutateAsync(rutaSeleccionada.id);
      showSuccess('Ruta eliminada correctamente');
      setModalEliminarAbierto(false);
      setRutaSeleccionada(null);
    } catch (err) {
      showError(err.response?.data?.mensaje || 'Error al eliminar ruta');
    }
  };

  const handleInicializarRutas = async () => {
    try {
      const result = await inicializarMutation.mutateAsync();
      showSuccess(`${result?.length || 0} rutas por defecto creadas`);
    } catch (err) {
      showError(err.response?.data?.mensaje || 'Error al inicializar rutas');
    }
  };

  return (
    <InventarioPageLayout
      icon={Route}
      title="Rutas de Operación"
      subtitle={`${rutasFiltradas.length} ruta${rutasFiltradas.length !== 1 ? 's' : ''} configurada${rutasFiltradas.length !== 1 ? 's' : ''}`}
      actions={
        <div className="flex flex-col sm:flex-row gap-2">
          {rutas.length === 0 && (
            <Button
              variant="secondary"
              onClick={handleInicializarRutas}
              icon={Zap}
              isLoading={inicializarMutation.isPending}
              className="w-full sm:w-auto"
            >
              Crear Rutas Default
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleNuevaRuta}
            icon={Plus}
            className="w-full sm:w-auto"
          >
            Nueva Ruta
          </Button>
        </div>
      }
    >
      <div className="space-y-6">

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
                  placeholder="Buscar por código, nombre..."
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo
              </label>
              <select
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Todos los tipos</option>
                {Object.entries(TIPOS_RUTA).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Botón limpiar */}
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={handleLimpiarFiltros}
                icon={X}
                className="w-full"
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
              <span className="text-sm text-gray-700 dark:text-gray-300">Solo rutas activas</span>
            </label>
          </div>
        </div>

        {/* Tabla de Rutas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {cargandoRutas ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando rutas...</span>
            </div>
          ) : rutasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <Route className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No hay rutas configuradas
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {rutas.length === 0
                  ? 'Crea rutas por defecto o agrega una nueva ruta'
                  : 'No se encontraron rutas con los filtros aplicados'}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                {rutas.length === 0 && (
                  <Button
                    variant="secondary"
                    onClick={handleInicializarRutas}
                    icon={Zap}
                    isLoading={inicializarMutation.isPending}
                  >
                    Crear Rutas Default
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleNuevaRuta}
                  icon={Plus}
                >
                  Nueva Ruta
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ruta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lead Time
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
                  {rutasFiltradas.map((ruta) => {
                    const tipoInfo = TIPOS_RUTA[ruta.tipo] || TIPOS_RUTA.compra;
                    const TipoIcon = tipoInfo.icon;

                    return (
                      <tr key={ruta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {/* Ruta */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {ruta.nombre || ruta.codigo}
                              </span>
                              {ruta.es_default && (
                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Código: {ruta.codigo}
                            </div>
                            {ruta.descripcion && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                {ruta.descripcion}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Tipo */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${tipoInfo.color}`}>
                            <TipoIcon className="h-3.5 w-3.5 mr-1.5" />
                            {tipoInfo.label}
                          </span>
                        </td>

                        {/* Prioridad */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {ruta.prioridad || 10}
                          </span>
                        </td>

                        {/* Lead Time */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {ruta.lead_time_dias ? `${ruta.lead_time_dias} días` : '-'}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              ruta.activo
                                ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {ruta.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditarRuta(ruta)}
                              icon={Edit}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleAbrirModalEliminar(ruta)}
                              icon={Trash2}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Drawer de Formulario */}
      <Drawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={modalMode === 'create' ? 'Nueva Ruta de Operación' : 'Editar Ruta'}
        size="md"
      >
        <div className="space-y-4">
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => handleFormChange('codigo', e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="ej: COMPRA_PROV1"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleFormChange('nombre', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="ej: Compra a Proveedor Principal"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleFormChange('descripcion', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Descripción opcional de la ruta..."
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Ruta <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => handleFormChange('tipo', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {Object.entries(TIPOS_RUTA).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Prioridad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridad
              </label>
              <input
                type="number"
                value={formData.prioridad}
                onChange={(e) => handleFormChange('prioridad', parseInt(e.target.value) || 10)}
                min={1}
                max={100}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Menor = mayor prioridad
              </p>
            </div>

            {/* Lead Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lead Time (días)
              </label>
              <input
                type="number"
                value={formData.lead_time_dias}
                onChange={(e) => handleFormChange('lead_time_dias', parseInt(e.target.value) || 0)}
                min={0}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700 dark:text-gray-300">Ruta activa</span>
              <button
                type="button"
                onClick={() => handleFormChange('activo', !formData.activo)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.activo ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.activo ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700 dark:text-gray-300">Ruta por defecto</span>
              <button
                type="button"
                onClick={() => handleFormChange('es_default', !formData.es_default)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.es_default ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.es_default ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setIsFormOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleGuardar}
              isLoading={crearMutation.isPending || actualizarMutation.isPending}
              disabled={!formData.codigo || !formData.nombre}
            >
              {modalMode === 'create' ? 'Crear' : 'Guardar'}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        isOpen={modalEliminarAbierto}
        onClose={() => setModalEliminarAbierto(false)}
        title="Eliminar Ruta"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Estás seguro de que deseas eliminar la ruta{' '}
            <strong className="text-gray-900 dark:text-gray-100">
              {rutaSeleccionada?.nombre || rutaSeleccionada?.codigo}
            </strong>
            ?
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Esta acción no se puede deshacer. Los productos asignados a esta ruta quedarán sin ruta de operación.
          </p>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
    </InventarioPageLayout>
  );
}

export default RutasOperacionPage;
