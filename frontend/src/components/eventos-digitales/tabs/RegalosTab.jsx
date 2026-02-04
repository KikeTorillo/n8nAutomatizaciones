import { memo } from 'react';
import { Plus, Edit, Trash2, Gift, ExternalLink, Check } from 'lucide-react';
import { Button, LoadingSpinner } from '@/components/ui';
import { useModalManager } from '@/hooks/utils';
import RegaloFormDrawer from '../drawers/RegaloFormDrawer';

/**
 * Tab de mesa de regalos del evento
 * Refactorizado con Drawer - Feb 2026
 *
 * @param {Object} props
 * @param {Array} props.regalos - Lista de regalos
 * @param {boolean} props.isLoading - Estado de carga
 * @param {Object} props.eliminarRegalo - Mutation para eliminar
 * @param {string} props.eventoId - ID del evento
 */
function RegalosTab({
  regalos,
  isLoading,
  eliminarRegalo,
  eventoId,
}) {
  const { openModal, closeModal, isOpen, getModalData, getModalProps } = useModalManager({
    regalo: { isOpen: false, data: null, mode: 'create' },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mesa de Regalos</h2>
        <Button onClick={() => openModal('regalo', null, { mode: 'create' })}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Regalo
        </Button>
      </div>

      {/* Drawer de Regalo */}
      <RegaloFormDrawer
        isOpen={isOpen('regalo')}
        onClose={() => closeModal('regalo')}
        mode={getModalProps('regalo').mode}
        regalo={getModalData('regalo')}
        eventoId={eventoId}
      />

      {regalos?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regalos.map((regalo) => (
            <div key={regalo.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{regalo.nombre}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{regalo.tipo.replace('_', ' ')}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openModal('regalo', regalo, { mode: 'edit' })}
                    title="Editar regalo"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => eliminarRegalo.mutate({ id: regalo.id, eventoId })}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Eliminar regalo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {regalo.descripcion && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{regalo.descripcion}</p>}
              {regalo.precio && <p className="text-lg font-semibold text-pink-600 dark:text-pink-400">${regalo.precio.toLocaleString()}</p>}
              {regalo.comprado && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 px-2 py-1 rounded-full mt-2">
                  <Check className="w-3 h-3" />Comprado
                </span>
              )}
              {regalo.url_externa && (
                <a href={regalo.url_externa} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 mt-2">
                  <ExternalLink className="w-4 h-4" />Ver producto
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Gift className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay regalos en la mesa todavia</p>
        </div>
      )}
    </div>
  );
}

export default memo(RegalosTab, (prevProps, nextProps) => {
  return prevProps.eventoId === nextProps.eventoId &&
         prevProps.regalos === nextProps.regalos &&
         prevProps.isLoading === nextProps.isLoading;
});
