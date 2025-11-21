import { AlertCircle, TrendingDown, Clock, XCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { useDashboardAlertas } from '@/hooks/useInventario';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Widget de alertas para el Dashboard
 * Muestra las 5 alertas más recientes no leídas
 */
function AlertasWidget() {
  // Query
  const { data: alertasData, isLoading } = useDashboardAlertas();
  const alertas = alertasData?.alertas || [];

  // Helpers
  const getTipoAlertaIcon = (tipo) => {
    const icons = {
      stock_minimo: TrendingDown,
      stock_agotado: XCircle,
      proximo_vencimiento: Clock,
      vencido: AlertCircle,
      sin_movimiento: Clock,
    };
    return icons[tipo] || AlertCircle;
  };

  const getTipoAlertaLabel = (tipo) => {
    const labels = {
      stock_minimo: 'Stock Mínimo',
      stock_agotado: 'Stock Agotado',
      proximo_vencimiento: 'Próximo Vencimiento',
      vencido: 'Vencido',
      sin_movimiento: 'Sin Movimiento',
    };
    return labels[tipo] || tipo;
  };

  const getNivelColor = (nivel) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[nivel] || colors.info;
  };

  const getNivelIcon = (nivel) => {
    const colors = {
      info: 'text-blue-600',
      warning: 'text-yellow-600',
      critical: 'text-red-600',
    };
    return colors[nivel] || colors.info;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Alertas de Inventario</h2>
        </div>
        <Link to="/inventario/alertas">
          <Button variant="secondary" size="sm" icon={ChevronRight}>
            Ver todas
          </Button>
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-sm text-gray-600">Cargando alertas...</span>
        </div>
      ) : alertas.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">No hay alertas pendientes</p>
          <p className="text-xs text-gray-500 mt-1">
            El inventario está en buen estado
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map((alerta) => {
            const Icon = getTipoAlertaIcon(alerta.tipo_alerta);
            return (
              <div
                key={alerta.id}
                className={`flex items-start p-3 rounded-lg border-2 ${
                  alerta.nivel === 'critical'
                    ? 'border-red-200 bg-red-50'
                    : alerta.nivel === 'warning'
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                <Icon className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${getNivelIcon(alerta.nivel)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getNivelColor(alerta.nivel)}`}>
                          {getTipoAlertaLabel(alerta.tipo_alerta)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(alerta.creado_en), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {alerta.producto_nombre}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{alerta.mensaje}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {alertas.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <Link to="/inventario/alertas" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Ver todas las alertas →
          </Link>
        </div>
      )}
    </div>
  );
}

export default AlertasWidget;
