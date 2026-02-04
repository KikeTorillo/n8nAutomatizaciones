/**
 * FieldRenderer - Renderiza el campo apropiado segun su tipo
 */
import { memo } from 'react';
import {
  TextField,
  TextareaField,
  UrlField,
  ImageField,
  SelectField,
  ToggleField,
  NumberField,
  RangeField,
  ColorField,
  AlignmentField,
  ItemsEditorField,
} from './fields';

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
