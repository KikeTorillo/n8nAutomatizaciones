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
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCardGrid } from '@/components/ui/StatCardGrid';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import Pagination from '@/components/ui/Pagination';
import { useModalManager } from '@/hooks/useModalManager';
import { useToast } from '@/hooks/useToast';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
    useAjustesMasivos,
    useValidarAjusteMasivo,
    useAplicarAjusteMasivo,
    useCancelarAjusteMasivo,
    useDescargarPlantillaAjustes,
    ESTADOS_AJUSTE_MASIVO,
    ESTADOS_AJUSTE_MASIVO_CONFIG,
} from '@/hooks/useAjustesMasivos';
import AjusteMasivoModal from '@/components/inventario/ajustes-masivos/AjusteMasivoModal';

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

    // Renderizar estado
    const renderEstado = (estado) => {
        const config = ESTADOS_AJUSTE_MASIVO_CONFIG[estado] || ESTADOS_AJUSTE_MASIVO_CONFIG.pendiente;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badgeClass}`}>
                {config.label}
            </span>
        );
    };

    // Acciones disponibles por estado
    const getAcciones = (ajuste) => {
        const acciones = [];

        // Ver siempre disponible
        acciones.push({
            icon: Eye,
            label: 'Ver detalle',
            onClick: () => handleVerDetalle(ajuste.id),
            className: 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
        });

        switch (ajuste.estado) {
            case 'pendiente':
                acciones.push({
                    icon: FileCheck,
                    label: 'Validar',
                    onClick: () => handleAbrirModalValidar(ajuste),
                    className: 'text-blue-600 hover:text-blue-800',
                });
                acciones.push({
                    icon: XCircle,
                    label: 'Cancelar',
                    onClick: () => handleAbrirModalCancelar(ajuste),
                    className: 'text-red-600 hover:text-red-800',
                });
                break;

            case 'validado':
                acciones.push({
                    icon: Play,
                    label: 'Aplicar',
                    onClick: () => handleAbrirModalAplicar(ajuste),
                    className: 'text-green-600 hover:text-green-800',
                });
                acciones.push({
                    icon: XCircle,
                    label: 'Cancelar',
                    onClick: () => handleAbrirModalCancelar(ajuste),
                    className: 'text-red-600 hover:text-red-800',
                });
                break;
        }

        return acciones;
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
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {isLoading ? (
                        <SkeletonTable rows={5} columns={7} />
                    ) : ajustes.length === 0 ? (
                        <EmptyState
                            icon={FileSpreadsheet}
                            title="No hay ajustes masivos"
                            description="Importa tu primer archivo CSV para ajustar inventario"
                            action={
                                <Button onClick={handleNuevoAjuste}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Crear primer ajuste
                                </Button>
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Folio
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Archivo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Valor
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {ajustes.map((ajuste) => (
                                        <tr
                                            key={ajuste.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                            onClick={() => handleVerDetalle(ajuste.id)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm font-medium text-primary-600 dark:text-primary-400">
                                                    {ajuste.folio}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 dark:text-white truncate max-w-[200px] block">
                                                    {ajuste.archivo_nombre}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {renderEstado(ajuste.estado)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    <span className="text-green-600 dark:text-green-400">{ajuste.filas_validas || 0}</span>
                                                    <span className="text-gray-400 mx-1">/</span>
                                                    <span>{ajuste.total_filas || 0}</span>
                                                    {ajuste.filas_error > 0 && (
                                                        <span className="text-red-600 dark:text-red-400 ml-2">
                                                            ({ajuste.filas_error} err)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {formatMoneda(ajuste.valor_total_ajuste)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {formatFecha(ajuste.creado_en)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div
                                                    className="flex items-center justify-end gap-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {getAcciones(ajuste).map((accion, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={accion.onClick}
                                                            className={`p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center ${accion.className}`}
                                                            title={accion.label}
                                                            aria-label={accion.label}
                                                        >
                                                            <accion.icon className="h-5 w-5" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

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
            {isOpen('validar') && (
                <Modal
                    isOpen={isOpen('validar')}
                    onClose={() => closeModal('validar')}
                    title="Validar Ajuste Masivo"
                >
                    <div className="p-4">
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            ¿Deseas validar el ajuste <strong>{getModalData('validar')?.ajuste?.folio}</strong>?
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Se verificara que los SKUs/codigos de barras existan y se calculara el stock resultante.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => closeModal('validar')}>
                                Cancelar
                            </Button>
                            <Button onClick={handleValidar} isLoading={validarMutation.isPending}>
                                <FileCheck className="h-4 w-4 mr-1" />
                                Validar
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal confirmar aplicar */}
            {isOpen('aplicar') && (
                <Modal
                    isOpen={isOpen('aplicar')}
                    onClose={() => closeModal('aplicar')}
                    title="Aplicar Ajustes de Inventario"
                >
                    <div className="p-4">
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            ¿Deseas aplicar los ajustes del folio <strong>{getModalData('aplicar')?.ajuste?.folio}</strong>?
                        </p>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                                    <p className="font-medium">Esta accion no se puede deshacer</p>
                                    <p>Se crearan movimientos de inventario para cada item valido.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => closeModal('aplicar')}>
                                Cancelar
                            </Button>
                            <Button onClick={handleAplicar} isLoading={aplicarMutation.isPending}>
                                <Play className="h-4 w-4 mr-1" />
                                Aplicar Ajustes
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal confirmar cancelar */}
            {isOpen('cancelar') && (
                <Modal
                    isOpen={isOpen('cancelar')}
                    onClose={() => closeModal('cancelar')}
                    title="Cancelar Ajuste Masivo"
                >
                    <div className="p-4">
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            ¿Deseas cancelar el ajuste <strong>{getModalData('cancelar')?.ajuste?.folio}</strong>?
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Esta accion eliminara el ajuste y todos sus items.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => closeModal('cancelar')}>
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
            )}
        </InventarioPageLayout>
    );
}
