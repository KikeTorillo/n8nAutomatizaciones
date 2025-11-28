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
        className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-200 mb-2 ${
          nivel > 0 ? 'ml-8' : ''
        }`}
      >
        <div className="flex items-center space-x-3 flex-1">
          {/* Toggle Expansión */}
          {tieneHijos ? (
            <button
              onClick={() => onToggleExpansion(categoria.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
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
              <h3 className="text-sm font-medium text-gray-900">
                {categoria.nombre}
              </h3>
              {!categoria.activo && (
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded">
                  Inactiva
                </span>
              )}
              {tieneHijos && (
                <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                  {categoria.hijos.length} subcategoría{categoria.hijos.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {categoria.descripcion && (
              <p className="text-xs text-gray-600 mt-1">{categoria.descripcion}</p>
            )}
          </div>

          {/* Metadatos */}
          <div className="text-xs text-gray-500 mr-4">
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
  const { showToast } = useToast();

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
        showToast('Categoría eliminada correctamente', 'success');
        setModalEliminarAbierto(false);
        setCategoriaSeleccionada(null);
      },
      onError: (error) => {
        showToast(
          error.response?.data?.mensaje || 'Error al eliminar categoría',
          'error'
        );
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
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Volver al Inicio</span>
        </button>

        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona productos, proveedores y stock
        </p>
      </div>

      {/* Tabs de navegación */}
      <InventarioNavTabs />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header de sección */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FolderTree className="h-8 w-8 text-indigo-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Categorías</h2>
                <p className="text-sm text-gray-600">
                  {total} categoría{total !== 1 ? 's' : ''} en total
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={handleNuevaCategoria}
              icon={Plus}
            >
              Nueva Categoría
            </Button>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExpandirTodas}
              >
                Expandir Todas
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleContraerTodas}
              >
                Contraer Todas
              </Button>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarInactivas}
                onChange={(e) => setMostrarInactivas(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Mostrar inactivas</span>
            </label>
          </div>
        </div>

        {/* Árbol de Categorías */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {cargandoArbol ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Cargando categorías...</span>
            </div>
          ) : arbolFiltrado.length === 0 ? (
            <div className="text-center py-12">
              <FolderTree className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay categorías
              </h3>
              <p className="mt-1 text-sm text-gray-500">
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
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar la categoría{' '}
            <strong className="text-gray-900">
              {categoriaSeleccionada?.nombre}
            </strong>
            ?
          </p>

          {categoriaSeleccionada?.hijos?.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Esta categoría tiene{' '}
                <strong>{categoriaSeleccionada.hijos.length}</strong>{' '}
                subcategoría{categoriaSeleccionada.hijos.length !== 1 ? 's' : ''}. Las
                subcategorías quedarán sin padre.
              </p>
            </div>
          )}

          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer.
          </p>

          <div className="flex justify-end space-x-3 pt-4 border-t">
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
