import { useState } from 'react';
import { useModalManager } from '@/hooks/useModalManager';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileSpreadsheet,
    ArrowLeft,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Play,
    FileCheck,
    User,
    Calendar,
    Package,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { StatCardGrid } from '@/components/ui/StatCardGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useToast } from '@/hooks/useToast';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
    useAjusteMasivo,
    useValidarAjusteMasivo,
    useAplicarAjusteMasivo,
    useCancelarAjusteMasivo,
    ESTADOS_AJUSTE_MASIVO_CONFIG,
    ESTADOS_ITEM_AJUSTE_CONFIG,
} from '@/hooks/useAjustesMasivos';

/**
 * Página de detalle de un ajuste masivo
 * Homologada con componentes UI estándar
 */
export default function AjusteMasivoDetallePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success: showSuccess, error: showError } = useToast();

    // Filtro de items
    const [filtroEstado, setFiltroEstado] = useState('todos');

    // Modales centralizados
    const { openModal, closeModal, isOpen } = useModalManager({
        validar: { isOpen: false },
        aplicar: { isOpen: false },
        cancelar: { isOpen: false },
    });

    // Query
    const { data: ajuste, isLoading, error } = useAjusteMasivo(id);

    // Mutations
    const validarMutation = useValidarAjusteMasivo();
    const aplicarMutation = useAplicarAjusteMasivo();
    const cancelarMutation = useCancelarAjusteMasivo();

    // Handlers
    const handleValidar = () => {
        validarMutation.mutate(parseInt(id), {
            onSuccess: (result) => {
                showSuccess(`Validado: ${result.filas_validas} items válidos`);
                closeModal('validar');
            },
            onError: (err) => {
                showError(err.message || 'Error al validar');
            },
        });
    };

    const handleAplicar = () => {
        aplicarMutation.mutate(parseInt(id), {
            onSuccess: (result) => {
                const msg = result.errores?.length > 0
                    ? `Aplicados ${result.aplicados?.length || 0} items, ${result.errores.length} con errores`
                    : `${result.aplicados?.length || 0} ajustes aplicados correctamente`;
                showSuccess(msg);
                closeModal('aplicar');
            },
            onError: (err) => {
                showError(err.message || 'Error al aplicar');
            },
        });
    };

    const handleCancelar = () => {
        cancelarMutation.mutate(parseInt(id), {
            onSuccess: () => {
                showSuccess('Ajuste cancelado');
                closeModal('cancelar');
                navigate('/inventario/ajustes-masivos');
            },
            onError: (err) => {
                showError(err.message || 'Error al cancelar');
            },
        });
    };

    // Formatear fecha
    const formatFecha = (fecha) => {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Filtrar items
    const itemsFiltrados = ajuste?.items?.filter((item) => {
        if (filtroEstado === 'todos') return true;
        return item.estado === filtroEstado;
    }) || [];

    // Mapeo de badges
    const getBadgeVariant = (estado, config) => {
        const info = config[estado];
        if (!info) return 'default';
        const colorMap = {
            'bg-gray-100': 'default',
            'bg-blue-100': 'info',
            'bg-green-100': 'success',
            'bg-yellow-100': 'warning',
            'bg-red-100': 'error',
        };
        const baseColor = info.badgeClass?.split(' ')[0];
        return colorMap[baseColor] || 'default';
    };

    // Estados de carga y error
    if (isLoading) {
        return (
            <InventarioPageLayout
                icon={FileSpreadsheet}
                title="Cargando ajuste..."
                subtitle=""
                actions={
                    <Button variant="outline" onClick={() => navigate('/inventario/ajustes-masivos')}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Volver
                    </Button>
                }
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <SkeletonCard key={i} className="h-20" />
                        ))}
                    </div>
                    <SkeletonTable rows={8} columns={8} />
                </div>
            </InventarioPageLayout>
        );
    }

    if (error || !ajuste) {
        return (
            <InventarioPageLayout
                icon={FileSpreadsheet}
                title="Ajuste no encontrado"
                subtitle=""
                actions={
                    <Button variant="outline" onClick={() => navigate('/inventario/ajustes-masivos')}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Volver
                    </Button>
                }
            >
                <EmptyState
                    icon={XCircle}
                    title="Ajuste no encontrado"
                    description="El ajuste que buscas no existe o fue eliminado"
                    action={
                        <Button onClick={() => navigate('/inventario/ajustes-masivos')}>
                            Ir a Ajustes Masivos
                        </Button>
                    }
                />
            </InventarioPageLayout>
        );
    }

    const puedeValidar = ajuste.estado === 'pendiente';
    const puedeAplicar = ajuste.estado === 'validado';
    const puedeCancelar = ['pendiente', 'validado'].includes(ajuste.estado);

    const estadoConfig = ESTADOS_AJUSTE_MASIVO_CONFIG[ajuste.estado] || ESTADOS_AJUSTE_MASIVO_CONFIG.pendiente;

    return (
        <InventarioPageLayout
            icon={FileSpreadsheet}
            title={
                <div className="flex items-center gap-3">
                    <span>{ajuste.folio}</span>
                    <Badge variant={getBadgeVariant(ajuste.estado, ESTADOS_AJUSTE_MASIVO_CONFIG)} size="sm">
                        {estadoConfig.label}
                    </Badge>
                </div>
            }
            subtitle={ajuste.archivo_nombre}
            actions={
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/inventario/ajustes-masivos')}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Volver</span>
                    </Button>
                    {puedeValidar && (
                        <Button size="sm" onClick={() => openModal('validar')}>
                            <FileCheck className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Validar</span>
                        </Button>
                    )}
                    {puedeAplicar && (
                        <Button size="sm" onClick={() => openModal('aplicar')}>
                            <Play className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Aplicar</span>
                        </Button>
                    )}
                    {puedeCancelar && (
                        <Button variant="outline" size="sm" onClick={() => openModal('cancelar')}>
                            <XCircle className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Cancelar</span>
                        </Button>
                    )}
                </div>
            }
        >
            <div className="space-y-6">
                {/* Estadísticas */}
                <StatCardGrid
                    columns={4}
                    stats={[
                        { icon: User, label: 'Creado por', value: ajuste.usuario_nombre || 'Usuario' },
                        { icon: Calendar, label: 'Fecha', value: formatFecha(ajuste.creado_en), subtext: '' },
                        { icon: CheckCircle, label: 'Items Válidos', value: `${ajuste.filas_validas || 0} / ${ajuste.total_filas || 0}`, color: 'green' },
                        { icon: AlertTriangle, label: 'Con Errores', value: ajuste.filas_error || 0, color: ajuste.filas_error > 0 ? 'red' : undefined },
                    ]}
                />

                {/* Filtros de items */}
                <div className="flex flex-wrap items-center gap-2">
                    {['todos', 'pendiente', 'valido', 'error', 'aplicado'].map((estado) => (
                        <button
                            key={estado}
                            onClick={() => setFiltroEstado(estado)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                filtroEstado === estado
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {estado === 'todos' ? 'Todos' : estado.charAt(0).toUpperCase() + estado.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tabla de items */}
                <DataTable
                    columns={[
                        {
                            key: 'fila',
                            header: '#',
                            width: 'sm',
                            render: (row) => (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {row.fila_numero}
                                </span>
                            ),
                        },
                        {
                            key: 'sku',
                            header: 'SKU / Código',
                            render: (row) => (
                                <span className="font-mono text-sm text-gray-900 dark:text-white">
                                    {row.sku_csv || row.codigo_barras_csv || '-'}
                                </span>
                            ),
                        },
                        {
                            key: 'producto',
                            header: 'Producto',
                            render: (row) => (
                                <div>
                                    <span className="text-sm text-gray-900 dark:text-white">
                                        {row.producto_nombre || '-'}
                                    </span>
                                    {row.variante_id && (
                                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                            (Variante)
                                        </span>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: 'cantidad',
                            header: 'Cantidad',
                            align: 'right',
                            render: (row) => (
                                <span className={`font-medium ${
                                    row.cantidad_ajuste > 0
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                }`}>
                                    {row.cantidad_ajuste > 0 ? '+' : ''}
                                    {row.cantidad_ajuste}
                                </span>
                            ),
                        },
                        {
                            key: 'stock_antes',
                            header: 'Stock Antes',
                            align: 'right',
                            hideOnMobile: true,
                            render: (row) => (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {row.stock_antes ?? '-'}
                                </span>
                            ),
                        },
                        {
                            key: 'stock_despues',
                            header: 'Stock Después',
                            align: 'right',
                            hideOnMobile: true,
                            render: (row) => (
                                <span className="text-sm text-gray-900 dark:text-white font-medium">
                                    {row.stock_despues ?? '-'}
                                </span>
                            ),
                        },
                        {
                            key: 'motivo',
                            header: 'Motivo',
                            hideOnMobile: true,
                            render: (row) => (
                                <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px] block" title={row.motivo_csv}>
                                    {row.motivo_csv || '-'}
                                </span>
                            ),
                        },
                        {
                            key: 'estado',
                            header: 'Estado',
                            render: (row) => {
                                const config = ESTADOS_ITEM_AJUSTE_CONFIG[row.estado] || ESTADOS_ITEM_AJUSTE_CONFIG.pendiente;
                                return (
                                    <div>
                                        <Badge variant={getBadgeVariant(row.estado, ESTADOS_ITEM_AJUSTE_CONFIG)} size="sm">
                                            {config.label}
                                        </Badge>
                                        {row.error_mensaje && (
                                            <p className="text-xs text-red-500 mt-1 truncate max-w-[150px]" title={row.error_mensaje}>
                                                {row.error_mensaje}
                                            </p>
                                        )}
                                    </div>
                                );
                            },
                        },
                    ]}
                    data={itemsFiltrados}
                    isLoading={false}
                    emptyState={{
                        icon: Package,
                        title: 'No hay items con este filtro',
                        description: 'Intenta cambiar el filtro de estado',
                    }}
                    skeletonRows={8}
                />
            </div>

            {/* Modal Validar */}
            <ConfirmDialog
                isOpen={isOpen('validar')}
                onClose={() => closeModal('validar')}
                onConfirm={handleValidar}
                title="Validar Ajuste Masivo"
                message={`¿Deseas validar el ajuste ${ajuste.folio}? Se verificará que los SKUs/códigos existan y se calculará el stock resultante.`}
                confirmText="Validar"
                variant="info"
                isLoading={validarMutation.isPending}
            />

            {/* Modal Aplicar */}
            <ConfirmDialog
                isOpen={isOpen('aplicar')}
                onClose={() => closeModal('aplicar')}
                onConfirm={handleAplicar}
                title="Aplicar Ajustes"
                message={`¿Deseas aplicar los ajustes de ${ajuste.folio}?`}
                confirmText="Aplicar"
                variant="warning"
                isLoading={aplicarMutation.isPending}
                size="md"
            >
                <Alert variant="warning" icon={AlertTriangle} title="Esta acción no se puede deshacer">
                    <p className="text-sm">Se crearán {ajuste.filas_validas || 0} movimientos de inventario.</p>
                </Alert>
            </ConfirmDialog>

            {/* Modal Cancelar */}
            <ConfirmDialog
                isOpen={isOpen('cancelar')}
                onClose={() => closeModal('cancelar')}
                onConfirm={handleCancelar}
                title="Cancelar Ajuste"
                message={`¿Deseas cancelar el ajuste ${ajuste.folio}? Esta acción eliminará el ajuste y todos sus items.`}
                confirmText="Cancelar Ajuste"
                variant="danger"
                isLoading={cancelarMutation.isPending}
            />
        </InventarioPageLayout>
    );
}
