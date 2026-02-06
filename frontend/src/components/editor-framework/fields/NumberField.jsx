/**
 * NumberField - Campo numerico
 */
import { memo, useId } from 'react';
import { Input } from '@/components/ui/atoms';
import { Label } from '@/components/ui/atoms';

function NumberField({ field, label: labelProp, min: minProp, max: maxProp, step: stepProp, value, onChange }) {
  // Soporta tanto {field} como props directos
  const label = field?.label ?? labelProp;
  const min = field?.min ?? minProp;
  const max = field?.max ?? maxProp;
  const step = field?.step ?? stepProp;
  const fieldId = useId();

  return (
    <div>
      <Label label={label} htmlFor={fieldId} className="mb-1" />
      <Input
        id={fieldId}
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

export default memo(NumberField);
