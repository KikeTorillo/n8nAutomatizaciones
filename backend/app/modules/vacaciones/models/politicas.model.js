/**
 * PoliticasVacacionesModel - Enero 2026
 * Gestión de políticas de vacaciones por organización
 * Fase 3 del Plan de Empleados Competitivo
 */
const RLSContextManager = require('../../../utils/rlsContextManager');
const { DEFAULTS_POLITICA, CAMPOS_POLITICA } = require('../constants/vacaciones.constants');

class PoliticasVacacionesModel {

    /**
     * Obtiene la política de vacaciones de una organización
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} Política o null si no existe
     */
    static async obtener(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT pv.*
                FROM politicas_vacaciones pv
                WHERE pv.organizacion_id = $1
                  AND pv.activo = true
                LIMIT 1
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtiene o crea la política por defecto si no existe
     * @param {number} organizacionId - ID de la organización
     * @param {number} usuarioId - ID del usuario que crea
     * @returns {Promise<Object>} Política existente o creada
     */
    static async obtenerOCrear(organizacionId, usuarioId = null) {
        const politicaExistente = await this.obtener(organizacionId);
        if (politicaExistente) {
            return politicaExistente;
        }

        // Crear política por defecto
        return await this.crear(organizacionId, DEFAULTS_POLITICA, usuarioId);
    }

    /**
     * Crea una nueva política de vacaciones
     * @param {number} organizacionId - ID de la organización
     * @param {Object} data - Datos de la política
     * @param {number} usuarioId - ID del usuario que crea
     * @returns {Promise<Object>} Política creada
     */
    static async crear(organizacionId, data, usuarioId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO politicas_vacaciones (
                    organizacion_id,
                    dias_por_anio,
                    dias_maximos_acumulables,
                    dias_anticipacion_minimos,
                    requiere_aprobacion,
                    aprobador_tipo,
                    aprobador_rol_id,
                    permite_medios_dias,
                    usar_niveles_antiguedad,
                    ignorar_festivos,
                    permite_saldo_negativo,
                    dias_maximos_consecutivos,
                    mes_inicio_periodo,
                    dia_inicio_periodo,
                    creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.dias_por_anio ?? DEFAULTS_POLITICA.dias_por_anio,
                data.dias_maximos_acumulables ?? DEFAULTS_POLITICA.dias_maximos_acumulables,
                data.dias_anticipacion_minimos ?? DEFAULTS_POLITICA.dias_anticipacion_minimos,
                data.requiere_aprobacion ?? DEFAULTS_POLITICA.requiere_aprobacion,
                data.aprobador_tipo ?? DEFAULTS_POLITICA.aprobador_tipo,
                data.aprobador_rol_id || null,
                data.permite_medios_dias ?? DEFAULTS_POLITICA.permite_medios_dias,
                data.usar_niveles_antiguedad ?? DEFAULTS_POLITICA.usar_niveles_antiguedad,
                data.ignorar_festivos ?? DEFAULTS_POLITICA.ignorar_festivos,
                data.permite_saldo_negativo ?? DEFAULTS_POLITICA.permite_saldo_negativo,
                data.dias_maximos_consecutivos ?? DEFAULTS_POLITICA.dias_maximos_consecutivos,
                data.mes_inicio_periodo ?? DEFAULTS_POLITICA.mes_inicio_periodo,
                data.dia_inicio_periodo ?? DEFAULTS_POLITICA.dia_inicio_periodo,
                usuarioId,
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Actualiza la política de vacaciones
     * @param {number} organizacionId - ID de la organización
     * @param {Object} data - Datos a actualizar
     * @param {number} usuarioId - ID del usuario que actualiza
     * @returns {Promise<Object>} Política actualizada
     */
    static async actualizar(organizacionId, data, usuarioId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Construir campos a actualizar dinámicamente
            const camposActualizables = [
                'dias_por_anio',
                'dias_maximos_acumulables',
                'dias_anticipacion_minimos',
                'requiere_aprobacion',
                'aprobador_tipo',
                'aprobador_rol_id',
                'permite_medios_dias',
                'usar_niveles_antiguedad',
                'ignorar_festivos',
                'permite_saldo_negativo',
                'dias_maximos_consecutivos',
                'mes_inicio_periodo',
                'dia_inicio_periodo',
            ];

            const setClauses = [];
            const values = [organizacionId];
            let contador = 2;

            for (const campo of camposActualizables) {
                if (data[campo] !== undefined) {
                    setClauses.push(`${campo} = $${contador}`);
                    values.push(data[campo]);
                    contador++;
                }
            }

            if (setClauses.length === 0) {
                return await this.obtener(organizacionId);
            }

            // Agregar actualizado_por
            setClauses.push(`actualizado_por = $${contador}`);
            values.push(usuarioId);

            const query = `
                UPDATE politicas_vacaciones
                SET ${setClauses.join(', ')}
                WHERE organizacion_id = $1
                  AND activo = true
                RETURNING *
            `;

            const result = await db.query(query, values);

            if (result.rows.length === 0) {
                // Si no existe, crear con los datos proporcionados
                return await this.crear(organizacionId, data, usuarioId);
            }

            return result.rows[0];
        });
    }

    /**
     * Verifica si la política permite saldo negativo
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<boolean>}
     */
    static async permiteSaldoNegativo(organizacionId) {
        const politica = await this.obtener(organizacionId);
        return politica?.permite_saldo_negativo ?? false;
    }

    /**
     * Verifica si la política usa niveles por antigüedad
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<boolean>}
     */
    static async usaNivelesAntiguedad(organizacionId) {
        const politica = await this.obtener(organizacionId);
        return politica?.usar_niveles_antiguedad ?? true;
    }

    /**
     * Obtiene los días de anticipación mínimos
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<number>}
     */
    static async getDiasAnticipacionMinimos(organizacionId) {
        const politica = await this.obtener(organizacionId);
        return politica?.dias_anticipacion_minimos ?? DEFAULTS_POLITICA.dias_anticipacion_minimos;
    }
}

module.exports = PoliticasVacacionesModel;
