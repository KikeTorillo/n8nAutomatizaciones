import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store de autenticación con Zustand
 * Maneja el estado del usuario, tokens y sesión
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // ========== STATE ==========
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // ========== ACTIONS ==========

      /**
       * Establecer tokens y usuario después de login/registro
       * @param {Object} data - { user, accessToken, refreshToken }
       */
      setAuth: (data) => {
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        });
      },

      /**
       * Actualizar solo los tokens (usado en refresh)
       * @param {Object} tokens - { accessToken, refreshToken }
       */
      setTokens: (tokens) => {
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
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
       */
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
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
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
