/**
 * Controlador para Rutas de Operación
 * Fecha: 27 Diciembre 2025
 */

const RutasOperacionModel = require('../models/rutas-operacion.model');
const Joi = require('joi');

// ==================== SCHEMAS ====================

const rutaSchema = Joi.object({
    codigo: Joi.string().max(50).required(),
    nombre: Joi.string().max(100).required(),
    descripcion: Joi.string().allow(null, ''),
    tipo: Joi.string().valid('compra', 'transferencia', 'dropship', 'fabricacion').required(),
    activo: Joi.boolean().default(true),
    es_default: Joi.boolean().default(false),
    prioridad: Joi.number().integer().min(0).default(0),
    sucursal_origen_id: Joi.number().integer().allow(null),
    proveedor_default_id: Joi.number().integer().allow(null),
    condiciones: Joi.object().default({}),
    lead_time_dias: Joi.number().integer().min(1).default(1)
});

const asignarRutaSchema = Joi.object({
    ruta_id: Joi.number().integer().required(),
    activo: Joi.boolean().default(true),
    prioridad: Joi.number().integer().min(0).default(0),
    es_preferida: Joi.boolean().default(false),
    lead_time_override: Joi.number().integer().min(1).allow(null),
    proveedor_override_id: Joi.number().integer().allow(null),
    sucursal_origen_override_id: Joi.number().integer().allow(null)
});

const reglaSchema = Joi.object({
    producto_id: Joi.number().integer().allow(null),
    categoria_id: Joi.number().integer().allow(null),
    sucursal_id: Joi.number().integer().allow(null),
    nombre: Joi.string().max(100).required(),
    descripcion: Joi.string().allow(null, ''),
    ruta_id: Joi.number().integer().required(),
    stock_minimo_trigger: Joi.number().integer().min(0).default(5),
    usar_stock_proyectado: Joi.boolean().default(true),
    cantidad_fija: Joi.number().integer().min(1).allow(null),
    cantidad_hasta_maximo: Joi.boolean().default(false),
    cantidad_formula: Joi.string().allow(null, ''),
    cantidad_minima: Joi.number().integer().min(1).default(1),
    cantidad_maxima: Joi.number().integer().min(1).allow(null),
    multiplo_de: Joi.number().integer().min(1).default(1),
    dias_semana: Joi.array().items(Joi.number().integer().min(1).max(7)).default([1, 2, 3, 4, 5]),
    hora_ejecucion: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).default('08:00:00'),
    frecuencia_horas: Joi.number().integer().min(1).default(24),
    activo: Joi.boolean().default(true),
    prioridad: Joi.number().integer().min(0).default(0)
});

const solicitudTransferenciaSchema = Joi.object({
    sucursal_origen_id: Joi.number().integer().required(),
    sucursal_destino_id: Joi.number().integer().required(),
    fecha_estimada_llegada: Joi.date().allow(null),
    notas: Joi.string().allow(null, ''),
    items: Joi.array().items(Joi.object({
        producto_id: Joi.number().integer().required(),
        cantidad: Joi.number().integer().min(1).required(),
        notas: Joi.string().allow(null, '')
    })).min(1).required()
});

// ==================== RUTAS ====================

exports.crearRuta = async (req, res, next) => {
    try {
        const { error, value } = rutaSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const ruta = await RutasOperacionModel.crearRuta(
            value,
            req.tenant.organizacionId,
            req.user.id
        );

        res.status(201).json({ success: true, data: ruta });
    } catch (error) {
        next(error);
    }
};

exports.listarRutas = async (req, res, next) => {
    try {
        const { tipo, activo } = req.query;
        const rutas = await RutasOperacionModel.listarRutas(
            req.tenant.organizacionId,
            { tipo, activo: activo === 'true' ? true : activo === 'false' ? false : undefined }
        );

        res.json({ success: true, data: rutas });
    } catch (error) {
        next(error);
    }
};

exports.obtenerRuta = async (req, res, next) => {
    try {
        const ruta = await RutasOperacionModel.obtenerRutaPorId(
            parseInt(req.params.id),
            req.tenant.organizacionId
        );

        if (!ruta) {
            return res.status(404).json({ success: false, message: 'Ruta no encontrada' });
        }

        res.json({ success: true, data: ruta });
    } catch (error) {
        next(error);
    }
};

exports.actualizarRuta = async (req, res, next) => {
    try {
        const ruta = await RutasOperacionModel.actualizarRuta(
            parseInt(req.params.id),
            req.body,
            req.tenant.organizacionId
        );

        if (!ruta) {
            return res.status(404).json({ success: false, message: 'Ruta no encontrada' });
        }

        res.json({ success: true, data: ruta });
    } catch (error) {
        next(error);
    }
};

exports.eliminarRuta = async (req, res, next) => {
    try {
        const eliminada = await RutasOperacionModel.eliminarRuta(
            parseInt(req.params.id),
            req.tenant.organizacionId
        );

        if (!eliminada) {
            return res.status(404).json({ success: false, message: 'Ruta no encontrada' });
        }

        res.json({ success: true, message: 'Ruta eliminada' });
    } catch (error) {
        next(error);
    }
};

// ==================== PRODUCTOS-RUTAS ====================

exports.asignarRutaAProducto = async (req, res, next) => {
    try {
        const { error, value } = asignarRutaSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const asignacion = await RutasOperacionModel.asignarRutaAProducto(
            parseInt(req.params.productoId),
            value.ruta_id,
            value,
            req.tenant.organizacionId
        );

        res.json({ success: true, data: asignacion });
    } catch (error) {
        next(error);
    }
};

exports.obtenerRutasDeProducto = async (req, res, next) => {
    try {
        const rutas = await RutasOperacionModel.obtenerRutasDeProducto(
            parseInt(req.params.productoId),
            req.tenant.organizacionId
        );

        res.json({ success: true, data: rutas });
    } catch (error) {
        next(error);
    }
};

exports.quitarRutaDeProducto = async (req, res, next) => {
    try {
        const eliminada = await RutasOperacionModel.quitarRutaDeProducto(
            parseInt(req.params.productoId),
            parseInt(req.params.rutaId),
            req.tenant.organizacionId
        );

        if (!eliminada) {
            return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
        }

        res.json({ success: true, message: 'Ruta removida del producto' });
    } catch (error) {
        next(error);
    }
};

exports.determinarRutaReabastecimiento = async (req, res, next) => {
    try {
        const { productoId } = req.params;
        const { sucursal_id } = req.query;

        const rutas = await RutasOperacionModel.determinarRutaReabastecimiento(
            parseInt(productoId),
            sucursal_id ? parseInt(sucursal_id) : null,
            req.tenant.organizacionId
        );

        res.json({
            success: true,
            data: rutas,
            meta: {
                mejor_ruta: rutas.length > 0 ? rutas[0] : null,
                alternativas: rutas.slice(1)
            }
        });
    } catch (error) {
        next(error);
    }
};

// ==================== REGLAS ====================

exports.crearRegla = async (req, res, next) => {
    try {
        const { error, value } = reglaSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const regla = await RutasOperacionModel.crearRegla(
            value,
            req.tenant.organizacionId,
            req.user.id
        );

        res.status(201).json({ success: true, data: regla });
    } catch (error) {
        next(error);
    }
};

exports.listarReglas = async (req, res, next) => {
    try {
        const { activo, producto_id } = req.query;
        const reglas = await RutasOperacionModel.listarReglas(
            req.tenant.organizacionId,
            {
                activo: activo === 'true' ? true : activo === 'false' ? false : undefined,
                producto_id: producto_id ? parseInt(producto_id) : undefined
            }
        );

        res.json({ success: true, data: reglas });
    } catch (error) {
        next(error);
    }
};

exports.obtenerRegla = async (req, res, next) => {
    try {
        const regla = await RutasOperacionModel.obtenerReglaPorId(
            parseInt(req.params.id),
            req.tenant.organizacionId
        );

        if (!regla) {
            return res.status(404).json({ success: false, message: 'Regla no encontrada' });
        }

        res.json({ success: true, data: regla });
    } catch (error) {
        next(error);
    }
};

exports.actualizarRegla = async (req, res, next) => {
    try {
        const regla = await RutasOperacionModel.actualizarRegla(
            parseInt(req.params.id),
            req.body,
            req.tenant.organizacionId
        );

        if (!regla) {
            return res.status(404).json({ success: false, message: 'Regla no encontrada' });
        }

        res.json({ success: true, data: regla });
    } catch (error) {
        next(error);
    }
};

exports.eliminarRegla = async (req, res, next) => {
    try {
        const eliminada = await RutasOperacionModel.eliminarRegla(
            parseInt(req.params.id),
            req.tenant.organizacionId
        );

        if (!eliminada) {
            return res.status(404).json({ success: false, message: 'Regla no encontrada' });
        }

        res.json({ success: true, message: 'Regla eliminada' });
    } catch (error) {
        next(error);
    }
};

// ==================== TRANSFERENCIAS ====================

exports.crearSolicitudTransferencia = async (req, res, next) => {
    try {
        const { error, value } = solicitudTransferenciaSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        if (value.sucursal_origen_id === value.sucursal_destino_id) {
            return res.status(400).json({
                success: false,
                message: 'Las sucursales origen y destino deben ser diferentes'
            });
        }

        const solicitud = await RutasOperacionModel.crearSolicitudTransferencia(
            value,
            req.tenant.organizacionId,
            req.user.id
        );

        res.status(201).json({ success: true, data: solicitud });
    } catch (error) {
        next(error);
    }
};

exports.listarSolicitudesTransferencia = async (req, res, next) => {
    try {
        const { estado, sucursal_origen_id, sucursal_destino_id } = req.query;
        const solicitudes = await RutasOperacionModel.listarSolicitudesTransferencia(
            req.tenant.organizacionId,
            {
                estado,
                sucursal_origen_id: sucursal_origen_id ? parseInt(sucursal_origen_id) : undefined,
                sucursal_destino_id: sucursal_destino_id ? parseInt(sucursal_destino_id) : undefined
            }
        );

        res.json({ success: true, data: solicitudes });
    } catch (error) {
        next(error);
    }
};

exports.obtenerSolicitudTransferencia = async (req, res, next) => {
    try {
        const solicitud = await RutasOperacionModel.obtenerSolicitudConItems(
            parseInt(req.params.id),
            req.tenant.organizacionId
        );

        if (!solicitud) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }

        res.json({ success: true, data: solicitud });
    } catch (error) {
        next(error);
    }
};

exports.aprobarSolicitud = async (req, res, next) => {
    try {
        const solicitud = await RutasOperacionModel.cambiarEstadoSolicitud(
            parseInt(req.params.id),
            'aprobada',
            {},
            req.tenant.organizacionId,
            req.user.id
        );

        res.json({ success: true, data: solicitud, message: 'Solicitud aprobada' });
    } catch (error) {
        next(error);
    }
};

exports.rechazarSolicitud = async (req, res, next) => {
    try {
        const { motivo_rechazo } = req.body;
        if (!motivo_rechazo) {
            return res.status(400).json({ success: false, message: 'Se requiere motivo de rechazo' });
        }

        const solicitud = await RutasOperacionModel.cambiarEstadoSolicitud(
            parseInt(req.params.id),
            'rechazada',
            { motivo_rechazo },
            req.tenant.organizacionId,
            req.user.id
        );

        res.json({ success: true, data: solicitud, message: 'Solicitud rechazada' });
    } catch (error) {
        next(error);
    }
};

exports.enviarTransferencia = async (req, res, next) => {
    try {
        const solicitud = await RutasOperacionModel.cambiarEstadoSolicitud(
            parseInt(req.params.id),
            'en_transito',
            {},
            req.tenant.organizacionId,
            req.user.id
        );

        res.json({ success: true, data: solicitud, message: 'Transferencia en tránsito' });
    } catch (error) {
        next(error);
    }
};

exports.recibirTransferencia = async (req, res, next) => {
    try {
        const solicitud = await RutasOperacionModel.cambiarEstadoSolicitud(
            parseInt(req.params.id),
            'completada',
            {},
            req.tenant.organizacionId,
            req.user.id
        );

        res.json({ success: true, data: solicitud, message: 'Transferencia completada' });
    } catch (error) {
        next(error);
    }
};

// ==================== INICIALIZACIÓN ====================

exports.crearRutasDefault = async (req, res, next) => {
    try {
        const rutas = await RutasOperacionModel.crearRutasDefault(
            req.tenant.organizacionId,
            req.user.id
        );

        res.json({
            success: true,
            data: rutas,
            message: `${rutas.length} rutas creadas`
        });
    } catch (error) {
        next(error);
    }
};
