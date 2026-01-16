import { useState, useCallback } from 'react';
import { FolderTree, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useModalManager } from '@/hooks/useModalManager';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import Alert from '@/components/ui/Alert';
import { TreeView, useTreeExpansion } from '@/components/ui/TreeNode';
import { useToast } from '@/hooks/useToast';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useCategorias,
  useArbolCategorias,
  useEliminarCategoria,
} from '@/hooks/useCategorias';
import CategoriaFormModal from '@/components/inventario/CategoriaFormModal';

/**
 * Página principal de Gestión de Categorías
 */
function CategoriasPage() {
  const { success: showSuccess, error: showError } = useToast();

  // Estado de modales unificado
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    eliminar: { isOpen: false, data: null },
  });

  // Estado UI
  const { expanded, toggle, expandAll, collapseAll } = useTreeExpansion();
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
    openModal('form', { mode: 'create', categoria: null });
  };

  const handleEditarCategoria = (categoria) => {
    openModal('form', { mode: 'edit', categoria });
  };

  const handleAbrirModalEliminar = (categoria) => {
    openModal('eliminar', categoria);
  };

  const handleEliminar = () => {
    const categoriaSeleccionada = getModalData('eliminar');
    eliminarMutation.mutate(categoriaSeleccionada.id, {
      onSuccess: () => {
        showSuccess('Categoría eliminada correctamente');
        closeModal('eliminar');
      },
      onError: (err) => {
        showError(err.message || 'Error al eliminar categoría');
      },
    });
  };

  const handleExpandirTodas = () => {
    expandAll(arbol, 'hijos');
  };

  const handleContraerTodas = () => {
    collapseAll();
  };

  // Render callbacks para TreeView
  const renderCategoriaContent = useCallback((categoria, { hasChildren }) => (
    <>
      {/* Indicador de Color */}
      {categoria.color && (
        <div
          className="w-4 h-4 rounded flex-shrink-0"
          style={{ backgroundColor: categoria.color }}
        />
      )}

      {/* Nombre y Descripción */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 flex-wrap">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {categoria.nombre}
          </h3>
          {!categoria.activo && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
              Inactiva
            </span>
          )}
          {hasChildren && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded">
              {categoria.hijos.length} subcategoría{categoria.hijos.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {categoria.descripcion && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">{categoria.descripcion}</p>
        )}
      </div>

      {/* Metadatos */}
      <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 hidden sm:block">
        Orden: {categoria.orden}
      </div>
    </>
  ), []);

  const renderCategoriaActions = useCallback((categoria) => (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => handleEditarCategoria(categoria)}
        icon={Edit}
      >
        <span className="hidden sm:inline">Editar</span>
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={() => handleAbrirModalEliminar(categoria)}
        icon={Trash2}
      >
        <span className="hidden sm:inline">Eliminar</span>
      </Button>
    </>
  ), []);

  // Filtrar categorías inactivas si corresponde
  const arbolFiltrado = mostrarInactivas
    ? arbol
    : arbol.filter((cat) => cat.activo).map((cat) => ({
        ...cat,
        hijos: cat.hijos?.filter((h) => h.activo),
      }));

  return (
    <InventarioPageLayout
      icon={FolderTree}
      title="Categorías"
      subtitle={`${total} categoría${total !== 1 ? 's' : ''} en total`}
      actions={
        <Button
          variant="primary"
          onClick={handleNuevaCategoria}
          icon={Plus}
          className="w-full sm:w-auto"
        >
          Nueva Categoría
        </Button>
      }
    >

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
          <TreeView
            data={arbolFiltrado}
            childrenKey="hijos"
            expandedState={expanded}
            onToggleExpand={toggle}
            renderContent={renderCategoriaContent}
            renderActions={renderCategoriaActions}
            isLoading={cargandoArbol}
            emptyState={
              <EmptyState
                icon={FolderTree}
                title="No hay categorías"
                description="Comienza creando tu primera categoría"
                actionLabel="Nueva Categoría"
                onAction={handleNuevaCategoria}
              />
            }
          />
        </div>

      {/* Modal de Formulario */}
      <CategoriaFormModal
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        categoria={getModalData('form')?.categoria}
        mode={getModalData('form')?.mode || 'create'}
      />

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDialog
        isOpen={isOpen('eliminar')}
        onClose={() => closeModal('eliminar')}
        onConfirm={handleEliminar}
        title="Eliminar Categoría"
        message={`¿Estás seguro de que deseas eliminar la categoría "${getModalData('eliminar')?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
        size="md"
      >
        {getModalData('eliminar')?.hijos?.length > 0 && (
          <Alert variant="warning" icon={AlertTriangle} title="Atención">
            <p className="text-sm">
              Esta categoría tiene{' '}
              <strong>{getModalData('eliminar').hijos.length}</strong>{' '}
              subcategoría{getModalData('eliminar').hijos.length !== 1 ? 's' : ''}. Las
              subcategorías quedarán sin padre.
            </p>
          </Alert>
        )}
      </ConfirmDialog>
    </InventarioPageLayout>
  );
}

export default CategoriasPage;
