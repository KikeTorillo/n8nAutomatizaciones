/**
 * ====================================================================
 * CONTACTAR SOPORTE MODAL
 * ====================================================================
 * Modal que se muestra cuando el usuario intenta hacer downgrade.
 * Los downgrades requieren contactar al equipo de soporte.
 * ====================================================================
 */

import { MessageCircle, Mail, X, ArrowDownCircle } from 'lucide-react';
import { Modal, Button } from '@/components/ui';

/**
 * Configuración de contacto de soporte
 */
const SOPORTE_CONFIG = {
  whatsapp: {
    numero: '+525512345678', // Cambiar por número real
    mensaje: 'Hola, me gustaría cambiar mi plan de suscripción.',
  },
  email: 'soporte@nexo.com', // Cambiar por email real
};

/**
 * Modal para contactar soporte (usado en downgrades)
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Callback para cerrar el modal
 * @param {string} planActualNombre - Nombre del plan actual
 * @param {string} planNuevoNombre - Nombre del plan deseado
 */
function ContactarSoporteModal({
  isOpen,
  onClose,
  planActualNombre = 'actual',
  planNuevoNombre = 'nuevo',
}) {
  // Construir URL de WhatsApp
  const whatsappUrl = `https://wa.me/${SOPORTE_CONFIG.whatsapp.numero.replace(/\+/g, '')}?text=${encodeURIComponent(
    `${SOPORTE_CONFIG.whatsapp.mensaje}\n\nPlan actual: ${planActualNombre}\nPlan deseado: ${planNuevoNombre}`
  )}`;

  // Construir URL de email
  const emailUrl = `mailto:${SOPORTE_CONFIG.email}?subject=${encodeURIComponent(
    'Solicitud de cambio de plan'
  )}&body=${encodeURIComponent(
    `Hola,\n\nMe gustaría cambiar mi plan de suscripción.\n\nPlan actual: ${planActualNombre}\nPlan deseado: ${planNuevoNombre}\n\nGracias.`
  )}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cambio de plan"
      size="sm"
    >
      <div className="p-6">
        {/* Icono */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <ArrowDownCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        {/* Mensaje */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Contacta con nuestro equipo
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Para cambiar de <strong>{planActualNombre}</strong> a{' '}
            <strong>{planNuevoNombre}</strong>, nuestro equipo de soporte te
            ayudará con el proceso y resolverá cualquier duda que tengas.
          </p>
        </div>

        {/* Info adicional */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            El cambio a un plan con menos funciones se aplicará al inicio de tu
            próximo ciclo de facturación. No perderás acceso a las funciones
            actuales hasta ese momento.
          </p>
        </div>

        {/* Botones de contacto */}
        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => window.open(whatsappUrl, '_blank')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contactar por WhatsApp
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(emailUrl, '_blank')}
          >
            <Mail className="w-4 h-4 mr-2" />
            Enviar Email
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={onClose}
          >
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ContactarSoporteModal;
