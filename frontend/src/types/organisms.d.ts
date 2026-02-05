/**
 * Tipos compartidos para componentes UI Organisms
 * Feb 2026 - Migración TypeScript
 */

import type { ReactNode, ComponentType, HTMLAttributes } from 'react';
import type { LucideIcon, Size, SelectOption } from './ui';

// ============================================
// MODAL
// ============================================

/** Tamaños de modal */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

/** Props del componente Modal */
export interface ModalProps {
  /** Estado del modal (abierto/cerrado) */
  isOpen: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Título del modal */
  title?: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Contenido del modal */
  children?: ReactNode;
  /** Contenido del footer (botones de acción) */
  footer?: ReactNode;
  /** Tamaño del modal */
  size?: ModalSize;
  /** Mostrar botón de cierre en el header */
  showCloseButton?: boolean;
  /** Deshabilitar cierre del modal (para estados de carga) */
  disableClose?: boolean;
  /** Rol ARIA del modal */
  role?: 'dialog' | 'alertdialog';
}

// ============================================
// FORM DRAWER
// ============================================

/** Props del componente FormDrawer */
export interface FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  size?: DrawerSize;
  noPadding?: boolean;
  title?: string;
  subtitle?: string;
  entityName?: string;
  mode?: 'create' | 'edit';
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  hideFooter?: boolean;
  footer?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
}

// ============================================
// DRAWER
// ============================================

/** Tamaños de drawer */
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Props del componente Drawer */
export interface DrawerProps {
  /** Estado del drawer (abierto/cerrado) */
  isOpen: boolean;
  /** Callback para cerrar el drawer */
  onClose: () => void;
  /** Título del drawer */
  title?: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Contenido del drawer */
  children?: ReactNode;
  /** Contenido del footer (botones de acción) */
  footer?: ReactNode;
  /** Tamaño del drawer */
  size?: DrawerSize;
  /** Mostrar botón de cierre en el header */
  showCloseButton?: boolean;
  /** Deshabilitar cierre por drag/overlay */
  disableClose?: boolean;
  /** Desactivar padding del contenido (para layouts con tabs) */
  noPadding?: boolean;
}

// ============================================
// CONFIRM DIALOG
// ============================================

/** Variantes del diálogo de confirmación */
export type ConfirmDialogVariant = 'danger' | 'warning' | 'success' | 'info';

/** Props del componente ConfirmDialog */
export interface ConfirmDialogProps {
  /** Estado del diálogo */
  isOpen: boolean;
  /** Callback para cerrar */
  onClose: () => void;
  /** Callback al confirmar */
  onConfirm: () => void;
  /** Título del diálogo */
  title: string;
  /** Mensaje principal */
  message: string;
  /** Texto del botón confirmar */
  confirmText?: string;
  /** Texto del botón cancelar */
  cancelText?: string;
  /** Estilo visual */
  variant?: ConfirmDialogVariant;
  /** Estado de carga del botón confirmar */
  isLoading?: boolean;
  /** Deshabilitar botón confirmar */
  disabled?: boolean;
  /** Contenido adicional (ej: alertas, textarea) */
  children?: ReactNode;
  /** Tamaño del modal */
  size?: 'sm' | 'md';
}

// ============================================
// PAGINATION
// ============================================

/** Información de paginación del backend */
export interface PaginationInfo {
  /** Página actual (1-indexed) */
  page: number;
  /** Items por página */
  limit: number;
  /** Total de items */
  total: number;
  /** Total de páginas */
  totalPages: number;
  /** Si hay página siguiente */
  hasNext: boolean;
  /** Si hay página anterior */
  hasPrev: boolean;
}

/** Tamaños de botones de paginación */
export type PaginationSize = 'sm' | 'md' | 'lg';

/** Props del componente Pagination */
export interface PaginationProps {
  /** Objeto de paginación del backend */
  pagination: PaginationInfo;
  /** Callback cuando cambia la página */
  onPageChange: (page: number) => void;
  /** Mostrar info "Mostrando X de Y" */
  showInfo?: boolean;
  /** Mostrar botones de primera/última página */
  showFirstLast?: boolean;
  /** Máximo de números de página visibles */
  maxVisiblePages?: number;
  /** Tamaño de los botones */
  size?: PaginationSize;
  /** Clases adicionales */
  className?: string;
}

// ============================================
// DATATABLE
// ============================================

/** Alineación de columnas de tabla */
export type TableColumnAlign = 'left' | 'center' | 'right';

/** Ancho de columnas de tabla */
export type TableColumnWidth = 'sm' | 'md' | 'lg' | 'xl' | 'auto';

/** Configuración de columna de DataTable */
export interface DataTableColumn<T = Record<string, unknown>> {
  /** Key del dato en cada fila */
  key: keyof T | string;
  /** Texto del header */
  header: string;
  /** Función de renderizado custom */
  render?: (row: T, value: unknown, rowIndex: number) => ReactNode;
  /** Alineación */
  align?: TableColumnAlign;
  /** Ancho */
  width?: TableColumnWidth;
  /** Ocultar en móvil */
  hideOnMobile?: boolean;
  /** Clases adicionales para la celda */
  className?: string;
  /** Clases adicionales para el header */
  headerClassName?: string;
}

/** Configuración del estado vacío de DataTable */
export interface DataTableEmptyState {
  /** Icono del estado vacío */
  icon?: LucideIcon;
  /** Título cuando no hay datos */
  title?: string;
  /** Descripción del estado vacío */
  description?: string;
  /** Texto del botón de acción */
  actionLabel?: string;
  /** Callback del botón */
  onAction?: () => void;
}

/** Props del componente DataTable */
export interface DataTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Configuración de columnas */
  columns: DataTableColumn<T>[];
  /** Array de datos a mostrar */
  data: T[];
  /** Campo a usar como key */
  keyField?: keyof T;
  /** Estado de carga */
  isLoading?: boolean;
  /** Callback al hacer click en una fila */
  onRowClick?: (row: T) => void;
  /** Mostrar efecto hover en filas */
  hoverable?: boolean;
  /** Filas con colores alternados */
  striped?: boolean;
  /** Configuración del estado vacío */
  emptyState?: DataTableEmptyState;
  /** Objeto de paginación del backend */
  pagination?: PaginationInfo;
  /** Callback cuando cambia la página */
  onPageChange?: (page: number) => void;
  /** Filas del skeleton */
  skeletonRows?: number;
  /** Clases adicionales para el contenedor */
  className?: string;
  /** Clases adicionales para la tabla */
  tableClassName?: string;
}

/** Variante de botón de acción de tabla */
export type DataTableActionButtonVariant = 'ghost' | 'danger' | 'primary';

/** Props de DataTableActionButton */
export interface DataTableActionButtonProps {
  /** Icono del botón */
  icon?: LucideIcon;
  /** Texto del label (para tooltip) */
  label: string;
  /** Callback al hacer click */
  onClick?: (e: React.MouseEvent) => void;
  /** Variante visual */
  variant?: DataTableActionButtonVariant;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Clases adicionales */
  className?: string;
}

// ============================================
// FILTER FIELD
// ============================================

/** Tipos de campo de filtro */
export type FilterFieldType = 'text' | 'select' | 'date' | 'number' | 'checkbox';

/** Props del componente FilterField */
export interface FilterFieldProps {
  /** Tipo de campo */
  type?: FilterFieldType;
  /** Label del campo */
  label?: string;
  /** Valor actual */
  value?: string | boolean | number;
  /** Callback cuando cambia el valor */
  onChange?: (value: string | boolean) => void;
  /** Opciones para select */
  options?: SelectOption[];
  /** Placeholder del input */
  placeholder?: string;
  /** Icono (componente Lucide) */
  icon?: LucideIcon;
  /** Valor mínimo (date/number) */
  min?: string;
  /** Valor máximo (date/number) */
  max?: string;
  /** Incremento (number) */
  step?: number;
  /** ID del campo */
  id?: string;
  /** Clases adicionales */
  className?: string;
  /** Si está deshabilitado */
  disabled?: boolean;
}

// ============================================
// TREE NODE
// ============================================

/** Estado de expansión del árbol */
export type TreeExpandedState = Record<string | number, boolean>;

/** Contexto de renderizado del árbol */
export interface TreeRenderContext {
  /** Si el nodo está expandido */
  isExpanded: boolean;
  /** Si el nodo tiene hijos */
  hasChildren: boolean;
  /** Nivel de profundidad */
  level: number;
}

/** Props del componente TreeNode */
export interface TreeNodeProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** El nodo actual del árbol */
  node: T;
  /** Nivel de profundidad (para indentación) */
  level?: number;
  /** Key para acceder a los hijos del nodo */
  childrenKey?: string;
  /** Estado de expansión */
  expandedState: TreeExpandedState;
  /** Callback cuando se expande/contrae */
  onToggleExpand: (nodeId: string | number) => void;
  /** Render prop para el contenido del nodo */
  renderContent: (node: T, context: TreeRenderContext) => ReactNode;
  /** Render prop para las acciones del nodo */
  renderActions?: (node: T, context: TreeRenderContext) => ReactNode;
  /** Función para obtener el ID del nodo */
  getNodeId?: (node: T) => string | number;
  /** Tamaño de indentación en rem por nivel */
  indentSize?: number;
  /** Clases adicionales para el contenedor del nodo */
  className?: string;
  /** Clases adicionales para cada nodo */
  nodeClassName?: string | ((node: T) => string);
  /** Mostrar espacio para toggle aunque no tenga hijos */
  showToggleOnEmpty?: boolean;
}

/** Props del componente TreeView */
export interface TreeViewProps<T extends Record<string, unknown> = Record<string, unknown>>
  extends Omit<TreeNodeProps<T>, 'node' | 'level'> {
  /** Array de nodos raíz del árbol */
  data?: T[];
  /** Contenido a mostrar si no hay datos */
  emptyState?: ReactNode;
  /** Mostrar estado de carga */
  isLoading?: boolean;
  /** Contenido de carga personalizado */
  loadingState?: ReactNode;
}

/** Retorno del hook useTreeExpansion */
export interface UseTreeExpansionReturn {
  /** Estado de expansión actual */
  expanded: TreeExpandedState;
  /** Toggle expansión de un nodo */
  toggle: (nodeId: string | number) => void;
  /** Expandir todos los nodos */
  expandAll: <T extends Record<string, unknown>>(
    nodes: T[],
    childrenKey?: string,
    getNodeId?: (node: T) => string | number
  ) => void;
  /** Colapsar todos los nodos */
  collapseAll: () => void;
  /** Setter directo del estado */
  setExpanded: React.Dispatch<React.SetStateAction<TreeExpandedState>>;
}

// ============================================
// STANDARD ROW ACTIONS
// ============================================

/** Acción extra para StandardRowActions */
export interface ExtraAction<T = Record<string, unknown>> {
  /** Icono de la acción */
  icon: LucideIcon;
  /** Label de la acción */
  label: string;
  /** Callback al hacer click */
  onClick?: (row: T) => void;
  /** Si mostrar la acción */
  show?: boolean;
  /** Si está cargando */
  loading?: boolean;
  /** Si está deshabilitada */
  disabled?: boolean;
}

/** Props del componente StandardRowActions */
export interface StandardRowActionsProps<T = Record<string, unknown>> {
  /** Objeto de la fila */
  row: T;
  /** Handler para editar */
  onEdit?: (row: T) => void;
  /** Handler para eliminar */
  onDelete?: (row: T) => void | Promise<void>;
  /** Handler para ver detalle */
  onView?: (row: T) => void;
  /** Handler para estadísticas */
  onStats?: (row: T) => void;
  /** Si tiene permiso de editar */
  canEdit?: boolean;
  /** Si tiene permiso de eliminar */
  canDelete?: boolean;
  /** Usar dropdown en lugar de botones */
  compact?: boolean;
  /** Mostrar confirmación antes de eliminar */
  confirmDelete?: boolean;
  /** Mensaje de confirmación de eliminación */
  deleteMessage?: string;
  /** Nombre de la entidad para mensaje de confirmación */
  entityName?: string;
  /** Acciones adicionales */
  extraActions?: ExtraAction<T>[];
  /** Tamaño de botones */
  size?: 'xs' | 'sm';
  /** Clases adicionales */
  className?: string;
}

// ============================================
// EXPANDABLE CRUD SECTION
// ============================================

/** Configuración de eliminación para ExpandableCrudSection */
export interface DeleteConfig<T = Record<string, unknown>> {
  /** Título del diálogo de confirmación */
  title?: string;
  /** Función para generar el mensaje */
  getMessage: (item: T) => string;
  /** Mutation de TanStack Query */
  mutation: {
    mutateAsync: (params: Record<string, unknown>) => Promise<unknown>;
    isPending?: boolean;
  };
  /** Función para obtener parámetros de eliminación */
  getDeleteParams?: (item: T) => Record<string, unknown>;
  /** Mensaje de éxito */
  successMessage?: string;
  /** Mensaje de error */
  errorMessage?: string;
  /** Texto del botón confirmar */
  confirmText?: string;
  /** Texto del botón cancelar */
  cancelText?: string;
}

/** Acciones disponibles para items en ExpandableCrudSection */
export interface ItemActions {
  /** Callback para editar */
  onEdit: () => void;
  /** Callback para eliminar */
  onDelete: () => void;
}

/** Props de componente Drawer para ExpandableCrudSection */
export interface DrawerComponentProps<T = Record<string, unknown>> {
  /** Si el drawer está abierto */
  isOpen: boolean;
  /** Callback para cerrar */
  onClose: () => void;
  /** Callback al completar exitosamente */
  onSuccess: () => void;
  /** Item a editar (opcional) */
  [key: string]: unknown;
}

/** Props del componente ExpandableCrudSection */
export interface ExpandableCrudSectionProps<T extends { id?: string | number } = { id?: string | number }> {
  /** Icono del header */
  icon?: LucideIcon;
  /** Título de la sección */
  title: string;
  /** Conteo manual (si no se usa items.length) */
  count?: number;
  /** Si está expandido por defecto */
  defaultExpanded?: boolean;

  /** Array de items */
  items?: T[];
  /** Estado de carga */
  isLoading?: boolean;
  /** Error al cargar */
  error?: unknown;

  /** Mensaje cuando está vacío */
  emptyMessage?: string;
  /** Mensaje de carga */
  loadingMessage?: string;
  /** Mensaje de error */
  errorMessage?: string;
  /** Texto del botón agregar */
  addButtonText?: string;

  /** Render prop para cada item */
  renderItem?: (item: T, actions: ItemActions) => ReactNode;
  /** Render prop para la lista completa */
  renderList?: (items: T[], actions: { onEdit: (item: T) => void; onDelete: (item: T) => void }) => ReactNode;
  /** Clases para la lista */
  listClassName?: string;

  /** Configuración de eliminación */
  deleteConfig?: DeleteConfig<T>;

  /** Componente Drawer para crear/editar */
  DrawerComponent?: ComponentType<DrawerComponentProps<T>>;
  /** Props adicionales para el drawer */
  drawerProps?: Record<string, unknown>;
  /** Nombre del prop para pasar el item al drawer */
  itemPropName?: string;

  /** Acciones extra en el header */
  headerActions?: ReactNode;

  /** Callback cuando se inicia edición */
  onItemEdit?: (item: T) => void;
  /** Callback cuando se inicia eliminación */
  onItemDelete?: (item: T) => void;
}

// ============================================
// TAB NAVIGATION
// ============================================

/** Item de tab para navegación */
export interface TabItem {
  /** ID único del tab */
  id: string;
  /** Label visible */
  label: string;
  /** Icono opcional */
  icon?: LucideIcon;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Badge/conteo opcional */
  badge?: number | string;
}

/** Props comunes para componentes de tabs */
export interface TabNavigationProps {
  /** Tabs disponibles */
  tabs: TabItem[];
  /** Tab activo actual */
  activeTab: string;
  /** Callback al cambiar de tab */
  onTabChange: (tabId: string) => void;
  /** Clases adicionales */
  className?: string;
}

// ============================================
// FILTER PANEL
// ============================================

/** Configuración de filtro para panel */
export interface FilterConfig {
  /** Nombre del campo */
  name: string;
  /** Label visible */
  label: string;
  /** Tipo de campo */
  type: FilterFieldType;
  /** Opciones (para select) */
  options?: SelectOption[];
  /** Placeholder */
  placeholder?: string;
  /** Icono */
  icon?: LucideIcon;
  /** Ancho en grid (1-4) */
  colSpan?: 1 | 2 | 3 | 4;
}

/** Props del componente FilterPanel */
export interface FilterPanelProps {
  /** Configuración de filtros */
  filters: FilterConfig[];
  /** Valores actuales */
  values: Record<string, unknown>;
  /** Callback al cambiar valores */
  onChange: (values: Record<string, unknown>) => void;
  /** Callback al limpiar filtros */
  onClear?: () => void;
  /** Si hay filtros activos */
  hasActiveFilters?: boolean;
  /** Clases adicionales */
  className?: string;
}

// ============================================
// SEARCH FILTER BAR
// ============================================

/** Props del componente SearchFilterBar */
export interface SearchFilterBarProps {
  /** Valor de búsqueda */
  searchValue: string;
  /** Callback al cambiar búsqueda */
  onSearchChange: (value: string) => void;
  /** Placeholder del input */
  placeholder?: string;
  /** Callback al hacer submit */
  onSubmit?: () => void;
  /** Contenido adicional (filtros, botones) */
  children?: ReactNode;
  /** Clases adicionales */
  className?: string;
}

// ============================================
// CHECKBOX GROUP
// ============================================

/** Opción de checkbox */
export interface CheckboxOption {
  /** Valor único */
  value: string;
  /** Label visible */
  label: string;
  /** Descripción opcional */
  description?: string;
  /** Si está deshabilitada */
  disabled?: boolean;
}

/** Props del componente CheckboxGroup */
export interface CheckboxGroupProps {
  /** Opciones disponibles */
  options: CheckboxOption[];
  /** Valores seleccionados */
  value: string[];
  /** Callback al cambiar selección */
  onChange: (values: string[]) => void;
  /** Label del grupo */
  label?: string;
  /** Disposición: vertical u horizontal */
  orientation?: 'vertical' | 'horizontal';
  /** Clases adicionales */
  className?: string;
}

// ============================================
// MULTISELECT
// ============================================

/** Props del componente MultiSelect */
export interface MultiSelectProps {
  /** Opciones disponibles */
  options: SelectOption[];
  /** Valores seleccionados */
  value: (string | number)[];
  /** Callback al cambiar selección */
  onChange: (values: (string | number)[]) => void;
  /** Placeholder cuando no hay selección */
  placeholder?: string;
  /** Label del campo */
  label?: string;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Clases adicionales */
  className?: string;
}

// ============================================
// BARCODE SCANNER
// ============================================

/** Formatos de código de barras predefinidos */
export type BarcodeFormatPreset = 'all' | 'product' | 'qr' | 'linear';

/** Props del componente BarcodeScanner */
export interface BarcodeScannerProps {
  /** Callback al escanear un código */
  onScan: (code: string, data?: unknown) => void;
  /** Callback al cerrar */
  onClose?: () => void;
  /** Callback en caso de error */
  onError?: (error: Error) => void;
  /** Formatos a detectar */
  formats?: BarcodeFormatPreset | string[];
  /** Mostrar último código escaneado */
  showLastScan?: boolean;
  /** Iniciar automáticamente */
  autoStart?: boolean;
  /** Clases adicionales */
  className?: string;
}

// ============================================
// ICON PICKER
// ============================================

/** Props del componente IconPicker */
export interface IconPickerProps {
  /** Icono seleccionado (nombre) */
  value?: string;
  /** Callback al seleccionar icono */
  onChange: (iconName: string) => void;
  /** Label del campo */
  label?: string;
  /** Categorías a mostrar */
  categories?: string[];
  /** Clases adicionales */
  className?: string;
}
