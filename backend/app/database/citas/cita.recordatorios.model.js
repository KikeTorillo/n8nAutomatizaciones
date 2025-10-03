/**
 * Modelo de Recordatorios de Citas - Sistema de notificaciones y feedback
 * Funcionalidades de recordatorios, calificaciones y seguimiento
 */

const { getDb } = require('../../config/database');
const logger = require('../../utils/logger');

class CitaRecordatoriosModel {

    /**
     * Marcar recordatorio como enviado
     * @param {string} codigoCita - Código de la cita
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<boolean>} Éxito de la operación
     */
    static async marcarRecordatorioEnviado(codigoCita, organizacionId) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const resultado = await db.query(`
                UPDATE citas
                SET recordatorio_enviado = true,
                    fecha_recordatorio = NOW(),
                    actualizado_en = NOW()
                WHERE codigo_cita = $1 AND organizacion_id = $2
                RETURNING id
            `, [codigoCita, organizacionId]);

            return resultado.rows.length > 0;

        } catch (error) {
            logger.error('[CitaRecordatoriosModel.marcarRecordatorioEnviado] Error:', error);
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * Obtener citas que requieren recordatorio
     * @param {number} organizacionId - ID de la organización
     * @param {number} horasAnticipacion - Horas de anticipación (default 2)
     * @returns {Promise<Array>} Citas que requieren recordatorio
     */
    static async obtenerCitasParaRecordatorio(organizacionId, horasAnticipacion = 2) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const citas = await db.query(`
                SELECT
                    c.id,
                    c.codigo_cita,
                    c.fecha_cita,
                    c.hora_inicio,
                    cl.nombre as cliente_nombre,
                    cl.telefono as cliente_telefono,
                    p.nombre as profesional_nombre,
                    s.nombre as servicio_nombre
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                JOIN profesionales p ON c.profesional_id = p.id
                JOIN servicios s ON c.servicio_id = s.id
                WHERE c.organizacion_id = $1
                AND c.estado = 'confirmada'
                AND c.recordatorio_enviado = false
                AND (c.fecha_cita + c.hora_inicio)::timestamp <= NOW() + INTERVAL '${horasAnticipacion} hours'
                AND (c.fecha_cita + c.hora_inicio)::timestamp > NOW()
                ORDER BY c.fecha_cita, c.hora_inicio
            `, [organizacionId]);

            return citas.rows;

        } catch (error) {
            logger.error('[CitaRecordatoriosModel.obtenerCitasParaRecordatorio] Error:', error);
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * Calificar cliente (feedback del profesional)
     * @param {string} codigoCita - Código de la cita
     * @param {number} organizacionId - ID de la organización
     * @param {Object} calificacion - Datos de calificación
     * @returns {Promise<Object>} Resultado de la calificación
     */
    static async calificarCliente(codigoCita, organizacionId, calificacion) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const resultado = await db.query(`
                UPDATE citas
                SET calificacion_profesional = $1,
                    comentario_profesional = $2,
                    actualizado_en = NOW()
                WHERE codigo_cita = $3 AND organizacion_id = $4
                AND estado = 'completada'
                RETURNING *
            `, [
                calificacion.puntuacion,
                calificacion.comentario || null,
                codigoCita,
                organizacionId
            ]);

            if (resultado.rows.length === 0) {
                throw new Error('Cita no encontrada o no se puede calificar');
            }

            return {
                exito: true,
                mensaje: 'Calificación registrada exitosamente',
                cita: resultado.rows[0]
            };

        } catch (error) {
            logger.error('[CitaRecordatoriosModel.calificarCliente] Error:', error);
            throw error;
        } finally {
            db.release();
        }
    }
}

module.exports = CitaRecordatoriosModel;
