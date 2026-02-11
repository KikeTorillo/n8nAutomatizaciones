import { ThemeToggle } from '@/components/ui';
import { useTheme } from '@/hooks/sistema';

export function ThemeToggleConnected(props) {
  const { isDark, toggleTheme } = useTheme();
  return <ThemeToggle isDark={isDark} onToggle={toggleTheme} {...props} />;
}
