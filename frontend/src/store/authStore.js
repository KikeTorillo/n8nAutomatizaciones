import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  setAccessToken,
  clearAccessToken,
  resetTokenManager,
} from '@/services/auth/tokenManager';

/**
 * Store de autenticación con Zustand
 * Ene 2026: Tokens migrados a memoria para prevenir XSS
 *
 * - accessToken: Solo en memoria (tokenManager.js)
 * - refreshToken: Solo en cookie httpOnly (backend)
 * - user + isAuthenticated: Persisten en localStorage
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // ========== STATE ==========
      // Ene 2026: Tokens removidos del store - ahora en memoria/cookie
      user: null,
      isAuthenticated: false,

      // ========== ACTIONS ==========

      /**
       * Establecer autenticación después de login/registro
       * Ene 2026: accessToken va a memoria, refreshToken ignorado (viene por cookie)
       * @param {Object} data - { user, accessToken }
       */
      setAuth: (data) => {
        // Guardar accessToken en memoria
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        }

        set({
          user: data.user,
          isAuthenticated: true,
        });
      },

      /**
       * Actualizar solo el accessToken (usado en refresh)
       * Ene 2026: Solo actualiza memoria, refreshToken viene por cookie
       * @param {Object} tokens - { accessToken }
       */
      setTokens: (tokens) => {
        if (tokens.accessToken) {
          setAccessToken(tokens.accessToken);
        }
      },

      /**
       * Actualizar información del usuario
       * @param {Object} user
       */
      setUser: (user) => {
        set({ user });
      },

      /**
       * Logout - Limpiar todo el estado
       * Ene 2026: También limpia tokenManager
       */
      logout: () => {
        // Limpiar token de memoria
        resetTokenManager();

        set({
          user: null,
          isAuthenticated: false,
        });
      },

      /**
       * Verificar si el usuario tiene un rol específico
       * @param {string} rol
       * @returns {boolean}
       */
      hasRole: (rol) => {
        const { user } = get();
        return user?.rol === rol;
      },

      /**
       * Verificar si el usuario es admin o propietario
       * @returns {boolean}
       */
      isAdmin: () => {
        const { user } = get();
        return ['super_admin', 'propietario', 'admin'].includes(user?.rol);
      },

      /**
       * Obtener organización del usuario
       * @returns {number|null}
       */
      getOrganizacionId: () => {
        const { user } = get();
        return user?.organizacion_id || null;
      },
    }),
    {
      name: 'auth-storage', // Nombre en localStorage
      // Ene 2026: Solo persistir user e isAuthenticated (NO tokens)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ====================================================================
// SELECTORES - Ene 2026: Optimización para evitar re-renders
// Usar estos selectores en lugar de desestructurar todo el store
// ====================================================================

// State
export const selectUser = (state) => state.user;
export const selectIsAuthenticated = (state) => state.isAuthenticated;

// Actions
export const selectSetAuth = (state) => state.setAuth;
export const selectSetTokens = (state) => state.setTokens;
export const selectSetUser = (state) => state.setUser;
export const selectLogout = (state) => state.logout;
export const selectHasRole = (state) => state.hasRole;
export const selectIsAdmin = (state) => state.isAdmin;
export const selectGetOrganizacionId = (state) => state.getOrganizacionId;

export default useAuthStore;
