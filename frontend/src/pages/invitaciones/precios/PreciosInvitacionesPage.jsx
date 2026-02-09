/**
 * PreciosInvitacionesPage — Planes y precios B2C con FAQ
 * Wrapper sobre usePlanesPublicos con layout B2C y solo planes tipo_cobro='unico'
 */
import { useState, useMemo } from 'react';
import { Check, Loader2, ChevronDown } from 'lucide-react';
import { usePlanesPublicos } from '@/hooks/suscripciones-negocio';
import { useAuthStore, selectIsAuthenticated } from '@/store';
import { formatCurrency } from '@/lib/utils';
import InvitacionesPublicLayout from '../InvitacionesPublicLayout';
import { CheckoutModal } from '@/components/checkout';

const FAQ = [
  {
    pregunta: '¿Es un pago único o suscripción?',
    respuesta: 'Es un pago único. No hay cargos mensuales ni renovaciones. Tu invitación se mantiene activa hasta la fecha de tu evento.',
  },
  {
    pregunta: '¿Puedo crear mi invitación antes de pagar?',
    respuesta: 'Sí, puedes crear y personalizar tu invitación gratis. Solo necesitas un plan activo para publicarla y compartirla.',
  },
  {
    pregunta: '¿Qué métodos de pago aceptan?',
    respuesta: 'Aceptamos tarjetas de crédito, débito y transferencia bancaria a través de MercadoPago.',
  },
  {
    pregunta: '¿Cuántos invitados puedo agregar?',
    respuesta: 'Depende del plan que elijas. El plan básico incluye hasta 100 invitados, mientras que los planes premium ofrecen invitados ilimitados.',
  },
  {
    pregunta: '¿Puedo cambiar la plantilla después de empezar?',
    respuesta: 'Sí, puedes cambiar de plantilla en cualquier momento sin perder la información de tu evento.',
  },
  {
    pregunta: '¿Mis invitados necesitan crear cuenta?',
    respuesta: 'No, tus invitados no necesitan registrarse. Pueden ver la invitación, confirmar asistencia y subir fotos sin crear cuenta.',
  },
];

function FAQItem({ item }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-medium text-gray-900 dark:text-white">{item.pregunta}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {abierto && (
        <p className="pb-4 text-sm text-gray-600 dark:text-gray-400">{item.respuesta}</p>
      )}
    </div>
  );
}

export default function PreciosInvitacionesPage() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const { data: planesData, isLoading } = usePlanesPublicos();
  const planes = useMemo(() => (planesData?.data || planesData || []).filter(p => p.activo), [planesData]);

  const handleSeleccionar = (plan) => {
    setPlanSeleccionado(plan);
    setCheckoutOpen(true);
  };

  return (
    <InvitacionesPublicLayout>
      {/* Header */}
      <section className="pt-16 pb-8 bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Planes y precios
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Pago único, sin suscripciones. Elige el plan ideal para tu evento.
          </p>
        </div>
      </section>

      {/* Planes */}
      <section className="py-12 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto" />
            </div>
          ) : (
            <div className={`grid gap-6 max-w-5xl mx-auto ${
              planes.length <= 3 ? `grid-cols-1 md:grid-cols-${planes.length}` : 'grid-cols-1 md:grid-cols-3'
            }`}>
              {planes.map((plan, i) => {
                const precio = plan.precios?.find(p => p.tipo_cobro === 'unico') || plan.precios?.[0];
                const features = plan.features || [];
                const destacado = plan.destacado || i === 1;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl p-8 border flex flex-col ${
                      destacado
                        ? 'border-pink-300 dark:border-pink-700 bg-pink-50/50 dark:bg-pink-900/10 ring-2 ring-pink-500/20 relative'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    {destacado && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-pink-500 text-white text-xs font-bold rounded-full">
                        Recomendado
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.nombre}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-6">{plan.descripcion}</p>
                    {precio && (
                      <div className="mb-6">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(precio.precio)}
                        </span>
                        {precio.tipo_cobro === 'unico' && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">pago único</span>
                        )}
                        {plan.dias_trial > 0 && (
                          <p className="text-sm text-pink-600 dark:text-pink-400 mt-1">
                            {plan.dias_trial} días de prueba gratis
                          </p>
                        )}
                      </div>
                    )}
                    <ul className="space-y-3 mb-8 flex-1">
                      {features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Check className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleSeleccionar(plan)}
                      className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                        destacado
                          ? 'bg-pink-500 text-white hover:bg-pink-600'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {isAuthenticated ? 'Seleccionar plan' : 'Comenzar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Preguntas frecuentes
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
            {FAQ.map((item) => (
              <FAQItem key={item.pregunta} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => { setCheckoutOpen(false); setPlanSeleccionado(null); }}
        plan={planSeleccionado}
      />
    </InvitacionesPublicLayout>
  );
}
