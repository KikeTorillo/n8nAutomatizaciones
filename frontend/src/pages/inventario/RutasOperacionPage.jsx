import { useState } from 'react';
import { Route, Plus, Edit, Trash2, Search, X, Zap, Truck, ShoppingCart, Factory } from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  DataTable,
  DataTableActionButton,
  DataTableActions,
  Drawer
} from '@/components/ui';
import { useToast } from '@/hooks/utils';
import { useModalManager } from '@/hooks/utils';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useRutasOperacion,
  useInicializarRutas,
  useCrearRuta,
  useActualizarRuta,
  useEliminarRuta,
} from '@/hooks/inventario';

// Tipos de ruta con sus iconos y colores
const TIPOS_RUTA = {
  compra: { label: 'Compra', icon: ShoppingCart, color: 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300' },
  transferencia: { label: 'Transferencia', icon: Truck, color: 'bg-secondary-100 dark:bg-secondary-900/40 text-secondary-800 dark:text-secondary-300' },
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

  // Estado de modales centralizado con useModalManager
  const { openModal, closeModal, isOpen, getModalData, getModalProps } = useModalManager({
    form: { isOpen: false, data: null, mode: 'create' },
    delete: { isOpen: false, data: null },
  });

  // Estado del formulario (se mantiene separado porque es estado del form interno)
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
    setFormData(FORM_INICIAL);
    openModal('form', null, { mode: 'create' });
  };

  const handleEditarRuta = (ruta) => {
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
    openModal('form', ruta, { mode: 'edit' });
  };

  const handleAbrirModalEliminar = (ruta) => {
    openModal('delete', ruta);
  };

  const handleFormChange = (campo, valor) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleGuardar = async () => {
    const rutaSeleccionada = getModalData('form');
    const modalMode = getModalProps('form').mode || 'create';
    try {
      if (modalMode === 'create') {
        await crearMutation.mutateAsync(formData);
        showSuccess('Ruta creada exitosamente');
      } else {
        await actualizarMutation.mutateAsync({ id: rutaSeleccionada.id, ...formData });
        showSuccess('Ruta actualizada exitosamente');
      }
      closeModal('form');
    } catch (err) {
      showError(err.response?.data?.mensaje || 'Error al guardar ruta');
    }
  };

  const handleEliminar = async () => {
    const rutaAEliminar = getModalData('delete');
    if (!rutaAEliminar) return;
    try {
      await eliminarMutation.mutateAsync(rutaAEliminar.id);
      showSuccess('Ruta eliminada correctamente');
      closeModal('delete');
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
        <DataTable
          columns={[
            {
              key: 'ruta',
              header: 'Ruta',
              width: 'xl',
              render: (row) => (
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {row.nombre || row.codigo}
                    </span>
                    {row.es_default && (
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Código: {row.codigo}
                  </div>
                  {row.descripcion && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                      {row.descripcion}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'tipo',
              header: 'Tipo',
              hideOnMobile: true,
              render: (row) => {
                const tipoInfo = TIPOS_RUTA[row.tipo] || TIPOS_RUTA.compra;
                const TipoIcon = tipoInfo.icon;
                return (
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${tipoInfo.color}`}>
                    <TipoIcon className="h-3.5 w-3.5 mr-1.5" />
                    {tipoInfo.label}
                  </span>
                );
              },
            },
            {
              key: 'prioridad',
              header: 'Prioridad',
              hideOnMobile: true,
              render: (row) => (
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {row.prioridad || 10}
                </span>
              ),
            },
            {
              key: 'lead_time',
              header: 'Lead Time',
              hideOnMobile: true,
              render: (row) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {row.lead_time_dias ? `${row.lead_time_dias} días` : '-'}
                </span>
              ),
            },
            {
              key: 'estado',
              header: 'Estado',
              align: 'center',
              render: (row) => (
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    row.activo
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}
                >
                  {row.activo ? 'Activa' : 'Inactiva'}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <DataTableActions>
                  <DataTableActionButton icon={Edit} label="Editar" onClick={() => handleEditarRuta(row)} variant="primary" />
                  <DataTableActionButton icon={Trash2} label="Eliminar" onClick={() => handleAbrirModalEliminar(row)} variant="danger" />
                </DataTableActions>
              ),
            },
          ]}
          data={rutasFiltradas}
          isLoading={cargandoRutas}
          emptyState={{
            icon: Route,
            title: 'No hay rutas configuradas',
            description: rutas.length === 0
              ? 'Crea rutas por defecto o agrega una nueva ruta'
              : 'No se encontraron rutas con los filtros aplicados',
            actionLabel: rutas.length === 0 ? 'Crear Rutas Default' : 'Nueva Ruta',
            onAction: rutas.length === 0 ? handleInicializarRutas : handleNuevaRuta,
          }}
          skeletonRows={5}
        />
      </div>

      {/* Drawer de Formulario */}
      <Drawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        title={getModalProps('form').mode === 'create' ? 'Nueva Ruta de Operación' : 'Editar Ruta'}
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
              onClick={() => closeModal('form')}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleGuardar}
              isLoading={crearMutation.isPending || actualizarMutation.isPending}
              disabled={!formData.codigo || !formData.nombre}
            >
              {getModalProps('form').mode === 'create' ? 'Crear' : 'Guardar'}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={handleEliminar}
        title="Eliminar Ruta"
        message={`¿Estás seguro de que deseas eliminar la ruta "${getModalData('delete')?.nombre || getModalData('delete')?.codigo}"? Esta acción no se puede deshacer. Los productos asignados a esta ruta quedarán sin ruta de operación.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </InventarioPageLayout>
  );
}

export default RutasOperacionPage;
