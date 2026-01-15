/**
 * ====================================================================
 * PAGINA - PANTALLA DEL CLIENTE (CUSTOMER DISPLAY)
 * ====================================================================
 *
 * Pantalla secundaria para mostrar al cliente durante la venta:
 * - Estado de espera con logo y mensaje de bienvenida
 * - Carrito en tiempo real sincronizado vía BroadcastChannel
 * - Estado de pago en proceso
 * - Mensaje de agradecimiento con puntos ganados
 *
 * Uso: Abrir en segunda pantalla/tablet apuntando a /pos/display
 *
 * Ene 2026 - Fase 3 POS
 * ====================================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, CreditCard, CheckCircle, Star, Gift, Maximize, Minimize } from 'lucide-react';
import { usePOSReceiver, POS_MESSAGE_TYPES } from '@/hooks/usePOSBroadcast';

// Key para localStorage
const DISPLAY_STATE_KEY = 'nexo-pos-display-state';

/**
 * Formatea precio en MXN
 */
function formatPrice(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value || 0);
}

/**
 * Componente de estado Idle (esperando)
 */
function IdleState({ organizacion, message }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 text-white p-8">
      {/* Logo */}
      {organizacion?.logo ? (
        <img
          src={organizacion.logo}
          alt={organizacion.nombre}
          className="w-40 h-40 object-contain mb-8 drop-shadow-xl"
        />
      ) : (
        <div className="w-40 h-40 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
          <ShoppingCart className="w-20 h-20 text-white/80" />
        </div>
      )}

      {/* Nombre del negocio */}
      <h1 className="text-4xl font-bold mb-4 text-center">
        {organizacion?.nombre_comercial || organizacion?.nombre || 'Bienvenido'}
      </h1>

      {/* Mensaje */}
      <p className="text-xl text-white/80 text-center max-w-md">
        {message || 'Gracias por su preferencia'}
      </p>

      {/* Animación de espera */}
      <div className="flex gap-2 mt-12">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 bg-white/60 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Componente de carrito
 */
function CartState({ cart, organizacion }) {
  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const descuentos = cart?.descuentos || 0;
  const total = cart?.total || 0;
  const puntosGanados = cart?.puntos_ganados || 0;
  const clienteNombre = cart?.cliente_nombre;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            {organizacion?.logo ? (
              <img
                src={organizacion.logo}
                alt=""
                className="w-10 h-10 object-contain"
              />
            ) : (
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary-600" />
              </div>
            )}
            <span className="font-semibold text-gray-900 dark:text-white">
              {organizacion?.nombre_comercial || 'Punto de Venta'}
            </span>
          </div>
          {clienteNombre && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Cliente: <span className="font-medium">{clienteNombre}</span>
            </div>
          )}
        </div>
      </header>

      {/* Lista de items */}
      <main className="flex-1 p-4 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Tu compra
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {items.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay productos en el carrito
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((item, index) => (
                  <li
                    key={item.id || index}
                    className="p-4 flex items-center justify-between animate-in slide-in-from-right duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.nombre}
                      </p>
                      {item.descripcion && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        x{item.cantidad}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white w-24 text-right">
                        {formatPrice(item.subtotal || item.precio_unitario * item.cantidad)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Footer con totales */}
      <footer className="bg-white dark:bg-gray-800 shadow-lg p-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          {/* Descuentos */}
          {descuentos > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span className="flex items-center gap-1">
                <Gift className="w-4 h-4" />
                Descuentos
              </span>
              <span>-{formatPrice(descuentos)}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between text-2xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
            <span>Total a pagar</span>
            <span className="text-primary-600 dark:text-primary-400">
              {formatPrice(total)}
            </span>
          </div>

          {/* Puntos que ganará */}
          {puntosGanados > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mt-4">
              <Star className="w-5 h-5" />
              <span>Ganarás <strong>{puntosGanados.toLocaleString()}</strong> puntos con esta compra</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

/**
 * Componente de pago en proceso
 */
function PaymentState({ payment, organizacion }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col items-center justify-center text-white p-8">
      <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
        <CreditCard className="w-12 h-12" />
      </div>

      <h1 className="text-3xl font-bold mb-4 text-center">
        Procesando pago
      </h1>

      <p className="text-xl text-white/80 text-center">
        Por favor espere...
      </p>

      {payment?.total && (
        <div className="mt-8 text-4xl font-bold">
          {formatPrice(payment.total)}
        </div>
      )}

      {/* Animación de loading */}
      <div className="mt-12">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    </div>
  );
}

/**
 * Componente de venta completada
 */
function CompleteState({ result, organizacion }) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex flex-col items-center justify-center text-white p-8 relative overflow-hidden">
      {/* Confetti animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][
                  Math.floor(Math.random() * 5)
                ],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Checkmark */}
      <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl animate-in zoom-in duration-500">
        <CheckCircle className="w-16 h-16 text-green-600" />
      </div>

      <h1 className="text-4xl font-bold mb-4 text-center animate-in slide-in-from-bottom duration-500">
        ¡Gracias por su compra!
      </h1>

      {result?.folio && (
        <p className="text-xl text-white/80 mb-2">
          Folio: <span className="font-mono font-bold">{result.folio}</span>
        </p>
      )}

      {result?.total && (
        <p className="text-3xl font-bold mb-6">
          {formatPrice(result.total)}
        </p>
      )}

      {/* Puntos ganados */}
      {result?.puntos_ganados > 0 && (
        <div className="bg-white/10 rounded-xl p-6 mt-4 text-center animate-in slide-in-from-bottom duration-700 delay-300">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-8 h-8 text-amber-400" />
            <span className="text-3xl font-bold text-amber-400">
              +{result.puntos_ganados.toLocaleString()}
            </span>
          </div>
          <p className="text-white/80">puntos acumulados</p>
          {result?.total_puntos && (
            <p className="text-sm text-white/60 mt-2">
              Saldo total: {result.total_puntos.toLocaleString()} pts
            </p>
          )}
        </div>
      )}

      <p className="text-xl text-white/70 mt-8">
        {organizacion?.mensaje_despedida || 'Vuelva pronto'}
      </p>
    </div>
  );
}

/**
 * Página principal de Customer Display
 */
export default function CustomerDisplayPage() {
  const { displayState, organizacion, isConnected } = usePOSReceiver();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Persistir estado en localStorage para sobrevivir refresh
  useEffect(() => {
    if (displayState.type !== 'idle') {
      localStorage.setItem(DISPLAY_STATE_KEY, JSON.stringify({
        displayState,
        organizacion,
        timestamp: Date.now()
      }));
    }
  }, [displayState, organizacion]);

  // Restaurar estado de localStorage al montar (si hay datos recientes < 5 min)
  useEffect(() => {
    const saved = localStorage.getItem(DISPLAY_STATE_KEY);
    if (saved) {
      try {
        const { timestamp } = JSON.parse(saved);
        const fiveMinutes = 5 * 60 * 1000;
        // Solo limpiar si es muy viejo, el hook usePOSReceiver maneja el estado real
        if (Date.now() - timestamp > fiveMinutes) {
          localStorage.removeItem(DISPLAY_STATE_KEY);
        }
      } catch {
        localStorage.removeItem(DISPLAY_STATE_KEY);
      }
    }
  }, []);

  // Limpiar localStorage cuando vuelve a idle
  useEffect(() => {
    if (displayState.type === 'idle') {
      localStorage.removeItem(DISPLAY_STATE_KEY);
    }
  }, [displayState.type]);

  // Detectar cambios en fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Ocultar controles después de 3 segundos de inactividad
  useEffect(() => {
    setShowControls(true);
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [displayState]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  }, []);

  // Mostrar controles al mover mouse
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
  }, []);

  // Renderizar según estado
  const renderContent = () => {
    switch (displayState.type) {
      case 'cart':
        return <CartState cart={displayState.cart} organizacion={organizacion} />;

      case 'payment':
        return <PaymentState payment={displayState.payment} organizacion={organizacion} />;

      case 'complete':
        return <CompleteState result={displayState.result} organizacion={organizacion} />;

      case 'idle':
      default:
        return <IdleState organizacion={organizacion} message={displayState.message} />;
    }
  };

  return (
    <div className="customer-display" onMouseMove={handleMouseMove}>
      {renderContent()}

      {/* Botón de fullscreen */}
      <button
        onClick={toggleFullscreen}
        className={`fixed top-4 right-4 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      >
        {isFullscreen ? (
          <Minimize className="w-6 h-6" />
        ) : (
          <Maximize className="w-6 h-6" />
        )}
      </button>

      {/* Indicador de conexión */}
      <div
        className={`fixed bottom-4 right-4 px-3 py-1 rounded-full text-xs font-medium transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        } ${
          isConnected
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white animate-pulse'
        }`}
      >
        {isConnected ? 'Conectado' : 'Desconectado'}
      </div>

      {/* Estilos para animaciones */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}
