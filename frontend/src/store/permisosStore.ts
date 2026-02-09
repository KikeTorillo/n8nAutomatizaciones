import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ========== TYPES ==========

interface PermisoVerificadoInput {
  codigo: string;
  sucursalId: number;
  tiene: boolean;
}

interface PermisosState {
  permisos: string[];
  permisosVerificados: Record<string, boolean>;
  ultimaSincronizacion: number | null;
  tienePermiso: (codigo: string, sucursalId: number) => boolean | null;
  necesitaSincronizar: () => boolean;
  estaEnCache: (codigo: string, sucursalId: number) => boolean;
  setPermisoVerificado: (codigo: string, sucursalId: number, tiene: boolean) => void;
  setMultiplesPermisos: (permisos: PermisoVerificadoInput[]) => void;
  setPermisos: (permisos: string[]) => void;
  invalidarSucursal: (sucursalId: number) => void;
  invalidarCache: () => void;
  refrescarSincronizacion: () => void;
  clear: () => void;
}

const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutos

const usePermisosStore = create<PermisosState>()(
  devtools(
    persist(
      (set, get) => ({
      permisos: [],
      permisosVerificados: {},
      ultimaSincronizacion: null,

      tienePermiso: (codigo, sucursalId) => {
        const { permisosVerificados, necesitaSincronizar } = get();
        if (necesitaSincronizar()) return null;
        const key = `${codigo}:${sucursalId}`;
        const cached = permisosVerificados[key];
        return cached !== undefined ? cached : null;
      },

      necesitaSincronizar: () => {
        const { ultimaSincronizacion } = get();
        if (!ultimaSincronizacion) return true;
        return Date.now() - ultimaSincronizacion > CACHE_EXPIRY_MS;
      },

      estaEnCache: (codigo, sucursalId) => {
        const { permisosVerificados } = get();
        const key = `${codigo}:${sucursalId}`;
        return permisosVerificados[key] !== undefined;
      },

      setPermisoVerificado: (codigo, sucursalId, tiene) => {
        set((state) => ({
          permisosVerificados: {
            ...state.permisosVerificados,
            [`${codigo}:${sucursalId}`]: tiene,
          },
          ultimaSincronizacion: state.ultimaSincronizacion || Date.now(),
        }));
      },

      setMultiplesPermisos: (permisos) => {
        const nuevosPermisos: Record<string, boolean> = {};
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

      setPermisos: (permisos) => {
        set({
          permisos,
          ultimaSincronizacion: Date.now(),
        });
      },

      invalidarSucursal: (sucursalId) => {
        const { permisosVerificados } = get();
        const nuevosPermisos: Record<string, boolean> = {};
        Object.entries(permisosVerificados).forEach(([key, value]) => {
          if (!key.endsWith(`:${sucursalId}`)) {
            nuevosPermisos[key] = value;
          }
        });
        set({ permisosVerificados: nuevosPermisos });
      },

      invalidarCache: () => {
        set({ permisosVerificados: {}, ultimaSincronizacion: null });
      },

      refrescarSincronizacion: () => {
        set({ ultimaSincronizacion: Date.now() });
      },

      clear: () => {
        set({ permisos: [], permisosVerificados: {}, ultimaSincronizacion: null });
      },
    }),
      {
        name: 'permisos-storage',
        partialize: (state) => ({
          permisos: state.permisos,
          permisosVerificados: state.permisosVerificados,
          ultimaSincronizacion: state.ultimaSincronizacion,
        }),
      }
    ),
    { name: 'PermisosStore', enabled: import.meta.env.DEV }
  )
);

export default usePermisosStore;

// ====================================================================
// SELECTORES
// ====================================================================

export const selectPermisos = (state: PermisosState) => state.permisos;
export const selectPermisosVerificados = (state: PermisosState) => state.permisosVerificados;
export const selectUltimaSincronizacion = (state: PermisosState) => state.ultimaSincronizacion;

/** @deprecated Use createSelectTienePermiso(codigo, sucursalId) */
export const selectTienePermiso = (state: PermisosState) => state.tienePermiso;
/** @deprecated Use selectNecesitaSincronizarValue */
export const selectNecesitaSincronizar = (state: PermisosState) => state.necesitaSincronizar;
export const selectEstaEnCache = (state: PermisosState) => state.estaEnCache;

// ====================================================================
// SELECTORES OPTIMIZADOS
// ====================================================================

export const createSelectTienePermiso = (codigo: string, sucursalId: number) => (state: PermisosState) => {
  if (!state.ultimaSincronizacion ||
      Date.now() - state.ultimaSincronizacion > CACHE_EXPIRY_MS) {
    return null;
  }
  const key = `${codigo}:${sucursalId}`;
  const cached = state.permisosVerificados[key];
  return cached !== undefined ? cached : null;
};

export const selectNecesitaSincronizarValue = (state: PermisosState) => {
  if (!state.ultimaSincronizacion) return true;
  return Date.now() - state.ultimaSincronizacion > CACHE_EXPIRY_MS;
};

export const createSelectEstaEnCache = (codigo: string, sucursalId: number) => (state: PermisosState) => {
  const key = `${codigo}:${sucursalId}`;
  return state.permisosVerificados[key] !== undefined;
};

export const selectSetPermisoVerificado = (state: PermisosState) => state.setPermisoVerificado;
export const selectSetMultiplesPermisos = (state: PermisosState) => state.setMultiplesPermisos;
export const selectSetPermisos = (state: PermisosState) => state.setPermisos;
export const selectInvalidarSucursal = (state: PermisosState) => state.invalidarSucursal;
export const selectInvalidarCache = (state: PermisosState) => state.invalidarCache;
export const selectRefrescarSincronizacion = (state: PermisosState) => state.refrescarSincronizacion;
export const selectClear = (state: PermisosState) => state.clear;
