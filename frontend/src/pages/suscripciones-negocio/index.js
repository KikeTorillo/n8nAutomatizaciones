/**
 * ====================================================================
 * PAGES INDEX - SUSCRIPCIONES NEGOCIO
 * ====================================================================
 * Lazy exports para code splitting.
 */

import { lazy } from 'react';

// Lazy load pages
export const SuscripcionesNegocioPage = lazy(() => import('./SuscripcionesNegocioPage'));
export const PlanesPage = lazy(() => import('./PlanesPage'));
export const CuponesPage = lazy(() => import('./CuponesPage'));
export const PagosPage = lazy(() => import('./PagosPage'));
export const SuscripcionesListPage = lazy(() => import('./SuscripcionesListPage'));
export const SuscripcionDetailPage = lazy(() => import('./SuscripcionDetailPage'));
export const MetricasPage = lazy(() => import('./MetricasPage'));
