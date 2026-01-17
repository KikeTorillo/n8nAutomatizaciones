/**
 * ====================================================================
 * WORKFLOW SETTINGS DRAWER - Configuración general del workflow
 * ====================================================================
 *
 * Permite configurar:
 * - Nombre y código del workflow
 * - Descripción
 * - Tipo de entidad
 * - Condición de activación
 * - Prioridad
 *
 * Enero 2026
 */

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  X,
  FileText,
  Layers,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Button, Drawer, Input } from '@/components/ui';
import { ConditionEditor } from '../editors';

// Tipos de entidad soportados
const ENTIDADES = [
  {
    value: 'orden_compra',
    label: 'Orden de Compra',
    description: 'Aprobación de compras a proveedores',
  },
  {
    value: 'venta_pos',
    label: 'Venta POS',
    description: 'Aprobación de ventas en punto de venta',
  },
  {
    value: 'descuento_pos',
    label: 'Descuento POS',
    description: 'Aprobación de descuentos especiales',
  },
  {
    value: 'cita',
    label: 'Cita',
    description: 'Aprobación de citas agendadas',
  },
  {
    value: 'gasto',
    label: 'Gasto',
    description: 'Aprobación de gastos y reembolsos',
  },
  {
    value: 'requisicion',
    label: 'Requisición',
    description: 'Aprobación de requisiciones internas',
  },
];

/**
 * Drawer de configuración general del workflow
 * @param {boolean} isOpen - Si el drawer está abierto
 * @param {function} onClose - Callback para cerrar
 * @param {Object} workflowData - Datos actuales del workflow
 * @param {function} onSave - Callback con los datos guardados
 * @param {boolean} isNew - Si es un workflow nuevo
 */
function WorkflowSettingsDrawer({ isOpen, onClose, workflowData, onSave, isNew = false }) {
  // Estado del formulario
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    entidad_tipo: 'orden_compra',
    condicion_activacion: null,
    prioridad: 0,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Cargar datos al abrir
  useEffect(() => {
    if (workflowData && isOpen) {
      setFormData({
        codigo: workflowData.codigo || '',
        nombre: workflowData.nombre || 'Nuevo Workflow',
        descripcion: workflowData.descripcion || '',
        entidad_tipo: workflowData.entidad_tipo || 'orden_compra',
        condicion_activacion: workflowData.condicion_activacion || null,
        prioridad: workflowData.prioridad ?? 0,
      });

      // Mostrar avanzado si hay condición de activación
      if (workflowData.condicion_activacion) {
        setShowAdvanced(true);
      }
    }
  }, [workflowData, isOpen]);

  // Manejar cambios genéricos
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Generar código automático desde nombre
  const generateCode = () => {
    if (formData.nombre) {
      const code = formData.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      handleChange('codigo', code);
    }
  };

  // Guardar configuración
  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  // Validar si puede guardar
  const canSave = formData.nombre?.trim() && formData.entidad_tipo;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración del Workflow"
      subtitle="Define los datos generales y reglas de activación"
    >
      <div className="space-y-6">
        {/* Información básica */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <FileText className="w-5 h-5 text-primary-500" />
            <h3 className="font-medium">Información Básica</h3>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del workflow *
            </label>
            <Input
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              onBlur={() => !formData.codigo && generateCode()}
              placeholder="Ej: Aprobación de Compras"
            />
          </div>

          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código único
            </label>
            <div className="flex gap-2">
              <Input
                value={formData.codigo}
                onChange={(e) =>
                  handleChange('codigo', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                placeholder="aprobacion_compras"
                className="flex-1"
                disabled={!isNew}
              />
              {isNew && (
                <Button
                  variant="secondary"
                  onClick={generateCode}
                  className="shrink-0"
                  title="Generar desde nombre"
                >
                  Auto
                </Button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isNew
                ? 'Solo letras minúsculas, números y guiones bajos'
                : 'El código no se puede cambiar después de crear el workflow'}
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Describe el propósito de este workflow..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                resize-none"
            />
          </div>
        </div>

        {/* Tipo de entidad */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Layers className="w-5 h-5 text-primary-500" />
            <h3 className="font-medium">Tipo de Entidad *</h3>
          </div>

          <div className="grid gap-2">
            {ENTIDADES.map((entidad) => {
              const isSelected = formData.entidad_tipo === entidad.value;
              return (
                <label
                  key={entidad.value}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }
                    ${!isNew && 'opacity-60 cursor-not-allowed'}
                  `}
                >
                  <input
                    type="radio"
                    name="entidad_tipo"
                    value={entidad.value}
                    checked={isSelected}
                    onChange={(e) => handleChange('entidad_tipo', e.target.value)}
                    disabled={!isNew}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300 dark:border-gray-500'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {entidad.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entidad.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {!isNew && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              El tipo de entidad no se puede cambiar después de crear el workflow
            </p>
          )}
        </div>

        {/* Configuración avanzada */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <Settings className="w-4 h-4" />
            <span>Configuración avanzada</span>
            <span className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              {/* Condición de activación */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Condición de Activación
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  El workflow solo se ejecutará cuando la entidad cumpla esta condición
                </p>
                <ConditionEditor
                  value={formData.condicion_activacion}
                  onChange={(value) => handleChange('condicion_activacion', value)}
                  entidadTipo={formData.entidad_tipo}
                  singleCondition
                />
                {formData.condicion_activacion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleChange('condicion_activacion', null)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Quitar condición
                  </Button>
                )}
              </div>

              {/* Prioridad */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prioridad
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.prioridad}
                    onChange={(e) => handleChange('prioridad', parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    (0-100, mayor = más prioritario)
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Si hay múltiples workflows para la misma entidad, se ejecuta el de mayor prioridad
                </p>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <Info className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-primary-700 dark:text-primary-300">
                  La condición de activación y prioridad permiten tener múltiples workflows para
                  el mismo tipo de entidad con reglas diferentes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} className="flex-1">
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Aplicar
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

export default WorkflowSettingsDrawer;
