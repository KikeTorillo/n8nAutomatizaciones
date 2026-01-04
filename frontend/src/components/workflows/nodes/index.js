/**
 * Exportacion de nodos personalizados para React Flow
 */

import StartNode from './StartNode';
import ApprovalNode from './ApprovalNode';
import ConditionNode from './ConditionNode';
import ActionNode from './ActionNode';
import EndNode from './EndNode';

// Mapa de tipos de nodo para React Flow
export const nodeTypes = {
  inicio: StartNode,
  aprobacion: ApprovalNode,
  condicion: ConditionNode,
  accion: ActionNode,
  fin: EndNode,
};

// Metadata de nodos para la paleta
export const NODE_METADATA = {
  inicio: {
    type: 'inicio',
    label: 'Inicio',
    description: 'Punto de entrada del workflow',
    icon: 'Play',
    color: 'green',
    maxCount: 1,
  },
  aprobacion: {
    type: 'aprobacion',
    label: 'Aprobacion',
    description: 'Requiere aprobacion de un usuario',
    icon: 'UserCheck',
    color: 'primary',
  },
  condicion: {
    type: 'condicion',
    label: 'Condicion',
    description: 'Bifurca el flujo segun una condicion',
    icon: 'GitBranch',
    color: 'amber',
  },
  accion: {
    type: 'accion',
    label: 'Accion',
    description: 'Ejecuta una accion automatica',
    icon: 'Zap',
    color: 'blue',
  },
  fin: {
    type: 'fin',
    label: 'Fin',
    description: 'Punto de salida del workflow',
    icon: 'Square',
    color: 'red',
  },
};

export {
  StartNode,
  ApprovalNode,
  ConditionNode,
  ActionNode,
  EndNode,
};
