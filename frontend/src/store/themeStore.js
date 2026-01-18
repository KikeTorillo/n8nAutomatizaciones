import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Ene 2026: Variable de control para evitar memory leaks
// Almacena la función de cleanup del listener del sistema
let systemListenerCleanup = null;

/**
 * Store de tema con Zustand
 * Maneja el tema de la aplicación (light/dark/system)
 */
const useThemeStore = create(
  devtools(
    persist(
      (set, get) => ({
      // ========== STATE ==========
      theme: 'dark', // 'light' | 'dark' | 'system'
      resolvedTheme: 'dark', // El tema actual resuelto (siempre 'light' o 'dark')

      // ========== ACTIONS ==========

      /**
       * Establecer tema
       * @param {'light' | 'dark' | 'system'} theme
       */
      setTheme: (theme) => {
        set({ theme });
        get().applyTheme();
      },

      /**
       * Alternar entre light y dark
       */
      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        get().applyTheme();
      },

      /**
       * Aplicar el tema al DOM
       */
      applyTheme: () => {
        const { theme } = get();
        let resolved = theme;

        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        }

        // Aplicar clase al HTML
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolved);

        // Actualizar meta theme-color para mobile
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute(
            'content',
            resolved === 'dark' ? '#111827' : '#ffffff'
          );
        }

        set({ resolvedTheme: resolved });
      },

      /**
       * Inicializar listener para cambios en preferencia del sistema
       * Ene 2026: Previene múltiples listeners (memory leak)
       */
      initSystemListener: () => {
        // Limpiar listener anterior si existe
        if (systemListenerCleanup) {
          systemListenerCleanup();
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
          const { theme } = get();
          if (theme === 'system') {
            get().applyTheme();
          }
        };

        mediaQuery.addEventListener('change', handleChange);

        // Aplicar tema inicial
        get().applyTheme();

        // Guardar función de cleanup
        systemListenerCleanup = () => {
          mediaQuery.removeEventListener('change', handleChange);
          systemListenerCleanup = null;
        };

        return systemListenerCleanup;
      },

      /**
       * Verificar si el tema actual es oscuro
       * @returns {boolean}
       */
      isDark: () => {
        return get().resolvedTheme === 'dark';
      },
    }),
      {
        name: 'theme-storage',
        partialize: (state) => ({
          theme: state.theme,
        }),
      }
    ),
    { name: 'ThemeStore', enabled: import.meta.env.DEV }
  )
);

// ====================================================================
// SELECTORES - Ene 2026: Optimización para evitar re-renders
// Usar estos selectores en lugar de desestructurar todo el store
// ====================================================================

// State
export const selectTheme = (state) => state.theme;
export const selectResolvedTheme = (state) => state.resolvedTheme;

// Actions
export const selectSetTheme = (state) => state.setTheme;
export const selectToggleTheme = (state) => state.toggleTheme;
export const selectApplyTheme = (state) => state.applyTheme;
export const selectInitSystemListener = (state) => state.initSystemListener;
export const selectIsDark = (state) => state.isDark;

export default useThemeStore;
