/**
 * PlantillasCarousel — Muestra 6-8 plantillas destacadas con scroll horizontal
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { memo, useRef } from 'react';
import { usePlantillasPublicas } from '@/hooks/otros/eventos-digitales';
import PlantillaPreviewImage from '../../components/PlantillaPreviewImage';

const PlantillaCard = memo(function PlantillaCard({ plantilla }) {
  return (
    <div className="flex-shrink-0 w-64 sm:w-72 group">
      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3 shadow-sm group-hover:shadow-md transition-shadow">
        <PlantillaPreviewImage plantilla={plantilla} className="group-hover:scale-105 transition-transform duration-300" />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{plantilla.nombre}</h3>
      <p className="text-xs text-pink-600 dark:text-pink-400 capitalize">{plantilla.tipo_evento?.replace('_', ' ')}</p>
    </div>
  );
});

export default function PlantillasCarousel() {
  const scrollRef = useRef(null);
  const { data: plantillasData, isLoading } = usePlantillasPublicas({ limit: 8, activo: true });
  const plantillas = plantillasData?.plantillas || [];

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto" />
        </div>
      </section>
    );
  }

  if (!plantillas.length) return null;

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Plantillas destacadas
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Elige un diseño y personalízalo a tu gusto
            </p>
          </div>
          <Link
            to="/invitaciones/ejemplos"
            className="hidden sm:inline-flex items-center gap-1 text-pink-600 dark:text-pink-400 font-medium hover:gap-2 transition-all"
          >
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory"
        >
          {plantillas.map((p) => (
            <PlantillaCard key={p.id} plantilla={p} />
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            to="/invitaciones/ejemplos"
            className="inline-flex items-center gap-1 text-pink-600 dark:text-pink-400 font-medium"
          >
            Ver todas las plantillas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
