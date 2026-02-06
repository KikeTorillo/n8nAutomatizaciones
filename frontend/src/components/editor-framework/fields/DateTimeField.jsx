/**
 * DateTimeField - Campo de fecha y hora
 */
import { memo, useId } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/atoms';
import { Label } from '@/components/ui/atoms';

function DateTimeField({ field, label: labelProp, min: minProp, max: maxProp, value, onChange }) {
  // Soporta tanto {field} como props directos
  const label = field?.label ?? labelProp;
  const min = field?.min ?? minProp;
  const max = field?.max ?? maxProp;
  const fieldId = useId();

  // Convertir valor ISO a formato local
  const localValue = value
    ? new Date(value).toISOString().slice(0, 16)
    : '';

  const handleChange = (e) => {
    const newValue = e.target.value;
    // Convertir a ISO con timezone
    if (newValue) {
      const date = new Date(newValue);
      onChange(date.toISOString());
    } else {
      onChange('');
    }
  };

  return (
    <div>
      <Label label={label} htmlFor={fieldId} className="mb-1" />
      <Input
        id={fieldId}
        type="datetime-local"
        value={localValue}
        onChange={handleChange}
        min={min}
        max={max}
        prefix={<Calendar className="w-4 h-4 text-gray-400" />}
      />
    </div>
  );
}

export default memo(DateTimeField);
