/**
 * CaracteristicasGrid — Features: RSVP, galería, mesa de regalos, mesas, countdown, calendario
 */
import { CheckCircle2, Camera, Gift, Clock, Calendar, Users, QrCode, Music, MapPin } from 'lucide-react';
import { memo } from 'react';

const FEATURES = [
  {
    icono: CheckCircle2,
    titulo: 'Confirmación RSVP',
    descripcion: 'Tus invitados confirman asistencia desde su celular con un solo clic.',
  },
  {
    icono: Camera,
    titulo: 'Galería compartida',
    descripcion: 'Todos los invitados pueden subir fotos del evento en tiempo real.',
  },
  {
    icono: Gift,
    titulo: 'Mesa de regalos',
    descripcion: 'Agrega tu lista de regalos directamente en la invitación.',
  },
  {
    icono: Users,
    titulo: 'Asignación de mesas',
    descripcion: 'Organiza la ubicación de tus invitados con un plano interactivo.',
  },
  {
    icono: Clock,
    titulo: 'Cuenta regresiva',
    descripcion: 'Cuenta regresiva animada para generar emoción por tu evento.',
  },
  {
    icono: Calendar,
    titulo: 'Agregar al calendario',
    descripcion: 'Tus invitados agregan el evento a Google Calendar con un clic.',
  },
  {
    icono: QrCode,
    titulo: 'QR de check-in',
    descripcion: 'Cada invitado recibe un QR único para registro el día del evento.',
  },
  {
    icono: Music,
    titulo: 'Música de fondo',
    descripcion: 'Agrega la canción perfecta para ambientar tu invitación.',
  },
  {
    icono: MapPin,
    titulo: 'Ubicación con mapa',
    descripcion: 'Integración con Google Maps para que nadie se pierda.',
  },
];

const FeatureCard = memo(function FeatureCard({ feature }) {
  const Icon = feature.icono;
  return (
    <div className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
        <Icon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{feature.titulo}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{feature.descripcion}</p>
      </div>
    </div>
  );
});

export default function CaracteristicasGrid() {
  return (
    <section className="py-16 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Todo lo que necesitas para tu evento
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Herramientas poderosas para hacer tu evento inolvidable
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <FeatureCard key={f.titulo} feature={f} />
          ))}
        </div>
      </div>
    </section>
  );
}
