import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Sucursal {
  id: number;
  nombre: string;
  es_matriz: boolean;
  codigo: string;
}

interface SucursalState {
  sucursalActiva: Sucursal | null;
  sucursalesDisponibles: Sucursal[];
  setSucursalActiva: (sucursal: Sucursal) => void;
  setSucursalesDisponibles: (sucursales: Sucursal[]) => void;
  getSucursalId: () => number | null;
  esMatriz: () => boolean;
  tieneMultiplesSucursales: () => boolean;
  clear: () => void;
}

const useSucursalStore = create<SucursalState>()(
  devtools(
    persist(
      (set, get) => ({
      sucursalActiva: null,
      sucursalesDisponibles: [],

      setSucursalActiva: (sucursal: Sucursal) => {
        set({ sucursalActiva: sucursal });
      },

      setSucursalesDisponibles: (sucursales: Sucursal[]) => {
        set({ sucursalesDisponibles: sucursales });

        const { sucursalActiva } = get();
        if (!sucursalActiva && sucursales.length > 0) {
          const matriz = sucursales.find(s => s.es_matriz);
          set({ sucursalActiva: matriz || sucursales[0] });
        }

        if (sucursalActiva && sucursales.length > 0) {
          const sigueDisponible = sucursales.find(s => s.id === sucursalActiva.id);
          if (!sigueDisponible) {
            const matriz = sucursales.find(s => s.es_matriz);
            set({ sucursalActiva: matriz || sucursales[0] });
          }
        }
      },

      getSucursalId: () => {
        const { sucursalActiva } = get();
        return sucursalActiva?.id || null;
      },

      esMatriz: () => {
        const { sucursalActiva } = get();
        return sucursalActiva?.es_matriz || false;
      },

      tieneMultiplesSucursales: () => {
        const { sucursalesDisponibles } = get();
        return sucursalesDisponibles.length > 1;
      },

      clear: () => {
        set({
          sucursalActiva: null,
          sucursalesDisponibles: [],
        });
      },
    }),
      {
        name: 'sucursal-storage',
        partialize: (state) => ({
          sucursalActiva: state.sucursalActiva,
        }),
      }
    ),
    { name: 'SucursalStore', enabled: import.meta.env.DEV }
  )
);

// Selectores
export const selectSucursalActiva = (state: SucursalState) => state.sucursalActiva;
export const selectSucursalesDisponibles = (state: SucursalState) => state.sucursalesDisponibles;
export const selectSetSucursalActiva = (state: SucursalState) => state.setSucursalActiva;
export const selectSetSucursalesDisponibles = (state: SucursalState) => state.setSucursalesDisponibles;
export const selectGetSucursalId = (state: SucursalState) => state.getSucursalId;
export const selectEsMatriz = (state: SucursalState) => state.esMatriz;
export const selectTieneMultiplesSucursales = (state: SucursalState) => state.tieneMultiplesSucursales;
export const selectClear = (state: SucursalState) => state.clear;

export default useSucursalStore;
