/**
 * @fileoverview Feature Auth - Exportaciones públicas
 * @description Centraliza todas las exportaciones del feature de autenticación
 * @version 2.0.0
 *
 * Este módulo contiene:
 * - Store de autenticación (Zustand)
 * - API de autenticación
 * - Token Manager
 * - Componentes de auth
 * - Páginas de auth
 * - Rutas de auth
 */

// ========== Store ==========
export { default as useAuthStore } from './store/authStore';
export {
  selectUser,
  selectIsAuthenticated,
  selectSetAuth,
  selectSetTokens,
  selectSetUser,
  selectLogout,
  selectHasRole,
  selectIsAdmin,
  selectGetOrganizacionId,
  selectIsAdminValue,
  createSelectHasRole,
  selectOrganizacionId,
  selectRolCodigo,
  selectNivelJerarquia,
  selectRolNombre,
  selectUserId,
  selectUserRol,
} from './store/authStore';

// ========== API ==========
export { authApi } from './api/auth.api';

// ========== Services ==========
export {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  hasToken,
  getIsRefreshing,
  setIsRefreshing,
  subscribeToRefresh,
  notifyRefreshSubscribers,
  resetTokenManager,
} from './services/tokenManager';

// ========== Componentes ==========
export {
  AuthLayout,
  ProtectedRoute,
  NIVEL_MINIMO_POR_ROL,
  hasRoleAccess,
  SetupGuard,
  GoogleSignInButton,
  PasswordStrengthIndicator,
} from './components';

// ========== Páginas ==========
export {
  Login,
  RegistroPage,
  ForgotPassword,
  ResetPassword,
  ActivarCuentaPage,
  MagicLinkVerifyPage,
  OnboardingPage,
  RegistroInvitacionPage,
} from './pages';

// ========== Rutas ==========
export { authRoutes } from './routes';
