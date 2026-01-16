/**
 * ====================================================================
 * NODE CONFIG DRAWER - Contenedor de drawers de configuración
 * ====================================================================
 *
 * Enruta al drawer apropiado según el tipo de nodo seleccionado.
 *
 * Tipos soportados:
 * - inicio: No configurable (solo tiene label)
 * - fin: No configurable (solo tiene label)
 * - aprobacion: ApprovalNodeDrawer
 * - condicion: ConditionNodeDrawer
 * - accion: ActionNodeDrawer
 *
 * Enero 2026
 */

import { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Save,
  X,
} from 'lucide-react';
import { Button, Drawer, Input } from '@/components/ui';
import ApprovalNodeDrawer from './ApprovalNodeDrawer';
import ConditionNodeDrawer from './ConditionNodeDrawer';
import ActionNodeDrawer from './ActionNodeDrawer';

/**
 * Drawer simple para nodos inicio/fin (solo label)
 */
function SimpleNodeDrawer({ isOpen, onClose, node, onSave, type }) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (node && isOpen) {
      setLabel(node.data?.label || (type === 'inicio' ? 'Inicio' : 'Fin'));
    }
  }, [node, isOpen, type]);

  const handleSave = () => {
    onSave({ label, config: {} });
    onClose();
  };

  const Icon = type === 'inicio' ? Play : Square;
  const title = type === 'inicio' ? 'Configurar Inicio' : 'Configurar Fin';
  const subtitle = type === 'inicio'
    ? 'Punto de entrada del workflow'
    : 'Punto de finalización del workflow';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
    >
      <div className="space-y-6">
        {/* Info */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className={`p-2 rounded-lg ${
            type === 'inicio'
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            <Icon className={`w-5 h-5 ${
              type === 'inicio'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`} />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Nodo de {type === 'inicio' ? 'inicio' : 'fin'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {type === 'inicio'
                ? 'El workflow comienza aquí cuando se activa'
                : 'El workflow termina aquí'}
            </p>
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Etiqueta
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={type === 'inicio' ? 'Inicio' : 'Fin'}
          />
        </div>

        {/* Botones */}
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
            disabled={!label}
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

/**
 * Componente principal que enruta al drawer apropiado
 * @param {boolean} isOpen - Si el drawer está abierto
 * @param {function} onClose - Callback para cerrar
 * @param {Object} node - Nodo de React Flow seleccionado
 * @param {function} onSave - Callback con la configuración guardada
 * @param {string} entidadTipo - Tipo de entidad del workflow
 */
function NodeConfigDrawer({ isOpen, onClose, node, onSave, entidadTipo = 'orden_compra' }) {
  if (!node) {
    return null;
  }

  const nodeType = node.type;

  // Renderizar drawer según tipo de nodo
  switch (nodeType) {
    case 'inicio':
      return (
        <SimpleNodeDrawer
          isOpen={isOpen}
          onClose={onClose}
          node={node}
          onSave={onSave}
          type="inicio"
        />
      );

    case 'fin':
      return (
        <SimpleNodeDrawer
          isOpen={isOpen}
          onClose={onClose}
          node={node}
          onSave={onSave}
          type="fin"
        />
      );

    case 'aprobacion':
      return (
        <ApprovalNodeDrawer
          isOpen={isOpen}
          onClose={onClose}
          node={node}
          onSave={onSave}
        />
      );

    case 'condicion':
      return (
        <ConditionNodeDrawer
          isOpen={isOpen}
          onClose={onClose}
          node={node}
          onSave={onSave}
          entidadTipo={entidadTipo}
        />
      );

    case 'accion':
      return (
        <ActionNodeDrawer
          isOpen={isOpen}
          onClose={onClose}
          node={node}
          onSave={onSave}
          entidadTipo={entidadTipo}
        />
      );

    default:
      // Fallback para tipos no reconocidos
      return (
        <Drawer
          isOpen={isOpen}
          onClose={onClose}
          title="Configuración"
          subtitle="Tipo de nodo no reconocido"
        >
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Este tipo de nodo no tiene configuración disponible.</p>
          </div>
          <Button variant="outline" onClick={onClose} className="w-full mt-4">
            Cerrar
          </Button>
        </Drawer>
      );
  }
}

export default NodeConfigDrawer;
