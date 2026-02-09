/**
 * Rutas B2C — Plataforma de Invitaciones Digitales
 *
 * Públicas: landing, precios, tipos de evento, ejemplos, crear, editor borrador
 * Protegidas: mis eventos, dashboard, compartir, invitados, galería
 *
 * NOTA: El editor de invitación real está en /eventos-digitales/:id/editor
 */

import { lazy } from 'react';
import { publicRoute, protectedRoute, ROLES } from './helpers/routeHelpers';

// --- Públicas ---
const LandingInvitacionesPage = lazy(() => import('@/pages/invitaciones/landing/LandingInvitacionesPage'));
const PreciosInvitacionesPage = lazy(() => import('@/pages/invitaciones/precios/PreciosInvitacionesPage'));
const TipoEventoPage = lazy(() => import('@/pages/invitaciones/tipos/TipoEventoPage'));
const EjemplosPage = lazy(() => import('@/pages/invitaciones/tipos/EjemplosPage'));
const CrearEventoWizardPage = lazy(() => import('@/pages/invitaciones/crear/CrearEventoWizardPage'));
const BorradorEditorPage = lazy(() => import('@/pages/invitaciones/editor/BorradorEditorPage'));

// --- Protegidas ---
const MisEventosPage = lazy(() => import('@/pages/invitaciones/dashboard/MisEventosPage'));
const EventoDashboardPage = lazy(() => import('@/pages/invitaciones/dashboard/EventoDashboardPage'));
const InvitadosManagerPage = lazy(() => import('@/pages/invitaciones/evento/InvitadosManagerPage'));
const CompartirPage = lazy(() => import('@/pages/invitaciones/evento/CompartirPage'));
const GaleriaModeracionPage = lazy(() => import('@/pages/invitaciones/evento/GaleriaModeracionPage'));

export const invitacionesRoutes = [
  // --- Públicas (sin auth) ---
  publicRoute('invitaciones', LandingInvitacionesPage),
  publicRoute('invitaciones/precios', PreciosInvitacionesPage),
  publicRoute('invitaciones/bodas', TipoEventoPage),
  publicRoute('invitaciones/xv-anos', TipoEventoPage),
  publicRoute('invitaciones/bautizos', TipoEventoPage),
  publicRoute('invitaciones/cumpleanos', TipoEventoPage),
  publicRoute('invitaciones/ejemplos', EjemplosPage),
  publicRoute('invitaciones/crear', CrearEventoWizardPage),
  publicRoute('invitaciones/editor', BorradorEditorPage),

  // --- Protegidas (auth requerido) ---
  protectedRoute('invitaciones/mis-eventos', MisEventosPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('invitaciones/evento/:id', EventoDashboardPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('invitaciones/evento/:id/invitados', InvitadosManagerPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('invitaciones/evento/:id/compartir', CompartirPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  protectedRoute('invitaciones/evento/:id/galeria', GaleriaModeracionPage, { requiredRole: ROLES.ALL_AUTHENTICATED }),
];
