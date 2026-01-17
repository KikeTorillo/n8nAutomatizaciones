import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Filter,
  BookOpen,
} from 'lucide-react';
import {
  BackButton,
  Button,
  Checkbox,
  ConfirmDialog,
  Input,
  Select
} from '@/components/ui';
import { useModalManager } from '@/hooks/useModalManager';
import {
  useArbolCuentas,
  useCuentasContables,
  useCrearCuenta,
  useActualizarCuenta,
  useEliminarCuenta,
} from '@/hooks/useContabilidad';
import CuentaFormModal from '@/components/contabilidad/CuentaFormModal';

// Opciones de tipo de cuenta
const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'activo', label: 'Activo' },
  { value: 'pasivo', label: 'Pasivo' },
  { value: 'capital', label: 'Capital' },
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'gasto', label: 'Gasto' },
  { value: 'orden', label: 'Orden' },
];

const NATURALEZA_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'deudora', label: 'Deudora' },
  { value: 'acreedora', label: 'Acreedora' },
];

// Colores por tipo de cuenta
const TIPO_COLORS = {
  activo: 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-400',
  pasivo: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400',
  capital: 'bg-secondary-100 dark:bg-secondary-900/40 text-secondary-800 dark:text-secondary-400',
  ingreso: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400',
  gasto: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-400',
  orden: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
};

/**
 * Página de gestión de cuentas contables (catálogo SAT)
 */
function CuentasContablesPage() {

  // Estado de filtros
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [naturalezaFiltro, setNaturalezaFiltro] = useState('');
  const [soloActivas, setSoloActivas] = useState(true);
  const [vistaArbol, setVistaArbol] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Estado de árbol expandido
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Modal manager para form y eliminar
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    eliminar: { isOpen: false, data: null },
  });

  // Queries
  const { data: arbolPlano, isLoading: loadingArbol } = useArbolCuentas({ solo_activas: soloActivas });
  const { data: cuentasData, isLoading: loadingCuentas } = useCuentasContables({
    busqueda: busqueda || undefined,
    tipo: tipoFiltro || undefined,
    naturaleza: naturalezaFiltro || undefined,
    activo: soloActivas,
    limite: 100,
  });

  // Convertir array plano a árbol con hijos anidados
  const arbol = useMemo(() => {
    if (!arbolPlano || !Array.isArray(arbolPlano)) return [];

    // Crear un mapa de cuentas por id
    const cuentasMap = new Map();
    arbolPlano.forEach(cuenta => {
      cuentasMap.set(cuenta.id, { ...cuenta, hijos: [] });
    });

    // Construir el árbol asignando hijos a sus padres
    const tree = [];
    cuentasMap.forEach(cuenta => {
      if (cuenta.cuenta_padre_id) {
        const padre = cuentasMap.get(cuenta.cuenta_padre_id);
        if (padre) {
          padre.hijos.push(cuenta);
        }
      } else {
        tree.push(cuenta);
      }
    });

    return tree;
  }, [arbolPlano]);

  // Mutations
  const crearCuenta = useCrearCuenta();
  const actualizarCuenta = useActualizarCuenta();
  const eliminarCuenta = useEliminarCuenta();

  // Filtrar árbol por búsqueda
  const arbolFiltrado = useMemo(() => {
    if (!busqueda || !arbol) return arbol;

    const filterNodes = (nodes) => {
      return nodes.reduce((acc, node) => {
        const matchesBusqueda =
          node.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
          node.nombre?.toLowerCase().includes(busqueda.toLowerCase());

        const filteredChildren = node.hijos ? filterNodes(node.hijos) : [];

        if (matchesBusqueda || filteredChildren.length > 0) {
          acc.push({
            ...node,
            hijos: filteredChildren,
          });
        }

        return acc;
      }, []);
    };

    return filterNodes(arbol);
  }, [arbol, busqueda]);

  // Toggle nodo expandido
  const toggleNode = (id) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expandir todos
  const expandAll = () => {
    const getAllIds = (nodes) => {
      let ids = [];
      nodes.forEach((node) => {
        ids.push(node.id);
        if (node.hijos) {
          ids = [...ids, ...getAllIds(node.hijos)];
        }
      });
      return ids;
    };
    if (arbol) {
      setExpandedNodes(new Set(getAllIds(arbol)));
    }
  };

  // Colapsar todos
  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Abrir modal para crear
  const handleNuevaCuenta = (cuentaPadre = null) => {
    openModal('form', cuentaPadre ? { cuenta_padre_id: cuentaPadre.id, cuenta_padre: cuentaPadre } : null);
  };

  // Abrir modal para editar
  const handleEditarCuenta = (cuenta) => {
    openModal('form', cuenta);
  };

  // Guardar cuenta
  const handleGuardar = async (formData) => {
    const cuentaEditar = getModalData('form');
    try {
      if (cuentaEditar?.id) {
        await actualizarCuenta.mutateAsync({ id: cuentaEditar.id, ...formData });
      } else {
        await crearCuenta.mutateAsync(formData);
      }
      closeModal('form');
    } catch {
      // Error manejado en el hook
    }
  };

  // Eliminar cuenta
  const handleEliminar = async () => {
    const cuentaEliminar = getModalData('eliminar');
    if (!cuentaEliminar) return;
    try {
      await eliminarCuenta.mutateAsync(cuentaEliminar.id);
      closeModal('eliminar');
    } catch {
      // Error manejado en el hook
    }
  };

  // Renderizar nodo del árbol
  const renderTreeNode = (node, level = 0) => {
    const hasChildren = node.hijos && node.hijos.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const paddingLeft = level * 24 + 12;

    return (
      <div key={node.id}>
        <div
          className="flex items-center py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 group"
          style={{ paddingLeft }}
        >
          {/* Botón expandir/colapsar */}
          <button
            onClick={() => hasChildren && toggleNode(node.id)}
            className={`w-6 h-6 flex items-center justify-center mr-2 ${
              hasChildren ? 'cursor-pointer text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300' : 'invisible'
            }`}
          >
            {hasChildren && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
          </button>

          {/* Código */}
          <span className="font-mono text-sm text-gray-600 dark:text-gray-400 w-24 flex-shrink-0">
            {node.codigo}
          </span>

          {/* Nombre */}
          <span className={`flex-1 text-sm ${node.afectable ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
            {node.nombre}
          </span>

          {/* Tipo badge */}
          <span className={`px-2 py-0.5 text-xs rounded-full mr-3 ${TIPO_COLORS[node.tipo] || 'bg-gray-100 dark:bg-gray-700'}`}>
            {node.tipo}
          </span>

          {/* Naturaleza */}
          <span className="text-xs text-gray-500 dark:text-gray-400 w-20 text-center">
            {node.naturaleza}
          </span>

          {/* Afectable */}
          {node.afectable && (
            <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 rounded-full mr-3">
              Afectable
            </span>
          )}

          {/* Acciones */}
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 ml-2">
            {node.afectable && (
              <button
                onClick={() => handleNuevaCuenta(node)}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400"
                title="Agregar subcuenta"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleEditarCuenta(node)}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => openModal('eliminar', node)}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hijos */}
        {hasChildren && isExpanded && (
          <div>
            {node.hijos.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <BackButton to="/contabilidad" label="Volver a Contabilidad" className="mb-2" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Catálogo de Cuentas</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                Gestión del catálogo contable basado en SAT México
              </p>
            </div>

            <Button variant="primary" onClick={() => handleNuevaCuenta()}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cuenta
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <Input
                placeholder="Buscar por código o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-gray-400" />}
              />
            </div>

            {/* Toggle vista */}
            <div className="flex gap-2">
              <Button
                variant={vistaArbol ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setVistaArbol(true)}
              >
                Árbol
              </Button>
              <Button
                variant={!vistaArbol ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setVistaArbol(false)}
              >
                Lista
              </Button>
            </div>

            {/* Botón filtros */}
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {(tipoFiltro || naturalezaFiltro) && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-800 rounded-full">
                  {[tipoFiltro, naturalezaFiltro].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* Filtros expandidos */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Tipo de cuenta"
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                options={TIPO_OPTIONS}
              />
              <Select
                label="Naturaleza"
                value={naturalezaFiltro}
                onChange={(e) => setNaturalezaFiltro(e.target.value)}
                options={NATURALEZA_OPTIONS}
              />
              <div className="flex items-end">
                <Checkbox
                  label="Solo activas"
                  checked={soloActivas}
                  onChange={(e) => setSoloActivas(e.target.checked)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Toolbar árbol */}
          {vistaArbol && (
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex gap-2">
              <Button variant="ghost" size="sm" onClick={expandAll}>
                Expandir todo
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAll}>
                Colapsar todo
              </Button>
            </div>
          )}

          {/* Vista árbol */}
          {vistaArbol && (
            <div className="overflow-x-auto">
              {loadingArbol ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Cargando catálogo...
                </div>
              ) : arbolFiltrado && arbolFiltrado.length > 0 ? (
                <div className="min-w-[800px]">
                  {arbolFiltrado.map((node) => renderTreeNode(node))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No se encontraron cuentas</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    {busqueda ? 'Intenta con otros términos de búsqueda' : 'Inicializa el catálogo SAT desde el dashboard'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Vista lista */}
          {!vistaArbol && (
            <div className="overflow-x-auto">
              {loadingCuentas ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Cargando cuentas...
                </div>
              ) : cuentasData?.cuentas?.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Naturaleza</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Afectable</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {cuentasData.cuentas.map((cuenta) => (
                      <tr key={cuenta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-400">{cuenta.codigo}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{cuenta.nombre}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${TIPO_COLORS[cuenta.tipo]}`}>
                            {cuenta.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{cuenta.naturaleza}</td>
                        <td className="px-4 py-3">
                          {cuenta.afectable && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 rounded-full">
                              Sí
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleEditarCuenta(cuenta)}
                              className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openModal('eliminar', cuenta)}
                              className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center">
                  <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No se encontraron cuentas</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar Cuenta */}
      <CuentaFormModal
        open={isOpen('form')}
        onClose={() => closeModal('form')}
        cuenta={getModalData('form')}
        onSave={handleGuardar}
        isLoading={crearCuenta.isPending || actualizarCuenta.isPending}
      />

      {/* Confirm Eliminar */}
      <ConfirmDialog
        open={isOpen('eliminar')}
        onClose={() => closeModal('eliminar')}
        onConfirm={handleEliminar}
        title="Eliminar Cuenta"
        message={`¿Estás seguro de eliminar la cuenta "${getModalData('eliminar')?.codigo} - ${getModalData('eliminar')?.nombre}"? Esta acción desactivará la cuenta.`}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={eliminarCuenta.isPending}
      />
    </div>
  );
}

export default CuentasContablesPage;
