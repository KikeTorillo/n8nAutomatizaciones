import { useState } from 'react';
import { useMiPerfilMarketplace } from '@/hooks/useMarketplace';
import { Button } from '@/components/ui';
import { Store, TrendingUp, Users, MapPin, X } from 'lucide-react';
import CrearPerfilMarketplaceModal from '@/components/marketplace/CrearPerfilMarketplaceModal';

/**
 * Card de activación del marketplace
 * Se muestra solo si el negocio NO tiene perfil de marketplace
 */
function MarketplaceActivationCard() {
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Verificar si ya tiene perfil de marketplace
  const { data: perfil, isLoading } = useMiPerfilMarketplace();

  // Si está cargando, no mostrar nada
  if (isLoading) {
    return null;
  }

  // Si ya tiene perfil o fue descartado, no mostrar
  if (perfil || dismissed) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 mb-6 relative overflow-hidden">
        {/* Botón de cerrar */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Patrón decorativo de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        {/* Contenido */}
        <div className="relative">
          <div className="flex items-start gap-4">
            {/* Icono */}
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>

            {/* Texto */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                ¡Expande tu Negocio con el Marketplace!
              </h3>
              <p className="text-white/90 mb-4">
                Aparece en el directorio público y atrae nuevos clientes automáticamente.
                Configura tu perfil en minutos.
              </p>

              {/* Beneficios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-white/90">
                  <TrendingUp className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">Mayor visibilidad online</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <Users className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">Capta nuevos clientes</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">Geolocalización automática</span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowModal(true)}
                  className="bg-white text-primary-700 hover:bg-gray-50"
                >
                  <Store className="w-4 h-4 mr-2" />
                  Activar Marketplace
                </Button>
                <button
                  onClick={() => setDismissed(true)}
                  className="text-sm text-white/80 hover:text-white underline"
                >
                  Más tarde
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de creación */}
      {showModal && (
        <CrearPerfilMarketplaceModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default MarketplaceActivationCard;
