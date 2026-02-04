/**
 * DateTimeField - Campo de fecha y hora
 */
import { memo } from 'react';
import { Calendar, Clock } from 'lucide-react';

function DateTimeField({ field, label: labelProp, min: minProp, max: maxProp, value, onChange }) {
  // Soporta tanto {field} como props directos
  const label = field?.label ?? labelProp;
  const min = field?.min ?? minProp;
  const max = field?.max ?? maxProp;

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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="datetime-local"
          value={localValue}
          onChange={handleChange}
          min={min}
          max={max}
          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500"
        />
      </div>
    </div>
  );
}

export default memo(DateTimeField);
