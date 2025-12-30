import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList,
    Plus,
    Eye,
    Play,
    CheckCircle,
    XCircle,
    Filter,
    Search,
    Calendar,
    Building2,
    ChevronDown,
    ChevronUp,
    BarChart3,
    AlertTriangle,
    Package,
    Diff,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { useToast } from '@/hooks/useToast';
import InventarioNavTabs from '@/components/inventario/InventarioNavTabs';
import {
    useConteos,
    useCrearConteo,
    useIniciarConteo,
    useCancelarConteo,
    useEstadisticasConteos,
    ESTADOS_CONTEO,
    TIPOS_CONTEO,
    TIPOS_CONTEO_LABELS,
    ESTADOS_CONTEO_CONFIG,
} from '@/hooks/useConteos';
import ConteoFormModal from '@/components/inventario/conteos/ConteoFormModal';

/**
 * Página principal de Conteos de Inventario
 * Gestión del ciclo completo de conteo físico
 */
export default function ConteosPage() {
    const navigate = useNavigate();
    const { success: showSuccess, error: showError, warning: showWarning } = useToast();

    // Estado de filtros
    const [filtros, setFiltros] = useState({
        estado: '',
        tipo_conteo: '',
        fecha_desde: '',
        fecha_hasta: '',
        folio: '',
        limit: 50,
        offset: 0,
    });

    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    // Estado de modales
    const [modalForm, setModalForm] = useState({ isOpen: false });
    const [modalIniciar, setModalIniciar] = useState({ isOpen: false, conteo: null });
    const [modalCancelar, setModalCancelar] = useState({ isOpen: false, conteo: null });
    const [motivoCancelacion, setMotivoCancelacion] = useState('');

    // Queries
    const { data: conteosData, isLoading } = useConteos(filtros);
    const conteos = conteosData?.conteos || [];
    const totales = conteosData?.totales || {};
    const total = parseInt(totales.cantidad) || 0;

    // Estadísticas (último mes)
    const { data: estadisticas = {} } = useEstadisticasConteos({
        fecha_desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fecha_hasta: new Date().toISOString().split('T')[0],
    });

    // Mutations
    const crearMutation = useCrearConteo();
    const iniciarMutation = useIniciarConteo();
    const cancelarMutation = useCancelarConteo();

    // Handlers de filtros
    const handleFiltroChange = (campo, valor) => {
        setFiltros((prev) => ({ ...prev, [campo]: valor, offset: 0 }));
    };

    const handleLimpiarFiltros = () => {
        setFiltros({
            estado: '',
            tipo_conteo: '',
            fecha_desde: '',
            fecha_hasta: '',
            folio: '',
            limit: 50,
            offset: 0,
        });
    };

    // Handlers de acciones
    const handleNuevoConteo = () => {
        setModalForm({ isOpen: true });
    };

    const handleCrearConteo = (data) => {
        crearMutation.mutate(data, {
            onSuccess: (conteo) => {
                showSuccess(`Conteo ${conteo.folio} creado correctamente`);
                setModalForm({ isOpen: false });
            },
            onError: (error) => {
                showError(error.message || 'Error al crear el conteo');
            },
        });
    };

    const handleVerDetalle = (conteoId) => {
        navigate(`/inventario/conteos/${conteoId}`);
    };

    const handleAbrirModalIniciar = (conteo) => {
        if (conteo.estado !== 'borrador') {
            showWarning('Solo se pueden iniciar conteos en estado borrador');
            return;
        }
        setModalIniciar({ isOpen: true, conteo });
    };

    const handleIniciar = () => {
        iniciarMutation.mutate(modalIniciar.conteo.id, {
            onSuccess: (result) => {
                showSuccess(`Conteo iniciado. ${result.resumen?.total || 0} productos para contar.`);
                setModalIniciar({ isOpen: false, conteo: null });
                // Redirigir a la página de detalle para iniciar el conteo
                navigate(`/inventario/conteos/${modalIniciar.conteo.id}`);
            },
            onError: (error) => {
                showError(error.message || 'Error al iniciar el conteo');
            },
        });
    };

    const handleAbrirModalCancelar = (conteo) => {
        if (!['borrador', 'en_proceso', 'completado'].includes(conteo.estado)) {
            showWarning('Este conteo no puede ser cancelado');
            return;
        }
        setMotivoCancelacion('');
        setModalCancelar({ isOpen: true, conteo });
    };

    const handleCancelar = () => {
        cancelarMutation.mutate(
            { id: modalCancelar.conteo.id, motivo: motivoCancelacion || undefined },
            {
                onSuccess: () => {
                    showSuccess('Conteo cancelado correctamente');
                    setModalCancelar({ isOpen: false, conteo: null });
                    setMotivoCancelacion('');
                },
                onError: (error) => {
                    showError(error.message || 'Error al cancelar el conteo');
                },
            }
        );
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
        const config = ESTADOS_CONTEO_CONFIG[estado] || ESTADOS_CONTEO_CONFIG.borrador;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badgeClass}`}>
                {config.label}
            </span>
        );
    };

    // Acciones disponibles por estado
    const getAcciones = (conteo) => {
        const acciones = [];

        // Ver siempre disponible
        acciones.push({
            icon: Eye,
            label: 'Ver detalle',
            onClick: () => handleVerDetalle(conteo.id),
            className: 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
        });

        switch (conteo.estado) {
            case 'borrador':
                acciones.push({
                    icon: Play,
                    label: 'Iniciar',
                    onClick: () => handleAbrirModalIniciar(conteo),
                    className: 'text-blue-600 hover:text-blue-800',
                });
                acciones.push({
                    icon: XCircle,
                    label: 'Cancelar',
                    onClick: () => handleAbrirModalCancelar(conteo),
                    className: 'text-red-600 hover:text-red-800',
                });
                break;

            case 'en_proceso':
                acciones.push({
                    icon: ClipboardList,
                    label: 'Continuar conteo',
                    onClick: () => handleVerDetalle(conteo.id),
                    className: 'text-blue-600 hover:text-blue-800',
                });
                acciones.push({
                    icon: XCircle,
                    label: 'Cancelar',
                    onClick: () => handleAbrirModalCancelar(conteo),
                    className: 'text-red-600 hover:text-red-800',
                });
                break;

            case 'completado':
                acciones.push({
                    icon: CheckCircle,
                    label: 'Aplicar ajustes',
                    onClick: () => handleVerDetalle(conteo.id),
                    className: 'text-green-600 hover:text-green-800',
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
                                    <ClipboardList className="h-7 w-7 text-primary-600" />
                                    Conteos de Inventario
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Gestión de conteos físicos y ajustes de inventario
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
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

                            <Button onClick={handleNuevoConteo}>
                                <Plus className="h-4 w-4 mr-1" />
                                Nuevo Conteo
                            </Button>
                        </div>
                    </div>

                    <InventarioNavTabs activeTab="conteos" className="mt-4" />
                </div>
            </div>

            {/* Filtros */}
            {mostrarFiltros && (
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {/* Búsqueda por folio */}
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
                                <option value="borrador">Borrador</option>
                                <option value="en_proceso">En Proceso</option>
                                <option value="completado">Completado</option>
                                <option value="ajustado">Ajustado</option>
                                <option value="cancelado">Cancelado</option>
                            </select>

                            {/* Tipo de conteo */}
                            <select
                                value={filtros.tipo_conteo}
                                onChange={(e) => handleFiltroChange('tipo_conteo', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">Todos los tipos</option>
                                {Object.entries(TIPOS_CONTEO_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
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

            {/* Estadísticas rápidas */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                <Play className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">En Proceso</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {parseInt(totales.en_proceso) || 0}
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
                                <p className="text-sm text-gray-500 dark:text-gray-400">Ajustados</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {parseInt(totales.ajustados) || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                <Diff className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Con Diferencias</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {parseInt(estadisticas.conteos_con_diferencias) || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabla de conteos */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            Cargando conteos...
                        </div>
                    ) : conteos.length === 0 ? (
                        <div className="p-8 text-center">
                            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No hay conteos de inventario
                            </p>
                            <Button onClick={handleNuevoConteo} className="mt-4">
                                <Plus className="h-4 w-4 mr-1" />
                                Crear primer conteo
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
                                            Tipo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Progreso
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Diferencias
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
                                    {conteos.map((conteo) => (
                                        <tr
                                            key={conteo.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                            onClick={() => handleVerDetalle(conteo.id)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm font-medium text-primary-600 dark:text-primary-400">
                                                    {conteo.folio}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 dark:text-white">
                                                    {TIPOS_CONTEO_LABELS[conteo.tipo_conteo] || conteo.tipo_conteo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {renderEstado(conteo.estado)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[100px]">
                                                        <div
                                                            className="h-full bg-primary-600 rounded-full"
                                                            style={{
                                                                width: `${conteo.total_productos > 0
                                                                        ? Math.round((conteo.total_contados / conteo.total_productos) * 100)
                                                                        : 0
                                                                    }%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {conteo.total_contados}/{conteo.total_productos}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {conteo.total_con_diferencia > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        {conteo.total_con_diferencia}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {formatFecha(conteo.creado_en)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div
                                                    className="flex items-center justify-end gap-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {getAcciones(conteo).map((accion, idx) => (
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

                {/* Paginación */}
                {conteos.length > 0 && total > filtros.limit && (
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

            {/* Modal crear conteo */}
            <ConteoFormModal
                isOpen={modalForm.isOpen}
                onClose={() => setModalForm({ isOpen: false })}
                onSubmit={handleCrearConteo}
                isLoading={crearMutation.isPending}
            />

            {/* Modal confirmar iniciar */}
            <Modal
                isOpen={modalIniciar.isOpen}
                onClose={() => setModalIniciar({ isOpen: false, conteo: null })}
                title="Iniciar Conteo"
            >
                <div className="p-4">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        ¿Deseas iniciar el conteo <strong>{modalIniciar.conteo?.folio}</strong>?
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Se generarán los productos a contar según los filtros configurados. Una vez iniciado,
                        podrás registrar las cantidades contadas.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setModalIniciar({ isOpen: false, conteo: null })}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleIniciar} isLoading={iniciarMutation.isPending}>
                            <Play className="h-4 w-4 mr-1" />
                            Iniciar Conteo
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal confirmar cancelar */}
            <Modal
                isOpen={modalCancelar.isOpen}
                onClose={() => setModalCancelar({ isOpen: false, conteo: null })}
                title="Cancelar Conteo"
            >
                <div className="p-4">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        ¿Deseas cancelar el conteo <strong>{modalCancelar.conteo?.folio}</strong>?
                    </p>
                    <Textarea
                        label="Motivo de cancelación (opcional)"
                        value={motivoCancelacion}
                        onChange={(e) => setMotivoCancelacion(e.target.value)}
                        placeholder="Ingresa el motivo de la cancelación..."
                        rows={3}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setModalCancelar({ isOpen: false, conteo: null })}
                        >
                            Volver
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleCancelar}
                            isLoading={cancelarMutation.isPending}
                        >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancelar Conteo
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
