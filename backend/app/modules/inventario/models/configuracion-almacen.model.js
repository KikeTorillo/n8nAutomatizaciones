/**
 * Modelo para Configuracion de Almacen
 * Gestionar pasos de recepcion/envio y ubicaciones por sucursal
 * Fecha: 31 Diciembre 2025
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class ConfiguracionAlmacenModel {
    // ==================== CONFIGURACION ====================

    /**
     * Obtener configuracion por sucursal
     */
    static async obtenerPorSucursal(sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            // Usa la funcion SQL que crea config por defecto si no existe
            const result = await client.query(
                'SELECT obtener_configuracion_almacen($1, $2) as config',
                [organizacionId, sucursalId]
            );

            if (!result.rows[0].config) {
                return null;
            }

            // Obtener con nombres de ubicaciones
            const fullResult = await client.query(
                `SELECT
                    c.*,
                    ur.codigo as ubicacion_recepcion_codigo,
                    ur.nombre as ubicacion_recepcion_nombre,
                    uqc.codigo as ubicacion_qc_codigo,
                    uqc.nombre as ubicacion_qc_nombre,
                    us.codigo as ubicacion_stock_codigo,
                    us.nombre as ubicacion_stock_nombre,
                    up.codigo as ubicacion_picking_codigo,
                    up.nombre as ubicacion_picking_nombre,
                    ue.codigo as ubicacion_empaque_codigo,
                    ue.nombre as ubicacion_empaque_nombre,
                    uenv.codigo as ubicacion_envio_codigo,
                    uenv.nombre as ubicacion_envio_nombre
                FROM configuracion_almacen_sucursal c
                LEFT JOIN ubicaciones_almacen ur ON ur.id = c.ubicacion_recepcion_id
                LEFT JOIN ubicaciones_almacen uqc ON uqc.id = c.ubicacion_qc_id
                LEFT JOIN ubicaciones_almacen us ON us.id = c.ubicacion_stock_id
                LEFT JOIN ubicaciones_almacen up ON up.id = c.ubicacion_picking_id
                LEFT JOIN ubicaciones_almacen ue ON ue.id = c.ubicacion_empaque_id
                LEFT JOIN ubicaciones_almacen uenv ON uenv.id = c.ubicacion_envio_id
                WHERE c.sucursal_id = $1 AND c.organizacion_id = $2`,
                [sucursalId, organizacionId]
            );

            return fullResult.rows[0] || result.rows[0].config;
        });
    }

    /**
     * Listar configuraciones de todas las sucursales
     */
    static async listar(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT
                    c.*,
                    s.nombre as sucursal_nombre,
                    ur.codigo as ubicacion_recepcion_codigo,
                    us.codigo as ubicacion_stock_codigo,
                    up.codigo as ubicacion_picking_codigo,
                    uenv.codigo as ubicacion_envio_codigo
                FROM configuracion_almacen_sucursal c
                JOIN sucursales s ON s.id = c.sucursal_id
                LEFT JOIN ubicaciones_almacen ur ON ur.id = c.ubicacion_recepcion_id
                LEFT JOIN ubicaciones_almacen us ON us.id = c.ubicacion_stock_id
                LEFT JOIN ubicaciones_almacen up ON up.id = c.ubicacion_picking_id
                LEFT JOIN ubicaciones_almacen uenv ON uenv.id = c.ubicacion_envio_id
                WHERE c.organizacion_id = $1
                ORDER BY s.nombre`,
                [organizacionId]
            );
            return result.rows;
        });
    }

    /**
     * Actualizar configuracion
     */
    static async actualizar(organizacionId, sucursalId, data, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `INSERT INTO configuracion_almacen_sucursal (
                    organizacion_id, sucursal_id,
                    pasos_recepcion, pasos_envio,
                    ubicacion_recepcion_id, ubicacion_qc_id, ubicacion_stock_id,
                    ubicacion_picking_id, ubicacion_empaque_id, ubicacion_envio_id,
                    generar_picking_automatico, permitir_picking_parcial, requiere_validacion_qc,
                    creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (organizacion_id, sucursal_id) DO UPDATE SET
                    pasos_recepcion = COALESCE($3, configuracion_almacen_sucursal.pasos_recepcion),
                    pasos_envio = COALESCE($4, configuracion_almacen_sucursal.pasos_envio),
                    ubicacion_recepcion_id = $5,
                    ubicacion_qc_id = $6,
                    ubicacion_stock_id = $7,
                    ubicacion_picking_id = $8,
                    ubicacion_empaque_id = $9,
                    ubicacion_envio_id = $10,
                    generar_picking_automatico = COALESCE($11, configuracion_almacen_sucursal.generar_picking_automatico),
                    permitir_picking_parcial = COALESCE($12, configuracion_almacen_sucursal.permitir_picking_parcial),
                    requiere_validacion_qc = COALESCE($13, configuracion_almacen_sucursal.requiere_validacion_qc),
                    actualizado_en = NOW()
                RETURNING *`,
                [
                    organizacionId,
                    sucursalId,
                    data.pasos_recepcion,
                    data.pasos_envio,
                    data.ubicacion_recepcion_id || null,
                    data.ubicacion_qc_id || null,
                    data.ubicacion_stock_id || null,
                    data.ubicacion_picking_id || null,
                    data.ubicacion_empaque_id || null,
                    data.ubicacion_envio_id || null,
                    data.generar_picking_automatico,
                    data.permitir_picking_parcial,
                    data.requiere_validacion_qc,
                    usuarioId
                ]
            );
            return result.rows[0];
        });
    }

    // ==================== UBICACIONES DEFAULT ====================

    /**
     * Crear ubicaciones por defecto para rutas multietapa
     */
    static async crearUbicacionesDefault(sucursalId, organizacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                'SELECT crear_ubicaciones_default_almacen($1, $2, $3) as resultado',
                [organizacionId, sucursalId, usuarioId]
            );
            return result.rows[0].resultado;
        });
    }

    // ==================== HELPERS ====================

    /**
     * Verificar si la sucursal usa rutas multietapa para recepcion
     */
    static async usaRecepcionMultietapa(sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT pasos_recepcion > 1 as usa_multietapa
                FROM configuracion_almacen_sucursal
                WHERE sucursal_id = $1 AND organizacion_id = $2`,
                [sucursalId, organizacionId]
            );
            return result.rows[0]?.usa_multietapa || false;
        });
    }

    /**
     * Verificar si la sucursal usa rutas multietapa para envio
     */
    static async usaEnvioMultietapa(sucursalId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (client) => {
            const result = await client.query(
                `SELECT pasos_envio > 1 as usa_multietapa
                FROM configuracion_almacen_sucursal
                WHERE sucursal_id = $1 AND organizacion_id = $2`,
                [sucursalId, organizacionId]
            );
            return result.rows[0]?.usa_multietapa || false;
        });
    }

    /**
     * Obtener descripcion de los pasos configurados
     */
    static obtenerDescripcionPasos(config) {
        const descripcionRecepcion = {
            1: 'Directo a stock',
            2: 'Recepcion -> Almacenamiento',
            3: 'Recepcion -> Control Calidad -> Almacenamiento'
        };

        const descripcionEnvio = {
            1: 'Directo desde stock',
            2: 'Picking -> Envio',
            3: 'Picking -> Empaque -> Envio'
        };

        return {
            recepcion: descripcionRecepcion[config.pasos_recepcion] || 'Desconocido',
            envio: descripcionEnvio[config.pasos_envio] || 'Desconocido'
        };
    }

    /**
     * Validar configuracion antes de guardar
     */
    static validarConfiguracion(config) {
        const errores = [];

        // Validar pasos
        if (config.pasos_recepcion < 1 || config.pasos_recepcion > 3) {
            errores.push('pasos_recepcion debe ser 1, 2 o 3');
        }
        if (config.pasos_envio < 1 || config.pasos_envio > 3) {
            errores.push('pasos_envio debe ser 1, 2 o 3');
        }

        // Validar ubicaciones requeridas segun pasos
        if (config.pasos_recepcion >= 2 && !config.ubicacion_recepcion_id) {
            errores.push('ubicacion_recepcion_id es requerida para recepcion de 2+ pasos');
        }
        if (config.pasos_recepcion >= 3 && !config.ubicacion_qc_id) {
            errores.push('ubicacion_qc_id es requerida para recepcion de 3 pasos');
        }
        if (config.pasos_envio >= 2 && !config.ubicacion_picking_id) {
            errores.push('ubicacion_picking_id es requerida para envio de 2+ pasos');
        }
        if (config.pasos_envio >= 3 && !config.ubicacion_empaque_id) {
            errores.push('ubicacion_empaque_id es requerida para envio de 3 pasos');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }
}

module.exports = ConfiguracionAlmacenModel;
