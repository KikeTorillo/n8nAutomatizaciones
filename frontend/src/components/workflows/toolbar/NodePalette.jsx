/**
 * ====================================================================
 * NODE PALETTE - Paleta de nodos arrastrables
 * ====================================================================
 */

import { memo } from 'react';
import { Play, UserCheck, GitBranch, Zap, Square } from 'lucide-react';
import { NODE_METADATA } from '../nodes';

// Mapeo de iconos
const ICONS = {
  Play,
  UserCheck,
  GitBranch,
  Zap,
  Square,
};

// Colores de fondo por tipo
const BG_COLORS = {
  green: 'bg-green-500 hover:bg-green-600',
  primary: 'bg-primary-500 hover:bg-primary-600',
  amber: 'bg-amber-500 hover:bg-amber-600',
  blue: 'bg-primary-500 hover:bg-primary-600',
  red: 'bg-red-500 hover:bg-red-600',
};

/**
 * Item de la paleta (arrastrable)
 */
function PaletteItem({ type, metadata, disabled = false }) {
  const Icon = ICONS[metadata.icon] || Zap;
  const bgColor = BG_COLORS[metadata.color] || BG_COLORS.blue;

  const onDragStart = (event) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable={!disabled}
      onDragStart={onDragStart}
      className={`
        flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
        hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md
        transition-all group
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      title={disabled ? 'Solo puede haber uno' : `Arrastra para agregar: ${metadata.label}`}
    >
      <div className={`p-2 rounded-lg ${bgColor} text-white`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {metadata.label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {metadata.description}
        </p>
      </div>
    </div>
  );
}

/**
 * Paleta completa de nodos
 */
function NodePalette({ nodes = [], className = '' }) {
  // Determinar si hay nodo inicio ya colocado
  const tieneInicio = nodes.some((n) => n.type === 'inicio');

  // Ordenar nodos en orden logico
  const nodeOrder = ['inicio', 'aprobacion', 'condicion', 'accion', 'fin'];

  return (
    <div className={`p-4 space-y-2 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Componentes
      </h3>

      <div className="space-y-2">
        {nodeOrder.map((type) => {
          const metadata = NODE_METADATA[type];
          if (!metadata) return null;

          const disabled = type === 'inicio' && tieneInicio;

          return (
            <PaletteItem
              key={type}
              type={type}
              metadata={metadata}
              disabled={disabled}
            />
          );
        })}
      </div>

      {/* Tip */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Arrastra los componentes al canvas para construir tu workflow.
        </p>
      </div>
    </div>
  );
}

export default memo(NodePalette);
