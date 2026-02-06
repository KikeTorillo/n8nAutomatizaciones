/**
 * TextareaField - Campo de texto multilinea con soporte para IA
 */
import { memo, useRef, useId } from 'react';
import { Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/atoms';
import { Label } from '@/components/ui/atoms';

function TextareaField({ field, label: labelProp, fieldKey, placeholder: placeholderProp, aiEnabled: aiEnabledProp, rows: rowsProp = 3, value, onChange, onOpenAIWriter }) {
  // Soporta tanto {field} como props directos
  const key = field?.key ?? fieldKey;
  const label = field?.label ?? labelProp;
  const placeholder = field?.placeholder ?? placeholderProp;
  const aiEnabled = field?.aiEnabled ?? aiEnabledProp;
  const rows = field?.rows ?? rowsProp;
  const fieldRef = useRef(null);
  const fieldId = useId();

  return (
    <div ref={fieldRef}>
      <div className="flex items-center justify-between mb-1">
        <Label label={label} htmlFor={fieldId} />
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
      <Textarea
        id={fieldId}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}

export default memo(TextareaField);
