const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');
const blockDefaults = require('../data/block-defaults.json');

/**
 * ====================================================================
 * MODEL - WEBSITE BLOQUES
 * ====================================================================
 *
 * Bloques de contenido dentro de cada página.
 * Sistema drag-and-drop: cada bloque puede reordenarse.
 *
 * TIPOS DE BLOQUES:
 * • hero - Banner principal con imagen/video
 * • servicios - Cards de servicios
 * • testimonios - Reseñas de clientes
 * • equipo - Staff/profesionales
 * • cta - Call to action
 * • contacto - Formulario + info de contacto
 * • footer - Pie de página
 * • texto - Contenido HTML libre
 * • galeria - Galería de imágenes
 * • video - Video embebido
 * • separador - Separador visual
 * • pricing - Tablas de precios comparativas
 * • faq - Accordion de preguntas frecuentes
 * • countdown - Contador regresivo
 * • stats - Números/estadísticas animadas
 * • timeline - Línea de tiempo
 *
 * Fecha creación: 6 Diciembre 2025
 */
class WebsiteBloquesModel {

    /**
     * Máximo de bloques permitidos por página
     * Límite para evitar degradación de performance en el canvas
     */
    static MAX_BLOQUES_POR_PAGINA = 50;

    /**
     * Tipos de bloques válidos
     */
    static TIPOS_VALIDOS = [
        'hero', 'servicios', 'testimonios', 'equipo', 'cta',
        'contacto', 'footer', 'texto', 'galeria', 'video', 'separador',
        'pricing', 'faq', 'countdown', 'stats', 'timeline'
    ];

    /**
     * Crear nuevo bloque
     *
     * @param {Object} datos - Datos del bloque
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Bloque creado
     * @throws {Error} Si se excede el límite de bloques por página
     */
    static async crear(datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar límite de bloques por página
            const countResult = await db.query(
                'SELECT COUNT(*) as total FROM website_bloques WHERE pagina_id = $1',
                [datos.pagina_id]
            );
            const totalBloques = parseInt(countResult.rows[0].total, 10);

            if (totalBloques >= this.MAX_BLOQUES_POR_PAGINA) {
                ErrorHelper.throwValidation(
                    `Se ha alcanzado el límite máximo de ${this.MAX_BLOQUES_POR_PAGINA} bloques por página. ` +
                    'Elimina algunos bloques antes de agregar más.'
                );
            }

            // Obtener el orden máximo actual
            const ordenResult = await db.query(
                'SELECT COALESCE(MAX(orden), -1) + 1 as next_orden FROM website_bloques WHERE pagina_id = $1',
                [datos.pagina_id]
            );
            const orden = datos.orden !== undefined ? datos.orden : ordenResult.rows[0].next_orden;

            // Si se especifica un orden, desplazar los bloques existentes para hacer espacio
            if (datos.orden !== undefined) {
                await db.query(
                    'UPDATE website_bloques SET orden = orden + 1 WHERE pagina_id = $1 AND orden >= $2',
                    [datos.pagina_id, datos.orden]
                );
            }

            const query = `
                INSERT INTO website_bloques (
                    pagina_id,
                    tipo,
                    contenido,
                    estilos,
                    orden,
                    visible
                ) VALUES (
                    $1, $2, $3::jsonb, $4::jsonb, $5, $6
                )
                RETURNING *
            `;

            const valores = [
                datos.pagina_id,
                datos.tipo,
                JSON.stringify(datos.contenido || {}),
                JSON.stringify(datos.estilos || {}),
                orden,
                datos.visible !== undefined ? datos.visible : true
            ];

            logger.info('[WebsiteBloquesModel.crear] Creando bloque', {
                pagina_id: datos.pagina_id,
                tipo: datos.tipo,
                orden
            });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Listar bloques de una página
     *
     * @param {string} paginaId - ID de la página
     * @param {number} organizacionId - ID de la organización
     * @returns {Array} Lista de bloques ordenados
     */
    static async listar(paginaId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT wb.*
                FROM website_bloques wb
                WHERE wb.pagina_id = $1
                ORDER BY wb.orden ASC
            `;

            const result = await db.query(query, [paginaId]);
            return result.rows;
        });
    }

    /**
     * Listar bloques visibles (para vista pública)
     *
     * @param {string} paginaId - ID de la página
     * @returns {Array} Lista de bloques visibles ordenados
     */
    static async listarVisibles(paginaId) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT wb.*
                FROM website_bloques wb
                JOIN website_paginas wp ON wp.id = wb.pagina_id
                JOIN website_config wc ON wc.id = wp.website_id
                WHERE wb.pagina_id = $1
                AND wb.visible = true
                AND wp.publicada = true
                AND wc.publicado = true
                ORDER BY wb.orden ASC
            `;

            const result = await db.query(query, [paginaId]);
            return result.rows;
        });
    }

    /**
     * Obtener bloque por ID
     *
     * @param {string} id - ID del bloque
     * @param {number} organizacionId - ID de la organización
     * @returns {Object|null} Bloque o null
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT wb.*,
                    wp.titulo as pagina_titulo,
                    wp.slug as pagina_slug,
                    wc.slug as website_slug
                FROM website_bloques wb
                JOIN website_paginas wp ON wp.id = wb.pagina_id
                JOIN website_config wc ON wc.id = wp.website_id
                WHERE wb.id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar bloque con bloqueo optimista
     *
     * @param {string} id - ID del bloque
     * @param {Object} datos - Datos a actualizar (debe incluir version)
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Bloque actualizado
     * @throws {Error} 409 si el bloque fue modificado por otro usuario
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

            // Campos permitidos (sin pagina_id para evitar mover entre páginas)
            if (datos.tipo !== undefined) {
                campos.push(`tipo = $${paramIndex}`);
                valores.push(datos.tipo);
                paramIndex++;
            }

            if (datos.contenido !== undefined) {
                campos.push(`contenido = $${paramIndex}::jsonb`);
                valores.push(JSON.stringify(datos.contenido));
                paramIndex++;
            }

            if (datos.estilos !== undefined) {
                campos.push(`estilos = $${paramIndex}::jsonb`);
                valores.push(JSON.stringify(datos.estilos));
                paramIndex++;
            }

            if (datos.orden !== undefined) {
                campos.push(`orden = $${paramIndex}`);
                valores.push(datos.orden);
                paramIndex++;
            }

            if (datos.visible !== undefined) {
                campos.push(`visible = $${paramIndex}`);
                valores.push(datos.visible);
                paramIndex++;
            }

            if (campos.length === 0) {
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            // Agregar version al WHERE para bloqueo optimista
            const versionParam = paramIndex;
            valores.push(datos.version);

            const query = `
                UPDATE website_bloques
                SET ${campos.join(', ')},
                    version = version + 1,
                    actualizado_en = NOW()
                WHERE id = $1 AND version = $${versionParam}
                RETURNING *
            `;

            logger.info('[WebsiteBloquesModel.actualizar] Actualizando bloque', {
                bloque_id: id,
                organizacion_id: organizacionId,
                version: datos.version,
                campos_actualizados: Object.keys(datos).filter(k => k !== 'version')
            });

            const result = await db.query(query, valores);

            // Bloqueo optimista: verificar si se actualizó
            if (result.rowCount === 0) {
                // Verificar si el bloque existe
                const existe = await db.query(
                    'SELECT version FROM website_bloques WHERE id = $1',
                    [id]
                );
                if (existe.rows.length > 0) {
                    ErrorHelper.throwConflict(
                        'El bloque fue modificado por otro usuario. Recarga la página para ver los cambios.'
                    );
                }
                return null; // Bloque no encontrado
            }

            return result.rows[0];
        });
    }

    /**
     * Reordenar bloques de una página con bloqueo pesimista
     *
     * @param {string} paginaId - ID de la página
     * @param {Array} ordenamiento - Array de {id, orden}
     * @param {number} organizacionId - ID de la organización
     * @returns {boolean} true si se reordenó correctamente
     */
    static async reordenar(paginaId, ordenamiento, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Bloqueo pesimista: SELECT FOR UPDATE para prevenir race conditions
            const ids = ordenamiento.map(item => item.id);
            await db.query(
                'SELECT id FROM website_bloques WHERE id = ANY($1) AND pagina_id = $2 FOR UPDATE',
                [ids, paginaId]
            );

            // Actualizar orden de cada bloque
            for (const item of ordenamiento) {
                await db.query(
                    'UPDATE website_bloques SET orden = $1, actualizado_en = NOW() WHERE id = $2 AND pagina_id = $3',
                    [item.orden, item.id, paginaId]
                );
            }

            logger.info('[WebsiteBloquesModel.reordenar] Bloques reordenados', {
                pagina_id: paginaId,
                organizacion_id: organizacionId,
                total_bloques: ordenamiento.length
            });

            return true;
        });
    }

    /**
     * Duplicar bloque
     *
     * @param {string} id - ID del bloque a duplicar
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Nuevo bloque duplicado
     */
    static async duplicar(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Obtener bloque original
            const bloqueResult = await db.query(
                'SELECT * FROM website_bloques WHERE id = $1',
                [id]
            );

            ErrorHelper.throwIfNotFound(bloqueResult.rows[0], 'Bloque');

            const original = bloqueResult.rows[0];

            // Obtener el orden máximo actual
            const ordenResult = await db.query(
                'SELECT COALESCE(MAX(orden), -1) + 1 as next_orden FROM website_bloques WHERE pagina_id = $1',
                [original.pagina_id]
            );

            // Insertar copia
            const query = `
                INSERT INTO website_bloques (
                    pagina_id, tipo, contenido, estilos, orden, visible
                ) VALUES (
                    $1, $2, $3, $4, $5, $6
                )
                RETURNING *
            `;

            const result = await db.query(query, [
                original.pagina_id,
                original.tipo,
                original.contenido,
                original.estilos,
                ordenResult.rows[0].next_orden,
                original.visible
            ]);

            logger.info('[WebsiteBloquesModel.duplicar] Bloque duplicado', {
                bloque_original: id,
                bloque_nuevo: result.rows[0].id,
                organizacion_id: organizacionId
            });

            return result.rows[0];
        });
    }

    /**
     * Eliminar bloque
     *
     * @param {string} id - ID del bloque
     * @param {number} organizacionId - ID de la organización
     * @returns {boolean} true si se eliminó
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                DELETE FROM website_bloques
                WHERE id = $1
                RETURNING id, pagina_id
            `;

            logger.info('[WebsiteBloquesModel.eliminar] Eliminando bloque', {
                bloque_id: id,
                organizacion_id: organizacionId
            });

            const result = await db.query(query, [id]);
            return result.rows.length > 0;
        });
    }

    /**
     * Obtener contenido por defecto para un tipo de bloque
     * Lee de block-defaults.json y aplica valores dinámicos
     *
     * @param {string} tipo - Tipo de bloque
     * @returns {Object} Contenido por defecto
     */
    static obtenerContenidoDefault(tipo) {
        const template = blockDefaults[tipo];
        if (!template) {
            return {};
        }

        // Clonar para no mutar el objeto original
        const contenido = JSON.parse(JSON.stringify(template));

        // Aplicar valores dinámicos
        if (tipo === 'footer' && contenido.copyright) {
            contenido.copyright = contenido.copyright.replace('{{YEAR}}', new Date().getFullYear());
        }

        if (tipo === 'countdown' && contenido.fecha_objetivo === '{{DATE_30_DAYS}}') {
            contenido.fecha_objetivo = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }

        return contenido;
    }
}

module.exports = WebsiteBloquesModel;
