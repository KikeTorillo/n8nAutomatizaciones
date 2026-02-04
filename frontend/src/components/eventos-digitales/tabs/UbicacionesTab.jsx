import { memo } from 'react';
import { Plus, Edit, Trash2, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Button, LoadingSpinner } from '@/components/ui';
import { useModalManager } from '@/hooks/utils';
import UbicacionFormDrawer from '../drawers/UbicacionFormDrawer';

/**
 * Tab de ubicaciones del evento
 * Refactorizado con Drawer - Feb 2026
 *
 * @param {Object} props
 * @param {Array} props.ubicaciones - Lista de ubicaciones
 * @param {boolean} props.isLoading - Estado de carga
 * @param {Object} props.eliminarUbicacion - Mutation para eliminar
 * @param {string} props.eventoId - ID del evento
 */
function UbicacionesTab({
  ubicaciones,
  isLoading,
  eliminarUbicacion,
  eventoId,
}) {
  const { openModal, closeModal, isOpen, getModalData, getModalProps } = useModalManager({
    ubicacion: { isOpen: false, data: null, mode: 'create' },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ubicaciones del Evento</h2>
        <Button onClick={() => openModal('ubicacion', null, { mode: 'create' })}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Ubicacion
        </Button>
      </div>

      {/* Drawer de Ubicacion */}
      <UbicacionFormDrawer
        isOpen={isOpen('ubicacion')}
        onClose={() => closeModal('ubicacion')}
        mode={getModalProps('ubicacion').mode}
        ubicacion={getModalData('ubicacion')}
        eventoId={eventoId}
      />

      {ubicaciones?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ubicaciones.map((ubi) => (
            <div key={ubi.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{ubi.nombre}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{ubi.tipo}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openModal('ubicacion', ubi, { mode: 'edit' })}
                    title="Editar ubicacion"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => eliminarUbicacion.mutate({ id: ubi.id, eventoId })}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Eliminar ubicacion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {ubi.direccion && <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"><MapPin className="w-4 h-4" />{ubi.direccion}</p>}
              {(ubi.hora_inicio || ubi.hora_fin) && (
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {ubi.hora_inicio}{ubi.hora_inicio && ubi.hora_fin && ' - '}{ubi.hora_fin}
                </p>
              )}
              {ubi.google_maps_url && (
                <a href={ubi.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 mt-2">
                  <ExternalLink className="w-4 h-4" />Ver en Google Maps
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay ubicaciones todavia</p>
        </div>
      )}
    </div>
  );
}

export default memo(UbicacionesTab, (prevProps, nextProps) => {
  return prevProps.eventoId === nextProps.eventoId &&
         prevProps.ubicaciones === nextProps.ubicaciones &&
         prevProps.isLoading === nextProps.isLoading;
});
