import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderTree, Plus, Edit, Trash2, ChevronRight, ChevronDown, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import InventarioNavTabs from '@/components/inventario/InventarioNavTabs';
import {
  useCategorias,
  useArbolCategorias,
  useEliminarCategoria,
} from '@/hooks/useCategorias';
import CategoriaFormModal from '@/components/inventario/CategoriaFormModal';

/**
 * Componente para renderizar nodo del árbol de categorías
 */
function NodoCategoria({
  categoria,
  nivel = 0,
  onEditar,
  onEliminar,
  expandido,
  onToggleExpansion,
}) {
  const tieneHijos = categoria.hijos && categoria.hijos.length > 0;
  const isExpanded = expandido[categoria.id];

  return (
    <div>
      {/* Nodo Actual */}
      <div
        className={`flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 mb-2 bg-white dark:bg-gray-800 ${
          nivel > 0 ? 'ml-8' : ''
        }`}
      >
        <div className="flex items-center space-x-3 flex-1">
          {/* Toggle Expansión */}
          {tieneHijos ? (
            <button
              onClick={() => onToggleExpansion(categoria.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          ) : (
            <div className="w-6" /> /* Espaciador */
          )}

          {/* Indicador de Color */}
          {categoria.color && (
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: categoria.color }}
            />
          )}

          {/* Nombre y Descripción */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {categoria.nombre}
              </h3>
              {!categoria.activo && (
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                  Inactiva
                </span>
              )}
              {tieneHijos && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded">
                  {categoria.hijos.length} subcategoría{categoria.hijos.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {categoria.descripcion && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{categoria.descripcion}</p>
            )}
          </div>

          {/* Metadatos */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mr-4">
            Orden: {categoria.orden}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEditar(categoria)}
            icon={Edit}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onEliminar(categoria)}
            icon={Trash2}
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Hijos (Subcategorías) */}
      {tieneHijos && isExpanded && (
        <div className="ml-4">
          {categoria.hijos.map((hijo) => (
            <NodoCategoria
              key={hijo.id}
              categoria={hijo}
              nivel={nivel + 1}
              onEditar={onEditar}
              onEliminar={onEliminar}
              expandido={expandido}
              onToggleExpansion={onToggleExpansion}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Página principal de Gestión de Categorías
 */
function CategoriasPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  // Estado
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [expandido, setExpandido] = useState({});
  const [mostrarInactivas, setMostrarInactivas] = useState(false);

  // Queries
  const { data: arbolData, isLoading: cargandoArbol } = useArbolCategorias();
  const arbol = arbolData || []; // Hook retorna array directamente

  const { data: categoriasData } = useCategorias();
  const total = categoriasData?.total || 0;

  // Mutations
  const eliminarMutation = useEliminarCategoria();

  // Handlers
  const handleNuevaCategoria = () => {
    setCategoriaSeleccionada(null);
    setModalMode('create');
    setIsFormModalOpen(true);
  };

  const handleEditarCategoria = (categoria) => {
    setCategoriaSeleccionada(categoria);
    setModalMode('edit');
    setIsFormModalOpen(true);
  };

  const handleAbrirModalEliminar = (categoria) => {
    setCategoriaSeleccionada(categoria);
    setModalEliminarAbierto(true);
  };

  const handleEliminar = () => {
    eliminarMutation.mutate(categoriaSeleccionada.id, {
      onSuccess: () => {
        showSuccess('Categoría eliminada correctamente');
        setModalEliminarAbierto(false);
        setCategoriaSeleccionada(null);
      },
      onError: (err) => {
        showError(err.message || 'Error al eliminar categoría');
      },
    });
  };

  const handleToggleExpansion = (categoriaId) => {
    setExpandido((prev) => ({
      ...prev,
      [categoriaId]: !prev[categoriaId],
    }));
  };

  const handleExpandirTodas = () => {
    const nuevosExpandidos = {};
    const expandirRecursivo = (categorias) => {
      categorias.forEach((cat) => {
        if (cat.hijos && cat.hijos.length > 0) {
          nuevosExpandidos[cat.id] = true;
          expandirRecursivo(cat.hijos);
        }
      });
    };
    expandirRecursivo(arbol);
    setExpandido(nuevosExpandidos);
  };

  const handleContraerTodas = () => {
    setExpandido({});
  };

  // Filtrar categorías inactivas si corresponde
  const arbolFiltrado = mostrarInactivas
    ? arbol
    : arbol.filter((cat) => cat.activo).map((cat) => ({
        ...cat,
        hijos: cat.hijos?.filter((h) => h.activo),
      }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con navegación */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/home')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al Inicio
        </Button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventario</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestiona productos, proveedores y stock
        </p>
      </div>

      {/* Tabs de navegación */}
      <InventarioNavTabs />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header de sección - Mobile First */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <FolderTree className="h-7 w-7 sm:h-8 sm:w-8 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Categorías</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {total} categoría{total !== 1 ? 's' : ''} en total
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={handleNuevaCategoria}
              icon={Plus}
              className="w-full sm:w-auto"
            >
              Nueva Categoría
            </Button>
          </div>
        </div>

        {/* Controles - Mobile First */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExpandirTodas}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                Expandir Todas
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleContraerTodas}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                Contraer Todas
              </Button>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarInactivas}
                onChange={(e) => setMostrarInactivas(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 bg-white dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Mostrar inactivas</span>
            </label>
          </div>
        </div>

        {/* Árbol de Categorías */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          {cargandoArbol ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando categorías...</span>
            </div>
          ) : arbolFiltrado.length === 0 ? (
            <div className="text-center py-12">
              <FolderTree className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No hay categorías
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comienza creando tu primera categoría
              </p>
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={handleNuevaCategoria}
                  icon={Plus}
                >
                  Nueva Categoría
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {arbolFiltrado.map((categoria) => (
                <NodoCategoria
                  key={categoria.id}
                  categoria={categoria}
                  nivel={0}
                  onEditar={handleEditarCategoria}
                  onEliminar={handleAbrirModalEliminar}
                  expandido={expandido}
                  onToggleExpansion={handleToggleExpansion}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Formulario */}
      <CategoriaFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        categoria={categoriaSeleccionada}
        mode={modalMode}
      />

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        isOpen={modalEliminarAbierto}
        onClose={() => setModalEliminarAbierto(false)}
        title="Eliminar Categoría"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Estás seguro de que deseas eliminar la categoría{' '}
            <strong className="text-gray-900 dark:text-gray-100">
              {categoriaSeleccionada?.nombre}
            </strong>
            ?
          </p>

          {categoriaSeleccionada?.hijos?.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ Esta categoría tiene{' '}
                <strong>{categoriaSeleccionada.hijos.length}</strong>{' '}
                subcategoría{categoriaSeleccionada.hijos.length !== 1 ? 's' : ''}. Las
                subcategorías quedarán sin padre.
              </p>
            </div>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Esta acción no se puede deshacer.
          </p>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setModalEliminarAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleEliminar}
              isLoading={eliminarMutation.isPending}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CategoriasPage;
