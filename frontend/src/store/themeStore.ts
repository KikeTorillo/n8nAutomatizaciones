import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  _cleanupFn: (() => void) | null;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  applyTheme: () => void;
  initSystemListener: () => () => void;
  isDark: () => boolean;
}

const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
      theme: 'dark' as ThemeMode,
      resolvedTheme: 'dark' as ResolvedTheme,
      _cleanupFn: null,

      setTheme: (theme: ThemeMode) => {
        set({ theme });
        get().applyTheme();
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        get().applyTheme();
      },

      applyTheme: () => {
        const { theme } = get();
        let resolved: ResolvedTheme = theme as ResolvedTheme;

        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        }

        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolved);

        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute(
            'content',
            resolved === 'dark' ? '#111827' : '#ffffff'
          );
        }

        set({ resolvedTheme: resolved });
      },

      initSystemListener: () => {
        const currentCleanup = get()._cleanupFn;
        if (currentCleanup) {
          currentCleanup();
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
          const { theme } = get();
          if (theme === 'system') {
            get().applyTheme();
          }
        };

        mediaQuery.addEventListener('change', handleChange);
        get().applyTheme();

        const cleanup = () => {
          mediaQuery.removeEventListener('change', handleChange);
          set({ _cleanupFn: null });
        };

        set({ _cleanupFn: cleanup });

        return cleanup;
      },

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

// Selectores
export const selectTheme = (state: ThemeState) => state.theme;
export const selectResolvedTheme = (state: ThemeState) => state.resolvedTheme;
export const selectSetTheme = (state: ThemeState) => state.setTheme;
export const selectToggleTheme = (state: ThemeState) => state.toggleTheme;
export const selectApplyTheme = (state: ThemeState) => state.applyTheme;
export const selectInitSystemListener = (state: ThemeState) => state.initSystemListener;
export const selectIsDark = (state: ThemeState) => state.isDark;

export default useThemeStore;
