/**
 * ====================================================================
 * ERP DATA SERVICE
 * ====================================================================
 * Servicio para obtener datos del ERP para el editor de website.
 * Extrae queries de servicios y profesionales del controlador de bloques.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

/**
 * ErpDataService - Obtiene datos del ERP para bloques del website
 */
class ErpDataService {
    /**
     * Obtener servicios del ERP para el bloque de servicios
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros de búsqueda
     * @param {string} [filtros.busqueda] - Búsqueda por nombre/descripción
     * @param {string} [filtros.categoria] - Filtrar por categoría
     * @param {number} [filtros.limite=100] - Límite de resultados
     * @returns {Promise<{servicios: Array, categorias: Array}>}
     */
    static async obtenerServicios(organizacionId, filtros = {}) {
        const { busqueda, categoria, limite = 100 } = filtros;

        return await RLSContextManager.query(organizacionId, async (db) => {
            // Construir query de servicios
            let query = `
                SELECT id, nombre, descripcion, precio, duracion_minutos,
                       imagen_url, categoria, color_servicio
                FROM servicios
                WHERE activo = true AND eliminado_en IS NULL
            `;
            const params = [];
            let paramIndex = 1;

            // Filtro por búsqueda
            if (busqueda) {
                query += ` AND (nombre ILIKE $${paramIndex} OR descripcion ILIKE $${paramIndex})`;
                params.push(`%${busqueda}%`);
                paramIndex++;
            }

            // Filtro por categoría
            if (categoria) {
                query += ` AND categoria = $${paramIndex}`;
                params.push(categoria);
                paramIndex++;
            }

            // Ordenar y limitar
            query += ` ORDER BY nombre ASC LIMIT $${paramIndex}`;
            params.push(limite);

            const servicios = await db.query(query, params);

            // Obtener categorías únicas para los filtros
            const categoriasResult = await db.query(`
                SELECT DISTINCT categoria
                FROM servicios
                WHERE activo = true
                  AND eliminado_en IS NULL
                  AND categoria IS NOT NULL
                ORDER BY categoria
            `);

            return {
                servicios: servicios.rows,
                categorias: categoriasResult.rows.map(r => r.categoria)
            };
        });
    }

    /**
     * Obtener profesionales del ERP para el bloque de equipo
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros de búsqueda
     * @param {string} [filtros.busqueda] - Búsqueda por nombre
     * @param {string} [filtros.departamento_id] - Filtrar por departamento
     * @param {number} [filtros.limite=50] - Límite de resultados
     * @returns {Promise<{profesionales: Array, departamentos: Array}>}
     */
    static async obtenerProfesionales(organizacionId, filtros = {}) {
        const { busqueda, departamento_id, limite = 50 } = filtros;

        return await RLSContextManager.query(organizacionId, async (db) => {
            // Construir query de profesionales con JOINs
            let query = `
                SELECT
                    p.id,
                    p.nombre_completo,
                    p.foto_url,
                    p.biografia,
                    p.email,
                    pu.nombre as puesto_nombre,
                    d.id as departamento_id,
                    d.nombre as departamento_nombre
                FROM profesionales p
                LEFT JOIN puestos pu ON p.puesto_id = pu.id
                LEFT JOIN departamentos d ON p.departamento_id = d.id
                WHERE p.activo = true
                  AND p.estado = 'activo'
                  AND p.eliminado_en IS NULL
            `;
            const params = [];
            let paramIndex = 1;

            // Filtro por búsqueda
            if (busqueda) {
                query += ` AND p.nombre_completo ILIKE $${paramIndex}`;
                params.push(`%${busqueda}%`);
                paramIndex++;
            }

            // Filtro por departamento
            if (departamento_id) {
                query += ` AND p.departamento_id = $${paramIndex}`;
                params.push(departamento_id);
                paramIndex++;
            }

            // Ordenar y limitar
            query += ` ORDER BY p.nombre_completo ASC LIMIT $${paramIndex}`;
            params.push(limite);

            const profesionales = await db.query(query, params);

            // Obtener departamentos únicos para los filtros
            const deptosResult = await db.query(`
                SELECT DISTINCT d.id, d.nombre
                FROM profesionales p
                JOIN departamentos d ON p.departamento_id = d.id
                WHERE p.activo = true
                  AND p.estado = 'activo'
                  AND p.eliminado_en IS NULL
                ORDER BY d.nombre
            `);

            return {
                profesionales: profesionales.rows,
                departamentos: deptosResult.rows
            };
        });
    }

    /**
     * Obtener resumen de datos ERP disponibles
     * Útil para mostrar al usuario qué módulos están configurados
     *
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>}
     */
    static async obtenerResumenDisponible(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Contar servicios activos
            const serviciosCount = await db.query(`
                SELECT COUNT(*) as total
                FROM servicios
                WHERE activo = true AND eliminado_en IS NULL
            `);

            // Contar profesionales activos
            const profesionalesCount = await db.query(`
                SELECT COUNT(*) as total
                FROM profesionales
                WHERE activo = true AND estado = 'activo' AND eliminado_en IS NULL
            `);

            // Contar reseñas (para testimonios)
            const resenasCount = await db.query(`
                SELECT COUNT(*) as total
                FROM resenas
                WHERE activo = true AND aprobada = true
            `).catch((err) => {
                // Tabla puede no existir o no tener permisos
                console.warn('[ErpDataService.obtenerResumenDisponible] Error contando reseñas:', err.message);
                return { rows: [{ total: 0 }] };
            });

            return {
                servicios: {
                    disponible: parseInt(serviciosCount.rows[0]?.total || 0) > 0,
                    total: parseInt(serviciosCount.rows[0]?.total || 0)
                },
                profesionales: {
                    disponible: parseInt(profesionalesCount.rows[0]?.total || 0) > 0,
                    total: parseInt(profesionalesCount.rows[0]?.total || 0)
                },
                resenas: {
                    disponible: parseInt(resenasCount.rows[0]?.total || 0) > 0,
                    total: parseInt(resenasCount.rows[0]?.total || 0)
                }
            };
        });
    }
}

module.exports = ErpDataService;
