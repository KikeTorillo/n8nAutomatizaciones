import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Calendar,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import SEOHead from '@/components/marketplace/SEOHead';
import EstrellaRating from '@/components/marketplace/EstrellaRating';
import ReseñasSection from '@/components/marketplace/ReseñasSection';
import MapaUbicacion from '@/components/marketplace/MapaUbicacion';
import ServicioCard from '@/components/marketplace/ServicioCard';
import ProfesionalCard from '@/components/marketplace/ProfesionalCard';
import { usePerfilPublico, useReseñasNegocio } from '@/hooks/useMarketplace';
import { marketplaceApi } from '@/services/api/endpoints';

/**
 * Página pública del perfil de un negocio
 * Ruta: /:slug
 * No requiere autenticación
 */
function PerfilPublicoPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Estado para tabs
  const [tabActivo, setTabActivo] = useState('informacion');

  // Estado para reseñas
  const [reseñasParams, setReseñasParams] = useState({
    pagina: 1,
    limite: 10,
    orden: 'recientes',
  });

  // Fetch del perfil
  const { data: perfil, isLoading, error } = usePerfilPublico(slug);

  // Fetch de reseñas (solo si tab está activo y perfil cargado)
  const {
    data: reseñasData,
    isLoading: loadingReseñas,
    error: errorReseñas,
  } = useReseñasNegocio(
    perfil?.organizacion_id,
    tabActivo === 'resenas' && perfil?.organizacion_id ? reseñasParams : {}
  );

  // ✅ TRACKING: Vista de perfil (fire-and-forget)
  useEffect(() => {
    if (perfil?.id) {
      marketplaceApi
        .registrarEvento({
          perfil_id: perfil.id,
          tipo_evento: 'vista_perfil',
        })
        .catch(() => {}); // Ignorar errores de tracking
    }
  }, [perfil?.id]);

  // ✅ TRACKING: Clics en contacto
  const handleClickContacto = (tipo) => {
    if (perfil?.id) {
      marketplaceApi
        .registrarEvento({
          perfil_id: perfil.id,
          tipo_evento: `clic_${tipo}`,
        })
        .catch(() => {});
    }
  };

  // ✅ TRACKING: Clic en agendar
  const handleClickAgendar = () => {
    if (perfil?.id) {
      marketplaceApi
        .registrarEvento({
          perfil_id: perfil.id,
          tipo_evento: 'clic_agendar',
        })
        .catch(() => {});
    }

    navigate(`/agendar/${slug}`);
  };

  // Estados de carga/error
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error.response?.status === 404 ? 'Perfil no encontrado' : 'Error al cargar'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error.response?.status === 404
              ? 'El negocio que buscas no existe o ha sido desactivado'
              : 'Hubo un problema al cargar el perfil. Intenta nuevamente.'}
          </p>
          <Button onClick={() => navigate('/marketplace')}>Volver al directorio</Button>
        </div>
      </div>
    );
  }

  // Tabs disponibles
  const tabs = [
    { id: 'informacion', label: 'Información' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'profesionales', label: 'Profesionales' },
    { id: 'resenas', label: `Reseñas (${perfil.total_resenas || 0})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Meta Tags */}
      <SEOHead perfil={perfil} />

      {/* Hero Section - Portada */}
      <section className="relative">
        {/* Foto de portada */}
        <div className="h-64 md:h-80 bg-gradient-to-r from-primary-600 to-primary-700 relative overflow-hidden">
          {perfil.foto_portada ? (
            <img
              src={perfil.foto_portada}
              alt={perfil.nombre_comercial}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700" />
          )}

          {/* Overlay oscuro */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Botón volver */}
          <div className="absolute top-4 left-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/marketplace')}
              className="bg-white/90 backdrop-blur-sm hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>

        {/* Logo + Info básica */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Logo */}
              {perfil.logo_url && (
                <div className="w-32 h-32 bg-white rounded-lg shadow-xl border-4 border-white overflow-hidden flex-shrink-0">
                  <img
                    src={perfil.logo_url}
                    alt={perfil.nombre_comercial}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Info básica */}
              <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {perfil.nombre_comercial}
                    </h1>

                    {/* Rating */}
                    {perfil.rating_promedio > 0 && (
                      <div className="mb-3">
                        <EstrellaRating
                          rating={perfil.rating_promedio}
                          size="lg"
                          showValue
                          totalReviews={perfil.total_resenas}
                        />
                      </div>
                    )}

                    {/* Ubicación y categoría */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {perfil.ciudad}
                      </div>
                      {perfil.categoria && (
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                          {perfil.categoria}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA Agendar */}
                  <Button size="lg" onClick={handleClickAgendar} className="flex-shrink-0">
                    <Calendar className="w-5 h-5 mr-2" />
                    Agendar cita
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabActivo(tab.id)}
                className={`
                  py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                  ${
                    tabActivo === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contenido con Sidebar */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Contenido Principal */}
          <main className="flex-1 min-w-0">
            {/* Tab: Información */}
            {tabActivo === 'informacion' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre nosotros</h2>
                {perfil.descripcion_larga ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {perfil.descripcion_larga}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">No hay descripción disponible</p>
                )}
              </div>
            )}

            {/* Tab: Servicios */}
            {tabActivo === 'servicios' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Servicios</h2>

                {perfil.servicios && perfil.servicios.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {perfil.servicios.map((servicio) => (
                      <ServicioCard key={servicio.id} servicio={servicio} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      Este negocio aún no ha agregado servicios a su perfil
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Profesionales */}
            {tabActivo === 'profesionales' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Nuestro equipo</h2>

                {perfil.profesionales && perfil.profesionales.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {perfil.profesionales.map((profesional) => (
                      <ProfesionalCard key={profesional.id} profesional={profesional} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      Este negocio aún no ha agregado profesionales a su perfil
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Reseñas */}
            {tabActivo === 'resenas' && (
              <ReseñasSection
                slug={slug}
                resenas={reseñasData?.resenas}
                paginacion={reseñasData?.paginacion}
                ratingPromedio={perfil.rating_promedio}
                totalResenas={perfil.total_resenas}
                isLoading={loadingReseñas}
                error={errorReseñas}
                canResponder={false}
                onPageChange={(page) =>
                  setReseñasParams((prev) => ({ ...prev, pagina: page }))
                }
                onOrdenChange={(orden) =>
                  setReseñasParams((prev) => ({ ...prev, orden, pagina: 1 }))
                }
                ordenActual={reseñasParams.orden}
              />
            )}
          </main>

          {/* Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de contacto</h3>

              <div className="space-y-4">
                {/* Teléfono */}
                {perfil.telefono_publico && (
                  <div>
                    <a
                      href={`tel:${perfil.telefono_publico}`}
                      onClick={() => handleClickContacto('telefono')}
                      className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                    >
                      <Phone className="w-5 h-5 mr-3 text-gray-400" />
                      <span>{perfil.telefono_publico}</span>
                    </a>
                  </div>
                )}

                {/* Email */}
                {perfil.email_publico && (
                  <div>
                    <a
                      href={`mailto:${perfil.email_publico}`}
                      onClick={() => handleClickContacto('email')}
                      className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                    >
                      <Mail className="w-5 h-5 mr-3 text-gray-400" />
                      <span className="truncate">{perfil.email_publico}</span>
                    </a>
                  </div>
                )}

                {/* Sitio web */}
                {perfil.sitio_web && (
                  <div>
                    <a
                      href={perfil.sitio_web}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleClickContacto('sitio_web')}
                      className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                    >
                      <Globe className="w-5 h-5 mr-3 text-gray-400" />
                      <span className="truncate">Sitio web</span>
                    </a>
                  </div>
                )}

                {/* Instagram */}
                {perfil.instagram && (
                  <div>
                    <a
                      href={`https://instagram.com/${perfil.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleClickContacto('instagram')}
                      className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                    >
                      <Instagram className="w-5 h-5 mr-3 text-gray-400" />
                      <span>{perfil.instagram}</span>
                    </a>
                  </div>
                )}

                {/* Facebook */}
                {perfil.facebook && (
                  <div>
                    <a
                      href={perfil.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleClickContacto('facebook')}
                      className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                    >
                      <Facebook className="w-5 h-5 mr-3 text-gray-400" />
                      <span>Facebook</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Mapa */}
              {perfil.ciudad && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Ubicación</h4>
                  <MapaUbicacion
                    direccion={perfil.direccion}
                    ciudad={perfil.ciudad}
                    pais={perfil.pais}
                    nombreNegocio={perfil.nombre_comercial}
                    altura="200px"
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default PerfilPublicoPage;
