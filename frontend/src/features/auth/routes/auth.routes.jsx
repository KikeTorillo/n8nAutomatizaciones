/**
 * Rutas de Autenticación
 * Incluye login, registro, recuperación de contraseña, etc.
 */

import { lazy } from 'react';
import { publicRoute, protectedRoute, ROLES } from '@/app/routes/helpers/routeHelpers';

// Lazy imports desde features/auth/pages
const LoginPage = lazy(() => import('../pages/Login'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPassword'));
const RegistroPage = lazy(() => import('../pages/RegistroPage'));
const RegistroInvitacionPage = lazy(() => import('../pages/RegistroInvitacionPage'));
const ActivarCuentaPage = lazy(() => import('../pages/ActivarCuentaPage'));
const MagicLinkVerifyPage = lazy(() => import('../pages/MagicLinkVerifyPage'));
const OnboardingPage = lazy(() => import('../pages/OnboardingPage'));

// InitialSetup permanece en pages/setup (no es parte del módulo auth)
const InitialSetup = lazy(() => import('@/pages/setup/InitialSetup'));

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
];
