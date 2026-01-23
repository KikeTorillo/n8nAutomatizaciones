import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Sparkles } from 'lucide-react';
import { Button, Badge, LoadingSpinner } from '@/components/ui';
import { suscripcionesNegocioApi } from '@/services/api/modules/suscripciones-negocio.api';
import { CheckoutModal } from '@/components/checkout';
import { formatCurrency, cn } from '@/lib/utils';
import { CICLO_LABELS, CICLOS_FACTURACION } from '@/hooks/suscripciones-negocio';

/**
 * Página pública para ver y seleccionar planes de suscripción
 *
 * Esta página puede ser accedida sin autenticación para ver los planes,
 * pero el checkout requiere estar autenticado.
 */
function PlanesPublicPage() {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(CICLOS_FACTURACION.MENSUAL);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Obtener planes públicos de Nexo Team (sin autenticación)
  const {
    data: planesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['planes-publicos'],
    queryFn: () => suscripcionesNegocioApi.listarPlanesPublicos(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // planesData.data = respuesta del API { success, data: [...planes...] }
  const planes = Array.isArray(planesData?.data?.data)
    ? planesData.data.data
    : planesData?.data?.items || planesData?.data?.planes || [];

  // Calcular precio según período
  const calcularPrecio = (plan, periodo) => {
    switch (periodo) {
      case CICLOS_FACTURACION.MENSUAL:
        return parseFloat(plan.precio_mensual) || 0;
      case CICLOS_FACTURACION.TRIMESTRAL:
        return parseFloat(plan.precio_trimestral) || (parseFloat(plan.precio_mensual) * 3) || 0;
      case CICLOS_FACTURACION.SEMESTRAL:
        return (parseFloat(plan.precio_mensual) * 6) || 0;
      case CICLOS_FACTURACION.ANUAL:
        return parseFloat(plan.precio_anual) || (parseFloat(plan.precio_mensual) * 12) || 0;
      default:
        return parseFloat(plan.precio_mensual) || 0;
    }
  };

  // Calcular ahorro anual vs mensual
  const calcularAhorro = (plan) => {
    const precioMensualAnualizado = parseFloat(plan.precio_mensual) * 12;
    const precioAnual = parseFloat(plan.precio_anual) || precioMensualAnualizado;
    const ahorro = precioMensualAnualizado - precioAnual;
    return ahorro > 0 ? ahorro : 0;
  };

  // Manejar selección de plan
  const handleSeleccionarPlan = (plan) => {
    setPlanSeleccionado(plan);
    setCheckoutOpen(true);
  };

  // Cerrar checkout
  const handleCloseCheckout = () => {
    setCheckoutOpen(false);
    setPlanSeleccionado(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Error al cargar los planes
          </p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="py-16 px-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Elige el plan perfecto para tu negocio
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Comienza gratis y escala cuando lo necesites. Todos los planes incluyen soporte y actualizaciones.
        </p>
      </div>

      {/* Selector de período */}
      <div className="flex justify-center mb-12">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 inline-flex">
          {Object.entries(CICLO_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriodoSeleccionado(key)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                periodoSeleccionado === key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              {label}
              {key === CICLOS_FACTURACION.ANUAL && (
                <span className="ml-1.5 text-xs text-green-600 dark:text-green-400">
                  Ahorra hasta 20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de planes */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {planes.map((plan) => {
            const precio = calcularPrecio(plan, periodoSeleccionado);
            const precioMensual = parseFloat(plan.precio_mensual) || 0;
            const ahorro = periodoSeleccionado === CICLOS_FACTURACION.ANUAL
              ? calcularAhorro(plan)
              : 0;
            const features = plan.features || [];
            const isPopular = plan.destacado;
            const diasTrial = plan.dias_trial || 0;

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative bg-white dark:bg-gray-800 rounded-2xl border-2 p-6 transition-all hover:shadow-lg',
                  isPopular
                    ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                )}
              >
                {/* Badge popular */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="primary" size="sm" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      Recomendado
                    </Badge>
                  </div>
                )}

                {/* Nombre del plan */}
                <div className="text-center mb-6">
                  {plan.icono && (
                    <div
                      className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center"
                      style={{ backgroundColor: plan.color || '#6366F1' }}
                    >
                      <span className="text-white text-xl font-bold">
                        {plan.nombre?.charAt(0) || 'P'}
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {plan.nombre}
                  </h3>
                  {plan.descripcion && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {plan.descripcion}
                    </p>
                  )}
                </div>

                {/* Precio */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(precio)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      /{CICLO_LABELS[periodoSeleccionado]?.toLowerCase() || 'mes'}
                    </span>
                  </div>

                  {/* Precio mensual equivalente para planes anuales */}
                  {periodoSeleccionado === CICLOS_FACTURACION.ANUAL && precioMensual > 0 && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(precio / 12)}/mes
                    </p>
                  )}

                  {/* Ahorro */}
                  {ahorro > 0 && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                      Ahorras {formatCurrency(ahorro)} al año
                    </p>
                  )}

                  {/* Trial */}
                  {diasTrial > 0 && (
                    <p className="mt-2 text-sm text-primary-600 dark:text-primary-400 font-medium">
                      {diasTrial} días de prueba gratis
                    </p>
                  )}
                </div>

                {/* Features */}
                {features.length > 0 && (
                  <ul className="space-y-3 mb-6">
                    {features.slice(0, 6).map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                    {features.length > 6 && (
                      <li className="text-sm text-gray-500 dark:text-gray-400 pl-8">
                        + {features.length - 6} más...
                      </li>
                    )}
                  </ul>
                )}

                {/* Botón de acción */}
                <Button
                  variant={isPopular ? 'primary' : 'outline'}
                  className="w-full"
                  onClick={() => handleSeleccionarPlan(plan)}
                >
                  {diasTrial > 0 ? 'Comenzar prueba gratis' : 'Seleccionar plan'}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Mensaje si no hay planes */}
        {planes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No hay planes disponibles en este momento.
            </p>
          </div>
        )}
      </div>

      {/* FAQ o información adicional */}
      <div className="bg-gray-100 dark:bg-gray-900 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            ¿Tienes preguntas?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Nuestro equipo está aquí para ayudarte. Contáctanos y te responderemos lo antes posible.
          </p>
          <Button variant="outline">
            Contactar soporte
          </Button>
        </div>
      </div>

      {/* Modal de checkout */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={handleCloseCheckout}
        plan={planSeleccionado}
        periodo={periodoSeleccionado}
      />
    </div>
  );
}

export default PlanesPublicPage;
