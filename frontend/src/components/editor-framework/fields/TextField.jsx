/**
 * TextField - Campo de texto con soporte para IA
 */
import { memo, useRef } from 'react';
import { Sparkles } from 'lucide-react';

function TextField({ field, label: labelProp, fieldKey, placeholder: placeholderProp, aiEnabled: aiEnabledProp, value, onChange, onOpenAIWriter }) {
  // Soporta tanto {field} como props directos
  const key = field?.key ?? fieldKey;
  const label = field?.label ?? labelProp;
  const placeholder = field?.placeholder ?? placeholderProp;
  const aiEnabled = field?.aiEnabled ?? aiEnabledProp;
  const fieldRef = useRef(null);

  return (
    <div ref={fieldRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {aiEnabled && (
          <button
            type="button"
            onClick={(e) => onOpenAIWriter?.(key, e)}
            className="p-1 text-primary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors"
            title="Generar con IA"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}
      </div>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500"
      />
    </div>
  );
}

export default memo(TextField);
