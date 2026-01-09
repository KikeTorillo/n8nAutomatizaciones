import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

/**
 * Componente de filtros para el módulo de servicios
 * Extrae la lógica de filtros de ServiciosPage para mejor mantenibilidad
 */
function ServiciosFilters({
  filtros,
  onFiltrosChange,
  onLimpiarFiltros,
  hasFiltrosActivos,
}) {
  const handleInputChange = (campo, valor) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor,
    });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Filtro: Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <Select
            value={filtros.activo}
            onChange={(e) => handleInputChange('activo', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </Select>
        </div>

        {/* Filtro: Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Categoría
          </label>
          <Input
            type="text"
            placeholder="Ej: Cortes, Barba..."
            value={filtros.categoria}
            onChange={(e) => handleInputChange('categoria', e.target.value)}
          />
        </div>

        {/* Filtro: Precio Mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Precio Mínimo
          </label>
          <Input
            type="number"
            placeholder="10000"
            min="0"
            value={filtros.precio_min}
            onChange={(e) => handleInputChange('precio_min', e.target.value)}
          />
        </div>

        {/* Filtro: Precio Máximo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Precio Máximo
          </label>
          <Input
            type="number"
            placeholder="100000"
            min="0"
            value={filtros.precio_max}
            onChange={(e) => handleInputChange('precio_max', e.target.value)}
          />
        </div>
      </div>

      {/* Botón para limpiar filtros */}
      {hasFiltrosActivos && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onLimpiarFiltros}
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}

export default ServiciosFilters;
