/**
 * ====================================================================
 * BASE NODE - Componente base para nodos del workflow
 * ====================================================================
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * Estilos base para los diferentes tipos de nodos
 */
export const NODE_STYLES = {
  inicio: {
    bg: 'bg-green-500 dark:bg-green-600',
    border: 'border-green-600 dark:border-green-500',
    text: 'text-white',
    icon: 'text-white',
  },
  aprobacion: {
    bg: 'bg-primary-500 dark:bg-primary-600',
    border: 'border-primary-600 dark:border-primary-500',
    text: 'text-white',
    icon: 'text-white',
  },
  condicion: {
    bg: 'bg-amber-500 dark:bg-amber-600',
    border: 'border-amber-600 dark:border-amber-500',
    text: 'text-white',
    icon: 'text-white',
  },
  accion: {
    bg: 'bg-blue-500 dark:bg-blue-600',
    border: 'border-blue-600 dark:border-blue-500',
    text: 'text-white',
    icon: 'text-white',
  },
  fin: {
    bg: 'bg-red-500 dark:bg-red-600',
    border: 'border-red-600 dark:border-red-500',
    text: 'text-white',
    icon: 'text-white',
  },
};

/**
 * Handle personalizado con estilo consistente
 */
export function NodeHandle({ type, position, id, style = {} }) {
  return (
    <Handle
      type={type}
      position={position}
      id={id}
      className="!w-3 !h-3 !bg-gray-400 dark:!bg-gray-500 !border-2 !border-white dark:!border-gray-800 hover:!bg-primary-500 transition-colors"
      style={style}
    />
  );
}

/**
 * Indicador de error/warning para nodos
 */
function ValidationIndicator({ hasError, hasWarning }) {
  if (!hasError && !hasWarning) return null;

  return (
    <div
      className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
        hasError
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-amber-500 text-white'
      }`}
      title={hasError ? 'Este nodo tiene errores' : 'Este nodo tiene advertencias'}
    >
      !
    </div>
  );
}

/**
 * Componente base para nodos
 */
function BaseNode({
  children,
  selected,
  nodeType = 'accion',
  className = '',
  isCircle = false,
  isDiamond = false,
  hasError = false,
  hasWarning = false,
}) {
  const styles = NODE_STYLES[nodeType] || NODE_STYLES.accion;

  // Agregar borde de error/warning si aplica
  const errorBorder = hasError
    ? 'ring-2 ring-red-500 ring-offset-1'
    : hasWarning
    ? 'ring-2 ring-amber-500 ring-offset-1'
    : '';

  const baseClasses = `
    ${styles.bg} ${styles.border} ${styles.text}
    border-2 shadow-lg transition-all duration-200
    ${selected ? 'ring-2 ring-primary-400 ring-offset-2 dark:ring-offset-gray-900' : errorBorder}
    ${isCircle ? 'rounded-full' : isDiamond ? 'rounded-lg' : 'rounded-lg'}
  `;

  if (isDiamond) {
    return (
      <div className={`relative ${baseClasses} ${className} rotate-45 w-16 h-16`}>
        <div className="-rotate-45 w-full h-full flex items-center justify-center">
          {children}
        </div>
        <div className="-rotate-45">
          <ValidationIndicator hasError={hasError} hasWarning={hasWarning} />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${baseClasses} ${className}`}>
      {children}
      <ValidationIndicator hasError={hasError} hasWarning={hasWarning} />
    </div>
  );
}

export default memo(BaseNode);
