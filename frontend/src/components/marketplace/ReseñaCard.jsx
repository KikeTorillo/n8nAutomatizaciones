import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui';
import EstrellaRating from './EstrellaRating';

/**
 * Tarjeta de reseña individual
 * Muestra la reseña de un cliente con rating, comentario y respuesta del negocio
 *
 * @param {Object} resena - Datos de la reseña
 * @param {number} resena.id - ID de la reseña
 * @param {number} resena.rating - Rating (1-5)
 * @param {string} resena.comentario - Comentario del cliente
 * @param {string} resena.respuesta - Respuesta del negocio (opcional)
 * @param {string} resena.cliente_nombre - Nombre del cliente
 * @param {string} resena.creado_en - Fecha de creación
 * @param {string} resena.respondido_en - Fecha de respuesta (opcional)
 * @param {boolean} canResponder - Si el usuario puede responder (admin/propietario)
 * @param {function} onResponder - Callback para responder: (resenaId) => void
 * @param {string} className - Clases adicionales
 *
 * @example
 * <ReseñaCard
 *   resena={resena}
 *   canResponder={user.nivel_jerarquia >= 80}
 *   onResponder={(id) => setSelectedResena(id)}
 * />
 */
function ReseñaCard({ resena, canResponder = false, onResponder, className }) {
  const [expanded, setExpanded] = useState(false);

  // Límite de caracteres para mostrar truncado
  const LIMIT = 200;
  const shouldTruncate = resena.comentario && resena.comentario.length > LIMIT;
  const comentarioMostrado = expanded || !shouldTruncate
    ? resena.comentario
    : `${resena.comentario.substring(0, LIMIT)}...`;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header con avatar, nombre y fecha */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          {/* Avatar placeholder */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          {/* Nombre y fecha */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {resena.cliente_nombre || 'Cliente'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(resena.creado_en, 'short')}
            </p>
          </div>
        </div>

        {/* Rating */}
        <EstrellaRating rating={resena.rating} size="sm" readonly />
      </div>

      {/* Comentario */}
      {resena.comentario && (
        <div className="mb-4">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {comentarioMostrado}
          </p>

          {/* Botón "ver más" */}
          {shouldTruncate && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium mt-2"
            >
              {expanded ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </div>
      )}

      {/* Respuesta del negocio */}
      {resena.respuesta && (
        <div className="mt-4 bg-gray-50 dark:bg-gray-700 border-l-4 border-primary-500 p-4 rounded-r-lg">
          <div className="flex items-start space-x-2 mb-2">
            <MessageSquare className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Respuesta del negocio
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {resena.respuesta}
              </p>
              {resena.respondido_en && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formatDate(resena.respondido_en, 'short')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botón responder (solo si puede responder y no hay respuesta) */}
      {canResponder && !resena.respuesta && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onResponder?.(resena.id)}
            className="text-primary-600 hover:text-primary-700"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Responder
          </Button>
        </div>
      )}
    </div>
  );
}

export default ReseñaCard;
