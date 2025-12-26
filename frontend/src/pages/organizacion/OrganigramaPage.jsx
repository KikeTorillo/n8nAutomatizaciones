import { useState, useMemo, useEffect } from 'react';
import {
  Users,
  User,
  ChevronRight,
  ChevronDown,
  Building,
  Briefcase,
  Search,
  Loader2,
  UserCircle,
  Network,
  BarChart3,
  Filter,
  X,
} from 'lucide-react';

import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import { useOrganigrama } from '@/hooks/useOrganigrama';

// Colores por tipo de empleado
const TIPO_COLORS = {
  gerencial: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  administrativo: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  operativo: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
  ventas: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
};

const TIPO_LABELS = {
  gerencial: 'Gerencial',
  administrativo: 'Administrativo',
  operativo: 'Operativo',
  ventas: 'Ventas',
};

const ESTADO_COLORS = {
  activo: 'bg-green-500',
  vacaciones: 'bg-yellow-500',
  incapacidad: 'bg-orange-500',
  suspendido: 'bg-red-500',
  baja: 'bg-gray-500',
};

/**
 * Página de Organigrama - Visualización jerárquica de profesionales
 */
function OrganigramaPage() {
  const { arbol, stats, isLoading, departamentos } = useOrganigrama();
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [expandAll, setExpandAll] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDepartamento, setFiltroDepartamento] = useState('');

  // Inicialmente expandir todo
  useEffect(() => {
    if (arbol.length > 0 && expandedNodes.size === 0) {
      const allIds = new Set();
      const collectIds = (nodes) => {
        nodes.forEach(n => {
          allIds.add(n.id);
          if (n.children.length > 0) collectIds(n.children);
        });
      };
      collectIds(arbol);
      setExpandedNodes(allIds);
    }
  }, [arbol]);

  // Toggle expandir nodo
  const toggleNode = (id) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expandir/Colapsar todo
  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedNodes(new Set());
    } else {
      const allIds = new Set();
      const collectIds = (nodes) => {
        nodes.forEach(n => {
          allIds.add(n.id);
          if (n.children.length > 0) collectIds(n.children);
        });
      };
      collectIds(arbol);
      setExpandedNodes(allIds);
    }
    setExpandAll(!expandAll);
  };

  // Filtrar árbol
  const arbolFiltrado = useMemo(() => {
    if (!searchTerm && !filtroTipo && !filtroDepartamento) return arbol;

    const matchesFilter = (node) => {
      const matchSearch = !searchTerm ||
        node.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.puesto?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTipo = !filtroTipo || node.tipo === filtroTipo;
      const matchDept = !filtroDepartamento || node.departamento_id?.toString() === filtroDepartamento;
      return matchSearch && matchTipo && matchDept;
    };

    const filterNodes = (nodes) => {
      return nodes.reduce((acc, node) => {
        const filteredChildren = filterNodes(node.children);
        if (matchesFilter(node) || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren,
          });
        }
        return acc;
      }, []);
    };

    return filterNodes(arbol);
  }, [arbol, searchTerm, filtroTipo, filtroDepartamento]);

  // Limpiar filtros
  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroTipo('');
    setFiltroDepartamento('');
  };

  const hayFiltrosActivos = searchTerm || filtroTipo || filtroDepartamento;

  // Componente de nodo del organigrama
  const OrgNode = ({ node, level = 0, isLast = false }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const tipoColor = TIPO_COLORS[node.tipo] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    const estadoColor = ESTADO_COLORS[node.estado] || ESTADO_COLORS.activo;

    return (
      <div className={level > 0 ? 'ml-6 md:ml-10' : ''}>
        {/* Línea de conexión */}
        {level > 0 && (
          <div className="absolute left-0 top-0 h-full border-l-2 border-gray-200 dark:border-gray-700"
               style={{ marginLeft: `${(level - 1) * 40 + 20}px` }} />
        )}

        {/* Card del profesional */}
        <div
          className={`
            relative flex items-start gap-3 p-3 md:p-4 mb-2
            bg-white dark:bg-gray-800 rounded-xl
            border border-gray-200 dark:border-gray-700
            hover:shadow-md transition-shadow
            ${node.estado !== 'activo' ? 'opacity-60' : ''}
          `}
        >
          {/* Botón expandir/colapsar */}
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="absolute -left-3 top-1/2 -translate-y-1/2 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {node.foto_url ? (
              <img
                src={node.foto_url}
                alt={node.nombre_completo}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
              />
            ) : (
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center border-2 border-primary-200 dark:border-primary-800">
                <UserCircle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            )}
            {/* Indicador de estado */}
            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${estadoColor}`}
                 title={node.estado} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {node.nombre_completo}
              </h3>
              {node.tipo && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${tipoColor}`}>
                  {TIPO_LABELS[node.tipo] || node.tipo}
                </span>
              )}
            </div>

            {/* Puesto */}
            {node.puesto?.nombre && (
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                <Briefcase className="w-3.5 h-3.5" />
                <span className="truncate">{node.puesto.nombre}</span>
              </div>
            )}

            {/* Departamento */}
            {node.departamento?.nombre && (
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
                <Building className="w-3.5 h-3.5" />
                <span className="truncate">{node.departamento.nombre}</span>
              </div>
            )}

            {/* Badge subordinados */}
            {hasChildren && (
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <Users className="w-3.5 h-3.5" />
                <span>{node.children.length} subordinado{node.children.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hijos */}
        {hasChildren && isExpanded && (
          <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700 ml-4 md:ml-6">
            {node.children.map((child, idx) => (
              <OrgNode
                key={child.id}
                node={child}
                level={level + 1}
                isLast={idx === node.children.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <BackButton to="/configuracion" label="Configuración" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Network className="w-5 h-5 text-primary-600" />
                  Organigrama
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                  Estructura jerárquica de tu equipo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleExpandAll}
              >
                {expandAll ? 'Colapsar' : 'Expandir'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.total}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <User className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.activos}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Activos</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Network className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.raices}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Top-level</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.profundidadMaxima}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Niveles</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Búsqueda */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o puesto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filtro tipo */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
              >
                <option value="">Todos los tipos</option>
                <option value="gerencial">Gerencial</option>
                <option value="administrativo">Administrativo</option>
                <option value="operativo">Operativo</option>
                <option value="ventas">Ventas</option>
              </select>
            </div>

            {/* Filtro departamento */}
            <select
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
            >
              <option value="">Todos los departamentos</option>
              {departamentos.map(d => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>

            {/* Limpiar filtros */}
            {hayFiltrosActivos && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarFiltros}
                className="text-gray-500"
              >
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Organigrama */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
          ) : arbolFiltrado.length === 0 ? (
            <div className="text-center py-20">
              <Network className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {hayFiltrosActivos ? 'Sin resultados' : 'Organigrama vacío'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {hayFiltrosActivos
                  ? 'No hay profesionales que coincidan con los filtros'
                  : 'Asigna supervisores a los profesionales para construir el organigrama'}
              </p>
              {hayFiltrosActivos && (
                <Button variant="outline" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {arbolFiltrado.map((node, idx) => (
                <OrgNode
                  key={node.id}
                  node={node}
                  level={0}
                  isLast={idx === arbolFiltrado.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Leyenda */}
        {!isLoading && arbolFiltrado.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Leyenda</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Tipos:</span>
                {Object.entries(TIPO_LABELS).map(([key, label]) => (
                  <span key={key} className={`text-xs px-2 py-0.5 rounded-full border ${TIPO_COLORS[key]}`}>
                    {label}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Estados:</span>
                {Object.entries(ESTADO_COLORS).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OrganigramaPage;
