import { memo } from 'react';
import { Check, X, MessageCircle } from 'lucide-react';
import { Button, LoadingSpinner } from '@/components/ui';

/**
 * Tab de felicitaciones del evento
 * @param {Object} props
 * @param {Object} props.felicitacionesData - Datos de felicitaciones { felicitaciones: [], total: number }
 * @param {boolean} props.isLoading - Estado de carga
 * @param {Object} props.aprobarFelicitacion - Mutation para aprobar
 * @param {Object} props.rechazarFelicitacion - Mutation para rechazar
 * @param {string} props.eventoId - ID del evento
 */
function FelicitacionesTab({
  felicitacionesData,
  isLoading,
  aprobarFelicitacion,
  rechazarFelicitacion,
  eventoId,
}) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Felicitaciones</h2>
      </div>

      {felicitacionesData?.felicitaciones?.length > 0 ? (
        <div className="space-y-4">
          {felicitacionesData.felicitaciones.map((fel) => (
            <div key={fel.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{fel.nombre_autor}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(fel.created_at).toLocaleDateString('es-ES')}</p>
                </div>
                <div className="flex gap-2">
                  {!fel.aprobada && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => aprobarFelicitacion.mutate({ id: fel.id, eventoId })}
                        className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rechazarFelicitacion.mutate({ id: fel.id, eventoId })}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {fel.aprobada && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 px-2 py-1 rounded-full">Aprobada</span>
                  )}
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mt-2 italic">"{fel.mensaje}"</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay felicitaciones todavia</p>
        </div>
      )}
    </div>
  );
}

export default memo(FelicitacionesTab, (prevProps, nextProps) => {
  return prevProps.eventoId === nextProps.eventoId &&
         prevProps.felicitacionesData === nextProps.felicitacionesData &&
         prevProps.isLoading === nextProps.isLoading;
});
