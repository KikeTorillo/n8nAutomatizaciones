/**
 * @fileoverview Modelo de Motivos de Salida
 * @description Manejo de catálogo dinámico de razones de terminación
 * @version 1.0.0
 * @date Enero 2026
 *
 * GAP-001 vs Odoo 19: Catálogo dinámico de razones de terminación
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class MotivoSalidaModel {
    /**
     * Listar motivos de salida disponibles
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros de búsqueda
     * @returns {Promise<Array>} Lista de motivos
     */
    static async listar(organizacionId, filtros = {}) {
        // Usar withBypass porque necesitamos ver tipos del sistema (organizacion_id IS NULL)
        return await RLSContextManager.withBypass(async (db) => {
            const {
                solo_sistema = false,
                solo_personalizados = false,
                activos = true
            } = filtros;

            let whereClauses = ['1 = 1'];
            const whereParams = [];
            let paramIndex = 1;

            // Tipos del sistema (organizacion_id IS NULL) + tipos de la organización
            if (solo_sistema) {
                whereClauses.push('organizacion_id IS NULL');
            } else if (solo_personalizados) {
                whereClauses.push(`organizacion_id = $${paramIndex}`);
                whereParams.push(organizacionId);
                paramIndex++;
            } else {
                whereClauses.push(`(organizacion_id IS NULL OR organizacion_id = $${paramIndex})`);
                whereParams.push(organizacionId);
                paramIndex++;
            }

            if (activos !== undefined) {
                whereClauses.push(`activo = ${activos ? 'true' : 'false'}`);
            }

            const whereSQL = whereClauses.join(' AND ');

            const query = `
                SELECT
                    id,
                    organizacion_id,
                    codigo,
                    nombre,
                    descripcion,
                    es_sistema,
                    requiere_documentacion,
                    requiere_aprobacion,
                    afecta_finiquito,
                    color,
                    icono,
                    orden_display,
                    activo,
                    metadata,
                    creado_en,
                    actualizado_en
                FROM motivos_salida
                WHERE ${whereSQL}
                ORDER BY
                    -- 1. Tipos del sistema primero
                    CASE WHEN organizacion_id IS NULL THEN 0 ELSE 1 END,
                    -- 2. Orden personalizado
                    orden_display ASC,
                    -- 3. Alfabético
                    nombre ASC
            `;

            const result = await db.query(query, whereParams);
            return result.rows;
        });
    }

    /**
     * Obtener estadísticas de uso de motivos
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} Estadísticas de uso
     */
    static async estadisticas(organizacionId) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    ms.id,
                    ms.codigo,
                    ms.nombre,
                    ms.color,
                    COUNT(p.id) as total_empleados,
                    COUNT(p.id) FILTER (WHERE p.fecha_baja >= NOW() - INTERVAL '30 days') as ultimos_30_dias,
                    COUNT(p.id) FILTER (WHERE p.fecha_baja >= NOW() - INTERVAL '90 days') as ultimos_90_dias,
                    COUNT(p.id) FILTER (WHERE p.fecha_baja >= NOW() - INTERVAL '365 days') as ultimo_anio
                FROM motivos_salida ms
                LEFT JOIN profesionales p ON p.motivo_salida_id = ms.id
                    AND p.organizacion_id = COALESCE(ms.organizacion_id, $1)
                WHERE (ms.organizacion_id IS NULL OR ms.organizacion_id = $1)
                    AND ms.activo = true
                GROUP BY ms.id, ms.codigo, ms.nombre, ms.color
                ORDER BY total_empleados DESC, ms.orden_display ASC
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }

    /**
     * Buscar motivo por ID
     * @param {number} organizacionId - ID de la organización
     * @param {number} motivoId - ID del motivo
     * @returns {Promise<Object|null>} Motivo encontrado o null
     */
    static async buscarPorId(organizacionId, motivoId) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT *
                FROM motivos_salida
                WHERE id = $1
                    AND (organizacion_id = $2 OR organizacion_id IS NULL)
                LIMIT 1
            `;

            const result = await db.query(query, [motivoId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener motivo por código
     * @param {number} organizacionId - ID de la organización
     * @param {string} codigo - Código del motivo
     * @returns {Promise<Object|null>} Motivo encontrado o null
     */
    static async obtenerPorCodigo(organizacionId, codigo) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT *
                FROM motivos_salida
                WHERE codigo = $1
                    AND (organizacion_id = $2 OR organizacion_id IS NULL)
                    AND activo = true
                LIMIT 1
            `;

            const result = await db.query(query, [codigo, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Crear nuevo motivo personalizado
     * @param {number} organizacionId - ID de la organización
     * @param {Object} motivoData - Datos del motivo
     * @returns {Promise<Object>} Motivo creado
     */
    static async crear(organizacionId, motivoData) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                codigo,
                nombre,
                descripcion = '',
                requiere_documentacion = false,
                requiere_aprobacion = false,
                afecta_finiquito = true,
                color = '#6B7280',
                icono = 'log-out',
                orden_display = 999
            } = motivoData;

            const query = `
                INSERT INTO motivos_salida (
                    organizacion_id,
                    codigo,
                    nombre,
                    descripcion,
                    requiere_documentacion,
                    requiere_aprobacion,
                    afecta_finiquito,
                    color,
                    icono,
                    orden_display,
                    metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

            const result = await db.query(query, [
                organizacionId,
                codigo,
                nombre,
                descripcion,
                requiere_documentacion,
                requiere_aprobacion,
                afecta_finiquito,
                color,
                icono,
                orden_display,
                JSON.stringify({ creado_por: 'API' })
            ]);

            return result.rows[0];
        });
    }

    /**
     * Actualizar motivo personalizado
     * @param {number} organizacionId - ID de la organización
     * @param {number} motivoId - ID del motivo
     * @param {Object} motivoData - Datos a actualizar
     * @returns {Promise<Object|null>} Motivo actualizado o null
     */
    static async actualizar(organizacionId, motivoId, motivoData) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const validFields = [
                'nombre',
                'descripcion',
                'requiere_documentacion',
                'requiere_aprobacion',
                'afecta_finiquito',
                'color',
                'icono',
                'orden_display',
                'activo'
            ];

            const updates = [];
            const values = [];
            let index = 1;

            // Solo se pueden actualizar motivos no del sistema
            const whereClause = 'id = $1 AND organizacion_id = $2 AND es_sistema = false';
            values.push(motivoId, organizacionId);

            for (const [field, value] of Object.entries(motivoData)) {
                if (validFields.includes(field) && value !== undefined) {
                    updates.push(`${field} = $${index + 2}`);
                    values.push(value);
                    index++;
                }
            }

            if (updates.length === 0) {
                return null;
            }

            updates.push('actualizado_en = NOW()');
            updates.push("metadata = COALESCE(metadata, '{}')::jsonb || jsonb_build_object('actualizado_por', 'API', 'actualizado_en', NOW())");

            const query = `
                UPDATE motivos_salida
                SET ${updates.join(', ')}
                WHERE ${whereClause}
                RETURNING *
            `;

            const result = await db.query(query, values);
            return result.rows[0] || null;
        });
    }

    /**
     * Eliminar motivo personalizado
     * @param {number} organizacionId - ID de la organización
     * @param {number} motivoId - ID del motivo
     * @returns {Promise<boolean>} True si fue eliminado
     */
    static async eliminar(organizacionId, motivoId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Solo se pueden eliminar motivos no del sistema y que no estén en uso
            const query = `
                DELETE FROM motivos_salida
                WHERE id = $1
                    AND organizacion_id = $2
                    AND es_sistema = false
                    AND NOT EXISTS (
                        SELECT 1 FROM profesionales
                        WHERE motivo_salida_id = $1
                    )
                RETURNING id
            `;

            const result = await db.query(query, [motivoId, organizacionId]);
            return result.rows.length > 0;
        });
    }

    /**
     * Validar si un motivo está en uso
     * @param {number} motivoId - ID del motivo
     * @returns {Promise<number>} Cantidad de empleados que usan este motivo
     */
    static async estaEnUso(motivoId) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT COUNT(*) as total
                FROM profesionales
                WHERE motivo_salida_id = $1
            `;

            const result = await db.query(query, [motivoId]);
            return parseInt(result.rows[0].total, 10);
        });
    }
}

module.exports = MotivoSalidaModel;
