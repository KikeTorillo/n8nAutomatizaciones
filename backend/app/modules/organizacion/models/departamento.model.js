const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');

class DepartamentoModel {

    /**
     * Crea un nuevo departamento
     */
    static async crear(organizacionId, data) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO departamentos (
                    organizacion_id, nombre, descripcion, codigo,
                    parent_id, gerente_id, activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.nombre,
                data.descripcion || null,
                data.codigo || null,
                data.parent_id || null,
                data.gerente_id || null,
                data.activo !== undefined ? data.activo : true
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Lista departamentos de una organización
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { activo = null, parent_id = null, limit = 100, offset = 0 } = filtros;

            let query = `
                SELECT d.*,
                       p.nombre as parent_nombre,
                       g.nombre_completo as gerente_nombre,
                       (SELECT COUNT(*) FROM profesionales WHERE departamento_id = d.id AND estado = 'activo') as total_empleados,
                       (SELECT COUNT(*) FROM departamentos WHERE parent_id = d.id) as total_subdepartamentos
                FROM departamentos d
                LEFT JOIN departamentos p ON d.parent_id = p.id
                LEFT JOIN profesionales g ON d.gerente_id = g.id
                WHERE d.organizacion_id = $1
            `;

            const values = [organizacionId];
            let contador = 2;

            if (activo !== null) {
                query += ` AND d.activo = $${contador}`;
                values.push(activo);
                contador++;
            }

            if (parent_id !== null) {
                if (parent_id === 0) {
                    query += ` AND d.parent_id IS NULL`;
                } else {
                    query += ` AND d.parent_id = $${contador}`;
                    values.push(parent_id);
                    contador++;
                }
            }

            query += ` ORDER BY d.nombre LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limit, offset);

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Obtiene un departamento por ID
     */
    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT d.*,
                       p.nombre as parent_nombre,
                       g.nombre_completo as gerente_nombre,
                       g.email as gerente_email,
                       (SELECT COUNT(*) FROM profesionales WHERE departamento_id = d.id AND estado = 'activo') as total_empleados
                FROM departamentos d
                LEFT JOIN departamentos p ON d.parent_id = p.id
                LEFT JOIN profesionales g ON d.gerente_id = g.id
                WHERE d.id = $1 AND d.organizacion_id = $2
            `;

            const result = await db.query(query, [id, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualiza un departamento
     */
    static async actualizar(organizacionId, id, data) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposPermitidos = ['nombre', 'descripcion', 'codigo', 'parent_id', 'gerente_id', 'activo'];

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
                ErrorHelper.throwValidation('No hay campos válidos para actualizar');
            }

            const query = `
                UPDATE departamentos
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                RETURNING *
            `;

            valores.push(id, organizacionId);
            const result = await db.query(query, valores);

            ErrorHelper.throwIfNotFound(result.rows[0], 'Departamento');

            return result.rows[0];
        });
    }

    /**
     * Elimina un departamento (soft delete)
     */
    static async eliminar(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE departamentos
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
                RETURNING id
            `;

            const result = await db.query(query, [id, organizacionId]);
            return result.rowCount > 0;
        });
    }

    /**
     * Obtiene árbol de departamentos
     */
    static async obtenerArbol(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT * FROM get_arbol_departamentos($1)`;
            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }

}

module.exports = DepartamentoModel;
