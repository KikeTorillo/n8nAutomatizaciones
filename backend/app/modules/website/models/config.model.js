const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

/**
 * ====================================================================
 * MODEL - WEBSITE CONFIG
 * ====================================================================
 *
 * Configuración del sitio web público de cada organización.
 * Cada organización puede tener máximo 1 sitio web.
 *
 * MÉTODOS:
 * • crear() - Crear configuración del sitio
 * • obtenerPorOrganizacion() - Obtener config por org_id
 * • obtenerPorSlug() - Obtener config por slug (público)
 * • actualizar() - Actualizar configuración
 * • publicar() - Publicar/despublicar sitio
 * • verificarSlugDisponible() - Verificar disponibilidad del slug
 *
 * Fecha creación: 6 Diciembre 2025
 */
class WebsiteConfigModel {

    /**
     * Crear configuración del sitio web
     *
     * @param {Object} datos - Datos de configuración
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Configuración creada
     */
    static async crear(datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO website_config (
                    organizacion_id,
                    slug,
                    nombre_sitio,
                    descripcion_seo,
                    keywords_seo,
                    favicon_url,
                    logo_url,
                    logo_alt,
                    color_primario,
                    color_secundario,
                    color_acento,
                    color_texto,
                    color_fondo,
                    fuente_titulos,
                    fuente_cuerpo,
                    redes_sociales
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16
                )
                RETURNING *
            `;

            const valores = [
                organizacionId,
                datos.slug,
                datos.nombre_sitio || null,
                datos.descripcion_seo || null,
                datos.keywords_seo || null,
                datos.favicon_url || null,
                datos.logo_url || null,
                datos.logo_alt || null,
                datos.color_primario || '#3B82F6',
                datos.color_secundario || '#1E40AF',
                datos.color_acento || '#F59E0B',
                datos.color_texto || '#1F2937',
                datos.color_fondo || '#FFFFFF',
                datos.fuente_titulos || 'Inter',
                datos.fuente_cuerpo || 'Inter',
                datos.redes_sociales ? JSON.stringify(datos.redes_sociales) : '{}'
            ];

            logger.info('[WebsiteConfigModel.crear] Creando configuración de sitio', {
                organizacion_id: organizacionId,
                slug: datos.slug
            });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Obtener configuración por organización
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Object|null} Configuración o null
     */
    static async obtenerPorOrganizacion(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT wc.*, o.nombre_comercial as nombre_organizacion
                FROM website_config wc
                JOIN organizaciones o ON o.id = wc.organizacion_id
                WHERE wc.organizacion_id = $1
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener configuración por slug (público)
     * No requiere autenticación
     *
     * @param {string} slug - Slug del sitio
     * @returns {Object|null} Configuración con páginas o null
     */
    static async obtenerPorSlug(slug) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    wc.*,
                    o.nombre_comercial as nombre_organizacion,
                    o.logo_url as organizacion_logo,
                    (
                        SELECT json_agg(
                            json_build_object(
                                'id', wp.id,
                                'slug', wp.slug,
                                'titulo', wp.titulo,
                                'orden', wp.orden,
                                'icono', wp.icono
                            ) ORDER BY wp.orden
                        )
                        FROM website_paginas wp
                        WHERE wp.website_id = wc.id
                        AND wp.publicada = true
                        AND wp.visible_menu = true
                    ) as paginas_menu
                FROM website_config wc
                JOIN organizaciones o ON o.id = wc.organizacion_id
                WHERE wc.slug = $1
                AND wc.publicado = true
            `;

            logger.info('[WebsiteConfigModel.obtenerPorSlug] Obteniendo sitio público', { slug });

            const result = await db.query(query, [slug]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar configuración del sitio
     *
     * @param {string} id - ID del website_config (UUID)
     * @param {Object} datos - Datos a actualizar
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Configuración actualizada
     */
    static async actualizar(id, datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const campos = [];
            const valores = [id];
            let paramIndex = 2;

            const camposPermitidos = [
                'slug', 'nombre_sitio', 'descripcion_seo', 'keywords_seo',
                'favicon_url', 'logo_url', 'logo_alt',
                'color_primario', 'color_secundario', 'color_acento',
                'color_texto', 'color_fondo',
                'fuente_titulos', 'fuente_cuerpo', 'redes_sociales'
            ];

            for (const campo of camposPermitidos) {
                if (datos[campo] !== undefined) {
                    if (campo === 'redes_sociales') {
                        campos.push(`${campo} = $${paramIndex}::jsonb`);
                        valores.push(JSON.stringify(datos[campo]));
                    } else {
                        campos.push(`${campo} = $${paramIndex}`);
                        valores.push(datos[campo]);
                    }
                    paramIndex++;
                }
            }

            if (campos.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            const query = `
                UPDATE website_config
                SET ${campos.join(', ')},
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            logger.info('[WebsiteConfigModel.actualizar] Actualizando configuración', {
                website_id: id,
                organizacion_id: organizacionId,
                campos_actualizados: Object.keys(datos)
            });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Publicar o despublicar sitio
     *
     * @param {string} id - ID del website_config
     * @param {boolean} publicar - true para publicar, false para despublicar
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Configuración actualizada
     */
    static async publicar(id, publicar, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE website_config
                SET publicado = $2,
                    fecha_publicacion = CASE
                        WHEN $2 = true AND fecha_publicacion IS NULL THEN NOW()
                        ELSE fecha_publicacion
                    END,
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            logger.info('[WebsiteConfigModel.publicar] Cambiando estado de publicación', {
                website_id: id,
                organizacion_id: organizacionId,
                publicar
            });

            const result = await db.query(query, [id, publicar]);
            return result.rows[0];
        });
    }

    /**
     * Verificar si un slug está disponible
     *
     * @param {string} slug - Slug a verificar
     * @param {string} excludeId - ID a excluir (para edición)
     * @returns {boolean} true si está disponible
     */
    static async verificarSlugDisponible(slug, excludeId = null) {
        return await RLSContextManager.withBypass(async (db) => {
            let query = 'SELECT id FROM website_config WHERE slug = $1';
            const params = [slug];

            if (excludeId) {
                query += ' AND id != $2';
                params.push(excludeId);
            }

            const result = await db.query(query, params);
            return result.rows.length === 0;
        });
    }

    /**
     * Eliminar configuración del sitio
     *
     * @param {string} id - ID del website_config
     * @param {number} organizacionId - ID de la organización
     * @returns {boolean} true si se eliminó
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                DELETE FROM website_config
                WHERE id = $1
                RETURNING id
            `;

            logger.info('[WebsiteConfigModel.eliminar] Eliminando configuración', {
                website_id: id,
                organizacion_id: organizacionId
            });

            const result = await db.query(query, [id]);
            return result.rows.length > 0;
        });
    }
}

module.exports = WebsiteConfigModel;
