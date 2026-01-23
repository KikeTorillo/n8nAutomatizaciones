import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
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
  devtools(
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
       * FASE 7: Usa rol_codigo en vez de rol ENUM
       * @param {string} rol - Código del rol
       * @returns {boolean}
       */
      hasRole: (rol) => {
        const { user } = get();
        return user?.rol_codigo === rol;
      },

      /**
       * Verificar si el usuario es admin o propietario
       * FASE 7: Usa nivel_jerarquia >= 80
       * @returns {boolean}
       */
      isAdmin: () => {
        const { user } = get();
        return user?.nivel_jerarquia >= 80;
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
    ),
    { name: 'AuthStore', enabled: import.meta.env.DEV }
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

// Funciones del store (causan re-renders - usar con precaución)
/** @deprecated Use createSelectHasRole(rol) para mejor rendimiento */
export const selectHasRole = (state) => state.hasRole;
/** @deprecated Use selectIsAdminValue para mejor rendimiento */
export const selectIsAdmin = (state) => state.isAdmin;
/** @deprecated Use selectOrganizacionId para mejor rendimiento */
export const selectGetOrganizacionId = (state) => state.getOrganizacionId;

// ====================================================================
// SELECTORES OPTIMIZADOS - Retornan valores derivados, no funciones
// FASE 7 COMPLETADA: Usar rol_codigo y nivel_jerarquia en vez de rol ENUM
// ====================================================================

/**
 * Selector que retorna si el usuario es admin/propietario (nivel_jerarquia >= 80)
 */
export const selectIsAdminValue = (state) =>
  state.user?.nivel_jerarquia >= 80;

/**
 * Factory para crear selector de rol específico
 * FASE 7: Usa rol_codigo
 * @example
 * const selectEsEmpleado = createSelectHasRole('empleado');
 * const esEmpleado = useAuthStore(selectEsEmpleado);
 */
export const createSelectHasRole = (rolCodigo) => (state) =>
  state.user?.rol_codigo === rolCodigo;

/**
 * Selector que retorna el ID de organización directamente
 */
export const selectOrganizacionId = (state) =>
  state.user?.organizacion_id || null;

/**
 * Selector que retorna el código de rol del usuario
 * FASE 7: Reemplaza selectUserRol que usaba ENUM
 */
export const selectRolCodigo = (state) => state.user?.rol_codigo || null;

/**
 * Selector que retorna el nivel jerárquico del usuario
 * Valores: 100 (super_admin), 80 (admin/propietario), 50 (gerente), 10 (empleado), 5 (bot)
 */
export const selectNivelJerarquia = (state) => state.user?.nivel_jerarquia || 10;

/**
 * Selector que retorna el nombre legible del rol
 */
export const selectRolNombre = (state) => state.user?.rol_nombre || null;

/**
 * Selector que retorna el ID del usuario directamente
 */
export const selectUserId = (state) => state.user?.id || null;

/**
 * @deprecated Use selectRolCodigo en vez de selectUserRol
 */
export const selectUserRol = (state) => state.user?.rol_codigo || null;

export default useAuthStore;
