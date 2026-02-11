import { ThemeToggle } from '@/components/ui';
import { useTheme } from '@/hooks/sistema';

interface ThemeToggleConnectedProps {
  className?: string;
}

export function ThemeToggleConnected({ className }: ThemeToggleConnectedProps) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <ThemeToggle isDark={isDark} onToggle={toggleTheme} className={className} />
  );
}
