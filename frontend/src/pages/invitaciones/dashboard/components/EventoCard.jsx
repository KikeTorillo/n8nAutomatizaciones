/**
 * EventoCard — Card de evento para la lista del anfitrión
 */
import { Link } from 'react-router-dom';
import { Calendar, Users, CheckCircle2, Clock, Edit3, Share2, Eye } from 'lucide-react';
import { memo } from 'react';

const EventoCard = memo(function EventoCard({ evento }) {
  const fecha = evento.fecha_evento ? new Date(evento.fecha_evento).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : 'Sin fecha';

  const estadoBadge = {
    borrador: { label: 'Borrador', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    publicado: { label: 'Publicado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    finalizado: { label: 'Finalizado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  };

  const badge = estadoBadge[evento.estado] || estadoBadge.borrador;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Preview */}
      <div className="aspect-[16/9] bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 relative">
        {evento.preview_url ? (
          <img
            src={evento.preview_url}
            alt={evento.nombre}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">💌</span>
          </div>
        )}
        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1 truncate">{evento.nombre}</h3>
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <Calendar className="w-3.5 h-3.5" />
          {fecha}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Users className="w-3.5 h-3.5" />
            <span>{evento.total_invitados || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{evento.total_confirmados || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{evento.total_pendientes || 0}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <Link
            to={`/invitaciones/evento/${evento.id}`}
            className="flex-1 text-center py-2 px-3 text-sm font-medium bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Ver dashboard
          </Link>
          <Link
            to={`/eventos-digitales/${evento.id}/editor`}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Editar invitación"
          >
            <Edit3 className="w-4 h-4" />
          </Link>
          <Link
            to={`/invitaciones/evento/${evento.id}/compartir`}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Compartir"
          >
            <Share2 className="w-4 h-4" />
          </Link>
          {evento.slug && (
            <a
              href={`/e/${evento.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Ver como invitado"
            >
              <Eye className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
});

export default EventoCard;
