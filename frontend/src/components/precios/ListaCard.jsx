import {
  Edit2,
  Trash2,
  Users,
  Package,
  Star,
  Percent,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * Card de Lista de Precios
 */
export default function ListaCard({ lista, onEdit, onDelete, onVerItems, onVerClientes }) {
  return (
    <div className={`
      bg-white dark:bg-gray-800 rounded-xl border p-4
      ${lista.activo
        ? 'border-gray-200 dark:border-gray-700'
        : 'border-gray-100 dark:border-gray-800 opacity-60'
      }
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {lista.es_default && (
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          )}
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {lista.codigo}
          </span>
        </div>
        <span className={`
          text-xs px-2 py-0.5 rounded-full
          ${lista.activo
            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }
        `}>
          {lista.activo ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      {/* Info */}
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {lista.nombre}
      </h3>
      {lista.descripcion && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {lista.descripcion}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-1">
          <span className="font-medium text-primary-600 dark:text-primary-400">
            {lista.moneda}
          </span>
        </div>
        {lista.descuento_global_pct > 0 && (
          <div className="flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" />
            <span>{lista.descuento_global_pct}%</span>
          </div>
        )}
      </div>

      {/* Counters */}
      <div className="flex items-center gap-4 text-sm border-t border-gray-100 dark:border-gray-700 pt-3 mb-4">
        <button
          onClick={onVerItems}
          className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <Package className="w-4 h-4" />
          <span>{lista.total_items || 0} items</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onVerClientes}
          className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <Users className="w-4 h-4" />
          <span>{lista.total_clientes || 0} clientes</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit} className="flex-1">
          <Edit2 className="w-4 h-4" />
          Editar
        </Button>
        {!lista.es_default && (
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        )}
      </div>
    </div>
  );
}
