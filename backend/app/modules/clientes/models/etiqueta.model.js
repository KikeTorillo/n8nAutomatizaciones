/**
 * ====================================================================
 * MODELO ETIQUETA CLIENTE
 * ====================================================================
 *
 * Fase 2 - Segmentación de Clientes (Ene 2026)
 * CRUD para etiquetas con colores y relación M:M con clientes
 *
 * ====================================================================
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');

class EtiquetaClienteModel {

    /**
     * Crear una nueva etiqueta
     * @param {number} organizacionId - ID de la organización
     * @param {Object} etiquetaData - Datos de la etiqueta
     */
    static async crear(organizacionId, etiquetaData) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO etiquetas_clientes (
                    organizacion_id, nombre, color, descripcion, orden, activo
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, organizacion_id, nombre, color, descripcion, orden, activo, creado_en, actualizado_en
            `;

            const values = [
                organizacionId,
                etiquetaData.nombre,
                etiquetaData.color || '#6366F1',
                etiquetaData.descripcion || null,
                etiquetaData.orden || 0,
                etiquetaData.activo !== undefined ? etiquetaData.activo : true
            ];

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                if (error.code === '23505') {
                    ErrorHelper.throwConflict(`Ya existe una etiqueta con el nombre "${etiquetaData.nombre}"`);
                }
                if (error.code === '23514' && error.constraint === 'etiquetas_clientes_color_check') {
                    ErrorHelper.throwValidation('El color debe ser un código hexadecimal válido (ej: #EF4444)');
                }
                throw error;
            }
        });
    }

    /**
     * Listar etiquetas de una organización
     */
    static async listar(organizacionId, opciones = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { soloActivas = true } = opciones;

            let query = `
                SELECT
                    e.id,
                    e.organizacion_id,
                    e.nombre,
                    e.color,
                    e.descripcion,
                    e.orden,
                    e.activo,
                    e.creado_en,
                    e.actualizado_en,
                    COUNT(DISTINCT ce.cliente_id) as total_clientes
                FROM etiquetas_clientes e
                LEFT JOIN cliente_etiquetas ce ON ce.etiqueta_id = e.id
            `;

            const whereConditions = [];
            const params = [];

            if (soloActivas) {
                whereConditions.push('e.activo = true');
            }

            if (whereConditions.length > 0) {
                query += ` WHERE ${whereConditions.join(' AND ')}`;
            }

            query += `
                GROUP BY e.id
                ORDER BY e.orden ASC, e.nombre ASC
            `;

            const result = await db.query(query, params);
            return result.rows;
        });
    }

    /**
     * Obtener etiqueta por ID
     * Alias: buscarPorId (para compatibilidad con BaseCrudController)
     */
    static async obtenerPorId(organizacionId, etiquetaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    e.id,
                    e.organizacion_id,
                    e.nombre,
                    e.color,
                    e.descripcion,
                    e.orden,
                    e.activo,
                    e.creado_en,
                    e.actualizado_en,
                    COUNT(DISTINCT ce.cliente_id) as total_clientes
                FROM etiquetas_clientes e
                LEFT JOIN cliente_etiquetas ce ON ce.etiqueta_id = e.id
                WHERE e.id = $1
                GROUP BY e.id
            `;

            const result = await db.query(query, [etiquetaId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar etiqueta
     */
    static async actualizar(organizacionId, etiquetaId, etiquetaData) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const campos = [];
            const values = [];
            let paramIndex = 1;

            if (etiquetaData.nombre !== undefined) {
                campos.push(`nombre = $${paramIndex++}`);
                values.push(etiquetaData.nombre);
            }

            if (etiquetaData.color !== undefined) {
                campos.push(`color = $${paramIndex++}`);
                values.push(etiquetaData.color);
            }

            if (etiquetaData.descripcion !== undefined) {
                campos.push(`descripcion = $${paramIndex++}`);
                values.push(etiquetaData.descripcion);
            }

            if (etiquetaData.orden !== undefined) {
                campos.push(`orden = $${paramIndex++}`);
                values.push(etiquetaData.orden);
            }

            if (etiquetaData.activo !== undefined) {
                campos.push(`activo = $${paramIndex++}`);
                values.push(etiquetaData.activo);
            }

            if (campos.length === 0) {
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            values.push(etiquetaId);

            const query = `
                UPDATE etiquetas_clientes
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${paramIndex}
                RETURNING id, organizacion_id, nombre, color, descripcion, orden, activo, creado_en, actualizado_en
            `;

            try {
                const result = await db.query(query, values);
                ErrorHelper.throwIfNotFound(result.rows[0], 'Etiqueta');
                return result.rows[0];
            } catch (error) {
                if (error.code === '23505') {
                    ErrorHelper.throwConflict(`Ya existe una etiqueta con el nombre "${etiquetaData.nombre}"`);
                }
                if (error.code === '23514' && error.constraint === 'etiquetas_clientes_color_check') {
                    ErrorHelper.throwValidation('El color debe ser un código hexadecimal válido (ej: #EF4444)');
                }
                throw error;
            }
        });
    }

    /**
     * Eliminar etiqueta
     */
    static async eliminar(organizacionId, etiquetaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar si tiene clientes asignados
            const checkQuery = `
                SELECT COUNT(*) as total
                FROM cliente_etiquetas
                WHERE etiqueta_id = $1
            `;
            const checkResult = await db.query(checkQuery, [etiquetaId]);

            if (parseInt(checkResult.rows[0].total) > 0) {
                ErrorHelper.throwConflict(`No se puede eliminar la etiqueta porque tiene ${checkResult.rows[0].total} cliente(s) asignado(s)`);
            }

            const query = `
                DELETE FROM etiquetas_clientes
                WHERE id = $1
                RETURNING id
            `;

            const result = await db.query(query, [etiquetaId]);
            ErrorHelper.throwIfNotFound(result.rows[0], 'Etiqueta');
            return { eliminado: true, id: etiquetaId };
        });
    }

    // ====================================================================
    // ASIGNACIÓN DE ETIQUETAS A CLIENTES
    // ====================================================================

    /**
     * Obtener etiquetas de un cliente
     */
    static async obtenerEtiquetasCliente(organizacionId, clienteId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    e.id,
                    e.nombre,
                    e.color,
                    e.descripcion
                FROM etiquetas_clientes e
                INNER JOIN cliente_etiquetas ce ON ce.etiqueta_id = e.id
                WHERE ce.cliente_id = $1 AND e.activo = true
                ORDER BY e.orden ASC, e.nombre ASC
            `;

            const result = await db.query(query, [clienteId]);
            return result.rows;
        });
    }

    /**
     * Asignar etiquetas a un cliente (reemplaza las existentes)
     */
    static async asignarEtiquetasCliente(organizacionId, clienteId, etiquetaIds) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que el cliente existe
            const clienteQuery = 'SELECT id FROM clientes WHERE id = $1';
            const clienteResult = await db.query(clienteQuery, [clienteId]);
            ErrorHelper.throwIfNotFound(clienteResult.rows[0], 'Cliente');

            // Eliminar etiquetas existentes
            await db.query('DELETE FROM cliente_etiquetas WHERE cliente_id = $1', [clienteId]);

            // Si no hay etiquetas nuevas, retornar
            if (!etiquetaIds || etiquetaIds.length === 0) {
                return [];
            }

            // Verificar que todas las etiquetas existen y pertenecen a la organización
            const verificarQuery = `
                SELECT id FROM etiquetas_clientes
                WHERE id = ANY($1) AND activo = true
            `;
            const verificarResult = await db.query(verificarQuery, [etiquetaIds]);

            if (verificarResult.rows.length !== etiquetaIds.length) {
                ErrorHelper.throwValidation('Una o más etiquetas no son válidas');
            }

            // Insertar nuevas asignaciones
            const insertQuery = `
                INSERT INTO cliente_etiquetas (cliente_id, etiqueta_id)
                SELECT $1, unnest($2::integer[])
                ON CONFLICT DO NOTHING
            `;
            await db.query(insertQuery, [clienteId, etiquetaIds]);

            // Retornar las etiquetas asignadas
            return await this.obtenerEtiquetasCliente(organizacionId, clienteId);
        });
    }

    /**
     * Agregar una etiqueta a un cliente (sin eliminar las existentes)
     */
    static async agregarEtiquetaCliente(organizacionId, clienteId, etiquetaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO cliente_etiquetas (cliente_id, etiqueta_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
                RETURNING cliente_id, etiqueta_id
            `;

            try {
                const result = await db.query(query, [clienteId, etiquetaId]);
                return result.rows[0] || { cliente_id: clienteId, etiqueta_id: etiquetaId };
            } catch (error) {
                if (error.code === '23503') {
                    ErrorHelper.throwNotFound('Cliente o etiqueta no encontrados');
                }
                throw error;
            }
        });
    }

    /**
     * Quitar una etiqueta de un cliente
     */
    static async quitarEtiquetaCliente(organizacionId, clienteId, etiquetaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                DELETE FROM cliente_etiquetas
                WHERE cliente_id = $1 AND etiqueta_id = $2
                RETURNING cliente_id, etiqueta_id
            `;

            const result = await db.query(query, [clienteId, etiquetaId]);
            return { eliminado: result.rows.length > 0 };
        });
    }

    // ====================================================================
    // ALIASES PARA BASECRUDCONTROLLER
    // ====================================================================

    /**
     * Alias de obtenerPorId para BaseCrudController
     */
    static buscarPorId = this.obtenerPorId;
}

module.exports = EtiquetaClienteModel;
