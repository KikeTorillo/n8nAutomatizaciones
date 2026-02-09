/**
 * HeroSection — Banner principal con CTA y visual de invitación
 */
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-20 lg:py-28">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-200/30 dark:bg-pink-800/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-200/30 dark:bg-rose-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Invitaciones digitales para cada momento especial
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
            Crea invitaciones{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
              hermosas
            </span>{' '}
            en minutos
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Personaliza tu invitación, compártela por WhatsApp y gestiona confirmaciones.
            Bodas, XV años, bautizos, cumpleaños y más.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/invitaciones/crear"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/25"
            >
              Crear mi invitación gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/invitaciones/ejemplos"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Ver ejemplos
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Sin tarjeta de crédito. Crea tu primera invitación en 5 minutos.
          </p>
        </div>
      </div>
    </section>
  );
}
