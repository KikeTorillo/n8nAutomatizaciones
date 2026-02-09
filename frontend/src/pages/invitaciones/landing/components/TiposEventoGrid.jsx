/**
 * TiposEventoGrid — Cards para tipos de evento: boda, XV, bautizo, cumpleaños
 */
import { Link } from 'react-router-dom';
import { Heart, Crown, Baby, Cake, ArrowRight } from 'lucide-react';
import { memo } from 'react';

const TIPOS = [
  {
    slug: 'bodas',
    titulo: 'Bodas',
    descripcion: 'Invitaciones elegantes para el día más importante de tu vida.',
    icono: Heart,
    color: 'from-pink-500 to-rose-500',
    bgLight: 'bg-pink-50 dark:bg-pink-900/20',
  },
  {
    slug: 'xv-anos',
    titulo: 'XV Años',
    descripcion: 'Diseños únicos para celebrar esta fecha tan especial.',
    icono: Crown,
    color: 'from-purple-500 to-fuchsia-500',
    bgLight: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    slug: 'bautizos',
    titulo: 'Bautizos',
    descripcion: 'Invitaciones tiernas y delicadas para la bienvenida de tu bebé.',
    icono: Baby,
    color: 'from-blue-400 to-cyan-400',
    bgLight: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    slug: 'cumpleanos',
    titulo: 'Cumpleaños',
    descripcion: 'Diseños divertidos y creativos para cualquier edad.',
    icono: Cake,
    color: 'from-amber-400 to-orange-500',
    bgLight: 'bg-amber-50 dark:bg-amber-900/20',
  },
];

const TipoCard = memo(function TipoCard({ tipo }) {
  const Icon = tipo.icono;
  return (
    <Link
      to={`/invitaciones/${tipo.slug}`}
      className={`group ${tipo.bgLight} rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-700`}
    >
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${tipo.color} text-white mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{tipo.titulo}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tipo.descripcion}</p>
      <span className="inline-flex items-center gap-1 text-sm font-medium text-pink-600 dark:text-pink-400 group-hover:gap-2 transition-all">
        Ver plantillas <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
});

export default function TiposEventoGrid() {
  return (
    <section className="py-16 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Invitaciones para cada ocasión
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Encuentra el diseño perfecto para tu evento
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIPOS.map((tipo) => (
            <TipoCard key={tipo.slug} tipo={tipo} />
          ))}
        </div>
      </div>
    </section>
  );
}
