import { useState } from 'react';
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
    Filter,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import {
    useAjusteMasivo,
    useValidarAjusteMasivo,
    useAplicarAjusteMasivo,
    useCancelarAjusteMasivo,
    ESTADOS_AJUSTE_MASIVO,
    ESTADOS_AJUSTE_MASIVO_CONFIG,
    ESTADOS_ITEM_AJUSTE_CONFIG,
} from '@/hooks/useAjustesMasivos';

/**
 * Pagina de detalle de un ajuste masivo
 */
export default function AjusteMasivoDetallePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success: showSuccess, error: showError, warning: showWarning } = useToast();

    // Filtro de items
    const [filtroEstado, setFiltroEstado] = useState('todos');

    // Modales
    const [modalValidar, setModalValidar] = useState(false);
    const [modalAplicar, setModalAplicar] = useState(false);
    const [modalCancelar, setModalCancelar] = useState(false);

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
                showSuccess(`Validado: ${result.filas_validas} items validos`);
                setModalValidar(false);
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
                setModalAplicar(false);
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
                setModalCancelar(false);
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

    // Renderizar estado
    const renderEstado = (estado) => {
        const config = ESTADOS_AJUSTE_MASIVO_CONFIG[estado] || ESTADOS_AJUSTE_MASIVO_CONFIG.pendiente;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badgeClass}`}>
                {config.label}
            </span>
        );
    };

    const renderEstadoItem = (estado) => {
        const config = ESTADOS_ITEM_AJUSTE_CONFIG[estado] || ESTADOS_ITEM_AJUSTE_CONFIG.pendiente;
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.badgeClass}`}>
                {config.label}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 dark:text-gray-400">Cargando ajuste...</p>
                </div>
            </div>
        );
    }

    if (error || !ajuste) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Ajuste no encontrado
                    </h2>
                    <Button onClick={() => navigate('/inventario/ajustes-masivos')}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Volver
                    </Button>
                </div>
            </div>
        );
    }

    const puedeValidar = ajuste.estado === 'pendiente';
    const puedeAplicar = ajuste.estado === 'validado';
    const puedeCancelar = ['pendiente', 'validado'].includes(ajuste.estado);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/inventario/ajustes-masivos')}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <FileSpreadsheet className="h-7 w-7 text-primary-600" />
                                        {ajuste.folio}
                                    </h1>
                                    {renderEstado(ajuste.estado)}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {ajuste.archivo_nombre}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {puedeValidar && (
                                <Button onClick={() => setModalValidar(true)}>
                                    <FileCheck className="h-4 w-4 mr-1" />
                                    Validar
                                </Button>
                            )}
                            {puedeAplicar && (
                                <Button onClick={() => setModalAplicar(true)}>
                                    <Play className="h-4 w-4 mr-1" />
                                    Aplicar
                                </Button>
                            )}
                            {puedeCancelar && (
                                <Button variant="outline" onClick={() => setModalCancelar(true)}>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancelar
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Info del ajuste */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Creado por</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {ajuste.usuario_nombre || 'Usuario'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                                <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Fecha</p>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                    {formatFecha(ajuste.creado_en)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Items Validos</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {ajuste.filas_validas || 0} / {ajuste.total_filas || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Con Errores</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {ajuste.filas_error || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtros de items */}
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <div className="flex gap-2">
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
                </div>

                {/* Tabla de items */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {itemsFiltrados.length === 0 ? (
                        <div className="p-8 text-center">
                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No hay items con este filtro
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            #
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            SKU / Codigo
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Producto
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Cantidad
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Stock Antes
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Stock Despues
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Motivo
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {itemsFiltrados.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                {item.fila_numero}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-sm text-gray-900 dark:text-white">
                                                    {item.sku_csv || item.codigo_barras_csv || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-900 dark:text-white">
                                                    {item.producto_nombre || '-'}
                                                </span>
                                                {item.variante_id && (
                                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                                        (Variante)
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-medium ${
                                                item.cantidad_ajuste > 0
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {item.cantidad_ajuste > 0 ? '+' : ''}
                                                {item.cantidad_ajuste}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                                                {item.stock_antes ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white font-medium">
                                                {item.stock_despues ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[150px] truncate">
                                                {item.motivo_csv || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {renderEstadoItem(item.estado)}
                                                {item.error_mensaje && (
                                                    <p className="text-xs text-red-500 mt-1 truncate max-w-[150px]" title={item.error_mensaje}>
                                                        {item.error_mensaje}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Validar */}
            <Modal
                isOpen={modalValidar}
                onClose={() => setModalValidar(false)}
                title="Validar Ajuste Masivo"
            >
                <div className="p-4">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        ¿Deseas validar el ajuste <strong>{ajuste.folio}</strong>?
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Se verificara que los SKUs/codigos existan y se calculara el stock resultante.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setModalValidar(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleValidar} isLoading={validarMutation.isPending}>
                            <FileCheck className="h-4 w-4 mr-1" />
                            Validar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Aplicar */}
            <Modal
                isOpen={modalAplicar}
                onClose={() => setModalAplicar(false)}
                title="Aplicar Ajustes"
            >
                <div className="p-4">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        ¿Deseas aplicar los ajustes de <strong>{ajuste.folio}</strong>?
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">
                                <p className="font-medium">Esta accion no se puede deshacer</p>
                                <p>Se crearan {ajuste.filas_validas || 0} movimientos de inventario.</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setModalAplicar(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAplicar} isLoading={aplicarMutation.isPending}>
                            <Play className="h-4 w-4 mr-1" />
                            Aplicar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Cancelar */}
            <Modal
                isOpen={modalCancelar}
                onClose={() => setModalCancelar(false)}
                title="Cancelar Ajuste"
            >
                <div className="p-4">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        ¿Deseas cancelar el ajuste <strong>{ajuste.folio}</strong>?
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Esta accion eliminara el ajuste y todos sus items.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setModalCancelar(false)}>
                            Volver
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleCancelar}
                            isLoading={cancelarMutation.isPending}
                        >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancelar Ajuste
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
