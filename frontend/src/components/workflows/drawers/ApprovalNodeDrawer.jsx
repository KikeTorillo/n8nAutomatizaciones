/**
 * ====================================================================
 * APPROVAL NODE DRAWER - Configuración de nodo de aprobación
 * ====================================================================
 *
 * Permite configurar:
 * - Aprobador (rol, usuario o permiso)
 * - Timeout en horas
 * - Acción al timeout (escalar, rechazar, aprobar_auto)
 *
 * Enero 2026
 */

import { useState, useEffect } from 'react';
import {
  UserCheck,
  Clock,
  AlertTriangle,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  Ban,
  CheckCircle,
  Users,
} from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ApproverSelector from '../editors/ApproverSelector';

// Acciones disponibles al timeout
const ACCIONES_TIMEOUT = [
  {
    value: 'escalar',
    label: 'Escalar',
    icon: ChevronUp,
    description: 'Enviar al siguiente nivel de aprobación',
    color: 'amber',
  },
  {
    value: 'rechazar',
    label: 'Rechazar automáticamente',
    icon: Ban,
    description: 'Rechazar la solicitud si no hay respuesta',
    color: 'red',
  },
  {
    value: 'aprobar_auto',
    label: 'Aprobar automáticamente',
    icon: CheckCircle,
    description: 'Aprobar la solicitud si no hay respuesta',
    color: 'green',
  },
];

/**
 * Drawer de configuración de nodo de aprobación
 * @param {boolean} isOpen - Si el drawer está abierto
 * @param {function} onClose - Callback para cerrar
 * @param {Object} node - Nodo de React Flow seleccionado
 * @param {function} onSave - Callback con la configuración guardada
 */
function ApprovalNodeDrawer({ isOpen, onClose, node, onSave }) {
  // Estado del formulario
  const [formData, setFormData] = useState({
    label: '',
    aprobador: { tipo: 'rol', valor: null },
    timeout_horas: 24,
    accion_timeout: 'escalar',
    descripcion: '',
    notificar: true,
  });

  // Cargar datos del nodo al abrir
  useEffect(() => {
    if (node && isOpen) {
      const config = node.data?.config || {};
      setFormData({
        label: node.data?.label || 'Aprobación',
        aprobador: config.aprobador || { tipo: 'rol', valor: null },
        timeout_horas: config.timeout_horas ?? 24,
        accion_timeout: config.accion_timeout || 'escalar',
        descripcion: config.descripcion || '',
        notificar: config.notificar !== false,
      });
    }
  }, [node, isOpen]);

  // Manejar cambios genéricos
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Guardar configuración
  const handleSave = () => {
    const config = {
      aprobador: formData.aprobador,
      timeout_horas: formData.timeout_horas,
      accion_timeout: formData.accion_timeout,
      descripcion: formData.descripcion,
      notificar: formData.notificar,
    };

    onSave({
      label: formData.label,
      config,
    });
    onClose();
  };

  // Validar si puede guardar
  const canSave = formData.label && formData.aprobador?.valor;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar Aprobación"
      subtitle="Define quién aprueba y las reglas de timeout"
    >
      <div className="space-y-6">
        {/* Nombre del paso */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre del paso
          </label>
          <Input
            value={formData.label}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder="Ej: Aprobación Gerente"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción (opcional)
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Describe qué se está aprobando en este paso..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
              focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Sección: Aprobador */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary-500" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Aprobador
            </h3>
          </div>
          <ApproverSelector
            value={formData.aprobador}
            onChange={(value) => handleChange('aprobador', value)}
          />
        </div>

        {/* Sección: Timeout */}
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Tiempo límite de respuesta
            </h3>
          </div>

          {/* Horas de timeout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tiempo de espera (horas)
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={720}
                value={formData.timeout_horas}
                onChange={(e) =>
                  handleChange('timeout_horas', parseInt(e.target.value) || 24)
                }
                className="w-24"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                horas ({Math.round((formData.timeout_horas / 24) * 10) / 10} días)
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Tiempo máximo para que el aprobador responda
            </p>
          </div>

          {/* Acción al timeout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Si no hay respuesta:
            </label>
            <div className="space-y-2">
              {ACCIONES_TIMEOUT.map((accion) => {
                const Icon = accion.icon;
                const isSelected = formData.accion_timeout === accion.value;
                const colorClasses = {
                  amber: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
                  red: 'border-red-500 bg-red-50 dark:bg-red-900/20',
                  green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
                };
                const iconColorClasses = {
                  amber: 'text-amber-600 dark:text-amber-400',
                  red: 'text-red-600 dark:text-red-400',
                  green: 'text-green-600 dark:text-green-400',
                };

                return (
                  <label
                    key={accion.value}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${isSelected
                        ? colorClasses[accion.color]
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="accion_timeout"
                      value={accion.value}
                      checked={isSelected}
                      onChange={(e) =>
                        handleChange('accion_timeout', e.target.value)
                      }
                      className="sr-only"
                    />
                    <Icon
                      className={`w-5 h-5 mt-0.5 ${
                        isSelected
                          ? iconColorClasses[accion.color]
                          : 'text-gray-400'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {accion.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {accion.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Notificar al aprobador
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enviar notificación cuando llegue una solicitud
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange('notificar', !formData.notificar)}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${formData.notificar ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                ${formData.notificar ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        </div>

        {/* Warning si no hay aprobador */}
        {!formData.aprobador?.valor && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Debes seleccionar un aprobador para este paso
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

export default ApprovalNodeDrawer;
