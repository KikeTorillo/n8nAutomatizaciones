/**
 * ====================================================================
 * COMPONENTES CLIENTES - BARREL EXPORTS
 * ====================================================================
 *
 * Re-exports centralizados de componentes del módulo Clientes/CRM
 *
 * Ene 2026 - Refactorización Frontend
 * ====================================================================
 */

// Layout y Navegación
export { default as ClientesPageLayout } from './ClientesPageLayout';
export { default as ClientesNavTabs } from './ClientesNavTabs';

// Lista y Cards
export { default as ClientesList } from './ClientesList';
export { default as ClientesCardsGrid } from './ClientesCardsGrid';
export { default as ClienteCard } from './ClienteCard';

// Formularios
export { default as ClienteForm } from './ClienteForm';
export { default as EtiquetaFormDrawer } from './EtiquetaFormDrawer';
export { default as OportunidadFormDrawer } from './OportunidadFormDrawer';
export { default as TareaDrawer } from './TareaDrawer';
export { default as DocumentoUploadDrawer } from './DocumentoUploadDrawer';

// Modales
export { default as ImportarClientesModal } from './ImportarClientesModal';
export { default as WalkInModal } from './WalkInModal';

// Timeline y Actividades
export { default as ClienteTimeline } from './ClienteTimeline';
export { default as TimelineItem } from './TimelineItem';
export { default as QuickNoteInput } from './QuickNoteInput';

// Etiquetas
export { default as EtiquetasBadges } from './EtiquetasBadges';
export { default as EtiquetasSelector } from './EtiquetasSelector';
export { default as ClienteEtiquetasEditor } from './ClienteEtiquetasEditor';

// Kanban / Pipeline
export { default as PipelineKanban } from './PipelineKanban';
export { default as KanbanColumn } from './KanbanColumn';
export { default as KanbanCard } from './KanbanCard';
