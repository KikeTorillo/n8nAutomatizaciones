const RLSContextManager = require('../../../utils/rlsContextManager');

class CategoriaModel {

    /**
     * Crea una nueva categoría de profesional
     */
    static async crear(organizacionId, data) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO categorias_profesional (
                    organizacion_id, nombre, descripcion, tipo_categoria,
                    color, icono, orden, activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.nombre,
                data.descripcion || null,
                data.tipo_categoria || 'general',
                data.color || '#753572',
                data.icono || null,
                data.orden || 0,
                data.activo !== undefined ? data.activo : true
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Lista categorías de una organización
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { activo = null, tipo_categoria = null, limit = 100, offset = 0 } = filtros;

            let query = `
                SELECT c.*,
                       (SELECT COUNT(*) FROM profesionales_categorias pc
                        JOIN profesionales p ON pc.profesional_id = p.id
                        WHERE pc.categoria_id = c.id AND p.estado = 'activo') as total_profesionales
                FROM categorias_profesional c
                WHERE c.organizacion_id = $1
            `;

            const values = [organizacionId];
            let contador = 2;

            if (activo !== null) {
                query += ` AND c.activo = $${contador}`;
                values.push(activo);
                contador++;
            }

            if (tipo_categoria) {
                query += ` AND c.tipo_categoria = $${contador}`;
                values.push(tipo_categoria);
                contador++;
            }

            query += ` ORDER BY c.tipo_categoria, c.orden, c.nombre LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limit, offset);

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Lista categorías agrupadas por tipo
     */
    static async listarAgrupadas(organizacionId, soloActivas = true) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let query = `
                SELECT c.*,
                       (SELECT COUNT(*) FROM profesionales_categorias pc
                        JOIN profesionales p ON pc.profesional_id = p.id
                        WHERE pc.categoria_id = c.id AND p.estado = 'activo') as total_profesionales
                FROM categorias_profesional c
                WHERE c.organizacion_id = $1
            `;

            if (soloActivas) {
                query += ` AND c.activo = true`;
            }

            query += ` ORDER BY c.tipo_categoria, c.orden, c.nombre`;

            const result = await db.query(query, [organizacionId]);

            // Agrupar por tipo_categoria
            const agrupadas = {};
            for (const cat of result.rows) {
                const tipo = cat.tipo_categoria;
                if (!agrupadas[tipo]) {
                    agrupadas[tipo] = [];
                }
                agrupadas[tipo].push(cat);
            }

            return agrupadas;
        });
    }

    /**
     * Obtiene una categoría por ID
     */
    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT c.*,
                       (SELECT COUNT(*) FROM profesionales_categorias pc
                        JOIN profesionales p ON pc.profesional_id = p.id
                        WHERE pc.categoria_id = c.id AND p.estado = 'activo') as total_profesionales
                FROM categorias_profesional c
                WHERE c.id = $1 AND c.organizacion_id = $2
            `;

            const result = await db.query(query, [id, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualiza una categoría
     */
    static async actualizar(organizacionId, id, data) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposPermitidos = [
                'nombre', 'descripcion', 'tipo_categoria',
                'color', 'icono', 'orden', 'activo'
            ];

            const campos = [];
            const valores = [];
            let contador = 1;

            for (const [campo, valor] of Object.entries(data)) {
                if (camposPermitidos.includes(campo) && valor !== undefined) {
                    campos.push(`${campo} = $${contador}`);
                    valores.push(valor);
                    contador++;
                }
            }

            if (campos.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            const query = `
                UPDATE categorias_profesional
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                RETURNING *
            `;

            valores.push(id, organizacionId);
            const result = await db.query(query, valores);

            if (result.rows.length === 0) {
                throw new Error('Categoría no encontrada');
            }

            return result.rows[0];
        });
    }

    /**
     * Elimina una categoría (soft delete)
     */
    static async eliminar(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE categorias_profesional
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
                RETURNING id
            `;

            const result = await db.query(query, [id, organizacionId]);
            return result.rowCount > 0;
        });
    }

    /**
     * Obtiene los profesionales de una categoría
     */
    static async obtenerProfesionales(organizacionId, categoriaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT p.id, p.nombre_completo, p.email, p.telefono,
                       p.foto_url, p.tipo, p.estado,
                       pc.fecha_asignacion, pc.notas
                FROM profesionales_categorias pc
                JOIN profesionales p ON pc.profesional_id = p.id
                WHERE pc.categoria_id = $1 AND p.organizacion_id = $2
                ORDER BY p.nombre_completo
            `;

            const result = await db.query(query, [categoriaId, organizacionId]);
            return result.rows;
        });
    }

}

module.exports = CategoriaModel;
