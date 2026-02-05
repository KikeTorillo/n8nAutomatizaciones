/**
 * @fileoverview Modelo de Categorías de Pago
 * @description Manejo de catálogo de categorías para clasificación de empleados
 * @version 1.0.1
 * @date Enero 2026
 *
 * Clasificación de empleados para compensación
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class CategoriaPagoModel {
    /**
     * Listar categorías de pago
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros de búsqueda
     * @returns {Promise<Array>} Lista de categorías
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                solo_activas = true,
                nivel_minimo = null,
                nivel_maximo = null,
                permite_comisiones = null,
                permite_bonos = null,
                permite_viaticos = null
            } = filtros;

            let whereClauses = ['organizacion_id = $1'];
            const whereParams = [organizacionId];

            if (solo_activas) {
                whereClauses.push('activo = true');
            }

            if (nivel_minimo !== null) {
                whereClauses.push(`nivel_salarial >= $${whereParams.length + 1}`);
                whereParams.push(nivel_minimo);
            }

            if (nivel_maximo !== null) {
                whereClauses.push(`nivel_salarial <= $${whereParams.length + 1}`);
                whereParams.push(nivel_maximo);
            }

            if (permite_comisiones !== null) {
                whereClauses.push(`permite_comisiones = $${whereParams.length + 1}`);
                whereParams.push(permite_comisiones);
            }

            if (permite_bonos !== null) {
                whereClauses.push(`permite_bonos = $${whereParams.length + 1}`);
                whereParams.push(permite_bonos);
            }

            if (permite_viaticos !== null) {
                whereClauses.push(`permite_viaticos = $${whereParams.length + 1}`);
                whereParams.push(permite_viaticos);
            }

            const whereSQL = whereClauses.join(' AND ');

            const query = `
                SELECT
                    id,
                    organizacion_id,
                    codigo,
                    nombre,
                    descripcion,
                    nivel_salarial,
                    permite_comisiones,
                    permite_bonos,
                    permite_viaticos,
                    permite_horas_extra,
                    exento_impuestos,
                    salario_minimo,
                    salario_maximo,
                    moneda,
                    dias_vacaciones_extra,
                    porcentaje_aguinaldo,
                    fondo_ahorro,
                    color,
                    icono,
                    orden,
                    activo,
                    metadata,
                    creado_en,
                    actualizado_en
                FROM categorias_pago
                WHERE ${whereSQL}
                ORDER BY orden ASC, nivel_salarial DESC, nombre ASC
            `;

            const result = await db.query(query, whereParams);
            return result.rows;
        });
    }

    /**
     * Buscar categoría por ID
     * @param {number} organizacionId - ID de la organización
     * @param {number} categoriaId - ID de la categoría
     * @returns {Promise<Object|null>} Categoría encontrada o null
     */
    static async buscarPorId(organizacionId, categoriaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT *
                FROM categorias_pago
                WHERE id = $1 AND organizacion_id = $2
                LIMIT 1
            `;

            const result = await db.query(query, [categoriaId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Buscar categoría por código
     * @param {number} organizacionId - ID de la organización
     * @param {string} codigo - Código de la categoría
     * @returns {Promise<Object|null>} Categoría encontrada o null
     */
    static async buscarPorCodigo(organizacionId, codigo) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT *
                FROM categorias_pago
                WHERE organizacion_id = $1 AND codigo = $2 AND activo = true
                LIMIT 1
            `;

            const result = await db.query(query, [organizacionId, codigo]);
            return result.rows[0] || null;
        });
    }

    /**
     * Crear nueva categoría de pago
     * @param {number} organizacionId - ID de la organización
     * @param {Object} categoriaData - Datos de la categoría
     * @returns {Promise<Object>} Categoría creada
     */
    static async crear(organizacionId, categoriaData) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                codigo,
                nombre,
                descripcion = '',
                nivel_salarial = 1,
                permite_comisiones = true,
                permite_bonos = false,
                permite_viaticos = false,
                permite_horas_extra = true,
                exento_impuestos = false,
                salario_minimo = null,
                salario_maximo = null,
                moneda = 'MXN',
                dias_vacaciones_extra = 0,
                porcentaje_aguinaldo = 15.0,
                fondo_ahorro = 0,
                color = '#753572',
                icono = 'wallet',
                orden = 0
            } = categoriaData;

            const query = `
                INSERT INTO categorias_pago (
                    organizacion_id,
                    codigo,
                    nombre,
                    descripcion,
                    nivel_salarial,
                    permite_comisiones,
                    permite_bonos,
                    permite_viaticos,
                    permite_horas_extra,
                    exento_impuestos,
                    salario_minimo,
                    salario_maximo,
                    moneda,
                    dias_vacaciones_extra,
                    porcentaje_aguinaldo,
                    fondo_ahorro,
                    color,
                    icono,
                    orden,
                    metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                RETURNING *
            `;

            const result = await db.query(query, [
                organizacionId,
                codigo,
                nombre,
                descripcion,
                nivel_salarial,
                permite_comisiones,
                permite_bonos,
                permite_viaticos,
                permite_horas_extra,
                exento_impuestos,
                salario_minimo,
                salario_maximo,
                moneda,
                dias_vacaciones_extra,
                porcentaje_aguinaldo,
                fondo_ahorro,
                color,
                icono,
                orden,
                JSON.stringify({ creado_por: 'API' })
            ]);

            return result.rows[0];
        });
    }

    /**
     * Actualizar categoría de pago
     * @param {number} organizacionId - ID de la organización
     * @param {number} categoriaId - ID de la categoría
     * @param {Object} categoriaData - Datos a actualizar
     * @returns {Promise<Object|null>} Categoría actualizada o null
     */
    static async actualizar(organizacionId, categoriaId, categoriaData) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const validFields = [
                'nombre',
                'descripcion',
                'nivel_salarial',
                'permite_comisiones',
                'permite_bonos',
                'permite_viaticos',
                'permite_horas_extra',
                'exento_impuestos',
                'salario_minimo',
                'salario_maximo',
                'moneda',
                'dias_vacaciones_extra',
                'porcentaje_aguinaldo',
                'fondo_ahorro',
                'color',
                'icono',
                'orden',
                'activo'
            ];

            const updates = [];
            const values = [];
            let index = 1;

            const whereClause = 'id = $1 AND organizacion_id = $2';
            values.push(categoriaId, organizacionId);

            for (const [field, value] of Object.entries(categoriaData)) {
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
                UPDATE categorias_pago
                SET ${updates.join(', ')}
                WHERE ${whereClause}
                RETURNING *
            `;

            const result = await db.query(query, values);
            return result.rows[0] || null;
        });
    }

    /**
     * Eliminar categoría de pago
     * @param {number} organizacionId - ID de la organización
     * @param {number} categoriaId - ID de la categoría
     * @returns {Promise<boolean>} True si fue eliminada
     */
    static async eliminar(organizacionId, categoriaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Solo se pueden eliminar categorías que no estén en uso
            const query = `
                DELETE FROM categorias_pago
                WHERE id = $1
                    AND organizacion_id = $2
                    AND NOT EXISTS (
                        SELECT 1 FROM profesionales
                        WHERE categoria_pago_id = $1
                    )
                RETURNING id
            `;

            const result = await db.query(query, [categoriaId, organizacionId]);
            return result.rows.length > 0;
        });
    }

    /**
     * Validar si una categoría está en uso
     * @param {number} categoriaId - ID de la categoría
     * @returns {Promise<number>} Cantidad de empleados en esta categoría
     */
    static async estaEnUso(categoriaId) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT COUNT(*) as total
                FROM profesionales
                WHERE categoria_pago_id = $1
            `;

            const result = await db.query(query, [categoriaId]);
            return parseInt(result.rows[0].total, 10);
        });
    }

    /**
     * Obtener estadísticas de empleados por categoría
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} Estadísticas por categoría
     */
    static async estadisticas(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    cp.id,
                    cp.codigo,
                    cp.nombre,
                    cp.color,
                    cp.nivel_salarial,
                    COUNT(p.id) as total_empleados,
                    COUNT(p.id) FILTER (WHERE p.activo = true) as empleados_activos,
                    COUNT(p.id) FILTER (WHERE p.activo = false) as empleados_inactivos,
                    COALESCE(AVG(p.salario_base), 0) as salario_promedio,
                    MIN(p.salario_base) as salario_minimo_real,
                    MAX(p.salario_base) as salario_maximo_real
                FROM categorias_pago cp
                LEFT JOIN profesionales p ON p.categoria_pago_id = cp.id
                    AND p.organizacion_id = cp.organizacion_id
                WHERE cp.organizacion_id = $1
                    AND cp.activo = true
                GROUP BY cp.id, cp.codigo, cp.nombre, cp.color, cp.nivel_salarial
                ORDER BY cp.nivel_salarial DESC, total_empleados DESC
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }

    /**
     * Obtener opciones para select/dropdown
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} Opciones simplificadas
     */
    static async obtenerOpciones(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    id as value,
                    nombre as label,
                    color,
                    icono,
                    nivel_salarial
                FROM categorias_pago
                WHERE organizacion_id = $1 AND activo = true
                ORDER BY orden ASC, nivel_salarial DESC
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }
}

module.exports = CategoriaPagoModel;
