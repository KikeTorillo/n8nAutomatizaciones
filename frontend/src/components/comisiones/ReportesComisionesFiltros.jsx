import { Filter } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { useProfesionales } from '@/hooks/personas';

/**
 * Componente de filtros para reportes de comisiones
 *
 * @param {Object} filtros - Estado actual de filtros
 * @param {function} onChange - Callback al cambiar filtros
 * @param {function} onLimpiar - Callback para limpiar filtros
 * @param {function} onBuscar - Callback para aplicar filtros
 */
function ReportesComisionesFiltros({
  filtros,
  onChange,
  onLimpiar,
  onBuscar,
}) {
  const { data: profesionalesData, isLoading: loadingProfesionales } = useProfesionales();
  const profesionales = profesionalesData?.profesionales || [];

  const handleChange = (field, value) => {
    onChange?.({
      ...filtros,
      [field]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onBuscar?.();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filtros de Búsqueda</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Fecha Desde */}
        <div>
          <Input
            type="date"
            label="Desde"
            required
            value={filtros.fecha_desde || ''}
            onChange={(e) => handleChange('fecha_desde', e.target.value)}
          />
        </div>

        {/* Fecha Hasta */}
        <div>
          <Input
            type="date"
            label="Hasta"
            required
            value={filtros.fecha_hasta || ''}
            onChange={(e) => handleChange('fecha_hasta', e.target.value)}
          />
        </div>

        {/* Profesional */}
        <div>
          <Select
            label="Profesional"
            value={filtros.profesional_id || ''}
            onChange={(e) => handleChange('profesional_id', e.target.value)}
            disabled={loadingProfesionales}
            placeholder="Todos los profesionales"
            options={profesionales.map((prof) => ({
              value: String(prof.id),
              label: `${prof.nombre} ${prof.apellidos || ''}`.trim(),
            }))}
          />
        </div>

        {/* Estado de Pago */}
        <div>
          <Select
            label="Estado de Pago"
            value={filtros.estado_pago || ''}
            onChange={(e) => handleChange('estado_pago', e.target.value)}
            placeholder="Todos los estados"
            options={[
              { value: 'pendiente', label: 'Pendiente' },
              { value: 'pagada', label: 'Pagada' },
              { value: 'cancelada', label: 'Cancelada' },
            ]}
          />
        </div>

        {/* Origen */}
        <div>
          <Select
            label="Origen"
            value={filtros.origen || ''}
            onChange={(e) => handleChange('origen', e.target.value)}
            placeholder="Todos los orígenes"
            options={[
              { value: 'cita', label: 'Citas (Servicios)' },
              { value: 'venta', label: 'Ventas POS (Productos)' },
            ]}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="secondary"
          onClick={onLimpiar}
        >
          Limpiar Filtros
        </Button>
        <Button
          type="submit"
          variant="primary"
        >
          Buscar Comisiones
        </Button>
      </div>
    </form>
  );
}

export default ReportesComisionesFiltros;
