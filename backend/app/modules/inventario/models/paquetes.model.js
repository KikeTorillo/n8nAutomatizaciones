/**
 * Model para Paquetes de Envio
 * CRUD de paquetes/bultos para operaciones de empaque
 * Fecha: 31 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class PaquetesModel {
    // ==================== PAQUETES ====================

    /**
     * Crear un nuevo paquete para una operacion de empaque
     * @param {number} organizacionId
     * @param {number} operacionId
     * @param {Object} data - { notas }
     * @param {number} usuarioId
     */
    static async crear(organizacionId, operacionId, data, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT crear_paquete($1, $2, $3) as resultado',
                [operacionId, usuarioId, data.notas || null]
            );

            const resultado = result.rows[0].resultado;

            if (!resultado.exito) {
                throw new Error(resultado.mensaje);
            }

            logger.info('[PaquetesModel.crear] Paquete creado', {
                paquete_id: resultado.paquete_id,
                folio: resultado.folio,
                operacion_id: operacionId
            });

            // Retornar paquete completo
            return this.buscarPorId(organizacionId, resultado.paquete_id);
        });
    }

    /**
     * Obtener paquete por ID con sus items
     * @param {number} organizacionId
     * @param {number} id
     */
    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener paquete
            const paqueteResult = await db.query(`
                SELECT
                    p.*,
                    o.folio as operacion_folio,
                    o.tipo_operacion,
                    o.origen_tipo,
                    o.origen_folio,
                    u.email as creado_por_email,
                    uc.email as cerrado_por_email
                FROM paquetes_envio p
                JOIN operaciones_almacen o ON o.id = p.operacion_id
                LEFT JOIN usuarios u ON u.id = p.creado_por
                LEFT JOIN usuarios uc ON uc.id = p.cerrado_por
                WHERE p.id = $1 AND p.organizacion_id = $2
            `, [id, organizacionId]);

            if (!paqueteResult.rows[0]) {
                return null;
            }

            const paquete = paqueteResult.rows[0];

            // Obtener items del paquete
            const itemsResult = await db.query(`
                SELECT
                    pei.*,
                    pr.nombre as producto_nombre,
                    pr.sku as producto_sku,
                    vp.nombre as variante_nombre,
                    ns.numero_serie,
                    u.email as agregado_por_email
                FROM paquetes_envio_items pei
                JOIN productos pr ON pr.id = pei.producto_id
                LEFT JOIN variantes_producto vp ON vp.id = pei.variante_id
                LEFT JOIN numeros_serie ns ON ns.id = pei.numero_serie_id
                LEFT JOIN usuarios u ON u.id = pei.agregado_por
                WHERE pei.paquete_id = $1
                ORDER BY pei.agregado_en
            `, [id]);

            paquete.items = itemsResult.rows;
            paquete.total_items = itemsResult.rows.length;
            paquete.total_unidades = itemsResult.rows.reduce((sum, item) => sum + item.cantidad, 0);

            return paquete;
        });
    }

    /**
     * Listar paquetes de una operacion
     * @param {number} operacionId
     * @param {number} organizacionId
     */
    static async listarPorOperacion(operacionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(`
                SELECT
                    p.*,
                    u.email as creado_por_email,
                    (SELECT COUNT(*) FROM paquetes_envio_items WHERE paquete_id = p.id) as total_items,
                    (SELECT COALESCE(SUM(cantidad), 0) FROM paquetes_envio_items WHERE paquete_id = p.id) as total_unidades
                FROM paquetes_envio p
                LEFT JOIN usuarios u ON u.id = p.creado_por
                WHERE p.operacion_id = $1 AND p.organizacion_id = $2
                ORDER BY p.creado_en DESC
            `, [operacionId, organizacionId]);

            return result.rows;
        });
    }

    /**
     * Obtener items disponibles para empacar
     * @param {number} operacionId
     * @param {number} organizacionId
     */
    static async obtenerItemsDisponibles(operacionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT * FROM obtener_items_disponibles_empaque($1)',
                [operacionId]
            );
            return result.rows;
        });
    }

    /**
     * Obtener resumen de empaque de una operacion
     * @param {number} operacionId
     * @param {number} organizacionId
     */
    static async obtenerResumen(operacionId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT obtener_resumen_empaque($1) as resumen',
                [operacionId]
            );
            return result.rows[0].resumen;
        });
    }

    // ==================== ITEMS DE PAQUETE ====================

    /**
     * Agregar item a un paquete
     * @param {number} paqueteId
     * @param {Object} data - { operacion_item_id, cantidad, numero_serie_id }
     * @param {number} organizacionId
     * @param {number} usuarioId
     */
    static async agregarItem(paqueteId, data, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT agregar_item_paquete($1, $2, $3, $4, $5) as resultado',
                [
                    paqueteId,
                    data.operacion_item_id,
                    data.cantidad,
                    usuarioId,
                    data.numero_serie_id || null
                ]
            );

            const resultado = result.rows[0].resultado;

            if (!resultado.exito) {
                throw new Error(resultado.mensaje);
            }

            logger.info('[PaquetesModel.agregarItem] Item agregado', {
                paquete_id: paqueteId,
                item_id: resultado.item_id,
                operacion_item_id: data.operacion_item_id
            });

            return resultado;
        });
    }

    /**
     * Remover item de un paquete
     * @param {number} paqueteId
     * @param {number} itemId
     * @param {number} organizacionId
     */
    static async removerItem(paqueteId, itemId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT remover_item_paquete($1, $2) as resultado',
                [paqueteId, itemId]
            );

            const resultado = result.rows[0].resultado;

            if (!resultado.exito) {
                throw new Error(resultado.mensaje);
            }

            logger.info('[PaquetesModel.removerItem] Item removido', {
                paquete_id: paqueteId,
                item_id: itemId
            });

            return resultado;
        });
    }

    // ==================== OPERACIONES DE PAQUETE ====================

    /**
     * Actualizar dimensiones y peso del paquete
     * @param {number} organizacionId
     * @param {number} id
     * @param {Object} data - { peso_kg, largo_cm, ancho_cm, alto_cm, notas, carrier, tracking_carrier }
     */
    static async actualizar(organizacionId, id, data) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que existe y pertenece a la organizacion
            const checkResult = await db.query(
                'SELECT id, estado FROM paquetes_envio WHERE id = $1 AND organizacion_id = $2',
                [id, organizacionId]
            );

            if (!checkResult.rows[0]) {
                throw new Error('Paquete no encontrado');
            }

            const paquete = checkResult.rows[0];

            if (paquete.estado === 'enviado') {
                throw new Error('No se puede modificar un paquete enviado');
            }

            if (paquete.estado === 'cancelado') {
                throw new Error('No se puede modificar un paquete cancelado');
            }

            // Construir query dinamica
            const campos = [];
            const valores = [];
            let idx = 1;

            if (data.peso_kg !== undefined) {
                campos.push(`peso_kg = $${idx++}`);
                valores.push(data.peso_kg);
            }
            if (data.largo_cm !== undefined) {
                campos.push(`largo_cm = $${idx++}`);
                valores.push(data.largo_cm);
            }
            if (data.ancho_cm !== undefined) {
                campos.push(`ancho_cm = $${idx++}`);
                valores.push(data.ancho_cm);
            }
            if (data.alto_cm !== undefined) {
                campos.push(`alto_cm = $${idx++}`);
                valores.push(data.alto_cm);
            }
            if (data.notas !== undefined) {
                campos.push(`notas = $${idx++}`);
                valores.push(data.notas);
            }
            if (data.carrier !== undefined) {
                campos.push(`carrier = $${idx++}`);
                valores.push(data.carrier);
            }
            if (data.tracking_carrier !== undefined) {
                campos.push(`tracking_carrier = $${idx++}`);
                valores.push(data.tracking_carrier);
            }

            if (campos.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            campos.push(`actualizado_en = NOW()`);
            valores.push(id);
            valores.push(organizacionId);

            await db.query(`
                UPDATE paquetes_envio
                SET ${campos.join(', ')}
                WHERE id = $${idx++} AND organizacion_id = $${idx}
            `, valores);

            logger.info('[PaquetesModel.actualizar] Paquete actualizado', { id });

            return this.buscarPorId(organizacionId, id);
        });
    }

    /**
     * Cerrar paquete (no mas modificaciones de items)
     * @param {number} id
     * @param {number} organizacionId
     * @param {number} usuarioId
     */
    static async cerrar(id, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT cerrar_paquete($1, $2) as resultado',
                [id, usuarioId]
            );

            const resultado = result.rows[0].resultado;

            if (!resultado.exito) {
                throw new Error(resultado.mensaje);
            }

            logger.info('[PaquetesModel.cerrar] Paquete cerrado', { id });

            return resultado;
        });
    }

    /**
     * Cancelar paquete
     * @param {number} id
     * @param {string} motivo
     * @param {number} organizacionId
     */
    static async cancelar(id, motivo, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const result = await db.query(
                'SELECT cancelar_paquete($1, $2) as resultado',
                [id, motivo || null]
            );

            const resultado = result.rows[0].resultado;

            if (!resultado.exito) {
                throw new Error(resultado.mensaje);
            }

            logger.info('[PaquetesModel.cancelar] Paquete cancelado', { id, motivo });

            return resultado;
        });
    }

    /**
     * Marcar paquete como etiquetado
     * @param {number} id
     * @param {Object} data - { tracking_carrier, carrier }
     * @param {number} organizacionId
     */
    static async marcarEtiquetado(id, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const checkResult = await db.query(
                'SELECT id, estado FROM paquetes_envio WHERE id = $1 AND organizacion_id = $2',
                [id, organizacionId]
            );

            if (!checkResult.rows[0]) {
                throw new Error('Paquete no encontrado');
            }

            const paquete = checkResult.rows[0];

            if (paquete.estado !== 'cerrado') {
                throw new Error('El paquete debe estar cerrado para etiquetar');
            }

            await db.query(`
                UPDATE paquetes_envio
                SET estado = 'etiquetado',
                    tracking_carrier = COALESCE($3, tracking_carrier),
                    carrier = COALESCE($4, carrier),
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
            `, [id, organizacionId, data.tracking_carrier, data.carrier]);

            logger.info('[PaquetesModel.marcarEtiquetado] Paquete etiquetado', { id });

            return this.buscarPorId(organizacionId, id);
        });
    }

    /**
     * Marcar paquete como enviado
     * @param {number} id
     * @param {number} organizacionId
     */
    static async marcarEnviado(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const checkResult = await db.query(
                'SELECT id, estado FROM paquetes_envio WHERE id = $1 AND organizacion_id = $2',
                [id, organizacionId]
            );

            if (!checkResult.rows[0]) {
                throw new Error('Paquete no encontrado');
            }

            const paquete = checkResult.rows[0];

            if (!['cerrado', 'etiquetado'].includes(paquete.estado)) {
                throw new Error('El paquete debe estar cerrado o etiquetado');
            }

            await db.query(`
                UPDATE paquetes_envio
                SET estado = 'enviado',
                    actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
            `, [id, organizacionId]);

            logger.info('[PaquetesModel.marcarEnviado] Paquete enviado', { id });

            return this.buscarPorId(organizacionId, id);
        });
    }

    /**
     * Generar etiqueta (datos para impresion)
     * @param {number} id
     * @param {number} organizacionId
     */
    static async generarEtiqueta(id, organizacionId) {
        const paquete = await this.buscarPorId(organizacionId, id);

        if (!paquete) {
            throw new Error('Paquete no encontrado');
        }

        // Retornar datos para la etiqueta
        return {
            folio: paquete.folio,
            codigo_barras: paquete.codigo_barras,
            peso_kg: paquete.peso_kg,
            dimensiones: paquete.largo_cm && paquete.ancho_cm && paquete.alto_cm
                ? `${paquete.largo_cm} x ${paquete.ancho_cm} x ${paquete.alto_cm} cm`
                : null,
            volumen_cm3: paquete.volumen_cm3,
            carrier: paquete.carrier,
            tracking: paquete.tracking_carrier,
            operacion_folio: paquete.operacion_folio,
            origen_folio: paquete.origen_folio,
            total_items: paquete.total_items,
            total_unidades: paquete.total_unidades,
            items: paquete.items.map(item => ({
                producto: item.producto_nombre,
                sku: item.producto_sku,
                variante: item.variante_nombre,
                cantidad: item.cantidad,
                numero_serie: item.numero_serie
            })),
            fecha_creacion: paquete.creado_en
        };
    }
}

module.exports = PaquetesModel;
