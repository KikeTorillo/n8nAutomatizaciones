/**
 * ====================================================================
 * CANCELAR SUSCRIPCION DRAWER
 * ====================================================================
 * Modal especializado para cancelar suscripciones.
 * Solicita el motivo obligatorio de cancelación (min 10 caracteres).
 *
 * Ene 2026 - Gap: Razón de cancelación obligatoria
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, XCircle, CreditCard, Calendar } from 'lucide-react';
import { Button, Drawer, Textarea, Badge } from '@/components/ui';
import { useCancelarMiSuscripcion } from '@/hooks/suscripciones-negocio';
import { useToast } from '@/hooks/utils';
import { formatCurrency, formatDate } from '@/lib/utils';

/**
 * Motivos sugeridos para facilitar al usuario
 */
const MOTIVOS_CANCELACION = [
  'Precio muy alto para mi presupuesto',
  'No estoy usando el servicio',
  'Cambié a otra solución',
  'Solo estaba probando',
  'Problemas técnicos frecuentes',
];

/**
 * Drawer para cancelar suscripción con motivo obligatorio
 */
function CancelarSuscripcionDrawer({ isOpen, onClose, suscripcion = null, onSuccess }) {
  const cancelarMutation = useCancelarMiSuscripcion();
  const toast = useToast();

  const [motivo, setMotivo] = useState('');

  if (!suscripcion) return null;

  const motivoValido = motivo.trim().length >= 10;
  const caracteresRestantes = 10 - motivo.trim().length;

  const handleCancelar = async () => {
    if (!motivoValido) {
      return;
    }

    try {
      await cancelarMutation.mutateAsync({
        motivo_cancelacion: motivo.trim(),
      });

      toast.success('Suscripción cancelada. Tendrás acceso hasta el final del período pagado.');
      setMotivo('');
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error('Error al cancelar: ' + (error.response?.data?.message || error.message || 'Intente de nuevo'));
    }
  };

  const handleClose = () => {
    setMotivo('');
    onClose();
  };

  const handleMotivoSugerido = (motivoSugerido) => {
    setMotivo(motivoSugerido);
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="Cancelar Suscripción">
      <div className="space-y-6">
        {/* Header con ícono de advertencia */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ¿Cancelar tu suscripción?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Perderás acceso a las funciones premium
            </p>
          </div>
        </div>

        {/* Información de la suscripción */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {suscripcion.plan_nombre}
            </h4>
            <Badge variant="primary" size="sm">
              {suscripcion.plan_codigo}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Precio actual</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(suscripcion.precio_actual || suscripcion.precio)} / {suscripcion.periodo}
                </p>
              </div>
            </div>
            {suscripcion.fecha_proximo_cobro && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Próximo cobro</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(suscripcion.fecha_proximo_cobro)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Motivo de cancelación */}
        <div>
          <Textarea
            label="Motivo de cancelación"
            required
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Por favor, cuéntanos por qué cancelas tu suscripción (mínimo 10 caracteres)..."
            rows={4}
            maxLength={500}
            showCharCount
          />
          {motivo.length > 0 && !motivoValido && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Faltan {caracteresRestantes} caracteres para completar el mínimo requerido
            </p>
          )}
        </div>

        {/* Sugerencias de motivos comunes */}
        <div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Motivos comunes:
          </p>
          <div className="flex flex-wrap gap-2">
            {MOTIVOS_CANCELACION.map((motivoComun) => (
              <button
                key={motivoComun}
                type="button"
                onClick={() => handleMotivoSugerido(motivoComun)}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
              >
                {motivoComun}
              </button>
            ))}
          </div>
        </div>

        {/* Warning box con consecuencias */}
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-900 dark:text-red-200">
              <p className="font-semibold mb-1">Importante:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Mantendrás acceso hasta el final del período actual</li>
                <li>Perderás acceso a módulos premium al vencer</li>
                <li>Tus datos se conservarán por 30 días después de la cancelación</li>
                <li>Puedes reactivar tu suscripción en cualquier momento</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={cancelarMutation.isPending}
          >
            Volver
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleCancelar}
            isLoading={cancelarMutation.isPending}
            disabled={cancelarMutation.isPending || !motivoValido}
          >
            {cancelarMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelación'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

CancelarSuscripcionDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  suscripcion: PropTypes.shape({
    id: PropTypes.number,
    plan_nombre: PropTypes.string,
    plan_codigo: PropTypes.string,
    precio: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    precio_actual: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    periodo: PropTypes.string,
    fecha_proximo_cobro: PropTypes.string,
  }),
  onSuccess: PropTypes.func,
};

export default CancelarSuscripcionDrawer;
