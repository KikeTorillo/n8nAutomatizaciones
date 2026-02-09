/**
 * MisEventosPage — Lista de eventos del anfitrión con cards
 */
import { Link } from 'react-router-dom';
import { Plus, Loader2, CalendarHeart } from 'lucide-react';
import { useEventos } from '@/hooks/otros/eventos-digitales';
import InvitacionesPublicLayout from '../InvitacionesPublicLayout';
import EventoCard from './components/EventoCard';

export default function MisEventosPage() {
  const { data: eventosData, isLoading } = useEventos();
  const eventos = eventosData?.eventos || [];

  return (
    <InvitacionesPublicLayout>
      <section className="py-12 bg-white dark:bg-gray-950 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Mis eventos
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestiona tus invitaciones digitales
              </p>
            </div>
            <Link
              to="/invitaciones/crear"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-pink-500 text-white font-medium rounded-xl hover:bg-pink-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo evento</span>
            </Link>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto" />
            </div>
          ) : eventos.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
              <CalendarHeart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Aún no tienes eventos
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Crea tu primera invitación digital y sorprende a tus invitados
              </p>
              <Link
                to="/invitaciones/crear"
                className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear mi primera invitación
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventos.map((evento) => (
                <EventoCard key={evento.id} evento={evento} />
              ))}
            </div>
          )}
        </div>
      </section>
    </InvitacionesPublicLayout>
  );
}
