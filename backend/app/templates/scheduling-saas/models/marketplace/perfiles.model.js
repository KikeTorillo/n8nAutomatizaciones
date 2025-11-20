const RLSContextManager = require('../../../../utils/rlsContextManager');
const logger = require('../../../../utils/logger');
const PaginationHelper = require('../../../../utils/helpers').PaginationHelper;
const db = require('../../../../config/database');

/**
 * ====================================================================
 * MODEL - PERFILES DE MARKETPLACE
 * ====================================================================
 *
 * Gestiona operaciones CRUD para perfiles públicos de negocios.
 *
 * MÉTODOS:
 * • crear() - Crear perfil con slug auto-generado
 * • actualizar() - Actualizar perfil (requiere RLS)
 * • activar() - Activar/desactivar (super_admin con bypass)
 * • buscar() - Búsqueda pública con full-text search
 * • obtenerPorSlug() - Perfil completo usando función PL/pgSQL
 * • obtenerPorId() - Obtener por ID (requiere RLS)
 * • obtenerPorOrganizacion() - Verificar si org tiene perfil
 * • obtenerEstadisticas() - Stats de analytics
 *
 * Fecha creación: 17 Noviembre 2025
 */
class PerfilesMarketplaceModel {

    /**
     * Crear perfil de marketplace
     * Auto-genera slug único: {ciudad}-{timestamp36}
     *
     * @param {Object} datos - Datos del perfil
     * @returns {Object} Perfil creado
     */
    static async crear(datos) {
        // Generar slug único
        const slug = this._generarSlug(datos.ciudad, datos.organizacion_id);

        // Usar transacción para garantizar atomicidad
        return await RLSContextManager.transaction(datos.organizacion_id, async (db) => {
            const query = `
                INSERT INTO marketplace_perfiles (
                    organizacion_id,
                    slug,
                    ciudad,
                    descripcion_corta,
                    meta_titulo,
                    meta_descripcion,
                    descripcion_larga,
                    pais,
                    estado,
                    codigo_postal,
                    direccion_completa,
                    latitud,
                    longitud,
                    telefono_publico,
                    email_publico,
                    sitio_web,
                    instagram,
                    facebook,
                    tiktok,
                    logo_url,
                    portada_url,
                    galeria_urls,
                    horarios_atencion,
                    visible_en_directorio
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                    $21, $22, $23, $24
                )
                RETURNING *
            `;

            const valores = [
                datos.organizacion_id,
                slug,
                datos.ciudad,
                datos.descripcion_corta,
                datos.meta_titulo || null,
                datos.meta_descripcion || null,
                datos.descripcion_larga || null,
                datos.pais || 'México',
                datos.estado || null,
                datos.codigo_postal || null,
                datos.direccion_completa || null,
                datos.latitud || null,
                datos.longitud || null,
                datos.telefono_publico || null,
                datos.email_publico || null,
                datos.sitio_web || null,
                datos.instagram || null,
                datos.facebook || null,
                datos.tiktok || null,
                datos.logo_url || null,
                datos.portada_url || null,
                datos.galeria_urls ? JSON.stringify(datos.galeria_urls) : '[]',
                datos.horarios_atencion ? JSON.stringify(datos.horarios_atencion) : '{}',
                datos.visible_en_directorio !== undefined ? datos.visible_en_directorio : true
            ];

            logger.info('[PerfilesMarketplaceModel.crear] Creando perfil', {
                organizacion_id: datos.organizacion_id,
                slug,
                ciudad: datos.ciudad
            });

            const result = await db.query(query, valores);

            // Actualizar organizaciones.tiene_perfil_marketplace con bypass RLS
            // Esto es una operación administrativa que debe ejecutarse independientemente de políticas RLS
            await db.query('SELECT set_config($1, $2, true)', ['app.bypass_rls', 'true']);
            await db.query(`
                UPDATE organizaciones
                SET tiene_perfil_marketplace = TRUE,
                    fecha_activacion_marketplace = CASE
                        WHEN fecha_activacion_marketplace IS NULL THEN NOW()
                        ELSE fecha_activacion_marketplace
                    END
                WHERE id = $1
            `, [datos.organizacion_id]);
            await db.query('SELECT set_config($1, $2, true)', ['app.bypass_rls', 'false']);

            return result.rows[0];
        });
    }

    /**
     * Actualizar perfil de marketplace
     *
     * @param {number} id - ID del perfil
     * @param {Object} datos - Datos a actualizar
     * @param {number} organizacionId - ID de la organización (RLS)
     * @returns {Object} Perfil actualizado
     */
    static async actualizar(id, datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const campos = [];
            const valores = [id];
            let paramIndex = 2;

            // Construir SET dinámicamente
            const camposPermitidos = [
                'ciudad', 'descripcion_corta', 'meta_titulo', 'meta_descripcion',
                'descripcion_larga', 'pais', 'estado', 'codigo_postal',
                'direccion_completa', 'latitud', 'longitud', 'telefono_publico',
                'email_publico', 'sitio_web', 'instagram', 'facebook', 'tiktok',
                'logo_url', 'portada_url', 'galeria_urls', 'horarios_atencion',
                'visible_en_directorio'
            ];

            for (const campo of camposPermitidos) {
                if (datos[campo] !== undefined) {
                    // JSONB fields
                    if (campo === 'galeria_urls' || campo === 'horarios_atencion') {
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
                UPDATE marketplace_perfiles
                SET ${campos.join(', ')},
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            logger.info('[PerfilesMarketplaceModel.actualizar] Actualizando perfil', {
                perfil_id: id,
                organizacion_id: organizacionId,
                campos_actualizados: Object.keys(datos)
            });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Activar/Desactivar perfil (solo super_admin)
     * Usa bypass RLS para acceder a cualquier perfil
     *
     * @param {number} id - ID del perfil
     * @param {boolean} activo - Estado de activación
     * @returns {Object} Perfil actualizado
     */
    static async activar(id, activo) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                UPDATE marketplace_perfiles
                SET activo = $1,
                    publicado_en = CASE
                        WHEN $1 = true AND publicado_en IS NULL THEN NOW()
                        ELSE publicado_en
                    END,
                    actualizado_en = NOW()
                WHERE id = $2
                RETURNING *
            `;

            logger.info('[PerfilesMarketplaceModel.activar] Cambiando estado de perfil', {
                perfil_id: id,
                activo
            });

            const result = await db.query(query, [activo, id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Búsqueda pública de perfiles
     * Usa full-text search en español + filtros geográficos
     *
     * @param {Object} filtros - Filtros de búsqueda
     * @returns {Object} {perfiles, paginacion}
     */
    static async buscar(filtros) {
        return await RLSContextManager.withBypass(async (db) => {
            let whereConditions = [
                'activo = true',
                'visible_en_directorio = true'
            ];
            let queryParams = [];
            let paramIndex = 1;

            // Full-text search
            if (filtros.q) {
                whereConditions.push(`search_vector @@ plainto_tsquery('spanish', $${paramIndex})`);
                queryParams.push(filtros.q);
                paramIndex++;
            }

            // Filtros geográficos
            if (filtros.ciudad) {
                whereConditions.push(`LOWER(ciudad) = LOWER($${paramIndex})`);
                queryParams.push(filtros.ciudad);
                paramIndex++;
            }

            if (filtros.estado) {
                whereConditions.push(`LOWER(estado) = LOWER($${paramIndex})`);
                queryParams.push(filtros.estado);
                paramIndex++;
            }

            if (filtros.pais) {
                whereConditions.push(`LOWER(pais) = LOWER($${paramIndex})`);
                queryParams.push(filtros.pais);
                paramIndex++;
            }

            // Filtro de rating
            if (filtros.rating_minimo) {
                whereConditions.push(`rating_promedio >= $${paramIndex}`);
                queryParams.push(filtros.rating_minimo);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            // Contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM marketplace_perfiles
                WHERE ${whereClause}
            `;

            const countResult = await db.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);

            // Determinar ordenamiento
            let orderBy = 'rating_promedio DESC, total_reseñas DESC'; // default: rating
            switch (filtros.orden) {
                case 'reseñas':
                    orderBy = 'total_reseñas DESC, rating_promedio DESC';
                    break;
                case 'reciente':
                    orderBy = 'publicado_en DESC NULLS LAST, creado_en DESC';
                    break;
                case 'alfabetico':
                    orderBy = 'ciudad ASC';
                    break;
            }

            // Paginación
            const { limit, offset } = PaginationHelper.calculatePagination(
                filtros.pagina || 1,
                filtros.limite || 12
            );

            // Query principal
            const query = `
                SELECT mp.*
                FROM marketplace_perfiles mp
                WHERE ${whereClause}
                ORDER BY ${orderBy}
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(limit, offset);

            logger.info('[PerfilesMarketplaceModel.buscar] Búsqueda pública', {
                filtros,
                total,
                limite: limit,
                offset
            });

            const result = await db.query(query, queryParams);

            return {
                perfiles: result.rows,
                paginacion: PaginationHelper.getPaginationInfo(
                    total,
                    filtros.pagina || 1,
                    filtros.limite || 12
                )
            };
        });
    }

    /**
     * Obtener perfil completo por slug (público)
     * Usa función PL/pgSQL optimizada con CTEs
     *
     * @param {string} slug - Slug del perfil
     * @returns {Object} Perfil completo con servicios, profesionales, reseñas y stats
     */
    static async obtenerPorSlug(slug) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT * FROM obtener_perfil_publico_por_slug($1)
            `;

            logger.info('[PerfilesMarketplaceModel.obtenerPorSlug] Obteniendo perfil por slug', {
                slug
            });

            const result = await db.query(query, [slug]);

            if (result.rows.length === 0) {
                return null;
            }

            // La función retorna un solo row con todas las columnas
            return result.rows[0];
        });
    }

    /**
     * Obtener perfil por ID (requiere RLS)
     *
     * @param {number} id - ID del perfil
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Perfil
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT mp.*
                FROM marketplace_perfiles mp
                WHERE mp.id = $1
            `;

            logger.info('[PerfilesMarketplaceModel.obtenerPorId] Obteniendo perfil', {
                perfil_id: id,
                organizacion_id: organizacionId
            });

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener perfil por organizacion_id
     * Usado para validar si ya existe perfil
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Object|null} Perfil o null
     */
    static async obtenerPorOrganizacion(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT * FROM marketplace_perfiles
                WHERE organizacion_id = $1
            `;

            logger.info('[PerfilesMarketplaceModel.obtenerPorOrganizacion] Verificando perfil existente', {
                organizacion_id: organizacionId
            });

            const result = await db.query(query, [organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener estadísticas de analytics del perfil
     *
     * @param {number} id - ID del perfil
     * @param {Object} filtros - Filtros de fecha
     * @returns {Object} Estadísticas
     */
    static async obtenerEstadisticas(id, filtros = {}) {
        return await RLSContextManager.withBypass(async (db) => {
            // Obtener organizacion_id del perfil
            const perfilQuery = await db.query(
                'SELECT organizacion_id FROM marketplace_perfiles WHERE id = $1',
                [id]
            );

            if (perfilQuery.rows.length === 0) {
                return null;
            }

            const organizacionId = perfilQuery.rows[0].organizacion_id;

            let whereConditions = ['organizacion_id = $1'];
            let queryParams = [organizacionId];
            let paramIndex = 2;

            if (filtros.fecha_inicio) {
                whereConditions.push(`fecha >= $${paramIndex}`);
                queryParams.push(filtros.fecha_inicio);
                paramIndex++;
            }

            if (filtros.fecha_fin) {
                whereConditions.push(`fecha <= $${paramIndex}`);
                queryParams.push(filtros.fecha_fin);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT
                    COUNT(*) FILTER (WHERE evento_tipo = 'vista_perfil') as total_vistas,
                    COUNT(*) FILTER (WHERE evento_tipo = 'clic_agendar') as clics_agendar,
                    COUNT(*) FILTER (WHERE evento_tipo = 'clic_telefono') as clics_telefono,
                    COUNT(*) FILTER (WHERE evento_tipo = 'clic_sitio_web') as clics_sitio_web,
                    COUNT(*) FILTER (WHERE evento_tipo = 'clic_instagram') as clics_instagram,
                    COUNT(*) FILTER (WHERE evento_tipo = 'clic_facebook') as clics_facebook,
                    COUNT(DISTINCT ip_hash) as visitantes_unicos,
                    COUNT(DISTINCT DATE(creado_en)) as dias_activos
                FROM marketplace_analytics
                WHERE ${whereClause}
            `;

            logger.info('[PerfilesMarketplaceModel.obtenerEstadisticas] Obteniendo estadísticas', {
                perfil_id: id,
                organizacion_id: organizacionId,
                filtros
            });

            const result = await db.query(query, queryParams);
            const stats = result.rows[0];

            // Calcular tasa de conversión
            const totalVistas = parseInt(stats.total_vistas) || 0;
            const totalClicsAgendar = parseInt(stats.clics_agendar) || 0;
            const tasaConversion = totalVistas > 0
                ? ((totalClicsAgendar / totalVistas) * 100).toFixed(2)
                : '0.00';

            return {
                ...stats,
                tasa_conversion: tasaConversion
            };
        });
    }

    /**
     * Listar TODOS los perfiles para super admin
     * Usa bypass RLS para acceder a perfiles activos e inactivos
     * Incluye datos de organización (nombre, plan, estado)
     *
     * @param {Object} filtros - { activo, ciudad, rating_min, pagina, limite }
     * @returns {Object} { perfiles, paginacion }
     */
    static async listarTodosParaAdmin(filtros = {}) {
        return await RLSContextManager.withBypass(async (db) => {
            let whereConditions = [];
            let queryParams = [];
            let paramIndex = 1;

            // Filtro por estado activo (opcional)
            if (filtros.activo !== undefined && filtros.activo !== null) {
                whereConditions.push(`mp.activo = $${paramIndex}`);
                queryParams.push(filtros.activo);
                paramIndex++;
            }

            // Filtro por ciudad (opcional)
            if (filtros.ciudad) {
                whereConditions.push(`LOWER(mp.ciudad) = LOWER($${paramIndex})`);
                queryParams.push(filtros.ciudad);
                paramIndex++;
            }

            // Filtro de rating mínimo (opcional)
            if (filtros.rating_min) {
                whereConditions.push(`mp.rating_promedio >= $${paramIndex}`);
                queryParams.push(filtros.rating_min);
                paramIndex++;
            }

            const whereClause = whereConditions.length > 0
                ? 'WHERE ' + whereConditions.join(' AND ')
                : '';

            // Contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM marketplace_perfiles mp
                ${whereClause}
            `;

            const countResult = await db.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);

            // Paginación
            const { limit, offset } = PaginationHelper.calculatePagination(
                filtros.pagina || 1,
                filtros.limite || 20
            );

            // Query principal con JOIN a organizaciones
            const query = `
                SELECT
                    mp.id,
                    mp.organizacion_id,
                    mp.slug,
                    mp.ciudad,
                    mp.estado,
                    mp.pais,
                    mp.descripcion_corta,
                    mp.rating_promedio,
                    mp.total_reseñas,
                    mp.activo,
                    mp.visible_en_directorio,
                    mp.creado_en,
                    mp.publicado_en,
                    mp.actualizado_en,
                    -- Datos de la organización
                    o.nombre_comercial,
                    o.categoria_id,
                    o.activo as org_activa,
                    o.plan_actual as plan_nombre,
                    CASE o.plan_actual
                        WHEN 'trial' THEN 0
                        WHEN 'basico' THEN 1
                        WHEN 'profesional' THEN 2
                        WHEN 'custom' THEN 3
                        ELSE 0
                    END as nivel_plan
                FROM marketplace_perfiles mp
                INNER JOIN organizaciones o ON mp.organizacion_id = o.id
                ${whereClause}
                ORDER BY mp.creado_en DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(limit, offset);

            logger.info('[PerfilesMarketplaceModel.listarTodosParaAdmin] Listando perfiles para admin', {
                filtros,
                total,
                limite: limit,
                offset
            });

            const result = await db.query(query, queryParams);

            return {
                perfiles: result.rows,
                paginacion: PaginationHelper.getPaginationInfo(
                    total,
                    filtros.pagina || 1,
                    filtros.limite || 20
                )
            };
        });
    }

    /**
     * Generar slug único para el perfil
     * Formato: {ciudad}-{timestamp36}
     *
     * @param {string} ciudad - Ciudad del negocio
     * @param {number} organizacionId - ID organización (para logging)
     * @returns {string} Slug único
     * @private
     */
    static _generarSlug(ciudad, organizacionId) {
        // Normalizar ciudad: lowercase + reemplazar espacios/acentos
        const ciudadNormalizada = ciudad
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/[^a-z0-9]+/g, '-')     // Reemplazar no-alfanuméricos con guión
            .replace(/^-+|-+$/g, '');        // Remover guiones al inicio/fin

        // Timestamp en base36 (más corto)
        const timestamp36 = Date.now().toString(36);

        const slug = `${ciudadNormalizada}-${timestamp36}`;

        logger.info('[PerfilesMarketplaceModel._generarSlug] Slug generado', {
            organizacion_id: organizacionId,
            ciudad,
            slug
        });

        return slug;
    }
}

module.exports = PerfilesMarketplaceModel;
