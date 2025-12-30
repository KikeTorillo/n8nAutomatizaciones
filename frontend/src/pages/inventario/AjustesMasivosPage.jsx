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
import BackButton from '@/components/ui/BackButton';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import InventarioNavTabs from '@/components/inventario/InventarioNavTabs';
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

    // Estado de modales
    const [modalNuevo, setModalNuevo] = useState(false);
    const [modalValidar, setModalValidar] = useState({ isOpen: false, ajuste: null });
    const [modalAplicar, setModalAplicar] = useState({ isOpen: false, ajuste: null });
    const [modalCancelar, setModalCancelar] = useState({ isOpen: false, ajuste: null });

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
        setModalNuevo(true);
    };

    const handleAjusteCreado = (ajuste) => {
        showSuccess(`Ajuste ${ajuste.folio} creado correctamente`);
        setModalNuevo(false);
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
        setModalValidar({ isOpen: true, ajuste });
    };

    const handleValidar = () => {
        validarMutation.mutate(modalValidar.ajuste.id, {
            onSuccess: (result) => {
                const msg = result.filas_validas > 0
                    ? `Validado: ${result.filas_validas} items validos, ${result.filas_error} con errores`
                    : 'Todos los items tienen errores';
                showSuccess(msg);
                setModalValidar({ isOpen: false, ajuste: null });
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
        setModalAplicar({ isOpen: true, ajuste });
    };

    const handleAplicar = () => {
        aplicarMutation.mutate(modalAplicar.ajuste.id, {
            onSuccess: (result) => {
                const msg = result.errores?.length > 0
                    ? `Aplicados ${result.aplicados?.length || 0} items, ${result.errores.length} con errores`
                    : `${result.aplicados?.length || 0} ajustes aplicados correctamente`;
                showSuccess(msg);
                setModalAplicar({ isOpen: false, ajuste: null });
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
        setModalCancelar({ isOpen: true, ajuste });
    };

    const handleCancelar = () => {
        cancelarMutation.mutate(modalCancelar.ajuste.id, {
            onSuccess: () => {
                showSuccess('Ajuste cancelado correctamente');
                setModalCancelar({ isOpen: false, ajuste: null });
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <BackButton to="/inventario" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileSpreadsheet className="h-7 w-7 text-primary-600" />
                                    Ajustes Masivos
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Importacion masiva de ajustes via CSV
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDescargarPlantilla}
                                isLoading={descargarPlantillaMutation.isPending}
                            >
                                <Download className="h-4 w-4 mr-1" />
                                Plantilla
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                            >
                                <Filter className="h-4 w-4 mr-1" />
                                Filtros
                                {mostrarFiltros ? (
                                    <ChevronUp className="h-4 w-4 ml-1" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 ml-1" />
                                )}
                            </Button>

                            <Button onClick={handleNuevoAjuste}>
                                <Plus className="h-4 w-4 mr-1" />
                                Nuevo Ajuste
                            </Button>
                        </div>
                    </div>

                    <InventarioNavTabs activeTab="ajustes-masivos" className="mt-4" />
                </div>
            </div>

            {/* Filtros */}
            {mostrarFiltros && (
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Busqueda por folio */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por folio..."
                                    value={filtros.folio}
                                    onChange={(e) => handleFiltroChange('folio', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Estado */}
                            <select
                                value={filtros.estado}
                                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">Todos los estados</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="validado">Validado</option>
                                <option value="aplicado">Aplicado</option>
                                <option value="con_errores">Con Errores</option>
                            </select>

                            {/* Fecha desde */}
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={filtros.fecha_desde}
                                    onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Fecha hasta */}
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={filtros.fecha_hasta}
                                    onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button variant="ghost" size="sm" onClick={handleLimpiarFiltros}>
                                Limpiar filtros
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Estadisticas rapidas */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                                <FileCheck className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {parseInt(totales.pendientes) || 0}
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
                                <p className="text-sm text-gray-500 dark:text-gray-400">Aplicados</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {parseInt(totales.aplicados) || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Con Errores</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {parseInt(totales.con_errores) || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabla de ajustes */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            Cargando ajustes...
                        </div>
                    ) : ajustes.length === 0 ? (
                        <div className="p-8 text-center">
                            <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No hay ajustes masivos
                            </p>
                            <Button onClick={handleNuevoAjuste} className="mt-4">
                                <Plus className="h-4 w-4 mr-1" />
                                Crear primer ajuste
                            </Button>
                        </div>
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
                                                            className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${accion.className}`}
                                                            title={accion.label}
                                                        >
                                                            <accion.icon className="h-4 w-4" />
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
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Mostrando {filtros.offset + 1} - {Math.min(filtros.offset + filtros.limit, total)} de{' '}
                            {total}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={filtros.offset === 0}
                                onClick={() =>
                                    setFiltros((prev) => ({
                                        ...prev,
                                        offset: Math.max(0, prev.offset - prev.limit),
                                    }))
                                }
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={filtros.offset + filtros.limit >= total}
                                onClick={() =>
                                    setFiltros((prev) => ({
                                        ...prev,
                                        offset: prev.offset + prev.limit,
                                    }))
                                }
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal nuevo ajuste */}
            <AjusteMasivoModal
                isOpen={modalNuevo}
                onClose={() => setModalNuevo(false)}
                onSuccess={handleAjusteCreado}
            />

            {/* Modal confirmar validar */}
            <Modal
                isOpen={modalValidar.isOpen}
                onClose={() => setModalValidar({ isOpen: false, ajuste: null })}
                title="Validar Ajuste Masivo"
            >
                <div className="p-4">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        ¿Deseas validar el ajuste <strong>{modalValidar.ajuste?.folio}</strong>?
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Se verificara que los SKUs/codigos de barras existan y se calculara el stock resultante.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setModalValidar({ isOpen: false, ajuste: null })}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleValidar} isLoading={validarMutation.isPending}>
                            <FileCheck className="h-4 w-4 mr-1" />
                            Validar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal confirmar aplicar */}
            <Modal
                isOpen={modalAplicar.isOpen}
                onClose={() => setModalAplicar({ isOpen: false, ajuste: null })}
                title="Aplicar Ajustes de Inventario"
            >
                <div className="p-4">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        ¿Deseas aplicar los ajustes del folio <strong>{modalAplicar.ajuste?.folio}</strong>?
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
                        <Button
                            variant="outline"
                            onClick={() => setModalAplicar({ isOpen: false, ajuste: null })}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleAplicar} isLoading={aplicarMutation.isPending}>
                            <Play className="h-4 w-4 mr-1" />
                            Aplicar Ajustes
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal confirmar cancelar */}
            <Modal
                isOpen={modalCancelar.isOpen}
                onClose={() => setModalCancelar({ isOpen: false, ajuste: null })}
                title="Cancelar Ajuste Masivo"
            >
                <div className="p-4">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        ¿Deseas cancelar el ajuste <strong>{modalCancelar.ajuste?.folio}</strong>?
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Esta accion eliminara el ajuste y todos sus items.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setModalCancelar({ isOpen: false, ajuste: null })}
                        >
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
