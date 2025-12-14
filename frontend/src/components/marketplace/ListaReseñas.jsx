import { useState } from 'react';
import { useReseñasNegocio, useResponderReseña, useModerarReseña } from '@/hooks/useMarketplace';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Star, Reply, EyeOff, Eye, MessageCircle } from 'lucide-react';

/**
 * Componente para listar y gestionar reseñas del negocio
 * Permite responder y moderar reseñas (admin/propietario)
 */
function ListaReseñas({ organizacionId }) {
  const [filtroEstado, setFiltroEstado] = useState('publicada');
  const [reseñaResponder, setReseñaResponder] = useState(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');

  const { success, error } = useToast();

  // Query: listar reseñas
  const { data, isLoading } = useReseñasNegocio(organizacionId, {
    estado: filtroEstado,
    limite: 50,
  });

  // Mutations
  const responderMutation = useResponderReseña();
  const moderarMutation = useModerarReseña();

  const resenas = data?.resenas || [];

  // Handler: responder reseña
  const handleResponder = async (reseñaId) => {
    if (!respuestaTexto.trim()) {
      error('Debes escribir una respuesta');
      return;
    }

    try {
      await responderMutation.mutateAsync({
        id: reseñaId,
        respuesta: respuestaTexto,
      });
      success('Respuesta publicada exitosamente');
      setReseñaResponder(null);
      setRespuestaTexto('');
    } catch (err) {
      error(err.message || 'Error al responder reseña');
    }
  };

  // Handler: moderar reseña
  const handleModerar = async (reseñaId, nuevoEstado, motivo = '') => {
    try {
      await moderarMutation.mutateAsync({
        id: reseñaId,
        estado: nuevoEstado,
        motivo_moderacion: motivo,
      });

      const mensajes = {
        publicada: 'Reseña publicada',
        oculta: 'Reseña ocultada',
        reportada: 'Reseña reportada',
      };

      success(mensajes[nuevoEstado] || 'Estado actualizado');
    } catch (err) {
      error(err.message || 'Error al moderar reseña');
    }
  };

  // Render: estrellas
  const renderEstrellas = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por estado:</label>
        <div className="flex gap-2">
          {['publicada', 'pendiente', 'oculta', 'reportada'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filtroEstado === estado
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de reseñas */}
      {resenas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <MessageCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            No hay reseñas {filtroEstado !== 'publicada' ? `en estado "${filtroEstado}"` : 'aún'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {resenas.map((resena) => (
            <div
              key={resena.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {resena.cliente_nombre || 'Cliente Anónimo'}
                    </span>
                    {renderEstrellas(resena.rating)}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        resena.estado === 'publicada'
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                          : resena.estado === 'pendiente'
                            ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                            : resena.estado === 'oculta'
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                              : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                      }`}
                    >
                      {resena.estado}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(resena.creado_en).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Título y comentario */}
              {resena.titulo && (
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">{resena.titulo}</h4>
              )}
              {resena.comentario && (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{resena.comentario}</p>
              )}

              {/* Respuesta del negocio */}
              {resena.respuesta_negocio && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-primary-500">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Respuesta del negocio:</p>
                  <p className="text-gray-700 dark:text-gray-300">{resena.respuesta_negocio}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {new Date(resena.respuesta_fecha).toLocaleDateString('es-MX')}
                  </p>
                </div>
              )}

              {/* Formulario de respuesta */}
              {reseñaResponder === resena.id && (
                <div className="space-y-3">
                  <textarea
                    value={respuestaTexto}
                    onChange={(e) => setRespuestaTexto(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Escribe tu respuesta..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleResponder(resena.id)}
                      disabled={responderMutation.isLoading}
                    >
                      {responderMutation.isLoading ? 'Publicando...' : 'Publicar Respuesta'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReseñaResponder(null);
                        setRespuestaTexto('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                {/* Responder */}
                {!resena.respuesta_negocio && reseñaResponder !== resena.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReseñaResponder(resena.id)}
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    Responder
                  </Button>
                )}

                {/* Moderar */}
                {resena.estado === 'publicada' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleModerar(resena.id, 'oculta', 'Oculta por el negocio')}
                    disabled={moderarMutation.isLoading}
                  >
                    <EyeOff className="w-4 h-4 mr-1" />
                    Ocultar
                  </Button>
                )}

                {resena.estado === 'oculta' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleModerar(resena.id, 'publicada')}
                    disabled={moderarMutation.isLoading}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Publicar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ListaReseñas;
