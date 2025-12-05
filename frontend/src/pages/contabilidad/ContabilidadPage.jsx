import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
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
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useDashboardContabilidad, useInicializarCatalogoSAT } from '@/hooks/useContabilidad';
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
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      yellow: 'bg-yellow-100 text-yellow-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/home')}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Inicio
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Contabilidad
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Gestión contable con catálogo SAT México
              </p>
            </div>

            {/* Navegación rápida */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate('/contabilidad/cuentas')}
                className="flex-1 sm:flex-none text-sm"
              >
                <BookOpen className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Catálogo</span>
                <span className="sm:hidden">Cuentas</span>
              </Button>

              <Button
                variant="secondary"
                onClick={() => navigate('/contabilidad/asientos')}
                className="flex-1 sm:flex-none text-sm"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1 sm:mr-2" />
                Asientos
              </Button>

              <Button
                variant="primary"
                onClick={() => navigate('/contabilidad/reportes')}
                className="flex-1 sm:flex-none text-sm"
              >
                <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
                Reportes
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.title} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm text-gray-500">{stat.title}</span>
                  </div>
                  <p className={`text-2xl font-bold ${stat.isText ? 'text-lg' : ''} text-gray-900`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Mensaje si no está configurado */}
        {!isLoading && !dashboard?.configurado && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Catálogo de Cuentas No Inicializado
                </h3>
                <p className="text-yellow-700 text-sm mb-4">
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
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/contabilidad/asientos?nuevo=true')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Nuevo Asiento</h3>
                <p className="text-sm text-gray-500">Registrar movimiento contable</p>
              </div>
            </div>
          </div>

          {/* Balanza */}
          <div
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/contabilidad/reportes?tipo=balanza')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Balanza de Comprobación</h3>
                <p className="text-sm text-gray-500">Ver saldos del período</p>
              </div>
            </div>
          </div>

          {/* Estado de Resultados */}
          <div
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/contabilidad/reportes?tipo=resultados')}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Estado de Resultados</h3>
                <p className="text-sm text-gray-500">Pérdidas y ganancias</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">Contabilidad Electrónica SAT</h3>
          <p className="text-blue-700 text-sm">
            Este módulo está basado en el Código Agrupador de Cuentas del SAT (Anexo 24),
            cumpliendo con los requerimientos de la contabilidad electrónica en México.
            Soporta partida doble, períodos contables y los principales reportes financieros.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ContabilidadPage;
