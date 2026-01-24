/**
 * Rutas Públicas
 * Incluye marketplace, eventos públicos, sitios web, planes y pagos.
 */

import { lazy } from 'react';
import { publicRoute, indexRoute } from './helpers/routeHelpers';

// Landing
const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));

// Marketplace
const DirectorioMarketplacePage = lazy(() => import('@/pages/marketplace/DirectorioMarketplacePage'));
const PerfilPublicoPage = lazy(() => import('@/pages/marketplace/PerfilPublicoPage'));
const AgendarPublicoPage = lazy(() => import('@/pages/marketplace/AgendarPublicoPage'));

// Eventos Digitales Públicos
const EventoPublicoPage = lazy(() => import('@/pages/eventos-digitales/EventoPublicoPage'));

// Website Público
const SitioPublicoPage = lazy(() => import('@/pages/public/SitioPublicoPage'));

// POS Display (pantalla cliente)
const CustomerDisplayPage = lazy(() => import('@/pages/pos/CustomerDisplayPage'));

// Planes y Pagos
const PlanesPublicPage = lazy(() => import('@/pages/planes/PlanesPublicPage'));
const PaymentCallbackPage = lazy(() => import('@/pages/payment/PaymentCallbackPage'));

// Checkout Público (Customer Billing)
const CheckoutPublicoPage = lazy(() => import('@/pages/checkout/CheckoutPublicoPage'));

export const publicRoutes = [
  // Landing page (index)
  indexRoute(LandingPage),

  // Marketplace público
  publicRoute('marketplace', DirectorioMarketplacePage),

  // Eventos digitales públicos
  publicRoute('e/:slug', EventoPublicoPage),
  publicRoute('e/:slug/:token', EventoPublicoPage),

  // Website público
  publicRoute('sitio/:slug', SitioPublicoPage),
  publicRoute('sitio/:slug/:pagina', SitioPublicoPage),

  // POS Display (pantalla secundaria para cliente)
  publicRoute('pos/display', CustomerDisplayPage),

  // Planes de suscripción (público)
  publicRoute('planes', PlanesPublicPage),
  publicRoute('elegir-plan', PlanesPublicPage),

  // Callback de pago (MercadoPago)
  publicRoute('payment/callback', PaymentCallbackPage),

  // Checkout público para clientes de organizaciones (Customer Billing)
  publicRoute('checkout/:token', CheckoutPublicoPage),

  // Agendar público (marketplace)
  publicRoute('agendar/:slug', AgendarPublicoPage),

  // Perfil público de negocio - DEBE IR AL FINAL (catch-all)
  publicRoute(':slug', PerfilPublicoPage),
];
