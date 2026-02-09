/**
 * TipoEventoPage — Página genérica por tipo de evento (boda, XV, bautizo, cumpleaños)
 * Recibe el tipo de la URL: /invitaciones/bodas, /invitaciones/xv-anos, etc.
 */
import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Loader2, Heart, Crown, Baby, Cake } from 'lucide-react';
import { usePlantillasPublicas } from '@/hooks/otros/eventos-digitales';
import InvitacionesPublicLayout from '../InvitacionesPublicLayout';
import PlantillaPreviewImage from '../components/PlantillaPreviewImage';

const TIPOS_CONFIG = {
  bodas: {
    titulo: 'Invitaciones de Boda',
    subtitulo: 'Diseños elegantes para el día más importante de tu vida',
    descripcion: 'Encuentra la invitación perfecta para tu boda. Desde estilos clásicos y románticos hasta diseños modernos y minimalistas.',
    tipoEvento: 'boda',
    icono: Heart,
    color: 'from-pink-500 to-rose-500',
    bgGradient: 'from-pink-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950',
  },
  'xv-anos': {
    titulo: 'Invitaciones de XV Años',
    subtitulo: 'Diseños únicos para celebrar esta fecha tan especial',
    descripcion: 'Invitaciones de quinceañera con diseños modernos, elegantes y vibrantes. Personaliza cada detalle para tu gran día.',
    tipoEvento: 'xv_anos',
    icono: Crown,
    color: 'from-purple-500 to-fuchsia-500',
    bgGradient: 'from-purple-50 via-white to-fuchsia-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950',
  },
  bautizos: {
    titulo: 'Invitaciones de Bautizo',
    subtitulo: 'Invitaciones tiernas para la bienvenida de tu bebé',
    descripcion: 'Diseños delicados y amorosos para celebrar el bautizo. Colores suaves, ilustraciones tiernas y tipografías elegantes.',
    tipoEvento: 'bautizo',
    icono: Baby,
    color: 'from-blue-400 to-cyan-400',
    bgGradient: 'from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950',
  },
  cumpleanos: {
    titulo: 'Invitaciones de Cumpleaños',
    subtitulo: 'Diseños divertidos y creativos para cualquier edad',
    descripcion: 'Desde fiestas infantiles hasta celebraciones elegantes. Encuentra el diseño perfecto para la celebración de cumpleaños.',
    tipoEvento: 'cumpleanos',
    icono: Cake,
    color: 'from-amber-400 to-orange-500',
    bgGradient: 'from-amber-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950',
  },
};

export default function TipoEventoPage() {
  const location = useLocation();
  const slug = location.pathname.split('/').pop();
  const config = TIPOS_CONFIG[slug] || TIPOS_CONFIG.bodas;
  const Icon = config.icono;

  const { data: plantillasData, isLoading } = usePlantillasPublicas({
    tipo_evento: config.tipoEvento,
    activo: true,
  });
  const plantillas = useMemo(() => plantillasData?.plantillas || [], [plantillasData]);

  return (
    <InvitacionesPublicLayout>
      {/* Hero */}
      <section className={`relative py-16 lg:py-24 bg-gradient-to-br ${config.bgGradient}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${config.color} text-white mb-6`}>
            <Icon className="w-8 h-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {config.titulo}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            {config.descripcion}
          </p>
          <Link
            to="/invitaciones/crear"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/25"
          >
            Crear mi invitación de {config.titulo.split(' de ')[1]?.toLowerCase() || 'evento'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Grid de plantillas */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Plantillas de {config.titulo.split(' de ')[1] || 'eventos'}
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto" />
            </div>
          ) : plantillas.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Estamos preparando plantillas para esta categoría.
              </p>
              <Link
                to="/invitaciones/ejemplos"
                className="text-pink-600 dark:text-pink-400 font-medium hover:underline"
              >
                Ver todas las plantillas disponibles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {plantillas.map((p) => (
                <Link
                  key={p.id}
                  to={`/invitaciones/crear?plantilla=${p.id}`}
                  className="group"
                >
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3 shadow-sm group-hover:shadow-lg transition-shadow">
                    <PlantillaPreviewImage plantilla={p} className="group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{p.nombre}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{p.descripcion}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </InvitacionesPublicLayout>
  );
}
