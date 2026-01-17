/**
 * Rutas de Autenticación
 * Incluye login, registro, recuperación de contraseña, etc.
 */

import { lazy } from 'react';
import { publicRoute, protectedRoute, ROLES } from './helpers/routeHelpers';

// Lazy imports
const LoginPage = lazy(() => import('@/pages/auth/Login'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPassword'));
const RegistroPage = lazy(() => import('@/pages/auth/RegistroPage'));
const RegistroInvitacionPage = lazy(() => import('@/pages/auth/RegistroInvitacionPage'));
const ActivarCuentaPage = lazy(() => import('@/pages/auth/ActivarCuentaPage'));
const MagicLinkVerifyPage = lazy(() => import('@/pages/auth/MagicLinkVerifyPage'));
const OnboardingPage = lazy(() => import('@/pages/auth/OnboardingPage'));
const InitialSetup = lazy(() => import('@/pages/setup/InitialSetup'));

// Suscripción
const ActivarSuscripcion = lazy(() => import('@/pages/subscripcion/ActivarSuscripcion'));
const SubscripcionResultado = lazy(() => import('@/pages/subscripcion/SubscripcionResultado'));

export const authRoutes = [
  // Rutas de autenticación con prefijo /auth/
  publicRoute('auth/login', LoginPage),
  publicRoute('auth/forgot-password', ForgotPasswordPage),
  publicRoute('auth/reset-password/:token', ResetPasswordPage),
  publicRoute('auth/magic-link/:token', MagicLinkVerifyPage),

  // Ruta legacy de login (sin prefijo)
  publicRoute('login', LoginPage),

  // Registro
  publicRoute('registro', RegistroPage),
  publicRoute('registro-invitacion/:token', RegistroInvitacionPage),
  publicRoute('activar-cuenta/:token', ActivarCuentaPage),

  // Onboarding para usuarios OAuth sin organización
  publicRoute('onboarding', OnboardingPage),

  // Setup inicial
  publicRoute('setup', InitialSetup),

  // Suscripción
  protectedRoute('suscripcion', ActivarSuscripcion, { requiredRole: ROLES.ALL_AUTHENTICATED }),
  publicRoute('subscripcion/resultado', SubscripcionResultado),
];
