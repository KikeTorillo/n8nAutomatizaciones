/**
 * TestimoniosSection — Testimonios de usuarios para landing B2C
 */
import { Star } from 'lucide-react';
import { memo } from 'react';

const TESTIMONIOS = [
  {
    nombre: 'María García',
    evento: 'Boda',
    texto: 'Mis invitados quedaron encantados con la invitación digital. La personalización es increíble y el RSVP nos facilitó todo.',
    rating: 5,
  },
  {
    nombre: 'Ana López',
    evento: 'XV Años',
    texto: 'Crear la invitación fue super fácil, en menos de 10 minutos ya la tenía lista. La galería de fotos fue lo mejor de la fiesta.',
    rating: 5,
  },
  {
    nombre: 'Carlos Mendoza',
    evento: 'Bautizo',
    texto: 'Compartir por WhatsApp fue facilísimo. Todos pudieron confirmar asistencia desde su celular sin problemas.',
    rating: 5,
  },
];

const TestimonioCard = memo(function TestimonioCard({ testimonio }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex gap-1 mb-3">
        {Array.from({ length: testimonio.rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">
        "{testimonio.texto}"
      </p>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white text-sm">{testimonio.nombre}</p>
        <p className="text-xs text-pink-600 dark:text-pink-400">{testimonio.evento}</p>
      </div>
    </div>
  );
});

export default function TestimoniosSection() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Lo que dicen nuestros usuarios
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Miles de personas ya crearon sus invitaciones digitales con nosotros
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIOS.map((t) => (
            <TestimonioCard key={t.nombre} testimonio={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
