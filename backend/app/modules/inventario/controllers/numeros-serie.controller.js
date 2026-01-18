/**
 * Controlador para Numeros de Serie / Lotes
 * Gap Media Prioridad - Dic 2025
 */

const NumerosSerieModel = require('../models/numeros-serie.model');
const Joi = require('joi');

// ==================== SCHEMAS DE VALIDACION ====================

const crearSchema = Joi.object({
    producto_id: Joi.number().integer().required(),
    numero_serie: Joi.string().max(100).required(),
    lote: Joi.string().max(50).allow(null, ''),
    fecha_vencimiento: Joi.date().allow(null),
    sucursal_id: Joi.number().integer().allow(null),
    ubicacion_id: Joi.number().integer().allow(null),
    costo_unitario: Joi.number().precision(2).allow(null),
    proveedor_id: Joi.number().integer().allow(null),
    orden_compra_id: Joi.number().integer().allow(null),
    notas: Joi.string().allow(null, '')
});

const crearMultipleSchema = Joi.object({
    items: Joi.array().items(crearSchema).min(1).max(500).required()
});

const listarSchema = Joi.object({
    producto_id: Joi.number().integer(),
    sucursal_id: Joi.number().integer(),
    ubicacion_id: Joi.number().integer(),
    estado: Joi.string().valid('disponible', 'reservado', 'vendido', 'defectuoso', 'devuelto', 'transferido'),
    lote: Joi.string().max(50),
    fecha_vencimiento_desde: Joi.date(),
    fecha_vencimiento_hasta: Joi.date(),
    orden_compra_id: Joi.number().integer(),
    proveedor_id: Joi.number().integer(),
    busqueda: Joi.string().max(100),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50)
});

const venderSchema = Joi.object({
    venta_id: Joi.number().integer().required(),
    cliente_id: Joi.number().integer().allow(null)
});

const transferirSchema = Joi.object({
    sucursal_destino_id: Joi.number().integer().required(),
    ubicacion_destino_id: Joi.number().integer().allow(null),
    notas: Joi.string().allow(null, '')
});

const devolverSchema = Joi.object({
    sucursal_id: Joi.number().integer().required(),
    ubicacion_id: Joi.number().integer().allow(null),
    motivo: Joi.string().max(500).required()
});

const defectuosoSchema = Joi.object({
    motivo: Joi.string().max(500).required()
});

const garantiaSchema = Joi.object({
    tiene_garantia: Joi.boolean().required(),
    fecha_inicio_garantia: Joi.date().allow(null),
    fecha_fin_garantia: Joi.date().allow(null)
});

// ==================== CONTROLADORES ====================

/**
 * Crear un numero de serie
 * POST /numeros-serie
 */
exports.crear = async (req, res, next) => {
    try {
        const { error, value } = crearSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const id = await NumerosSerieModel.crear(
            req.tenant.organizacionId,
            value,
            req.user.id
        );

        const numeroSerie = await NumerosSerieModel.buscarPorId(
            req.tenant.organizacionId,
            id
        );

        res.status(201).json({
            success: true,
            message: 'Número de serie registrado correctamente',
            data: numeroSerie
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Crear multiples numeros de serie
 * POST /numeros-serie/bulk
 */
exports.crearMultiple = async (req, res, next) => {
    try {
        const { error, value } = crearMultipleSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const creados = await NumerosSerieModel.crearMultiple(
            req.tenant.organizacionId,
            value.items,
            req.user.id
        );

        res.status(201).json({
            success: true,
            message: `${creados.length} números de serie registrados`,
            data: creados
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Listar numeros de serie
 * GET /numeros-serie
 */
exports.listar = async (req, res, next) => {
    try {
        const { error, value } = listarSchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const resultado = await NumerosSerieModel.listar(
            req.tenant.organizacionId,
            value
        );

        res.json({
            success: true,
            data: resultado.data,
            pagination: {
                total: resultado.total,
                page: resultado.page,
                limit: resultado.limit,
                totalPages: resultado.totalPages
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener numero de serie por ID
 * GET /numeros-serie/:id
 */
exports.obtenerPorId = async (req, res, next) => {
    try {
        const { id } = req.params;

        const numeroSerie = await NumerosSerieModel.buscarPorId(
            req.tenant.organizacionId,
            parseInt(id)
        );

        if (!numeroSerie) {
            return res.status(404).json({
                success: false,
                message: 'Número de serie no encontrado'
            });
        }

        res.json({
            success: true,
            data: numeroSerie
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Buscar numeros de serie
 * GET /numeros-serie/buscar
 */
exports.buscar = async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'El término de búsqueda debe tener al menos 2 caracteres'
            });
        }

        const resultados = await NumerosSerieModel.buscar(
            q,
            req.tenant.organizacionId
        );

        res.json({
            success: true,
            data: resultados
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener disponibles por producto
 * GET /numeros-serie/producto/:productoId/disponibles
 */
exports.obtenerDisponibles = async (req, res, next) => {
    try {
        const { productoId } = req.params;
        const { sucursal_id } = req.query;

        const disponibles = await NumerosSerieModel.obtenerDisponiblesPorProducto(
            parseInt(productoId),
            sucursal_id ? parseInt(sucursal_id) : null,
            req.tenant.organizacionId
        );

        res.json({
            success: true,
            data: disponibles
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Vender numero de serie
 * POST /numeros-serie/:id/vender
 */
exports.vender = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = venderSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        await NumerosSerieModel.vender(
            parseInt(id),
            value.venta_id,
            value.cliente_id,
            req.tenant.organizacionId,
            req.user.id
        );

        res.json({
            success: true,
            message: 'Número de serie marcado como vendido'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Transferir numero de serie
 * POST /numeros-serie/:id/transferir
 */
exports.transferir = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = transferirSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        await NumerosSerieModel.transferir(
            parseInt(id),
            value.sucursal_destino_id,
            value.ubicacion_destino_id,
            req.tenant.organizacionId,
            req.user.id,
            value.notas
        );

        res.json({
            success: true,
            message: 'Número de serie transferido correctamente'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Devolver numero de serie
 * POST /numeros-serie/:id/devolver
 */
exports.devolver = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = devolverSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        await NumerosSerieModel.devolver(
            parseInt(id),
            value.sucursal_id,
            value.ubicacion_id,
            value.motivo,
            req.tenant.organizacionId,
            req.user.id
        );

        res.json({
            success: true,
            message: 'Devolución procesada correctamente'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Marcar como defectuoso
 * POST /numeros-serie/:id/defectuoso
 */
exports.marcarDefectuoso = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = defectuosoSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        await NumerosSerieModel.marcarDefectuoso(
            parseInt(id),
            value.motivo,
            req.tenant.organizacionId,
            req.user.id
        );

        res.json({
            success: true,
            message: 'Número de serie marcado como defectuoso'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reservar numero de serie
 * POST /numeros-serie/:id/reservar
 */
exports.reservar = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { notas } = req.body;

        await NumerosSerieModel.reservar(
            parseInt(id),
            req.tenant.organizacionId,
            req.user.id,
            notas
        );

        res.json({
            success: true,
            message: 'Número de serie reservado'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Liberar reserva
 * POST /numeros-serie/:id/liberar
 */
exports.liberarReserva = async (req, res, next) => {
    try {
        const { id } = req.params;

        await NumerosSerieModel.liberarReserva(
            parseInt(id),
            req.tenant.organizacionId,
            req.user.id
        );

        res.json({
            success: true,
            message: 'Reserva liberada'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener historial de movimientos
 * GET /numeros-serie/:id/historial
 */
exports.obtenerHistorial = async (req, res, next) => {
    try {
        const { id } = req.params;

        const historial = await NumerosSerieModel.obtenerHistorial(
            parseInt(id),
            req.tenant.organizacionId
        );

        res.json({
            success: true,
            data: historial
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener proximos a vencer
 * GET /numeros-serie/proximos-vencer
 */
exports.obtenerProximosVencer = async (req, res, next) => {
    try {
        const { dias = 30 } = req.query;

        const proximos = await NumerosSerieModel.obtenerProximosVencer(
            parseInt(dias),
            req.tenant.organizacionId
        );

        res.json({
            success: true,
            data: proximos
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener estadisticas
 * GET /numeros-serie/estadisticas
 */
exports.obtenerEstadisticas = async (req, res, next) => {
    try {
        const estadisticas = await NumerosSerieModel.obtenerEstadisticas(
            req.tenant.organizacionId
        );

        res.json({
            success: true,
            data: estadisticas
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener productos que requieren numero de serie
 * GET /numeros-serie/productos-con-serie
 */
exports.obtenerProductosConSerie = async (req, res, next) => {
    try {
        const productos = await NumerosSerieModel.obtenerProductosConSerie(
            req.tenant.organizacionId
        );

        res.json({
            success: true,
            data: productos
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener resumen por producto
 * GET /numeros-serie/producto/:productoId/resumen
 */
exports.obtenerResumenProducto = async (req, res, next) => {
    try {
        const { productoId } = req.params;

        const resumen = await NumerosSerieModel.obtenerResumenPorProducto(
            parseInt(productoId),
            req.tenant.organizacionId
        );

        res.json({
            success: true,
            data: resumen
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verificar si existe numero de serie
 * GET /numeros-serie/existe
 */
exports.verificarExistencia = async (req, res, next) => {
    try {
        const { producto_id, numero_serie } = req.query;

        if (!producto_id || !numero_serie) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere producto_id y numero_serie'
            });
        }

        const existe = await NumerosSerieModel.existeNumeroSerie(
            parseInt(producto_id),
            numero_serie,
            req.tenant.organizacionId
        );

        res.json({
            success: true,
            data: { existe }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Actualizar garantia
 * PUT /numeros-serie/:id/garantia
 */
exports.actualizarGarantia = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = garantiaSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        await NumerosSerieModel.actualizarGarantia(
            parseInt(id),
            value,
            req.tenant.organizacionId
        );

        res.json({
            success: true,
            message: 'Garantía actualizada'
        });
    } catch (error) {
        next(error);
    }
};

// ==================== FEFO - DESPACHO ====================

/**
 * Obtener NS para despacho usando estrategia FEFO
 * GET /numeros-serie/fefo/:productoId
 */
exports.obtenerParaDespachoFEFO = async (req, res, next) => {
    try {
        const { productoId } = req.params;
        const { cantidad = 1, sucursal_id } = req.query;

        const numerosSerieDisponibles = await NumerosSerieModel.obtenerParaDespachoFEFO(
            parseInt(productoId),
            parseInt(cantidad),
            req.tenant.organizacionId,
            sucursal_id ? parseInt(sucursal_id) : null
        );

        res.json({
            success: true,
            data: numerosSerieDisponibles,
            meta: {
                solicitados: parseInt(cantidad),
                disponibles: numerosSerieDisponibles.length,
                mensaje: numerosSerieDisponibles.length < parseInt(cantidad)
                    ? `Solo hay ${numerosSerieDisponibles.length} NS disponibles de ${cantidad} solicitados`
                    : 'NS ordenados por FEFO (primeros en vencer, primeros en salir)'
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reservar NS para despacho FEFO
 * POST /numeros-serie/fefo/reservar
 */
exports.reservarParaDespachoFEFO = async (req, res, next) => {
    try {
        const { ns_ids, referencia } = req.body;

        if (!ns_ids || !Array.isArray(ns_ids) || ns_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un array de IDs de números de serie (ns_ids)'
            });
        }

        if (!referencia) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere una referencia (ej: "VENTA-123")'
            });
        }

        await NumerosSerieModel.reservarParaDespacho(
            ns_ids.map(id => parseInt(id)),
            referencia,
            req.tenant.organizacionId,
            req.user.id
        );

        res.json({
            success: true,
            message: `${ns_ids.length} números de serie reservados para ${referencia}`,
            data: { ns_ids, referencia }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener alertas de vencimiento con niveles de urgencia
 * GET /numeros-serie/alertas-vencimiento
 */
exports.obtenerAlertasVencimiento = async (req, res, next) => {
    try {
        const { sucursal_id } = req.query;

        const alertas = await NumerosSerieModel.obtenerAlertasVencimiento(
            req.tenant.organizacionId,
            sucursal_id ? parseInt(sucursal_id) : null
        );

        res.json({
            success: true,
            data: alertas
        });
    } catch (error) {
        next(error);
    }
};

// ==================== TRAZABILIDAD ====================

/**
 * Obtener trazabilidad completa de un NS
 * GET /numeros-serie/:id/trazabilidad
 */
exports.obtenerTrazabilidad = async (req, res, next) => {
    try {
        const { id } = req.params;

        const trazabilidad = await NumerosSerieModel.obtenerTrazabilidadCompleta(
            parseInt(id),
            req.tenant.organizacionId
        );

        if (!trazabilidad) {
            return res.status(404).json({
                success: false,
                message: 'Número de serie no encontrado'
            });
        }

        res.json({
            success: true,
            data: trazabilidad
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener timeline de movimientos de un NS
 * GET /numeros-serie/:id/timeline
 */
exports.obtenerTimeline = async (req, res, next) => {
    try {
        const { id } = req.params;

        const timeline = await NumerosSerieModel.obtenerTimeline(
            parseInt(id),
            req.tenant.organizacionId
        );

        res.json({
            success: true,
            data: timeline,
            meta: {
                total_eventos: timeline.length
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Buscar NS con trazabilidad resumida
 * GET /numeros-serie/buscar-trazabilidad
 */
exports.buscarConTrazabilidad = async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un término de búsqueda (mínimo 2 caracteres)'
            });
        }

        const resultados = await NumerosSerieModel.buscarConTrazabilidad(
            q,
            req.tenant.organizacionId
        );

        res.json({
            success: true,
            data: resultados,
            meta: {
                busqueda: q,
                total: resultados.length
            }
        });
    } catch (error) {
        next(error);
    }
};
