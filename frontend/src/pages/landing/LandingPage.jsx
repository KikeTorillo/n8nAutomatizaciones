import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-600">
      <div className="container-custom py-20">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-5xl font-bold mb-6 animate-fade-in">
            Automatiza tu Agendamiento con IA
          </h1>
          <p className="text-xl mb-8 text-white/90 animate-slide-up">
            Gestiona citas, clientes y profesionales desde WhatsApp con
            inteligencia artificial
          </p>

          <div className="flex gap-4 justify-center items-center animate-slide-up">
            <Link
              to="/onboarding"
              className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Empezar Gratis - 14 días de prueba
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>

          <div className="mt-16">
            <p className="text-white/80 mb-4">
              Más de 500 negocios confían en nosotros
            </p>
            <div className="flex justify-center gap-8 items-center">
              <div className="w-24 h-24 bg-white/20 rounded-lg animate-pulse"></div>
              <div className="w-24 h-24 bg-white/20 rounded-lg animate-pulse"></div>
              <div className="w-24 h-24 bg-white/20 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
