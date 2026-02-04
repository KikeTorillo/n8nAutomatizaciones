/**
 * RangeField - Campo de rango/slider
 */
import { memo } from 'react';

function RangeField({ field, label: labelProp, min: minProp, max: maxProp, step: stepProp, showPercent: showPercentProp = true, value, onChange }) {
  // Soporta tanto {field} como props directos
  const label = field?.label ?? labelProp;
  const min = field?.min ?? minProp;
  const max = field?.max ?? maxProp;
  const step = field?.step ?? stepProp;
  const showPercent = field?.showPercent ?? showPercentProp;
  const displayValue = showPercent
    ? `${Math.round((value || 0) * 100)}%`
    : value || 0;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}: {displayValue}
      </label>
      <input
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
