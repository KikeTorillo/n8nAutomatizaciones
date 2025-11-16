import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { useDashboardComisiones } from '@/hooks/useComisiones';
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
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-gray-200 rounded w-32"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  const totalComisiones = parseFloat(dashboard?.total_comisiones || 0);
  const comisionesPendientes = parseFloat(dashboard?.comisiones_pendientes || 0);
  const comisionesPagadas = parseFloat(dashboard?.comisiones_pagadas || 0);
  const totalProfesionales = parseInt(dashboard?.total_profesionales || 0);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Comisiones del Mes</h3>
          <div className="p-2 rounded-lg bg-green-50 text-green-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total del mes */}
        <div className="mb-3">
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(totalComisiones)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {format(hoy, "MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6 space-y-4">
        {/* Pendientes */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600 mr-3">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(comisionesPendientes)}
              </p>
              <p className="text-xs text-gray-500">Pendientes de pago</p>
            </div>
          </div>
        </div>

        {/* Pagadas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-50 text-green-600 mr-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(comisionesPagadas)}
              </p>
              <p className="text-xs text-gray-500">Pagadas</p>
            </div>
          </div>
        </div>

        {/* Total profesionales */}
        {totalProfesionales > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <span className="font-medium text-gray-900">{totalProfesionales}</span>{' '}
              {totalProfesionales === 1 ? 'profesional' : 'profesionales'} con comisiones este mes
            </p>
          </div>
        )}
      </div>

      {/* Link a vista completa */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <Link
          to="/comisiones"
          className="flex items-center justify-between text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          <span>Ver dashboard completo</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default ComisionesWidget;
