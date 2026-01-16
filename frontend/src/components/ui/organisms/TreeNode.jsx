import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * TreeNode - Componente reutilizable para renderizar nodos de árbol jerárquico
 *
 * @param {Object} props
 * @param {Object} props.node - El nodo actual del árbol
 * @param {number} [props.level=0] - Nivel de profundidad (para indentación)
 * @param {string} [props.childrenKey='children'] - Key para acceder a los hijos del nodo
 * @param {Object} props.expandedState - Estado de expansión { [nodeId]: boolean }
 * @param {Function} props.onToggleExpand - Callback cuando se expande/contrae (nodeId) => void
 * @param {Function} props.renderContent - Render prop para el contenido del nodo (node, { isExpanded, hasChildren }) => JSX
 * @param {Function} [props.renderActions] - Render prop para las acciones del nodo (node) => JSX
 * @param {Function} [props.getNodeId] - Función para obtener el ID del nodo (default: node => node.id)
 * @param {number} [props.indentSize=2] - Tamaño de indentación en rem por nivel
 * @param {string} [props.className] - Clases adicionales para el contenedor del nodo
 * @param {string} [props.nodeClassName] - Clases adicionales para cada nodo (puede ser función)
 * @param {boolean} [props.showToggleOnEmpty=false] - Mostrar espacio para toggle aunque no tenga hijos
 */
export function TreeNode({
  node,
  level = 0,
  childrenKey = 'children',
  expandedState,
  onToggleExpand,
  renderContent,
  renderActions,
  getNodeId = (n) => n.id,
  indentSize = 2,
  className,
  nodeClassName,
  showToggleOnEmpty = true,
}) {
  const nodeId = getNodeId(node);
  const children = node[childrenKey];
  const hasChildren = children && children.length > 0;
  const isExpanded = expandedState[nodeId];

  // Calcular clases del nodo
  const computedNodeClassName =
    typeof nodeClassName === 'function' ? nodeClassName(node) : nodeClassName;

  return (
    <div className={className}>
      {/* Nodo Actual */}
      <div
        className={cn(
          'flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 mb-2 bg-white dark:bg-gray-800',
          computedNodeClassName
        )}
        style={{ marginLeft: level > 0 ? `${level * indentSize}rem` : undefined }}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Toggle Expansión */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleExpand(nodeId)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex-shrink-0"
              aria-label={isExpanded ? 'Contraer' : 'Expandir'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          ) : showToggleOnEmpty ? (
            <div className="w-6 flex-shrink-0" /> /* Espaciador */
          ) : null}

          {/* Contenido personalizado */}
          {renderContent(node, { isExpanded, hasChildren, level })}
        </div>

        {/* Acciones personalizadas */}
        {renderActions && (
          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
            {renderActions(node, { isExpanded, hasChildren, level })}
          </div>
        )}
      </div>

      {/* Hijos (recursivo) */}
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={getNodeId(child)}
              node={child}
              level={level + 1}
              childrenKey={childrenKey}
              expandedState={expandedState}
              onToggleExpand={onToggleExpand}
              renderContent={renderContent}
              renderActions={renderActions}
              getNodeId={getNodeId}
              indentSize={indentSize}
              className={className}
              nodeClassName={nodeClassName}
              showToggleOnEmpty={showToggleOnEmpty}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * TreeView - Wrapper para renderizar un árbol completo con controles de expansión
 *
 * @param {Object} props
 * @param {Array} props.data - Array de nodos raíz del árbol
 * @param {string} [props.childrenKey='children'] - Key para acceder a los hijos
 * @param {Object} props.expandedState - Estado de expansión { [nodeId]: boolean }
 * @param {Function} props.onToggleExpand - Callback para toggle de expansión
 * @param {Function} props.renderContent - Render prop para contenido de nodo
 * @param {Function} [props.renderActions] - Render prop para acciones de nodo
 * @param {Function} [props.getNodeId] - Función para obtener ID del nodo
 * @param {number} [props.indentSize=2] - Tamaño de indentación en rem
 * @param {string} [props.className] - Clases para el contenedor del árbol
 * @param {string} [props.nodeClassName] - Clases para cada nodo
 * @param {React.ReactNode} [props.emptyState] - Contenido a mostrar si no hay datos
 * @param {boolean} [props.isLoading] - Mostrar estado de carga
 * @param {React.ReactNode} [props.loadingState] - Contenido de carga personalizado
 */
export function TreeView({
  data,
  childrenKey = 'children',
  expandedState,
  onToggleExpand,
  renderContent,
  renderActions,
  getNodeId = (n) => n.id,
  indentSize = 2,
  className,
  nodeClassName,
  emptyState,
  isLoading = false,
  loadingState,
}) {
  if (isLoading) {
    return (
      loadingState || (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando...</span>
        </div>
      )
    );
  }

  if (!data || data.length === 0) {
    return emptyState || null;
  }

  return (
    <div className={cn('space-y-1', className)}>
      {data.map((node) => (
        <TreeNode
          key={getNodeId(node)}
          node={node}
          level={0}
          childrenKey={childrenKey}
          expandedState={expandedState}
          onToggleExpand={onToggleExpand}
          renderContent={renderContent}
          renderActions={renderActions}
          getNodeId={getNodeId}
          indentSize={indentSize}
          nodeClassName={nodeClassName}
        />
      ))}
    </div>
  );
}

/**
 * Hook para manejar el estado de expansión del árbol
 * @param {Object} [initialState={}] - Estado inicial de expansión
 * @returns {Object} { expanded, toggle, expandAll, collapseAll, setExpanded }
 */
export function useTreeExpansion(initialState = {}) {
  const [expanded, setExpanded] = useState(initialState);

  const toggle = (nodeId) => {
    setExpanded((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const expandAll = (nodes, childrenKey = 'children', getNodeId = (n) => n.id) => {
    const newExpanded = {};
    const processNodes = (items) => {
      items.forEach((node) => {
        const children = node[childrenKey];
        if (children && children.length > 0) {
          newExpanded[getNodeId(node)] = true;
          processNodes(children);
        }
      });
    };
    processNodes(nodes);
    setExpanded(newExpanded);
  };

  const collapseAll = () => {
    setExpanded({});
  };

  return { expanded, toggle, expandAll, collapseAll, setExpanded };
}

export default TreeView;
