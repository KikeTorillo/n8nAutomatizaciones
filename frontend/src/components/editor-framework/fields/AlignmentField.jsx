/**
 * AlignmentField - Campo de alineacion de texto
 */
import { memo } from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALIGNMENTS = [
  { value: 'left', Icon: AlignLeft },
  { value: 'center', Icon: AlignCenter },
  { value: 'right', Icon: AlignRight },
];

function AlignmentField({ field, label: labelProp, value, onChange }) {
  // Soporta tanto {field} como prop directo {label}
  const label = field?.label ?? labelProp;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        {ALIGNMENTS.map(({ value: v, Icon }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              'flex-1 p-2 rounded transition-colors',
              value === v
                ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            <Icon className="w-4 h-4 mx-auto" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(AlignmentField);
