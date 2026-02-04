/**
 * BreakpointBadge - Badge que muestra el breakpoint activo
 */
import { memo } from 'react';
import { Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BREAKPOINT_ICONS, BREAKPOINT_LABELS } from './constants';

const COLORS = {
  tablet: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  mobile: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
};

function BreakpointBadge({ breakpoint }) {
  const Icon = BREAKPOINT_ICONS[breakpoint] || Monitor;
  const label = BREAKPOINT_LABELS[breakpoint] || breakpoint;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border',
        COLORS[breakpoint] || 'bg-gray-100 text-gray-700'
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default memo(BreakpointBadge);
