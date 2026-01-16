import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  Calendar,
  Users,
  DollarSign,
  Store,
  MessageCircle,
  Bot,
  Shield,
  Zap,
  Globe,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui';

const modules = [
  {
    icon: ShoppingCart,
    title: 'Punto de Venta',
    description: 'Vende productos y servicios con tickets térmicos, control de caja y reportes en tiempo real.',
    color: 'bg-primary-500'
  },
  {
    icon: Package,
    title: 'Inventario',
    description: 'Control de stock con alertas automáticas, clasificación ABC, kardex y órdenes de compra.',
    color: 'bg-primary-700'
  },
  {
    icon: Calendar,
    title: 'Agendamiento',
    description: 'Gestiona citas, horarios de profesionales, bloqueos y recordatorios automáticos.',
    color: 'bg-primary-600'
  },
  {
    icon: Users,
    title: 'Clientes',
    description: 'Base de datos centralizada de clientes con historial completo de compras y citas.',
    color: 'bg-primary-800'
  },
  {
    icon: DollarSign,
    title: 'Comisiones',
    description: 'Calcula comisiones automáticamente por profesional con reportes detallados.',
    color: 'bg-primary-400'
  },
  {
    icon: Store,
    title: 'Marketplace',
    description: 'Perfil público de tu negocio donde los clientes pueden agendar sin crear cuenta.',
    color: 'bg-primary-500'
  }
];

const benefits = [
  {
    icon: Zap,
    title: 'Rápido de Implementar',
    description: 'Empieza a usar Nexo en minutos, sin configuraciones complicadas.'
  },
  {
    icon: Shield,
    title: 'Datos Seguros',
    description: 'Tu información está protegida con encriptación y aislamiento total.'
  },
  {
    icon: Globe,
    title: '100% en la Nube',
    description: 'Accede desde cualquier lugar, sin instalar nada.'
  },
  {
    icon: Smartphone,
    title: 'Diseño Responsive',
    description: 'Funciona perfectamente en computadora, tablet y celular.'
  }
];

const aiFeatures = [
  'Agenda citas automáticamente desde WhatsApp y Telegram',
  'Responde preguntas frecuentes de tus clientes 24/7',
  'Envía recordatorios de citas automáticos',
  'Permite reagendar y cancelar sin intervención humana',
  'Aprende del contexto de tu negocio'
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Nexo</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#modulos" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Módulos</a>
              <a href="#ia" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">IA Conversacional</a>
              <a href="#beneficios" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Beneficios</a>
            </nav>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                to="/login"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/registro"
                className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Empezar Gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium mb-6">
              <Bot className="w-4 h-4" />
              Con Inteligencia Artificial integrada
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Todo lo que necesitas para{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">
                gestionar tu negocio
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Nexo integra POS, Inventario, Agendamiento, Clientes, Comisiones y Marketplace
              en una sola plataforma. Con chatbots de IA que atienden a tus clientes 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/registro"
                className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-500/25 flex items-center justify-center gap-2"
              >
                Empezar Gratis - 14 días
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 transition-all flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Ver Demo
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Sin tarjeta de crédito • Cancela cuando quieras
            </p>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-700/20 rounded-2xl blur-3xl"></div>
              <div className="relative bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-4 text-gray-400 text-sm">app.nexo.io</span>
                </div>
                <div className="aspect-[16/9] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-3xl">N</span>
                    </div>
                    <p className="text-gray-400">Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modulos" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              6 Módulos, Una Sola Plataforma
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Activa solo lo que necesitas. Todos los módulos están incluidos en tu suscripción.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module, index) => (
              <div
                key={index}
                className="group p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-12 h-12 ${module.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {module.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {module.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section id="ia" className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-full text-sm font-medium mb-6">
                <MessageCircle className="w-4 h-4" />
                Diferenciador Único
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Chatbots con IA que{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-300">
                  trabajan por ti
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Conecta WhatsApp o Telegram y deja que la inteligencia artificial
                atienda a tus clientes, agende citas y responda preguntas automáticamente.
              </p>
              <ul className="space-y-4">
                {aiFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/30 to-primary-700/30 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gray-800 rounded-3xl p-6 border border-gray-700">
                {/* Chat mockup */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className="bg-gray-700 rounded-2xl rounded-tl-none px-4 py-3 max-w-xs">
                      <p className="text-gray-200 text-sm">Hola, quiero agendar un corte para mañana a las 3pm</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-primary-600 rounded-2xl rounded-tr-none px-4 py-3 max-w-xs">
                      <p className="text-white text-sm">¡Hola! Claro, tengo disponible mañana a las 3pm con Carlos. ¿Te lo confirmo?</p>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className="bg-gray-700 rounded-2xl rounded-tl-none px-4 py-3 max-w-xs">
                      <p className="text-gray-200 text-sm">Sí, perfecto!</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-primary-600 rounded-2xl rounded-tr-none px-4 py-3 max-w-xs">
                      <p className="text-white text-sm">Listo, tu cita está confirmada para mañana 15:00 con Carlos. Te enviaré un recordatorio.</p>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2 text-gray-400 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Bot activo 24/7
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Por qué elegir Nexo
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Diseñado para negocios que quieren crecer sin complicaciones técnicas.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Empieza a gestionar tu negocio hoy
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Únete a cientos de negocios que ya simplifican sus operaciones con Nexo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/registro"
              className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              Crear Cuenta Gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Nexo</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} Nexo. Sistema de Gestión Empresarial.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-white transition-colors text-sm">
                Términos
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-white transition-colors text-sm">
                Privacidad
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-white transition-colors text-sm">
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
