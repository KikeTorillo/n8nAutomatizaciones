/**
 * PreciosPreview — 2-3 planes destacados con CTA a precios completos
 */
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { memo } from 'react';
import { usePlanesPublicos } from '@/hooks/suscripciones-negocio';
import { formatCurrency } from '@/lib/utils';

const PlanCard = memo(function PlanCard({ plan, destacado }) {
  const precio = plan.precios?.find(p => p.tipo_cobro === 'unico') || plan.precios?.[0];
  const features = plan.features?.slice(0, 5) || [];

  return (
    <div className={`rounded-2xl p-6 border ${
      destacado
        ? 'border-pink-300 dark:border-pink-700 bg-pink-50/50 dark:bg-pink-900/10 ring-2 ring-pink-500/20'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      {destacado && (
        <span className="inline-block px-3 py-1 bg-pink-500 text-white text-xs font-bold rounded-full mb-4">
          Popular
        </span>
      )}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.nombre}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">{plan.descripcion}</p>
      {precio && (
        <div className="mb-6">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(precio.precio)}
          </span>
          {precio.tipo_cobro === 'unico' && (
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">pago único</span>
          )}
        </div>
      )}
      <ul className="space-y-3 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Check className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to="/invitaciones/precios"
        className={`block text-center py-2.5 rounded-xl font-medium transition-colors ${
          destacado
            ? 'bg-pink-500 text-white hover:bg-pink-600'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        Ver detalles
      </Link>
    </div>
  );
});

export default function PreciosPreview() {
  const { data: planesData, isLoading } = usePlanesPublicos();
  const planes = (planesData?.data || planesData || [])
    .filter(p => p.activo)
    .slice(0, 3);

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto" />
        </div>
      </section>
    );
  }

  if (!planes.length) return null;

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Planes simples, sin sorpresas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Pago único. Sin suscripciones mensuales. Tu invitación activa para siempre.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {planes.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} destacado={plan.destacado || i === 1} />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            to="/invitaciones/precios"
            className="inline-flex items-center gap-1 text-pink-600 dark:text-pink-400 font-medium hover:gap-2 transition-all"
          >
            Ver todos los planes y detalles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
