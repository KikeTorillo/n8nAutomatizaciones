import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { websiteApi } from '@/services/api/endpoints';
import { Loader2, AlertCircle, Globe } from 'lucide-react';

// Renderizadores de bloques
import HeroPublico from './components/blocks/HeroPublico';
import ServiciosPublico from './components/blocks/ServiciosPublico';
import TestimoniosPublico from './components/blocks/TestimoniosPublico';
import EquipoPublico from './components/blocks/EquipoPublico';
import CtaPublico from './components/blocks/CtaPublico';
import ContactoPublico from './components/blocks/ContactoPublico';
import FooterPublico from './components/blocks/FooterPublico';
import TextoPublico from './components/blocks/TextoPublico';
import GaleriaPublico from './components/blocks/GaleriaPublico';
import VideoPublico from './components/blocks/VideoPublico';
import SeparadorPublico from './components/blocks/SeparadorPublico';

/**
 * Mapa de renderizadores por tipo de bloque
 */
const RENDERIZADORES = {
  hero: HeroPublico,
  servicios: ServiciosPublico,
  testimonios: TestimoniosPublico,
  equipo: EquipoPublico,
  cta: CtaPublico,
  contacto: ContactoPublico,
  footer: FooterPublico,
  texto: TextoPublico,
  galeria: GaleriaPublico,
  video: VideoPublico,
  separador: SeparadorPublico,
};

/**
 * SitioPublicoPage - Renderiza un sitio web público
 */
export default function SitioPublicoPage() {
  const { slug, pagina } = useParams();

  // Query para obtener el sitio o página específica
  const { data, isLoading, error } = useQuery({
    queryKey: ['sitio-publico', slug, pagina],
    queryFn: async () => {
      const response = pagina
        ? await websiteApi.obtenerPaginaPublica(slug, pagina)
        : await websiteApi.obtenerSitioPublico(slug);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // Estado de carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando sitio...</p>
        </div>
      </div>
    );
  }

  // Error o sitio no encontrado
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sitio no encontrado
          </h1>
          <p className="text-gray-500">
            El sitio que buscas no existe o no está publicado.
          </p>
        </div>
      </div>
    );
  }

  // Mapear estructura del backend
  const { config, menu: paginas, pagina_inicio } = data;
  const paginaActual = pagina_inicio;
  const bloques = pagina_inicio?.bloques || [];

  // Construir objeto tema desde config
  const tema = {
    colorPrimario: config?.color_primario,
    colorSecundario: config?.color_secundario,
    colorFondo: config?.color_fondo,
    colorTexto: config?.color_texto,
    fuenteTitulos: config?.fuente_titulos,
    fuenteCuerpo: config?.fuente_cuerpo,
  };

  // Aplicar CSS variables del tema
  const estilosTema = {
    '--color-primario': tema.colorPrimario || '#4F46E5',
    '--color-secundario': tema.colorSecundario || '#10B981',
    '--color-fondo': tema.colorFondo || '#FFFFFF',
    '--color-texto': tema.colorTexto || '#1F2937',
    '--font-titulos': tema.fuenteTitulos || 'Inter',
    '--font-cuerpo': tema.fuenteCuerpo || 'Inter',
  };

  return (
    <div
      className="min-h-screen"
      style={estilosTema}
    >
      {/* Navegación */}
      {paginas && paginas.length > 1 && (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                {config?.logo_url ? (
                  <img
                    src={config.logo_url}
                    alt={config.nombre_sitio}
                    className="h-8 w-auto"
                  />
                ) : (
                  <Globe className="w-6 h-6" style={{ color: 'var(--color-primario)' }} />
                )}
                <span className="font-semibold text-gray-900">
                  {config?.nombre_sitio || 'Mi Sitio'}
                </span>
              </div>

              <div className="flex items-center gap-6">
                {paginas
                  .filter(p => p.visible_menu)
                  .map(p => (
                    <a
                      key={p.id}
                      href={`/sitio/${slug}${p.slug === 'inicio' ? '' : `/${p.slug}`}`}
                      className={`text-sm font-medium transition-colors ${
                        paginaActual?.id === p.id
                          ? 'text-indigo-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      style={paginaActual?.id === p.id ? { color: 'var(--color-primario)' } : {}}
                    >
                      {p.titulo}
                    </a>
                  ))}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Contenido - Bloques */}
      <main>
        {bloques && bloques.length > 0 ? (
          bloques.map((bloque) => {
            const Renderizador = RENDERIZADORES[bloque.tipo];

            if (!Renderizador) {
              console.warn(`Renderizador no encontrado para tipo: ${bloque.tipo}`);
              return null;
            }

            return (
              <Renderizador
                key={bloque.id}
                contenido={bloque.contenido || {}}
                estilos={bloque.estilos || {}}
                tema={tema}
                slug={slug}
              />
            );
          })
        ) : (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>Esta página está vacía</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
