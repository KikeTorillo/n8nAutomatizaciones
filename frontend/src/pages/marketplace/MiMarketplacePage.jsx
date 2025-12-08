import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, FileText, BarChart3, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/ui/Button';
import { useMiPerfilMarketplace } from '@/hooks/useMarketplace';
import PerfilFormulario from '@/components/marketplace/PerfilFormulario';
import ListaReseñas from '@/components/marketplace/ListaReseñas';
import AnalyticsDashboard from '@/components/marketplace/AnalyticsDashboard';
import CrearPerfilMarketplaceModal from '@/components/marketplace/CrearPerfilMarketplaceModal';

/**
 * Página de gestión del perfil de marketplace
 * Ruta: /mi-marketplace
 * Requiere autenticación: admin o propietario
 */
function MiMarketplacePage() {
  const navigate = useNavigate();
  const [tabActivo, setTabActivo] = useState('perfil');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);

  // Fetch del perfil del negocio
  const { data: perfil, isLoading, error } = useMiPerfilMarketplace();

  // Tabs disponibles
  const tabs = [
    { id: 'perfil', label: 'Mi Perfil', icon: Store },
    { id: 'resenas', label: 'Reseñas', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  // Estado de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Si no tiene perfil, mostrar mensaje para crear uno
  if (!perfil) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/home')}
            className="text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al Inicio
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Mi Marketplace</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona tu perfil público en el directorio
          </p>
        </div>

        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Aún no tienes un perfil de marketplace
            </h2>
            <p className="text-gray-600 mb-6">
              Crea tu perfil público para aparecer en el directorio y captar nuevos clientes
            </p>
            <Button size="lg" onClick={() => setMostrarModalCrear(true)}>
              Crear Perfil de Marketplace
            </Button>
          </div>
        </div>

        {/* Modal de creación de perfil */}
        <CrearPerfilMarketplaceModal
          isOpen={mostrarModalCrear}
          onClose={() => setMostrarModalCrear(false)}
        />
      </div>
    );
  }

  // Error al cargar
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">Error al cargar el perfil. Intenta nuevamente.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/home')}
                className="text-gray-600 hover:text-gray-900 mb-3"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver al Inicio
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Mi Marketplace</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona tu perfil público, reseñas y estadísticas
              </p>
            </div>

            {/* Badge de estado */}
            <div className="flex items-center gap-3">
              {perfil.activo ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ✓ Perfil Activo
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  ⏳ Pendiente de Activación
                </span>
              )}

              {perfil.slug && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/${perfil.slug}`, '_blank')}
                >
                  Ver Perfil Público →
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabActivo(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm
                    transition-colors whitespace-nowrap
                    ${
                      tabActivo === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab: Perfil */}
        {tabActivo === 'perfil' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Información del Perfil</h2>
              <p className="text-sm text-gray-600 mt-1">
                Actualiza la información pública de tu negocio
              </p>
            </div>
            <PerfilFormulario perfil={perfil} />
          </div>
        )}

        {/* Tab: Reseñas */}
        {tabActivo === 'resenas' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Reseñas</h2>
              <div className="flex items-center gap-6 mt-2">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {perfil.total_resenas || 0}
                  </span>{' '}
                  reseñas totales
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {perfil.rating_promedio ? perfil.rating_promedio.toFixed(1) : '0.0'}
                  </span>
                  /5 rating promedio
                </p>
              </div>
            </div>
            <ListaReseñas organizacionId={perfil.organizacion_id} />
          </div>
        )}

        {/* Tab: Analytics */}
        {tabActivo === 'analytics' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
              <p className="text-sm text-gray-600 mt-1">
                Métricas de visibilidad y conversión de tu perfil público
              </p>
            </div>
            <AnalyticsDashboard perfilId={perfil.id} />
          </div>
        )}
      </div>
    </div>
  );
}

export default MiMarketplacePage;
