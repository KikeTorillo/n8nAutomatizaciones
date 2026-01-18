import { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { DataTable } from '../organisms/DataTable';
import SearchInput from '../molecules/SearchInput';
import Button from '../atoms/Button';
import StatCardGrid from '../organisms/StatCardGrid';
import { useFilters, usePagination, useModalManager, useDeleteConfirmation } from '@/hooks/utils';
import { Plus, Search } from 'lucide-react';

/**
 * ListadoCRUDPage - Template para paginas CRUD estandar
 *
 * Encapsula: filtros, paginacion, tabla, modales CRUD, estadisticas
 * Reduce ~60-70% del codigo repetitivo en paginas de listado.
 *
 * @example
 * // Caso básico
 * <ListadoCRUDPage
 *   title="Cupones"
 *   icon={Ticket}
 *   useListQuery={useCupones}
 *   useDeleteMutation={useEliminarCupon}
 *   columns={cuponesColumns}
 *   FormDrawer={CuponFormDrawer}
 * />
 *
 * @example
 * // Con acciones custom por fila (toggle estado, stats, duplicar)
 * <ListadoCRUDPage
 *   title="Promociones"
 *   icon={Sparkles}
 *   useListQuery={usePromociones}
 *   useDeleteMutation={useEliminarPromocion}
 *   columns={promocionesColumns}
 *   FormDrawer={PromocionFormDrawer}
 *   StatsModal={PromocionStatsModal}
 *   rowActions={(row, handlers) => (
 *     <CustomRowActions row={row} {...handlers} />
 *   )}
 *   extraMutations={{
 *     cambiarEstado: useCambiarEstadoPromocion(),
 *     duplicar: useDuplicarPromocion(),
 *   }}
 * />
 */
export default function ListadoCRUDPage({
  // Layout
  title,
  subtitle,
  icon: Icon,
  PageLayout,
  layoutProps = {},

  // Data
  useListQuery,
  queryParams: extraQueryParams = {},
  dataKey = 'items', // Clave en response (productos, cupones, etc.)

  // Mutations
  useDeleteMutation,
  deleteMutationOptions = {},
  extraMutations = {}, // Mutations adicionales (toggle, duplicar, etc.)

  // Table
  columns: columnsProp,
  keyField = 'id',
  onRowClick,
  emptyState = {},
  rowActions, // (row, handlers) => ReactNode para acciones custom

  // Filters
  initialFilters = { busqueda: '' },
  filterConfig = [],
  filterPersistId,
  limit = 20,

  // Stats (opcional)
  statsConfig,

  // Modals
  FormDrawer,
  formDrawerProps = {},
  mapFormData, // (data) => props para FormDrawer (ej: data => ({ proveedor: data, mode: data ? 'edit' : 'create' }))
  StatsModal,
  statsModalProps = {},
  mapStatsData, // (data) => props para StatsModal (ej: data => ({ cupon: data }))

  // Actions
  actions,
  showNewButton = true,
  newButtonLabel = 'Nuevo',

  // Customization
  renderFilters,
  renderBeforeTable,
  renderAfterTable,
  className,
  children,
}) {
  // Paginacion
  const { page, handlePageChange, resetPage, queryParams } = usePagination({
    limit
  });

  // Filtros
  const {
    filtros,
    filtrosQuery,
    setFiltro,
    limpiarFiltros,
    filtrosActivos
  } = useFilters(initialFilters, {
    moduloId: filterPersistId
  });

  // Modales
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    stats: { isOpen: false, data: null },
  });

  // Query de datos
  const { data, isLoading } = useListQuery({
    ...queryParams,
    ...filtrosQuery,
    ...extraQueryParams,
  });

  const items = data?.[dataKey] || data?.items || [];
  const paginacion = {
    page,
    limit: queryParams.limite,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    ...data?.paginacion,
  };

  // Delete mutation + confirmation
  const deleteMutation = useDeleteMutation?.();
  const { confirmDelete, DeleteConfirmModal } = useDeleteConfirmation({
    deleteMutation,
    entityName: title?.toLowerCase() || 'elemento',
    ...deleteMutationOptions,
  });

  // Handlers
  const handleNuevo = useCallback(() => openModal('form', null), [openModal]);
  const handleEditar = useCallback((item) => openModal('form', item), [openModal]);
  const handleEliminar = useCallback((item) => confirmDelete(item), [confirmDelete]);
  const handleVerStats = useCallback((item) => openModal('stats', item), [openModal]);

  // Handlers object para rowActions
  const handlers = useMemo(() => ({
    onEdit: handleEditar,
    onDelete: handleEliminar,
    onViewStats: handleVerStats,
    extraMutations,
  }), [handleEditar, handleEliminar, handleVerStats, extraMutations]);

  // Columnas con acciones automáticas si rowActions está definido
  const columns = useMemo(() => {
    if (!rowActions) return columnsProp;

    // Agregar columna de acciones al final
    const actionsColumn = {
      key: '_actions',
      header: '',
      align: 'right',
      render: (row) => rowActions(row, handlers),
    };

    // Si ya existe una columna 'actions' o '_actions', reemplazarla
    const filtered = columnsProp.filter(col => col.key !== 'actions' && col.key !== '_actions');
    return [...filtered, actionsColumn];
  }, [columnsProp, rowActions, handlers]);

  // Computed subtitle
  const computedSubtitle = subtitle || `${paginacion.total} ${title?.toLowerCase() || 'elementos'}`;

  // Wrapper de layout
  const LayoutComponent = PageLayout || 'div';
  const layoutContent = (
    <>
      {/* Stats */}
      {statsConfig && <StatCardGrid stats={statsConfig} className="mb-6" />}

      {/* Filtros */}
      {renderFilters ? (
        renderFilters({ filtros, setFiltro, limpiarFiltros, filtrosActivos, resetPage })
      ) : (
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={filtros.busqueda || ''}
              onChange={(value) => {
                setFiltro('busqueda', value);
                resetPage();
              }}
              placeholder="Buscar..."
              icon={Search}
            />
          </div>
          {filtrosActivos > 0 && (
            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          )}
        </div>
      )}

      {/* Before table slot */}
      {renderBeforeTable?.({ items, isLoading })}

      {/* Table */}
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        keyField={keyField}
        onRowClick={onRowClick || handleEditar}
        pagination={paginacion}
        onPageChange={handlePageChange}
        emptyState={{
          icon: Icon,
          title: `No hay ${title?.toLowerCase() || 'elementos'}`,
          description: filtrosActivos > 0
            ? 'No se encontraron resultados con esos filtros'
            : `Crea tu primer ${title?.toLowerCase() || 'elemento'}`,
          actionLabel: filtrosActivos === 0 && showNewButton ? newButtonLabel : undefined,
          onAction: filtrosActivos === 0 && showNewButton ? handleNuevo : undefined,
          ...emptyState,
        }}
      />

      {/* After table slot */}
      {renderAfterTable?.({ items, isLoading })}

      {/* Form Drawer */}
      {FormDrawer && isOpen('form') && (
        <FormDrawer
          key={`form-${getModalData('form')?.id || 'new'}`}
          isOpen={isOpen('form')}
          onClose={() => closeModal('form')}
          onSuccess={() => closeModal('form')}
          {...(mapFormData ? mapFormData(getModalData('form')) : { data: getModalData('form') })}
          {...formDrawerProps}
        />
      )}

      {/* Stats Modal */}
      {StatsModal && (
        <StatsModal
          isOpen={isOpen('stats')}
          onClose={() => closeModal('stats')}
          {...(mapStatsData ? mapStatsData(getModalData('stats')) : { data: getModalData('stats') })}
          {...statsModalProps}
        />
      )}

      {/* Delete Confirmation */}
      {deleteMutation && <DeleteConfirmModal />}

      {/* Children slot */}
      {children}
    </>
  );

  // Render con o sin PageLayout
  if (PageLayout) {
    return (
      <LayoutComponent
        icon={Icon}
        title={title}
        subtitle={computedSubtitle}
        actions={
          actions || (showNewButton && (
            <Button onClick={handleNuevo} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{newButtonLabel}</span>
            </Button>
          ))
        }
        {...layoutProps}
      >
        {layoutContent}
      </LayoutComponent>
    );
  }

  return (
    <div className={cn('p-6', className)}>
      {/* Header simple si no hay PageLayout */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-7 w-7 text-primary-600 dark:text-primary-400" />}
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{computedSubtitle}</p>
          </div>
        </div>
        {(actions || showNewButton) && (
          <div className="flex gap-2">
            {actions || (
              <Button onClick={handleNuevo} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {newButtonLabel}
              </Button>
            )}
          </div>
        )}
      </div>
      {layoutContent}
    </div>
  );
}
