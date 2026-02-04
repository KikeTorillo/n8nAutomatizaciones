/**
 * RangeField - Campo de rango/slider
 */
import { memo } from 'react';

function RangeField({ field, value, onChange }) {
  const { label, min, max, step } = field;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}: {Math.round((value || 0) * 100)}%
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
