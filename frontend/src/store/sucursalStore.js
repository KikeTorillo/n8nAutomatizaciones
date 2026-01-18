import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Store para la sucursal activa
 *
 * La sucursal activa determina el contexto de trabajo:
 * - Qué inventario ver (si no es compartido)
 * - Qué profesionales están disponibles
 * - Filtros por defecto en otros módulos
 */
const useSucursalStore = create(
  devtools(
    persist(
      (set, get) => ({
      // ========== STATE ==========

      /**
       * Sucursal activa seleccionada
       * @type {{ id: number, nombre: string, es_matriz: boolean, codigo: string } | null}
       */
      sucursalActiva: null,

      /**
       * Todas las sucursales disponibles para el usuario
       * @type {Array<{ id: number, nombre: string, es_matriz: boolean, codigo: string }>}
       */
      sucursalesDisponibles: [],

      // ========== ACTIONS ==========

      /**
       * Establecer la sucursal activa
       * @param {Object} sucursal - { id, nombre, es_matriz, codigo }
       */
      setSucursalActiva: (sucursal) => {
        set({ sucursalActiva: sucursal });
      },

      /**
       * Establecer sucursales disponibles para el usuario
       * @param {Array} sucursales - Lista de sucursales
       */
      setSucursalesDisponibles: (sucursales) => {
        set({ sucursalesDisponibles: sucursales });

        // Si no hay sucursal activa, seleccionar la matriz por defecto
        const { sucursalActiva } = get();
        if (!sucursalActiva && sucursales.length > 0) {
          const matriz = sucursales.find(s => s.es_matriz);
          set({ sucursalActiva: matriz || sucursales[0] });
        }

        // Si la sucursal activa ya no está disponible, cambiar a la matriz
        if (sucursalActiva && sucursales.length > 0) {
          const sigueDisponible = sucursales.find(s => s.id === sucursalActiva.id);
          if (!sigueDisponible) {
            const matriz = sucursales.find(s => s.es_matriz);
            set({ sucursalActiva: matriz || sucursales[0] });
          }
        }
      },

      /**
       * Obtener ID de sucursal activa
       * @returns {number|null}
       */
      getSucursalId: () => {
        const { sucursalActiva } = get();
        return sucursalActiva?.id || null;
      },

      /**
       * Verificar si la sucursal activa es la matriz
       * @returns {boolean}
       */
      esMatriz: () => {
        const { sucursalActiva } = get();
        return sucursalActiva?.es_matriz || false;
      },

      /**
       * Verificar si hay múltiples sucursales disponibles
       * @returns {boolean}
       */
      tieneMultiplesSucursales: () => {
        const { sucursalesDisponibles } = get();
        return sucursalesDisponibles.length > 1;
      },

      /**
       * Limpiar store (para logout)
       */
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
          // Solo persistir la sucursal activa, no la lista completa
          sucursalActiva: state.sucursalActiva,
        }),
      }
    ),
    { name: 'SucursalStore', enabled: import.meta.env.DEV }
  )
);

// ====================================================================
// SELECTORES - Ene 2026: Optimización para evitar re-renders
// Usar estos selectores en lugar de desestructurar todo el store
// ====================================================================

// State
export const selectSucursalActiva = (state) => state.sucursalActiva;
export const selectSucursalesDisponibles = (state) => state.sucursalesDisponibles;

// Actions
export const selectSetSucursalActiva = (state) => state.setSucursalActiva;
export const selectSetSucursalesDisponibles = (state) => state.setSucursalesDisponibles;
export const selectGetSucursalId = (state) => state.getSucursalId;
export const selectEsMatriz = (state) => state.esMatriz;
export const selectTieneMultiplesSucursales = (state) => state.tieneMultiplesSucursales;
export const selectClear = (state) => state.clear;

export default useSucursalStore;
