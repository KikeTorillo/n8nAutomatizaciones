import { useState } from 'react';
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Calendar,
  Percent,
  DollarSign,
  Filter,
  X,
  Users,
  Hash,
  History,
  TrendingUp,
  ShoppingCart,
  Clock,
  Receipt
} from 'lucide-react';

import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import CuponFormDrawer from '@/components/pos/CuponFormDrawer';
import { useToast } from '@/hooks/useToast';
import {
  useCupones,
  useEliminarCupon,
  useCambiarEstadoCupon,
  useEstadisticasCupon,
  useHistorialCupon
} from '@/hooks/useCupones';

// Tipos de descuento disponibles
const TIPOS_DESCUENTO = {
  porcentaje: { label: 'Porcentaje', icon: Percent },
  monto_fijo: { label: 'Monto fijo', icon: DollarSign }
};

/**
 * Pagina de administracion de Cupones de Descuento
 * CRUD completo con estadisticas
 */
export default function CuponesPage() {
  const toast = useToast();

  // Estados de UI
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCupon, setEditingCupon] = useState(null);
  const [drawerKey, setDrawerKey] = useState(0); // Key para forzar remontaje del drawer
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedCuponId, setSelectedCuponId] = useState(null);
  const [statsTab, setStatsTab] = useState('estadisticas'); // 'estadisticas' | 'historial'

  // Filtros y paginacion
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Query principal
  const { data, isLoading, error } = useCupones({
    page,
    limit,
    busqueda: searchTerm || undefined,
    activo: filterEstado === 'activo' ? 'true' : filterEstado === 'inactivo' ? 'false' : undefined
  });

  const cupones = data?.cupones || [];
  const paginacion = data?.paginacion || { total: 0, totalPages: 1 };

  // Mutations
  const eliminarMutation = useEliminarCupon();
  const cambiarEstadoMutation = useCambiarEstadoCupon();

  // Estadisticas e historial
  const { data: estadisticas, isLoading: loadingStats } = useEstadisticasCupon(selectedCuponId);
  const { data: historial, isLoading: loadingHistorial } = useHistorialCupon(
    statsTab === 'historial' ? selectedCuponId : null,
    { limit: 20 }
  );

  // Handlers
  const handleNuevo = () => {
    setEditingCupon(null);
    setDrawerKey(k => k + 1); // Forzar remontaje del drawer
    setDrawerOpen(true);
  };

  const handleEditar = (cupon) => {
    setEditingCupon(cupon);
    setDrawerKey(k => k + 1); // Forzar remontaje del drawer
    setDrawerOpen(true);
  };

  const handleEliminar = (cupon) => {
    setDeleteConfirm(cupon);
  };

  const handleVerEstadisticas = (cuponId) => {
    setSelectedCuponId(cuponId);
    setStatsTab('estadisticas');
    setStatsModalOpen(true);
  };

  const handleToggleEstado = async (cupon) => {
    try {
      await cambiarEstadoMutation.mutateAsync({
        id: cupon.id,
        activo: !cupon.activo
      });
      toast.success(cupon.activo ? 'Cupon desactivado' : 'Cupon activado');
    } catch (error) {
      toast.error(error.message || 'Error al cambiar estado');
    }
  };

  // Callback cuando se guarda exitosamente en el drawer
  const handleFormSuccess = () => {
    setDrawerOpen(false);
    setEditingCupon(null);
  };

  const confirmarEliminar = async () => {
    try {
      await eliminarMutation.mutateAsync(deleteConfirm.id);
      toast.success('Cupon eliminado');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al eliminar');
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setSearchTerm('');
    setFilterEstado('');
    setPage(1);
  };

  // Iconos por tipo
  const getTipoIcon = (tipo) => {
    const IconComponent = TIPOS_DESCUENTO[tipo]?.icon || Ticket;
    return <IconComponent className="h-4 w-4" />;
  };

  // Color por estado
  const getEstadoColor = (cupon) => {
    if (!cupon.activo) return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    // Verificar vigencia
    const hoy = new Date();
    const inicio = cupon.fecha_inicio ? new Date(cupon.fecha_inicio) : null;
    const fin = cupon.fecha_fin ? new Date(cupon.fecha_fin) : null;
    if (inicio && hoy < inicio) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    if (fin && hoy > fin) return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
  };

  const getEstadoLabel = (cupon) => {
    if (!cupon.activo) return 'Inactivo';
    const hoy = new Date();
    const inicio = cupon.fecha_inicio ? new Date(cupon.fecha_inicio) : null;
    const fin = cupon.fecha_fin ? new Date(cupon.fecha_fin) : null;
    if (inicio && hoy < inicio) return 'Programado';
    if (fin && hoy > fin) return 'Expirado';
    return 'Activo';
  };

  // Formatear valor de descuento
  const formatDescuento = (cupon) => {
    if (cupon.tipo_descuento === 'porcentaje') {
      return `${cupon.valor}%`;
    }
    return `$${cupon.valor}`;
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
                <Ticket className="h-6 w-6 text-primary-500" />
                Cupones de Descuento
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Administra cupones para aplicar en ventas
              </p>
            </div>
          </div>

          <Button onClick={handleNuevo} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Cupon
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
                showFilters || filterEstado
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {filterEstado && (
                <span className="text-xs bg-primary-500 text-white px-1.5 py-0.5 rounded-full">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Panel de filtros expandible */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </div>

              {filterEstado && (
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
            Error al cargar cupones
          </div>
        ) : cupones.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <Ticket className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No hay cupones
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || filterEstado
                ? 'No se encontraron cupones con esos filtros'
                : 'Crea tu primer cupon de descuento'
              }
            </p>
            {!searchTerm && !filterEstado && (
              <Button onClick={handleNuevo}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cupon
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Lista de cupones */}
            <div className="space-y-3">
              {cupones.map((cupon) => (
                <div
                  key={cupon.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Icono tipo */}
                      <div className={`p-2 rounded-lg ${
                        cupon.activo
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      }`}>
                        {getTipoIcon(cupon.tipo_descuento)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {cupon.nombre}
                          </h3>
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            {cupon.codigo}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoColor(cupon)}`}>
                            {getEstadoLabel(cupon)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {TIPOS_DESCUENTO[cupon.tipo_descuento]?.label || cupon.tipo_descuento}
                          {' - '}
                          <span className="font-semibold text-primary-600 dark:text-primary-400">
                            {formatDescuento(cupon)}
                          </span>
                          {cupon.monto_minimo && (
                            <span className="ml-2 text-xs">
                              (min. ${cupon.monto_minimo})
                            </span>
                          )}
                        </p>

                        {/* Info adicional */}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {(cupon.fecha_inicio || cupon.fecha_fin) && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {cupon.fecha_inicio && new Date(cupon.fecha_inicio).toLocaleDateString()}
                              {cupon.fecha_fin && ` - ${new Date(cupon.fecha_fin).toLocaleDateString()}`}
                            </span>
                          )}
                          {cupon.uso_maximo && (
                            <span className="flex items-center gap-1">
                              <Hash className="h-3.5 w-3.5" />
                              {cupon.veces_usado || 0}/{cupon.uso_maximo} usos
                            </span>
                          )}
                          {cupon.uso_por_cliente && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              Max {cupon.uso_por_cliente}/cliente
                            </span>
                          )}
                          {cupon.veces_usado > 0 && !cupon.uso_maximo && (
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3.5 w-3.5" />
                              {cupon.veces_usado} usos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleEstado(cupon)}
                        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={cupon.activo ? 'Desactivar' : 'Activar'}
                      >
                        {cupon.activo ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleVerEstadisticas(cupon.id)}
                        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Ver estadisticas"
                      >
                        <BarChart3 className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => handleEditar(cupon)}
                        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => handleEliminar(cupon)}
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

      {/* Drawer de crear/editar - solo se renderiza cuando está abierto para forzar desmontaje */}
      {drawerOpen && (
        <CuponFormDrawer
          key={drawerKey}
          isOpen={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setEditingCupon(null);
          }}
          cupon={editingCupon}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Modal de estadisticas mejorado */}
      <Modal
        isOpen={statsModalOpen}
        onClose={() => {
          setStatsModalOpen(false);
          setSelectedCuponId(null);
        }}
        title={estadisticas ? `Estadísticas: ${estadisticas.nombre}` : 'Estadísticas del Cupón'}
        subtitle={estadisticas?.codigo ? `Código: ${estadisticas.codigo}` : undefined}
        size="lg"
      >
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            onClick={() => setStatsTab('estadisticas')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statsTab === 'estadisticas'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Estadísticas
          </button>
          <button
            onClick={() => setStatsTab('historial')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statsTab === 'historial'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <History className="h-4 w-4" />
            Historial de Uso
          </button>
        </div>

        {/* Tab: Estadísticas */}
        {statsTab === 'estadisticas' && (
          <>
            {loadingStats ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : estadisticas ? (
              <div className="space-y-6">
                {/* Grid principal de métricas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Hash className="h-5 w-5 text-primary-500" />
                    </div>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {estadisticas.total_usos || 0}
                    </p>
                    <p className="text-xs text-primary-700 dark:text-primary-300">Veces usado</p>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${parseFloat(estadisticas.total_descuento_dado || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">Descuento total dado</p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <div className="flex items-center justify-center mb-2">
                      <ShoppingCart className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ${parseFloat(estadisticas.total_ventas_con_cupon || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Ventas con cupón</p>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {estadisticas.clientes_unicos || 0}
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300">Clientes únicos</p>
                  </div>
                </div>

                {/* Detalles adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Promedio por uso */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Descuento promedio por uso</p>
                    </div>
                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      ${parseFloat(estadisticas.descuento_promedio || 0).toFixed(2)}
                    </p>
                  </div>

                  {/* Último uso */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Último uso</p>
                    </div>
                    <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {estadisticas.ultimo_uso
                        ? new Date(estadisticas.ultimo_uso).toLocaleString('es-MX', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        : 'Sin usar aún'}
                    </p>
                  </div>
                </div>

                {/* Uso vs Límite */}
                {estadisticas.usos_maximos && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Uso del cupón</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {estadisticas.usos_actuales || 0} / {estadisticas.usos_maximos}
                      </p>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          (estadisticas.usos_actuales / estadisticas.usos_maximos) >= 0.9
                            ? 'bg-red-500'
                            : (estadisticas.usos_actuales / estadisticas.usos_maximos) >= 0.7
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(100, ((estadisticas.usos_actuales || 0) / estadisticas.usos_maximos) * 100)}%`
                        }}
                      />
                    </div>
                    {(estadisticas.usos_actuales / estadisticas.usos_maximos) >= 0.9 && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        ¡El cupón está por agotar sus usos!
                      </p>
                    )}
                  </div>
                )}

                {/* Fechas de vigencia */}
                {(estadisticas.fecha_inicio || estadisticas.fecha_fin) && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Vigencia</p>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {estadisticas.fecha_inicio
                        ? new Date(estadisticas.fecha_inicio).toLocaleDateString('es-MX')
                        : 'Sin fecha inicio'}
                      {' → '}
                      {estadisticas.fecha_fin
                        ? new Date(estadisticas.fecha_fin).toLocaleDateString('es-MX')
                        : 'Sin fecha fin'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                No hay estadísticas disponibles
              </div>
            )}
          </>
        )}

        {/* Tab: Historial */}
        {statsTab === 'historial' && (
          <>
            {loadingHistorial ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : historial && historial.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Ticket
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Venta
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Descuento
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {historial.map((uso, index) => (
                      <tr key={uso.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {uso.aplicado_en
                            ? new Date(uso.aplicado_en).toLocaleString('es-MX', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })
                            : uso.fecha_venta
                              ? new Date(uso.fecha_venta).toLocaleString('es-MX', {
                                  dateStyle: 'short',
                                  timeStyle: 'short'
                                })
                              : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            {uso.numero_ticket || `#${uso.venta_pos_id}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {uso.cliente_nombre || 'Público general'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                          ${parseFloat(uso.total_venta || uso.subtotal_antes || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-green-600 dark:text-green-400">
                          -${parseFloat(uso.descuento_aplicado || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">Sin historial</p>
                <p className="text-sm">Este cupón aún no ha sido utilizado</p>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Confirmacion de eliminar */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar cupon"
        message={`¿Estas seguro de eliminar el cupon "${deleteConfirm?.nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </div>
  );
}
