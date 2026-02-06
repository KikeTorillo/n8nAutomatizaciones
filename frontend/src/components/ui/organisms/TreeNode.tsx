import { useState, memo, forwardRef, type ReactNode } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Contexto de renderizado para nodos del árbol
 */
export interface TreeRenderContext {
  isExpanded: boolean;
  hasChildren: boolean;
  level: number;
}

/**
 * Estado de expansión del árbol
 */
export type TreeExpandedState = Record<string | number, boolean>;

/**
 * Props del componente TreeNode
 */
export interface TreeNodeProps<T extends Record<string, unknown>> {
  /** El nodo actual del árbol */
  node: T;
  /** Nivel de profundidad (para indentación) */
  level?: number;
  /** Key para acceder a los hijos del nodo */
  childrenKey?: string;
  /** Estado de expansión { [nodeId]: boolean } */
  expandedState: TreeExpandedState;
  /** Callback cuando se expande/contrae (nodeId) => void */
  onToggleExpand: (nodeId: string | number) => void;
  /** Render prop para el contenido del nodo */
  renderContent: (node: T, context: TreeRenderContext) => ReactNode;
  /** Render prop para las acciones del nodo */
  renderActions?: (node: T, context: TreeRenderContext) => ReactNode;
  /** Función para obtener el ID del nodo */
  getNodeId?: (node: T) => string | number;
  /** Tamaño de indentación en rem por nivel */
  indentSize?: number;
  /** Clases adicionales para el contenedor del nodo */
  className?: string;
  /** Clases adicionales para cada nodo (puede ser función) */
  nodeClassName?: string | ((node: T) => string);
  /** Mostrar espacio para toggle aunque no tenga hijos */
  showToggleOnEmpty?: boolean;
}

/**
 * TreeNode - Componente reutilizable para renderizar nodos de árbol jerárquico
 */
function TreeNodeComponent<T extends Record<string, unknown>>(
  {
  node,
  level = 0,
  childrenKey = 'children',
  expandedState,
  onToggleExpand,
  renderContent,
  renderActions,
  getNodeId = (n) => n.id as string | number,
  indentSize = 2,
  className,
  nodeClassName,
  showToggleOnEmpty = true,
}: TreeNodeProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const nodeId = getNodeId(node);
  const children = node[childrenKey] as T[] | undefined;
  const hasChildren = children && children.length > 0;
  const isExpanded = expandedState[nodeId];

  // Calcular clases del nodo
  const computedNodeClassName =
    typeof nodeClassName === 'function' ? nodeClassName(node) : nodeClassName;

  return (
    <div ref={ref} className={className}>
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
          {renderContent(node, { isExpanded: !!isExpanded, hasChildren: !!hasChildren, level })}
        </div>

        {/* Acciones personalizadas */}
        {renderActions && (
          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
            {renderActions(node, { isExpanded: !!isExpanded, hasChildren: !!hasChildren, level })}
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

export const TreeNode = memo(forwardRef(TreeNodeComponent)) as <T extends Record<string, unknown>>(
  props: TreeNodeProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement | null;

(TreeNode as any).displayName = 'TreeNode';

/**
 * Props del componente TreeView
 */
export interface TreeViewProps<T extends Record<string, unknown>> {
  /** Array de nodos raíz del árbol */
  data?: T[];
  /** Key para acceder a los hijos */
  childrenKey?: string;
  /** Estado de expansión { [nodeId]: boolean } */
  expandedState: TreeExpandedState;
  /** Callback para toggle de expansión */
  onToggleExpand: (nodeId: string | number) => void;
  /** Render prop para contenido de nodo */
  renderContent: (node: T, context: TreeRenderContext) => ReactNode;
  /** Render prop para acciones de nodo */
  renderActions?: (node: T, context: TreeRenderContext) => ReactNode;
  /** Función para obtener ID del nodo */
  getNodeId?: (node: T) => string | number;
  /** Tamaño de indentación en rem */
  indentSize?: number;
  /** Clases para el contenedor del árbol */
  className?: string;
  /** Clases para cada nodo */
  nodeClassName?: string | ((node: T) => string);
  /** Contenido a mostrar si no hay datos */
  emptyState?: ReactNode;
  /** Mostrar estado de carga */
  isLoading?: boolean;
  /** Contenido de carga personalizado */
  loadingState?: ReactNode;
}

/**
 * TreeView - Wrapper para renderizar un árbol completo con controles de expansión
 */
function TreeViewComponent<T extends Record<string, unknown>>({
  data,
  childrenKey = 'children',
  expandedState,
  onToggleExpand,
  renderContent,
  renderActions,
  getNodeId = (n) => n.id as string | number,
  indentSize = 2,
  className,
  nodeClassName,
  emptyState,
  isLoading = false,
  loadingState,
}: TreeViewProps<T>) {
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

export const TreeView = memo(TreeViewComponent) as typeof TreeViewComponent;

/**
 * Resultado del hook useTreeExpansion
 */
export interface UseTreeExpansionResult {
  expanded: TreeExpandedState;
  toggle: (nodeId: string | number) => void;
  expandAll: <T extends Record<string, unknown>>(
    nodes: T[],
    childrenKey?: string,
    getNodeId?: (n: T) => string | number
  ) => void;
  collapseAll: () => void;
  setExpanded: React.Dispatch<React.SetStateAction<TreeExpandedState>>;
}

/**
 * Hook para manejar el estado de expansión del árbol
 */
export function useTreeExpansion(initialState: TreeExpandedState = {}): UseTreeExpansionResult {
  const [expanded, setExpanded] = useState<TreeExpandedState>(initialState);

  const toggle = (nodeId: string | number) => {
    setExpanded((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const expandAll = <T extends Record<string, unknown>>(
    nodes: T[],
    childrenKey = 'children',
    getNodeId: (n: T) => string | number = (n) => n.id as string | number
  ) => {
    const newExpanded: TreeExpandedState = {};
    const processNodes = (items: T[]) => {
      items.forEach((node) => {
        const children = node[childrenKey] as T[] | undefined;
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
