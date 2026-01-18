/**
 * ====================================================================
 * MODEL - PROMOCIONES AUTOMATICAS
 * ====================================================================
 *
 * Modelo para gestion de promociones automaticas en POS
 * - CRUD de promociones
 * - Motor de evaluacion de promociones
 * - Aplicacion y tracking de uso
 *
 * Ene 2026 - Fase 3 POS
 * ====================================================================
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ResourceInUseError } = require('../../../utils/errors');

class PromocionesModel {

    /**
     * Crear una nueva promocion
     * @param {Object} data - Datos de la promocion
     * @param {number} organizacionId - ID de la organizacion
     * @param {number} usuarioId - ID del usuario creador
     */
    static async crear(data, organizacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO promociones (
                    organizacion_id,
                    codigo,
                    nombre,
                    descripcion,
                    tipo,
                    reglas,
                    valor_descuento,
                    fecha_inicio,
                    fecha_fin,
                    hora_inicio,
                    hora_fin,
                    dias_semana,
                    prioridad,
                    exclusiva,
                    acumulable_cupones,
                    usos_maximos,
                    usos_por_cliente,
                    monto_minimo,
                    monto_maximo_descuento,
                    solo_primera_compra,
                    sucursales_ids,
                    activo,
                    creado_por
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
                )
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.codigo.toUpperCase(),
                data.nombre,
                data.descripcion || null,
                data.tipo,
                JSON.stringify(data.reglas || {}),
                data.valor_descuento || null,
                data.fecha_inicio || new Date().toISOString().split('T')[0],
                data.fecha_fin || null,
                data.hora_inicio || null,
                data.hora_fin || null,
                data.dias_semana || null,
                data.prioridad || 0,
                data.exclusiva || false,
                data.acumulable_cupones !== false,
                data.usos_maximos || null,
                data.usos_por_cliente || null,
                data.monto_minimo || 0,
                data.monto_maximo_descuento || null,
                data.solo_primera_compra || false,
                data.sucursales_ids || null,
                data.activo !== false,
                usuarioId
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Obtener promocion por ID
     * @param {number} id - ID de la promocion
     * @param {number} organizacionId - ID de la organizacion
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT p.*,
                    (SELECT COUNT(*) FROM uso_promociones WHERE promocion_id = p.id) as usos_registrados
                FROM promociones p
                WHERE p.id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener promocion por codigo
     * @param {string} codigo - Codigo de la promocion
     * @param {number} organizacionId - ID de la organizacion
     */
    static async obtenerPorCodigo(codigo, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT p.*,
                    (SELECT COUNT(*) FROM uso_promociones WHERE promocion_id = p.id) as usos_registrados
                FROM promociones p
                WHERE UPPER(p.codigo) = UPPER($1)
            `;

            const result = await db.query(query, [codigo]);
            return result.rows[0] || null;
        });
    }

    /**
     * Listar promociones con paginacion
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
            tipo,
            ordenPor = 'prioridad',
            orden = 'DESC'
        } = options;

        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = [];
            const values = [];
            let paramIndex = 1;

            // Filtro por busqueda
            if (busqueda) {
                whereConditions.push(`(
                    p.codigo ILIKE $${paramIndex} OR
                    p.nombre ILIKE $${paramIndex}
                )`);
                values.push(`%${busqueda}%`);
                paramIndex++;
            }

            // Filtro por estado
            if (activo !== undefined) {
                whereConditions.push(`p.activo = $${paramIndex}`);
                values.push(activo);
                paramIndex++;
            }

            // Filtro por tipo
            if (tipo) {
                whereConditions.push(`p.tipo = $${paramIndex}`);
                values.push(tipo);
                paramIndex++;
            }

            // Filtro por vigencia
            if (vigente === true) {
                whereConditions.push(`(
                    p.fecha_inicio <= CURRENT_DATE AND
                    (p.fecha_fin IS NULL OR p.fecha_fin >= CURRENT_DATE) AND
                    (p.usos_maximos IS NULL OR p.usos_actuales < p.usos_maximos)
                )`);
            } else if (vigente === false) {
                whereConditions.push(`(
                    p.fecha_inicio > CURRENT_DATE OR
                    p.fecha_fin < CURRENT_DATE OR
                    (p.usos_maximos IS NOT NULL AND p.usos_actuales >= p.usos_maximos)
                )`);
            }

            const whereClause = whereConditions.length > 0
                ? 'WHERE ' + whereConditions.join(' AND ')
                : '';

            // Validar orden
            const ordenColumnas = ['prioridad', 'creado_en', 'codigo', 'nombre', 'fecha_inicio', 'fecha_fin', 'usos_actuales', 'tipo'];
            const ordenCol = ordenColumnas.includes(ordenPor) ? ordenPor : 'prioridad';
            const ordenDir = orden.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            // Query principal
            const query = `
                SELECT p.*,
                    (SELECT COUNT(*) FROM uso_promociones WHERE promocion_id = p.id) as usos_registrados,
                    CASE
                        WHEN p.fecha_fin IS NOT NULL AND p.fecha_fin < CURRENT_DATE THEN 'expirada'
                        WHEN p.fecha_inicio > CURRENT_DATE THEN 'programada'
                        WHEN p.usos_maximos IS NOT NULL AND p.usos_actuales >= p.usos_maximos THEN 'agotada'
                        WHEN p.activo = false THEN 'inactiva'
                        ELSE 'vigente'
                    END as estado_vigencia
                FROM promociones p
                ${whereClause}
                ORDER BY p.${ordenCol} ${ordenDir}, p.id ASC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            values.push(limit, (page - 1) * limit);

            // Query de conteo
            const countQuery = `
                SELECT COUNT(*) as total
                FROM promociones p
                ${whereClause}
            `;

            const [promociones, countResult] = await Promise.all([
                db.query(query, values),
                db.query(countQuery, values.slice(0, paramIndex - 1))
            ]);

            const total = parseInt(countResult.rows[0].total);

            return {
                promociones: promociones.rows,
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
     * Actualizar promocion
     * @param {number} id - ID de la promocion
     * @param {Object} data - Datos a actualizar
     * @param {number} organizacionId - ID de la organizacion
     */
    static async actualizar(id, data, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const campos = [];
            const values = [];
            let paramIndex = 1;

            const camposActualizables = [
                'codigo', 'nombre', 'descripcion', 'tipo', 'reglas', 'valor_descuento',
                'fecha_inicio', 'fecha_fin', 'hora_inicio', 'hora_fin', 'dias_semana',
                'prioridad', 'exclusiva', 'acumulable_cupones', 'usos_maximos',
                'usos_por_cliente', 'monto_minimo', 'monto_maximo_descuento',
                'solo_primera_compra', 'sucursales_ids', 'activo'
            ];

            for (const campo of camposActualizables) {
                if (data[campo] !== undefined) {
                    let valor = data[campo];
                    // Convertir codigo a mayusculas
                    if (campo === 'codigo') {
                        valor = valor.toUpperCase();
                    }
                    // Convertir reglas a JSON
                    if (campo === 'reglas' && typeof valor === 'object') {
                        valor = JSON.stringify(valor);
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
                UPDATE promociones
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            const result = await db.query(query, values);
            return result.rows[0] || null;
        });
    }

    /**
     * Eliminar promocion (solo si no tiene usos)
     * @param {number} id - ID de la promocion
     * @param {number} organizacionId - ID de la organizacion
     *
     * Errores manejados por asyncHandler:
     * - ResourceInUseError → 409 (tiene usos registrados)
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar si tiene usos
            const usosQuery = `SELECT COUNT(*) as usos FROM uso_promociones WHERE promocion_id = $1`;
            const usosResult = await db.query(usosQuery, [id]);

            const totalUsos = parseInt(usosResult.rows[0].usos);
            if (totalUsos > 0) {
                throw new ResourceInUseError('Promoción', 'ventas', totalUsos);
            }

            const query = `DELETE FROM promociones WHERE id = $1 RETURNING id`;
            const result = await db.query(query, [id]);
            return result.rowCount > 0;
        });
    }

    /**
     * Evaluar promociones usando la funcion SQL
     * @param {Object} params - Parametros de evaluacion
     */
    static async evaluar(params) {
        const { organizacionId, items, subtotal, clienteId, sucursalId } = params;

        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT evaluar_promociones_carrito($1, $2, $3, $4, $5) as promociones
            `;

            const values = [
                organizacionId,
                JSON.stringify(items),
                subtotal,
                clienteId || null,
                sucursalId || null
            ];

            const result = await db.query(query, values);
            return result.rows[0].promociones || [];
        });
    }

    /**
     * Aplicar promocion a una venta
     * @param {Object} params - Parametros de aplicacion
     */
    static async aplicar(params) {
        const { promocionId, ventaPosId, clienteId, descuentoTotal, productosAplicados } = params;

        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT aplicar_promocion($1, $2, $3, $4, $5) as uso
            `;

            const values = [
                promocionId,
                ventaPosId,
                clienteId || null,
                descuentoTotal,
                productosAplicados ? JSON.stringify(productosAplicados) : null
            ];

            const result = await db.query(query, values);
            return result.rows[0].uso;
        });
    }

    /**
     * Obtener historial de uso de una promocion
     * @param {number} promocionId - ID de la promocion
     * @param {number} organizacionId - ID de la organizacion
     * @param {Object} options - Opciones de paginacion
     */
    static async obtenerHistorialUso(promocionId, organizacionId, options = {}) {
        const { limit = 50, offset = 0 } = options;

        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    up.*,
                    v.folio,
                    v.fecha_venta,
                    v.total as total_venta,
                    c.nombre as cliente_nombre,
                    c.email as cliente_email
                FROM uso_promociones up
                JOIN ventas_pos v ON up.venta_pos_id = v.id
                LEFT JOIN clientes c ON up.cliente_id = c.id
                WHERE up.promocion_id = $1
                ORDER BY up.aplicado_en DESC
                LIMIT $2 OFFSET $3
            `;

            const result = await db.query(query, [promocionId, limit, offset]);
            return result.rows;
        });
    }

    /**
     * Obtener estadisticas de una promocion
     * @param {number} promocionId - ID de la promocion
     * @param {number} organizacionId - ID de la organizacion
     */
    static async obtenerEstadisticas(promocionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    p.id,
                    p.codigo,
                    p.nombre,
                    p.tipo,
                    p.usos_actuales,
                    p.usos_maximos,
                    p.fecha_inicio,
                    p.fecha_fin,
                    COUNT(up.id) as total_usos,
                    COALESCE(SUM(up.descuento_total), 0) as total_descuento_dado,
                    COALESCE(AVG(up.descuento_total), 0) as descuento_promedio,
                    COUNT(DISTINCT up.cliente_id) as clientes_unicos,
                    MAX(up.aplicado_en) as ultimo_uso,
                    (
                        SELECT COALESCE(SUM(v.total), 0)
                        FROM uso_promociones up2
                        JOIN ventas_pos v ON up2.venta_pos_id = v.id
                        WHERE up2.promocion_id = p.id
                    ) as total_ventas_con_promocion
                FROM promociones p
                LEFT JOIN uso_promociones up ON p.id = up.promocion_id
                WHERE p.id = $1
                GROUP BY p.id
            `;

            const result = await db.query(query, [promocionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener promociones vigentes para POS
     * @param {number} organizacionId - ID de la organizacion
     * @param {number} sucursalId - ID de la sucursal (opcional)
     */
    static async listarVigentes(organizacionId, sucursalId = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let query = `
                SELECT
                    id,
                    codigo,
                    nombre,
                    descripcion,
                    tipo,
                    reglas,
                    valor_descuento,
                    hora_inicio,
                    hora_fin,
                    dias_semana,
                    prioridad,
                    exclusiva,
                    acumulable_cupones,
                    monto_minimo,
                    monto_maximo_descuento,
                    fecha_fin,
                    usos_maximos,
                    usos_actuales
                FROM promociones
                WHERE activo = true
                AND fecha_inicio <= CURRENT_DATE
                AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
                AND (usos_maximos IS NULL OR usos_actuales < usos_maximos)
            `;

            const values = [];
            if (sucursalId) {
                query += ` AND (sucursales_ids IS NULL OR $1 = ANY(sucursales_ids))`;
                values.push(sucursalId);
            }

            query += ` ORDER BY prioridad DESC, nombre`;

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * Cambiar estado activo/inactivo
     * @param {number} id - ID de la promocion
     * @param {boolean} activo - Nuevo estado
     * @param {number} organizacionId - ID de la organizacion
     */
    static async cambiarEstado(id, activo, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE promociones
                SET activo = $1, actualizado_en = NOW()
                WHERE id = $2
                RETURNING *
            `;

            const result = await db.query(query, [activo, id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Duplicar promocion
     * @param {number} id - ID de la promocion a duplicar
     * @param {number} organizacionId - ID de la organizacion
     * @param {number} usuarioId - ID del usuario
     */
    static async duplicar(id, organizacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO promociones (
                    organizacion_id, codigo, nombre, descripcion, tipo, reglas,
                    valor_descuento, fecha_inicio, fecha_fin, hora_inicio, hora_fin,
                    dias_semana, prioridad, exclusiva, acumulable_cupones,
                    usos_maximos, usos_por_cliente, monto_minimo, monto_maximo_descuento,
                    solo_primera_compra, sucursales_ids, activo, creado_por
                )
                SELECT
                    organizacion_id,
                    codigo || '_COPIA_' || EXTRACT(EPOCH FROM NOW())::INTEGER,
                    nombre || ' (Copia)',
                    descripcion,
                    tipo,
                    reglas,
                    valor_descuento,
                    CURRENT_DATE,
                    NULL,
                    hora_inicio,
                    hora_fin,
                    dias_semana,
                    prioridad,
                    exclusiva,
                    acumulable_cupones,
                    usos_maximos,
                    usos_por_cliente,
                    monto_minimo,
                    monto_maximo_descuento,
                    solo_primera_compra,
                    sucursales_ids,
                    false,
                    $2
                FROM promociones
                WHERE id = $1
                RETURNING *
            `;

            const result = await db.query(query, [id, usuarioId]);
            return result.rows[0] || null;
        });
    }
}

module.exports = PromocionesModel;
