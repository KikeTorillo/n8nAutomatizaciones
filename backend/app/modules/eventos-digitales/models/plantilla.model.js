/**
 * ====================================================================
 * MODELO: PLANTILLAS DE EVENTOS
 * ====================================================================
 * Gestión de plantillas de diseño para eventos.
 * Las plantillas son datos del sistema (sin RLS).
 *
 * Fecha creación: 4 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class PlantillaModel {
    /**
     * Listar plantillas activas
     * Público - sin necesidad de autenticación
     */
    static async listar(filtros = {}) {
        const { tipo_evento, categoria, subcategoria, es_premium, activo = true } = filtros;

        return await RLSContextManager.withBypass(async (db) => {
            let query = `
                SELECT * FROM plantillas_evento
                WHERE 1=1
            `;
            const params = [];
            let paramIdx = 1;

            if (activo !== undefined) {
                query += ` AND activo = $${paramIdx}`;
                params.push(activo);
                paramIdx++;
            }

            if (tipo_evento) {
                query += ` AND tipo_evento = $${paramIdx}`;
                params.push(tipo_evento);
                paramIdx++;
            }

            if (categoria) {
                query += ` AND categoria = $${paramIdx}`;
                params.push(categoria);
                paramIdx++;
            }

            if (subcategoria) {
                query += ` AND subcategoria = $${paramIdx}`;
                params.push(subcategoria);
                paramIdx++;
            }

            if (es_premium !== undefined) {
                query += ` AND es_premium = $${paramIdx}`;
                params.push(es_premium);
                paramIdx++;
            }

            query += ` ORDER BY orden, nombre`;

            const result = await db.query(query, params);
            return result.rows;
        });
    }

    /**
     * Obtener plantilla por ID
     */
    static async obtenerPorId(id) {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                SELECT * FROM plantillas_evento
                WHERE id = $1
            `, [id]);

            return result.rows[0] || null;
        });
    }

    /**
     * Obtener plantilla por código
     */
    static async obtenerPorCodigo(codigo) {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                SELECT * FROM plantillas_evento
                WHERE codigo = $1
            `, [codigo]);

            return result.rows[0] || null;
        });
    }

    /**
     * Crear plantilla (solo super_admin)
     */
    static async crear(datos) {
        const {
            codigo,
            nombre,
            tipo_evento,
            descripcion,
            preview_url,
            categoria,
            subcategoria,
            tema,
            bloques_plantilla,
            estructura_html,
            estilos_css,
            es_premium = false,
            orden = 0
        } = datos;

        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                INSERT INTO plantillas_evento (
                    codigo, nombre, tipo_evento, descripcion, preview_url,
                    categoria, subcategoria,
                    tema, bloques_plantilla, estructura_html, estilos_css, es_premium, orden
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *
            `, [
                codigo, nombre, tipo_evento, descripcion, preview_url,
                categoria, subcategoria,
                tema ? JSON.stringify(tema) : null,
                bloques_plantilla ? JSON.stringify(bloques_plantilla) : '[]',
                estructura_html, estilos_css, es_premium, orden
            ]);

            return result.rows[0];
        });
    }

    /**
     * Actualizar plantilla (solo super_admin)
     */
    static async actualizar(id, datos) {
        const campos = [];
        const valores = [];
        let idx = 1;

        const camposPermitidos = [
            'nombre', 'tipo_evento', 'descripcion', 'preview_url',
            'categoria', 'subcategoria',
            'tema', 'bloques_plantilla', 'estructura_html', 'estilos_css',
            'es_premium', 'activo', 'orden'
        ];

        for (const campo of camposPermitidos) {
            if (datos[campo] !== undefined) {
                if (campo === 'tema' || campo === 'bloques_plantilla') {
                    campos.push(`${campo} = $${idx}`);
                    valores.push(JSON.stringify(datos[campo]));
                } else {
                    campos.push(`${campo} = $${idx}`);
                    valores.push(datos[campo]);
                }
                idx++;
            }
        }

        if (campos.length === 0) {
            return await this.obtenerPorId(id);
        }

        valores.push(id);

        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                UPDATE plantillas_evento
                SET ${campos.join(', ')}
                WHERE id = $${idx}
                RETURNING *
            `, valores);

            return result.rows[0];
        });
    }

    /**
     * Eliminar plantilla (solo super_admin)
     */
    static async eliminar(id) {
        return await RLSContextManager.withBypass(async (db) => {
            // Verificar si está en uso
            const enUso = await db.query(`
                SELECT COUNT(*) FROM eventos_digitales
                WHERE plantilla_id = $1
            `, [id]);

            if (parseInt(enUso.rows[0].count) > 0) {
                // Soft delete si está en uso
                await db.query(`
                    UPDATE plantillas_evento
                    SET activo = false
                    WHERE id = $1
                `, [id]);
                return { eliminado: false, desactivado: true };
            }

            // Hard delete si no está en uso
            const result = await db.query(`
                DELETE FROM plantillas_evento
                WHERE id = $1
                RETURNING id
            `, [id]);

            return { eliminado: result.rowCount > 0, desactivado: false };
        });
    }

    /**
     * Obtener bloques de una plantilla
     */
    static async obtenerBloques(id) {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                SELECT bloques_plantilla FROM plantillas_evento
                WHERE id = $1
            `, [id]);

            if (!result.rows[0]) return null;
            return result.rows[0].bloques_plantilla || [];
        });
    }

    /**
     * Guardar bloques de una plantilla
     */
    static async guardarBloques(id, bloques) {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                UPDATE plantillas_evento
                SET bloques_plantilla = $1
                WHERE id = $2
                RETURNING id, bloques_plantilla
            `, [JSON.stringify(bloques), id]);

            return result.rows[0] || null;
        });
    }

    /**
     * Listar por tipo de evento
     */
    static async listarPorTipo(tipoEvento) {
        return await RLSContextManager.withBypass(async (db) => {
            const result = await db.query(`
                SELECT * FROM plantillas_evento
                WHERE tipo_evento = $1 AND activo = true
                ORDER BY es_premium, orden, nombre
            `, [tipoEvento]);

            return result.rows;
        });
    }
}

module.exports = PlantillaModel;
