/**
 * CompartirPage — Link copiable, WhatsApp share, QR code, stats
 */
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Eye, QrCode } from 'lucide-react';
import { useEvento, useEventoEstadisticas } from '@/hooks/otros/eventos-digitales';
import InvitacionesPublicLayout from '../InvitacionesPublicLayout';
import CompartirLinks from './components/CompartirLinks';
import RSVPTracker from './components/RSVPTracker';

export default function CompartirPage() {
  const { id } = useParams();
  const { data: eventoData, isLoading } = useEvento(id);
  const { data: statsData } = useEventoEstadisticas(id);
  const evento = eventoData;
  const stats = statsData;

  if (isLoading) {
    return (
      <InvitacionesPublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      </InvitacionesPublicLayout>
    );
  }

  if (!evento) {
    return (
      <InvitacionesPublicLayout>
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Evento no encontrado</p>
          <Link to="/invitaciones/mis-eventos" className="text-pink-600 dark:text-pink-400 font-medium">
            Volver a mis eventos
          </Link>
        </div>
      </InvitacionesPublicLayout>
    );
  }

  return (
    <InvitacionesPublicLayout>
      <section className="py-8 bg-white dark:bg-gray-950 min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            to={`/invitaciones/evento/${id}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {evento.nombre}
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Compartir invitación
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Izquierda: Compartir */}
            <div className="space-y-6">
              {evento.slug ? (
                <CompartirLinks slug={evento.slug} />
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Necesitas publicar tu evento antes de poder compartirlo. Edita tu invitación y haz clic en "Publicar".
                  </p>
                  <Link
                    to={`/eventos-digitales/${id}/editor`}
                    className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    Ir al editor
                  </Link>
                </div>
              )}

              {/* Vista previa */}
              {evento.slug && (
                <div>
                  <a
                    href={`/e/${evento.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver invitación como invitado
                  </a>
                </div>
              )}

              {/* QR */}
              {evento.slug && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 text-center">
                  <QrCode className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Código QR disponible en el dashboard del evento
                  </p>
                </div>
              )}
            </div>

            {/* Derecha: Stats */}
            <div>
              <RSVPTracker stats={stats} />
            </div>
          </div>
        </div>
      </section>
    </InvitacionesPublicLayout>
  );
}
