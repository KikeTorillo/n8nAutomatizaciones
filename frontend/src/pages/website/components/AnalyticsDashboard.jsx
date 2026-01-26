import { useState } from 'react';
import {
  BarChart3,
  Users,
  Eye,
  MousePointerClick,
  FileText,
  Clock,
  TrendingUp,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { Button, Select } from '@/components/ui';
import {
  useWebsiteAnalyticsResumen,
  useWebsiteAnalyticsPaginas,
  useWebsiteAnalyticsTiempoReal,
} from '@/hooks/otros/website';

/**
 * AnalyticsDashboard - Dashboard de metricas del sitio web
 */
function AnalyticsDashboard({ websiteId }) {
  const [periodo, setPeriodo] = useState(30);

  // Queries
  const {
    data: resumen,
    isLoading: loadingResumen,
    refetch: refetchResumen,
  } = useWebsiteAnalyticsResumen({ dias: periodo, website_id: websiteId });

  const {
    data: paginasPopulares,
    isLoading: loadingPaginas,
  } = useWebsiteAnalyticsPaginas({ dias: periodo, website_id: websiteId, limite: 5 });

  const {
    data: tiempoReal,
    isLoading: loadingTiempoReal,
  } = useWebsiteAnalyticsTiempoReal(websiteId, { refetchInterval: 30000 });

  const periodoOptions = [
    { value: 7, label: 'Ultimos 7 dias' },
    { value: 30, label: 'Ultimos 30 dias' },
    { value: 90, label: 'Ultimos 90 dias' },
  ];

  const metricas = resumen?.metricas || {};
  const porDispositivo = resumen?.por_dispositivo || [];
  const porFuente = resumen?.por_fuente || [];

  // Iconos para dispositivos
  const dispositivoIcono = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Analytics</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Metricas de tu sitio web
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={periodo}
            onChange={(e) => setPeriodo(parseInt(e.target.value))}
            options={periodoOptions}
            className="w-40"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchResumen()}
            className="p-2"
          >
            <RefreshCw className={`w-4 h-4 ${loadingResumen ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tiempo Real */}
      {tiempoReal && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-600 dark:text-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              En tiempo real (ultimos 5 min)
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                {tiempoReal.visitantes_activos || 0}
              </span>
              <span className="text-sm text-green-600 dark:text-green-400 ml-1">
                visitantes activos
              </span>
            </div>
            <div>
              <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                {tiempoReal.paginas_vistas || 0}
              </span>
              <span className="text-sm text-green-600 dark:text-green-400 ml-1">
                paginas vistas
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Metricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricaCard
          icono={Eye}
          titulo="Visitas totales"
          valor={metricas.visitas_totales || 0}
          color="blue"
          loading={loadingResumen}
        />
        <MetricaCard
          icono={Users}
          titulo="Visitantes unicos"
          valor={metricas.visitantes_unicos || 0}
          color="green"
          loading={loadingResumen}
        />
        <MetricaCard
          icono={MousePointerClick}
          titulo="Clics en CTA"
          valor={metricas.clics_cta || 0}
          color="amber"
          loading={loadingResumen}
        />
        <MetricaCard
          icono={FileText}
          titulo="Formularios"
          valor={metricas.formularios_enviados || 0}
          color="purple"
          loading={loadingResumen}
        />
      </div>

      {/* Grid de detalles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paginas populares */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">Paginas populares</h4>
          </div>

          {loadingPaginas ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : paginasPopulares?.length > 0 ? (
            <div className="space-y-2">
              {paginasPopulares.map((pagina, index) => (
                <div
                  key={pagina.pagina_slug || index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400 w-4">
                      {index + 1}.
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      /{pagina.pagina_slug || 'inicio'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{pagina.visitas} visitas</span>
                    <span>{pagina.visitantes_unicos} unicos</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Sin datos de paginas aun
            </p>
          )}
        </div>

        {/* Por dispositivo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">Por dispositivo</h4>
          </div>

          {loadingResumen ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : porDispositivo.length > 0 ? (
            <div className="space-y-3">
              {porDispositivo.map((item) => {
                const IconoDispositivo = dispositivoIcono[item.dispositivo] || Monitor;
                const total = porDispositivo.reduce((acc, d) => acc + parseInt(d.total), 0);
                const porcentaje = total > 0 ? Math.round((parseInt(item.total) / total) * 100) : 0;

                return (
                  <div key={item.dispositivo} className="flex items-center gap-3">
                    <IconoDispositivo className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="capitalize text-gray-700 dark:text-gray-300">
                          {item.dispositivo}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {item.total} ({porcentaje}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Sin datos de dispositivos aun
            </p>
          )}
        </div>

        {/* Por fuente de trafico */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">Fuentes de trafico</h4>
          </div>

          {loadingResumen ? (
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-24 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : porFuente.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {porFuente.map((item) => (
                <div
                  key={item.fuente}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {item.fuente}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.total} visitas
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Sin datos de fuentes aun
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Card de metrica individual
 */
function MetricaCard({ icono: Icono, titulo, valor, color, loading }) {
  const colores = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colores[color]}`}>
          <Icono className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{titulo}</p>
          {loading ? (
            <div className="h-6 w-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {valor.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
