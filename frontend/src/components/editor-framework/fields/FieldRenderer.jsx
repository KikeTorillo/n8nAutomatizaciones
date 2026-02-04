/**
 * FieldRenderer - Renderiza el campo apropiado segun su tipo
 */
import { memo } from 'react';
import TextField from './TextField';
import TextareaField from './TextareaField';
import UrlField from './UrlField';
import ImageField from './ImageField';
import SelectField from './SelectField';
import ToggleField from './ToggleField';
import NumberField from './NumberField';
import RangeField from './RangeField';
import ColorField from './ColorField';
import AlignmentField from './AlignmentField';
import ItemsEditorField from './ItemsEditorField';
import DateField from './DateField';
import DateTimeField from './DateTimeField';

/**
 * Mapeo de tipos de campo a componentes
 */
const FIELD_COMPONENTS = {
  text: TextField,
  textarea: TextareaField,
  url: UrlField,
  image: ImageField,
  select: SelectField,
  toggle: ToggleField,
  number: NumberField,
  range: RangeField,
  color: ColorField,
  alignment: AlignmentField,
  itemsEditor: ItemsEditorField,
  date: DateField,
  datetime: DateTimeField,
};

/**
 * FieldRenderer - Renderiza el componente de campo apropiado
 */
function FieldRenderer({ field, value, onChange, onOpenAIWriter, onOpenUnsplash, onOpenItemsEditor }) {
  const Component = FIELD_COMPONENTS[field.type];

  if (!Component) {
    return null;
  }

  return (
    <Component
      field={field}
      value={value}
      onChange={onChange}
      onOpenAIWriter={onOpenAIWriter}
      onOpenUnsplash={onOpenUnsplash}
      onOpenItemsEditor={onOpenItemsEditor}
    />
  );
}

export default memo(FieldRenderer);
