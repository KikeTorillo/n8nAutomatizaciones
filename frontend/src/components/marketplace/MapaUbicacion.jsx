import { MapPin } from 'lucide-react';

/**
 * Componente de mapa embebido con Google Maps
 * Muestra la ubicación del negocio en un iframe
 *
 * @param {string} direccion - Dirección completa del negocio
 * @param {string} ciudad - Ciudad del negocio
 * @param {string} pais - País del negocio
 * @param {string} nombreNegocio - Nombre del negocio (para el título del mapa)
 * @param {string} className - Clases adicionales
 * @param {string} altura - Altura del mapa (default: 300px)
 *
 * @example
 * <MapaUbicacion
 *   direccion="Av. Insurgentes 123"
 *   ciudad="CDMX"
 *   pais="México"
 *   nombreNegocio="Barbería El Corte"
 * />
 */
function MapaUbicacion({
  direccion,
  ciudad,
  pais = 'México',
  nombreNegocio,
  className,
  altura = '300px',
}) {
  // Construir query para Google Maps
  // Formato: "Nombre Negocio, Dirección, Ciudad, País"
  const queryParts = [nombreNegocio, direccion, ciudad, pais]
    .filter(Boolean) // Eliminar valores vacíos
    .join(', ');

  // URL encode para el query
  const encodedQuery = encodeURIComponent(queryParts);

  // URL de Google Maps Embed (no requiere API key)
  // Alternativa: usar iframe de Google Maps con place_id si está disponible
  const mapUrl = `https://www.google.com/maps?q=${encodedQuery}&output=embed`;

  // Fallback si no hay dirección
  if (!direccion && !ciudad) {
    return (
      <div
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${className}`}
        style={{ height: altura }}
      >
        <div className="text-center text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Ubicación no disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Mapa embebido */}
      <div
        className="relative w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm"
        style={{ height: altura }}
      >
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Mapa de ubicación de ${nombreNegocio || 'negocio'}`}
        />
      </div>

      {/* Dirección en texto (debajo del mapa) */}
      {direccion && (
        <div className="mt-3 flex items-start text-sm text-gray-700">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-gray-500" />
          <div>
            <p className="font-medium">{direccion}</p>
            <p className="text-gray-500">
              {ciudad}
              {pais && `, ${pais}`}
            </p>
          </div>
        </div>
      )}

      {/* Enlace "Ver en Google Maps" */}
      <div className="mt-2">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodedQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Ver en Google Maps →
        </a>
      </div>
    </div>
  );
}

export default MapaUbicacion;
