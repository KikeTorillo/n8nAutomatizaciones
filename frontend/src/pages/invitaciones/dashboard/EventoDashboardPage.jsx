/**
 * EventoDashboardPage — Dashboard de un evento con stats, acciones rápidas y countdown
 */
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Users, CheckCircle2, Clock, XCircle,
  Edit3, Share2, Eye, Camera, UserPlus,
  Loader2, ArrowLeft, CalendarDays
} from 'lucide-react';
import { useEvento, useEventoEstadisticas } from '@/hooks/otros/eventos-digitales';
import InvitacionesPublicLayout from '../InvitacionesPublicLayout';

function StatCard({ icono: Icon, label, valor, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{valor}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function CountdownDisplay({ fecha }) {
  const diff = useMemo(() => {
    if (!fecha) return null;
    const now = new Date();
    const target = new Date(fecha);
    const ms = target - now;
    if (ms <= 0) return null;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours };
  }, [fecha]);

  if (!diff) return null;

  return (
    <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-6 text-white">
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="w-5 h-5" />
        <span className="font-medium">Faltan</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold">{diff.days}</span>
        <span className="text-lg">días</span>
        <span className="text-4xl font-bold ml-2">{diff.hours}</span>
        <span className="text-lg">horas</span>
      </div>
    </div>
  );
}

const ACCIONES = [
  { label: 'Editar invitación', icono: Edit3, to: (id) => `/eventos-digitales/${id}/editor`, color: 'text-pink-600 dark:text-pink-400' },
  { label: 'Compartir', icono: Share2, to: (id) => `/invitaciones/evento/${id}/compartir`, color: 'text-blue-600 dark:text-blue-400' },
  { label: 'Invitados', icono: UserPlus, to: (id) => `/invitaciones/evento/${id}/invitados`, color: 'text-green-600 dark:text-green-400' },
  { label: 'Galería', icono: Camera, to: (id) => `/invitaciones/evento/${id}/galeria`, color: 'text-purple-600 dark:text-purple-400' },
];

export default function EventoDashboardPage() {
  const { id } = useParams();
  const { data: eventoData, isLoading: loadingEvento } = useEvento(id);
  const { data: statsData } = useEventoEstadisticas(id);
  const evento = eventoData?.data || eventoData;
  const stats = statsData?.data || statsData;

  if (loadingEvento) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            to="/invitaciones/mis-eventos"
            className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Mis eventos
          </Link>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {evento.nombre}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {evento.fecha ? new Date(evento.fecha).toLocaleDateString('es-MX', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                }) : 'Sin fecha'}
              </p>
            </div>
            {evento.slug && (
              <a
                href={`/e/${evento.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Ver como invitado
              </a>
            )}
          </div>

          {/* Countdown */}
          <div className="mb-8">
            <CountdownDisplay fecha={evento.fecha} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icono={Users}
              label="Invitados"
              valor={stats?.total_invitados || evento.total_invitados || 0}
              color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              icono={CheckCircle2}
              label="Confirmados"
              valor={stats?.total_confirmados || evento.total_confirmados || 0}
              color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            />
            <StatCard
              icono={Clock}
              label="Pendientes"
              valor={stats?.total_pendientes || evento.total_pendientes || 0}
              color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            />
            <StatCard
              icono={XCircle}
              label="Rechazados"
              valor={stats?.total_rechazados || evento.total_rechazados || 0}
              color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            />
          </div>

          {/* Acciones rápidas */}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ACCIONES.map((accion) => {
              const Icon = accion.icono;
              return (
                <Link
                  key={accion.label}
                  to={accion.to(id)}
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <Icon className={`w-5 h-5 ${accion.color}`} />
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{accion.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </InvitacionesPublicLayout>
  );
}
