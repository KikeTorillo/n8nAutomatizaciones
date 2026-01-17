import { useEffect } from 'react';
import useThemeStore, {
  selectTheme,
  selectResolvedTheme,
  selectSetTheme,
  selectToggleTheme,
  selectIsDark,
  selectInitSystemListener,
  selectApplyTheme,
} from '@/store/themeStore';

/**
 * Hook para acceder al tema de la aplicación
 * @returns {Object} - { theme, resolvedTheme, setTheme, toggleTheme, isDark }
 */
export function useTheme() {
  const theme = useThemeStore(selectTheme);
  const resolvedTheme = useThemeStore(selectResolvedTheme);
  const setTheme = useThemeStore(selectSetTheme);
  const toggleTheme = useThemeStore(selectToggleTheme);
  const isDark = useThemeStore(selectIsDark);
  const initSystemListener = useThemeStore(selectInitSystemListener);
  const applyTheme = useThemeStore(selectApplyTheme);

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
