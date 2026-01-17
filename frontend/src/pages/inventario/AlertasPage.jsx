import { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  TrendingDown,
  Clock,
  XCircle,
  CheckCircle,
  CheckCheck,
  ShoppingCart,
  Package,
  TrendingUp,
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  FilterPanel,
  Pagination,
  SkeletonTable
} from '@/components/ui';
import { useToast } from '@/hooks/utils';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useAlertas,
  useMarcarAlertaLeida,
  useMarcarVariasAlertasLeidas,
  useGenerarOCDesdeProducto,
} from '@/hooks/inventario';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const ITEMS_PER_PAGE = 20;

/**
 * Página principal de Alertas de Inventario
 */
function AlertasPage() {
  const { showToast } = useToast();

  // Estado de filtros y paginación
  // NOTA: soloNoLeidas controla el checkbox, luego se convierte a leida para el backend
  const [filtros, setFiltros] = useState({
    tipo_alerta: '',
    nivel: '',
    soloNoLeidas: false, // false = mostrar todas, true = solo no leídas
    soloNecesitanAccion: false, // Solo mostrar alertas que NO tienen OC pendiente
    fecha_desde: '',
    fecha_hasta: '',
  });
  const [page, setPage] = useState(1);

  // Estado de selección
  const [alertasSeleccionadas, setAlertasSeleccionadas] = useState([]);

  // Config de filtros para FilterPanel
  const filterConfig = useMemo(() => [
    {
      key: 'tipo_alerta',
      label: 'Tipo',
      type: 'select',
      options: [
        { value: 'stock_minimo', label: 'Stock Mínimo' },
        { value: 'stock_agotado', label: 'Stock Agotado' },
        { value: 'proximo_vencimiento', label: 'Próximo Vencimiento' },
        { value: 'vencido', label: 'Vencido' },
        { value: 'sin_movimiento', label: 'Sin Movimiento' },
      ],
    },
    {
      key: 'nivel',
      label: 'Nivel',
      type: 'select',
      options: [
        { value: 'info', label: 'Info' },
        { value: 'warning', label: 'Warning' },
        { value: 'critical', label: 'Critical' },
      ],
    },
    { key: 'fecha_desde', label: 'Desde', type: 'date' },
    { key: 'fecha_hasta', label: 'Hasta', type: 'date' },
    {
      key: 'soloNoLeidas',
      label: 'No leídas',
      type: 'checkbox',
      checkboxLabel: 'Solo no leídas',
    },
    {
      key: 'soloNecesitanAccion',
      label: 'Acción',
      type: 'checkbox',
      checkboxLabel: 'Solo las que necesitan acción',
    },
  ], []);

  // Preparar parámetros para el backend
  // soloNoLeidas: true → leida: false (filtrar solo no leídas)
  // soloNoLeidas: false → no enviar leida (mostrar todas)
  const queryParams = useMemo(() => ({
    tipo_alerta: filtros.tipo_alerta,
    nivel: filtros.nivel,
    fecha_desde: filtros.fecha_desde,
    fecha_hasta: filtros.fecha_hasta,
    ...(filtros.soloNoLeidas ? { leida: false } : {}),
    ...(filtros.soloNecesitanAccion ? { solo_necesitan_accion: true } : {}),
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
  }), [filtros, page]);

  // Queries
  const { data: alertasData, isLoading: cargandoAlertas } = useAlertas(queryParams);
  const alertas = alertasData?.alertas || [];
  const total = alertasData?.contadores?.total || alertasData?.total || alertas.length;

  // Calcular paginación
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const pagination = {
    page,
    limit: ITEMS_PER_PAGE,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  // Mutations
  const marcarUnaMutation = useMarcarAlertaLeida();
  const marcarVariasMutation = useMarcarVariasAlertasLeidas();
  const generarOCMutation = useGenerarOCDesdeProducto();

  // Handlers de filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPage(1); // Reset página al cambiar filtros
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      tipo_alerta: '',
      nivel: '',
      soloNoLeidas: false,
      soloNecesitanAccion: false,
      fecha_desde: '',
      fecha_hasta: '',
    });
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
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
    console.log('handleGenerarOC called:', { productoId, productoNombre });
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

  const NIVEL_ALERTA_VARIANT = {
    info: 'info',
    warning: 'warning',
    critical: 'error',
  };

  const getNivelBorderColor = (nivel) => {
    const colors = {
      info: 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20',
      warning: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
      critical: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
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
    <InventarioPageLayout
      icon={AlertTriangle}
      title="Alertas de Inventario"
      subtitle={`${total} alerta${total !== 1 ? 's' : ''} registrada${total !== 1 ? 's' : ''}`}
      actions={
        alertasSeleccionadas.length > 0 && (
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
        )
      }
    >
      <div className="space-y-6">

        {/* Filtros */}
        <FilterPanel
          filters={filtros}
          onFilterChange={handleFiltroChange}
          onClearFilters={handleLimpiarFiltros}
          filterConfig={filterConfig}
          showSearch={false}
          defaultExpanded={false}
          className="mb-6"
        />

        {/* Lista de Alertas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {cargandoAlertas ? (
            <SkeletonTable rows={5} columns={5} />
          ) : alertas.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={AlertCircle}
                title="No hay alertas"
                description="No se encontraron alertas con los filtros aplicados"
              />
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
                      className={`flex items-start p-4 rounded-lg border-2 ${getNivelBorderColor(
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
                              <Badge variant={NIVEL_ALERTA_VARIANT[alerta.nivel] || 'info'} size="sm">
                                {getTipoAlertaLabel(alerta.tipo_alerta)}
                              </Badge>
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
                              {alerta.nombre_producto}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{alerta.mensaje}</p>

                            {/* Info de Stock Proyectado (solo alertas de stock) */}
                            {esAlertaStock(alerta.tipo_alerta) && (
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Stock: <span className="font-semibold">{alerta.stock_actual}</span> / Mín: <span className="font-semibold">{alerta.stock_minimo}</span>
                                </span>
                                {alerta.oc_pendientes > 0 && (
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    <TrendingUp className="inline h-3 w-3 mr-1" />
                                    En camino: <span className="font-semibold">+{alerta.oc_pendientes}</span>
                                  </span>
                                )}
                                {alerta.stock_proyectado !== undefined && (
                                  <span className="text-primary-600 dark:text-primary-400 font-medium">
                                    Stock proyectado: {alerta.stock_proyectado}
                                  </span>
                                )}
                                {/* Badge OC Pendiente */}
                                {alerta.tiene_oc_pendiente && (
                                  <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-full">
                                    <Package className="h-3 w-3 mr-1" />
                                    OC: {alerta.oc_pendiente_folio}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Botones de acciones */}
                          <div className="flex items-center space-x-2">
                            {/* Botón Generar OC (solo para alertas de stock SIN OC pendiente) */}
                            {esAlertaStock(alerta.tipo_alerta) && !alerta.tiene_oc_pendiente && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleGenerarOC(alerta.producto_id, alerta.nombre_producto)}
                                icon={ShoppingCart}
                                isLoading={generarOCMutation.isPending}
                                title="Generar Orden de Compra"
                              >
                                Generar OC
                              </Button>
                            )}
                            {/* Mensaje de OC existente */}
                            {esAlertaStock(alerta.tipo_alerta) && alerta.tiene_oc_pendiente && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 italic">
                                Ya existe OC pendiente
                              </span>
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

        {/* Paginación */}
        {!cargandoAlertas && total > 0 && (
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            showInfo={true}
            size="md"
          />
        )}
      </div>
    </InventarioPageLayout>
  );
}

export default AlertasPage;
