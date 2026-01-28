import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileSpreadsheet,
  BarChart3,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calculator,
  Plus,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { ContabilidadPageLayout } from '@/components/contabilidad';
import { useDashboardContabilidad, useInicializarCatalogoSAT } from '@/hooks/otros';
import { formatCurrency } from '@/lib/utils';

/**
 * Página principal del módulo de contabilidad
 * Muestra dashboard con métricas y accesos rápidos
 */
function ContabilidadPage() {
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useDashboardContabilidad();
  const inicializarSAT = useInicializarCatalogoSAT();
  const [showInitConfirm, setShowInitConfirm] = useState(false);

  const handleInicializarSAT = async () => {
    try {
      await inicializarSAT.mutateAsync();
      setShowInitConfirm(false);
    } catch {
      // El error se maneja en el hook
    }
  };

  // Tarjetas de estadísticas
  const stats = [
    {
      title: 'Cuentas Activas',
      value: dashboard?.cuentas_activas || 0,
      icon: BookOpen,
      color: 'blue',
      description: 'Cuentas en el catálogo',
    },
    {
      title: 'Asientos del Mes',
      value: typeof dashboard?.asientos_mes === 'object'
        ? (dashboard?.asientos_mes?.publicados || 0) + (dashboard?.asientos_mes?.borradores || 0)
        : (dashboard?.asientos_mes || 0),
      icon: FileSpreadsheet,
      color: 'green',
      description: typeof dashboard?.asientos_mes === 'object'
        ? `${dashboard?.asientos_mes?.publicados || 0} publicados, ${dashboard?.asientos_mes?.borradores || 0} borradores`
        : 'Registrados este período',
    },
    {
      title: 'Período Actual',
      value: dashboard?.periodo_actual?.nombre || 'Sin configurar',
      icon: Clock,
      color: 'purple',
      description: dashboard?.periodo_actual?.estado || '',
      isText: true,
    },
    {
      title: 'Estado',
      value: dashboard?.configurado ? 'Configurado' : 'Pendiente',
      icon: dashboard?.configurado ? CheckCircle2 : AlertCircle,
      color: dashboard?.configurado ? 'green' : 'yellow',
      description: dashboard?.configurado ? 'Listo para usar' : 'Inicializar catálogo',
      isText: true,
    },
  ];

  // Colores según el tipo
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
      green: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
      purple: 'bg-secondary-100 dark:bg-secondary-900/40 text-secondary-600 dark:text-secondary-400',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
    };
    return colors[color] || colors.blue;
  };

  return (
    <ContabilidadPageLayout
      icon={LayoutDashboard}
      title="Dashboard"
      subtitle="Resumen y accesos rápidos"
    >
      {/* Dashboard Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.title} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</span>
                  </div>
                  <p className={`text-2xl font-bold ${stat.isText ? 'text-lg' : ''} text-gray-900 dark:text-gray-100`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Mensaje si no está configurado */}
        {!isLoading && !dashboard?.configurado && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                  Catálogo de Cuentas No Inicializado
                </h3>
                <p className="text-yellow-700 dark:text-yellow-400 text-sm mb-4">
                  Para comenzar a usar el módulo de contabilidad, necesitas inicializar el
                  catálogo de cuentas basado en el Código Agrupador SAT (Anexo 24). Esto
                  creará la estructura base de cuentas contables.
                </p>
                {showInitConfirm ? (
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={handleInicializarSAT}
                      disabled={inicializarSAT.isPending}
                    >
                      {inicializarSAT.isPending ? 'Inicializando...' : 'Confirmar Inicialización'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowInitConfirm(false)}
                      disabled={inicializarSAT.isPending}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => setShowInitConfirm(true)}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Inicializar Catálogo SAT
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Nuevo Asiento */}
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/contabilidad/asientos?nuevo=true')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                <Plus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Nuevo Asiento</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Registrar movimiento contable</p>
              </div>
            </div>
          </div>

          {/* Balanza */}
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/contabilidad/reportes?tipo=balanza')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Balanza de Comprobación</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ver saldos del período</p>
              </div>
            </div>
          </div>

          {/* Estado de Resultados */}
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/contabilidad/reportes?tipo=resultados')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary-100 dark:bg-secondary-900/40 rounded-lg">
                <DollarSign className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Estado de Resultados</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pérdidas y ganancias</p>
              </div>
            </div>
          </div>
        </div>

      {/* Información adicional */}
      <div className="mt-8 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-6">
        <h3 className="font-semibold text-primary-800 dark:text-primary-300 mb-2">Contabilidad Electrónica SAT</h3>
        <p className="text-primary-700 dark:text-primary-400 text-sm">
          Este módulo está basado en el Código Agrupador de Cuentas del SAT (Anexo 24),
          cumpliendo con los requerimientos de la contabilidad electrónica en México.
          Soporta partida doble, períodos contables y los principales reportes financieros.
        </p>
      </div>
    </ContabilidadPageLayout>
  );
}

export default ContabilidadPage;
