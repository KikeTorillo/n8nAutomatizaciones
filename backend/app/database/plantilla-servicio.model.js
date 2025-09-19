/**
 * Modelo de Plantillas de Servicios
 * Servicios pre-configurados por industria
 */

const { getDb } = require('../config/database');
const logger = require('../utils/logger');

class PlantillaServicioModel {
    static async obtenerPorIndustria(tipoIndustria) {
        const client = await getDb();

        try {
            const query = `
                SELECT * FROM plantillas_servicios
                WHERE tipo_industria = $1 AND estado = 'activa'
                ORDER BY categoria, nombre
            `;

            const result = await client.query(query, [tipoIndustria]);
            return result.rows;

        } catch (error) {
            logger.error('Error al obtener plantillas de servicios:', error);
            throw new Error(`Error al obtener plantillas: ${error.message}`);
        } finally {
            client.release();
        }
    }

    static async listarIndustrias() {
        const client = await getDb();

        try {
            const query = `
                SELECT DISTINCT tipo_industria, COUNT(*) as total_servicios
                FROM plantillas_servicios
                WHERE estado = 'activa'
                GROUP BY tipo_industria
                ORDER BY tipo_industria
            `;

            const result = await client.query(query);
            return result.rows;

        } catch (error) {
            logger.error('Error al listar industrias:', error);
            throw new Error(`Error al listar industrias: ${error.message}`);
        } finally {
            client.release();
        }
    }

    static async crearServiciosDesdeTemplates(organizacionId, tipoIndustria, serviciosSeleccionados = []) {
        const client = await getDb();

        try {
            await client.query('SELECT set_config($1, $2, true)', ['row_level_security.organizacion_id', organizacionId.toString()]);

            let whereClause = 'tipo_industria = $1 AND estado = $2';
            let values = [tipoIndustria, 'activa'];

            if (serviciosSeleccionados.length > 0) {
                const placeholders = serviciosSeleccionados.map((_, index) => `$${index + 3}`).join(',');
                whereClause += ` AND id IN (${placeholders})`;
                values = [...values, ...serviciosSeleccionados];
            }

            const query = `
                INSERT INTO servicios (
                    organizacion_id, nombre, descripcion, precio,
                    duracion_defecto, categoria, estado,
                    fecha_creacion, fecha_actualizacion
                )
                SELECT
                    $${values.length + 1}, nombre, descripcion, precio_base,
                    duracion_defecto, categoria, 'activo',
                    NOW(), NOW()
                FROM plantillas_servicios
                WHERE ${whereClause}
                RETURNING *
            `;

            const result = await client.query(query, [...values, organizacionId]);

            logger.info('Servicios creados desde plantillas', {
                organizacion_id: organizacionId,
                tipo_industria: tipoIndustria,
                servicios_creados: result.rows.length
            });

            return result.rows;

        } catch (error) {
            logger.error('Error al crear servicios desde plantillas:', error);
            throw new Error(`Error al crear servicios: ${error.message}`);
        } finally {
            client.release();
        }
    }
}

module.exports = PlantillaServicioModel;