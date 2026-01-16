import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * Página de resultado de suscripción de Mercado Pago
 *
 * Parámetros que envía MP:
 * - collection_id: ID del pago
 * - collection_status: approved, pending, rejected
 * - external_reference: org_{id}_{timestamp}
 * - payment_type: credit_card, debit_card, etc.
 * - preference_id: ID de la preferencia/plan
 * - status: approved, pending, rejected
 */
function SubscripcionResultado() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState('loading'); // loading, success, pending, error

  useEffect(() => {
    // Obtener parámetros de la URL
    const collectionStatus = searchParams.get('collection_status') || searchParams.get('status');
    const collectionId = searchParams.get('collection_id');
    const externalReference = searchParams.get('external_reference');

    console.log('Resultado de suscripción MP:', {
      collectionStatus,
      collectionId,
      externalReference,
    });

    // Determinar el estado según la respuesta de MP
    if (collectionStatus === 'approved') {
      setEstado('success');
      // Redirigir al dashboard después de 3 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } else if (collectionStatus === 'pending' || collectionStatus === 'in_process') {
      setEstado('pending');
    } else {
      setEstado('error');
    }
  }, [searchParams, navigate]);

  if (estado === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Procesando resultado del pago...</p>
        </div>
      </div>
    );
  }

  if (estado === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Suscripción Activada!
          </h1>

          <p className="text-gray-600 mb-6">
            Tu pago ha sido procesado exitosamente. Tu suscripción está ahora activa.
          </p>

          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Serás redirigido al dashboard en unos segundos...
            </p>

            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Ir al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (estado === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-10 h-10 text-yellow-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pago Pendiente
          </h1>

          <p className="text-gray-600 mb-6">
            Tu pago está siendo procesado. Te notificaremos cuando se confirme.
          </p>

          <div className="space-y-3">
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Ir al Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Error en el Pago
        </h1>

        <p className="text-gray-600 mb-6">
          Hubo un problema al procesar tu pago. Por favor intenta nuevamente.
        </p>

        <div className="space-y-3">
          <Button onClick={() => navigate('/registro')} className="w-full">
            Intentar de Nuevo
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            Volver al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SubscripcionResultado;
