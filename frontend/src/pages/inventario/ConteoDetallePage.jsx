import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { extractProductCode } from '@/utils/gs1Parser';
import { Button } from '@/components/ui';
import {
    IniciarConteoModal,
    CompletarConteoModal,
    AplicarAjustesModal,
    CancelarConteoModal,
} from '@/components/inventario/conteos/modales';
import { useToast } from '@/hooks/utils';
import { useModalManager } from '@/hooks/utils';
import {
    useConteo,
    useIniciarConteo,
    useRegistrarConteoItem,
    useCompletarConteo,
    useAplicarAjustesConteo,
    useCancelarConteo,
    useBuscarItemConteo,
} from '@/hooks/inventario';
import {
    ConteoDetalleHeader,
    ConteoDetalleBusqueda,
    ConteoDetalleItemForm,
    ConteoDetalleResumen,
    ConteoDetalleItems,
} from './components';

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
    const [filtroItems, setFiltroItems] = useState('todos');
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

    const handleCerrarItemForm = () => {
        setItemActivo(null);
        setCantidadInput('');
        setNotasInput('');
    };

    const handleScan = (scanResult) => {
        const codigo = scanResult.code || scanResult;
        setCodigoBusqueda(codigo);
        closeModal('scanner');
        // Auto-buscar después de escanear
        setTimeout(() => {
            handleBuscarItem({ preventDefault: () => {} });
        }, 100);
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
            <ConteoDetalleHeader
                conteo={conteo}
                puedeIniciar={puedeIniciar}
                puedeCompletar={puedeCompletar}
                puedeAplicarAjustes={puedeAplicarAjustes}
                puedeCancelar={puedeCancelar}
                onOpenModal={openModal}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Panel izquierdo: Búsqueda y registro */}
                    <div className="lg:col-span-1 space-y-4">
                        {esEditable && (
                            <ConteoDetalleBusqueda
                                inputRef={inputRef}
                                codigoBusqueda={codigoBusqueda}
                                onCodigoChange={setCodigoBusqueda}
                                onBuscar={handleBuscarItem}
                                isSearching={buscarItemMutation.isPending}
                                scannerOpen={isOpen('scanner')}
                                onOpenScanner={() => openModal('scanner')}
                                onCloseScanner={() => closeModal('scanner')}
                                onScan={handleScan}
                            />
                        )}

                        {itemActivo && esEditable && (
                            <ConteoDetalleItemForm
                                itemActivo={itemActivo}
                                cantidadInput={cantidadInput}
                                onCantidadChange={setCantidadInput}
                                onAjustarCantidad={handleAjustarCantidad}
                                notasInput={notasInput}
                                onNotasChange={setNotasInput}
                                onGuardar={handleGuardarConteo}
                                onCerrar={handleCerrarItemForm}
                                isLoading={registrarMutation.isPending}
                            />
                        )}

                        <ConteoDetalleResumen
                            resumen={conteo.resumen}
                            mostrar={mostrarResumen}
                            onToggle={() => setMostrarResumen(!mostrarResumen)}
                        />
                    </div>

                    {/* Panel derecho: Lista de items */}
                    <div className="lg:col-span-2">
                        <ConteoDetalleItems
                            items={itemsFiltrados}
                            filtro={filtroItems}
                            onFiltroChange={setFiltroItems}
                            esEditable={esEditable}
                            itemActivoId={itemActivo?.id}
                            onSeleccionarItem={handleSeleccionarItem}
                            estadoConteo={conteo.estado}
                        />
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
