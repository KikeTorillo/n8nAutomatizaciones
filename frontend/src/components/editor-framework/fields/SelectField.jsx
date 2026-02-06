/**
 * SelectField - Campo de seleccion
 */
import { memo, useId } from 'react';
import { Select } from '@/components/ui/atoms';
import { Label } from '@/components/ui/atoms';

function SelectField({ field, label: labelProp, options: optionsProp, value, onChange }) {
  // Soporta tanto {field} como props directos
  const label = field?.label ?? labelProp;
  const options = field?.options ?? optionsProp;
  const fieldId = useId();

  return (
    <div>
      <Label label={label} htmlFor={fieldId} className="mb-1" />
      <Select
        id={fieldId}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export default memo(SelectField);
