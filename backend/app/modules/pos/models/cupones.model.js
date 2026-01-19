/**
 * ====================================================================
 * MODEL - CUPONES DE DESCUENTO
 * ====================================================================
 *
 * Modelo para gestión de cupones de descuento en POS
 * - CRUD de cupones
 * - Validación de cupones
 * - Aplicación y tracking de uso
 *
 * Ene 2026 - Fase 2 POS
 * ====================================================================
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { ErrorHelper } = require('../../../utils/helpers');

class CuponesModel {

    /**
     * Crear un nuevo cupón
     * @param {Object} data - Datos del cupón
     * @param {number} organizacionId - ID de la organización
     * @param {number} usuarioId - ID del usuario creador
     */
    static async crear(data, organizacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO cupones (
                    organizacion_id,
                    codigo,
                    nombre,
                    descripcion,
                    tipo_descuento,
                    valor,
                    monto_minimo,
                    monto_maximo_descuento,
                    fecha_inicio,
                    fecha_fin,
                    usos_maximos,
                    usos_por_cliente,
                    solo_primera_compra,
                    categorias_ids,
                    productos_ids,
                    activo,
                    creado_por
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
                )
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.codigo.toUpperCase(),
                data.nombre,
                data.descripcion || null,
                data.tipo_descuento,
                data.valor,
                data.monto_minimo || 0,
                data.monto_maximo_descuento || null,
                data.fecha_inicio || new Date().toISOString().split('T')[0],
                data.fecha_fin || null,
                data.usos_maximos || null,
                data.usos_por_cliente || 1,
                data.solo_primera_compra || false,
                data.categorias_ids || null,
                data.productos_ids || null,
                data.activo !== false,
                usuarioId
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Obtener cupón por ID
     * @param {number} id - ID del cupón
     * @param {number} organizacionId - ID de la organización
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT c.*,
                    (SELECT COUNT(*) FROM uso_cupones WHERE cupon_id = c.id) as usos_registrados
                FROM cupones c
                WHERE c.id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener cupón por código
     * @param {string} codigo - Código del cupón
     * @param {number} organizacionId - ID de la organización
     */
    static async obtenerPorCodigo(codigo, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT c.*,
                    (SELECT COUNT(*) FROM uso_cupones WHERE cupon_id = c.id) as usos_registrados
                FROM cupones c
                WHERE UPPER(c.codigo) = UPPER($1)
            `;

            const result = await db.query(query, [codigo]);
            return result.rows[0] || null;
        });
    }

    /**
     * Listar cupones con paginación
     * @param {Object} options - Opciones de listado
     */
    static async listar(options = {}) {
        const {
            organizacionId,
            page = 1,
            limit = 20,
            busqueda,
            activo,
            vigente,
            ordenPor = 'creado_en',
            orden = 'DESC'
        } = options;

        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = [];
            const values = [];
            let paramIndex = 1;

            // Filtro por búsqueda
            if (busqueda) {
                whereConditions.push(`(
                    c.codigo ILIKE $${paramIndex} OR
                    c.nombre ILIKE $${paramIndex}
                )`);
                values.push(`%${busqueda}%`);
                paramIndex++;
            }

            // Filtro por estado
            if (activo !== undefined) {
                whereConditions.push(`c.activo = $${paramIndex}`);
                values.push(activo);
                paramIndex++;
            }

            // Filtro por vigencia
            if (vigente === true) {
                whereConditions.push(`(
                    c.fecha_inicio <= CURRENT_DATE AND
                    (c.fecha_fin IS NULL OR c.fecha_fin >= CURRENT_DATE) AND
                    (c.usos_maximos IS NULL OR c.usos_actuales < c.usos_maximos)
                )`);
            } else if (vigente === false) {
                whereConditions.push(`(
                    c.fecha_inicio > CURRENT_DATE OR
                    c.fecha_fin < CURRENT_DATE OR
                    (c.usos_maximos IS NOT NULL AND c.usos_actuales >= c.usos_maximos)
                )`);
            }

            const whereClause = whereConditions.length > 0
                ? 'WHERE ' + whereConditions.join(' AND ')
                : '';

            // Validar orden
            const ordenColumnas = ['creado_en', 'codigo', 'nombre', 'fecha_inicio', 'fecha_fin', 'usos_actuales'];
            const ordenCol = ordenColumnas.includes(ordenPor) ? ordenPor : 'creado_en';
            const ordenDir = orden.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            // Query principal
            const query = `
                SELECT c.*,
                    (SELECT COUNT(*) FROM uso_cupones WHERE cupon_id = c.id) as usos_registrados,
                    CASE
                        WHEN c.fecha_fin IS NOT NULL AND c.fecha_fin < CURRENT_DATE THEN 'expirado'
                        WHEN c.fecha_inicio > CURRENT_DATE THEN 'programado'
                        WHEN c.usos_maximos IS NOT NULL AND c.usos_actuales >= c.usos_maximos THEN 'agotado'
                        WHEN c.activo = false THEN 'inactivo'
                        ELSE 'vigente'
                    END as estado_vigencia
                FROM cupones c
                ${whereClause}
                ORDER BY c.${ordenCol} ${ordenDir}
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            values.push(limit, (page - 1) * limit);

            // Query de conteo
            const countQuery = `
                SELECT COUNT(*) as total
                FROM cupones c
                ${whereClause}
            `;

            const [cupones, countResult] = await Promise.all([
                db.query(query, values),
                db.query(countQuery, values.slice(0, paramIndex - 1))
            ]);

            const total = parseInt(countResult.rows[0].total);

            return {
                cupones: cupones.rows,
                paginacion: {
                    pagina: page,
                    limite: limit,
                    total,
                    totalPaginas: Math.ceil(total / limit)
                }
            };
        });
    }

    /**
     * Actualizar cupón
     * @param {number} id - ID del cupón
     * @param {Object} data - Datos a actualizar
     * @param {number} organizacionId - ID de la organización
     */
    static async actualizar(id, data, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const campos = [];
            const values = [];
            let paramIndex = 1;

            const camposActualizables = [
                'codigo', 'nombre', 'descripcion', 'tipo_descuento', 'valor',
                'monto_minimo', 'monto_maximo_descuento', 'fecha_inicio', 'fecha_fin',
                'usos_maximos', 'usos_por_cliente', 'solo_primera_compra',
                'categorias_ids', 'productos_ids', 'activo'
            ];

            for (const campo of camposActualizables) {
                if (data[campo] !== undefined) {
                    let valor = data[campo];
                    // Convertir código a mayúsculas
                    if (campo === 'codigo') {
                        valor = valor.toUpperCase();
                    }
                    campos.push(`${campo} = $${paramIndex}`);
                    values.push(valor);
                    paramIndex++;
                }
            }

            if (campos.length === 0) {
                return await this.obtenerPorId(id, organizacionId);
            }

            values.push(id);

            const query = `
                UPDATE cupones
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            const result = await db.query(query, values);
            return result.rows[0] || null;
        });
    }

    /**
     * Eliminar cupón (solo si no tiene usos)
     * @param {number} id - ID del cupón
     * @param {number} organizacionId - ID de la organización
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar si tiene usos
            const usosQuery = `SELECT COUNT(*) as usos FROM uso_cupones WHERE cupon_id = $1`;
            const usosResult = await db.query(usosQuery, [id]);

            if (parseInt(usosResult.rows[0].usos) > 0) {
                ErrorHelper.throwConflict('No se puede eliminar un cupón que ya ha sido utilizado');
            }

            const query = `DELETE FROM cupones WHERE id = $1 RETURNING id`;
            const result = await db.query(query, [id]);
            return result.rowCount > 0;
        });
    }

    /**
     * Validar cupón usando la función SQL
     * @param {Object} params - Parámetros de validación
     */
    static async validar(params) {
        const { organizacionId, codigo, subtotal, clienteId, productosIds } = params;

        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT validar_cupon($1, $2, $3, $4, $5) as resultado
            `;

            const values = [
                organizacionId,
                codigo,
                subtotal,
                clienteId || null,
                productosIds || null
            ];

            const result = await db.query(query, values);
            return result.rows[0].resultado;
        });
    }

    /**
     * Aplicar cupón a una venta
     * @param {Object} params - Parámetros de aplicación
     */
    static async aplicar(params) {
        const { cuponId, ventaPosId, clienteId, subtotalAntes } = params;

        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT aplicar_cupon($1, $2, $3, $4) as uso
            `;

            const values = [cuponId, ventaPosId, clienteId || null, subtotalAntes || null];

            const result = await db.query(query, values);
            return result.rows[0].uso;
        });
    }

    /**
     * Obtener historial de uso de un cupón
     * @param {number} cuponId - ID del cupón
     * @param {number} organizacionId - ID de la organización
     * @param {Object} options - Opciones de paginación
     */
    static async obtenerHistorialUso(cuponId, organizacionId, options = {}) {
        const { limit = 50, offset = 0 } = options;

        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    uc.*,
                    v.numero_ticket,
                    v.fecha_venta,
                    v.total as total_venta,
                    c.nombre as cliente_nombre,
                    c.email as cliente_email
                FROM uso_cupones uc
                JOIN ventas_pos v ON uc.venta_pos_id = v.id
                LEFT JOIN clientes c ON uc.cliente_id = c.id
                WHERE uc.cupon_id = $1
                ORDER BY uc.aplicado_en DESC
                LIMIT $2 OFFSET $3
            `;

            const result = await db.query(query, [cuponId, limit, offset]);
            return result.rows;
        });
    }

    /**
     * Obtener estadísticas de un cupón
     * @param {number} cuponId - ID del cupón
     * @param {number} organizacionId - ID de la organización
     */
    static async obtenerEstadisticas(cuponId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    c.id,
                    c.codigo,
                    c.nombre,
                    c.usos_actuales,
                    c.usos_maximos,
                    c.fecha_inicio,
                    c.fecha_fin,
                    COUNT(uc.id) as total_usos,
                    COALESCE(SUM(uc.descuento_aplicado), 0) as total_descuento_dado,
                    COALESCE(SUM(uc.subtotal_antes), 0) as total_ventas_con_cupon,
                    COALESCE(AVG(uc.descuento_aplicado), 0) as descuento_promedio,
                    COUNT(DISTINCT uc.cliente_id) as clientes_unicos,
                    MAX(uc.aplicado_en) as ultimo_uso
                FROM cupones c
                LEFT JOIN uso_cupones uc ON c.id = uc.cupon_id
                WHERE c.id = $1
                GROUP BY c.id
            `;

            const result = await db.query(query, [cuponId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener cupones vigentes para aplicar en POS
     * @param {number} organizacionId - ID de la organización
     */
    static async listarVigentes(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    id,
                    codigo,
                    nombre,
                    tipo_descuento,
                    valor,
                    monto_minimo,
                    monto_maximo_descuento,
                    fecha_fin,
                    usos_maximos,
                    usos_actuales,
                    solo_primera_compra
                FROM cupones
                WHERE activo = true
                AND fecha_inicio <= CURRENT_DATE
                AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
                AND (usos_maximos IS NULL OR usos_actuales < usos_maximos)
                ORDER BY nombre
            `;

            const result = await db.query(query);
            return result.rows;
        });
    }
}

module.exports = CuponesModel;
