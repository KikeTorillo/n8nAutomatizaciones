/**
 * CTARegistro — CTA final "Empieza gratis" con botón de registro
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';

export default function CTARegistro() {
  return (
    <section className="py-20 bg-gradient-to-br from-pink-500 to-rose-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Heart className="w-12 h-12 text-white/80 mx-auto mb-6" />
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Haz tu evento inolvidable
        </h2>
        <p className="text-lg text-pink-100 mb-8 max-w-2xl mx-auto">
          Únete a miles de personas que ya crearon sus invitaciones digitales con Nexo. Empieza gratis, sin tarjeta de crédito.
        </p>
        <Link
          to="/invitaciones/crear"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-pink-600 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
        >
          Crear mi invitación gratis
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
