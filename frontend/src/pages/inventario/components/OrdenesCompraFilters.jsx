/**
 * Panel de filtros para Órdenes de Compra
 * Feb 2026 - Extracción desde OrdenesCompraPage
 */

import { memo } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * Panel de filtros avanzados para órdenes de compra
 * @param {Object} props
 * @param {Object} props.filtros - Estado actual de los filtros
 * @param {Array} props.proveedores - Lista de proveedores disponibles
 * @param {Function} props.onFiltroChange - (campo, valor) => void
 * @param {Function} props.onLimpiar - () => void
 */
const OrdenesCompraFilters = memo(function OrdenesCompraFilters({
  filtros,
  proveedores,
  onFiltroChange,
  onLimpiar,
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Busqueda por folio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Buscar por folio
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={filtros.folio}
              onChange={(e) => onFiltroChange('folio', e.target.value)}
              placeholder="OC-2025-0001"
              className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Proveedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Proveedor
          </label>
          <select
            value={filtros.proveedor_id}
            onChange={(e) => onFiltroChange('proveedor_id', e.target.value)}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos</option>
            {proveedores.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select
            value={filtros.estado}
            onChange={(e) => onFiltroChange('estado', e.target.value)}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos</option>
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada</option>
            <option value="parcial">Parcial</option>
            <option value="recibida">Recibida</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        {/* Estado de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado de Pago
          </label>
          <select
            value={filtros.estado_pago}
            onChange={(e) => onFiltroChange('estado_pago', e.target.value)}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>

        {/* Fecha desde */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha Desde
          </label>
          <input
            type="date"
            value={filtros.fecha_desde}
            onChange={(e) => onFiltroChange('fecha_desde', e.target.value)}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Fecha hasta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha Hasta
          </label>
          <input
            type="date"
            value={filtros.fecha_hasta}
            onChange={(e) => onFiltroChange('fecha_hasta', e.target.value)}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Botones de accion */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onLimpiar}>
          Limpiar Filtros
        </Button>
      </div>
    </div>
  );
});

export default OrdenesCompraFilters;
