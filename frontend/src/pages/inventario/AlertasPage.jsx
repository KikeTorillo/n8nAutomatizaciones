import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  TrendingDown,
  Clock,
  XCircle,
  Filter,
  X,
  CheckCircle,
  CheckCheck,
  ShoppingCart,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Select from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import InventarioNavTabs from '@/components/inventario/InventarioNavTabs';
import {
  useAlertas,
  useMarcarAlertaLeida,
  useMarcarVariasAlertasLeidas,
  useGenerarOCDesdeProducto,
} from '@/hooks/useInventario';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Página principal de Alertas de Inventario
 */
function AlertasPage() {
  const { showToast } = useToast();

  // Estado de filtros
  // NOTA: soloNoLeidas controla el checkbox, luego se convierte a leida para el backend
  const [filtros, setFiltros] = useState({
    tipo_alerta: '',
    nivel: '',
    soloNoLeidas: false, // false = mostrar todas, true = solo no leídas
    producto_id: '',
    fecha_desde: '',
    fecha_hasta: '',
  });

  // Estado de selección
  const [alertasSeleccionadas, setAlertasSeleccionadas] = useState([]);

  // Preparar parámetros para el backend
  // soloNoLeidas: true → leida: false (filtrar solo no leídas)
  // soloNoLeidas: false → no enviar leida (mostrar todas)
  const queryParams = {
    tipo_alerta: filtros.tipo_alerta,
    nivel: filtros.nivel,
    producto_id: filtros.producto_id,
    fecha_desde: filtros.fecha_desde,
    fecha_hasta: filtros.fecha_hasta,
    ...(filtros.soloNoLeidas ? { leida: false } : {}),
  };

  // Queries
  const { data: alertasData, isLoading: cargandoAlertas } = useAlertas(queryParams);
  const alertas = alertasData?.alertas || [];
  const total = alertasData?.total || 0;

  // Mutations
  const marcarUnaMutation = useMarcarAlertaLeida();
  const marcarVariasMutation = useMarcarVariasAlertasLeidas();
  const generarOCMutation = useGenerarOCDesdeProducto();

  // Handlers de filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      tipo_alerta: '',
      nivel: '',
      soloNoLeidas: false,
      producto_id: '',
      fecha_desde: '',
      fecha_hasta: '',
    });
  };

  // Handlers de selección
  const handleSeleccionarAlerta = (alertaId) => {
    setAlertasSeleccionadas((prev) => {
      if (prev.includes(alertaId)) {
        return prev.filter((id) => id !== alertaId);
      }
      return [...prev, alertaId];
    });
  };

  const handleSeleccionarTodas = () => {
    if (alertasSeleccionadas.length === alertas.length) {
      setAlertasSeleccionadas([]);
    } else {
      setAlertasSeleccionadas(alertas.map((a) => a.id));
    }
  };

  // Handlers de acciones
  const handleMarcarLeida = (alertaId) => {
    marcarUnaMutation.mutate(alertaId, {
      onSuccess: () => {
        showToast('Alerta marcada como leída', 'success');
        setAlertasSeleccionadas((prev) => prev.filter((id) => id !== alertaId));
      },
      onError: (error) => {
        showToast(
          error.response?.data?.mensaje || 'Error al marcar alerta',
          'error'
        );
      },
    });
  };

  const handleMarcarVariasLeidas = () => {
    if (alertasSeleccionadas.length === 0) {
      showToast('Debes seleccionar al menos una alerta', 'warning');
      return;
    }

    marcarVariasMutation.mutate(
      { alerta_ids: alertasSeleccionadas },
      {
        onSuccess: () => {
          showToast(
            `${alertasSeleccionadas.length} alerta${alertasSeleccionadas.length !== 1 ? 's' : ''} marcada${alertasSeleccionadas.length !== 1 ? 's' : ''} como leída${alertasSeleccionadas.length !== 1 ? 's' : ''}`,
            'success'
          );
          setAlertasSeleccionadas([]);
        },
        onError: (error) => {
          showToast(
            error.response?.data?.mensaje || 'Error al marcar alertas',
            'error'
          );
        },
      }
    );
  };

  const handleGenerarOC = (productoId, productoNombre) => {
    generarOCMutation.mutate(productoId, {
      onSuccess: (orden) => {
        showToast(
          `Orden de compra ${orden.folio} creada para "${productoNombre}"`,
          'success'
        );
      },
      onError: (error) => {
        showToast(
          error.response?.data?.mensaje || 'Error al generar orden de compra',
          'error'
        );
      },
    });
  };

  // Helper para verificar si es alerta de stock
  const esAlertaStock = (tipo) => {
    return tipo === 'stock_minimo' || tipo === 'stock_agotado';
  };

  // Helpers
  const getTipoAlertaIcon = (tipo) => {
    const icons = {
      stock_minimo: TrendingDown,
      stock_agotado: XCircle,
      proximo_vencimiento: Clock,
      vencido: AlertCircle,
      sin_movimiento: Clock,
    };
    return icons[tipo] || AlertCircle;
  };

  const getTipoAlertaLabel = (tipo) => {
    const labels = {
      stock_minimo: 'Stock Mínimo',
      stock_agotado: 'Stock Agotado',
      proximo_vencimiento: 'Próximo Vencimiento',
      vencido: 'Vencido',
      sin_movimiento: 'Sin Movimiento',
    };
    return labels[tipo] || tipo;
  };

  const getNivelColor = (nivel) => {
    const colors = {
      info: 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 border-primary-200 dark:border-primary-800',
      warning: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      critical: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    };
    return colors[nivel] || colors.info;
  };

  const getNivelIcon = (nivel) => {
    const colors = {
      info: 'text-primary-600 dark:text-primary-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      critical: 'text-red-600 dark:text-red-400',
    };
    return colors[nivel] || colors.info;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con navegación */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventario</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
              <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Alertas de Inventario</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {total} alerta{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Acciones Masivas */}
            {alertasSeleccionadas.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {alertasSeleccionadas.length} seleccionada{alertasSeleccionadas.length !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="primary"
                  onClick={handleMarcarVariasLeidas}
                  icon={CheckCheck}
                  isLoading={marcarVariasMutation.isPending}
                >
                  Marcar como Leídas
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Tipo de Alerta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <Select
                value={filtros.tipo_alerta}
                onChange={(e) => handleFiltroChange('tipo_alerta', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="stock_minimo">Stock Mínimo</option>
                <option value="stock_agotado">Stock Agotado</option>
                <option value="proximo_vencimiento">Próximo Vencimiento</option>
                <option value="vencido">Vencido</option>
                <option value="sin_movimiento">Sin Movimiento</option>
              </Select>
            </div>

            {/* Nivel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nivel
              </label>
              <Select
                value={filtros.nivel}
                onChange={(e) => handleFiltroChange('nivel', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </Select>
            </div>

            {/* Fecha Desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Botón Limpiar */}
            <div className="flex items-end">
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

          {/* Toggle Leídas */}
          <div className="mt-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filtros.soloNoLeidas}
                onChange={(e) => handleFiltroChange('soloNoLeidas', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 bg-white dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Mostrar solo no leídas</span>
            </label>
          </div>
        </div>

        {/* Lista de Alertas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {cargandoAlertas ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando alertas...</span>
            </div>
          ) : alertas.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No hay alertas
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No se encontraron alertas con los filtros aplicados
              </p>
            </div>
          ) : (
            <div className="p-4">
              {/* Header de Selección */}
              <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="checkbox"
                  checked={alertasSeleccionadas.length === alertas.length}
                  onChange={handleSeleccionarTodas}
                  className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 bg-white dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Seleccionar todas ({alertas.length})
                </span>
              </div>

              {/* Alertas */}
              <div className="space-y-3">
                {alertas.map((alerta) => {
                  const Icon = getTipoAlertaIcon(alerta.tipo_alerta);
                  return (
                    <div
                      key={alerta.id}
                      className={`flex items-start p-4 rounded-lg border-2 ${getNivelColor(
                        alerta.nivel
                      )} ${
                        alerta.leida ? 'opacity-60' : ''
                      } transition-opacity`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={alertasSeleccionadas.includes(alerta.id)}
                        onChange={() => handleSeleccionarAlerta(alerta.id)}
                        className="w-5 h-5 mt-1 mr-3 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 bg-white dark:bg-gray-700"
                        disabled={alerta.leida}
                      />

                      {/* Icono */}
                      <Icon
                        className={`h-6 w-6 mt-0.5 mr-3 flex-shrink-0 ${getNivelIcon(
                          alerta.nivel
                        )}`}
                      />

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span
                                className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getNivelColor(
                                  alerta.nivel
                                )}`}
                              >
                                {getTipoAlertaLabel(alerta.tipo_alerta)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {format(
                                  new Date(alerta.creado_en),
                                  "dd/MM/yyyy 'a las' HH:mm",
                                  { locale: es }
                                )}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                (
                                {formatDistanceToNow(new Date(alerta.creado_en), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                                )
                              </span>
                              {alerta.leida && (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Leída
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {alerta.producto_nombre}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{alerta.mensaje}</p>
                          </div>

                          {/* Botones de acciones */}
                          <div className="flex items-center space-x-2">
                            {/* Botón Generar OC (solo para alertas de stock) */}
                            {esAlertaStock(alerta.tipo_alerta) && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleGenerarOC(alerta.producto_id, alerta.producto_nombre)}
                                icon={ShoppingCart}
                                isLoading={generarOCMutation.isPending}
                                title="Generar Orden de Compra"
                              >
                                Generar OC
                              </Button>
                            )}

                            {/* Botón Marcar Leída */}
                            {!alerta.leida && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleMarcarLeida(alerta.id)}
                                icon={CheckCircle}
                                isLoading={marcarUnaMutation.isPending}
                              >
                                Marcar Leída
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AlertasPage;
