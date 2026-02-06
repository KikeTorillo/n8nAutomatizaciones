import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Check, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Badge, LoadingSpinner } from '@/components/ui';
import { PublicHeader, PublicFooter } from '@/components/public';
import { suscripcionesNegocioApi } from '@/services/api/modules/suscripciones-negocio.api';
import { CheckoutModal } from '@/components/checkout';
import { AlertaBloqueado } from '@/components/suscripciones-negocio';
import { formatCurrency, cn } from '@/lib/utils';
import { CICLO_LABELS, CICLOS_FACTURACION, CICLO_PRECIO_FIELD } from '@/hooks/suscripciones-negocio';

/**
 * Preguntas frecuentes sobre planes y suscripciones
 */
const FAQ_ITEMS = [
  {
    pregunta: '¿Puedo cambiar de plan en cualquier momento?',
    respuesta: 'Sí, puedes cambiar a un plan superior (upgrade) en cualquier momento y el cambio será inmediato. Para cambiar a un plan inferior (downgrade), contacta a nuestro equipo de soporte y el cambio se aplicará en tu próximo ciclo de facturación.',
  },
  {
    pregunta: '¿Qué métodos de pago aceptan?',
    respuesta: 'Aceptamos tarjetas de crédito y débito (Visa, MasterCard, American Express), transferencias bancarias y pagos a través de MercadoPago. Los pagos se procesan de forma segura.',
  },
  {
    pregunta: '¿Qué pasa si cancelo mi suscripción?',
    respuesta: 'Si cancelas, mantendrás acceso hasta el final de tu período de facturación actual. Después de eso, tu cuenta pasará a modo de solo lectura. Tus datos se conservarán por 90 días por si decides reactivar.',
  },
  {
    pregunta: '¿Ofrecen descuentos para pagos anuales?',
    respuesta: 'Sí, ofrecemos hasta un 20% de descuento cuando pagas anualmente en lugar de mensualmente. Puedes ver el ahorro exacto seleccionando el período "Anual" arriba.',
  },
  {
    pregunta: '¿Hay límite de usuarios en cada plan?',
    respuesta: 'Cada plan incluye un número base de usuarios. Puedes ver el límite específico en las características de cada plan. Si necesitas más usuarios, puedes contratar usuarios adicionales o cambiar a un plan superior.',
  },
  {
    pregunta: '¿Puedo probar antes de pagar?',
    respuesta: 'Sí, ofrecemos períodos de prueba gratuitos en nuestros planes. Durante la prueba tendrás acceso completo a todas las funciones del plan seleccionado sin compromiso.',
  },
  {
    pregunta: '¿Cómo funciona la facturación?',
    respuesta: 'La facturación es automática según el período que elijas (mensual, trimestral, semestral o anual). Recibirás tu factura por correo electrónico cada vez que se procese un cobro.',
  },
  {
    pregunta: '¿Qué soporte incluye cada plan?',
    respuesta: 'Todos los planes incluyen soporte por correo electrónico. Los planes superiores incluyen soporte prioritario, chat en vivo y, en algunos casos, soporte telefónico dedicado.',
  },
];

/**
 * Componente de ítem de FAQ con acordeón
 */
function FAQItem({ pregunta, respuesta, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors px-2 rounded"
      >
        <span className="font-medium text-gray-900 dark:text-gray-100 pr-4">
          {pregunta}
        </span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 px-2">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {respuesta}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Página pública para ver y seleccionar planes de suscripción
 *
 * Esta página puede ser accedida sin autenticación para ver los planes,
 * pero el checkout requiere estar autenticado.
 */
function PlanesPublicPage() {
  const [searchParams] = useSearchParams();
  const estadoBloqueo = searchParams.get('estado');

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(CICLOS_FACTURACION.MENSUAL);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [faqAbierto, setFaqAbierto] = useState(null);

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

  // Detectar qué períodos tienen precios configurados en al menos un plan
  const periodosDisponibles = useMemo(() => {
    if (!planes.length) return [CICLOS_FACTURACION.MENSUAL];

    const disponibles = [];

    // Verificar cada período
    Object.entries(CICLO_PRECIO_FIELD).forEach(([ciclo, campo]) => {
      // Un período está disponible si al menos un plan tiene precio > 0 configurado
      const tienePrecios = planes.some(plan => {
        const precio = parseFloat(plan[campo]);
        return !isNaN(precio) && precio >= 0 && plan[campo] !== null;
      });

      if (tienePrecios) {
        disponibles.push(ciclo);
      }
    });

    // Si no hay ninguno, al menos mostrar mensual
    return disponibles.length > 0 ? disponibles : [CICLOS_FACTURACION.MENSUAL];
  }, [planes]);

  // Asegurar que el período seleccionado esté disponible
  useEffect(() => {
    if (periodosDisponibles.length > 0 && !periodosDisponibles.includes(periodoSeleccionado)) {
      setPeriodoSeleccionado(periodosDisponibles[0]);
    }
  }, [periodosDisponibles, periodoSeleccionado]);

  // Calcular precio según período
  const calcularPrecio = (plan, periodo) => {
    const campo = CICLO_PRECIO_FIELD[periodo];
    const precioDirecto = parseFloat(plan[campo]);

    // Si tiene precio configurado para ese período, usarlo
    if (!isNaN(precioDirecto) && plan[campo] !== null) {
      return precioDirecto;
    }

    // Si no, calcular basado en el precio mensual
    const precioMensual = parseFloat(plan.precio_mensual) || 0;
    switch (periodo) {
      case CICLOS_FACTURACION.TRIMESTRAL:
        return precioMensual * 3;
      case CICLOS_FACTURACION.ANUAL:
        return precioMensual * 12;
      default:
        return precioMensual;
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
      {/* Header con navegación back */}
      <PublicHeader variant="back" position="sticky" backTo="/" backLabel="Volver" />

      {/* Banner de estado bloqueado (si viene redirigido) */}
      {estadoBloqueo && (
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <AlertaBloqueado estado={estadoBloqueo} />
        </div>
      )}

      {/* Header */}
      <div className={cn('py-16 px-4 text-center', estadoBloqueo && 'pt-8')}>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Elige el plan perfecto para tu negocio
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Comienza gratis y escala cuando lo necesites. Todos los planes incluyen soporte y actualizaciones.
        </p>
      </div>

      {/* Selector de período - solo mostrar si hay más de uno disponible */}
      {periodosDisponibles.length > 1 && (
      <div className="flex justify-center mb-12">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 inline-flex">
          {periodosDisponibles.map((key) => (
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
              {CICLO_LABELS[key]}
              {key === CICLOS_FACTURACION.ANUAL && (
                <span className="ml-1.5 text-xs text-green-600 dark:text-green-400">
                  Ahorra hasta 20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Grid de planes */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className={cn(
          'grid gap-6',
          // Layout dinámico según cantidad de planes
          planes.length === 1 && 'max-w-md mx-auto',
          planes.length === 2 && 'md:grid-cols-2 max-w-3xl mx-auto',
          planes.length === 3 && 'md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto',
          planes.length >= 4 && 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        )}>
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
                    {features.slice(0, 6).map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
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

      {/* FAQ - Preguntas Frecuentes */}
      <div className="bg-gray-100 dark:bg-gray-900 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
            Preguntas Frecuentes
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
            Encuentra respuestas a las preguntas más comunes sobre nuestros planes
          </p>

          {/* Acordeón de FAQ */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {FAQ_ITEMS.map((item) => (
              <FAQItem
                key={item.pregunta}
                pregunta={item.pregunta}
                respuesta={item.respuesta}
                isOpen={faqAbierto === item.pregunta}
                onToggle={() => setFaqAbierto(faqAbierto === item.pregunta ? null : item.pregunta)}
              />
            ))}
          </div>

          {/* CTA de contacto */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ¿No encontraste lo que buscabas? Nuestro equipo está aquí para ayudarte.
            </p>
            <Button variant="outline">
              Contactar soporte
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <PublicFooter />

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
