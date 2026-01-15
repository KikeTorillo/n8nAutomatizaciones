import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Copy,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Clock,
  Calendar,
  Percent,
  DollarSign,
  Package,
  Gift,
  Tag,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Drawer from '@/components/ui/Drawer';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';
import useSucursalStore from '@/store/sucursalStore';
import {
  usePromociones,
  usePromocion,
  useCrearPromocion,
  useActualizarPromocion,
  useEliminarPromocion,
  useCambiarEstadoPromocion,
  useDuplicarPromocion,
  useEstadisticasPromocion,
  useHistorialPromocion,
  TIPOS_PROMOCION,
  DIAS_SEMANA
} from '@/hooks/usePromociones';

/**
 * Pagina de administracion de Promociones Automaticas
 * CRUD completo con estadisticas y historial
 */
export default function PromocionesPage() {
  const toast = useToast();
  const { sucursalActiva } = useSucursalStore();

  // Estados de modales centralizados con useModalManager
  const {
    openModal,
    closeModal,
    isOpen,
    getModalData,
  } = useModalManager({
    form: { isOpen: false, data: null, mode: 'create' },
    delete: { isOpen: false, data: null },
    stats: { isOpen: false, data: null },
  });

  // Filtros y paginacion
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Query principal
  const { data, isLoading, error } = usePromociones({
    page,
    limit,
    busqueda: searchTerm || undefined,
    tipo: filterTipo || undefined,
    activo: filterEstado === 'activo' ? true : filterEstado === 'inactivo' ? false : undefined,
    sucursalId: sucursalActiva?.id
  });

  const promociones = data?.promociones || [];
  const paginacion = data?.paginacion || { total: 0, totalPages: 1 };

  // Mutations
  const crearMutation = useCrearPromocion();
  const actualizarMutation = useActualizarPromocion();
  const eliminarMutation = useEliminarPromocion();
  const cambiarEstadoMutation = useCambiarEstadoPromocion();
  const duplicarMutation = useDuplicarPromocion();

  // Estadisticas (usando datos del modal)
  const selectedPromocionId = getModalData('stats')?.id;
  const { data: estadisticas, isLoading: loadingStats } = useEstadisticasPromocion(selectedPromocionId);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo: 'porcentaje',
      valor_descuento: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      hora_inicio: '',
      hora_fin: '',
      dias_semana: [],
      prioridad: '0',
      exclusiva: false,
      acumulable_cupones: true,
      limite_uso_total: '',
      limite_uso_cliente: '',
      activo: true,
      // Reglas JSON
      reglas: {
        cantidad_requerida: '',
        cantidad_gratis: '',
        monto_minimo: '',
        productos_ids: [],
        categorias_ids: [],
        clientes_ids: []
      }
    }
  });

  const tipoSeleccionado = watch('tipo');

  // Handlers usando useModalManager
  const handleNuevo = () => {
    reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo: 'porcentaje',
      valor_descuento: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      hora_inicio: '',
      hora_fin: '',
      dias_semana: [],
      prioridad: '0',
      exclusiva: false,
      acumulable_cupones: true,
      limite_uso_total: '',
      limite_uso_cliente: '',
      activo: true,
      reglas: {
        cantidad_requerida: '',
        cantidad_gratis: '',
        monto_minimo: '',
        productos_ids: [],
        categorias_ids: [],
        clientes_ids: []
      }
    });
    openModal('form', null, { mode: 'create' });
  };

  const handleEditar = (promocion) => {
    const reglas = promocion.reglas || {};
    reset({
      codigo: promocion.codigo || '',
      nombre: promocion.nombre || '',
      descripcion: promocion.descripcion || '',
      tipo: promocion.tipo || 'porcentaje',
      valor_descuento: promocion.valor_descuento?.toString() || '',
      fecha_inicio: promocion.fecha_inicio?.split('T')[0] || '',
      fecha_fin: promocion.fecha_fin?.split('T')[0] || '',
      hora_inicio: promocion.hora_inicio || '',
      hora_fin: promocion.hora_fin || '',
      dias_semana: promocion.dias_semana || [],
      prioridad: promocion.prioridad?.toString() || '0',
      exclusiva: promocion.exclusiva || false,
      acumulable_cupones: promocion.acumulable_cupones ?? true,
      limite_uso_total: promocion.limite_uso_total?.toString() || '',
      limite_uso_cliente: promocion.limite_uso_cliente?.toString() || '',
      activo: promocion.activo ?? true,
      reglas: {
        cantidad_requerida: reglas.cantidad_requerida?.toString() || '',
        cantidad_gratis: reglas.cantidad_gratis?.toString() || '',
        monto_minimo: reglas.monto_minimo?.toString() || '',
        productos_ids: reglas.productos_ids || [],
        categorias_ids: reglas.categorias_ids || [],
        clientes_ids: reglas.clientes_ids || []
      }
    });
    openModal('form', promocion, { mode: 'edit' });
  };

  const handleEliminar = (promocion) => {
    openModal('delete', promocion);
  };

  const handleVerEstadisticas = (promocion) => {
    openModal('stats', promocion);
  };

  const handleDuplicar = async (promocionId) => {
    try {
      await duplicarMutation.mutateAsync(promocionId);
      toast.success('Promocion duplicada');
    } catch (error) {
      toast.error(error.message || 'Error al duplicar');
    }
  };

  const handleToggleEstado = async (promocion) => {
    try {
      await cambiarEstadoMutation.mutateAsync({
        id: promocion.id,
        activo: !promocion.activo
      });
      toast.success(promocion.activo ? 'Promocion desactivada' : 'Promocion activada');
    } catch (error) {
      toast.error(error.message || 'Error al cambiar estado');
    }
  };

  const onSubmit = async (data) => {
    const editingPromocion = getModalData('form');
    try {
      // Construir reglas segun tipo
      const reglas = {};
      if (data.tipo === 'cantidad') {
        reglas.cantidad_requerida = parseInt(data.reglas.cantidad_requerida) || 2;
        reglas.cantidad_gratis = parseInt(data.reglas.cantidad_gratis) || 1;
      }
      if (data.reglas.monto_minimo) {
        reglas.monto_minimo = parseFloat(data.reglas.monto_minimo);
      }
      if (data.reglas.productos_ids?.length > 0) {
        reglas.productos_ids = data.reglas.productos_ids;
      }
      if (data.reglas.categorias_ids?.length > 0) {
        reglas.categorias_ids = data.reglas.categorias_ids;
      }

      const payload = {
        codigo: data.codigo.trim().toUpperCase(),
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || undefined,
        tipo: data.tipo,
        valor_descuento: data.valor_descuento ? parseFloat(data.valor_descuento) : undefined,
        reglas,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin || undefined,
        hora_inicio: data.hora_inicio || undefined,
        hora_fin: data.hora_fin || undefined,
        dias_semana: data.dias_semana?.length > 0 ? data.dias_semana : undefined,
        prioridad: parseInt(data.prioridad) || 0,
        exclusiva: data.exclusiva,
        acumulable_cupones: data.acumulable_cupones,
        limite_uso_total: data.limite_uso_total ? parseInt(data.limite_uso_total) : undefined,
        limite_uso_cliente: data.limite_uso_cliente ? parseInt(data.limite_uso_cliente) : undefined,
        activo: data.activo,
        sucursal_id: sucursalActiva?.id
      };

      if (editingPromocion) {
        await actualizarMutation.mutateAsync({
          id: editingPromocion.id,
          data: payload
        });
        toast.success('Promocion actualizada');
      } else {
        await crearMutation.mutateAsync(payload);
        toast.success('Promocion creada');
      }

      closeModal('form');
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al guardar');
    }
  };

  const confirmarEliminar = async () => {
    const promocionToDelete = getModalData('delete');
    try {
      await eliminarMutation.mutateAsync(promocionToDelete.id);
      toast.success('Promocion eliminada');
      closeModal('delete');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al eliminar');
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setSearchTerm('');
    setFilterTipo('');
    setFilterEstado('');
    setPage(1);
  };

  // Iconos por tipo
  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'cantidad':
        return <Package className="h-4 w-4" />;
      case 'porcentaje':
        return <Percent className="h-4 w-4" />;
      case 'monto_fijo':
        return <DollarSign className="h-4 w-4" />;
      case 'regalo':
        return <Gift className="h-4 w-4" />;
      case 'precio_especial':
        return <Tag className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  // Color por estado
  const getEstadoColor = (promocion) => {
    if (!promocion.activo) return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    // Verificar vigencia
    const hoy = new Date();
    const inicio = new Date(promocion.fecha_inicio);
    const fin = promocion.fecha_fin ? new Date(promocion.fecha_fin) : null;
    if (hoy < inicio) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    if (fin && hoy > fin) return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
  };

  const getEstadoLabel = (promocion) => {
    if (!promocion.activo) return 'Inactiva';
    const hoy = new Date();
    const inicio = new Date(promocion.fecha_inicio);
    const fin = promocion.fecha_fin ? new Date(promocion.fecha_fin) : null;
    if (hoy < inicio) return 'Programada';
    if (fin && hoy > fin) return 'Expirada';
    return 'Activa';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BackButton to="/pos" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-amber-500" />
                Promociones
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Administra promociones automaticas del POS
              </p>
            </div>
          </div>

          <Button onClick={handleNuevo} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Promocion
          </Button>
        </div>

        {/* Buscador y filtros */}
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre o codigo..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
                showFilters || filterTipo || filterEstado
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {(filterTipo || filterEstado) && (
                <span className="text-xs bg-primary-500 text-white px-1.5 py-0.5 rounded-full">
                  {[filterTipo, filterEstado].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Panel de filtros expandible */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Tipo
                </label>
                <select
                  value={filterTipo}
                  onChange={(e) => {
                    setFilterTipo(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Todos los tipos</option>
                  {Object.entries(TIPOS_PROMOCION).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Estado
                </label>
                <select
                  value={filterEstado}
                  onChange={(e) => {
                    setFilterEstado(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Todos</option>
                  <option value="activo">Activas</option>
                  <option value="inactivo">Inactivas</option>
                </select>
              </div>

              {(filterTipo || filterEstado) && (
                <div className="flex items-end">
                  <button
                    onClick={limpiarFiltros}
                    className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Limpiar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            Error al cargar promociones
          </div>
        ) : promociones.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <Sparkles className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No hay promociones
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || filterTipo || filterEstado
                ? 'No se encontraron promociones con esos filtros'
                : 'Crea tu primera promocion automatica'
              }
            </p>
            {!searchTerm && !filterTipo && !filterEstado && (
              <Button onClick={handleNuevo}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Promocion
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Lista de promociones */}
            <div className="space-y-3">
              {promociones.map((promocion) => (
                <div
                  key={promocion.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Icono tipo */}
                      <div className={`p-2 rounded-lg ${
                        promocion.activo
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      }`}>
                        {getTipoIcon(promocion.tipo)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {promocion.nombre}
                          </h3>
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            {promocion.codigo}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoColor(promocion)}`}>
                            {getEstadoLabel(promocion)}
                          </span>
                          {promocion.exclusiva && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
                              Exclusiva
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {TIPOS_PROMOCION[promocion.tipo]?.label || promocion.tipo}
                          {promocion.valor_descuento && (
                            <>
                              {' - '}
                              {promocion.tipo === 'porcentaje'
                                ? `${promocion.valor_descuento}%`
                                : `$${promocion.valor_descuento}`
                              }
                            </>
                          )}
                        </p>

                        {/* Fechas y horarios */}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(promocion.fecha_inicio).toLocaleDateString()}
                            {promocion.fecha_fin && ` - ${new Date(promocion.fecha_fin).toLocaleDateString()}`}
                          </span>
                          {(promocion.hora_inicio || promocion.hora_fin) && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {promocion.hora_inicio || '00:00'} - {promocion.hora_fin || '23:59'}
                            </span>
                          )}
                          {promocion.veces_usado > 0 && (
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3.5 w-3.5" />
                              {promocion.veces_usado} usos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleEstado(promocion)}
                        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={promocion.activo ? 'Desactivar' : 'Activar'}
                      >
                        {promocion.activo ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleVerEstadisticas(promocion)}
                        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Ver estadisticas"
                      >
                        <BarChart3 className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => handleDuplicar(promocion.id)}
                        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Duplicar"
                      >
                        <Copy className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => handleEditar(promocion)}
                        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => handleEliminar(promocion)}
                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginacion */}
            {paginacion.totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={page}
                  totalPages={paginacion.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Drawer de crear/editar usando useModalManager */}
      <Drawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        title={getModalData('form') ? 'Editar Promocion' : 'Nueva Promocion'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
          {/* Codigo y nombre */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Codigo"
              placeholder="PROMO2X1"
              {...register('codigo', { required: 'Codigo requerido' })}
              error={errors.codigo?.message}
              className="uppercase"
            />
            <Input
              label="Nombre"
              placeholder="2x1 en bebidas"
              {...register('nombre', { required: 'Nombre requerido' })}
              error={errors.nombre?.message}
            />
          </div>

          {/* Descripcion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripcion (opcional)
            </label>
            <textarea
              {...register('descripcion')}
              rows={2}
              placeholder="Descripcion de la promocion..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Tipo de promocion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de promocion
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(TIPOS_PROMOCION).map(([key, value]) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    tipoSeleccionado === key
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    value={key}
                    {...register('tipo')}
                    className="sr-only"
                  />
                  {getTipoIcon(key)}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {value.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Campos segun tipo */}
          {tipoSeleccionado === 'cantidad' && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Input
                label="Cantidad requerida"
                type="number"
                placeholder="2"
                {...register('reglas.cantidad_requerida')}
              />
              <Input
                label="Cantidad gratis"
                type="number"
                placeholder="1"
                {...register('reglas.cantidad_gratis')}
              />
            </div>
          )}

          {(tipoSeleccionado === 'porcentaje' || tipoSeleccionado === 'monto_fijo') && (
            <Input
              label={tipoSeleccionado === 'porcentaje' ? 'Porcentaje de descuento' : 'Monto de descuento'}
              type="number"
              step={tipoSeleccionado === 'porcentaje' ? '1' : '0.01'}
              placeholder={tipoSeleccionado === 'porcentaje' ? '10' : '50.00'}
              {...register('valor_descuento', { required: 'Valor requerido' })}
              error={errors.valor_descuento?.message}
              suffix={tipoSeleccionado === 'porcentaje' ? '%' : '$'}
            />
          )}

          {/* Monto minimo */}
          <Input
            label="Monto minimo de compra (opcional)"
            type="number"
            step="0.01"
            placeholder="100.00"
            {...register('reglas.monto_minimo')}
          />

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha inicio"
              type="date"
              {...register('fecha_inicio', { required: 'Fecha inicio requerida' })}
              error={errors.fecha_inicio?.message}
            />
            <Input
              label="Fecha fin (opcional)"
              type="date"
              {...register('fecha_fin')}
            />
          </div>

          {/* Horarios */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hora inicio (opcional)"
              type="time"
              {...register('hora_inicio')}
            />
            <Input
              label="Hora fin (opcional)"
              type="time"
              {...register('hora_fin')}
            />
          </div>

          {/* Dias de la semana */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dias de la semana (dejar vacio para todos)
            </label>
            <Controller
              name="dias_semana"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((dia) => (
                    <label
                      key={dia.value}
                      className={`px-3 py-1.5 rounded-full cursor-pointer text-sm transition-colors ${
                        field.value?.includes(dia.value)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={field.value?.includes(dia.value)}
                        onChange={(e) => {
                          const newValue = e.target.checked
                            ? [...(field.value || []), dia.value]
                            : (field.value || []).filter(v => v !== dia.value);
                          field.onChange(newValue.sort((a, b) => a - b));
                        }}
                        className="sr-only"
                      />
                      {dia.label.substring(0, 3)}
                    </label>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Opciones avanzadas */}
          <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Opciones avanzadas
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prioridad"
                type="number"
                placeholder="0"
                {...register('prioridad')}
              />
              <Input
                label="Limite uso total"
                type="number"
                placeholder="Sin limite"
                {...register('limite_uso_total')}
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('exclusiva')}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Promocion exclusiva (no se acumula con otras)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('acumulable_cupones')}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Acumulable con cupones
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('activo')}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Activa
                </span>
              </label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => closeModal('form')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={crearMutation.isPending || actualizarMutation.isPending}
              className="flex-1"
            >
              {(crearMutation.isPending || actualizarMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {getModalData('form') ? 'Guardar cambios' : 'Crear promocion'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Modal de estadisticas usando useModalManager */}
      <Modal
        isOpen={isOpen('stats')}
        onClose={() => closeModal('stats')}
        title="Estadisticas de Promocion"
      >
        {loadingStats ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : estadisticas ? (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {estadisticas.total_usos || 0}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">Veces usada</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${(estadisticas.descuento_total || 0).toFixed(2)}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">Descuento total</p>
              </div>
            </div>

            {estadisticas.promedio_descuento && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Promedio por uso</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  ${estadisticas.promedio_descuento.toFixed(2)}
                </p>
              </div>
            )}

            {estadisticas.ultimo_uso && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Ultimo uso</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(estadisticas.ultimo_uso).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay estadisticas disponibles
          </div>
        )}
      </Modal>

      {/* Confirmacion de eliminar usando useModalManager */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={confirmarEliminar}
        title="Eliminar promocion"
        message={`¿Estas seguro de eliminar la promocion "${getModalData('delete')?.nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </div>
  );
}
