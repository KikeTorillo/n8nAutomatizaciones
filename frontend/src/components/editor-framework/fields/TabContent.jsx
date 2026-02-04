/**
 * TabContent - Contenido de cada tab del PropertiesPanel
 */
import { memo } from 'react';
import FieldRenderer from './FieldRenderer';

/**
 * TabContent - Renderiza los campos de una tab
 */
function TabContent({ fields, values, onChange, onOpenAIWriter, onOpenUnsplash, onOpenItemsEditor }) {
  if (!fields || fields.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        No hay propiedades configurables
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        // Verificar condicion showWhen si existe
        if (field.showWhen && !field.showWhen(values)) {
          return null;
        }
        return (
          <FieldRenderer
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(value) => onChange(field.key, value)}
            onOpenAIWriter={onOpenAIWriter}
            onOpenUnsplash={onOpenUnsplash}
            onOpenItemsEditor={onOpenItemsEditor}
          />
        );
      })}
    </div>
  );
}

export default memo(TabContent);
