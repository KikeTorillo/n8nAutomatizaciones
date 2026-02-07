import { useMemo, useCallback, useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { DataTable } from '../organisms/DataTable';
import { SearchInput } from '../organisms/SearchInput';
import { Button } from '../atoms/Button';
import { StatCardGrid, type StatConfig } from '../molecules/StatCardGrid';
import { ViewTabs } from '../organisms/ViewTabs';
import { useFilters, usePagination, normalizePagination, useModalManager, useDeleteConfirmation, useExportCSV } from '@/hooks/utils';
import { ConfirmDialog } from '../organisms/ConfirmDialog';
import { Plus, Download } from 'lucide-react';
import { SEMANTIC_COLORS } from '@/lib/uiConstants';

type LucideIcon = React.ComponentType<{ className?: string }>;

interface ColumnDef {
  key: string;
  header?: string | React.ReactNode;
  align?: 'left' | 'center' | 'right';
  render?: (row: Record<string, unknown>) => React.ReactNode;
  [key: string]: unknown;
}

interface ViewComponentProps {
  items: Record<string, unknown>[];
  isLoading: boolean;
  onItemClick?: (item: Record<string, unknown>) => void;
  handlers?: CrudHandlers;
  pagination?: unknown;
  onPageChange?: (page: number) => void;
}

interface ViewMode {
  id: string;
  label: string;
  icon?: LucideIcon;
  component?: React.ComponentType<ViewComponentProps>;
}

interface ExportConfig {
  filename?: string;
  columns?: Array<{ key: string; header: string }>;
  mapRow?: (row: Record<string, unknown>) => Record<string, unknown>;
}

interface OverlayComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  data?: unknown;
  [key: string]: unknown;
}

interface ExtraModalConfig {
  component: React.ComponentType<OverlayComponentProps>;
  mapData?: (data: unknown) => Record<string, unknown>;
  props?: Record<string, unknown>;
}

interface CrudHandlers {
  onEdit: (item: Record<string, unknown>) => void;
  onDelete: (item: Record<string, unknown>) => void;
  onViewStats: (item: Record<string, unknown>) => void;
  openModal: (name: string, data?: unknown) => void;
  extraMutations: Record<string, unknown>;
}

type OpenModalFn = (name: string, data?: unknown) => void;
type CloseModalFn = (name: string, clearData?: boolean) => void;
type SetFiltroFn = (key: string, value: unknown) => void;

interface PageLayoutProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  [key: string]: unknown;
}

interface ListadoCRUDPageProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  PageLayout?: React.ComponentType<PageLayoutProps>;
  layoutProps?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useListQuery: (params: Record<string, unknown>) => { data?: any; isLoading: boolean };
  queryParams?: Record<string, unknown>;
  dataKey?: string;
  useDeleteMutation?: () => { mutate: (id: unknown) => void; [key: string]: unknown };
  deleteMutationOptions?: Record<string, unknown>;
  extraMutations?: Record<string, unknown>;
  columns: ColumnDef[];
  keyField?: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  emptyState?: Record<string, unknown>;
  rowActions?: (row: Record<string, unknown>, handlers: CrudHandlers) => React.ReactNode;
  initialFilters?: Record<string, unknown>;
  filterConfig?: unknown[];
  filterPersistId?: string;
  limit?: number;
  statsConfig?: StatConfig[];
  FormDrawer?: React.ComponentType<OverlayComponentProps>;
  formDrawerProps?: Record<string, unknown>;
  mapFormData?: (data: unknown) => Record<string, unknown>;
  StatsModal?: React.ComponentType<OverlayComponentProps>;
  statsModalProps?: Record<string, unknown>;
  mapStatsData?: (data: unknown) => Record<string, unknown>;
  actions?: React.ReactNode | ((context: { openModal: OpenModalFn; closeModal: CloseModalFn; items: unknown[]; isLoading: boolean; handlers: CrudHandlers }) => React.ReactNode);
  showNewButton?: boolean;
  newButtonLabel?: string;
  viewModes?: ViewMode[];
  defaultViewMode?: string;
  extraModals?: Record<string, ExtraModalConfig>;
  exportConfig?: ExportConfig;
  renderFilters?: (context: { filtros: Record<string, unknown>; setFiltro: SetFiltroFn; limpiarFiltros: () => void; filtrosActivos: number; resetPage: () => void }) => React.ReactNode;
  renderBeforeTable?: (context: { items: unknown[]; isLoading: boolean; paginacion: unknown; openModal: OpenModalFn }) => React.ReactNode;
  renderAfterTable?: (context: { items: unknown[]; isLoading: boolean }) => React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const ListadoCRUDPage = memo(function ListadoCRUDPage({
  // Layout
  title,
  subtitle,
  icon: Icon,
  PageLayout,
  layoutProps = {},

  // Data
  useListQuery,
  queryParams: extraQueryParams = {},
  dataKey = 'items',

  // Mutations
  useDeleteMutation,
  deleteMutationOptions = {},
  extraMutations = {},

  // Table
  columns: columnsProp,
  keyField = 'id',
  onRowClick,
  emptyState = {},
  rowActions,

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
  mapFormData,
  StatsModal,
  statsModalProps = {},
  mapStatsData,

  // Actions
  actions,
  showNewButton = true,
  newButtonLabel = 'Nuevo',

  // ViewModes (tabla/cards)
  viewModes,
  defaultViewMode = 'table',

  // Extra modals
  extraModals = {},

  // Export CSV
  exportConfig,

  // Customization
  renderFilters,
  renderBeforeTable,
  renderAfterTable,
  className,
  children,
}: ListadoCRUDPageProps) {
  // View mode state
  const [activeView, setActiveView] = useState(defaultViewMode);
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

  // Modales base + extras
  const extraModalConfig = useMemo(() =>
    Object.keys(extraModals).reduce((acc: Record<string, { isOpen: boolean; data: null }>, key) => {
      acc[key] = { isOpen: false, data: null };
      return acc;
    }, {}), [extraModals]
  );

  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    stats: { isOpen: false, data: null },
    ...extraModalConfig,
  }) as {
    openModal: (name: string, data?: unknown, extraProps?: Record<string, unknown>) => void;
    closeModal: (name: string, clearData?: boolean) => void;
    isOpen: (name: string) => boolean;
    getModalData: (name: string) => Record<string, unknown> | null;
    modals: Record<string, unknown>;
    closeAll: () => void;
  };

  // Query de datos
  const { data, isLoading } = useListQuery({
    ...queryParams,
    ...filtrosQuery,
    ...extraQueryParams,
  });

  // Memoizar items derivados para evitar re-renders innecesarios
  const items = useMemo(() =>
    data?.[dataKey] || data?.items || [],
    [data, dataKey]
  );

  // Normalizar paginación del backend (soporta nombres en español e inglés)
  const paginacion = useMemo(() => {
    const backendPagination = data?.paginacion || data?.pagination;
    const normalized = normalizePagination(backendPagination);

    // Si no hay objeto de paginación anidado, usar total/limit directos de data
    const total = normalized.total || data?.total || items.length;
    const limit = normalized.limit || data?.limit || queryParams.limit;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      ...normalized,
      total,
      totalPages,
      // Usar el page del hook local si el backend no lo devuelve
      page: normalized.page || page,
      limit,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }, [page, queryParams.limit, data?.paginacion, data?.pagination, data?.total, data?.limit, items.length]);

  // Export CSV
  const { exportCSV } = useExportCSV();
  const handleExport = useCallback(() => {
    if (!exportConfig || items.length === 0) return;
    const filename = exportConfig.filename || `${title?.toLowerCase() || 'export'}_${new Date().toISOString().split('T')[0]}`;
    exportCSV(items, exportConfig.columns || [], filename);
  }, [exportConfig, items, exportCSV, title]);

  // Delete mutation + confirmation
  const deleteMutation = useDeleteMutation?.();
  const { confirmDelete, deleteConfirmProps } = useDeleteConfirmation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deleteMutation: deleteMutation || null as any,
    entityName: title?.toLowerCase() || 'elemento',
    ...deleteMutationOptions,
  }) as {
    confirmDelete: (item: Record<string, unknown>) => void;
    deleteConfirmProps: Record<string, unknown>;
    isDeleting: boolean;
    itemToDelete: unknown;
  };

  // Handlers
  const handleNuevo = useCallback(() => openModal('form', null), [openModal]);
  const handleEditar = useCallback((item: Record<string, unknown>) => openModal('form', item), [openModal]);
  const handleEliminar = useCallback((item: Record<string, unknown>) => confirmDelete(item), [confirmDelete]);
  const handleVerStats = useCallback((item: Record<string, unknown>) => openModal('stats', item), [openModal]);

  // Handlers object para rowActions
  const handlers = useMemo(() => ({
    onEdit: handleEditar,
    onDelete: handleEliminar,
    onViewStats: handleVerStats,
    openModal,
    extraMutations,
  }), [handleEditar, handleEliminar, handleVerStats, openModal, extraMutations]);

  // Columnas con acciones automáticas si rowActions está definido
  const columns = useMemo(() => {
    if (!rowActions) return columnsProp;

    // Agregar columna de acciones al final
    const actionsColumn = {
      key: '_actions',
      header: '',
      align: 'right' as const,
      render: (row: Record<string, unknown>) => rowActions(row, handlers),
    };

    // Si ya existe una columna 'actions' o '_actions', reemplazarla
    const filtered = columnsProp.filter(col => col.key !== 'actions' && col.key !== '_actions');
    return [...filtered, actionsColumn];
  }, [columnsProp, rowActions, handlers]);

  // Computed subtitle
  const computedSubtitle = subtitle || `${paginacion.total} ${title?.toLowerCase() || 'elementos'}`;

  // Computed actions - permite función o ReactNode
  const computedActions = typeof actions === 'function'
    ? actions({ openModal, closeModal, items, isLoading, handlers })
    : actions;

  // Wrapper de layout
  const LayoutComponent = (PageLayout || 'div') as React.ElementType<PageLayoutProps>;
  const layoutContent = (
    <>
      {/* Stats */}
      {statsConfig && <StatCardGrid stats={statsConfig} className="mb-6" />}

      {/* ViewTabs + Filtros + Export */}
      <div className="mb-6 space-y-4">
        {/* ViewTabs si hay múltiples vistas */}
        {viewModes && viewModes.length > 1 && (
          <ViewTabs
            tabs={viewModes}
            activeTab={activeView}
            onChange={setActiveView}
          />
        )}

        {/* Filtros */}
        {renderFilters ? (
          renderFilters({ filtros, setFiltro, limpiarFiltros, filtrosActivos, resetPage })
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchInput
                value={(filtros.busqueda as string) || ''}
                onChange={(e) => {
                  setFiltro('busqueda', (e.target as HTMLInputElement).value);
                  resetPage();
                }}
                placeholder="Buscar..."
              />
            </div>
            <div className="flex gap-2">
              {filtrosActivos > 0 && (
                <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              )}
              {exportConfig && items.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={false}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Before table slot */}
      {renderBeforeTable?.({ items, isLoading, paginacion, openModal })}

      {/* Table o Vista Custom */}
      {(() => {
        // Buscar componente custom para el activeView actual
        const viewConfig = viewModes?.find(v => v.id === activeView);
        if (viewConfig?.component) {
          const ViewComponent = viewConfig.component;
          return (
            <ViewComponent
              items={items}
              isLoading={isLoading}
              onItemClick={onRowClick || handleEditar}
              handlers={handlers}
              pagination={paginacion}
              onPageChange={handlePageChange}
            />
          );
        }
        // Fallback a DataTable si no hay componente custom
        return (
          <DataTable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            columns={columns as any}
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
        );
      })()}

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

      {/* Extra Modals */}
      {Object.entries(extraModals).map(([modalKey, modalConfig]) => {
        const { component: ModalComponent, mapData, props: modalProps = {} } = modalConfig;
        if (!ModalComponent) return null;
        return (
          <ModalComponent
            key={modalKey}
            isOpen={isOpen(modalKey)}
            onClose={() => closeModal(modalKey)}
            {...(mapData ? mapData(getModalData(modalKey)) : { data: getModalData(modalKey) })}
            {...modalProps}
          />
        );
      })}

      {/* Delete Confirmation */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {deleteMutation && <ConfirmDialog {...deleteConfirmProps as any} />}

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
          computedActions || (showNewButton && (
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
          {Icon && <Icon className={cn('h-7 w-7', SEMANTIC_COLORS.primary.icon)} />}
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{computedSubtitle}</p>
          </div>
        </div>
        {(computedActions || showNewButton) && (
          <div className="flex gap-2">
            {computedActions || (
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
});

ListadoCRUDPage.displayName = 'ListadoCRUDPage';

export { ListadoCRUDPage };
export default ListadoCRUDPage;
export type { ListadoCRUDPageProps, ColumnDef, ViewMode, ViewComponentProps, ExportConfig, ExtraModalConfig, OverlayComponentProps, CrudHandlers, PageLayoutProps, OpenModalFn, CloseModalFn, SetFiltroFn };
