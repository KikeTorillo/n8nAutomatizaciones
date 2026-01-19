/**
 * NivelesVacacionesModel - Enero 2026
 * Gestión de niveles de vacaciones por antigüedad
 * Fase 3 del Plan de Empleados Competitivo
 * Ventaja competitiva: Escalas configurables según LFT México
 */
const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');
const { NIVELES_LFT_MEXICO } = require('../constants/vacaciones.constants');

class NivelesVacacionesModel {

    /**
     * Lista todos los niveles de una organización
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>} Lista de niveles
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { activo = null } = filtros;

            let query = `
                SELECT *
                FROM niveles_vacaciones
                WHERE organizacion_id = $1
            `;
            const values = [organizacionId];
            let contador = 2;

            if (activo !== null) {
                query += ` AND activo = $${contador}`;
                values.push(activo);
                contador++;
            }

            query += ` ORDER BY orden ASC, anios_minimos ASC`;

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Obtiene un nivel específico
     * @param {number} organizacionId - ID de la organización
     * @param {number} nivelId - ID del nivel
     * @returns {Promise<Object|null>} Nivel o null
     */
    static async obtenerPorId(organizacionId, nivelId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT *
                FROM niveles_vacaciones
                WHERE id = $1
                  AND organizacion_id = $2
            `;

            const result = await db.query(query, [nivelId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtiene el nivel correspondiente a ciertos años de antigüedad
     * @param {number} organizacionId - ID de la organización
     * @param {number} aniosAntiguedad - Años de servicio
     * @returns {Promise<Object|null>} Nivel correspondiente
     */
    static async obtenerPorAntiguedad(organizacionId, aniosAntiguedad) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT *
                FROM niveles_vacaciones
                WHERE organizacion_id = $1
                  AND activo = true
                  AND $2 >= anios_minimos
                  AND (anios_maximos IS NULL OR $2 < anios_maximos)
                ORDER BY anios_minimos DESC
                LIMIT 1
            `;

            const result = await db.query(query, [organizacionId, aniosAntiguedad]);
            return result.rows[0] || null;
        });
    }

    /**
     * Calcula los días de vacaciones para un profesional según su antigüedad
     * @param {number} organizacionId - ID de la organización
     * @param {Date} fechaIngreso - Fecha de ingreso del profesional
     * @returns {Promise<number>} Días de vacaciones correspondientes
     */
    static async calcularDiasPorAntiguedad(organizacionId, fechaIngreso) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT calcular_dias_por_antiguedad($1, $2) as dias`;
            const result = await db.query(query, [organizacionId, fechaIngreso]);
            return result.rows[0]?.dias || 15;
        });
    }

    /**
     * Obtiene información del nivel actual de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @returns {Promise<Object|null>} Información del nivel
     */
    static async obtenerNivelProfesional(organizacionId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT * FROM obtener_nivel_vacaciones($1, $2)`;
            const result = await db.query(query, [organizacionId, profesionalId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Crea un nuevo nivel de vacaciones
     * @param {number} organizacionId - ID de la organización
     * @param {Object} data - Datos del nivel
     * @param {number} usuarioId - ID del usuario que crea
     * @returns {Promise<Object>} Nivel creado
     */
    static async crear(organizacionId, data, usuarioId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO niveles_vacaciones (
                    organizacion_id,
                    nombre,
                    descripcion,
                    anios_minimos,
                    anios_maximos,
                    dias_anuales,
                    dias_extra_por_anio,
                    orden,
                    creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.nombre,
                data.descripcion || null,
                data.anios_minimos,
                data.anios_maximos || null,
                data.dias_anuales,
                data.dias_extra_por_anio ?? 0,
                data.orden ?? 0,
                usuarioId,
            ];

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                if (error.code === '23505') {
                    ErrorHelper.throwConflict(`Ya existe un nivel con el nombre "${data.nombre}"`);
                }
                throw error;
            }
        });
    }

    /**
     * Actualiza un nivel existente
     * @param {number} organizacionId - ID de la organización
     * @param {number} nivelId - ID del nivel
     * @param {Object} data - Datos a actualizar
     * @returns {Promise<Object|null>} Nivel actualizado
     */
    static async actualizar(organizacionId, nivelId, data) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposActualizables = [
                'nombre',
                'descripcion',
                'anios_minimos',
                'anios_maximos',
                'dias_anuales',
                'dias_extra_por_anio',
                'activo',
                'orden',
            ];

            const setClauses = [];
            const values = [nivelId, organizacionId];
            let contador = 3;

            for (const campo of camposActualizables) {
                if (data[campo] !== undefined) {
                    setClauses.push(`${campo} = $${contador}`);
                    values.push(data[campo]);
                    contador++;
                }
            }

            if (setClauses.length === 0) {
                return await this.obtenerPorId(organizacionId, nivelId);
            }

            const query = `
                UPDATE niveles_vacaciones
                SET ${setClauses.join(', ')}
                WHERE id = $1
                  AND organizacion_id = $2
                RETURNING *
            `;

            try {
                const result = await db.query(query, values);
                return result.rows[0] || null;
            } catch (error) {
                if (error.code === '23505') {
                    ErrorHelper.throwConflict(`Ya existe un nivel con el nombre "${data.nombre}"`);
                }
                throw error;
            }
        });
    }

    /**
     * Elimina un nivel (soft delete - lo desactiva)
     * @param {number} organizacionId - ID de la organización
     * @param {number} nivelId - ID del nivel
     * @returns {Promise<boolean>} true si se eliminó
     */
    static async eliminar(organizacionId, nivelId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE niveles_vacaciones
                SET activo = false
                WHERE id = $1
                  AND organizacion_id = $2
                RETURNING id
            `;

            const result = await db.query(query, [nivelId, organizacionId]);
            return result.rows.length > 0;
        });
    }

    /**
     * Crea niveles predefinidos según el país (LFT México o Colombia)
     * @param {number} organizacionId - ID de la organización
     * @param {string} pais - 'mexico' o 'colombia'
     * @param {boolean} sobrescribir - Si elimina niveles existentes
     * @returns {Promise<Array>} Niveles creados
     */
    static async crearNivelesPreset(organizacionId, pais, sobrescribir = false) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Si sobrescribir, eliminar niveles existentes
            if (sobrescribir) {
                await db.query(
                    `DELETE FROM niveles_vacaciones WHERE organizacion_id = $1`,
                    [organizacionId]
                );
            } else {
                // Verificar si ya existen niveles
                const existentes = await db.query(
                    `SELECT COUNT(*) FROM niveles_vacaciones WHERE organizacion_id = $1`,
                    [organizacionId]
                );
                if (parseInt(existentes.rows[0].count) > 0) {
                    ErrorHelper.throwConflict('Ya existen niveles configurados. Use sobrescribir=true para reemplazarlos.');
                }
            }

            // Usar función SQL según país
            if (pais === 'mexico') {
                await db.query(`SELECT crear_niveles_lft_mexico($1)`, [organizacionId]);
            } else if (pais === 'colombia') {
                await db.query(`SELECT crear_niveles_colombia($1)`, [organizacionId]);
            } else {
                ErrorHelper.throwValidation('País no soportado. Use "mexico" o "colombia".');
            }

            // Retornar niveles creados
            const result = await db.query(
                `SELECT * FROM niveles_vacaciones WHERE organizacion_id = $1 ORDER BY orden`,
                [organizacionId]
            );
            return result.rows;
        });
    }

    /**
     * Verifica si una organización tiene niveles configurados
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<boolean>}
     */
    static async tieneNiveles(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT COUNT(*) as count
                FROM niveles_vacaciones
                WHERE organizacion_id = $1
                  AND activo = true
            `;
            const result = await db.query(query, [organizacionId]);
            return parseInt(result.rows[0].count) > 0;
        });
    }
}

module.exports = NivelesVacacionesModel;
