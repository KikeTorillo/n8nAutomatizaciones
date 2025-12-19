const RLSContextManager = require('../../../utils/rlsContextManager');

class PuestoModel {

    /**
     * Crea un nuevo puesto
     */
    static async crear(organizacionId, data) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO puestos (
                    organizacion_id, nombre, descripcion, codigo,
                    departamento_id, salario_minimo, salario_maximo, activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.nombre,
                data.descripcion || null,
                data.codigo || null,
                data.departamento_id || null,
                data.salario_minimo || null,
                data.salario_maximo || null,
                data.activo !== undefined ? data.activo : true
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Lista puestos de una organización
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { activo = null, departamento_id = null, limit = 100, offset = 0 } = filtros;

            let query = `
                SELECT p.*,
                       d.nombre as departamento_nombre,
                       (SELECT COUNT(*) FROM profesionales WHERE puesto_id = p.id AND estado = 'activo') as total_empleados
                FROM puestos p
                LEFT JOIN departamentos d ON p.departamento_id = d.id
                WHERE p.organizacion_id = $1
            `;

            const values = [organizacionId];
            let contador = 2;

            if (activo !== null) {
                query += ` AND p.activo = $${contador}`;
                values.push(activo);
                contador++;
            }

            if (departamento_id) {
                query += ` AND p.departamento_id = $${contador}`;
                values.push(departamento_id);
                contador++;
            }

            query += ` ORDER BY d.nombre, p.nombre LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limit, offset);

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Obtiene un puesto por ID
     */
    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT p.*,
                       d.nombre as departamento_nombre,
                       (SELECT COUNT(*) FROM profesionales WHERE puesto_id = p.id AND estado = 'activo') as total_empleados
                FROM puestos p
                LEFT JOIN departamentos d ON p.departamento_id = d.id
                WHERE p.id = $1 AND p.organizacion_id = $2
            `;

            const result = await db.query(query, [id, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualiza un puesto
     */
    static async actualizar(organizacionId, id, data) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposPermitidos = [
                'nombre', 'descripcion', 'codigo', 'departamento_id',
                'salario_minimo', 'salario_maximo', 'activo'
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
                UPDATE puestos
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                RETURNING *
            `;

            valores.push(id, organizacionId);
            const result = await db.query(query, valores);

            if (result.rows.length === 0) {
                throw new Error('Puesto no encontrado');
            }

            return result.rows[0];
        });
    }

    /**
     * Elimina un puesto (soft delete)
     */
    static async eliminar(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE puestos
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
                RETURNING id
            `;

            const result = await db.query(query, [id, organizacionId]);
            return result.rowCount > 0;
        });
    }

}

module.exports = PuestoModel;
