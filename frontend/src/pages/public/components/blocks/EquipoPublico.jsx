/**
 * EquipoPublico - Renderiza bloque de equipo/profesionales en sitio público
 * Soporta origen manual o desde ERP (profesionales del sistema)
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function EquipoPublico({ contenido, tema, slug }) {
  const {
    titulo_seccion = 'Nuestro Equipo',
    subtitulo_seccion = '',
    items = [],
    miembros: miembrosLegacy = [],
    origen = 'manual',
    filtro_profesionales = {},
    columnas = 4,
    mostrar_redes = true,
  } = contenido;

  // Compatibilidad con nombres antiguos
  const titulo = contenido.titulo || titulo_seccion;
  const subtitulo = contenido.subtitulo || subtitulo_seccion;

  // Construir query params para filtros ERP
  const queryParams = useMemo(() => {
    if (origen !== 'profesionales') return '';

    const params = new URLSearchParams();
    const { modo = 'todos', departamento_ids = [], profesional_ids = [] } = filtro_profesionales;

    if (modo === 'departamento' && departamento_ids.length > 0) {
      params.set('departamentos', departamento_ids.join(','));
    }
    if (modo === 'seleccion' && profesional_ids.length > 0) {
      params.set('ids', profesional_ids.join(','));
    }

    return params.toString() ? `?${params.toString()}` : '';
  }, [origen, filtro_profesionales]);

  // Cargar profesionales del sistema si origen es "profesionales"
  const { data: profesionalesSistema } = useQuery({
    queryKey: ['profesionales-publicos', slug, queryParams],
    queryFn: async () => {
      const url = `/api/v1/public/sitio/${slug}/profesionales${queryParams}`;
      const response = await axios.get(url);
      return response.data.data?.profesionales || [];
    },
    enabled: origen === 'profesionales' && !!slug,
    staleTime: 1000 * 60 * 5,
  });

  // Usar profesionales del sistema o manuales según el origen
  const miembros = useMemo(() => {
    if (origen === 'profesionales') {
      return (profesionalesSistema || []).map(p => ({
        nombre: p.nombre_completo,
        cargo: p.puesto_nombre || 'Profesional',
        descripcion: p.biografia,
        foto: p.foto_url,
        redes: {},
      }));
    }
    // Modo manual - usar items o miembros legacy
    return items.length > 0 ? items : miembrosLegacy;
  }, [origen, items, miembrosLegacy, profesionalesSistema]);

  const columnasClases = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  // Si no hay miembros y es origen profesionales, no renderizar
  if (miembros.length === 0 && origen === 'profesionales') {
    return null;
  }

  // Si no hay miembros en modo manual, mostrar placeholders
  if (miembros.length === 0) {
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

        {/* Grid de miembros */}
        <div className={`grid grid-cols-1 gap-8 ${columnasClases[columnas] || columnasClases[4]}`}>
          {miembros.map((miembro, index) => (
            <div
              key={index}
              className="text-center group"
            >
              {/* Foto */}
              <div className="relative mb-4 overflow-hidden rounded-xl">
                {(miembro.foto || miembro.foto_url) ? (
                  <img
                    src={miembro.foto || miembro.foto_url}
                    alt={miembro.nombre}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div
                    className="w-full aspect-square flex items-center justify-center text-6xl font-bold text-white"
                    style={{ backgroundColor: 'var(--color-primario)' }}
                  >
                    {miembro.nombre?.charAt(0) || '?'}
                  </div>
                )}
              </div>

              {/* Info */}
              <h3
                className="text-lg font-semibold mb-1"
                style={{ color: 'var(--color-texto)' }}
              >
                {miembro.nombre}
              </h3>

              {miembro.cargo && (
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: 'var(--color-primario)' }}
                >
                  {miembro.cargo}
                </p>
              )}

              {miembro.descripcion && (
                <p className="text-gray-600 text-sm">
                  {miembro.descripcion}
                </p>
              )}

              {/* Redes sociales */}
              {mostrar_redes && miembro.redes && Object.keys(miembro.redes).length > 0 && (
                <div className="flex justify-center gap-3 mt-4">
                  {Object.entries(miembro.redes).map(([red, url]) => {
                    if (!url) return null;
                    return (
                      <a
                        key={red}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {red}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
