/**
 * ====================================================================
 * TIMELINE ITEM - COMPONENTE DE ÍTEM INDIVIDUAL
 * ====================================================================
 *
 * Fase 4A - Timeline de Actividad (Ene 2026)
 * Renderiza un ítem individual del timeline (nota, cita, venta, tarea)
 *
 * ====================================================================
 */

import { useState } from 'react';
import {
  FileText,
  Phone,
  Mail,
  CheckSquare,
  Settings,
  Calendar,
  ShoppingCart,
  Check,
  Trash2,
  MoreHorizontal,
  Clock,
  User,
  AlertCircle,
} from 'lucide-react';
import { formatRelativeDate, getTipoActividad, getPrioridad, getEstadoTarea } from '@/hooks/useClienteActividades';

// Mapeo de iconos por tipo
const ICONOS = {
  nota: FileText,
  llamada: Phone,
  email: Mail,
  tarea: CheckSquare,
  sistema: Settings,
  cita: Calendar,
  venta: ShoppingCart,
};

// Colores por tipo
const COLORES_TIPO = {
  nota: 'bg-primary-500',
  llamada: 'bg-green-500',
  email: 'bg-secondary-500',
  tarea: 'bg-orange-500',
  sistema: 'bg-gray-500',
  cita: 'bg-primary-500',
  venta: 'bg-emerald-500',
};

export default function TimelineItem({
  item,
  onComplete,
  onDelete,
  isLoading = false,
}) {
  const [showActions, setShowActions] = useState(false);

  const Icon = ICONOS[item.tipo] || FileText;
  const colorClass = COLORES_TIPO[item.tipo] || 'bg-gray-500';
  const esTarea = item.tipo === 'tarea';
  const esPendiente = item.estado === 'pendiente';

  // Formatear metadata específica por tipo
  const renderMetadata = () => {
    if (!item.metadata) return null;

    switch (item.tipo) {
      case 'cita':
        return (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {item.metadata.servicio && (
              <p><span className="font-medium">Servicio:</span> {item.metadata.servicio}</p>
            )}
            {item.metadata.profesional && (
              <p><span className="font-medium">Profesional:</span> {item.metadata.profesional}</p>
            )}
            {item.metadata.precio && (
              <p><span className="font-medium">Total:</span> ${Number(item.metadata.precio).toLocaleString('es-MX')}</p>
            )}
          </div>
        );

      case 'venta':
        return (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <span className="font-medium">Total:</span> ${Number(item.metadata.total).toLocaleString('es-MX')}
              {item.metadata.metodo_pago && ` (${item.metadata.metodo_pago})`}
            </p>
          </div>
        );

      case 'tarea':
        return (
          <div className="mt-2 flex flex-wrap gap-2">
            {item.metadata?.fecha_vencimiento && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                Vence: {new Date(item.metadata.fecha_vencimiento).toLocaleDateString('es-MX')}
              </span>
            )}
            {item.prioridad && item.prioridad !== 'normal' && (
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getPrioridad(item.prioridad).bgColor}`}>
                <AlertCircle className="w-3 h-3" />
                {getPrioridad(item.prioridad).label}
              </span>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="relative pl-10 pb-6 group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Línea vertical */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

      {/* Punto del timeline */}
      <div
        className={`absolute left-2.5 top-1 w-4 h-4 rounded-full ${colorClass} flex items-center justify-center ring-4 ring-white dark:ring-gray-900`}
      >
        <Icon className="w-2.5 h-2.5 text-white" />
      </div>

      {/* Contenido */}
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow ${esTarea && esPendiente ? 'border-l-4 border-l-orange-500' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Tipo y título */}
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass} text-white`}>
                {getTipoActividad(item.tipo).label}
              </span>
              {esTarea && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${getEstadoTarea(item.estado).bgColor} ${getEstadoTarea(item.estado).color}`}>
                  {getEstadoTarea(item.estado).label}
                </span>
              )}
            </div>

            <h4 className={`font-medium text-gray-900 dark:text-white ${esTarea && item.estado === 'completada' ? 'line-through text-gray-500' : ''}`}>
              {item.titulo}
            </h4>

            {/* Descripción */}
            {item.descripcion && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {item.descripcion}
              </p>
            )}

            {/* Metadata específica */}
            {renderMetadata()}
          </div>

          {/* Acciones (hover) */}
          {(onComplete || onDelete) && (
            <div className={`flex items-center gap-1 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
              {esTarea && esPendiente && onComplete && (
                <button
                  onClick={() => onComplete(item)}
                  disabled={isLoading}
                  className="p-1.5 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                  title="Marcar como completada"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}

              {onDelete && item.fuente === 'manual' && (
                <button
                  onClick={() => onDelete(item)}
                  disabled={isLoading}
                  className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer: fecha y usuario */}
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatRelativeDate(item.fecha)}</span>

          {(item.usuario_nombre || item.asignado_nombre) && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>
                {item.asignado_nombre ? `Asignado a: ${item.asignado_nombre}` : item.usuario_nombre}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
