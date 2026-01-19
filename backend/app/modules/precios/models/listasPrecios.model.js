/**
 * ====================================================================
 * MODEL - LISTAS DE PRECIOS
 * ====================================================================
 *
 * Gestión de listas de precios estilo Odoo.
 * Módulo: Precios (Fase 5)
 *
 * FUNCIONALIDADES:
 * - CRUD de listas de precios
 * - CRUD de items/reglas de precio
 * - Resolución de precio por producto/cliente/cantidad
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

class ListasPreciosModel {
    // ========================================================================
    // LISTAS DE PRECIOS - CRUD
    // ========================================================================

    /**
     * Listar listas de precios de la organización
     */
    static async listar(organizacionId, { soloActivas = true, moneda = null } = {}) {
        return RLSContextManager.query(organizacionId, async (client) => {
            let query = `
                SELECT
                    lp.id,
                    lp.codigo,
                    lp.nombre,
                    lp.descripcion,
                    lp.moneda,
                    lp.es_default,
                    lp.descuento_global_pct,
                    lp.activo,
                    lp.creado_en,
                    lp.actualizado_en,
                    (SELECT COUNT(*) FROM listas_precios_items lpi WHERE lpi.lista_precio_id = lp.id) AS total_items,
                    (SELECT COUNT(*) FROM clientes c WHERE c.lista_precios_id = lp.id AND c.eliminado_en IS NULL) AS total_clientes
                FROM listas_precios lp
                WHERE lp.eliminado_en IS NULL
            `;

            const params = [];

            if (soloActivas) {
                query += ` AND lp.activo = TRUE`;
            }

            if (moneda) {
                params.push(moneda);
                query += ` AND lp.moneda = $${params.length}`;
            }

            query += ` ORDER BY lp.es_default DESC, lp.nombre`;

            const result = await client.query(query, params);
            return result.rows;
        });
    }

    /**
     * Obtener lista por ID
     */
    static async obtenerPorId(organizacionId, listaId) {
        return RLSContextManager.query(organizacionId, async (client) => {
            const query = `
                SELECT
                    lp.*,
                    (SELECT COUNT(*) FROM listas_precios_items lpi WHERE lpi.lista_precio_id = lp.id) AS total_items,
                    (SELECT COUNT(*) FROM clientes c WHERE c.lista_precios_id = lp.id AND c.eliminado_en IS NULL) AS total_clientes
                FROM listas_precios lp
                WHERE lp.id = $1 AND lp.eliminado_en IS NULL
            `;
            const result = await client.query(query, [listaId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Crear lista de precios
     */
    static async crear(organizacionId, datos) {
        return RLSContextManager.transaction(organizacionId, async (client) => {
            const { codigo, nombre, descripcion, moneda, es_default, descuento_global_pct } = datos;

            // Si es default, quitar el flag de otras listas
            if (es_default) {
                await client.query(`
                    UPDATE listas_precios
                    SET es_default = FALSE, actualizado_en = NOW()
                    WHERE organizacion_id = $1 AND es_default = TRUE AND eliminado_en IS NULL
                `, [organizacionId]);
            }

            const query = `
                INSERT INTO listas_precios (
                    organizacion_id, codigo, nombre, descripcion, moneda,
                    es_default, descuento_global_pct
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const result = await client.query(query, [
                organizacionId,
                codigo.toUpperCase(),
                nombre,
                descripcion,
                moneda || 'MXN',
                es_default || false,
                descuento_global_pct || 0
            ]);

            logger.info('[ListasPrecios] Lista creada', {
                organizacionId,
                listaId: result.rows[0].id,
                codigo
            });

            return result.rows[0];
        });
    }

    /**
     * Actualizar lista de precios
     */
    static async actualizar(organizacionId, listaId, datos) {
        return RLSContextManager.transaction(organizacionId, async (client) => {
            const { codigo, nombre, descripcion, moneda, es_default, descuento_global_pct, activo } = datos;

            // Si es default, quitar el flag de otras listas
            if (es_default) {
                await client.query(`
                    UPDATE listas_precios
                    SET es_default = FALSE, actualizado_en = NOW()
                    WHERE organizacion_id = $1 AND id != $2 AND es_default = TRUE AND eliminado_en IS NULL
                `, [organizacionId, listaId]);
            }

            const query = `
                UPDATE listas_precios SET
                    codigo = COALESCE($1, codigo),
                    nombre = COALESCE($2, nombre),
                    descripcion = COALESCE($3, descripcion),
                    moneda = COALESCE($4, moneda),
                    es_default = COALESCE($5, es_default),
                    descuento_global_pct = COALESCE($6, descuento_global_pct),
                    activo = COALESCE($7, activo),
                    actualizado_en = NOW()
                WHERE id = $8 AND eliminado_en IS NULL
                RETURNING *
            `;

            const result = await client.query(query, [
                codigo?.toUpperCase(),
                nombre,
                descripcion,
                moneda,
                es_default,
                descuento_global_pct,
                activo,
                listaId
            ]);

            return result.rows[0] || null;
        });
    }

    /**
     * Eliminar lista (soft delete)
     */
    static async eliminar(organizacionId, listaId, usuarioId) {
        return RLSContextManager.transaction(organizacionId, async (client) => {
            // Verificar que no es la lista default
            const lista = await client.query(
                'SELECT es_default FROM listas_precios WHERE id = $1 AND eliminado_en IS NULL',
                [listaId]
            );

            if (lista.rows[0]?.es_default) {
                ErrorHelper.throwConflict('No se puede eliminar la lista de precios por defecto');
            }

            // Quitar asignación de clientes
            await client.query(
                'UPDATE clientes SET lista_precios_id = NULL WHERE lista_precios_id = $1',
                [listaId]
            );

            // Soft delete
            const query = `
                UPDATE listas_precios
                SET eliminado_en = NOW(), eliminado_por = $1, activo = FALSE
                WHERE id = $2 AND eliminado_en IS NULL
                RETURNING id
            `;

            const result = await client.query(query, [usuarioId, listaId]);
            return result.rows[0] || null;
        });
    }

    // ========================================================================
    // ITEMS DE LISTA - CRUD
    // ========================================================================

    /**
     * Listar items de una lista
     */
    static async listarItems(organizacionId, listaId) {
        return RLSContextManager.query(organizacionId, async (client) => {
            const query = `
                SELECT
                    lpi.*,
                    p.nombre AS producto_nombre,
                    p.sku AS producto_sku,
                    cp.nombre AS categoria_nombre
                FROM listas_precios_items lpi
                LEFT JOIN productos p ON p.id = lpi.producto_id
                LEFT JOIN categorias_productos cp ON cp.id = lpi.categoria_id
                WHERE lpi.lista_precio_id = $1
                ORDER BY
                    CASE WHEN lpi.producto_id IS NOT NULL THEN 1
                         WHEN lpi.categoria_id IS NOT NULL THEN 2
                         ELSE 3 END,
                    lpi.prioridad DESC,
                    lpi.cantidad_minima
            `;
            const result = await client.query(query, [listaId]);
            return result.rows;
        });
    }

    /**
     * Crear item de lista
     */
    static async crearItem(organizacionId, listaId, datos) {
        return RLSContextManager.query(organizacionId, async (client) => {
            const {
                producto_id,
                categoria_id,
                cantidad_minima,
                cantidad_maxima,
                precio_fijo,
                descuento_pct,
                prioridad
            } = datos;

            const query = `
                INSERT INTO listas_precios_items (
                    lista_precio_id, producto_id, categoria_id,
                    cantidad_minima, cantidad_maxima,
                    precio_fijo, descuento_pct, prioridad
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const result = await client.query(query, [
                listaId,
                producto_id,
                categoria_id,
                cantidad_minima || 1,
                cantidad_maxima,
                precio_fijo,
                descuento_pct,
                prioridad || 0
            ]);

            return result.rows[0];
        });
    }

    /**
     * Actualizar item de lista
     */
    static async actualizarItem(organizacionId, itemId, datos) {
        return RLSContextManager.query(organizacionId, async (client) => {
            const {
                producto_id,
                categoria_id,
                cantidad_minima,
                cantidad_maxima,
                precio_fijo,
                descuento_pct,
                prioridad
            } = datos;

            const query = `
                UPDATE listas_precios_items SET
                    producto_id = $1,
                    categoria_id = $2,
                    cantidad_minima = COALESCE($3, cantidad_minima),
                    cantidad_maxima = $4,
                    precio_fijo = $5,
                    descuento_pct = $6,
                    prioridad = COALESCE($7, prioridad),
                    actualizado_en = NOW()
                WHERE id = $8
                RETURNING *
            `;

            const result = await client.query(query, [
                producto_id,
                categoria_id,
                cantidad_minima,
                cantidad_maxima,
                precio_fijo,
                descuento_pct,
                prioridad,
                itemId
            ]);

            return result.rows[0] || null;
        });
    }

    /**
     * Eliminar item de lista
     */
    static async eliminarItem(organizacionId, itemId) {
        return RLSContextManager.query(organizacionId, async (client) => {
            const query = `DELETE FROM listas_precios_items WHERE id = $1 RETURNING id`;
            const result = await client.query(query, [itemId]);
            return result.rows[0] || null;
        });
    }

    // ========================================================================
    // RESOLUCIÓN DE PRECIOS
    // ========================================================================

    /**
     * Obtener precio de producto usando la función SQL
     */
    static async obtenerPrecioProducto(organizacionId, productoId, opciones = {}) {
        const { clienteId, cantidad, moneda, sucursalId } = opciones;

        return RLSContextManager.query(organizacionId, async (client) => {
            const query = `
                SELECT * FROM obtener_precio_producto($1, $2, $3, $4, $5)
            `;
            const result = await client.query(query, [
                productoId,
                clienteId || null,
                cantidad || 1,
                moneda || null,
                sucursalId || null
            ]);

            return result.rows[0] || null;
        });
    }

    /**
     * Obtener precios de múltiples productos (carrito)
     */
    static async obtenerPreciosCarrito(organizacionId, items, opciones = {}) {
        const { clienteId, moneda, sucursalId } = opciones;

        return RLSContextManager.query(organizacionId, async (client) => {
            const query = `
                SELECT * FROM obtener_precios_carrito($1, $2, $3, $4)
            `;
            const result = await client.query(query, [
                JSON.stringify(items),
                clienteId || null,
                moneda || null,
                sucursalId || null
            ]);

            return result.rows;
        });
    }

    // ========================================================================
    // ASIGNACIÓN A CLIENTES
    // ========================================================================

    /**
     * Asignar lista a cliente
     */
    static async asignarACliente(organizacionId, clienteId, listaId) {
        return RLSContextManager.query(organizacionId, async (client) => {
            const query = `
                UPDATE clientes
                SET lista_precios_id = $1, actualizado_en = NOW()
                WHERE id = $2 AND eliminado_en IS NULL
                RETURNING id, nombre, lista_precios_id
            `;
            const result = await client.query(query, [listaId, clienteId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Asignar lista a múltiples clientes
     */
    static async asignarAClientesBulk(organizacionId, clienteIds, listaId) {
        return RLSContextManager.query(organizacionId, async (client) => {
            const query = `
                UPDATE clientes
                SET lista_precios_id = $1, actualizado_en = NOW()
                WHERE id = ANY($2) AND eliminado_en IS NULL
                RETURNING id
            `;
            const result = await client.query(query, [listaId, clienteIds]);
            return result.rows;
        });
    }

    /**
     * Listar clientes con lista asignada
     */
    static async listarClientesPorLista(organizacionId, listaId) {
        return RLSContextManager.query(organizacionId, async (client) => {
            const query = `
                SELECT id, nombre, email, telefono
                FROM clientes
                WHERE lista_precios_id = $1 AND eliminado_en IS NULL
                ORDER BY nombre
            `;
            const result = await client.query(query, [listaId]);
            return result.rows;
        });
    }
}

module.exports = ListasPreciosModel;
