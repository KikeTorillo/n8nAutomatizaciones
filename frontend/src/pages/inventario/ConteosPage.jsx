import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import {
    ClipboardList,
    Plus,
    Eye,
    Play,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Diff,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Textarea from '@/components/ui/Textarea';
import { StatCardGrid } from '@/components/ui/StatCardGrid';
import { DataTable, DataTableActions, DataTableActionButton } from '@/components/ui/DataTable';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { useModalManager } from '@/hooks/useModalManager';
import { useToast } from '@/hooks/useToast';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
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

    const [motivoCancelacion, setMotivoCancelacion] = useState('');

    // Configuración de filtros para FilterPanel
    const filterConfig = useMemo(() => [
        {
            key: 'estado',
            label: 'Estado',
            type: 'select',
            options: [
                { value: '', label: 'Todos los estados' },
                { value: 'borrador', label: 'Borrador' },
                { value: 'en_proceso', label: 'En Proceso' },
                { value: 'completado', label: 'Completado' },
                { value: 'ajustado', label: 'Ajustado' },
                { value: 'cancelado', label: 'Cancelado' },
            ],
        },
        {
            key: 'tipo_conteo',
            label: 'Tipo',
            type: 'select',
            options: [
                { value: '', label: 'Todos los tipos' },
                ...Object.entries(TIPOS_CONTEO_LABELS).map(([key, label]) => ({
                    value: key,
                    label,
                })),
            ],
        },
        {
            key: 'fecha_desde',
            label: 'Desde',
            type: 'date',
        },
        {
            key: 'fecha_hasta',
            label: 'Hasta',
            type: 'date',
        },
    ], []);

    // Modal manager
    const { isOpen, getModalData, openModal, closeModal } = useModalManager();

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
        setBusquedaInput('');
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
        openModal('form');
    };

    const handleCrearConteo = (data) => {
        crearMutation.mutate(data, {
            onSuccess: (conteo) => {
                showSuccess(`Conteo ${conteo.folio} creado correctamente`);
                closeModal('form');
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
        openModal('iniciar', { conteo });
    };

    const handleIniciar = () => {
        const conteo = getModalData('iniciar')?.conteo;
        iniciarMutation.mutate(conteo.id, {
            onSuccess: (result) => {
                showSuccess(`Conteo iniciado. ${result.resumen?.total || 0} productos para contar.`);
                closeModal('iniciar');
                navigate(`/inventario/conteos/${conteo.id}`);
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
        openModal('cancelar', { conteo });
    };

    const handleCancelar = () => {
        const conteo = getModalData('cancelar')?.conteo;
        cancelarMutation.mutate(
            { id: conteo.id, motivo: motivoCancelacion || undefined },
            {
                onSuccess: () => {
                    showSuccess('Conteo cancelado correctamente');
                    closeModal('cancelar');
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
        <InventarioPageLayout
            icon={ClipboardList}
            title="Conteos"
            subtitle={`${total} conteo${total !== 1 ? 's' : ''} en total`}
            actions={
                <Button onClick={handleNuevoConteo} className="flex-1 sm:flex-none">
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Nuevo Conteo</span>
                    <span className="sm:hidden">Nuevo</span>
                </Button>
            }
        >
            {/* Filtros */}
            <FilterPanel
                filters={filtros}
                onFilterChange={handleFiltroChange}
                onClearFilters={handleLimpiarFiltros}
                searchKey="folio"
                searchPlaceholder="Buscar por folio..."
                filterConfig={filterConfig}
                defaultExpanded={false}
                className="mb-6"
            />

            {/* Estadísticas rápidas */}
            <StatCardGrid
                className="mb-6"
                stats={[
                    { icon: ClipboardList, label: 'Total', value: total, color: 'blue' },
                    { icon: Play, label: 'En Proceso', value: parseInt(totales.en_proceso) || 0, color: 'yellow' },
                    { icon: CheckCircle, label: 'Ajustados', value: parseInt(totales.ajustados) || 0, color: 'green' },
                    { icon: Diff, label: 'Con Diferencias', value: parseInt(estadisticas.conteos_con_diferencias) || 0, color: 'red' },
                ]}
            />

            {/* Tabla de conteos */}
            <DataTable
              columns={[
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
                  key: 'tipo',
                  header: 'Tipo',
                  hideOnMobile: true,
                  render: (row) => (
                    <span className="text-sm text-gray-900 dark:text-white">
                      {TIPOS_CONTEO_LABELS[row.tipo_conteo] || row.tipo_conteo}
                    </span>
                  ),
                },
                {
                  key: 'estado',
                  header: 'Estado',
                  render: (row) => renderEstado(row.estado),
                },
                {
                  key: 'progreso',
                  header: 'Progreso',
                  hideOnMobile: true,
                  render: (row) => (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[100px]">
                        <div
                          className="h-full bg-primary-600 rounded-full"
                          style={{
                            width: `${row.total_productos > 0
                              ? Math.round((row.total_contados / row.total_productos) * 100)
                              : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {row.total_contados}/{row.total_productos}
                      </span>
                    </div>
                  ),
                },
                {
                  key: 'diferencias',
                  header: 'Diferencias',
                  hideOnMobile: true,
                  render: (row) => (
                    row.total_con_diferencia > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        {row.total_con_diferencia}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                    )
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
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  render: (row) => (
                    <div onClick={(e) => e.stopPropagation()}>
                      <DataTableActions>
                        <DataTableActionButton
                          icon={Eye}
                          label="Ver detalle"
                          onClick={() => handleVerDetalle(row.id)}
                          variant="ghost"
                        />
                        {row.estado === 'borrador' && (
                          <>
                            <DataTableActionButton
                              icon={Play}
                              label="Iniciar"
                              onClick={() => handleAbrirModalIniciar(row)}
                              variant="primary"
                            />
                            <DataTableActionButton
                              icon={XCircle}
                              label="Cancelar"
                              onClick={() => handleAbrirModalCancelar(row)}
                              variant="danger"
                            />
                          </>
                        )}
                        {row.estado === 'en_proceso' && (
                          <>
                            <DataTableActionButton
                              icon={ClipboardList}
                              label="Continuar conteo"
                              onClick={() => handleVerDetalle(row.id)}
                              variant="primary"
                            />
                            <DataTableActionButton
                              icon={XCircle}
                              label="Cancelar"
                              onClick={() => handleAbrirModalCancelar(row)}
                              variant="danger"
                            />
                          </>
                        )}
                        {row.estado === 'completado' && (
                          <DataTableActionButton
                            icon={CheckCircle}
                            label="Aplicar ajustes"
                            onClick={() => handleVerDetalle(row.id)}
                            variant="primary"
                          />
                        )}
                      </DataTableActions>
                    </div>
                  ),
                },
              ]}
              data={conteos}
              isLoading={isLoading}
              onRowClick={(row) => handleVerDetalle(row.id)}
              emptyState={{
                icon: ClipboardList,
                title: 'No hay conteos de inventario',
                description: 'Crea tu primer conteo para comenzar a gestionar el inventario físico',
                actionLabel: 'Crear primer conteo',
                onAction: handleNuevoConteo,
              }}
              pagination={total > filtros.limit ? {
                page: Math.floor(filtros.offset / filtros.limit) + 1,
                limit: filtros.limit,
                total,
                totalPages: Math.ceil(total / filtros.limit),
                hasNext: filtros.offset + filtros.limit < total,
                hasPrev: filtros.offset > 0,
              } : undefined}
              onPageChange={(page) =>
                setFiltros((prev) => ({
                  ...prev,
                  offset: (page - 1) * prev.limit,
                }))
              }
              skeletonRows={5}
            />

            {/* Modal crear conteo */}
            {isOpen('form') && (
                <ConteoFormModal
                    isOpen={isOpen('form')}
                    onClose={() => closeModal('form')}
                    onSubmit={handleCrearConteo}
                    isLoading={crearMutation.isPending}
                />
            )}

            {/* Modal confirmar iniciar */}
            <ConfirmDialog
                isOpen={isOpen('iniciar')}
                onClose={() => closeModal('iniciar')}
                onConfirm={handleIniciar}
                title="Iniciar Conteo"
                message={`¿Deseas iniciar el conteo ${getModalData('iniciar')?.conteo?.folio}? Se generarán los productos a contar según los filtros configurados. Una vez iniciado, podrás registrar las cantidades contadas.`}
                confirmText="Iniciar Conteo"
                variant="info"
                isLoading={iniciarMutation.isPending}
            />

            {/* Modal confirmar cancelar */}
            <ConfirmDialog
                isOpen={isOpen('cancelar')}
                onClose={() => closeModal('cancelar')}
                onConfirm={handleCancelar}
                title="Cancelar Conteo"
                message={`¿Deseas cancelar el conteo ${getModalData('cancelar')?.conteo?.folio}?`}
                confirmText="Cancelar Conteo"
                variant="danger"
                isLoading={cancelarMutation.isPending}
                size="md"
            >
                <Textarea
                    label="Motivo de cancelación (opcional)"
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    placeholder="Ingresa el motivo de la cancelación..."
                    rows={3}
                />
            </ConfirmDialog>
        </InventarioPageLayout>
    );
}
