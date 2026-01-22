import { Link } from 'react-router-dom';
import {
  CreditCard,
  Package,
  Users,
  TrendingUp,
  Tag,
  Receipt,
  BarChart3,
  ArrowRight,
  DollarSign,
  Percent,
} from 'lucide-react';
import { StatCard, Button } from '@/components/ui';
import { useMetricasDashboard } from '@/hooks/suscripciones-negocio';
import { formatCurrency } from '@/lib/utils';

/**
 * Dashboard principal del módulo Suscripciones-Negocio
 */
function SuscripcionesNegocioPage() {
  const { data: metricas, isLoading } = useMetricasDashboard();

  // Links de navegación
  const navLinks = [
    {
      to: '/suscripciones-negocio/planes',
      icon: Package,
      title: 'Planes',
      description: 'Gestiona planes de suscripción',
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      to: '/suscripciones-negocio/suscripciones',
      icon: Users,
      title: 'Suscripciones',
      description: 'Ver todas las suscripciones',
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    },
    {
      to: '/suscripciones-negocio/cupones',
      icon: Tag,
      title: 'Cupones',
      description: 'Códigos de descuento',
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    },
    {
      to: '/suscripciones-negocio/pagos',
      icon: Receipt,
      title: 'Pagos',
      description: 'Historial de transacciones',
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      to: '/suscripciones-negocio/metricas',
      icon: BarChart3,
      title: 'Métricas',
      description: 'Análisis detallado',
      color: 'text-primary-600 bg-primary-100 dark:bg-primary-900/30',
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
          <CreditCard className="h-8 w-8 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Suscripciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestión de planes y suscripciones de clientes
          </p>
        </div>
      </div>

      {/* KPIs */}
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

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="group flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all"
          >
            <div className={`p-3 rounded-lg ${link.color}`}>
              <link.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {link.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {link.description}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Acciones Rápidas
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button as={Link} to="/suscripciones-negocio/planes" variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Crear Plan
          </Button>
          <Button as={Link} to="/suscripciones-negocio/suscripciones" variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Nueva Suscripción
          </Button>
          <Button as={Link} to="/suscripciones-negocio/cupones" variant="outline">
            <Tag className="h-4 w-4 mr-2" />
            Crear Cupón
          </Button>
          <Button as={Link} to="/suscripciones-negocio/metricas" variant="primary">
            <BarChart3 className="h-4 w-4 mr-2" />
            Ver Métricas Completas
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SuscripcionesNegocioPage;
