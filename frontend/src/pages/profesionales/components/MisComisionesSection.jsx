/**
 * MisComisionesSection - Resumen de comisiones del profesional
 *
 * Se integra en CompensacionTab.jsx despues de CuentasBancariasSection.
 * Muestra el resumen del periodo actual y las ultimas 5 comisiones.
 *
 * Enero 2026
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Calendar,
  ShoppingCart,
  Wallet
} from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useComisionesProfesional } from '@/hooks/otros';
import { useCurrency } from '@/hooks/utils';
import { cn } from '@/lib/utils';

// ====================================================================
// CONSTANTES
// ====================================================================

const ESTADOS_COMISION = {
  pendiente: {
    label: 'Pendiente',
    icon: Clock,
    classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
  pagada: {
    label: 'Pagada',
    icon: CheckCircle,
    classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  cancelada: {
    label: 'Cancelada',
    icon: AlertCircle,
    classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

const ORIGENES_COMISION = {
  cita: {
    label: 'Cita',
    icon: Calendar,
  },
  venta: {
    label: 'Venta',
    icon: ShoppingCart,
  },
};

// ====================================================================
// COMPONENTES AUXILIARES
// ====================================================================

/**
 * Badge de estado de comision
 */
function EstadoBadge({ estado }) {
  const config = ESTADOS_COMISION[estado] || ESTADOS_COMISION.pendiente;
  const Icon = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      config.classes
    )}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

/**
 * Card de resumen con metricas
 */
function ResumenCard({ icon: Icon, label, value, colorClass = 'text-gray-900 dark:text-gray-100' }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className={cn('text-lg font-semibold', colorClass)}>
        {value}
      </p>
    </div>
  );
}

/**
 * Fila de comision individual
 */
function ComisionItem({ comision, formatCurrency }) {
  const origenConfig = ORIGENES_COMISION[comision.origen] || ORIGENES_COMISION.cita;
  const OrigenIcon = origenConfig.icon;

  // Obtener nombre del servicio/producto desde detalle JSONB
  const nombreItem = useMemo(() => {
    if (comision.detalle_servicios?.length > 0) {
      return comision.detalle_servicios[0].nombre || 'Servicio';
    }
    if (comision.detalle_productos?.length > 0) {
      return comision.detalle_productos[0].nombre || 'Producto';
    }
    return origenConfig.label;
  }, [comision.detalle_servicios, comision.detalle_productos, origenConfig.label]);

  // Formatear fecha
  const fechaFormateada = useMemo(() => {
    const fecha = comision.creado_en || comision.fecha_cita;
    if (!fecha) return '-';
    try {
      return format(new Date(fecha), "d 'de' MMM", { locale: es });
    } catch {
      return '-';
    }
  }, [comision.creado_en, comision.fecha_cita]);

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Icono de origen */}
        <div className="flex-shrink-0 p-1.5 bg-gray-100 dark:bg-gray-700 rounded">
          <OrigenIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {nombreItem}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {fechaFormateada}
          </p>
        </div>
      </div>

      {/* Monto y estado */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(parseFloat(comision.monto_comision || 0))}
        </span>
        <EstadoBadge estado={comision.estado_pago} />
      </div>
    </div>
  );
}

/**
 * Skeleton para estado de carga
 */
function ComisionesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Skeleton resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg h-16" />
        ))}
      </div>

      {/* Skeleton lista */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-2/3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/3" />
            </div>
            <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

/**
 * Seccion de comisiones del profesional
 * @param {Object} props
 * @param {number} props.profesionalId - ID del profesional
 */
function MisComisionesSection({ profesionalId }) {
  const { formatCurrency } = useCurrency();

  // Calcular fechas del mes actual
  const { fechaDesde, fechaHasta, mesActual } = useMemo(() => {
    const hoy = new Date();
    return {
      fechaDesde: format(startOfMonth(hoy), 'yyyy-MM-dd'),
      fechaHasta: format(endOfMonth(hoy), 'yyyy-MM-dd'),
      mesActual: format(hoy, 'MMMM yyyy', { locale: es }),
    };
  }, []);

  // Query de comisiones
  const { data, isLoading, error } = useComisionesProfesional(profesionalId, {
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
    limite: 5,
  });

  const comisiones = data?.comisiones || [];
  const resumen = data?.resumen || {};
  const totalComisiones = data?.total || 0;

  // ==================== ESTADOS ====================

  // Estado de carga
  if (isLoading) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Mis Comisiones
          </h4>
        </div>
        <ComisionesSkeleton />
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Mis Comisiones
          </h4>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Error al cargar las comisiones</span>
          </div>
        </div>
      </div>
    );
  }

  // Estado vacio
  if (comisiones.length === 0) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Mis Comisiones
          </h4>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
          <Wallet className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Sin comisiones en {mesActual}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Las comisiones apareceran aqui cuando se completen citas o ventas
          </p>
        </div>
      </div>
    );
  }

  // ==================== RENDER PRINCIPAL ====================

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Mis Comisiones
          </h4>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400 capitalize">
            {mesActual}
          </span>
        </div>
      </div>

      {/* Resumen del periodo */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <ResumenCard
          icon={TrendingUp}
          label="Total"
          value={formatCurrency(resumen.total || 0)}
          colorClass="text-primary-700 dark:text-primary-400"
        />
        <ResumenCard
          icon={Clock}
          label="Pendientes"
          value={formatCurrency(resumen.total_pendientes || 0)}
          colorClass="text-amber-600 dark:text-amber-400"
        />
        <ResumenCard
          icon={CheckCircle}
          label="Pagadas"
          value={formatCurrency(resumen.total_pagadas || 0)}
          colorClass="text-green-600 dark:text-green-400"
        />
      </div>

      {/* Lista de ultimas comisiones */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
          Ultimas comisiones
        </p>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {comisiones.map((comision) => (
            <ComisionItem
              key={comision.id}
              comision={comision}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      </div>

      {/* Link a reportes completos */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <Link
          to={`/comisiones/reportes?profesional_id=${profesionalId}`}
          className="flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Ver reportes detallados
          {totalComisiones > 5 && (
            <span className="text-xs text-gray-500">({totalComisiones} total)</span>
          )}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default MisComisionesSection;
