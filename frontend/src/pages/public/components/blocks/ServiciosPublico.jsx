import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import * as LucideIcons from 'lucide-react';

/**
 * ServiciosPublico - Renderiza bloque de servicios en sitio público
 */
export default function ServiciosPublico({ contenido, tema, slug }) {
  const {
    titulo = 'Nuestros Servicios',
    subtitulo = '',
    items = [],
    origen = 'manual',
    columnas = 3,
  } = contenido;

  // Cargar servicios del sistema si origen es "sistema"
  const { data: serviciosSistema } = useQuery({
    queryKey: ['servicios-publicos', slug],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/public/sitio/${slug}/servicios`);
      return response.data.data?.servicios || [];
    },
    enabled: origen === 'sistema' && !!slug,
    staleTime: 1000 * 60 * 5,
  });

  // Usar servicios del sistema o manuales según el origen
  const servicios = origen === 'sistema' ? (serviciosSistema || []) : items;

  const columnasClases = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-12">
          {subtitulo && (
            <span
              className="text-sm font-medium uppercase tracking-wider mb-2 block"
              style={{ color: 'var(--color-primario)' }}
            >
              {subtitulo}
            </span>
          )}
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{ color: 'var(--color-texto)', fontFamily: 'var(--font-titulos)' }}
          >
            {titulo}
          </h2>
        </div>

        {/* Grid de servicios */}
        <div className={`grid grid-cols-1 gap-8 ${columnasClases[columnas] || columnasClases[3]}`}>
          {servicios.map((servicio, index) => (
            <div
              key={index}
              className="group rounded-xl border border-gray-200 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden bg-white"
            >
              {/* Imagen del servicio */}
              {servicio.imagen_url ? (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={servicio.imagen_url}
                    alt={servicio.nombre || servicio.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : servicio.icono ? (
                (() => {
                  const IconComponent = LucideIcons[servicio.icono] || LucideIcons.Star;
                  return (
                    <div
                      className="h-48 flex items-center justify-center"
                      style={{ backgroundColor: `var(--color-primario)15`, color: 'var(--color-primario)' }}
                    >
                      <IconComponent size={64} />
                    </div>
                  );
                })()
              ) : (
                <div
                  className="h-48 flex items-center justify-center"
                  style={{ backgroundColor: `var(--color-primario)15` }}
                >
                  <span className="text-6xl font-bold opacity-20" style={{ color: 'var(--color-primario)' }}>
                    {(servicio.nombre || servicio.titulo || 'S').charAt(0)}
                  </span>
                </div>
              )}

              {/* Contenido */}
              <div className="p-6">
                <h3
                  className="text-xl font-semibold mb-2"
                  style={{ color: 'var(--color-texto)' }}
                >
                  {servicio.nombre || servicio.titulo}
                </h3>

                {servicio.descripcion && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {servicio.descripcion}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  {servicio.precio && (
                    <p
                      className="text-xl font-bold"
                      style={{ color: 'var(--color-primario)' }}
                    >
                      ${typeof servicio.precio === 'number'
                        ? servicio.precio.toLocaleString()
                        : parseFloat(servicio.precio).toLocaleString()}
                    </p>
                  )}

                  {servicio.duracion_minutos && (
                    <span className="text-sm text-gray-500">
                      {servicio.duracion_minutos} min
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
