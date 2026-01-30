const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

/**
 * ====================================================================
 * MODEL - WEBSITE PÁGINAS
 * ====================================================================
 *
 * Páginas del sitio web de cada organización.
 * Cada sitio puede tener múltiples páginas (inicio, servicios, etc.)
 *
 * MÉTODOS:
 * • crear() - Crear nueva página
 * • listar() - Listar páginas de un sitio
 * • obtenerPorId() - Obtener página por ID
 * • obtenerPorSlug() - Obtener página por slug (público)
 * • actualizar() - Actualizar página
 * • reordenar() - Reordenar páginas
 * • eliminar() - Eliminar página
 *
 * Fecha creación: 6 Diciembre 2025
 */
class WebsitePaginasModel {

    /**
     * Crear nueva página
     *
     * @param {Object} datos - Datos de la página
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Página creada
     */
    static async crear(datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener el orden máximo actual
            const ordenResult = await db.query(
                'SELECT COALESCE(MAX(orden), -1) + 1 as next_orden FROM website_paginas WHERE website_id = $1',
                [datos.website_id]
            );
            const orden = datos.orden !== undefined ? datos.orden : ordenResult.rows[0].next_orden;

            const query = `
                INSERT INTO website_paginas (
                    website_id,
                    slug,
                    titulo,
                    descripcion_seo,
                    orden,
                    visible_menu,
                    icono,
                    publicada
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8
                )
                RETURNING *
            `;

            const valores = [
                datos.website_id,
                datos.slug || '',
                datos.titulo,
                datos.descripcion_seo || null,
                orden,
                datos.visible_menu !== undefined ? datos.visible_menu : true,
                datos.icono || null,
                datos.publicada !== undefined ? datos.publicada : true
            ];

            logger.info('[WebsitePaginasModel.crear] Creando página', {
                website_id: datos.website_id,
                slug: datos.slug,
                titulo: datos.titulo
            });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Listar páginas de un sitio
     *
     * @param {string} websiteId - ID del website_config
     * @param {number} organizacionId - ID de la organización
     * @returns {Array} Lista de páginas ordenadas
     */
    static async listar(websiteId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT wp.*,
                    (SELECT COUNT(*) FROM website_bloques wb WHERE wb.pagina_id = wp.id) as total_bloques
                FROM website_paginas wp
                WHERE wp.website_id = $1
                ORDER BY wp.orden ASC
            `;

            const result = await db.query(query, [websiteId]);
            return result.rows;
        });
    }

    /**
     * Obtener página por ID
     *
     * @param {string} id - ID de la página
     * @param {number} organizacionId - ID de la organización
     * @returns {Object|null} Página o null
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT wp.*,
                    wc.slug as website_slug,
                    wc.nombre_sitio
                FROM website_paginas wp
                JOIN website_config wc ON wc.id = wp.website_id
                WHERE wp.id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener página de inicio (primera página por orden)
     *
     * @param {string} websiteSlug - Slug del sitio
     * @returns {Object|null} Página con bloques o null
     */
    static async obtenerPaginaInicio(websiteSlug) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    wp.*,
                    wc.id as website_id,
                    wc.slug as website_slug,
                    wc.nombre_sitio,
                    wc.color_primario,
                    wc.color_secundario,
                    wc.color_acento,
                    wc.color_texto,
                    wc.color_fondo,
                    wc.fuente_titulos,
                    wc.fuente_cuerpo,
                    wc.logo_url,
                    wc.redes_sociales,
                    (
                        SELECT json_agg(
                            json_build_object(
                                'id', wb.id,
                                'tipo', wb.tipo,
                                'contenido', wb.contenido,
                                'estilos', wb.estilos,
                                'orden', wb.orden
                            ) ORDER BY wb.orden
                        )
                        FROM website_bloques wb
                        WHERE wb.pagina_id = wp.id
                        AND wb.visible = true
                    ) as bloques
                FROM website_paginas wp
                JOIN website_config wc ON wc.id = wp.website_id
                WHERE wc.slug = $1
                AND wc.publicado = true
                AND wp.publicada = true
                ORDER BY wp.orden ASC
                LIMIT 1
            `;

            logger.info('[WebsitePaginasModel.obtenerPaginaInicio] Obteniendo página de inicio', {
                website_slug: websiteSlug
            });

            const result = await db.query(query, [websiteSlug]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener página por slug para vista pública
     *
     * @param {string} websiteSlug - Slug del sitio
     * @param {string} paginaSlug - Slug de la página
     * @returns {Object|null} Página con bloques o null
     */
    static async obtenerPorSlug(websiteSlug, paginaSlug) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    wp.*,
                    wc.id as website_id,
                    wc.slug as website_slug,
                    wc.nombre_sitio,
                    wc.color_primario,
                    wc.color_secundario,
                    wc.color_acento,
                    wc.color_texto,
                    wc.color_fondo,
                    wc.fuente_titulos,
                    wc.fuente_cuerpo,
                    wc.logo_url,
                    wc.redes_sociales,
                    (
                        SELECT json_agg(
                            json_build_object(
                                'id', wb.id,
                                'tipo', wb.tipo,
                                'contenido', wb.contenido,
                                'estilos', wb.estilos,
                                'orden', wb.orden
                            ) ORDER BY wb.orden
                        )
                        FROM website_bloques wb
                        WHERE wb.pagina_id = wp.id
                        AND wb.visible = true
                    ) as bloques
                FROM website_paginas wp
                JOIN website_config wc ON wc.id = wp.website_id
                WHERE wc.slug = $1
                AND wp.slug = $2
                AND wc.publicado = true
                AND wp.publicada = true
            `;

            logger.info('[WebsitePaginasModel.obtenerPorSlug] Obteniendo página pública', {
                website_slug: websiteSlug,
                pagina_slug: paginaSlug
            });

            const result = await db.query(query, [websiteSlug, paginaSlug]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar página con bloqueo optimista
     *
     * @param {string} id - ID de la página
     * @param {Object} datos - Datos a actualizar (debe incluir version)
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Página actualizada
     * @throws {Error} 409 si la página fue modificada por otro usuario
     */
    static async actualizar(id, datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Validar que se proporcione version para bloqueo optimista
            if (datos.version === undefined) {
                ErrorHelper.throwValidation('Se requiere version para actualizar', 'version');
            }

            const campos = [];
            const valores = [id];
            let paramIndex = 2;

            const camposPermitidos = [
                'slug', 'titulo', 'descripcion_seo', 'orden',
                'visible_menu', 'icono', 'publicada'
            ];

            for (const campo of camposPermitidos) {
                if (datos[campo] !== undefined) {
                    campos.push(`${campo} = $${paramIndex}`);
                    valores.push(datos[campo]);
                    paramIndex++;
                }
            }

            if (campos.length === 0) {
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            // Agregar version al WHERE para bloqueo optimista
            const versionParam = paramIndex;
            valores.push(datos.version);

            const query = `
                UPDATE website_paginas
                SET ${campos.join(', ')},
                    version = version + 1,
                    actualizado_en = NOW()
                WHERE id = $1 AND version = $${versionParam}
                RETURNING *
            `;

            logger.info('[WebsitePaginasModel.actualizar] Actualizando página', {
                pagina_id: id,
                organizacion_id: organizacionId,
                version: datos.version,
                campos_actualizados: Object.keys(datos).filter(k => k !== 'version')
            });

            const result = await db.query(query, valores);

            // Bloqueo optimista: verificar si se actualizó
            if (result.rowCount === 0) {
                // Verificar si la página existe
                const existe = await db.query(
                    'SELECT version FROM website_paginas WHERE id = $1',
                    [id]
                );
                if (existe.rows.length > 0) {
                    ErrorHelper.throwConflict(
                        'La página fue modificada por otro usuario. Recarga la página para ver los cambios.'
                    );
                }
                return null; // Página no encontrada
            }

            return result.rows[0];
        });
    }

    /**
     * Reordenar páginas
     *
     * @param {string} websiteId - ID del website_config
     * @param {Array} ordenamiento - Array de {id, orden}
     * @param {number} organizacionId - ID de la organización
     * @returns {boolean} true si se reordenó correctamente
     */
    static async reordenar(websiteId, ordenamiento, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            for (const item of ordenamiento) {
                await db.query(
                    'UPDATE website_paginas SET orden = $1, actualizado_en = NOW() WHERE id = $2 AND website_id = $3',
                    [item.orden, item.id, websiteId]
                );
            }

            logger.info('[WebsitePaginasModel.reordenar] Páginas reordenadas', {
                website_id: websiteId,
                organizacion_id: organizacionId,
                total_paginas: ordenamiento.length
            });

            return true;
        });
    }

    /**
     * Eliminar página
     *
     * @param {string} id - ID de la página
     * @param {number} organizacionId - ID de la organización
     * @returns {boolean} true si se eliminó
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                DELETE FROM website_paginas
                WHERE id = $1
                RETURNING id
            `;

            logger.info('[WebsitePaginasModel.eliminar] Eliminando página', {
                pagina_id: id,
                organizacion_id: organizacionId
            });

            const result = await db.query(query, [id]);
            return result.rows.length > 0;
        });
    }

    /**
     * Verificar si slug está disponible dentro del mismo sitio
     *
     * @param {string} websiteId - ID del website_config
     * @param {string} slug - Slug a verificar
     * @param {string} excludeId - ID a excluir (para edición)
     * @returns {boolean} true si está disponible
     */
    static async verificarSlugDisponible(websiteId, slug, excludeId = null) {
        return await RLSContextManager.withBypass(async (db) => {
            let query = 'SELECT id FROM website_paginas WHERE website_id = $1 AND slug = $2';
            const params = [websiteId, slug];

            if (excludeId) {
                query += ' AND id != $3';
                params.push(excludeId);
            }

            const result = await db.query(query, params);
            return result.rows.length === 0;
        });
    }
}

module.exports = WebsitePaginasModel;
