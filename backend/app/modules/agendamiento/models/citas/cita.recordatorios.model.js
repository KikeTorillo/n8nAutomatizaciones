const RLSContextManager = require('../../../../utils/rlsContextManager');

class CitaRecordatoriosModel {

    static async marcarRecordatorioEnviado(codigoCita, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const resultado = await db.query(`
                UPDATE citas
                SET recordatorio_enviado = true,
                    fecha_recordatorio = NOW(),
                    actualizado_en = NOW()
                WHERE codigo_cita = $1 AND organizacion_id = $2
                RETURNING id
            `, [codigoCita, organizacionId]);

            return resultado.rows.length > 0;
        });
    }

    static async obtenerCitasParaRecordatorio(organizacionId, horasAnticipacion = 2) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // ✅ FIX GAP #4: Usar CitaServicioQueries para manejar múltiples servicios
            const CitaServicioQueries = require('./cita-servicio.queries');
            const query = CitaServicioQueries.buildRecordatoriosConServicios();

            const citas = await db.query(query, [organizacionId, horasAnticipacion]);

            return citas.rows;
        });
    }

    static async calificarCliente(codigoCita, organizacionId, calificacion) {
        return await RLSContextManager.query(organizacionId, async (db) => {
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
        });
    }
}

module.exports = CitaRecordatoriosModel;
