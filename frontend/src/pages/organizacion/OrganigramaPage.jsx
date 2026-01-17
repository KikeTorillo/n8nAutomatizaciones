import { useState, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  User,
  Search,
  Loader2,
  Network,
  BarChart3,
  Filter,
  X,
} from 'lucide-react';

import { Button, StatCardGrid } from '@/components/ui';
import ProfesionalesPageLayout from '@/components/profesionales/ProfesionalesPageLayout';
import { useOrganigrama } from '@/hooks/personas';
import useThemeStore, { selectResolvedTheme } from '@/store/themeStore';

// Ene 2026: Lazy loading de D3OrgChart (~650KB d3)
const D3OrgChart = lazy(() => import('@/components/profesionales/D3OrgChart'));

// Colores por tipo de empleado (para leyenda)
const TIPO_COLORS = {
  gerencial: 'bg-secondary-100 dark:bg-secondary-900/40 text-secondary-700 dark:text-secondary-300 border-secondary-300 dark:border-secondary-700',
  administrativo: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700',
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
 * Página de Organigrama - Visualización jerárquica de profesionales con D3.js
 * Ene 2026: Migración a d3-org-chart para visualización interactiva
 */
function OrganigramaPage() {
  const navigate = useNavigate();
  const resolvedTheme = useThemeStore(selectResolvedTheme);
  const isDarkMode = resolvedTheme === 'dark';

  const { arbol, stats, isLoading, departamentos } = useOrganigrama();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDepartamento, setFiltroDepartamento] = useState('');

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

  // Handler para click en nodo
  const handleNodeClick = (node) => {
    if (node?.id) {
      navigate(`/profesionales/${node.id}`);
    }
  };

  // Stats para StatCardGrid
  const statCards = [
    { icon: Users, label: 'Total', value: stats.total, color: 'gray' },
    { icon: User, label: 'Activos', value: stats.activos, color: 'green' },
    { icon: Network, label: 'Top-level', value: stats.raices, color: 'primary' },
    { icon: BarChart3, label: 'Niveles', value: stats.profundidadMaxima, color: 'secondary' },
  ];

  return (
    <ProfesionalesPageLayout
      icon={Network}
      title="Organigrama"
      subtitle="Estructura jerárquica de tu equipo"
    >
      {/* Stats Cards */}
      <StatCardGrid stats={statCards} className="mb-6" />

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

      {/* Organigrama D3 */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
          </div>
        </div>
      ) : arbolFiltrado.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
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
        </div>
      ) : (
        <Suspense fallback={
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
          </div>
        }>
          <D3OrgChart
            data={arbolFiltrado}
            onNodeClick={handleNodeClick}
            isDarkMode={isDarkMode}
            organizacionNombre="Mi Organización"
          />
        </Suspense>
      )}

      {/* Leyenda */}
      {!isLoading && arbolFiltrado.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Leyenda</h4>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Tipos */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500 shrink-0">Tipos:</span>
              {Object.entries(TIPO_LABELS).map(([key, label]) => (
                <span key={key} className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${TIPO_COLORS[key]}`}>
                  {label}
                </span>
              ))}
            </div>
            {/* Estados */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500 shrink-0">Estados:</span>
              {Object.entries(ESTADO_COLORS).map(([key, color]) => (
                <div key={key} className="flex items-center gap-1 whitespace-nowrap">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${color}`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ProfesionalesPageLayout>
  );
}

export default OrganigramaPage;
