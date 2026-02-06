/**
 * ToggleField - Campo booleano tipo switch
 */
import { memo } from 'react';
import { ToggleSwitch } from '@/components/ui/molecules';

function ToggleField({ field, label: labelProp, value, onChange }) {
  // Soporta tanto {field} como prop directo {label}
  const label = field?.label ?? labelProp;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <ToggleSwitch
        enabled={!!value}
        onChange={(enabled) => onChange(enabled)}
        label={label}
        size="sm"
      />
    </div>
  );
}

export default memo(ToggleField);
