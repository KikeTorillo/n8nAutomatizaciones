import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  setAccessToken,
  resetTokenManager,
} from '../services/tokenManager';

// ========== TYPES ==========

interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  organizacion_id: number;
  rol_codigo: string;
  rol_nombre: string;
  nivel_jerarquia: number;
  [key: string]: unknown;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (data: { user: AuthUser; accessToken?: string }) => void;
  setTokens: (tokens: { accessToken?: string }) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  hasRole: (rol: string) => boolean;
  isAdmin: () => boolean;
  getOrganizacionId: () => number | null;
}

/**
 * Store de autenticación con Zustand
 * Ene 2026: Tokens migrados a memoria para prevenir XSS
 */
const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (data) => {
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        }
        set({
          user: data.user,
          isAuthenticated: true,
        });
      },

      setTokens: (tokens) => {
        if (tokens.accessToken) {
          setAccessToken(tokens.accessToken);
        }
      },

      setUser: (user) => {
        set({ user });
      },

      logout: () => {
        resetTokenManager();
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      hasRole: (rol) => {
        const { user } = get();
        return user?.rol_codigo === rol;
      },

      isAdmin: () => {
        const { user } = get();
        return (user?.nivel_jerarquia ?? 0) >= 80;
      },

      getOrganizacionId: () => {
        const { user } = get();
        return user?.organizacion_id || null;
      },
    }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore', enabled: import.meta.env.DEV }
  )
);

// ====================================================================
// SELECTORES
// ====================================================================

export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;

export const selectSetAuth = (state: AuthState) => state.setAuth;
export const selectSetTokens = (state: AuthState) => state.setTokens;
export const selectSetUser = (state: AuthState) => state.setUser;
export const selectLogout = (state: AuthState) => state.logout;

/** @deprecated Use createSelectHasRole(rol) para mejor rendimiento */
export const selectHasRole = (state: AuthState) => state.hasRole;
/** @deprecated Use selectIsAdminValue para mejor rendimiento */
export const selectIsAdmin = (state: AuthState) => state.isAdmin;
/** @deprecated Use selectOrganizacionId para mejor rendimiento */
export const selectGetOrganizacionId = (state: AuthState) => state.getOrganizacionId;

// ====================================================================
// SELECTORES OPTIMIZADOS
// ====================================================================

export const selectIsAdminValue = (state: AuthState) =>
  (state.user?.nivel_jerarquia ?? 0) >= 80;

export const createSelectHasRole = (rolCodigo: string) => (state: AuthState) =>
  state.user?.rol_codigo === rolCodigo;

export const selectOrganizacionId = (state: AuthState) =>
  state.user?.organizacion_id || null;

export const selectRolCodigo = (state: AuthState) => state.user?.rol_codigo || null;

export const selectNivelJerarquia = (state: AuthState) => state.user?.nivel_jerarquia || 10;

export const selectRolNombre = (state: AuthState) => state.user?.rol_nombre || null;

export const selectUserId = (state: AuthState) => state.user?.id || null;

/** @deprecated Use selectRolCodigo en vez de selectUserRol */
export const selectUserRol = (state: AuthState) => state.user?.rol_codigo || null;

export default useAuthStore;
