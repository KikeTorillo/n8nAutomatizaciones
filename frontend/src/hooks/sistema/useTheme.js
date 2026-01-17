import { useEffect } from 'react';
import useThemeStore from '@/store/themeStore';

/**
 * Hook para acceder al tema de la aplicación
 * @returns {Object} - { theme, resolvedTheme, setTheme, toggleTheme, isDark }
 */
export function useTheme() {
  const theme = useThemeStore((state) => state.theme);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = useThemeStore((state) => state.isDark);
  const initSystemListener = useThemeStore((state) => state.initSystemListener);
  const applyTheme = useThemeStore((state) => state.applyTheme);

  // Inicializar el tema al montar
  useEffect(() => {
    applyTheme();
    const cleanup = initSystemListener();
    return cleanup;
  }, [applyTheme, initSystemListener]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: isDark(),
  };
}

export default useTheme;
