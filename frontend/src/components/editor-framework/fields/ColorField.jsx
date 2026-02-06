/**
 * ColorField - Campo de seleccion de color
 */
import { memo, useId } from 'react';
import { Input } from '@/components/ui/atoms';
import { Label } from '@/components/ui/atoms';

function ColorField({ field, label: labelProp, value, onChange }) {
  // Soporta tanto {field} como prop directo {label}
  const label = field?.label ?? labelProp;
  const fieldId = useId();

  return (
    <div>
      <Label label={label} htmlFor={fieldId} className="mb-1" />
      <div className="flex gap-2">
        <input
          type="color"
          value={value || '#E5E7EB'}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
        />
        <Input
          id={fieldId}
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#FFFFFF"
        />
      </div>
    </div>
  );
}

export default memo(ColorField);
