/**
 * useListadoCRUDState - Hook que encapsula toda la lógica de estado de ListadoCRUDPage
 *
 * Feb 2026: Extraído de ListadoCRUDPage (~512 ln → ~250 ln render)
 * Maneja: paginación, filtros, modales, query, export CSV, delete, handlers, columnas.
 */

import { useMemo, useCallback, useState } from 'react';
import {
  useFilters,
  usePagination,
  normalizePagination,
  useModalManager,
  useDeleteConfirmation,
  useExportCSV,
} from '../hooks';
import type { ConfirmDialogProps } from '../organisms/ConfirmDialog';
import type { DataTableColumn } from '../organisms/DataTable';
import type {
  CrudHandlers,
  ExtraModalConfig,
  ExportConfig,
} from './ListadoCRUDPage';

interface UseListadoCRUDStateOptions {
  // Data

  useListQuery: (params: Record<string, unknown>) => {
    data?: Record<string, unknown>;
    isLoading: boolean;
  };
  queryParams?: Record<string, unknown>;
  dataKey?: string;

  // Mutations
  useDeleteMutation?: () => {
    mutate: (id: unknown) => void;
    isPending: boolean;
    [key: string]: unknown;
  };
  deleteMutationOptions?: Record<string, unknown>;
  extraMutations?: Record<string, unknown>;

  // Table
  columns: DataTableColumn[];
  rowActions?: (
    row: Record<string, unknown>,
    handlers: CrudHandlers
  ) => React.ReactNode;

  // Filters
  initialFilters?: Record<string, unknown>;
  filterPersistId?: string;
  limit?: number;

  // Modals
  extraModals?: Record<string, ExtraModalConfig>;

  // Export
  exportConfig?: ExportConfig;
  title?: string;

  // View
  defaultViewMode?: string;
}

export function useListadoCRUDState({
  useListQuery,
  queryParams: extraQueryParams = {},
  dataKey = 'items',
  useDeleteMutation,
  deleteMutationOptions = {},
  extraMutations = {},
  columns: columnsProp,
  rowActions,
  initialFilters = { busqueda: '' },
  filterPersistId,
  limit = 20,
  extraModals = {},
  exportConfig,
  title,
  defaultViewMode = 'table',
}: UseListadoCRUDStateOptions) {
  // View mode state
  const [activeView, setActiveView] = useState(defaultViewMode);

  // Paginación
  const { page, handlePageChange, resetPage, queryParams } = usePagination({
    limit,
  });

  // Filtros
  const { filtros, filtrosQuery, setFiltro, limpiarFiltros, filtrosActivos } =
    useFilters(initialFilters, { moduloId: filterPersistId });

  // Modales base + extras
  const extraModalConfig = useMemo(
    () =>
      Object.keys(extraModals).reduce(
        (acc: Record<string, { isOpen: boolean; data: null }>, key) => {
          acc[key] = { isOpen: false, data: null };
          return acc;
        },
        {}
      ),
    [extraModals]
  );

  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    stats: { isOpen: false, data: null },
    ...extraModalConfig,
  }) as {
    openModal: (
      name: string,
      data?: unknown,
      extraProps?: Record<string, unknown>
    ) => void;
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

  // Items derivados
  const items = useMemo(
    () => data?.[dataKey] || data?.items || [],
    [data, dataKey]
  );

  // Normalizar paginación del backend
  const paginacion = useMemo(() => {
    const backendPagination = data?.paginacion || data?.pagination;
    const normalized = normalizePagination(backendPagination);

    const total = normalized.total || data?.total || items.length;
    const lim = normalized.limit || data?.limit || queryParams.limit;
    const totalPages = Math.ceil(total / lim) || 1;

    return {
      ...normalized,
      total,
      totalPages,
      page: normalized.page || page,
      limit: lim,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }, [
    page,
    queryParams.limit,
    data?.paginacion,
    data?.pagination,
    data?.total,
    data?.limit,
    items.length,
  ]);

  // Export CSV
  const { exportCSV } = useExportCSV();
  const handleExport = useCallback(() => {
    if (!exportConfig || items.length === 0) return;
    const filename =
      exportConfig.filename ||
      `${title?.toLowerCase() || 'export'}_${new Date().toISOString().split('T')[0]}`;
    exportCSV(items, exportConfig.columns || [], filename);
  }, [exportConfig, items, exportCSV, title]);

  // Delete mutation + confirmation
  const deleteMutation = useDeleteMutation?.();
  const { confirmDelete, deleteConfirmProps } = useDeleteConfirmation({
    deleteMutation: deleteMutation ?? null,
    entityName: title?.toLowerCase() || 'elemento',
    ...deleteMutationOptions,
  });

  // Handlers
  const handleNuevo = useCallback(() => openModal('form', null), [openModal]);
  const handleEditar = useCallback(
    (item: Record<string, unknown>) => openModal('form', item),
    [openModal]
  );
  const handleEliminar = useCallback(
    (item: Record<string, unknown>) => confirmDelete(item),
    [confirmDelete]
  );
  const handleVerStats = useCallback(
    (item: Record<string, unknown>) => openModal('stats', item),
    [openModal]
  );

  // Handlers object para rowActions
  const handlers: CrudHandlers = useMemo(
    () => ({
      onEdit: handleEditar,
      onDelete: handleEliminar,
      onViewStats: handleVerStats,
      openModal,
      extraMutations,
    }),
    [handleEditar, handleEliminar, handleVerStats, openModal, extraMutations]
  );

  // Columnas con acciones automáticas
  const columns = useMemo(() => {
    if (!rowActions) return columnsProp;

    const actionsColumn = {
      key: '_actions',
      header: '',
      align: 'right' as const,
      render: (row: Record<string, unknown>) => rowActions(row, handlers),
    };

    const filtered = columnsProp.filter(
      (col) => col.key !== 'actions' && col.key !== '_actions'
    );
    return [...filtered, actionsColumn];
  }, [columnsProp, rowActions, handlers]);

  return {
    // View mode
    activeView,
    setActiveView,
    // Paginación
    page,
    handlePageChange,
    resetPage,
    // Filtros
    filtros,
    filtrosQuery,
    setFiltro,
    limpiarFiltros,
    filtrosActivos,
    // Modales
    openModal,
    closeModal,
    isOpen,
    getModalData,
    // Data
    data,
    isLoading,
    items,
    paginacion,
    // Export
    handleExport,
    // Delete
    deleteMutation,
    deleteConfirmProps: deleteConfirmProps as ConfirmDialogProps,
    // Handlers
    handleNuevo,
    handleEditar,
    handleEliminar,
    handleVerStats,
    handlers,
    // Columns
    columns,
  };
}
