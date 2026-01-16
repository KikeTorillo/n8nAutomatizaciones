import { forwardRef, useMemo } from 'react';
import { Select } from '@/components/ui';
import { useDepartamentos, useArbolDepartamentos } from '@/hooks/useDepartamentos';
import { Building2 } from 'lucide-react';

/**
 * Selector de Departamento
 * Carga automáticamente los departamentos y los muestra en formato jerárquico
 *
 * @param {boolean} showHierarchy - Mostrar indentación jerárquica
 * @param {boolean} soloRaiz - Solo mostrar departamentos raíz (sin parent)
 * @param {boolean} includeEmpty - Incluir opción vacía
 */
const DepartamentoSelect = forwardRef(
  (
    {
      className,
      error,
      label = 'Departamento',
      placeholder = 'Selecciona un departamento',
      required = false,
      showHierarchy = true,
      soloRaiz = false,
      includeEmpty = true,
      disabled = false,
      ...props
    },
    ref
  ) => {
    // Fetch departamentos
    const { data: departamentos = [], isLoading } = useDepartamentos({ activo: true });
    const { data: arbol = [] } = useArbolDepartamentos();

    // Construir opciones con jerarquía
    const options = useMemo(() => {
      if (!showHierarchy || arbol.length === 0) {
        // Sin jerarquía: lista plana
        let filtered = departamentos;
        if (soloRaiz) {
          filtered = departamentos.filter(d => !d.parent_id);
        }
        return filtered.map(d => ({
          value: d.id,
          label: d.nombre,
        }));
      }

      // Con jerarquía: recorrer árbol
      const flatOptions = [];

      const traverse = (nodes, level = 0) => {
        for (const node of nodes) {
          if (soloRaiz && level > 0) continue;

          flatOptions.push({
            value: node.id,
            label: level > 0 ? `${'  '.repeat(level)}└ ${node.nombre}` : node.nombre,
            originalLabel: node.nombre,
            level,
          });

          if (node.children && node.children.length > 0 && !soloRaiz) {
            traverse(node.children, level + 1);
          }
        }
      };

      traverse(arbol);
      return flatOptions;
    }, [departamentos, arbol, showHierarchy, soloRaiz]);

    return (
      <div className="w-full">
        {label && (
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Building2 className="w-4 h-4" />
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <Select
          ref={ref}
          className={className}
          error={error}
          label={null}
          placeholder={isLoading ? 'Cargando...' : placeholder}
          disabled={disabled || isLoading}
          {...props}
        >
          {includeEmpty && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

DepartamentoSelect.displayName = 'DepartamentoSelect';

export default DepartamentoSelect;
