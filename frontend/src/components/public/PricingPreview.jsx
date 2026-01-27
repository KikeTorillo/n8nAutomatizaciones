/**
 * PricingPreview - Sección de preview de planes para landing page
 *
 * Muestra los planes principales con precios y CTA a la página completa.
 */
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';
import { suscripcionesNegocioApi } from '@/services/api/modules/suscripciones-negocio.api';
import { formatCurrency, cn } from '@/lib/utils';

export function PricingPreview({ maxPlanes = 3 }) {
  const { data: planesData, isLoading } = useQuery({
    queryKey: ['planes-publicos-preview'],
    queryFn: () => suscripcionesNegocioApi.listarPlanesPublicos(),
    staleTime: 5 * 60 * 1000,
  });

  const planes = Array.isArray(planesData?.data?.data)
    ? planesData.data.data
    : planesData?.data?.items || planesData?.data?.planes || [];

  // Limitar y ordenar planes (primero destacados, luego por precio)
  const planesPreview = planes
    .sort((a, b) => {
      if (a.destacado && !b.destacado) return -1;
      if (!a.destacado && b.destacado) return 1;
      return (parseFloat(a.precio_mensual) || 0) - (parseFloat(b.precio_mensual) || 0);
    })
    .slice(0, maxPlanes);

  if (isLoading) {
    return (
      <section id="planes" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <LoadingSpinner size="lg" />
        </div>
      </section>
    );
  }

  if (!planesPreview.length) {
    return null;
  }

  return (
    <section id="planes" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Planes simples y transparentes
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tu negocio. Sin costos ocultos.
          </p>
        </div>

        {/* Grid de planes */}
        <div className={cn(
          'grid gap-8 mb-12',
          planesPreview.length === 1 && 'max-w-md mx-auto',
          planesPreview.length === 2 && 'md:grid-cols-2 max-w-3xl mx-auto',
          planesPreview.length >= 3 && 'md:grid-cols-2 lg:grid-cols-3'
        )}>
          {planesPreview.map((plan) => {
            const precio = parseFloat(plan.precio_mensual) || 0;
            const esGratis = precio === 0;
            const caracteristicas = Array.isArray(plan.caracteristicas)
              ? plan.caracteristicas.slice(0, 4)
              : [];

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 transition-all',
                  plan.destacado
                    ? 'border-primary-500 shadow-xl shadow-primary-500/10'
                    : 'border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-600'
                )}
              >
                {/* Badge destacado */}
                {plan.destacado && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500 text-white text-xs font-semibold rounded-full">
                      <Sparkles className="w-3 h-3" />
                      Popular
                    </span>
                  </div>
                )}

                {/* Header del plan */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {plan.nombre}
                  </h3>
                  {plan.descripcion && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {plan.descripcion}
                    </p>
                  )}
                </div>

                {/* Precio */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {esGratis ? 'Gratis' : formatCurrency(precio)}
                    </span>
                    {!esGratis && (
                      <span className="text-gray-500 dark:text-gray-400">/mes</span>
                    )}
                  </div>
                  {plan.dias_prueba > 0 && (
                    <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                      {plan.dias_prueba} días de prueba gratis
                    </p>
                  )}
                </div>

                {/* Características */}
                {caracteristicas.length > 0 && (
                  <ul className="space-y-3 mb-6">
                    {caracteristicas.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-300 text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                    {Array.isArray(plan.caracteristicas) && plan.caracteristicas.length > 4 && (
                      <li className="text-sm text-gray-500 dark:text-gray-400 pl-7">
                        + {plan.caracteristicas.length - 4} más...
                      </li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA Ver todos */}
        <div className="text-center">
          <Link
            to="/planes"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Ver todos los planes y detalles
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Comparativa completa, preguntas frecuentes y más opciones de pago
          </p>
        </div>
      </div>
    </section>
  );
}

export default PricingPreview;
