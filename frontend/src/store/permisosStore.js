import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store para cache de permisos del usuario
 *
 * Optimiza las verificaciones de permisos evitando llamadas
 * repetidas al backend para el mismo permiso/sucursal
 *
 * Cache expira después de 5 minutos y se invalida al:
 * - Cambiar de sucursal
 * - Hacer logout
 */

const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutos

const usePermisosStore = create(
  persist(
    (set, get) => ({
      // ========== STATE ==========

      /**
       * Array de códigos de permiso del usuario actual
       * @type {string[]}
       */
      permisos: [],

      /**
       * Cache de permisos verificados
       * Key: `${codigo}:${sucursalId}`, Value: boolean
       * @type {Object.<string, boolean>}
       */
      permisosVerificados: {},

      /**
       * Timestamp de última sincronización
       * @type {number|null}
       */
      ultimaSincronizacion: null,

      // ========== GETTERS ==========

      /**
       * Verificar si tiene un permiso (desde cache)
       * @param {string} codigo - Código del permiso
       * @param {number} sucursalId - ID de la sucursal
       * @returns {boolean|null} - true/false si está en cache, null si no verificado
       */
      tienePermiso: (codigo, sucursalId) => {
        const { permisosVerificados, necesitaSincronizar } = get();

        // Si el cache está expirado, retornar null
        if (necesitaSincronizar()) {
          return null;
        }

        const key = `${codigo}:${sucursalId}`;
        const cached = permisosVerificados[key];

        return cached !== undefined ? cached : null;
      },

      /**
       * Verificar si el cache necesita sincronización (expirado > 5 min)
       * @returns {boolean}
       */
      necesitaSincronizar: () => {
        const { ultimaSincronizacion } = get();
        if (!ultimaSincronizacion) return true;
        return Date.now() - ultimaSincronizacion > CACHE_EXPIRY_MS;
      },

      /**
       * Verificar si un permiso está cacheado (sin importar si está expirado)
       * @param {string} codigo - Código del permiso
       * @param {number} sucursalId - ID de la sucursal
       * @returns {boolean}
       */
      estaEnCache: (codigo, sucursalId) => {
        const { permisosVerificados } = get();
        const key = `${codigo}:${sucursalId}`;
        return permisosVerificados[key] !== undefined;
      },

      // ========== ACTIONS ==========

      /**
       * Guardar resultado de verificación de permiso
       * @param {string} codigo - Código del permiso
       * @param {number} sucursalId - ID de la sucursal
       * @param {boolean} tiene - Si tiene el permiso o no
       */
      setPermisoVerificado: (codigo, sucursalId, tiene) => {
        set((state) => ({
          permisosVerificados: {
            ...state.permisosVerificados,
            [`${codigo}:${sucursalId}`]: tiene,
          },
          ultimaSincronizacion: state.ultimaSincronizacion || Date.now(),
        }));
      },

      /**
       * Guardar múltiples permisos verificados de una vez
       * @param {Array<{codigo: string, sucursalId: number, tiene: boolean}>} permisos
       */
      setMultiplesPermisos: (permisos) => {
        const nuevosPermisos = {};
        permisos.forEach(({ codigo, sucursalId, tiene }) => {
          nuevosPermisos[`${codigo}:${sucursalId}`] = tiene;
        });

        set((state) => ({
          permisosVerificados: {
            ...state.permisosVerificados,
            ...nuevosPermisos,
          },
          ultimaSincronizacion: Date.now(),
        }));
      },

      /**
       * Cargar permisos iniciales del usuario
       * @param {string[]} permisos - Array de códigos de permiso
       */
      setPermisos: (permisos) => {
        set({
          permisos,
          ultimaSincronizacion: Date.now(),
        });
      },

      /**
       * Invalidar cache de una sucursal específica
       * Útil cuando el usuario cambia de sucursal
       * @param {number} sucursalId - ID de la sucursal a invalidar
       */
      invalidarSucursal: (sucursalId) => {
        const { permisosVerificados } = get();
        const nuevosPermisos = {};

        // Mantener solo los permisos de otras sucursales
        Object.entries(permisosVerificados).forEach(([key, value]) => {
          if (!key.endsWith(`:${sucursalId}`)) {
            nuevosPermisos[key] = value;
          }
        });

        set({
          permisosVerificados: nuevosPermisos,
        });
      },

      /**
       * Invalidar todo el cache de permisos
       * Se usa al cambiar de sucursal o cuando cambian los permisos
       */
      invalidarCache: () => {
        set({
          permisosVerificados: {},
          ultimaSincronizacion: null,
        });
      },

      /**
       * Refrescar timestamp de sincronización
       * Útil para extender la validez del cache después de una verificación exitosa
       */
      refrescarSincronizacion: () => {
        set({
          ultimaSincronizacion: Date.now(),
        });
      },

      /**
       * Limpiar todo el store (para logout)
       */
      clear: () => {
        set({
          permisos: [],
          permisosVerificados: {},
          ultimaSincronizacion: null,
        });
      },
    }),
    {
      name: 'permisos-storage',
      partialize: (state) => ({
        // Persistir cache para evitar re-verificaciones al recargar
        permisos: state.permisos,
        permisosVerificados: state.permisosVerificados,
        ultimaSincronizacion: state.ultimaSincronizacion,
      }),
    }
  )
);

export default usePermisosStore;
