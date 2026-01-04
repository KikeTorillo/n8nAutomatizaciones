/**
 * ====================================================================
 * ACTION NODE DRAWER - Configuración de nodo de acción
 * ====================================================================
 *
 * Permite configurar acciones automáticas:
 * - cambiar_estado: Cambiar el estado de la entidad
 * - notificar: Enviar notificación a usuarios
 * - webhook: Llamar a un endpoint externo
 *
 * Enero 2026
 */

import { useState, useEffect } from 'react';
import {
  Zap,
  Save,
  X,
  RefreshCw,
  Bell,
  Globe,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

// Tipos de acción disponibles
const TIPOS_ACCION = [
  {
    value: 'cambiar_estado',
    label: 'Cambiar estado',
    icon: RefreshCw,
    description: 'Actualizar el estado de la entidad',
  },
  {
    value: 'notificar',
    label: 'Enviar notificación',
    icon: Bell,
    description: 'Notificar a usuarios o roles',
  },
  {
    value: 'webhook',
    label: 'Llamar webhook',
    icon: Globe,
    description: 'Enviar datos a un endpoint externo',
  },
];

// Estados posibles por tipo de entidad
const ESTADOS_ENTIDAD = {
  orden_compra: [
    { value: 'borrador', label: 'Borrador' },
    { value: 'pendiente_aprobacion', label: 'Pendiente de aprobación' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'rechazada', label: 'Rechazada' },
    { value: 'enviada', label: 'Enviada a proveedor' },
    { value: 'recibida', label: 'Recibida' },
    { value: 'cancelada', label: 'Cancelada' },
  ],
  venta_pos: [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'completada', label: 'Completada' },
    { value: 'devuelta', label: 'Devuelta' },
    { value: 'cancelada', label: 'Cancelada' },
  ],
  cita: [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'confirmada', label: 'Confirmada' },
    { value: 'en_proceso', label: 'En proceso' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' },
    { value: 'no_show', label: 'No asistió' },
  ],
  gasto: [
    { value: 'borrador', label: 'Borrador' },
    { value: 'pendiente', label: 'Pendiente de aprobación' },
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'rechazado', label: 'Rechazado' },
    { value: 'pagado', label: 'Pagado' },
  ],
  requisicion: [
    { value: 'borrador', label: 'Borrador' },
    { value: 'enviada', label: 'Enviada' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'rechazada', label: 'Rechazada' },
    { value: 'completada', label: 'Completada' },
  ],
};

// Destinos de notificación
const DESTINOS_NOTIFICACION = [
  { value: 'creador', label: 'Creador de la solicitud' },
  { value: 'ultimo_aprobador', label: 'Último aprobador' },
  { value: 'rol_admin', label: 'Administradores' },
  { value: 'rol_propietario', label: 'Propietarios' },
  { value: 'todos_aprobadores', label: 'Todos los aprobadores del flujo' },
];

/**
 * Configurador de acción Cambiar Estado
 */
function ConfigCambiarEstado({ config, onChange, entidadTipo }) {
  const estados = ESTADOS_ENTIDAD[entidadTipo] || ESTADOS_ENTIDAD.orden_compra;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nuevo estado
        </label>
        <Select
          value={config.nuevo_estado || ''}
          onChange={(e) => onChange({ ...config, nuevo_estado: e.target.value })}
          options={[
            { value: '', label: 'Selecciona un estado...' },
            ...estados,
          ]}
        />
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="registrar_historial"
          checked={config.registrar_historial !== false}
          onChange={(e) =>
            onChange({ ...config, registrar_historial: e.target.checked })
          }
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label
          htmlFor="registrar_historial"
          className="text-sm text-gray-700 dark:text-gray-300"
        >
          Registrar en historial de cambios
        </label>
      </div>
    </div>
  );
}

/**
 * Configurador de acción Notificar
 */
function ConfigNotificar({ config, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Destinatarios
        </label>
        <Select
          value={config.destino || ''}
          onChange={(e) => onChange({ ...config, destino: e.target.value })}
          options={[
            { value: '', label: 'Selecciona destinatario...' },
            ...DESTINOS_NOTIFICACION,
          ]}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Título de la notificación
        </label>
        <Input
          value={config.titulo || ''}
          onChange={(e) => onChange({ ...config, titulo: e.target.value })}
          placeholder="Ej: Solicitud aprobada"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Mensaje
        </label>
        <textarea
          value={config.mensaje || ''}
          onChange={(e) => onChange({ ...config, mensaje: e.target.value })}
          placeholder="Escribe el mensaje de la notificación..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Puedes usar variables: {'{entidad}'}, {'{estado}'}, {'{usuario}'}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Canales de notificación
        </p>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.canal_app !== false}
              onChange={(e) =>
                onChange({ ...config, canal_app: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">App</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.canal_email || false}
              onChange={(e) =>
                onChange({ ...config, canal_email: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.canal_push || false}
              onChange={(e) =>
                onChange({ ...config, canal_push: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Push</span>
          </label>
        </div>
      </div>
    </div>
  );
}

/**
 * Configurador de acción Webhook
 */
function ConfigWebhook({ config, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          URL del webhook
        </label>
        <Input
          type="url"
          value={config.url || ''}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          placeholder="https://api.ejemplo.com/webhook"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Método HTTP
        </label>
        <Select
          value={config.metodo || 'POST'}
          onChange={(e) => onChange({ ...config, metodo: e.target.value })}
          options={[
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'PATCH', label: 'PATCH' },
          ]}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Headers (JSON)
        </label>
        <textarea
          value={config.headers || '{}'}
          onChange={(e) => onChange({ ...config, headers: e.target.value })}
          placeholder='{"Authorization": "Bearer token"}'
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="incluir_datos"
          checked={config.incluir_datos !== false}
          onChange={(e) =>
            onChange({ ...config, incluir_datos: e.target.checked })
          }
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label
          htmlFor="incluir_datos"
          className="text-sm text-gray-700 dark:text-gray-300"
        >
          Incluir datos de la entidad en el body
        </label>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="esperar_respuesta"
          checked={config.esperar_respuesta || false}
          onChange={(e) =>
            onChange({ ...config, esperar_respuesta: e.target.checked })
          }
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label
          htmlFor="esperar_respuesta"
          className="text-sm text-gray-700 dark:text-gray-300"
        >
          Esperar respuesta antes de continuar
        </label>
      </div>
    </div>
  );
}

/**
 * Drawer de configuración de nodo de acción
 * @param {boolean} isOpen - Si el drawer está abierto
 * @param {function} onClose - Callback para cerrar
 * @param {Object} node - Nodo de React Flow seleccionado
 * @param {function} onSave - Callback con la configuración guardada
 * @param {string} entidadTipo - Tipo de entidad del workflow
 */
function ActionNodeDrawer({ isOpen, onClose, node, onSave, entidadTipo = 'orden_compra' }) {
  // Estado del formulario
  const [formData, setFormData] = useState({
    label: '',
    tipo_accion: '',
    config_accion: {},
    descripcion: '',
  });

  // Cargar datos del nodo al abrir
  useEffect(() => {
    if (node && isOpen) {
      const config = node.data?.config || {};
      setFormData({
        label: node.data?.label || 'Acción',
        tipo_accion: config.tipo_accion || '',
        config_accion: config.config_accion || {},
        descripcion: config.descripcion || '',
      });
    }
  }, [node, isOpen]);

  // Manejar cambios genéricos
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Manejar cambio de tipo de acción
  const handleTipoAccionChange = (tipo) => {
    setFormData((prev) => ({
      ...prev,
      tipo_accion: tipo,
      config_accion: {}, // Reset config al cambiar tipo
    }));
  };

  // Guardar configuración
  const handleSave = () => {
    const config = {
      tipo_accion: formData.tipo_accion,
      config_accion: formData.config_accion,
      descripcion: formData.descripcion,
    };

    onSave({
      label: formData.label,
      config,
    });
    onClose();
  };

  // Validar si puede guardar
  const validarConfigAccion = () => {
    const { tipo_accion, config_accion } = formData;
    if (!tipo_accion) return false;

    switch (tipo_accion) {
      case 'cambiar_estado':
        return !!config_accion.nuevo_estado;
      case 'notificar':
        return config_accion.destino && config_accion.titulo;
      case 'webhook':
        return !!config_accion.url;
      default:
        return false;
    }
  };

  const canSave = formData.label && formData.tipo_accion && validarConfigAccion();

  // Renderizar configuración según tipo
  const renderConfigAccion = () => {
    switch (formData.tipo_accion) {
      case 'cambiar_estado':
        return (
          <ConfigCambiarEstado
            config={formData.config_accion}
            onChange={(config) => handleChange('config_accion', config)}
            entidadTipo={entidadTipo}
          />
        );
      case 'notificar':
        return (
          <ConfigNotificar
            config={formData.config_accion}
            onChange={(config) => handleChange('config_accion', config)}
          />
        );
      case 'webhook':
        return (
          <ConfigWebhook
            config={formData.config_accion}
            onChange={(config) => handleChange('config_accion', config)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar Acción"
      subtitle="Define la acción automática a ejecutar"
    >
      <div className="space-y-6">
        {/* Nombre del paso */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre de la acción
          </label>
          <Input
            value={formData.label}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder="Ej: Notificar aprobación"
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
            placeholder="Describe qué hace esta acción..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
              focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Selector de tipo de acción */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Tipo de acción
          </h3>
          <div className="space-y-2">
            {TIPOS_ACCION.map((tipo) => {
              const Icon = tipo.icon;
              const isSelected = formData.tipo_accion === tipo.value;

              return (
                <label
                  key={tipo.value}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="tipo_accion"
                    value={tipo.value}
                    checked={isSelected}
                    onChange={() => handleTipoAccionChange(tipo.value)}
                    className="sr-only"
                  />
                  <Icon
                    className={`w-5 h-5 mt-0.5 ${
                      isSelected
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {tipo.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {tipo.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Configuración específica del tipo */}
        {formData.tipo_accion && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Configuración
            </h4>
            {renderConfigAccion()}
          </div>
        )}

        {/* Warning si falta configuración */}
        {formData.tipo_accion && !validarConfigAccion() && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Completa la configuración de la acción
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

export default ActionNodeDrawer;
