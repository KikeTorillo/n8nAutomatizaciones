import { Users, TrendingUp, DollarSign, Percent } from 'lucide-react';
import { StatCard } from '@/components/ui';
import { SuscripcionesNegocioPageLayout } from '@/components/suscripciones-negocio';
import { useMetricasDashboard } from '@/hooks/suscripciones-negocio';
import { formatCurrency } from '@/lib/utils';

/**
 * Dashboard principal del módulo Suscripciones-Negocio
 * Muestra KPIs clave: MRR, Suscriptores, Churn Rate, LTV
 */
function SuscripcionesNegocioPage() {
  const { data: metricas, isLoading } = useMetricasDashboard();

  return (
    <SuscripcionesNegocioPageLayout hideSectionHeader>
      {/* KPIs - Solo mostrar si tiene permiso */}
      {!metricas?.sinPermiso && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="MRR"
            value={formatCurrency(metricas?.mrr || 0)}
            subtitle="Ingresos Mensuales Recurrentes"
            icon={DollarSign}
            color="success"
            variant="expanded"
            isLoading={isLoading}
          />

          <StatCard
            title="Suscriptores Activos"
            value={metricas?.suscriptores_activos || 0}
            subtitle="Con suscripción vigente"
            icon={Users}
            color="primary"
            variant="expanded"
            isLoading={isLoading}
          />

          <StatCard
            title="Churn Rate"
            value={`${(metricas?.churn_rate || 0).toFixed(1)}%`}
            subtitle="Tasa de cancelación mensual"
            icon={Percent}
            color={parseFloat(metricas?.churn_rate || 0) > 5 ? 'error' : 'warning'}
            variant="expanded"
            isLoading={isLoading}
          />

          <StatCard
            title="LTV Promedio"
            value={formatCurrency(metricas?.ltv || 0)}
            subtitle="Valor de vida del cliente"
            icon={TrendingUp}
            color="info"
            variant="expanded"
            isLoading={isLoading}
          />
        </div>
      )}
    </SuscripcionesNegocioPageLayout>
  );
}

export default SuscripcionesNegocioPage;
