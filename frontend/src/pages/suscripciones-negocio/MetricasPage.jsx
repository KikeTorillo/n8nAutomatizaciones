import { useState } from 'react';
import { BarChart3, DollarSign, Users, TrendingDown, Heart, RefreshCw } from 'lucide-react';
import { Select, StatCard, Button } from '@/components/ui';
import {
  useMetricasDashboard,
  useEvolucionMRR,
  useEvolucionChurn,
  useEvolucionSuscriptores,
  useDistribucionEstado,
  useTopPlanes,
} from '@/hooks/suscripciones-negocio';
import {
  MRRChart,
  ChurnChart,
  SuscriptoresChart,
  DistribucionEstadoChart,
  TopPlanesChart,
} from '@/components/suscripciones-negocio';
import { formatCurrency } from '@/lib/utils';

/**
 * Opciones de período
 */
const PERIODOS = [
  { value: '6', label: 'Últimos 6 meses' },
  { value: '12', label: 'Último año' },
  { value: '24', label: 'Últimos 2 años' },
];

/**
 * Página de métricas y análisis SaaS
 */
function MetricasPage() {
  const [meses, setMeses] = useState(12);

  // Queries
  const { data: dashboard, isLoading: loadingDashboard, refetch } = useMetricasDashboard();
  const { data: evolucionMRR, isLoading: loadingMRR } = useEvolucionMRR({ meses });
  const { data: evolucionChurn, isLoading: loadingChurn } = useEvolucionChurn({ meses });
  const { data: evolucionSuscriptores, isLoading: loadingSuscriptores } = useEvolucionSuscriptores({ meses });
  const { data: distribucion, isLoading: loadingDistribucion } = useDistribucionEstado();
  const { data: topPlanes, isLoading: loadingTopPlanes } = useTopPlanes({ limite: 5 });

  // Métricas
  const mrr = parseFloat(dashboard?.mrr || 0);
  const arr = parseFloat(dashboard?.arr || 0);
  const churnRate = parseFloat(dashboard?.churn_rate || 0);
  const ltv = parseFloat(dashboard?.ltv || 0);
  const suscriptoresActivos = parseInt(dashboard?.suscriptores_activos || 0);
  const crecimiento = parseFloat(dashboard?.crecimiento || 0);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
            <BarChart3 className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Métricas SaaS
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Análisis detallado de suscripciones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={meses.toString()}
            onChange={(e) => setMeses(parseInt(e.target.value))}
            className="w-48"
          >
            {PERIODOS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="MRR"
          value={formatCurrency(mrr)}
          icon={DollarSign}
          color="success"
          isLoading={loadingDashboard}
        />
        <StatCard
          title="ARR"
          value={formatCurrency(arr)}
          icon={DollarSign}
          color="primary"
          isLoading={loadingDashboard}
        />
        <StatCard
          title="Suscriptores"
          value={suscriptoresActivos}
          icon={Users}
          color="info"
          isLoading={loadingDashboard}
        />
        <StatCard
          title="Churn Rate"
          value={`${churnRate.toFixed(1)}%`}
          icon={TrendingDown}
          color={churnRate > 5 ? 'error' : 'warning'}
          isLoading={loadingDashboard}
        />
        <StatCard
          title="LTV"
          value={formatCurrency(ltv)}
          icon={Heart}
          color="purple"
          isLoading={loadingDashboard}
        />
        <StatCard
          title="Crecimiento"
          value={`${crecimiento >= 0 ? '+' : ''}${crecimiento.toFixed(1)}%`}
          icon={TrendingDown}
          color={crecimiento >= 0 ? 'success' : 'error'}
          isLoading={loadingDashboard}
        />
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MRRChart data={evolucionMRR} isLoading={loadingMRR} />
        <ChurnChart data={evolucionChurn} isLoading={loadingChurn} />
      </div>

      {/* Gráficas secundarias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SuscriptoresChart data={evolucionSuscriptores} isLoading={loadingSuscriptores} />
        <DistribucionEstadoChart data={distribucion} isLoading={loadingDistribucion} />
        <TopPlanesChart data={topPlanes} isLoading={loadingTopPlanes} />
      </div>

      {/* Info adicional */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Definiciones de Métricas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-900 dark:text-gray-100">MRR</dt>
            <dd className="text-gray-500 dark:text-gray-400">
              Monthly Recurring Revenue - Ingresos mensuales recurrentes de suscripciones activas
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900 dark:text-gray-100">ARR</dt>
            <dd className="text-gray-500 dark:text-gray-400">
              Annual Recurring Revenue - MRR × 12, proyección anual de ingresos
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900 dark:text-gray-100">Churn Rate</dt>
            <dd className="text-gray-500 dark:text-gray-400">
              Porcentaje de suscriptores que cancelan en un período dado
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900 dark:text-gray-100">LTV</dt>
            <dd className="text-gray-500 dark:text-gray-400">
              Lifetime Value - Valor promedio que genera un cliente durante toda su relación
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900 dark:text-gray-100">Crecimiento</dt>
            <dd className="text-gray-500 dark:text-gray-400">
              Variación porcentual del MRR respecto al mes anterior
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MetricasPage;
