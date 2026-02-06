/**
 * RangeField - Campo de rango/slider
 */
import { memo, useId } from 'react';
import { Label } from '@/components/ui/atoms';

function RangeField({ field, label: labelProp, min: minProp, max: maxProp, step: stepProp, showPercent: showPercentProp = true, value, onChange }) {
  // Soporta tanto {field} como props directos
  const label = field?.label ?? labelProp;
  const min = field?.min ?? minProp;
  const max = field?.max ?? maxProp;
  const step = field?.step ?? stepProp;
  const showPercent = field?.showPercent ?? showPercentProp;
  const fieldId = useId();
  const displayValue = showPercent
    ? `${Math.round((value || 0) * 100)}%`
    : value || 0;

  return (
    <div>
      <Label label={`${label}: ${displayValue}`} htmlFor={fieldId} className="mb-1" />
      <input
        id={fieldId}
        type="range"
        value={value || 0}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min || 0}
        max={max || 1}
        step={step || 0.1}
        className="w-full"
      />
    </div>
  );
}

export default memo(RangeField);
