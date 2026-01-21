const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');
const { PaginationHelper, ErrorHelper } = require('../../../utils/helpers');

/**
 * Model para gestión de cuentas contables
 * Basado en el Código Agrupador SAT México (Anexo 24)
 */
class CuentasModel {

    /**
     * Listar cuentas contables con filtros y paginación
     */
    static async listar(filtros, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['c.organizacion_id = $1'];
            let queryParams = [organizacionId];
            let paramIndex = 2;

            // Filtro por tipo de cuenta
            if (filtros.tipo) {
                whereConditions.push(`c.tipo = $${paramIndex}`);
                queryParams.push(filtros.tipo);
                paramIndex++;
            }

            // Filtro por naturaleza
            if (filtros.naturaleza) {
                whereConditions.push(`c.naturaleza = $${paramIndex}`);
                queryParams.push(filtros.naturaleza);
                paramIndex++;
            }

            // Filtro por nivel
            if (filtros.nivel) {
                whereConditions.push(`c.nivel = $${paramIndex}`);
                queryParams.push(filtros.nivel);
                paramIndex++;
            }

            // Filtro por cuenta padre
            if (filtros.cuenta_padre_id) {
                whereConditions.push(`c.cuenta_padre_id = $${paramIndex}`);
                queryParams.push(filtros.cuenta_padre_id);
                paramIndex++;
            }

            // Filtro por activo (usar != null para descartar tanto null como undefined)
            if (filtros.activo != null) {
                whereConditions.push(`c.activo = $${paramIndex}`);
                queryParams.push(filtros.activo);
                paramIndex++;
            }

            // Filtro por afectable (usar != null para descartar tanto null como undefined)
            if (filtros.afectable != null) {
                whereConditions.push(`c.afectable = $${paramIndex}`);
                queryParams.push(filtros.afectable);
                paramIndex++;
            }

            // Búsqueda por texto (código o nombre)
            if (filtros.busqueda) {
                whereConditions.push(`(c.codigo ILIKE $${paramIndex} OR c.nombre ILIKE $${paramIndex})`);
                queryParams.push(`%${filtros.busqueda}%`);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            // Query para contar total
            const countResult = await db.query(
                `SELECT COUNT(*) as total FROM cuentas_contables c WHERE ${whereClause}`,
                queryParams
            );
            const total = parseInt(countResult.rows[0].total);

            // Paginación
            const { limit, offset } = PaginationHelper.calculatePagination(
                filtros.pagina || 1,
                filtros.limite || 50
            );

            // Query principal con cuenta padre
            const query = `
                SELECT
                    c.*,
                    cp.codigo as cuenta_padre_codigo,
                    cp.nombre as cuenta_padre_nombre,
                    (SELECT COUNT(*) FROM cuentas_contables WHERE cuenta_padre_id = c.id) as tiene_hijos
                FROM cuentas_contables c
                LEFT JOIN cuentas_contables cp ON c.cuenta_padre_id = cp.id
                WHERE ${whereClause}
                ORDER BY c.codigo ASC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(limit, offset);

            const result = await db.query(query, queryParams);

            return {
                cuentas: result.rows,
                paginacion: PaginationHelper.getPaginationInfo(filtros.pagina || 1, filtros.limite || 50, total)
            };
        });
    }

    /**
     * Obtener árbol de cuentas (estructura jerárquica)
     */
    static async obtenerArbol(organizacionId, soloActivas = true) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereClause = 'organizacion_id = $1';
            if (soloActivas) {
                whereClause += ' AND activo = true';
            }

            const query = `
                WITH RECURSIVE arbol_cuentas AS (
                    -- Cuentas raíz (nivel 1)
                    SELECT
                        id, codigo, nombre, tipo, naturaleza, nivel,
                        cuenta_padre_id, afectable, activo,
                        codigo::text as path,
                        ARRAY[id] as ancestors
                    FROM cuentas_contables
                    WHERE ${whereClause} AND cuenta_padre_id IS NULL

                    UNION ALL

                    -- Cuentas hijas
                    SELECT
                        c.id, c.codigo, c.nombre, c.tipo, c.naturaleza, c.nivel,
                        c.cuenta_padre_id, c.afectable, c.activo,
                        (a.path || '.' || c.codigo)::text,
                        a.ancestors || c.id
                    FROM cuentas_contables c
                    INNER JOIN arbol_cuentas a ON c.cuenta_padre_id = a.id
                    WHERE c.organizacion_id = $1 ${soloActivas ? 'AND c.activo = true' : ''}
                )
                SELECT * FROM arbol_cuentas
                ORDER BY path
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }

    /**
     * Obtener cuenta por ID
     */
    static async obtenerPorId(cuentaId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    c.*,
                    cp.codigo as cuenta_padre_codigo,
                    cp.nombre as cuenta_padre_nombre,
                    (SELECT COUNT(*) FROM movimientos_contables WHERE cuenta_id = c.id) as total_movimientos,
                    (SELECT COALESCE(SUM(debe) - SUM(haber), 0) FROM movimientos_contables WHERE cuenta_id = c.id) as saldo_actual
                FROM cuentas_contables c
                LEFT JOIN cuentas_contables cp ON c.cuenta_padre_id = cp.id
                WHERE c.id = $1 AND c.organizacion_id = $2
            `;

            const result = await db.query(query, [cuentaId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Obtener cuenta por código
     */
    static async obtenerPorCodigo(codigo, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                `SELECT * FROM cuentas_contables WHERE codigo = $1 AND organizacion_id = $2`,
                [codigo, organizacionId]
            );
            return result.rows[0] || null;
        });
    }

    /**
     * Crear nueva cuenta contable
     */
    static async crear(datos, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Validar código único
            const existente = await db.query(
                `SELECT id FROM cuentas_contables WHERE codigo = $1 AND organizacion_id = $2`,
                [datos.codigo, organizacionId]
            );

            if (existente.rows.length > 0) {
                ErrorHelper.throwConflict(`Ya existe una cuenta con el código ${datos.codigo}`);
            }

            // Si tiene cuenta padre, validar que exista y determinar nivel
            let nivel = 1;
            if (datos.cuenta_padre_id) {
                const padre = await db.query(
                    `SELECT id, nivel, afectable FROM cuentas_contables WHERE id = $1 AND organizacion_id = $2`,
                    [datos.cuenta_padre_id, organizacionId]
                );

                ErrorHelper.throwIfNotFound(padre.rows[0], 'Cuenta padre');

                if (padre.rows[0].afectable) {
                    ErrorHelper.throwConflict('No se pueden crear subcuentas de una cuenta afectable');
                }

                nivel = padre.rows[0].nivel + 1;
            }

            const query = `
                INSERT INTO cuentas_contables (
                    organizacion_id, codigo, nombre, tipo, naturaleza, nivel,
                    cuenta_padre_id, codigo_agrupador, afectable, activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `;

            const result = await db.query(query, [
                organizacionId,
                datos.codigo,
                datos.nombre,
                datos.tipo,
                datos.naturaleza,
                nivel,
                datos.cuenta_padre_id || null,
                datos.codigo_agrupador || datos.codigo_sat || null,
                datos.afectable !== false, // Por defecto true
                datos.activo !== false     // Por defecto true
            ]);

            logger.info('[CuentasModel.crear] Cuenta creada', {
                id: result.rows[0].id,
                codigo: datos.codigo,
                nombre: datos.nombre
            });

            return result.rows[0];
        });
    }

    /**
     * Actualizar cuenta contable
     */
    static async actualizar(cuentaId, datos, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que existe
            const cuenta = await db.query(
                `SELECT * FROM cuentas_contables WHERE id = $1 AND organizacion_id = $2`,
                [cuentaId, organizacionId]
            );

            ErrorHelper.throwIfNotFound(cuenta.rows[0], 'Cuenta');

            // Si es cuenta de sistema, solo permitir cambiar nombre
            if (cuenta.rows[0].es_cuenta_sistema && (datos.codigo || datos.tipo || datos.naturaleza)) {
                ErrorHelper.throwConflict('No se puede modificar el código, tipo o naturaleza de una cuenta del sistema');
            }

            // Si cambia el código, validar unicidad
            if (datos.codigo && datos.codigo !== cuenta.rows[0].codigo) {
                const existente = await db.query(
                    `SELECT id FROM cuentas_contables WHERE codigo = $1 AND organizacion_id = $2 AND id != $3`,
                    [datos.codigo, organizacionId, cuentaId]
                );
                if (existente.rows.length > 0) {
                    ErrorHelper.throwConflict(`Ya existe una cuenta con el código ${datos.codigo}`);
                }
            }

            const query = `
                UPDATE cuentas_contables
                SET
                    codigo = COALESCE($1, codigo),
                    nombre = COALESCE($2, nombre),
                    tipo = COALESCE($3, tipo),
                    naturaleza = COALESCE($4, naturaleza),
                    codigo_agrupador = COALESCE($5, codigo_agrupador),
                    afectable = COALESCE($6, afectable),
                    activo = COALESCE($7, activo),
                    actualizado_en = NOW()
                WHERE id = $8 AND organizacion_id = $9
                RETURNING *
            `;

            const result = await db.query(query, [
                datos.codigo,
                datos.nombre,
                datos.tipo,
                datos.naturaleza,
                datos.codigo_agrupador || datos.codigo_sat,
                datos.afectable,
                datos.activo,
                cuentaId,
                organizacionId
            ]);

            logger.info('[CuentasModel.actualizar] Cuenta actualizada', {
                id: cuentaId,
                cambios: Object.keys(datos)
            });

            return result.rows[0];
        });
    }

    /**
     * Eliminar cuenta (soft delete - desactivar)
     */
    static async eliminar(cuentaId, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar que existe
            const cuenta = await db.query(
                `SELECT * FROM cuentas_contables WHERE id = $1 AND organizacion_id = $2`,
                [cuentaId, organizacionId]
            );

            ErrorHelper.throwIfNotFound(cuenta.rows[0], 'Cuenta');

            if (cuenta.rows[0].es_cuenta_sistema) {
                ErrorHelper.throwConflict('No se puede eliminar una cuenta del sistema');
            }

            // Verificar que no tenga movimientos
            const movimientos = await db.query(
                `SELECT COUNT(*) as total FROM movimientos_contables WHERE cuenta_id = $1`,
                [cuentaId]
            );

            if (parseInt(movimientos.rows[0].total) > 0) {
                ErrorHelper.throwConflict('No se puede eliminar una cuenta con movimientos. Desactívela en su lugar.');
            }

            // Verificar que no tenga subcuentas activas
            const subcuentas = await db.query(
                `SELECT COUNT(*) as total FROM cuentas_contables WHERE cuenta_padre_id = $1 AND activo = true`,
                [cuentaId]
            );

            if (parseInt(subcuentas.rows[0].total) > 0) {
                ErrorHelper.throwConflict('No se puede eliminar una cuenta con subcuentas activas');
            }

            // Soft delete
            await db.query(
                `UPDATE cuentas_contables SET activo = false, actualizado_en = NOW() WHERE id = $1`,
                [cuentaId]
            );

            logger.info('[CuentasModel.eliminar] Cuenta desactivada', { id: cuentaId });

            return { success: true, mensaje: 'Cuenta desactivada correctamente' };
        });
    }

    /**
     * Obtener cuentas afectables (para selects en asientos)
     */
    static async listarAfectables(organizacionId, tipo = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereClause = 'organizacion_id = $1 AND afectable = true AND activo = true';
            const params = [organizacionId];

            if (tipo) {
                whereClause += ' AND tipo = $2';
                params.push(tipo);
            }

            const result = await db.query(
                `SELECT id, codigo, nombre, tipo, naturaleza
                 FROM cuentas_contables
                 WHERE ${whereClause}
                 ORDER BY codigo`,
                params
            );

            return result.rows;
        });
    }

    /**
     * Inicializar catálogo de cuentas SAT para una organización
     */
    static async inicializarCatalogoSAT(organizacionId, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Verificar si ya tiene cuentas
            const cuentasExistentes = await db.query(
                `SELECT COUNT(*) as total FROM cuentas_contables WHERE organizacion_id = $1`,
                [organizacionId]
            );

            if (parseInt(cuentasExistentes.rows[0].total) > 0) {
                ErrorHelper.throwConflict('La organización ya tiene cuentas contables. No se puede reinicializar.');
            }

            // Llamar a la función SQL que crea el catálogo
            await db.query(
                `SELECT crear_catalogo_cuentas_sat($1)`,
                [organizacionId]
            );

            logger.info('[CuentasModel.inicializarCatalogoSAT] Catálogo SAT creado', {
                organizacion_id: organizacionId,
                usuario_id: usuarioId
            });

            // Contar cuentas creadas
            const totalCreadas = await db.query(
                `SELECT COUNT(*) as total FROM cuentas_contables WHERE organizacion_id = $1`,
                [organizacionId]
            );

            return {
                success: true,
                mensaje: 'Catálogo de cuentas SAT inicializado correctamente',
                cuentas_creadas: parseInt(totalCreadas.rows[0].total)
            };
        });
    }
}

module.exports = CuentasModel;
