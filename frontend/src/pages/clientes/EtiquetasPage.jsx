/**
 * ====================================================================
 * PÁGINA - GESTIÓN DE ETIQUETAS DE CLIENTES
 * ====================================================================
 *
 * Fase 2 - Segmentación de Clientes (Ene 2026)
 * CRUD de etiquetas con colores
 *
 * ====================================================================
 */

import { Plus, Pencil, Trash2, Tag, Users } from 'lucide-react';
import { useEtiquetas, useEliminarEtiqueta } from '@/hooks/useEtiquetasClientes';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';
import EtiquetaFormDrawer from '@/components/clientes/EtiquetaFormDrawer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import SkeletonTable from '@/components/ui/SkeletonTable';
import Button from '@/components/ui/Button';
import ClientesPageLayout from '@/components/clientes/ClientesPageLayout';

export default function EtiquetasPage() {
  const toast = useToast();
  const { data: etiquetas = [], isLoading, error } = useEtiquetas({ soloActivas: 'false' });
  const eliminarEtiqueta = useEliminarEtiqueta();

  // Estado de modales centralizado con useModalManager
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    delete: { isOpen: false, data: null },
  });

  // Abrir modal para crear
  const handleCrear = () => {
    openModal('form', null);
  };

  // Abrir modal para editar
  const handleEditar = (etiqueta) => {
    openModal('form', etiqueta);
  };

  // Confirmar eliminación
  const handleEliminarClick = (etiqueta) => {
    openModal('delete', etiqueta);
  };

  // Ejecutar eliminación
  const handleEliminar = async () => {
    const etiquetaEliminar = getModalData('delete');
    if (!etiquetaEliminar) return;

    try {
      await eliminarEtiqueta.mutateAsync(etiquetaEliminar.id);
      toast.success('Etiqueta eliminada correctamente');
      closeModal('delete');
    } catch (err) {
      toast.error(err.message || 'Error al eliminar etiqueta');
    }
  };

  if (error) {
    return (
      <ClientesPageLayout
        icon={Tag}
        title="Etiquetas"
        subtitle="Error al cargar"
      >
        <div className="text-center text-red-500 py-8">
          Error al cargar etiquetas: {error.message}
        </div>
      </ClientesPageLayout>
    );
  }

  return (
    <ClientesPageLayout
      icon={Tag}
      title="Etiquetas"
      subtitle={`${etiquetas.length} etiquetas configuradas`}
      actions={
        <Button onClick={handleCrear} aria-label="Crear nueva etiqueta">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Nueva Etiqueta</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      }
    >
      {isLoading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : etiquetas.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Sin etiquetas"
          description="Crea tu primera etiqueta para comenzar a segmentar tus clientes"
          actionLabel="Crear etiqueta"
          onAction={handleCrear}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Etiqueta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <Users className="h-4 w-4 inline mr-1" />
                  Clientes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {etiquetas.map((etiqueta) => (
                <tr key={etiqueta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                      style={{
                        backgroundColor: etiqueta.color,
                        color: isLightColor(etiqueta.color) ? '#1F2937' : '#FFFFFF',
                      }}
                    >
                      {etiqueta.nombre}
                    </span>
                    {!etiqueta.activo && (
                      <span className="ml-2 text-xs text-gray-400">(Inactiva)</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {etiqueta.descripcion || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                      {etiqueta.total_clientes || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {etiqueta.orden}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditar(etiqueta)}
                        className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
                        title="Editar"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEliminarClick(etiqueta)}
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                        title="Eliminar"
                        disabled={etiqueta.total_clientes > 0}
                      >
                        <Trash2
                          className={`h-5 w-5 ${etiqueta.total_clientes > 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de formulario */}
      <EtiquetaFormDrawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        etiqueta={getModalData('form')}
      />

      {/* Modal de confirmacion de eliminacion */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={handleEliminar}
        title="Eliminar etiqueta"
        message={`¿Estas seguro de que deseas eliminar la etiqueta "${getModalData('delete')?.nombre}"?`}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={eliminarEtiqueta.isLoading}
      />
    </ClientesPageLayout>
  );
}

// Utilidad para determinar si un color es claro
function isLightColor(hexColor) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
