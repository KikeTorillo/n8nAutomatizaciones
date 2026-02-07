import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import * as LucideIcons from 'lucide-react';
import { queryKeys } from '@/hooks/config';

/**
 * ServiciosPublico - Renderiza bloque de servicios en sitio público
 * Soporta origen manual o desde ERP (sistema)
 */
export default function ServiciosPublico({ contenido, tema, slug }) {
  const {
    titulo_seccion = 'Nuestros Servicios',
    subtitulo_seccion = '',
    items = [],
    origen = 'manual',
    filtro_erp = {},
    columnas = 3,
    mostrar_precio = true,
    mostrar_duracion = false,
  } = contenido;

  // Compatibilidad con nombre antiguo "titulo" y "subtitulo"
  const titulo = contenido.titulo || titulo_seccion;
  const subtitulo = contenido.subtitulo || subtitulo_seccion;

  // Construir query params para filtros ERP
  const queryParams = useMemo(() => {
    if (origen !== 'sistema' && origen !== 'erp') return '';

    const params = new URLSearchParams();
    const { modo = 'todos', categorias = [], servicio_ids = [] } = filtro_erp;

    if (modo === 'categoria' && categorias.length > 0) {
      params.set('categorias', categorias.join(','));
    }
    if (modo === 'seleccion' && servicio_ids.length > 0) {
      params.set('ids', servicio_ids.join(','));
    }

    return params.toString() ? `?${params.toString()}` : '';
  }, [origen, filtro_erp]);

  // Cargar servicios del sistema si origen es "sistema" o "erp"
  const { data: serviciosSistema } = useQuery({
    queryKey: queryKeys.publico.servicios(slug, queryParams),
    queryFn: async () => {
      const url = `/api/v1/public/sitio/${slug}/servicios${queryParams}`;
      const response = await axios.get(url);
      return response.data.data?.servicios || [];
    },
    enabled: (origen === 'sistema' || origen === 'erp') && !!slug,
    staleTime: 1000 * 60 * 5,
  });

  // Usar servicios del sistema o manuales segun el origen
  const servicios = (origen === 'sistema' || origen === 'erp')
    ? (serviciosSistema || [])
    : items;

  const columnasClases = {
    '2': 'md:grid-cols-2',
    '3': 'md:grid-cols-3',
    '4': 'md:grid-cols-2 lg:grid-cols-4',
  };
  const colKey = String(columnas);

  // Si no hay servicios, no renderizar nada
  if (servicios.length === 0 && (origen === 'sistema' || origen === 'erp')) {
    return null;
  }

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
        <div className={`grid grid-cols-1 gap-8 ${columnasClases[colKey] || columnasClases['3']}`}>
          {servicios.map((servicio, index) => (
            <div
              key={servicio.id || index}
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
                  {mostrar_precio && servicio.precio > 0 && (
                    <p
                      className="text-xl font-bold"
                      style={{ color: 'var(--color-primario)' }}
                    >
                      ${typeof servicio.precio === 'number'
                        ? servicio.precio.toLocaleString()
                        : parseFloat(servicio.precio || 0).toLocaleString()}
                    </p>
                  )}

                  {mostrar_duracion && servicio.duracion_minutos > 0 && (
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
