/**
 * GaleriaModeracionPage — Grid de fotos de invitados con aprobar/rechazar/eliminar
 */
import { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Camera, Eye, EyeOff, Trash2
} from 'lucide-react';
import {
  useEvento, useGaleria, useCambiarEstadoFoto, useEliminarFoto
} from '@/hooks/otros/eventos-digitales';
import { useToast } from '@/hooks/utils';
import InvitacionesPublicLayout from '../InvitacionesPublicLayout';

export default function GaleriaModeracionPage() {
  const { id: eventoId } = useParams();
  const toast = useToast();

  const { data: eventoData } = useEvento(eventoId);
  const evento = eventoData?.data || eventoData;

  const { data: galeriaData, isLoading } = useGaleria(eventoId);
  const fotos = galeriaData?.data || galeriaData || [];

  const cambiarEstado = useCambiarEstadoFoto();
  const eliminarFoto = useEliminarFoto();

  const handleToggleVisible = useCallback(async (foto) => {
    try {
      const nuevoEstado = foto.visible ? 'oculta' : 'visible';
      await cambiarEstado.mutateAsync({ eventoId, fotoId: foto.id, estado: nuevoEstado });
      toast.success(foto.visible ? 'Foto ocultada' : 'Foto aprobada');
    } catch { /* error manejado por hook */ }
  }, [eventoId, cambiarEstado, toast]);

  const handleEliminar = useCallback(async (fotoId) => {
    if (!confirm('¿Eliminar esta foto permanentemente?')) return;
    try {
      await eliminarFoto.mutateAsync({ eventoId, fotoId });
      toast.success('Foto eliminada');
    } catch { /* error manejado por hook */ }
  }, [eventoId, eliminarFoto, toast]);

  return (
    <InvitacionesPublicLayout>
      <section className="py-8 bg-white dark:bg-gray-950 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            to={`/invitaciones/evento/${eventoId}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {evento?.nombre || 'Evento'}
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Galería de fotos</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {fotos.length} foto{fotos.length !== 1 ? 's' : ''} subida{fotos.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto" />
            </div>
          ) : fotos.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
              <Camera className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Aún no hay fotos
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Las fotos aparecerán aquí cuando tus invitados las suban desde la invitación
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {fotos.map((foto) => (
                <div
                  key={foto.id}
                  className={`group relative rounded-xl overflow-hidden border-2 ${
                    foto.visible
                      ? 'border-green-300 dark:border-green-700'
                      : 'border-gray-200 dark:border-gray-700 opacity-75'
                  }`}
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                    <img
                      src={foto.url || foto.imagen_url}
                      alt={foto.descripcion || 'Foto del evento'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Overlay acciones */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2 p-3 w-full justify-center">
                      <button
                        onClick={() => handleToggleVisible(foto)}
                        className={`p-2 rounded-lg text-white transition-colors ${
                          foto.visible
                            ? 'bg-amber-500 hover:bg-amber-600'
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                        title={foto.visible ? 'Ocultar' : 'Aprobar'}
                      >
                        {foto.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEliminar(foto.id)}
                        className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Badge estado */}
                  {!foto.visible && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-gray-900/70 text-white text-xs rounded-full">
                      Oculta
                    </div>
                  )}

                  {/* Info */}
                  {foto.subido_por && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-gray-900/70 text-white text-xs rounded-full truncate max-w-[80%]">
                      {foto.subido_por}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </InvitacionesPublicLayout>
  );
}
