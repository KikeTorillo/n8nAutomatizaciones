import { useNavigate } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import EstrellaRating from './EstrellaRating';

/**
 * Tarjeta de negocio para el grid del directorio
 * Muestra información básica y redirige al perfil público al hacer clic
 *
 * @param {Object} perfil - Datos del perfil del negocio
 * @param {string} perfil.slug - Slug único del perfil
 * @param {string} perfil.nombre_comercial - Nombre del negocio
 * @param {string} perfil.ciudad - Ciudad
 * @param {string} perfil.categoria - Categoría del negocio
 * @param {string} perfil.descripcion_corta - Descripción breve
 * @param {string} perfil.logo_url - URL del logo
 * @param {string} perfil.foto_portada - URL de foto de portada
 * @param {number} perfil.rating_promedio - Rating promedio
 * @param {number} perfil.total_resenas - Total de reseñas
 * @param {string} className - Clases adicionales
 *
 * @example
 * <NegocioCard perfil={negocio} />
 */
function NegocioCard({ perfil, className }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/${perfil.slug}`);
  };

  // Imagen: priorizar foto_portada, luego logo, luego placeholder
  const imagenUrl = perfil.foto_portada || perfil.logo_url;

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group bg-white rounded-lg shadow-md hover:shadow-xl',
        'transition-all duration-300 cursor-pointer overflow-hidden',
        'border border-gray-200 hover:border-primary-400',
        className
      )}
    >
      {/* Imagen de portada */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {imagenUrl ? (
          <img
            src={imagenUrl}
            alt={perfil.nombre_comercial}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          // Placeholder si no hay imagen
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
            <Star className="w-16 h-16 text-primary-400" />
          </div>
        )}

        {/* Badge de categoría */}
        {perfil.categoria && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm">
              {perfil.categoria}
            </span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        {/* Nombre del negocio */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {perfil.nombre_comercial}
        </h3>

        {/* Rating */}
        {perfil.rating_promedio > 0 && (
          <div className="mb-3">
            <EstrellaRating
              rating={perfil.rating_promedio}
              size="sm"
              showValue
              totalReviews={perfil.total_resenas}
            />
          </div>
        )}

        {/* Ciudad */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="truncate">{perfil.ciudad}</span>
        </div>

        {/* Descripción corta */}
        {perfil.descripcion_corta && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {perfil.descripcion_corta}
          </p>
        )}
      </div>

      {/* Footer con CTA */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
        <button
          className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700 py-2 rounded-md hover:bg-primary-50 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          Ver perfil →
        </button>
      </div>
    </div>
  );
}

export default NegocioCard;
