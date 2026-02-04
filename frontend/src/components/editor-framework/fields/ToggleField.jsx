/**
 * ToggleField - Campo booleano tipo switch
 */
import { memo } from 'react';
import { cn } from '@/lib/utils';

function ToggleField({ field, label: labelProp, value, onChange }) {
  // Soporta tanto {field} como prop directo {label}
  const label = field?.label ?? labelProp;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          value
            ? 'bg-primary-600'
            : 'bg-gray-200 dark:bg-gray-600'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow',
            value && 'translate-x-5'
          )}
        />
      </button>
    </div>
  );
}

export default memo(ToggleField);
