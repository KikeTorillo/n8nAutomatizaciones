const RLSContextManager = require('../../../utils/rlsContextManager');
const { getDb } = require('../../../config/database');
const logger = require('../../../utils/logger');
const tokenBlacklistService = require('../../../services/tokenBlacklistService');

/**
 * Modelo de Permisos Normalizados
 *
 * Gestiona el sistema de permisos con 3 niveles:
 * 1. permisos_catalogo - Catálogo maestro
 * 2. permisos_rol - Permisos por rol
 * 3. permisos_usuario_sucursal - Override por usuario/sucursal
 */
class PermisosModel {

    // ========================================
    // CATÁLOGO DE PERMISOS
    // ========================================

    /**
     * Listar todos los permisos del catálogo
     * @param {Object} filtros - Filtros opcionales
     * @returns {Promise<Array>}
     */
    static async listarCatalogo(filtros = {}) {
        const db = await getDb();
        try {
            let whereClause = 'WHERE activo = true';
            const params = [];
            let paramIndex = 1;

            if (filtros.modulo) {
                whereClause += ` AND modulo = $${paramIndex++}`;
                params.push(filtros.modulo);
            }

            if (filtros.categoria) {
                whereClause += ` AND categoria = $${paramIndex++}`;
                params.push(filtros.categoria);
            }

            const query = `
                SELECT
                    id,
                    codigo,
                    modulo,
                    categoria,
                    nombre,
                    descripcion,
                    tipo_valor,
                    valor_default,
                    orden_display,
                    visible_en_ui,
                    requiere_plan_pro
                FROM permisos_catalogo
                ${whereClause}
                ORDER BY modulo, orden_display, codigo
            `;

            const result = await db.query(query, params);
            return result.rows;
        } finally {
            db.release();
        }
    }

    /**
     * Obtener módulos disponibles (únicos)
     * @returns {Promise<Array>}
     */
    static async listarModulos() {
        const db = await getDb();
        try {
            const query = `
                SELECT DISTINCT modulo
                FROM permisos_catalogo
                WHERE activo = true
                ORDER BY modulo
            `;
            const result = await db.query(query);
            return result.rows.map(r => r.modulo);
        } finally {
            db.release();
        }
    }

    /**
     * Obtener un permiso del catálogo por código
     * @param {string} codigo
     * @returns {Promise<Object|null>}
     */
    static async obtenerPermisoPorCodigo(codigo) {
        const db = await getDb();
        try {
            const query = `
                SELECT *
                FROM permisos_catalogo
                WHERE codigo = $1 AND activo = true
            `;
            const result = await db.query(query, [codigo]);
            return result.rows[0] || null;
        } finally {
            db.release();
        }
    }

    // ========================================
    // PERMISOS POR ROL
    // ========================================

    /**
     * Listar permisos asignados a un rol
     * @param {string} rol
     * @returns {Promise<Array>}
     */
    static async listarPermisosPorRol(rol) {
        const db = await getDb();
        try {
            const query = `
                SELECT
                    pr.id,
                    pr.rol,
                    pr.permiso_id,
                    pr.valor,
                    pc.codigo,
                    pc.modulo,
                    pc.nombre,
                    pc.tipo_valor,
                    pc.valor_default
                FROM permisos_rol pr
                JOIN permisos_catalogo pc ON pr.permiso_id = pc.id
                WHERE pr.rol = $1 AND pc.activo = true
                ORDER BY pc.modulo, pc.orden_display
            `;
            const result = await db.query(query, [rol]);
            return result.rows;
        } finally {
            db.release();
        }
    }

    /**
     * Asignar permiso a un rol
     * @param {string} rol
     * @param {number} permisoId
     * @param {any} valor
     * @returns {Promise<Object>}
     */
    static async asignarPermisoRol(rol, permisoId, valor) {
        const db = await getDb();
        try {
            const query = `
                INSERT INTO permisos_rol (rol, permiso_id, valor)
                VALUES ($1, $2, $3)
                ON CONFLICT (rol, permiso_id)
                DO UPDATE SET valor = $3, actualizado_en = NOW()
                RETURNING *
            `;
            const result = await db.query(query, [rol, permisoId, JSON.stringify(valor)]);
            return result.rows[0];
        } finally {
            db.release();
        }
    }

    /**
     * Eliminar permiso de un rol (vuelve a default)
     * @param {string} rol
     * @param {number} permisoId
     * @returns {Promise<boolean>}
     */
    static async eliminarPermisoRol(rol, permisoId) {
        const db = await getDb();
        try {
            const query = `
                DELETE FROM permisos_rol
                WHERE rol = $1 AND permiso_id = $2
            `;
            const result = await db.query(query, [rol, permisoId]);
            return result.rowCount > 0;
        } finally {
            db.release();
        }
    }

    /**
     * Actualizar múltiples permisos de un rol
     * @param {string} rol
     * @param {Array} permisos - [{permisoId, valor}]
     * @returns {Promise<number>} - Cantidad de permisos actualizados
     */
    static async actualizarPermisosRol(rol, permisos) {
        const db = await getDb();
        try {
            await db.query('BEGIN');

            let count = 0;
            for (const p of permisos) {
                const query = `
                    INSERT INTO permisos_rol (rol, permiso_id, valor)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (rol, permiso_id)
                    DO UPDATE SET valor = $3, actualizado_en = NOW()
                `;
                await db.query(query, [rol, p.permisoId, JSON.stringify(p.valor)]);
                count++;
            }

            await db.query('COMMIT');
            return count;
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        } finally {
            db.release();
        }
    }

    // ========================================
    // PERMISOS POR USUARIO/SUCURSAL
    // ========================================

    /**
     * Listar overrides de un usuario en una sucursal
     * @param {number} usuarioId
     * @param {number} sucursalId
     * @param {number} organizacionId
     * @returns {Promise<Array>}
     */
    static async listarPermisosUsuarioSucursal(usuarioId, sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    pus.id,
                    pus.usuario_id,
                    pus.sucursal_id,
                    pus.permiso_id,
                    pus.valor,
                    pus.motivo,
                    pus.fecha_inicio,
                    pus.fecha_fin,
                    pus.otorgado_por,
                    pus.otorgado_en,
                    pc.codigo,
                    pc.modulo,
                    pc.nombre,
                    pc.tipo_valor,
                    u.nombre_completo as otorgado_por_nombre
                FROM permisos_usuario_sucursal pus
                JOIN permisos_catalogo pc ON pus.permiso_id = pc.id
                LEFT JOIN usuarios u ON pus.otorgado_por = u.id
                WHERE pus.usuario_id = $1
                  AND pus.sucursal_id = $2
                  AND (pus.fecha_fin IS NULL OR pus.fecha_fin >= CURRENT_DATE)
                ORDER BY pc.modulo, pc.orden_display
            `;
            const result = await db.query(query, [usuarioId, sucursalId]);
            return result.rows;
        });
    }

    /**
     * Asignar override de permiso a usuario/sucursal
     * @param {Object} data
     * @param {number} organizacionId
     * @param {number} otorgadoPor - ID del usuario que otorga
     * @returns {Promise<Object>}
     */
    static async asignarPermisoUsuarioSucursal(data, organizacionId, otorgadoPor) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const query = `
                INSERT INTO permisos_usuario_sucursal (
                    usuario_id,
                    sucursal_id,
                    permiso_id,
                    valor,
                    motivo,
                    fecha_inicio,
                    fecha_fin,
                    otorgado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (usuario_id, sucursal_id, permiso_id)
                DO UPDATE SET
                    valor = $4,
                    motivo = $5,
                    fecha_inicio = COALESCE($6, permisos_usuario_sucursal.fecha_inicio),
                    fecha_fin = $7,
                    otorgado_por = $8,
                    actualizado_en = NOW()
                RETURNING *
            `;

            const result = await db.query(query, [
                data.usuarioId,
                data.sucursalId,
                data.permisoId,
                JSON.stringify(data.valor),
                data.motivo || null,
                data.fechaInicio || null,
                data.fechaFin || null,
                otorgadoPor
            ]);

            logger.info('[PermisosModel] Override asignado', {
                usuario_id: data.usuarioId,
                sucursal_id: data.sucursalId,
                permiso_id: data.permisoId,
                otorgado_por: otorgadoPor
            });

            // SECURITY FIX (Ene 2026): Invalidar tokens del usuario afectado
            // Esto fuerza al usuario a re-autenticarse para obtener nuevos permisos
            try {
                await tokenBlacklistService.invalidateUserTokens(
                    data.usuarioId,
                    `cambio_permiso_${data.permisoId}_sucursal_${data.sucursalId}`
                );
                logger.info('[PermisosModel] Tokens invalidados por cambio de permiso', {
                    usuario_id: data.usuarioId,
                    permiso_id: data.permisoId,
                    sucursal_id: data.sucursalId
                });
            } catch (tokenError) {
                // No fallar la operación si la invalidación falla
                logger.error('[PermisosModel] Error invalidando tokens', {
                    error: tokenError.message,
                    usuario_id: data.usuarioId
                });
            }

            return result.rows[0];
        });
    }

    /**
     * Eliminar override de permiso usuario/sucursal
     * @param {number} usuarioId
     * @param {number} sucursalId
     * @param {number} permisoId
     * @param {number} organizacionId
     * @returns {Promise<boolean>}
     */
    static async eliminarPermisoUsuarioSucursal(usuarioId, sucursalId, permisoId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                DELETE FROM permisos_usuario_sucursal
                WHERE usuario_id = $1
                  AND sucursal_id = $2
                  AND permiso_id = $3
            `;
            const result = await db.query(query, [usuarioId, sucursalId, permisoId]);

            logger.info('[PermisosModel] Override eliminado', {
                usuario_id: usuarioId,
                sucursal_id: sucursalId,
                permiso_id: permisoId
            });

            return result.rowCount > 0;
        });
    }

    // ========================================
    // RESOLUCIÓN DE PERMISOS
    // ========================================

    /**
     * Obtener permiso efectivo de un usuario
     * Usa la función SQL obtener_permiso()
     * @param {number} usuarioId
     * @param {number} sucursalId
     * @param {string} codigoPermiso
     * @returns {Promise<any>}
     */
    static async obtenerPermiso(usuarioId, sucursalId, codigoPermiso) {
        const db = await getDb();
        try {
            const query = `SELECT obtener_permiso($1, $2, $3) as valor`;
            const result = await db.query(query, [usuarioId, sucursalId, codigoPermiso]);
            return result.rows[0]?.valor;
        } finally {
            db.release();
        }
    }

    /**
     * Verificar si usuario tiene un permiso booleano
     * Usa la función SQL tiene_permiso()
     * @param {number} usuarioId
     * @param {number} sucursalId
     * @param {string} codigoPermiso
     * @returns {Promise<boolean>}
     */
    static async tienePermiso(usuarioId, sucursalId, codigoPermiso) {
        const db = await getDb();
        try {
            const query = `SELECT tiene_permiso($1, $2, $3) as tiene`;
            const result = await db.query(query, [usuarioId, sucursalId, codigoPermiso]);
            return result.rows[0]?.tiene === true;
        } finally {
            db.release();
        }
    }

    /**
     * Obtener valor numérico de un permiso
     * @param {number} usuarioId
     * @param {number} sucursalId
     * @param {string} codigoPermiso
     * @returns {Promise<number>}
     */
    static async obtenerValorNumerico(usuarioId, sucursalId, codigoPermiso) {
        const db = await getDb();
        try {
            const query = `SELECT obtener_valor_permiso_numerico($1, $2, $3) as valor`;
            const result = await db.query(query, [usuarioId, sucursalId, codigoPermiso]);
            return result.rows[0]?.valor || 0;
        } finally {
            db.release();
        }
    }

    /**
     * Obtener todos los permisos efectivos de un usuario
     * Usa la función SQL obtener_permisos_usuario()
     * @param {number} usuarioId
     * @param {number} sucursalId
     * @returns {Promise<Array>}
     */
    static async obtenerTodosPermisos(usuarioId, sucursalId) {
        const db = await getDb();
        try {
            const query = `SELECT * FROM obtener_permisos_usuario($1, $2)`;
            const result = await db.query(query, [usuarioId, sucursalId]);
            return result.rows;
        } finally {
            db.release();
        }
    }

    /**
     * Obtener permisos de un módulo específico
     * @param {number} usuarioId
     * @param {number} sucursalId
     * @param {string} modulo
     * @returns {Promise<Array>}
     */
    static async obtenerPermisosModulo(usuarioId, sucursalId, modulo) {
        const db = await getDb();
        try {
            const query = `SELECT * FROM obtener_permisos_modulo($1, $2, $3)`;
            const result = await db.query(query, [usuarioId, sucursalId, modulo]);
            return result.rows;
        } finally {
            db.release();
        }
    }

    /**
     * Obtener resumen de permisos agrupados por módulo
     * Útil para el frontend (sidebar, menú)
     * @param {number} usuarioId
     * @param {number} sucursalId
     * @returns {Promise<Object>}
     */
    static async obtenerResumenPermisos(usuarioId, sucursalId) {
        const db = await getDb();
        try {
            const query = `SELECT * FROM obtener_permisos_usuario($1, $2)`;
            const result = await db.query(query, [usuarioId, sucursalId]);

            // Agrupar por módulo
            const resumen = {};
            for (const row of result.rows) {
                if (!resumen[row.modulo]) {
                    resumen[row.modulo] = {};
                }
                // Convertir valor JSONB a valor nativo
                let valor = row.valor;
                if (typeof valor === 'string') {
                    try {
                        valor = JSON.parse(valor);
                    } catch (e) {
                        // Mantener como string
                    }
                }
                resumen[row.modulo][row.codigo] = valor;
            }

            return resumen;
        } finally {
            db.release();
        }
    }
}

module.exports = PermisosModel;
