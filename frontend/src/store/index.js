/**
 * ====================================================================
 * STORES - Barrel Export
 * ====================================================================
 * Re-exporta todos los stores y selectores de Zustand.
 * Permite imports centralizados: import { useAuthStore, selectUser } from '@/store';
 */

// ========== AUTH STORE ==========
export { default as useAuthStore } from './authStore';
export {
  selectUser,
  selectIsAuthenticated,
  selectSetAuth,
  selectSetTokens,
  selectSetUser,
  selectLogout,
  // Selectores legacy (deprecated - causan re-renders)
  selectHasRole,
  selectIsAdmin,
  selectGetOrganizacionId,
  // Selectores optimizados (retornan valores, no funciones)
  selectIsAdminValue,
  createSelectHasRole,
  selectOrganizacionId,
  selectUserRol,
  selectUserId,
} from './authStore';

// ========== SUCURSAL STORE ==========
export { default as useSucursalStore } from './sucursalStore';
export {
  selectSucursalActiva,
  selectSucursalesDisponibles,
  selectSetSucursalActiva,
  selectSetSucursalesDisponibles,
  selectGetSucursalId,
  selectEsMatriz,
  selectTieneMultiplesSucursales,
  selectClear as selectSucursalClear,
} from './sucursalStore';

// ========== THEME STORE ==========
export { default as useThemeStore } from './themeStore';
export {
  selectTheme,
  selectResolvedTheme,
  selectSetTheme,
  selectToggleTheme,
  selectApplyTheme,
  selectInitSystemListener,
  selectIsDark,
} from './themeStore';

// ========== PERMISOS STORE ==========
export { default as usePermisosStore } from './permisosStore';
export {
  selectPermisos,
  selectPermisosVerificados,
  selectUltimaSincronizacion,
  // Selectores legacy (deprecated - causan re-renders)
  selectTienePermiso,
  selectNecesitaSincronizar,
  selectEstaEnCache,
  // Selectores optimizados (retornan valores, no funciones)
  createSelectTienePermiso,
  selectNecesitaSincronizarValue,
  createSelectEstaEnCache,
  // Actions
  selectSetPermisoVerificado,
  selectSetMultiplesPermisos,
  selectSetPermisos,
  selectInvalidarSucursal,
  selectInvalidarCache,
  selectRefrescarSincronizacion,
  selectClear as selectPermisosClear,
} from './permisosStore';

// ========== ONBOARDING STORE ==========
export { default as useOnboardingStore } from './onboardingStore';
export {
  selectFormData,
  selectRegistroEnviado,
  selectEmailEnviado,
  selectOrganizacionId,
  selectUpdateFormData,
  selectSetRegistroEnviado,
  selectSetOrganizacionId,
  selectResetOnboarding,
} from './onboardingStore';
