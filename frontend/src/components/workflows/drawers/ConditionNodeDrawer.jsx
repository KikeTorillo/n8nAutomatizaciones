/**
 * ====================================================================
 * CONDITION NODE DRAWER - Configuración de nodo de condición
 * ====================================================================
 *
 * Permite configurar condiciones que determinan el flujo del workflow.
 * Genera 2 salidas: Sí (condición cumplida) y No (condición no cumplida).
 *
 * Enero 2026
 */

import { useState, useEffect } from 'react';
import {
  GitBranch,
  Save,
  X,
  HelpCircle,
} from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ConditionEditor from '../editors/ConditionEditor';

/**
 * Drawer de configuración de nodo de condición
 * @param {boolean} isOpen - Si el drawer está abierto
 * @param {function} onClose - Callback para cerrar
 * @param {Object} node - Nodo de React Flow seleccionado
 * @param {function} onSave - Callback con la configuración guardada
 * @param {string} entidadTipo - Tipo de entidad del workflow (orden_compra, venta_pos, etc.)
 */
function ConditionNodeDrawer({ isOpen, onClose, node, onSave, entidadTipo = 'orden_compra' }) {
  // Estado del formulario
  const [formData, setFormData] = useState({
    label: '',
    condicion: {
      condiciones: [],
      operador_logico: 'AND',
    },
    descripcion: '',
  });

  // Cargar datos del nodo al abrir
  useEffect(() => {
    if (node && isOpen) {
      const config = node.data?.config || {};
      setFormData({
        label: node.data?.label || 'Condición',
        condicion: config.condicion || {
          condiciones: [],
          operador_logico: 'AND',
        },
        descripcion: config.descripcion || '',
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
      condicion: formData.condicion,
      descripcion: formData.descripcion,
    };

    onSave({
      label: formData.label,
      config,
    });
    onClose();
  };

  // Validar si puede guardar
  const tieneCondiciones = formData.condicion?.condiciones?.length > 0;
  const condicionesCompletas = formData.condicion?.condiciones?.every(
    (c) => c.campo && c.operador && (c.valor_fijo !== null || c.valor_ref)
  );
  const canSave = formData.label && tieneCondiciones && condicionesCompletas;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar Condición"
      subtitle="Define las reglas que determinan el flujo"
    >
      <div className="space-y-6">
        {/* Nombre del paso */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre de la condición
          </label>
          <Input
            value={formData.label}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder="Ej: Monto mayor a límite"
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
            placeholder="Describe qué evalúa esta condición..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
              focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Info de flujo */}
        <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <GitBranch className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-primary-700 dark:text-primary-300">
            <p className="font-medium mb-1">Nodo de bifurcación</p>
            <p className="text-xs">
              Este nodo evalúa las condiciones y redirige el flujo:
            </p>
            <ul className="text-xs mt-1 space-y-0.5">
              <li>
                <span className="font-mono bg-green-200 dark:bg-green-800 px-1 rounded">Sí</span>
                {' → Si la condición se cumple'}
              </li>
              <li>
                <span className="font-mono bg-red-200 dark:bg-red-800 px-1 rounded">No</span>
                {' → Si la condición NO se cumple'}
              </li>
            </ul>
          </div>
        </div>

        {/* Editor de condiciones */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Condiciones a evaluar
            </h3>
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Ayuda"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <ConditionEditor
            value={formData.condicion}
            onChange={(value) => handleChange('condicion', value)}
            entidadTipo={entidadTipo}
          />
        </div>

        {/* Preview de la condición */}
        {tieneCondiciones && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase">
              Resumen de la condición
            </p>
            <code className="text-sm text-gray-700 dark:text-gray-300 break-all">
              {formData.condicion.condiciones.map((c, i) => {
                const parts = [];
                if (c.campo) parts.push(c.campo);
                if (c.operador) parts.push(c.operador);
                if (c.valor_tipo === 'fijo' && c.valor_fijo !== null) {
                  parts.push(typeof c.valor_fijo === 'string' ? `"${c.valor_fijo}"` : c.valor_fijo);
                } else if (c.valor_ref) {
                  parts.push(`[${c.valor_ref}]`);
                }
                const condStr = parts.join(' ') || '(incompleto)';
                const connector = i < formData.condicion.condiciones.length - 1
                  ? ` ${formData.condicion.operador_logico} `
                  : '';
                return condStr + connector;
              }).join('')}
            </code>
          </div>
        )}

        {/* Validación */}
        {tieneCondiciones && !condicionesCompletas && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Completa todas las condiciones (campo, operador y valor)
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

export default ConditionNodeDrawer;
