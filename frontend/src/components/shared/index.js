/**
 * Barrel export para componentes compartidos entre módulos
 */
export {
  UnsplashModal,
  UnsplashGrid,
  useUnsplashSearch,
} from './media/UnsplashPicker';

// Calendar
export { AddToCalendar } from './calendar';

// Documentos
export { DocumentoUploadDrawer } from './DocumentoUploadDrawer';

// Alertas
export { default as AlertaBloqueado } from './AlertaBloqueado';

// Invitación Dinámica (bridge para módulos externos)
export { InvitacionDinamica } from './InvitacionDinamica';
