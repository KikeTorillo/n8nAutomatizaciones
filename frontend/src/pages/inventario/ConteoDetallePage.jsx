import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ClipboardList,
    ArrowLeft,
    Play,
    CheckCircle,
    XCircle,
    Search,
    Camera,
    Package,
    AlertTriangle,
    Minus,
    Plus,
    RefreshCw,
    Save,
    BarChart3,
    Filter,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { extractProductCode } from '@/utils/gs1Parser';
import { BarcodeScanner, Button, Textarea } from '@/components/ui';
import {
    IniciarConteoModal,
    CompletarConteoModal,
    AplicarAjustesModal,
    CancelarConteoModal,
} from '@/components/inventario/conteos/modales';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';
import {
    useConteo,
    useIniciarConteo,
    useRegistrarConteoItem,
    useCompletarConteo,
    useAplicarAjustesConteo,
    useCancelarConteo,
    useBuscarItemConteo,
    ESTADOS_CONTEO,
    ESTADOS_CONTEO_CONFIG,
    TIPOS_CONTEO_LABELS,
} from '@/hooks/useConteos';

/**
 * Página de detalle de un conteo de inventario
 * Permite ejecutar el conteo: buscar por código de barras, registrar cantidades, aplicar ajustes
 */
export default function ConteoDetallePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success: showSuccess, error: showError, warning: showWarning } = useToast();
    const inputRef = useRef(null);

    // Estado local
    const [codigoBusqueda, setCodigoBusqueda] = useState('');
    const [itemActivo, setItemActivo] = useState(null);
    const [cantidadInput, setCantidadInput] = useState('');
    const [notasInput, setNotasInput] = useState('');
    const [filtroItems, setFiltroItems] = useState('todos'); // todos, pendientes, contados, diferencia
    const [mostrarResumen, setMostrarResumen] = useState(false);
    const [motivoCancelacion, setMotivoCancelacion] = useState('');

    // Modal manager para los 5 modales
    const { openModal, closeModal, isOpen } = useModalManager({
        iniciar: { isOpen: false },
        completar: { isOpen: false },
        aplicarAjustes: { isOpen: false },
        cancelar: { isOpen: false },
        scanner: { isOpen: false },
    });

    // Queries y Mutations
    const { data: conteo, isLoading, refetch } = useConteo(id);
    const iniciarMutation = useIniciarConteo();
    const registrarMutation = useRegistrarConteoItem();
    const completarMutation = useCompletarConteo();
    const aplicarAjustesMutation = useAplicarAjustesConteo();
    const cancelarMutation = useCancelarConteo();
    const buscarItemMutation = useBuscarItemConteo();

    // Focus en input de búsqueda cuando cambia el estado
    useEffect(() => {
        if (conteo?.estado === 'en_proceso' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [conteo?.estado]);

    // Filtrar items
    const itemsFiltrados = conteo?.items?.filter((item) => {
        switch (filtroItems) {
            case 'pendientes':
                return item.estado === 'pendiente';
            case 'contados':
                return item.estado === 'contado';
            case 'diferencia':
                return item.estado === 'contado' && item.diferencia !== 0;
            default:
                return true;
        }
    }) || [];

    // Handlers
    const handleBuscarItem = async (e) => {
        e?.preventDefault();
        if (!codigoBusqueda.trim()) return;

        try {
            // Extraer código de producto si es GS1-128
            const codigo = extractProductCode(codigoBusqueda.trim());

            const item = await buscarItemMutation.mutateAsync({
                conteoId: id,
                codigo,
            });

            setItemActivo(item);
            setCantidadInput(item.cantidad_contada?.toString() || '');
            setNotasInput(item.notas || '');
            setCodigoBusqueda('');
        } catch (error) {
            showWarning(error.message || 'Producto no encontrado');
            setCodigoBusqueda('');
            inputRef.current?.focus();
        }
    };

    const handleSeleccionarItem = (item) => {
        setItemActivo(item);
        setCantidadInput(item.cantidad_contada?.toString() || '');
        setNotasInput(item.notas || '');
    };

    const handleGuardarConteo = async () => {
        if (!itemActivo) return;

        const cantidad = parseInt(cantidadInput);
        if (isNaN(cantidad) || cantidad < 0) {
            showWarning('Ingresa una cantidad válida');
            return;
        }

        try {
            await registrarMutation.mutateAsync({
                itemId: itemActivo.id,
                cantidad_contada: cantidad,
                notas: notasInput || undefined,
            });

            showSuccess('Conteo registrado');
            setItemActivo(null);
            setCantidadInput('');
            setNotasInput('');
            inputRef.current?.focus();
            refetch();
        } catch (error) {
            showError(error.message || 'Error al registrar conteo');
        }
    };

    const handleAjustarCantidad = (delta) => {
        const actual = parseInt(cantidadInput) || 0;
        const nueva = Math.max(0, actual + delta);
        setCantidadInput(nueva.toString());
    };

    const handleIniciar = async () => {
        try {
            await iniciarMutation.mutateAsync(id);
            showSuccess('Conteo iniciado');
            closeModal('iniciar');
            refetch();
        } catch (err) {
            showError(err.message || 'Error al iniciar conteo');
        }
    };

    const handleCompletar = async () => {
        try {
            await completarMutation.mutateAsync(id);
            showSuccess('Conteo completado');
            closeModal('completar');
            refetch();
        } catch (err) {
            showError(err.message || 'Error al completar conteo');
        }
    };

    const handleAplicarAjustes = async () => {
        try {
            const resultado = await aplicarAjustesMutation.mutateAsync(id);
            showSuccess(`Ajustes aplicados. ${resultado.ajustes_realizados?.length || 0} movimientos creados.`);
            closeModal('aplicarAjustes');
            refetch();
        } catch (err) {
            showError(err.message || 'Error al aplicar ajustes');
        }
    };

    const handleCancelar = async () => {
        try {
            await cancelarMutation.mutateAsync({ id, motivo: motivoCancelacion });
            showSuccess('Conteo cancelado');
            closeModal('cancelar');
            navigate('/inventario/conteos');
        } catch (err) {
            showError(err.message || 'Error al cancelar conteo');
        }
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

    // Loading
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Cargando conteo...</p>
                </div>
            </div>
        );
    }

    // No encontrado
    if (!conteo) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Conteo no encontrado</p>
                    <Button onClick={() => navigate('/inventario/conteos')} className="mt-4">
                        Volver a conteos
                    </Button>
                </div>
            </div>
        );
    }

    const esEditable = ['en_proceso'].includes(conteo.estado);
    const puedeIniciar = conteo.estado === 'borrador';
    const puedeCompletar = conteo.estado === 'en_proceso' && conteo.resumen?.pendientes === 0;
    const puedeAplicarAjustes = conteo.estado === 'completado';
    const puedeCancelar = !['ajustado', 'cancelado'].includes(conteo.estado);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/inventario/conteos')}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {conteo.folio}
                                    </h1>
                                    {renderEstado(conteo.estado)}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {TIPOS_CONTEO_LABELS[conteo.tipo_conteo] || conteo.tipo_conteo}
                                    {conteo.sucursal_nombre && ` • ${conteo.sucursal_nombre}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {puedeIniciar && (
                                <Button onClick={() => openModal('iniciar')}>
                                    <Play className="h-4 w-4 mr-1" />
                                    Iniciar Conteo
                                </Button>
                            )}

                            {puedeCompletar && (
                                <Button onClick={() => openModal('completar')}>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Completar
                                </Button>
                            )}

                            {puedeAplicarAjustes && (
                                <Button onClick={() => openModal('aplicarAjustes')}>
                                    <Save className="h-4 w-4 mr-1" />
                                    Aplicar Ajustes
                                </Button>
                            )}

                            {puedeCancelar && (
                                <Button
                                    variant="outline"
                                    onClick={() => openModal('cancelar')}
                                    className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/30"
                                >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancelar
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-500 dark:text-gray-400">
                                Progreso: {conteo.resumen?.contados || 0} de {conteo.resumen?.total || 0} productos
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                                {conteo.resumen?.total > 0
                                    ? Math.round((conteo.resumen.contados / conteo.resumen.total) * 100)
                                    : 0}%
                            </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-600 rounded-full transition-all duration-300"
                                style={{
                                    width: `${conteo.resumen?.total > 0
                                            ? Math.round((conteo.resumen.contados / conteo.resumen.total) * 100)
                                            : 0
                                        }%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Panel izquierdo: Búsqueda y registro */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Búsqueda por código */}
                        {esEditable && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                    Buscar Producto
                                </h3>
                                <form onSubmit={handleBuscarItem}>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={codigoBusqueda}
                                                onChange={(e) => setCodigoBusqueda(e.target.value)}
                                                placeholder="Código de barras o SKU..."
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => openModal('scanner')}
                                            className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                            title="Escanear código de barras"
                                        >
                                            <Camera className="h-5 w-5" />
                                        </button>
                                        <Button type="submit" isLoading={buscarItemMutation.isPending}>
                                            Buscar
                                        </Button>
                                    </div>
                                </form>

                                {/* Scanner de código de barras */}
                                {isOpen('scanner') && (
                                    <BarcodeScanner
                                        onClose={() => closeModal('scanner')}
                                        onScan={(scanResult) => {
                                            const codigo = scanResult.code || scanResult;
                                            setCodigoBusqueda(codigo);
                                            closeModal('scanner');
                                            // Auto-buscar después de escanear
                                            setTimeout(() => {
                                                handleBuscarItem({ preventDefault: () => {} });
                                            }, 100);
                                        }}
                                        title="Buscar Producto"
                                        subtitle="Escanea el código de barras del producto"
                                    />
                                )}
                            </div>
                        )}

                        {/* Formulario de conteo activo */}
                        {itemActivo && esEditable && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {itemActivo.producto_nombre}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            SKU: {itemActivo.producto_sku || '-'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setItemActivo(null);
                                            setCantidadInput('');
                                            setNotasInput('');
                                        }}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <XCircle className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Cantidad en Sistema
                                        </label>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {itemActivo.cantidad_sistema}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Cantidad Contada
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleAjustarCantidad(-1)}
                                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                                            >
                                                <Minus className="h-5 w-5" />
                                            </button>
                                            <input
                                                type="number"
                                                value={cantidadInput}
                                                onChange={(e) => setCantidadInput(e.target.value)}
                                                className="flex-1 text-center text-2xl font-bold py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                min="0"
                                            />
                                            <button
                                                onClick={() => handleAjustarCantidad(1)}
                                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                                            >
                                                <Plus className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Diferencia */}
                                    {cantidadInput !== '' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Diferencia
                                            </label>
                                            <div
                                                className={`text-xl font-bold ${parseInt(cantidadInput) - itemActivo.cantidad_sistema === 0
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : parseInt(cantidadInput) - itemActivo.cantidad_sistema > 0
                                                            ? 'text-blue-600 dark:text-blue-400'
                                                            : 'text-red-600 dark:text-red-400'
                                                    }`}
                                            >
                                                {parseInt(cantidadInput) - itemActivo.cantidad_sistema > 0 ? '+' : ''}
                                                {parseInt(cantidadInput) - itemActivo.cantidad_sistema}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Notas (opcional)
                                        </label>
                                        <Textarea
                                            value={notasInput}
                                            onChange={(e) => setNotasInput(e.target.value)}
                                            placeholder="Observaciones..."
                                            rows={2}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleGuardarConteo}
                                        className="w-full"
                                        isLoading={registrarMutation.isPending}
                                    >
                                        <Save className="h-4 w-4 mr-1" />
                                        Guardar Conteo
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Resumen */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => setMostrarResumen(!mostrarResumen)}
                            >
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    Resumen
                                </h3>
                                {mostrarResumen ? (
                                    <ChevronUp className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                )}
                            </div>

                            {mostrarResumen && (
                                <div className="mt-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Total productos</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {conteo.resumen?.total || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Pendientes</span>
                                        <span className="font-medium text-yellow-600 dark:text-yellow-400">
                                            {conteo.resumen?.pendientes || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Contados</span>
                                        <span className="font-medium text-green-600 dark:text-green-400">
                                            {conteo.resumen?.contados || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Con diferencia</span>
                                        <span className="font-medium text-amber-600 dark:text-amber-400">
                                            {conteo.resumen?.con_diferencia || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Sin diferencia</span>
                                        <span className="font-medium text-gray-600 dark:text-gray-400">
                                            {conteo.resumen?.sin_diferencia || 0}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel derecho: Lista de items */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            {/* Filtros de items */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                    Productos ({itemsFiltrados.length})
                                </h3>
                                <div className="flex gap-2">
                                    <select
                                        value={filtroItems}
                                        onChange={(e) => setFiltroItems(e.target.value)}
                                        className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="todos">Todos</option>
                                        <option value="pendientes">Pendientes</option>
                                        <option value="contados">Contados</option>
                                        <option value="diferencia">Con diferencia</option>
                                    </select>
                                </div>
                            </div>

                            {/* Lista de items */}
                            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                                {itemsFiltrados.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                        {conteo.estado === 'borrador'
                                            ? 'Inicia el conteo para generar la lista de productos'
                                            : 'No hay productos que coincidan con el filtro'}
                                    </div>
                                ) : (
                                    itemsFiltrados.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => esEditable && handleSeleccionarItem(item)}
                                            className={`p-4 ${esEditable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
                                                } ${itemActivo?.id === item.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                                        {item.producto_nombre}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        SKU: {item.producto_sku || '-'}
                                                        {item.codigo_barras && ` • ${item.codigo_barras}`}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-4 ml-4">
                                                    {/* Cantidad sistema */}
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Sistema</p>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {item.cantidad_sistema}
                                                        </p>
                                                    </div>

                                                    {/* Cantidad contada */}
                                                    <div className="text-right min-w-[60px]">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Contado</p>
                                                        <p className={`font-medium ${item.estado === 'contado'
                                                                ? 'text-gray-900 dark:text-white'
                                                                : 'text-gray-400 dark:text-gray-500'
                                                            }`}>
                                                            {item.cantidad_contada ?? '-'}
                                                        </p>
                                                    </div>

                                                    {/* Diferencia */}
                                                    <div className="text-right min-w-[50px]">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Dif.</p>
                                                        {item.estado === 'contado' ? (
                                                            <p
                                                                className={`font-medium ${item.diferencia === 0
                                                                        ? 'text-green-600 dark:text-green-400'
                                                                        : item.diferencia > 0
                                                                            ? 'text-blue-600 dark:text-blue-400'
                                                                            : 'text-red-600 dark:text-red-400'
                                                                    }`}
                                                            >
                                                                {item.diferencia > 0 ? '+' : ''}
                                                                {item.diferencia}
                                                            </p>
                                                        ) : (
                                                            <p className="text-gray-400 dark:text-gray-500">-</p>
                                                        )}
                                                    </div>

                                                    {/* Estado */}
                                                    <div className="min-w-[80px]">
                                                        {item.estado === 'pendiente' ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                                                Pendiente
                                                            </span>
                                                        ) : item.estado === 'contado' ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                Contado
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                                Ajustado
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modales */}
            <IniciarConteoModal
                isOpen={isOpen('iniciar')}
                onClose={() => closeModal('iniciar')}
                conteo={conteo}
                onConfirm={handleIniciar}
                isLoading={iniciarMutation.isPending}
            />

            <CompletarConteoModal
                isOpen={isOpen('completar')}
                onClose={() => closeModal('completar')}
                conteo={conteo}
                onConfirm={handleCompletar}
                isLoading={completarMutation.isPending}
            />

            <AplicarAjustesModal
                isOpen={isOpen('aplicarAjustes')}
                onClose={() => closeModal('aplicarAjustes')}
                conteo={conteo}
                onConfirm={handleAplicarAjustes}
                isLoading={aplicarAjustesMutation.isPending}
            />

            <CancelarConteoModal
                isOpen={isOpen('cancelar')}
                onClose={() => closeModal('cancelar')}
                conteo={conteo}
                onConfirm={handleCancelar}
                isLoading={cancelarMutation.isPending}
                motivo={motivoCancelacion}
                onMotivoChange={setMotivoCancelacion}
            />
        </div>
    );
}
