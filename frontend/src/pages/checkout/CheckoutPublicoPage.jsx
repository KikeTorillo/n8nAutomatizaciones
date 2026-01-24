/**
 * ====================================================================
 * PÁGINA: CHECKOUT PÚBLICO
 * ====================================================================
 * Página pública para que clientes de organizaciones paguen suscripciones.
 * NO requiere autenticación (sin navbar, sin login).
 *
 * Flujo:
 * 1. Cliente recibe link del admin (ej: /checkout/abc123...)
 * 2. Ve resumen: logo org, plan, precio, sus datos
 * 3. Click "Pagar" → Redirige a MercadoPago
 *
 * @module pages/checkout/CheckoutPublicoPage
 */

import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Check,
  AlertCircle,
  Clock,
  Tag,
  Loader2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Hooks
import {
  useCheckoutPublico,
  useIniciarPagoPublico,
} from '@/hooks/suscripciones-negocio';

// Componentes UI
import { Button } from '@/components/ui/atoms';

/**
 * Página de Checkout Público
 * Diseño: centrado, card blanca, responsive, logo de org, "Powered by Nexo"
 */
function CheckoutPublicoPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  // Estado local
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Query para obtener datos del checkout
  const {
    data: checkout,
    isLoading,
    error: queryError,
  } = useCheckoutPublico(token);

  // Mutation para iniciar pago
  const iniciarPagoMutation = useIniciarPagoPublico();

  // Handler para iniciar pago
  const handlePagar = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await iniciarPagoMutation.mutateAsync(token);

      // Redirigir a MercadoPago
      if (result.init_point) {
        window.location.href = result.init_point;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (err) {
      console.error('Error al iniciar pago:', err);
      setError(err.response?.data?.message || err.message || 'Error al procesar el pago');
      setIsProcessing(false);
    }
  }, [token, iniciarPagoMutation]);

  // ══════════════════════════════════════════════════════════════════
  // ESTADO: CARGANDO
  // ══════════════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <CheckoutLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
          <p className="text-gray-600">Cargando información del pago...</p>
        </div>
      </CheckoutLayout>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // ESTADO: ERROR (token inválido, expirado, etc.)
  // ══════════════════════════════════════════════════════════════════
  if (queryError || !checkout) {
    const errorMessage = queryError?.response?.data?.message
      || queryError?.message
      || 'El link de pago no es válido o ha expirado';

    const isExpired = errorMessage.toLowerCase().includes('expir');
    const isUsed = errorMessage.toLowerCase().includes('usado');

    return (
      <CheckoutLayout>
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            {isExpired ? (
              <Clock className="h-8 w-8 text-red-600" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-600" />
            )}
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isExpired
              ? 'Link expirado'
              : isUsed
                ? 'Link ya utilizado'
                : 'Link no válido'}
          </h2>

          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {isExpired
              ? 'Este link de pago ha expirado. Contacta al administrador para solicitar uno nuevo.'
              : isUsed
                ? 'Este link de pago ya fue utilizado. Si necesitas realizar otro pago, solicita un nuevo link.'
                : errorMessage}
          </p>

          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            Ir al inicio
          </Button>
        </div>
      </CheckoutLayout>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // ESTADO: CHECKOUT VÁLIDO
  // ══════════════════════════════════════════════════════════════════
  const {
    plan,
    cliente,
    organizacion,
    periodo,
    moneda,
    cupon_aplicado,
    expira_en,
  } = checkout;

  const tieneDescuento = cupon_aplicado && cupon_aplicado.descuento > 0;
  const fechaExpira = new Date(expira_en);

  return (
    <CheckoutLayout logoUrl={organizacion.logo_url} orgName={organizacion.nombre}>
      {/* Header con info de org */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Completar Suscripción
        </h1>
        <p className="text-gray-600">
          Suscripción a <span className="font-medium">{organizacion.nombre}</span>
        </p>
      </div>

      {/* Card del Plan */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-sm text-primary-700 font-medium uppercase tracking-wider">
              Plan seleccionado
            </span>
            <h2 className="text-xl font-bold text-gray-900 mt-1">
              {plan.nombre}
            </h2>
          </div>
          <div className="text-right">
            {tieneDescuento && (
              <span className="text-sm text-gray-500 line-through">
                ${plan.precio_original.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            )}
            <div className="text-2xl font-bold text-primary-700">
              ${plan.precio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              <span className="text-sm font-normal text-gray-600">
                /{periodo === 'mensual' ? 'mes' : periodo}
              </span>
            </div>
            <span className="text-xs text-gray-500">{moneda}</span>
          </div>
        </div>

        {/* Features */}
        {plan.features && plan.features.length > 0 && (
          <div className="border-t border-primary-200 pt-4">
            <ul className="space-y-2">
              {plan.features.slice(0, 5).map((feature, idx) => (
                <li key={idx} className="flex items-center text-sm text-gray-700">
                  <Check className="h-4 w-4 text-primary-600 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
              {plan.features.length > 5 && (
                <li className="text-sm text-gray-500 italic pl-6">
                  y {plan.features.length - 5} más...
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Cupón aplicado */}
      {tieneDescuento && (
        <div className="flex items-center bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          <Tag className="h-5 w-5 text-green-600 mr-2" />
          <div className="flex-1">
            <span className="text-sm font-medium text-green-800">
              Cupón aplicado: {cupon_aplicado.codigo}
            </span>
          </div>
          <span className="text-sm font-bold text-green-600">
            -${cupon_aplicado.descuento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Info del cliente */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Datos del suscriptor</h3>
        <p className="font-medium text-gray-900">{cliente.nombre}</p>
        <p className="text-sm text-gray-600">{cliente.email}</p>
      </div>

      {/* Error de pago */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error al procesar</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Botón de pago */}
      <Button
        className="w-full py-6 text-lg"
        onClick={handlePagar}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Pagar ${plan.precio.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {moneda}
            <ArrowRight className="h-5 w-5 ml-2" />
          </>
        )}
      </Button>

      {/* Info de seguridad */}
      <div className="flex items-center justify-center mt-4 text-xs text-gray-500">
        <ShieldCheck className="h-4 w-4 mr-1" />
        Pago seguro procesado por MercadoPago
      </div>

      {/* Expiración del link */}
      <p className="text-center text-xs text-gray-400 mt-4">
        Este link expira el {format(fechaExpira, "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
      </p>
    </CheckoutLayout>
  );
}

/**
 * Layout del checkout público
 * Diseño minimalista con fondo gradiente y branding
 */
function CheckoutLayout({ children, logoUrl, orgName }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo de la organización */}
          {logoUrl && (
            <div className="flex justify-center mb-6">
              <img
                src={logoUrl}
                alt={orgName || 'Logo'}
                className="h-16 w-auto object-contain"
              />
            </div>
          )}

          {/* Card principal */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>

      {/* Footer con branding */}
      <footer className="py-4 text-center">
        <a
          href="/"
          className="inline-flex items-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span className="mr-1">Powered by</span>
          <span className="font-semibold text-primary-600">Nexo</span>
        </a>
      </footer>
    </div>
  );
}

export default CheckoutPublicoPage;
