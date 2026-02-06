/**
 * DateField - Campo de fecha
 */
import { memo, useId } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/atoms';
import { Label } from '@/components/ui/atoms';

function DateField({ field, label: labelProp, min: minProp, max: maxProp, value, onChange }) {
  // Soporta tanto {field} como props directos
  const label = field?.label ?? labelProp;
  const min = field?.min ?? minProp;
  const max = field?.max ?? maxProp;
  const fieldId = useId();

  return (
    <div>
      <Label label={label} htmlFor={fieldId} className="mb-1" />
      <Input
        id={fieldId}
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        prefix={<Calendar className="w-4 h-4 text-gray-400" />}
      />
    </div>
  );
}

export default memo(DateField);
