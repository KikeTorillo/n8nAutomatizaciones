/**
 * CuentaBancariaModel - Enero 2026
 * Gestión de cuentas bancarias de empleados para nómina y reembolsos
 * Fase 1 del Plan de Empleados Competitivo
 */
const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');

class CuentaBancariaModel {

    /**
     * Crea una nueva cuenta bancaria
     * @param {Object} data - Datos de la cuenta
     * @returns {Promise<Object>} Cuenta creada
     */
    static async crear(data) {
        return await RLSContextManager.query(data.organizacion_id, async (db) => {
            const query = `
                INSERT INTO cuentas_bancarias_empleado (
                    organizacion_id, profesional_id,
                    banco, numero_cuenta, clabe, tipo_cuenta, moneda,
                    titular_nombre, titular_documento,
                    es_principal, uso,
                    creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `;

            const values = [
                data.organizacion_id,
                data.profesional_id,
                data.banco,
                data.numero_cuenta,
                data.clabe || null,
                data.tipo_cuenta || 'debito',
                data.moneda || 'MXN',
                data.titular_nombre || null,
                data.titular_documento || null,
                data.es_principal || false,
                data.uso || 'nomina',
                data.creado_por || null
            ];

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                if (error.code === '23503') {
                    if (error.constraint?.includes('profesional')) {
                        ErrorHelper.throwValidation('El profesional especificado no existe');
                    }
                }
                if (error.code === '23514') {
                    if (error.constraint?.includes('clabe')) {
                        ErrorHelper.throwValidation('La CLABE debe tener exactamente 18 dígitos');
                    }
                    if (error.constraint?.includes('banco')) {
                        ErrorHelper.throwValidation('El nombre del banco debe tener al menos 2 caracteres');
                    }
                }
                throw error;
            }
        });
    }

    /**
     * Lista cuentas bancarias de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de cuentas
     */
    static async listarPorProfesional(organizacionId, profesionalId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                uso = null,
                activo = true,
                limit = 20,
                offset = 0
            } = filtros;

            let query = `
                SELECT
                    cb.*,
                    uc.nombre as creado_por_nombre
                FROM cuentas_bancarias_empleado cb
                LEFT JOIN usuarios uc ON uc.id = cb.creado_por
                WHERE cb.organizacion_id = $1
                    AND cb.profesional_id = $2
                    AND cb.eliminado_en IS NULL
            `;

            const values = [organizacionId, profesionalId];
            let contador = 3;

            if (activo !== null) {
                query += ` AND cb.activo = $${contador}`;
                values.push(activo);
                contador++;
            }

            if (uso) {
                query += ` AND cb.uso = $${contador}`;
                values.push(uso);
                contador++;
            }

            // Principal primero, luego por fecha de creación
            query += ` ORDER BY cb.es_principal DESC, cb.creado_en DESC`;
            query += ` LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limit, offset);

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Obtiene una cuenta bancaria por su ID
     * @param {number} organizacionId - ID de la organización
     * @param {number} cuentaId - ID de la cuenta
     * @returns {Promise<Object|null>} Cuenta o null
     */
    static async obtenerPorId(organizacionId, cuentaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    cb.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    uc.nombre as creado_por_nombre
                FROM cuentas_bancarias_empleado cb
                JOIN profesionales p ON p.id = cb.profesional_id
                LEFT JOIN usuarios uc ON uc.id = cb.creado_por
                WHERE cb.id = $1
                    AND cb.organizacion_id = $2
                    AND cb.eliminado_en IS NULL
            `;

            const result = await db.query(query, [cuentaId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualiza una cuenta bancaria existente
     * @param {number} organizacionId - ID de la organización
     * @param {number} cuentaId - ID de la cuenta
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object>} Cuenta actualizada
     */
    static async actualizar(organizacionId, cuentaId, datos) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposPermitidos = [
                'banco', 'numero_cuenta', 'clabe', 'tipo_cuenta', 'moneda',
                'titular_nombre', 'titular_documento', 'es_principal', 'uso'
            ];

            const campos = [];
            const valores = [];
            let contador = 1;

            for (const [campo, valor] of Object.entries(datos)) {
                if (camposPermitidos.includes(campo) && valor !== undefined) {
                    campos.push(`${campo} = $${contador}`);
                    valores.push(valor);
                    contador++;
                }
            }

            if (campos.length === 0) {
                ErrorHelper.throwValidation('No hay campos válidos para actualizar');
            }

            const query = `
                UPDATE cuentas_bancarias_empleado
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                    AND eliminado_en IS NULL
                RETURNING *
            `;

            valores.push(cuentaId, organizacionId);

            try {
                const result = await db.query(query, valores);

                ErrorHelper.throwIfNotFound(result.rows[0], 'Cuenta bancaria');
                return result.rows[0];
            } catch (error) {
                if (error.code === '23514') {
                    if (error.constraint?.includes('clabe')) {
                        ErrorHelper.throwValidation('La CLABE debe tener exactamente 18 dígitos');
                    }
                }
                throw error;
            }
        });
    }

    /**
     * Soft delete de una cuenta bancaria
     * @param {number} organizacionId - ID de la organización
     * @param {number} cuentaId - ID de la cuenta
     * @param {number} usuarioId - ID del usuario que elimina
     * @returns {Promise<boolean>} true si se eliminó
     */
    static async eliminar(organizacionId, cuentaId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE cuentas_bancarias_empleado
                SET activo = false,
                    eliminado_en = NOW(),
                    eliminado_por = $3
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
                RETURNING id
            `;

            const result = await db.query(query, [cuentaId, organizacionId, usuarioId]);
            return result.rowCount > 0;
        });
    }

    /**
     * Obtiene la cuenta principal de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @returns {Promise<Object|null>} Cuenta principal o null
     */
    static async obtenerPrincipal(organizacionId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT *
                FROM cuentas_bancarias_empleado
                WHERE organizacion_id = $1
                    AND profesional_id = $2
                    AND es_principal = true
                    AND eliminado_en IS NULL
                    AND activo = true
            `;

            const result = await db.query(query, [organizacionId, profesionalId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Establece una cuenta como principal (desmarca las demás automáticamente via trigger)
     * @param {number} organizacionId - ID de la organización
     * @param {number} cuentaId - ID de la cuenta
     * @returns {Promise<Object>} Cuenta actualizada
     */
    static async establecerPrincipal(organizacionId, cuentaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE cuentas_bancarias_empleado
                SET es_principal = true, actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2 AND eliminado_en IS NULL
                RETURNING *
            `;

            const result = await db.query(query, [cuentaId, organizacionId]);

            ErrorHelper.throwIfNotFound(result.rows[0], 'Cuenta bancaria');
            return result.rows[0];
        });
    }

    /**
     * Cuenta el número de cuentas bancarias de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @returns {Promise<Object>} Conteo de cuentas
     */
    static async contarPorProfesional(organizacionId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE es_principal = true) as principales,
                    COUNT(*) FILTER (WHERE uso = 'nomina') as para_nomina,
                    COUNT(*) FILTER (WHERE uso = 'reembolsos') as para_reembolsos,
                    COUNT(*) FILTER (WHERE uso = 'comisiones') as para_comisiones,
                    COUNT(*) FILTER (WHERE uso = 'todos') as uso_general
                FROM cuentas_bancarias_empleado
                WHERE organizacion_id = $1
                    AND profesional_id = $2
                    AND eliminado_en IS NULL
                    AND activo = true
            `;

            const result = await db.query(query, [organizacionId, profesionalId]);
            const row = result.rows[0];

            return {
                total: parseInt(row.total) || 0,
                principales: parseInt(row.principales) || 0,
                para_nomina: parseInt(row.para_nomina) || 0,
                para_reembolsos: parseInt(row.para_reembolsos) || 0,
                para_comisiones: parseInt(row.para_comisiones) || 0,
                uso_general: parseInt(row.uso_general) || 0
            };
        });
    }

    /**
     * Lista profesionales sin cuenta bancaria principal (para alertas)
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de profesionales sin cuenta principal
     */
    static async listarSinCuentaPrincipal(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { limit = 50, offset = 0 } = filtros;

            const query = `
                SELECT
                    p.id,
                    p.nombre_completo,
                    p.email,
                    p.estado,
                    p.tipo_contratacion,
                    p.fecha_ingreso,
                    (
                        SELECT COUNT(*)
                        FROM cuentas_bancarias_empleado cb
                        WHERE cb.profesional_id = p.id
                            AND cb.eliminado_en IS NULL
                            AND cb.activo = true
                    ) as total_cuentas
                FROM profesionales p
                WHERE p.organizacion_id = $1
                    AND p.eliminado_en IS NULL
                    AND p.activo = true
                    AND p.estado IN ('activo', 'periodo_prueba')
                    AND NOT EXISTS (
                        SELECT 1
                        FROM cuentas_bancarias_empleado cb
                        WHERE cb.profesional_id = p.id
                            AND cb.es_principal = true
                            AND cb.eliminado_en IS NULL
                            AND cb.activo = true
                    )
                ORDER BY p.nombre_completo ASC
                LIMIT $2 OFFSET $3
            `;

            const result = await db.query(query, [organizacionId, limite, offset]);
            return result.rows;
        });
    }

}

module.exports = CuentaBancariaModel;
