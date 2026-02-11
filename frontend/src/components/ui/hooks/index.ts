// Hooks de estado y datos
export { usePagination, normalizePagination } from './usePagination';
export type {
  UsePaginationOptions,
  PaginationInfo,
  UsePaginationReturn,
} from './usePagination';

export { useModalManager, useSimpleModal } from './useModalManager';
export type { ModalState } from './useModalManager';

export { useDeleteConfirmation } from './useDeleteConfirmation';
export type {
  DeleteConfirmationOptions,
  DeleteConfirmProps,
  DeleteConfirmationReturn,
} from './useDeleteConfirmation';

export { useFilters } from './useFilters';
export type {
  UseFiltersOptions,
  UseFiltersReturn,
  FilterPersistence,
} from './useFilters';

export { useExportCSV } from './useExportCSV';

export { useToast } from './useToast';
export type { UseToastReturn, ToastType } from './useToast';

export { useDisclosure } from './useDisclosure';
export { usePrevious } from './usePrevious';
export { useMediaQuery } from './useMediaQuery';

// Hooks DOM
export { useClickOutside, useClickOutsideRef } from './useClickOutside';
export { useEscapeKey } from './useEscapeKey';
export { useCombineRefs } from './useCombineRefs';
export { useFloatingPosition } from './useFloatingPosition';
export type { Placement } from './useFloatingPosition';
export { useFloatingDismiss } from './useFloatingDismiss';

// Hooks UI internos
export { useProgressColor } from './useProgressColor';
export { useIconPickerLogic } from './useIconPickerLogic';
export { useExpandableCrudLogic } from './useExpandableCrudLogic';
export type {
  UseExpandableCrudLogicOptions,
  UseExpandableCrudLogicReturn,
} from './useExpandableCrudLogic';

// Hook de scanner
export {
  useBarcodeScanner,
  BARCODE_FORMATS,
  FORMAT_PRESETS,
} from './useBarcodeScanner';
