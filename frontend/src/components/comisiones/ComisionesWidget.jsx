import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { useDashboardComisiones } from '@/hooks/otros';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Widget compacto de comisiones para el dashboard principal
 * Muestra resumen de comisiones del mes actual
 */
function ComisionesWidget() {
  const hoy = new Date();
  const fechaDesde = format(startOfMonth(hoy), 'yyyy-MM-dd');
  const fechaHasta = format(endOfMonth(hoy), 'yyyy-MM-dd');

  const { data: dashboard, isLoading } = useDashboardComisiones({
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    );
  }

  const totalComisiones = parseFloat(dashboard?.total_comisiones || 0);
  const comisionesPendientes = parseFloat(dashboard?.comisiones_pendientes || 0);
  const comisionesPagadas = parseFloat(dashboard?.comisiones_pagadas || 0);
  const totalProfesionales = parseInt(dashboard?.total_profesionales || 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Comisiones del Mes</h3>
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total del mes */}
        <div className="mb-3">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(totalComisiones)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {format(hoy, "MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6 space-y-4">
        {/* Pendientes */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 mr-3">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(comisionesPendientes)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pendientes de pago</p>
            </div>
          </div>
        </div>

        {/* Pagadas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-400 mr-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(comisionesPagadas)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pagadas</p>
            </div>
          </div>
        </div>

        {/* Total profesionales */}
        {totalProfesionales > 0 && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-100">{totalProfesionales}</span>{' '}
              {totalProfesionales === 1 ? 'profesional' : 'profesionales'} con comisiones este mes
            </p>
          </div>
        )}
      </div>

      {/* Link a vista completa */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <Link
          to="/comisiones"
          className="flex items-center justify-between text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          <span>Ver dashboard completo</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default ComisionesWidget;
