/**
 * Hooks de Utilidades
 * Re-exports centralizados para hooks genéricos y reutilizables
 */

// UI y UX
export * from './useToast';
export * from './useModalManager';
export * from './useFormModal';
export * from './useDebounce';
export * from './useRecordNavigation';

// Datos y Filtros
export * from './useFilters';
export * from './useSavedFilters';
export * from './useExportCSV';

// Configuración y almacenamiento
export * from './useCurrency';
export * from './useStorage';

// CRUD genérico
export * from './useCrudHandlers';
export * from './useConfigCrud';

// Eventos DOM (Ene 2026 - Optimización arquitectónica)
export * from './useClickOutside';
export * from './useEscapeKey';

// Multi-tenant (Ene 2026 - Optimización arquitectónica)
export * from './useMultiTenantMutation';

// Confirmación de eliminación (Ene 2026 - Correcciones auditoría)
export * from './useDeleteConfirmation.jsx';

// Paginación (Ene 2026 - Correcciones auditoría)
export * from './usePagination';

// Media Queries (Ene 2026 - UX móvil)
export * from './useMediaQuery';

// Tab Form State (Feb 2026 - Refactorización eventos-digitales)
export * from './useTabFormState';
