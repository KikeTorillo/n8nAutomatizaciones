import { memo } from 'react';
import {
  Edit2,
  Trash2,
  Package,
  Truck,
  FolderTree,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { IconButton } from '@/components/ui';

const TIPOS_ALCANCE = [
  { value: 'producto', label: 'Producto especifico', icon: Package },
  { value: 'categoria', label: 'Categoria completa', icon: FolderTree },
  { value: 'proveedor', label: 'Proveedor', icon: Truck },
  { value: 'todos', label: 'Todos los productos', icon: Package },
];

const FRECUENCIAS = [
  { value: 'diario', label: 'Diario' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
];

const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
  { value: 0, label: 'Domingo' },
];

const ReglaCard = memo(function ReglaCard({ regla, onEdit, onDelete, onToggle, isToggling }) {
  const TipoIcon = TIPOS_ALCANCE.find((t) => t.value === regla.tipo_alcance)?.icon || Package;

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`p-2 rounded-lg flex-shrink-0 ${
              regla.activo
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
            }`}
          >
            <TipoIcon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {regla.nombre}
              </h3>
              {regla.activo ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Activa
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  Inactiva
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Alcance: {TIPOS_ALCANCE.find((t) => t.value === regla.tipo_alcance)?.label}
              </span>
              <span>Frecuencia: {FRECUENCIAS.find((f) => f.value === regla.frecuencia)?.label}</span>
              {regla.proveedor_nombre && <span>Proveedor: {regla.proveedor_nombre}</span>}
              {regla.categoria_nombre && <span>Categoria: {regla.categoria_nombre}</span>}
              {regla.producto_nombre && <span>Producto: {regla.producto_nombre}</span>}
            </div>

            {regla.dias_semana_aplicacion?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {regla.dias_semana_aplicacion.map((dia) => (
                  <span
                    key={dia}
                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
                  >
                    {DIAS_SEMANA.find((d) => d.value === dia)?.label?.slice(0, 3)}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span>
                Trigger: Stock &le; {regla.stock_minimo_trigger || 'min. producto'}
              </span>
              <span>
                Cantidad: {regla.cantidad_a_ordenar || 'hasta max'}
              </span>
              {regla.lead_time_dias && <span>Lead time: {regla.lead_time_dias} dias</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <IconButton
            icon={regla.activo ? ToggleRight : ToggleLeft}
            label={regla.activo ? 'Desactivar' : 'Activar'}
            variant="ghost"
            size="sm"
            onClick={onToggle}
            disabled={isToggling}
            className={regla.activo ? 'text-green-500' : undefined}
          />
          <IconButton
            icon={Edit2}
            label="Editar"
            variant="ghost"
            size="sm"
            onClick={onEdit}
          />
          <IconButton
            icon={Trash2}
            label="Eliminar"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          />
        </div>
      </div>
    </div>
  );
});

export { ReglaCard, TIPOS_ALCANCE, FRECUENCIAS, DIAS_SEMANA };
