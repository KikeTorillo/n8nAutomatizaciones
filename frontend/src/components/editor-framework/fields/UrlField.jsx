/**
 * UrlField - Campo de URL
 */
import { memo, useId } from 'react';
import { Link } from 'lucide-react';
import { Input } from '@/components/ui/atoms';
import { Label } from '@/components/ui/atoms';

function UrlField({ field, label: labelProp, placeholder: placeholderProp, value, onChange }) {
  // Soporta tanto {field} como props directos
  const label = field?.label ?? labelProp;
  const placeholder = field?.placeholder ?? placeholderProp;
  const fieldId = useId();

  return (
    <div>
      <Label label={label} htmlFor={fieldId} className="mb-1" />
      <Input
        id={fieldId}
        type="url"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'https://...'}
        prefix={<Link className="w-4 h-4 text-gray-400" />}
      />
    </div>
  );
}

export default memo(UrlField);
