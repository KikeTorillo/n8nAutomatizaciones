import { Pencil } from 'lucide-react';

/**
 * Campo de información con edición inline
 * Muestra label, valor y botón de editar al hacer hover
 */
function EditableField({
  label,
  value,
  onEdit,
  emptyText = 'No especificado',
  renderValue,
  className = '',
}) {
  // Determinar si el valor está vacío
  const isEmpty = value === null || value === undefined || value === '' ||
    (Array.isArray(value) && value.length === 0);

  // Renderizar valor
  const displayValue = renderValue
    ? renderValue(value)
    : isEmpty
      ? <span className="text-gray-400 dark:text-gray-500 italic">{emptyText}</span>
      : value;

  return (
    <div className={`flex justify-between items-start group ${className}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <p className="text-gray-900 dark:text-gray-100 break-words">{displayValue}</p>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all ml-2 flex-shrink-0"
          title={`Editar ${label}`}
        >
          <Pencil className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </button>
      )}
    </div>
  );
}

export default EditableField;
