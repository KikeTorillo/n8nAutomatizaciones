import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileSpreadsheet,
    Plus,
    Eye,
    CheckCircle,
    XCircle,
    Filter,
    Search,
    Calendar,
    ChevronDown,
    ChevronUp,
    Download,
    Play,
    AlertTriangle,
    FileCheck,
} from 'lucide-react';
import {
  Alert,
  Button,
  ConfirmDialog,
  DataTable,
  DataTableActions,
  DataTableActionButton,
  Pagination,
  StatCardGrid
} from '@/components/ui';
import { useModalManager } from '@/hooks/utils';
import { useToast } from '@/hooks/utils';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
    useAjustesMasivos,
    useValidarAjusteMasivo,
    useAplicarAjusteMasivo,
    useCancelarAjusteMasivo,
    useDescargarPlantillaAjustes,
    ESTADOS_AJUSTE_MASIVO,
    ESTADOS_AJUSTE_MASIVO_CONFIG,
} from '@/hooks/inventario';
import AjusteMasivoModal from '@/components/inventario/ajustes-masivos/AjusteMasivoModal';

// Formatear fecha
const formatFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Formatear moneda
const formatMoneda = (valor) => {
  if (valor === null || valor === undefined) return '$0.00';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(valor);
};

// Columnas para DataTable
const COLUMNS = [
  {
    key: 'folio',
    header: 'Folio',
    render: (row) => (
      <span className="font-mono text-sm font-medium text-primary-600 dark:text-primary-400">
        {row.folio}
      </span>
    ),
  },
  {
    key: 'archivo',
    header: 'Archivo',
    hideOnMobile: true,
    render: (row) => (
      <span className="text-sm text-gray-900 dark:text-white truncate max-w-[200px] block">
        {row.archivo_nombre}
      </span>
    ),
  },
  {
    key: 'estado',
    header: 'Estado',
    render: (row) => {
      const config = ESTADOS_AJUSTE_MASIVO_CONFIG[row.estado] || ESTADOS_AJUSTE_MASIVO_CONFIG.pendiente;
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badgeClass}`}>
          {config.label}
        </span>
      );
    },
  },
  {
    key: 'items',
    header: 'Items',
    render: (row) => (
      <div className="text-sm text-gray-900 dark:text-white">
        <span className="text-green-600 dark:text-green-400">{row.filas_validas || 0}</span>
        <span className="text-gray-400 mx-1">/</span>
        <span>{row.total_filas || 0}</span>
        {row.filas_error > 0 && (
          <span className="text-red-600 dark:text-red-400 ml-2">
            ({row.filas_error} err)
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'valor',
    header: 'Valor',
    hideOnMobile: true,
    render: (row) => (
      <span className="text-sm text-gray-900 dark:text-white">
        {formatMoneda(row.valor_total_ajuste)}
      </span>
    ),
  },
  {
    key: 'fecha',
    header: 'Fecha',
    hideOnMobile: true,
    render: (row) => (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {formatFecha(row.creado_en)}
      </span>
    ),
  },
];

/**
 * Acciones por fila de ajuste masivo
 */
function AjusteRowActions({ row, onVerDetalle, onValidar, onAplicar, onCancelar }) {
  return (
    <DataTableActions>
      <DataTableActionButton
        icon={Eye}
        label="Ver detalle"
        onClick={() => onVerDetalle(row.id)}
        variant="primary"
      />
      {row.estado === 'pendiente' && (
        <>
          <DataTableActionButton
            icon={FileCheck}
            label="Validar"
            onClick={() => onValidar(row)}
            variant="ghost"
          />
          <DataTableActionButton
            icon={XCircle}
            label="Cancelar"
            onClick={() => onCancelar(row)}
            variant="danger"
          />
        </>
      )}
      {row.estado === 'validado' && (
        <>
          <DataTableActionButton
            icon={Play}
            label="Aplicar"
            onClick={() => onAplicar(row)}
            variant="ghost"
          />
          <DataTableActionButton
            icon={XCircle}
            label="Cancelar"
            onClick={() => onCancelar(row)}
            variant="danger"
          />
        </>
      )}
    </DataTableActions>
  );
}

/**
 * Pagina principal de Ajustes Masivos de Inventario
 * Gestion de ajustes via CSV
 */
export default function AjustesMasivosPage() {
    const navigate = useNavigate();
    const { success: showSuccess, error: showError, warning: showWarning } = useToast();

    // Estado de filtros
    const [filtros, setFiltros] = useState({
        estado: '',
        fecha_desde: '',
        fecha_hasta: '',
        folio: '',
        limit: 50,
        offset: 0,
    });

    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    // Modal manager
    const { isOpen, getModalData, openModal, closeModal } = useModalManager();

    // Queries
    const { data: ajustesData, isLoading } = useAjustesMasivos(filtros);
    const ajustes = ajustesData?.ajustes || [];
    const totales = ajustesData?.totales || {};
    const total = parseInt(totales.cantidad) || 0;

    // Mutations
    const validarMutation = useValidarAjusteMasivo();
    const aplicarMutation = useAplicarAjusteMasivo();
    const cancelarMutation = useCancelarAjusteMasivo();
    const descargarPlantillaMutation = useDescargarPlantillaAjustes();

    // Handlers de filtros
    const handleFiltroChange = (campo, valor) => {
        setFiltros((prev) => ({ ...prev, [campo]: valor, offset: 0 }));
    };

    const handleLimpiarFiltros = () => {
        setFiltros({
            estado: '',
            fecha_desde: '',
            fecha_hasta: '',
            folio: '',
            limit: 50,
            offset: 0,
        });
    };

    // Handlers de acciones
    const handleNuevoAjuste = () => {
        openModal('nuevo');
    };

    const handleAjusteCreado = (ajuste) => {
        showSuccess(`Ajuste ${ajuste.folio} creado correctamente`);
        closeModal('nuevo');
    };

    const handleDescargarPlantilla = () => {
        descargarPlantillaMutation.mutate(undefined, {
            onSuccess: () => {
                showSuccess('Plantilla descargada');
            },
            onError: (error) => {
                showError(error.message || 'Error al descargar plantilla');
            },
        });
    };

    const handleVerDetalle = (ajusteId) => {
        navigate(`/inventario/ajustes-masivos/${ajusteId}`);
    };

    const handleAbrirModalValidar = (ajuste) => {
        if (ajuste.estado !== 'pendiente') {
            showWarning('Solo se pueden validar ajustes en estado pendiente');
            return;
        }
        openModal('validar', { ajuste });
    };

    const handleValidar = () => {
        const ajuste = getModalData('validar')?.ajuste;
        validarMutation.mutate(ajuste.id, {
            onSuccess: (result) => {
                const msg = result.filas_validas > 0
                    ? `Validado: ${result.filas_validas} items validos, ${result.filas_error} con errores`
                    : 'Todos los items tienen errores';
                showSuccess(msg);
                closeModal('validar');
            },
            onError: (error) => {
                showError(error.message || 'Error al validar ajuste');
            },
        });
    };

    const handleAbrirModalAplicar = (ajuste) => {
        if (ajuste.estado !== 'validado') {
            showWarning('Solo se pueden aplicar ajustes validados');
            return;
        }
        openModal('aplicar', { ajuste });
    };

    const handleAplicar = () => {
        const ajuste = getModalData('aplicar')?.ajuste;
        aplicarMutation.mutate(ajuste.id, {
            onSuccess: (result) => {
                const msg = result.errores?.length > 0
                    ? `Aplicados ${result.aplicados?.length || 0} items, ${result.errores.length} con errores`
                    : `${result.aplicados?.length || 0} ajustes aplicados correctamente`;
                showSuccess(msg);
                closeModal('aplicar');
            },
            onError: (error) => {
                showError(error.message || 'Error al aplicar ajustes');
            },
        });
    };

    const handleAbrirModalCancelar = (ajuste) => {
        if (!['pendiente', 'validado'].includes(ajuste.estado)) {
            showWarning('Este ajuste no puede ser cancelado');
            return;
        }
        openModal('cancelar', { ajuste });
    };

    const handleCancelar = () => {
        const ajuste = getModalData('cancelar')?.ajuste;
        cancelarMutation.mutate(ajuste.id, {
            onSuccess: () => {
                showSuccess('Ajuste cancelado correctamente');
                closeModal('cancelar');
            },
            onError: (error) => {
                showError(error.message || 'Error al cancelar ajuste');
            },
        });
    };

    return (
        <InventarioPageLayout
            icon={FileSpreadsheet}
            title="Ajustes Masivos"
            subtitle={`${total} ajuste${total !== 1 ? 's' : ''} en total`}
            actions={
                <>
                    <Button
                        variant="secondary"
                        onClick={handleDescargarPlantilla}
                        icon={Download}
                        loading={descargarPlantillaMutation.isPending}
                        className="flex-1 sm:flex-none text-sm"
                    >
                        <span className="hidden sm:inline">Plantilla</span>
                        <span className="sm:hidden">CSV</span>
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleNuevoAjuste}
                        icon={Plus}
                        className="flex-1 sm:flex-none text-sm"
                    >
                        <span className="hidden sm:inline">Nuevo Ajuste</span>
                        <span className="sm:hidden">Nuevo</span>
                    </Button>
                </>
            }
        >

                {/* Panel de Filtros */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Barra de búsqueda */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por folio..."
                                value={filtros.folio}
                                onChange={(e) => handleFiltroChange('folio', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                            />
                        </div>

                        {/* Botón Filtros */}
                        <button
                            type="button"
                            onClick={() => setMostrarFiltros(!mostrarFiltros)}
                            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-[40px] ${
                                mostrarFiltros
                                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            } hover:bg-gray-200 dark:hover:bg-gray-600`}
                            aria-expanded={mostrarFiltros}
                        >
                            <Filter className="h-4 w-4" />
                            <span>Filtros</span>
                            {mostrarFiltros ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    {/* Filtros expandidos */}
                    {mostrarFiltros && (
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Estado */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Estado
                                    </label>
                                    <select
                                        value={filtros.estado}
                                        onChange={(e) => handleFiltroChange('estado', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="">Todos los estados</option>
                                        <option value="pendiente">Pendiente</option>
                                        <option value="validado">Validado</option>
                                        <option value="aplicado">Aplicado</option>
                                        <option value="con_errores">Con Errores</option>
                                    </select>
                                </div>

                                {/* Fecha desde */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Fecha desde
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="date"
                                            value={filtros.fecha_desde}
                                            onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Fecha hasta */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Fecha hasta
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="date"
                                            value={filtros.fecha_hasta}
                                            onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    type="button"
                                    onClick={handleLimpiarFiltros}
                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Estadísticas rápidas */}
                <StatCardGrid
                    className="mb-6"
                    stats={[
                        { icon: FileSpreadsheet, label: 'Total', value: total, color: 'blue' },
                        { icon: FileCheck, label: 'Pendientes', value: parseInt(totales.pendientes) || 0 },
                        { icon: CheckCircle, label: 'Aplicados', value: parseInt(totales.aplicados) || 0, color: 'green' },
                        { icon: AlertTriangle, label: 'Con Errores', value: parseInt(totales.con_errores) || 0, color: 'yellow' },
                    ]}
                />

                {/* Tabla de ajustes */}
                <DataTable
                    columns={[
                        ...COLUMNS,
                        {
                            key: 'actions',
                            header: '',
                            align: 'right',
                            render: (row) => (
                                <AjusteRowActions
                                    row={row}
                                    onVerDetalle={handleVerDetalle}
                                    onValidar={handleAbrirModalValidar}
                                    onAplicar={handleAbrirModalAplicar}
                                    onCancelar={handleAbrirModalCancelar}
                                />
                            ),
                        },
                    ]}
                    data={ajustes}
                    isLoading={isLoading}
                    onRowClick={(ajuste) => handleVerDetalle(ajuste.id)}
                    emptyState={{
                        icon: FileSpreadsheet,
                        title: 'No hay ajustes masivos',
                        description: 'Importa tu primer archivo CSV para ajustar inventario',
                        actionLabel: 'Crear primer ajuste',
                        onAction: handleNuevoAjuste,
                    }}
                    skeletonRows={5}
                />

                {/* Paginacion */}
                {ajustes.length > 0 && total > filtros.limit && (
                    <div className="mt-4">
                        <Pagination
                            pagination={{
                                page: Math.floor(filtros.offset / filtros.limit) + 1,
                                limit: filtros.limit,
                                total,
                                totalPages: Math.ceil(total / filtros.limit),
                                hasNext: filtros.offset + filtros.limit < total,
                                hasPrev: filtros.offset > 0,
                            }}
                            onPageChange={(page) =>
                                setFiltros((prev) => ({
                                    ...prev,
                                    offset: (page - 1) * prev.limit,
                                }))
                            }
                        />
                    </div>
                )}

            {/* Modal nuevo ajuste */}
            {isOpen('nuevo') && (
                <AjusteMasivoModal
                    isOpen={isOpen('nuevo')}
                    onClose={() => closeModal('nuevo')}
                    onSuccess={handleAjusteCreado}
                />
            )}

            {/* Modal confirmar validar */}
            <ConfirmDialog
                isOpen={isOpen('validar')}
                onClose={() => closeModal('validar')}
                onConfirm={handleValidar}
                title="Validar Ajuste Masivo"
                message={`¿Deseas validar el ajuste ${getModalData('validar')?.ajuste?.folio}? Se verificará que los SKUs/códigos de barras existan y se calculará el stock resultante.`}
                confirmText="Validar"
                variant="info"
                isLoading={validarMutation.isPending}
            />

            {/* Modal confirmar aplicar */}
            <ConfirmDialog
                isOpen={isOpen('aplicar')}
                onClose={() => closeModal('aplicar')}
                onConfirm={handleAplicar}
                title="Aplicar Ajustes de Inventario"
                message={`¿Deseas aplicar los ajustes del folio ${getModalData('aplicar')?.ajuste?.folio}?`}
                confirmText="Aplicar Ajustes"
                variant="warning"
                isLoading={aplicarMutation.isPending}
                size="md"
            >
                <Alert variant="warning" icon={AlertTriangle} title="Esta acción no se puede deshacer">
                    <p className="text-sm">Se crearán movimientos de inventario para cada item válido.</p>
                </Alert>
            </ConfirmDialog>

            {/* Modal confirmar cancelar */}
            <ConfirmDialog
                isOpen={isOpen('cancelar')}
                onClose={() => closeModal('cancelar')}
                onConfirm={handleCancelar}
                title="Cancelar Ajuste Masivo"
                message={`¿Deseas cancelar el ajuste ${getModalData('cancelar')?.ajuste?.folio}? Esta acción eliminará el ajuste y todos sus items.`}
                confirmText="Cancelar Ajuste"
                variant="danger"
                isLoading={cancelarMutation.isPending}
            />
        </InventarioPageLayout>
    );
}
