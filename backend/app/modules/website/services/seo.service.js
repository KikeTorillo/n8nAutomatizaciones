/**
 * ====================================================================
 * SERVICE - WEBSITE SEO
 * ====================================================================
 * Servicio para funcionalidades SEO avanzadas del sitio web.
 *
 * Funcionalidades:
 * - Auditoria SEO con puntuacion
 * - Generacion de sitemap.xml
 * - Generacion de robots.txt
 * - Schema markup (LocalBusiness, Organization)
 * - Preview de SERP de Google
 *
 * Fecha creacion: 25 Enero 2026
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

/**
 * Servicio SEO del Website
 */
class WebsiteSEOService {
  /**
   * Auditar SEO de un sitio web
   * @param {number} organizacionId - ID de la organizacion
   * @param {string} websiteId - UUID del sitio (opcional)
   * @returns {Promise<Object>} Resultado de auditoria con score 0-100
   */
  static async auditar(organizacionId, websiteId = null) {
    // Obtener datos del sitio
    let websiteQuery = `
      SELECT
        wc.id,
        wc.slug,
        wc.nombre_sitio,
        wc.descripcion_seo,
        wc.keywords_seo,
        wc.og_image_url,
        wc.schema_type,
        wc.schema_datos,
        wc.favicon_url,
        wc.logo_url,
        o.nombre as organizacion_nombre,
        o.email as organizacion_email,
        o.telefono as organizacion_telefono,
        o.direccion as organizacion_direccion
      FROM website_config wc
      JOIN organizaciones o ON wc.organizacion_id = o.id
      WHERE wc.organizacion_id = $1
    `;

    const params = [organizacionId];
    if (websiteId) {
      websiteQuery += ' AND wc.id = $2';
      params.push(websiteId);
    }
    websiteQuery += ' LIMIT 1';

    const websiteResult = await RLSContextManager.query(organizacionId, async (db) => {
      return await db.query(websiteQuery, params);
    });

    if (websiteResult.rows.length === 0) {
      throw new Error('Sitio web no encontrado');
    }

    const sitio = websiteResult.rows[0];

    // Obtener paginas
    const paginasResult = await RLSContextManager.query(organizacionId, async (db) => {
      return await db.query(`
        SELECT
          id,
          slug,
          titulo,
          descripcion_seo,
          og_image_url,
          noindex
        FROM website_paginas
        WHERE website_id = $1
      `, [sitio.id]);
    });

    const paginas = paginasResult.rows;

    // Calcular auditoria
    const auditoria = {
      score: 0,
      maximo: 100,
      categorias: {
        basico: { score: 0, maximo: 30, items: [] },
        contenido: { score: 0, maximo: 25, items: [] },
        tecnico: { score: 0, maximo: 25, items: [] },
        social: { score: 0, maximo: 20, items: [] },
      },
      recomendaciones: [],
    };

    // === BASICO (30 puntos) ===
    // Titulo del sitio (10 pts)
    if (sitio.nombre_sitio) {
      const tituloLen = sitio.nombre_sitio.length;
      if (tituloLen >= 10 && tituloLen <= 60) {
        auditoria.categorias.basico.items.push({ nombre: 'Titulo del sitio', estado: 'ok', puntos: 10 });
        auditoria.categorias.basico.score += 10;
      } else {
        auditoria.categorias.basico.items.push({ nombre: 'Titulo del sitio', estado: 'warning', puntos: 5, mensaje: 'Longitud no optima (ideal: 10-60 caracteres)' });
        auditoria.categorias.basico.score += 5;
        auditoria.recomendaciones.push('Ajusta el titulo del sitio a 10-60 caracteres para mejor visibilidad en buscadores');
      }
    } else {
      auditoria.categorias.basico.items.push({ nombre: 'Titulo del sitio', estado: 'error', puntos: 0 });
      auditoria.recomendaciones.push('Agrega un titulo descriptivo a tu sitio');
    }

    // Descripcion SEO (10 pts)
    if (sitio.descripcion_seo) {
      const descLen = sitio.descripcion_seo.length;
      if (descLen >= 120 && descLen <= 160) {
        auditoria.categorias.basico.items.push({ nombre: 'Meta descripcion', estado: 'ok', puntos: 10 });
        auditoria.categorias.basico.score += 10;
      } else {
        auditoria.categorias.basico.items.push({ nombre: 'Meta descripcion', estado: 'warning', puntos: 5, mensaje: 'Longitud no optima (ideal: 120-160 caracteres)' });
        auditoria.categorias.basico.score += 5;
        auditoria.recomendaciones.push('Ajusta la meta descripcion a 120-160 caracteres');
      }
    } else {
      auditoria.categorias.basico.items.push({ nombre: 'Meta descripcion', estado: 'error', puntos: 0 });
      auditoria.recomendaciones.push('Agrega una meta descripcion para mejorar el CTR en buscadores');
    }

    // Keywords (5 pts)
    if (sitio.keywords_seo && sitio.keywords_seo.length > 0) {
      auditoria.categorias.basico.items.push({ nombre: 'Keywords', estado: 'ok', puntos: 5 });
      auditoria.categorias.basico.score += 5;
    } else {
      auditoria.categorias.basico.items.push({ nombre: 'Keywords', estado: 'warning', puntos: 2 });
      auditoria.categorias.basico.score += 2;
      auditoria.recomendaciones.push('Agrega palabras clave relevantes para tu negocio');
    }

    // Slug amigable (5 pts)
    if (sitio.slug && /^[a-z0-9-]+$/.test(sitio.slug)) {
      auditoria.categorias.basico.items.push({ nombre: 'URL amigable', estado: 'ok', puntos: 5 });
      auditoria.categorias.basico.score += 5;
    } else {
      auditoria.categorias.basico.items.push({ nombre: 'URL amigable', estado: 'error', puntos: 0 });
      auditoria.recomendaciones.push('Usa un slug URL amigable (solo letras, numeros y guiones)');
    }

    // === CONTENIDO (25 puntos) ===
    // Paginas con descripcion (10 pts)
    const paginasConDesc = paginas.filter(p => p.descripcion_seo && p.descripcion_seo.length > 50);
    const ratioDesc = paginas.length > 0 ? paginasConDesc.length / paginas.length : 0;
    if (ratioDesc >= 0.8) {
      auditoria.categorias.contenido.items.push({ nombre: 'Descripciones de paginas', estado: 'ok', puntos: 10 });
      auditoria.categorias.contenido.score += 10;
    } else if (ratioDesc >= 0.5) {
      auditoria.categorias.contenido.items.push({ nombre: 'Descripciones de paginas', estado: 'warning', puntos: 5 });
      auditoria.categorias.contenido.score += 5;
      auditoria.recomendaciones.push('Agrega descripciones SEO a todas tus paginas');
    } else {
      auditoria.categorias.contenido.items.push({ nombre: 'Descripciones de paginas', estado: 'error', puntos: 0 });
      auditoria.recomendaciones.push('La mayoria de tus paginas no tienen descripcion SEO');
    }

    // Cantidad de paginas (10 pts)
    if (paginas.length >= 5) {
      auditoria.categorias.contenido.items.push({ nombre: 'Cantidad de contenido', estado: 'ok', puntos: 10 });
      auditoria.categorias.contenido.score += 10;
    } else if (paginas.length >= 3) {
      auditoria.categorias.contenido.items.push({ nombre: 'Cantidad de contenido', estado: 'warning', puntos: 5 });
      auditoria.categorias.contenido.score += 5;
      auditoria.recomendaciones.push('Agrega mas paginas para mejorar la autoridad del sitio');
    } else {
      auditoria.categorias.contenido.items.push({ nombre: 'Cantidad de contenido', estado: 'error', puntos: 2 });
      auditoria.categorias.contenido.score += 2;
      auditoria.recomendaciones.push('Tu sitio tiene muy pocas paginas');
    }

    // URLs de paginas (5 pts)
    const paginasConSlug = paginas.filter(p => p.slug && /^[a-z0-9-]+$/.test(p.slug));
    if (paginasConSlug.length === paginas.length) {
      auditoria.categorias.contenido.items.push({ nombre: 'URLs de paginas', estado: 'ok', puntos: 5 });
      auditoria.categorias.contenido.score += 5;
    } else {
      auditoria.categorias.contenido.items.push({ nombre: 'URLs de paginas', estado: 'warning', puntos: 2 });
      auditoria.categorias.contenido.score += 2;
    }

    // === TECNICO (25 puntos) ===
    // Favicon (5 pts)
    if (sitio.favicon_url) {
      auditoria.categorias.tecnico.items.push({ nombre: 'Favicon', estado: 'ok', puntos: 5 });
      auditoria.categorias.tecnico.score += 5;
    } else {
      auditoria.categorias.tecnico.items.push({ nombre: 'Favicon', estado: 'warning', puntos: 0 });
      auditoria.recomendaciones.push('Agrega un favicon para mejorar el branding');
    }

    // Logo (5 pts)
    if (sitio.logo_url) {
      auditoria.categorias.tecnico.items.push({ nombre: 'Logo', estado: 'ok', puntos: 5 });
      auditoria.categorias.tecnico.score += 5;
    } else {
      auditoria.categorias.tecnico.items.push({ nombre: 'Logo', estado: 'warning', puntos: 0 });
      auditoria.recomendaciones.push('Agrega un logo a tu sitio');
    }

    // Schema markup (10 pts)
    if (sitio.schema_type) {
      auditoria.categorias.tecnico.items.push({ nombre: 'Schema markup', estado: 'ok', puntos: 10 });
      auditoria.categorias.tecnico.score += 10;
    } else {
      auditoria.categorias.tecnico.items.push({ nombre: 'Schema markup', estado: 'warning', puntos: 0 });
      auditoria.recomendaciones.push('Configura schema markup para mejorar rich snippets');
    }

    // Noindex en paginas (5 pts)
    const paginasNoindex = paginas.filter(p => p.noindex);
    if (paginasNoindex.length === 0) {
      auditoria.categorias.tecnico.items.push({ nombre: 'Indexacion', estado: 'ok', puntos: 5 });
      auditoria.categorias.tecnico.score += 5;
    } else {
      auditoria.categorias.tecnico.items.push({ nombre: 'Indexacion', estado: 'warning', puntos: 3, mensaje: `${paginasNoindex.length} paginas con noindex` });
      auditoria.categorias.tecnico.score += 3;
    }

    // === SOCIAL (20 puntos) ===
    // OG Image del sitio (10 pts)
    if (sitio.og_image_url) {
      auditoria.categorias.social.items.push({ nombre: 'Imagen Open Graph', estado: 'ok', puntos: 10 });
      auditoria.categorias.social.score += 10;
    } else {
      auditoria.categorias.social.items.push({ nombre: 'Imagen Open Graph', estado: 'warning', puntos: 0 });
      auditoria.recomendaciones.push('Agrega una imagen Open Graph para mejorar compartidos en redes sociales');
    }

    // Datos de contacto (10 pts)
    let contactoScore = 0;
    if (sitio.organizacion_email) contactoScore += 3;
    if (sitio.organizacion_telefono) contactoScore += 3;
    if (sitio.organizacion_direccion) contactoScore += 4;

    if (contactoScore >= 7) {
      auditoria.categorias.social.items.push({ nombre: 'Datos de contacto', estado: 'ok', puntos: contactoScore });
    } else if (contactoScore >= 3) {
      auditoria.categorias.social.items.push({ nombre: 'Datos de contacto', estado: 'warning', puntos: contactoScore });
      auditoria.recomendaciones.push('Completa los datos de contacto de tu organizacion');
    } else {
      auditoria.categorias.social.items.push({ nombre: 'Datos de contacto', estado: 'error', puntos: contactoScore });
      auditoria.recomendaciones.push('Agrega datos de contacto para generar confianza');
    }
    auditoria.categorias.social.score += contactoScore;

    // Calcular score total
    auditoria.score = Object.values(auditoria.categorias).reduce((acc, cat) => acc + cat.score, 0);

    return {
      sitio_id: sitio.id,
      slug: sitio.slug,
      nombre_sitio: sitio.nombre_sitio,
      ...auditoria,
    };
  }

  /**
   * Generar sitemap.xml
   * @param {string} slug - Slug del sitio
   * @param {string} baseUrl - URL base del sitio
   * @returns {Promise<string>} XML del sitemap
   */
  static async generarSitemap(slug, baseUrl = null) {
    // Obtener sitio y paginas
    const siteQuery = `
      SELECT
        wc.id,
        wc.slug,
        wc.actualizado_en as sitio_actualizado,
        wp.slug as pagina_slug,
        wp.titulo as pagina_titulo,
        wp.actualizado_en as pagina_actualizada,
        wp.noindex,
        wp.publicada
      FROM website_config wc
      LEFT JOIN website_paginas wp ON wc.id = wp.website_id
      WHERE wc.slug = $1 AND wc.publicado = true
      ORDER BY wp.orden
    `;

    const result = await RLSContextManager.withBypass(async (db) => {
      return await db.query(siteQuery, [slug]);
    });

    if (result.rows.length === 0) {
      throw new Error('Sitio no encontrado o no publicado');
    }

    const siteBaseUrl = baseUrl || `https://nexo.com/sitio/${slug}`;

    // Generar XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Pagina principal
    xml += '  <url>\n';
    xml += `    <loc>${siteBaseUrl}</loc>\n`;
    xml += `    <lastmod>${new Date(result.rows[0].sitio_actualizado).toISOString().split('T')[0]}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Paginas
    const paginasVistas = new Set();
    for (const row of result.rows) {
      if (row.pagina_slug && !row.noindex && row.publicada && !paginasVistas.has(row.pagina_slug)) {
        paginasVistas.add(row.pagina_slug);
        xml += '  <url>\n';
        xml += `    <loc>${siteBaseUrl}/${row.pagina_slug}</loc>\n`;
        xml += `    <lastmod>${new Date(row.pagina_actualizada || row.sitio_actualizado).toISOString().split('T')[0]}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      }
    }

    xml += '</urlset>';

    return xml;
  }

  /**
   * Generar robots.txt
   * @param {string} slug - Slug del sitio
   * @param {string} baseUrl - URL base del sitio
   * @returns {Promise<string>} Contenido de robots.txt
   */
  static async generarRobotsTxt(slug, baseUrl = null) {
    const siteBaseUrl = baseUrl || `https://nexo.com/sitio/${slug}`;

    let robots = 'User-agent: *\n';
    robots += 'Allow: /\n';
    robots += '\n';
    robots += `Sitemap: ${siteBaseUrl}/sitemap.xml\n`;

    return robots;
  }

  /**
   * Generar Schema markup (JSON-LD)
   * @param {number} organizacionId - ID de la organizacion
   * @param {string} websiteId - UUID del sitio
   * @param {string} tipo - Tipo de schema (LocalBusiness, Organization, etc.)
   * @returns {Promise<Object>} Schema JSON-LD
   */
  static async generarSchema(organizacionId, websiteId, tipo = 'LocalBusiness') {
    const query = `
      SELECT
        wc.slug,
        wc.nombre_sitio,
        wc.descripcion_seo,
        wc.logo_url,
        wc.schema_datos,
        o.nombre as organizacion_nombre,
        o.email as organizacion_email,
        o.telefono as organizacion_telefono,
        o.direccion as organizacion_direccion,
        o.ciudad,
        o.pais
      FROM website_config wc
      JOIN organizaciones o ON wc.organizacion_id = o.id
      WHERE wc.id = $1 AND wc.organizacion_id = $2
    `;

    const result = await RLSContextManager.query(organizacionId, async (db) => {
      return await db.query(query, [websiteId, organizacionId]);
    });

    if (result.rows.length === 0) {
      throw new Error('Sitio no encontrado');
    }

    const sitio = result.rows[0];
    const datosExtra = sitio.schema_datos || {};

    // Schema base
    const schema = {
      '@context': 'https://schema.org',
      '@type': tipo,
      name: sitio.nombre_sitio || sitio.organizacion_nombre,
      description: sitio.descripcion_seo || '',
      url: `https://nexo.com/sitio/${sitio.slug}`,
    };

    // Logo
    if (sitio.logo_url) {
      schema.logo = sitio.logo_url;
      schema.image = sitio.logo_url;
    }

    // Contacto
    if (sitio.organizacion_email) {
      schema.email = sitio.organizacion_email;
    }
    if (sitio.organizacion_telefono) {
      schema.telephone = sitio.organizacion_telefono;
    }

    // Direccion
    if (sitio.organizacion_direccion || sitio.ciudad || sitio.pais) {
      schema.address = {
        '@type': 'PostalAddress',
      };
      if (sitio.organizacion_direccion) {
        schema.address.streetAddress = sitio.organizacion_direccion;
      }
      if (sitio.ciudad) {
        schema.address.addressLocality = sitio.ciudad;
      }
      if (sitio.pais) {
        schema.address.addressCountry = sitio.pais;
      }
    }

    // Mezclar con datos extra configurados
    return { ...schema, ...datosExtra };
  }

  /**
   * Generar preview de SERP (Google)
   * @param {number} organizacionId - ID de la organizacion
   * @param {string} websiteId - UUID del sitio
   * @returns {Promise<Object>} Datos para preview
   */
  static async previewSERP(organizacionId, websiteId) {
    const query = `
      SELECT
        wc.slug,
        wc.nombre_sitio,
        wc.descripcion_seo,
        wc.favicon_url
      FROM website_config wc
      WHERE wc.id = $1 AND wc.organizacion_id = $2
    `;

    const result = await RLSContextManager.query(organizacionId, async (db) => {
      return await db.query(query, [websiteId, organizacionId]);
    });

    if (result.rows.length === 0) {
      throw new Error('Sitio no encontrado');
    }

    const sitio = result.rows[0];

    return {
      titulo: sitio.nombre_sitio || 'Sin titulo',
      url: `https://nexo.com/sitio/${sitio.slug}`,
      descripcion: sitio.descripcion_seo || 'Sin descripcion',
      favicon: sitio.favicon_url || null,
      advertencias: {
        titulo: sitio.nombre_sitio
          ? (sitio.nombre_sitio.length > 60 ? 'El titulo es muy largo (max 60 caracteres)' : null)
          : 'Falta titulo',
        descripcion: sitio.descripcion_seo
          ? (sitio.descripcion_seo.length > 160 ? 'La descripcion es muy larga (max 160 caracteres)' : null)
          : 'Falta descripcion',
      },
    };
  }
}

module.exports = WebsiteSEOService;
