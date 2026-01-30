/**
 * ====================================================================
 * COMPONENT: USAGE INDICATOR (SEAT-BASED BILLING)
 * ====================================================================
 * Indicador visual de uso de usuarios con barra de progreso.
 *
 * Estados visuales:
 * - Verde (<80%): Normal
 * - Amarillo (80-100%): Advertencia
 * - Rojo (>100%): Excedido
 *
 * @module components/suscripciones-negocio/UsageIndicator
 * @version 1.0.0
 * @date Enero 2026
 */

import { memo } from 'react';
import { Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Configuración de colores por estado
 */
const ESTADO_CONFIG = {
  normal: {
    bgBar: 'bg-green-500 dark:bg-green-400',
    bgTrack: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  },
  advertencia: {
    bgBar: 'bg-amber-500 dark:bg-amber-400',
    bgTrack: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  },
  excedido: {
    bgBar: 'bg-red-500 dark:bg-red-400',
    bgTrack: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
  },
};

/**
 * Determinar estado visual basado en porcentaje de uso
 */
const getEstado = (porcentaje) => {
  if (porcentaje >= 100) return 'excedido';
  if (porcentaje >= 80) return 'advertencia';
  return 'normal';
};

/**
 * Formatear precio como moneda
 */
const formatCurrency = (amount, currency = 'MXN') => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Indicador de uso de usuarios
 *
 * @param {Object} props
 * @param {number} props.usuariosActuales - Usuarios activos actualmente
 * @param {number} props.usuariosIncluidos - Usuarios incluidos en el plan
 * @param {number} props.maxUsuariosHard - Límite absoluto (null = ilimitado)
 * @param {number} props.porcentajeUso - Porcentaje de uso (puede ser >100)
 * @param {string} props.estadoUso - 'normal' | 'advertencia' | 'excedido'
 * @param {number} props.cobroAdicionalProyectado - Monto adicional proyectado
 * @param {number} props.precioUsuarioAdicional - Precio por usuario extra
 * @param {boolean} props.esHardLimit - Si el límite es duro (no permite exceder)
 * @param {string} props.planNombre - Nombre del plan
 * @param {string} props.className - Clases adicionales
 * @param {boolean} props.compact - Modo compacto (para uso en headers)
 */
function UsageIndicator({
  usuariosActuales = 0,
  usuariosIncluidos = 5,
  maxUsuariosHard = null,
  porcentajeUso = 0,
  estadoUso,
  cobroAdicionalProyectado = 0,
  precioUsuarioAdicional = 0,
  esHardLimit = false,
  planNombre = '',
  className,
  compact = false,
}) {
  // Calcular estado si no se proporciona
  const estado = estadoUso || getEstado(porcentajeUso);
  const config = ESTADO_CONFIG[estado] || ESTADO_CONFIG.normal;

  // Limitar barra visual a 100% máximo
  const barWidth = Math.min(porcentajeUso, 100);

  // Usuarios extra
  const usuariosExtra = Math.max(0, usuariosActuales - usuariosIncluidos);

  // Límite para mostrar en UI
  const limiteMostrar = maxUsuariosHard || usuariosIncluidos;

  if (compact) {
    // Modo compacto para headers/banners
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm',
          className
        )}
      >
        <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="text-gray-600 dark:text-gray-300">
          {usuariosActuales}/{limiteMostrar === usuariosActuales && maxUsuariosHard === null ? '∞' : limiteMostrar}
        </span>

        {cobroAdicionalProyectado > 0 && (
          <span className={cn(
            'px-1.5 py-0.5 text-xs font-medium rounded',
            config.badge
          )}>
            +{formatCurrency(cobroAdicionalProyectado)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      'bg-white dark:bg-gray-800',
      'border-gray-200 dark:border-gray-700',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Uso de Usuarios
          </h3>
        </div>

        {planNombre && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {planNombre}
          </span>
        )}
      </div>

      {/* Contador principal */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className={cn('text-2xl font-bold', config.text)}>
          {usuariosActuales}
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          / {maxUsuariosHard === null && !esHardLimit ? '∞' : limiteMostrar}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
          usuarios
        </span>
      </div>

      {/* Barra de progreso */}
      <div className={cn('h-2 rounded-full overflow-hidden', config.bgTrack)}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', config.bgBar)}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Info adicional */}
      <div className="mt-3 space-y-2">
        {/* Usuarios incluidos */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Incluidos en tu plan
          </span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {usuariosIncluidos} usuarios
          </span>
        </div>

        {/* Usuarios extra */}
        {usuariosExtra > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className={cn('flex items-center gap-1', config.text)}>
              <TrendingUp className="h-4 w-4" />
              Usuarios adicionales
            </span>
            <span className={cn('font-medium', config.text)}>
              {usuariosExtra} usuarios
            </span>
          </div>
        )}

        {/* Precio por usuario adicional (siempre mostrar si está configurado) */}
        {precioUsuarioAdicional > 0 && cobroAdicionalProyectado === 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Usuario adicional
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(precioUsuarioAdicional)}/mes
            </span>
          </div>
        )}

        {/* Costo adicional proyectado */}
        {cobroAdicionalProyectado > 0 && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Cobro adicional proyectado
              </span>
              <span className={cn(
                'px-2 py-0.5 text-sm font-semibold rounded',
                config.badge
              )}>
                +{formatCurrency(cobroAdicionalProyectado)}
              </span>
            </div>

            {precioUsuarioAdicional > 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formatCurrency(precioUsuarioAdicional)} por usuario adicional/mes
              </p>
            )}
          </div>
        )}

        {/* Advertencia si está cerca del límite */}
        {estado === 'advertencia' && (
          <div className={cn(
            'flex items-start gap-2 p-2 rounded-md mt-2',
            'bg-amber-50 dark:bg-amber-900/20'
          )}>
            <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Te acercas al límite de usuarios incluidos.
              {precioUsuarioAdicional > 0
                ? ` Los usuarios adicionales tienen un costo de ${formatCurrency(precioUsuarioAdicional)}/mes.`
                : ''}
            </p>
          </div>
        )}

        {/* Alerta si excedió límite */}
        {estado === 'excedido' && !esHardLimit && (
          <div className={cn(
            'flex items-start gap-2 p-2 rounded-md mt-2',
            'bg-red-50 dark:bg-red-900/20'
          )}>
            <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300">
              Has excedido el límite de usuarios incluidos.
              Se cobrará {formatCurrency(cobroAdicionalProyectado)} adicionales en tu próxima factura.
            </p>
          </div>
        )}

        {/* Alerta hard limit */}
        {estado === 'excedido' && esHardLimit && (
          <div className={cn(
            'flex items-start gap-2 p-2 rounded-md mt-2',
            'bg-red-50 dark:bg-red-900/20'
          )}>
            <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300">
              Has alcanzado el límite máximo de usuarios de tu plan.
              Actualiza tu plan para agregar más usuarios.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

UsageIndicator.displayName = 'UsageIndicator';

export default memo(UsageIndicator);
