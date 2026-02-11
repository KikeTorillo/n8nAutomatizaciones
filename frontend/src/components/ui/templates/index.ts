/**
 * UI Templates
 * Layouts de página y componentes de alto nivel
 */

export { BasePageLayout } from './BasePageLayout';
export { ListadoCRUDPage } from './ListadoCRUDPage';
export { createModuleLayout } from './createModuleLayout';

// Nuevos templates (Ene 2026)
export {
  BaseDetailLayout,
  DetailHeader,
  DetailLoadingState,
  DetailNotFoundState,
} from './BaseDetailLayout';
export {
  BaseFormLayout,
  FormHeader,
  FormWizardStepper,
  FormFooter,
} from './BaseFormLayout';
export { AsyncBoundary } from './AsyncBoundary';
export { PageHeader } from './PageHeader';
