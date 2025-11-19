import { Helmet } from 'react-helmet-async';

/**
 * Componente para meta tags SEO dinámicos
 * Incluye: Basic Meta Tags, Open Graph, Twitter Cards, Schema.org JSON-LD
 *
 * @param {Object} perfil - Datos del perfil del marketplace
 * @param {string} perfil.meta_titulo - Título optimizado para SEO (opcional)
 * @param {string} perfil.nombre_comercial - Nombre del negocio
 * @param {string} perfil.ciudad - Ciudad del negocio
 * @param {string} perfil.slug - Slug único del perfil
 * @param {string} perfil.descripcion_corta - Descripción breve (160 caracteres)
 * @param {string} perfil.descripcion_larga - Descripción completa
 * @param {string} perfil.foto_portada - URL de foto de portada
 * @param {string} perfil.logo_url - URL del logo
 * @param {string} perfil.pais - País del negocio
 * @param {string} perfil.telefono_publico - Teléfono público
 * @param {string} perfil.email_publico - Email público
 * @param {string} perfil.sitio_web - Sitio web
 * @param {number} perfil.rating_promedio - Rating promedio (1-5)
 * @param {number} perfil.total_resenas - Total de reseñas
 *
 * @example
 * <SEOHead perfil={perfilData} />
 */
function SEOHead({ perfil }) {
  // Construcción de datos básicos
  const title = perfil.meta_titulo || `${perfil.nombre_comercial} - ${perfil.ciudad}`;
  const description = perfil.descripcion_corta || '';
  const url = `${window.location.origin}/${perfil.slug}`;
  const imageUrl = perfil.foto_portada || perfil.logo_url || '';

  // Schema.org LocalBusiness (JSON-LD)
  // https://schema.org/LocalBusiness
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: perfil.nombre_comercial,
    description: perfil.descripcion_larga || perfil.descripcion_corta,
    image: imageUrl,
    url: perfil.sitio_web || url,
    telephone: perfil.telefono_publico,
    email: perfil.email_publico,
    address: {
      '@type': 'PostalAddress',
      addressLocality: perfil.ciudad,
      addressCountry: perfil.pais,
    },
    // AggregateRating solo si hay reseñas
    ...(perfil.rating_promedio &&
      perfil.total_resenas > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: perfil.rating_promedio,
          reviewCount: perfil.total_resenas,
          bestRating: 5,
          worstRating: 1,
        },
      }),
  };

  return (
    <Helmet>
      {/* ========== Basic Meta Tags ========== */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* ========== Open Graph (Facebook, LinkedIn) ========== */}
      <meta property="og:type" content="business.business" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      {imageUrl && <meta property="og:image:alt" content={perfil.nombre_comercial} />}
      <meta property="og:locale" content="es_MX" />
      <meta property="og:site_name" content="Marketplace de Servicios" />

      {/* ========== Twitter Card ========== */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}

      {/* ========== Schema.org JSON-LD ========== */}
      <script type="application/ld+json">{JSON.stringify(schemaData)}</script>

      {/* ========== Additional SEO Meta Tags ========== */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Spanish" />
      <meta name="geo.region" content="MX" />
      {perfil.ciudad && <meta name="geo.placename" content={perfil.ciudad} />}
    </Helmet>
  );
}

export default SEOHead;
