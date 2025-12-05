const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const PaginationHelper = require('../../../utils/helpers').PaginationHelper;

/**
 * Model para gestión de asientos contables (libro diario)
 * Soporta asientos manuales y automáticos (POS, compras)
 */
class AsientosModel {

    /**
     * Listar asientos con filtros y paginación
     */
    static async listar(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['a.organizacion_id = $1'];
            let queryParams = [organizacionId];
            let paramIndex = 2;

            // Filtro por estado
            if (filtros.estado) {
                whereConditions.push(`a.estado = $${paramIndex}`);
                queryParams.push(filtros.estado);
                paramIndex++;
            }

            // Filtro por tipo
            if (filtros.tipo) {
                whereConditions.push(`a.tipo = $${paramIndex}`);
                queryParams.push(filtros.tipo);
                paramIndex++;
            }

            // Filtro por período (buscar por año y mes)
            if (filtros.periodo_anio && filtros.periodo_mes) {
                whereConditions.push(`EXTRACT(YEAR FROM a.fecha) = $${paramIndex} AND EXTRACT(MONTH FROM a.fecha) = $${paramIndex + 1}`);
                queryParams.push(filtros.periodo_anio, filtros.periodo_mes);
                paramIndex += 2;
            }

            // Filtro por rango de fechas
            if (filtros.fecha_desde) {
                whereConditions.push(`a.fecha >= $${paramIndex}`);
                queryParams.push(filtros.fecha_desde);
                paramIndex++;
            }

            if (filtros.fecha_hasta) {
                whereConditions.push(`a.fecha <= $${paramIndex}`);
                queryParams.push(filtros.fecha_hasta);
                paramIndex++;
            }

            // Búsqueda por texto (concepto o número)
            if (filtros.busqueda) {
                whereConditions.push(`(a.concepto ILIKE $${paramIndex} OR a.numero_asiento::text = $${paramIndex + 1})`);
                queryParams.push(`%${filtros.busqueda}%`, filtros.busqueda);
                paramIndex += 2;
            }

            const whereClause = whereConditions.join(' AND ');

            // Query para contar total
            const countResult = await db.query(
                `SELECT COUNT(*) as total FROM asientos_contables a WHERE ${whereClause}`,
                queryParams
            );
            const total = parseInt(countResult.rows[0].total);

            // Paginación
            const { limit, offset } = PaginationHelper.calculatePagination(
                filtros.pagina || 1,
                filtros.limite || 20
            );

            // Query principal
            const query = `
                SELECT
                    a.*,
                    p.anio || '-' || LPAD(p.mes::text, 2, '0') as periodo_nombre,
                    uc.nombre as creado_por_nombre,
                    up.nombre as publicado_por_nombre,
                    (SELECT COUNT(*) FROM movimientos_contables WHERE asiento_id = a.id AND asiento_fecha = a.fecha) as num_movimientos
                FROM asientos_contables a
                LEFT JOIN periodos_contables p ON a.fecha BETWEEN p.fecha_inicio AND p.fecha_fin AND p.organizacion_id = a.organizacion_id
                LEFT JOIN usuarios uc ON a.creado_por = uc.id
                LEFT JOIN usuarios up ON a.publicado_por = up.id
                WHERE ${whereClause}
                ORDER BY a.fecha DESC, a.numero_asiento DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(limit, offset);

            const result = await db.query(query, queryParams);

            return {
                asientos: result.rows,
                paginacion: PaginationHelper.getPaginationInfo(filtros.pagina || 1, filtros.limite || 20, total)
            };
        });
    }

    /**
     * Obtener asiento por ID con todos sus movimientos
     */
    static async obtenerPorId(asientoId, fecha, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener asiento
            const asientoQuery = `
                SELECT
                    a.*,
                    p.anio || '-' || LPAD(p.mes::text, 2, '0') as periodo_nombre,
                    p.estado as periodo_estado,
                    uc.nombre as creado_por_nombre,
                    up.nombre as publicado_por_nombre,
                    ua.nombre as anulado_por_nombre
                FROM asientos_contables a
                LEFT JOIN periodos_contables p ON a.fecha BETWEEN p.fecha_inicio AND p.fecha_fin AND p.organizacion_id = a.organizacion_id
                LEFT JOIN usuarios uc ON a.creado_por = uc.id
                LEFT JOIN usuarios up ON a.publicado_por = up.id
                LEFT JOIN usuarios ua ON a.anulado_por = ua.id
                WHERE a.id = $1 AND a.fecha = $2 AND a.organizacion_id = $3
            `;

            const asientoResult = await db.query(asientoQuery, [asientoId, fecha, organizacionId]);

            if (asientoResult.rows.length === 0) {
                return null;
            }

            const asiento = asientoResult.rows[0];

            // Obtener movimientos
            const movimientosQuery = `
                SELECT
                    m.*,
                    c.codigo as cuenta_codigo,
                    c.nombre as cuenta_nombre,
                    c.tipo as cuenta_tipo,
                    c.naturaleza as cuenta_naturaleza
                FROM movimientos_contables m
                INNER JOIN cuentas_contables c ON m.cuenta_id = c.id
                WHERE m.asiento_id = $1 AND m.asiento_fecha = $2
                ORDER BY m.id
            `;

            const movimientosResult = await db.query(movimientosQuery, [asientoId, fecha]);

            return {
                ...asiento,
                movimientos: movimientosResult.rows
            };
        });
    }

    /**
     * Crear asiento contable con sus movimientos
     */
    static async crear(datos, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Validar que hay movimientos
            if (!datos.movimientos || datos.movimientos.length < 2) {
                throw new Error('Un asiento debe tener al menos 2 movimientos');
            }

            // Calcular totales
            let totalDebe = 0;
            let totalHaber = 0;

            for (const mov of datos.movimientos) {
                totalDebe += parseFloat(mov.debe || 0);
                totalHaber += parseFloat(mov.haber || 0);
            }

            // Validar cuadre si se quiere publicar directamente
            if (datos.estado === 'publicado' && Math.abs(totalDebe - totalHaber) > 0.01) {
                throw new Error(`El asiento no cuadra. Debe: ${totalDebe}, Haber: ${totalHaber}`);
            }

            // Crear o verificar período contable para la fecha
            await db.query(
                `SELECT crear_periodo_contable_si_no_existe($1, $2)`,
                [organizacionId, datos.fecha]
            );

            // Crear asiento
            const asientoQuery = `
                INSERT INTO asientos_contables (
                    organizacion_id, fecha, tipo, concepto,
                    referencia, documento_tipo, documento_id,
                    estado, total_debe, total_haber, creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

            const asientoResult = await db.query(asientoQuery, [
                organizacionId,
                datos.fecha,
                datos.tipo || 'manual',
                datos.concepto,
                datos.referencia || null,
                datos.documento_tipo || null,
                datos.documento_id || null,
                datos.estado || 'borrador',
                totalDebe,
                totalHaber,
                usuarioId
            ]);

            const asiento = asientoResult.rows[0];

            // Crear movimientos
            for (const mov of datos.movimientos) {
                await db.query(`
                    INSERT INTO movimientos_contables (
                        organizacion_id, asiento_id, asiento_fecha, cuenta_id,
                        concepto, debe, haber, tercero_tipo, tercero_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    organizacionId,
                    asiento.id,
                    asiento.fecha,
                    mov.cuenta_id,
                    mov.concepto || datos.concepto,
                    mov.debe || 0,
                    mov.haber || 0,
                    mov.tercero_tipo || null,
                    mov.tercero_id || null
                ]);
            }

            logger.info('[AsientosModel.crear] Asiento creado', {
                id: asiento.id,
                numero: asiento.numero_asiento,
                tipo: datos.tipo,
                movimientos: datos.movimientos.length
            });

            // Retornar asiento completo
            return await this.obtenerPorId(asiento.id, asiento.fecha, organizacionId);
        });
    }

    /**
     * Actualizar asiento (solo si está en borrador)
     */
    static async actualizar(asientoId, fecha, datos, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que existe y está en borrador
            const asiento = await db.query(
                `SELECT * FROM asientos_contables WHERE id = $1 AND fecha = $2 AND organizacion_id = $3`,
                [asientoId, fecha, organizacionId]
            );

            if (asiento.rows.length === 0) {
                throw new Error('Asiento no encontrado');
            }

            if (asiento.rows[0].estado !== 'borrador') {
                throw new Error('Solo se pueden modificar asientos en estado borrador');
            }

            // Si hay nuevos movimientos, recalcular totales
            let totalDebe = asiento.rows[0].total_debe;
            let totalHaber = asiento.rows[0].total_haber;

            if (datos.movimientos) {
                // Eliminar movimientos anteriores
                await db.query(
                    `DELETE FROM movimientos_contables WHERE asiento_id = $1 AND asiento_fecha = $2`,
                    [asientoId, fecha]
                );

                // Calcular nuevos totales
                totalDebe = 0;
                totalHaber = 0;

                for (const mov of datos.movimientos) {
                    totalDebe += parseFloat(mov.debe || 0);
                    totalHaber += parseFloat(mov.haber || 0);
                }

                // Crear nuevos movimientos
                for (const mov of datos.movimientos) {
                    await db.query(`
                        INSERT INTO movimientos_contables (
                            organizacion_id, asiento_id, asiento_fecha, cuenta_id,
                            concepto, debe, haber, tercero_tipo, tercero_id
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    `, [
                        organizacionId,
                        asientoId,
                        fecha,
                        mov.cuenta_id,
                        mov.concepto || datos.concepto || asiento.rows[0].concepto,
                        mov.debe || 0,
                        mov.haber || 0,
                        mov.tercero_tipo || null,
                        mov.tercero_id || null
                    ]);
                }
            }

            // Actualizar asiento
            await db.query(`
                UPDATE asientos_contables
                SET
                    concepto = COALESCE($1, concepto),
                    notas = COALESCE($2, notas),
                    total_debe = $3,
                    total_haber = $4,
                    actualizado_en = NOW()
                WHERE id = $5 AND fecha = $6
            `, [
                datos.concepto,
                datos.notas,
                totalDebe,
                totalHaber,
                asientoId,
                fecha
            ]);

            logger.info('[AsientosModel.actualizar] Asiento actualizado', { id: asientoId });

            return await this.obtenerPorId(asientoId, fecha, organizacionId);
        });
    }

    /**
     * Publicar asiento (cambiar de borrador a publicado)
     */
    static async publicar(asientoId, fecha, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar asiento
            const asiento = await db.query(
                `SELECT * FROM asientos_contables WHERE id = $1 AND fecha = $2 AND organizacion_id = $3`,
                [asientoId, fecha, organizacionId]
            );

            if (asiento.rows.length === 0) {
                throw new Error('Asiento no encontrado');
            }

            if (asiento.rows[0].estado !== 'borrador') {
                throw new Error('Solo se pueden publicar asientos en estado borrador');
            }

            // Validar cuadre
            if (Math.abs(asiento.rows[0].total_debe - asiento.rows[0].total_haber) > 0.01) {
                throw new Error('El asiento no cuadra. No se puede publicar.');
            }

            // Verificar que el período esté abierto
            const periodo = await db.query(
                `SELECT estado FROM periodos_contables
                 WHERE organizacion_id = $1 AND $2 BETWEEN fecha_inicio AND fecha_fin`,
                [organizacionId, asiento.rows[0].fecha]
            );

            if (periodo.rows.length > 0 && periodo.rows[0].estado === 'cerrado') {
                throw new Error('No se puede publicar en un período cerrado');
            }

            // Publicar
            await db.query(`
                UPDATE asientos_contables
                SET estado = 'publicado', publicado_en = NOW(), publicado_por = $1, actualizado_en = NOW()
                WHERE id = $2 AND fecha = $3
            `, [usuarioId, asientoId, fecha]);

            logger.info('[AsientosModel.publicar] Asiento publicado', {
                id: asientoId,
                numero: asiento.rows[0].numero_asiento
            });

            return await this.obtenerPorId(asientoId, fecha, organizacionId);
        });
    }

    /**
     * Anular asiento publicado
     */
    static async anular(asientoId, fecha, motivo, organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar asiento
            const asiento = await db.query(
                `SELECT * FROM asientos_contables WHERE id = $1 AND fecha = $2 AND organizacion_id = $3`,
                [asientoId, fecha, organizacionId]
            );

            if (asiento.rows.length === 0) {
                throw new Error('Asiento no encontrado');
            }

            if (asiento.rows[0].estado === 'anulado') {
                throw new Error('El asiento ya está anulado');
            }

            if (asiento.rows[0].estado === 'borrador') {
                throw new Error('Los asientos en borrador deben eliminarse, no anularse');
            }

            // Anular
            await db.query(`
                UPDATE asientos_contables
                SET estado = 'anulado', anulado_en = NOW(), anulado_por = $1, motivo_anulacion = $2, actualizado_en = NOW()
                WHERE id = $3 AND fecha = $4
            `, [usuarioId, motivo, asientoId, fecha]);

            logger.info('[AsientosModel.anular] Asiento anulado', {
                id: asientoId,
                motivo
            });

            return await this.obtenerPorId(asientoId, fecha, organizacionId);
        });
    }

    /**
     * Eliminar asiento en borrador
     */
    static async eliminar(asientoId, fecha, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar asiento
            const asiento = await db.query(
                `SELECT estado FROM asientos_contables WHERE id = $1 AND fecha = $2 AND organizacion_id = $3`,
                [asientoId, fecha, organizacionId]
            );

            if (asiento.rows.length === 0) {
                throw new Error('Asiento no encontrado');
            }

            if (asiento.rows[0].estado !== 'borrador') {
                throw new Error('Solo se pueden eliminar asientos en estado borrador');
            }

            // Eliminar movimientos
            await db.query(
                `DELETE FROM movimientos_contables WHERE asiento_id = $1 AND asiento_fecha = $2`,
                [asientoId, fecha]
            );

            // Eliminar asiento
            await db.query(
                `DELETE FROM asientos_contables WHERE id = $1 AND fecha = $2`,
                [asientoId, fecha]
            );

            logger.info('[AsientosModel.eliminar] Asiento eliminado', { id: asientoId });

            return { success: true, mensaje: 'Asiento eliminado correctamente' };
        });
    }
}

module.exports = AsientosModel;
