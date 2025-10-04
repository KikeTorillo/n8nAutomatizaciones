/**
 * Controller IA de Citas - Endpoints especializados para IA conversacional
 * Maneja webhooks, automatización y procesamiento por IA
 */

const CitaModel = require('../../database/citas');
const logger = require('../../utils/logger');
const { ResponseHelper, OrganizacionHelper } = require('../../utils/helpers');

class CitaAIController {

    /**
     * 🤖 CRÍTICO PARA IA: Crear cita automáticamente desde webhook n8n
     * Endpoint público para creación automática de citas por IA
     */
    static async crearAutomatica(req, res) {
        try {
            const {
                telefono_cliente,
                organizacion_id,
                servicio_id,
                fecha_solicitada = 'mañana',
                turno_preferido,
                crear_cliente_si_no_existe = true,
                nombre_cliente_nuevo,
                email_cliente_nuevo,
                profesional_preferido,
                metadata
            } = req.body;

            // Validaciones robustas
            if (!telefono_cliente || !organizacion_id || !servicio_id) {
                return ResponseHelper.error(res,
                    'Campos requeridos: telefono_cliente, organizacion_id, servicio_id',
                    400
                );
            }

            const telefonoRegex = /^[+]?[\d\s\-()]+$/;
            if (!telefonoRegex.test(telefono_cliente)) {
                return ResponseHelper.error(res, 'Formato de teléfono inválido', 400);
            }

            const orgId = parseInt(organizacion_id);
            const servId = parseInt(servicio_id);

            if (isNaN(orgId) || isNaN(servId) || orgId <= 0 || servId <= 0) {
                return ResponseHelper.error(res, 'IDs de organización y servicio deben ser números válidos', 400);
            }

            // ✅ SEGURIDAD: Validar que la organización existe y está activa
            // CRÍTICO para endpoints públicos (sin autenticación)
            const { valida, organizacion } = await OrganizacionHelper.validarOrganizacionActiva(orgId);

            if (!valida) {
                logger.warn('Intento de creación automática de cita con organización inválida', {
                    organizacion_id: orgId,
                    telefono_cliente: telefono_cliente,
                    ip: req.ip
                });

                return ResponseHelper.error(res,
                    'Organización no encontrada o inactiva',
                    404
                );
            }

            // ✅ OPCIONAL: Validar límites del plan (ejemplo)
            // if (organizacion.plan_actual === 'basico' && ...) {
            //     return ResponseHelper.error(res, 'Plan insuficiente', 403);
            // }

            const datosIA = {
                telefono_cliente: telefono_cliente.trim(),
                organizacion_id: orgId,
                servicio_id: servId,
                fecha_solicitada,
                turno_preferido,
                crear_cliente_si_no_existe,
                nombre_cliente_nuevo,
                email_cliente_nuevo,
                profesional_preferido,
                metadata
            };

            const resultado = await CitaModel.crearAutomatica(datosIA);

            logger.info('Cita creada automáticamente por IA', {
                codigo_cita: resultado.cita.codigo,
                cliente_telefono: telefono_cliente,
                organizacion_id: organizacion_id,
                servicio_id: servicio_id,
                fecha: resultado.cita.fecha,
                origen: 'ia_webhook'
            });

            // Respuesta optimizada para IA n8n
            const respuestaIA = {
                success: true,
                cita: {
                    codigo: resultado.cita.codigo,
                    fecha: resultado.cita.fecha,
                    hora_inicio: resultado.cita.hora_inicio,
                    hora_fin: resultado.cita.hora_fin,
                    estado: resultado.cita.estado,
                    cliente: resultado.cliente.nombre,
                    profesional: resultado.profesional.nombre,
                    servicio: resultado.servicio.nombre,
                    precio: resultado.cita.precio,
                    duracion_minutos: resultado.cita.duracion_minutos
                },
                cliente: {
                    es_nuevo: resultado.cliente.es_nuevo
                },
                mensaje_confirmacion: resultado.mensaje_confirmacion,
                instrucciones: resultado.instrucciones_cliente
            };

            ResponseHelper.success(res, respuestaIA, 'Cita creada automáticamente', 201);

        } catch (error) {
            logger.error('Error creando cita automática:', {
                error: error.message,
                body: req.body,
                stack: error.stack
            });

            // Manejo de errores específicos para IA
            let codigo_error = 'ERROR_GENERAL';
            let puede_reintentar = false;
            let sugerencia = null;

            if (error.message.includes('horarios disponibles') || error.message.includes('No hay horarios')) {
                codigo_error = 'ERROR_HORARIO_NO_DISPONIBLE';
                puede_reintentar = true;
                sugerencia = 'Intenta con otra fecha u horario';
            } else if (error.message.includes('Cliente no encontrado')) {
                codigo_error = 'ERROR_CLIENTE_NO_EXISTE';
                puede_reintentar = true;
                sugerencia = 'Verifica el teléfono o permite crear cliente nuevo';
            } else if (error.message.includes('Servicio no encontrado')) {
                codigo_error = 'ERROR_SERVICIO_NO_EXISTE';
                puede_reintentar = false;
                sugerencia = 'Contacta al administrador para verificar servicios disponibles';
            }

            ResponseHelper.error(res, error.message, 400, {
                codigo_error,
                puede_reintentar,
                sugerencia
            });
        }
    }

    /**
     * 🤖 CRÍTICO PARA IA: Buscar citas por teléfono
     * Endpoint público para búsqueda de citas existentes por IA
     */
    static async buscarPorTelefono(req, res) {
        try {
            const { telefono, organizacion_id, estados, incluir_historicas } = req.query;

            if (!telefono || !organizacion_id) {
                return ResponseHelper.error(res, 'Teléfono y organización requeridos', 400);
            }

            // Validar organización ID
            const orgId = parseInt(organizacion_id);
            if (isNaN(orgId) || orgId <= 0) {
                return ResponseHelper.error(res, 'ID de organización debe ser un número válido', 400);
            }

            // ✅ SEGURIDAD: Validar que la organización existe y está activa
            const { valida } = await OrganizacionHelper.validarOrganizacionActiva(orgId);

            if (!valida) {
                logger.warn('Intento de búsqueda con organización inválida', {
                    organizacion_id: orgId,
                    telefono: telefono,
                    ip: req.ip
                });

                return ResponseHelper.error(res, 'Organización no encontrada o inactiva', 404);
            }

            const estadosArray = estados ? estados.split(',') : ['pendiente', 'confirmada'];
            const incluirHistoricas = incluir_historicas === 'true';

            const citas = await CitaModel.buscarPorTelefono(
                telefono,
                orgId,
                estadosArray,
                incluirHistoricas
            );

            // Formatear respuesta para IA
            const respuestaIA = citas.map(cita => ({
                codigo_cita: cita.codigo_cita,
                fecha: cita.fecha_cita,
                hora: cita.hora_inicio,
                servicio: cita.servicio_nombre,
                profesional: cita.profesional_nombre,
                estado: cita.estado,
                precio: cita.precio_final,
                minutos_hasta_cita: cita.minutos_hasta_cita,
                puede_cancelar: cita.puede_cancelar,
                puede_modificar: cita.puede_modificar,
                mensaje_ia: cita.mensaje_ia
            }));

            ResponseHelper.success(res, respuestaIA, 'Citas encontradas');

        } catch (error) {
            logger.error('Error buscando citas por teléfono:', error);
            ResponseHelper.error(res, 'Error interno', 500);
        }
    }

    /**
     * 🤖 CRÍTICO PARA IA: Modificar cita automáticamente
     * Endpoint para modificación de citas por IA
     */
    static async modificarAutomatica(req, res) {
        try {
            const { codigo } = req.params;
            const {
                nueva_fecha,
                nuevo_turno,
                nuevo_servicio_id,
                motivo,
                organizacion_id
            } = req.body;

            if (!codigo || !organizacion_id) {
                return ResponseHelper.error(res, 'Código de cita y organización requeridos', 400);
            }

            // Validar organización ID
            const orgId = parseInt(organizacion_id);
            if (isNaN(orgId) || orgId <= 0) {
                return ResponseHelper.error(res, 'ID de organización debe ser un número válido', 400);
            }

            // ✅ SEGURIDAD: Validar que la organización existe y está activa
            const { valida } = await OrganizacionHelper.validarOrganizacionActiva(orgId);

            if (!valida) {
                logger.warn('Intento de modificación con organización inválida', {
                    organizacion_id: orgId,
                    codigo_cita: codigo,
                    ip: req.ip
                });

                return ResponseHelper.error(res, 'Organización no encontrada o inactiva', 404);
            }

            // Validar servicio ID si se proporciona
            let servicioValidado = null;
            if (nuevo_servicio_id) {
                servicioValidado = parseInt(nuevo_servicio_id);
                if (isNaN(servicioValidado) || servicioValidado <= 0) {
                    return ResponseHelper.error(res, 'ID de servicio debe ser un número válido', 400);
                }
            }

            const cambios = {
                ...(nueva_fecha && { nueva_fecha }),
                ...(nuevo_turno && { nuevo_turno }),
                ...(servicioValidado && { nuevo_servicio_id: servicioValidado }),
                ...(motivo && { motivo })
            };

            if (Object.keys(cambios).length === 0) {
                return ResponseHelper.error(res, 'No se proporcionaron cambios válidos', 400);
            }

            const resultado = await CitaModel.modificarAutomatica(
                codigo,
                cambios,
                orgId
            );

            logger.info('Cita modificada por IA', {
                codigo_cita: codigo,
                nueva_fecha: nueva_fecha,
                organizacion_id: organizacion_id
            });

            ResponseHelper.success(res, resultado, 'Cita modificada exitosamente');

        } catch (error) {
            logger.error('Error modificando cita:', {
                error: error.message,
                codigo: req.params.codigo,
                cuerpo: req.body
            });
            ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * 🤖 CRÍTICO PARA IA: Cancelar cita automáticamente
     * Endpoint para cancelación de citas por IA
     */
    static async cancelarAutomatica(req, res) {
        try {
            const { codigo } = req.params;
            const { organizacion_id, motivo } = req.body;

            if (!codigo || !organizacion_id) {
                return ResponseHelper.error(res, 'Código de cita y organización requeridos', 400);
            }

            // Validar organización ID
            const orgId = parseInt(organizacion_id);
            if (isNaN(orgId) || orgId <= 0) {
                return ResponseHelper.error(res, 'ID de organización debe ser un número válido', 400);
            }

            // ✅ SEGURIDAD: Validar que la organización existe y está activa
            const { valida } = await OrganizacionHelper.validarOrganizacionActiva(orgId);

            if (!valida) {
                logger.warn('Intento de cancelación con organización inválida', {
                    organizacion_id: orgId,
                    codigo_cita: codigo,
                    ip: req.ip
                });

                return ResponseHelper.error(res, 'Organización no encontrada o inactiva', 404);
            }

            const resultado = await CitaModel.cancelarAutomatica(
                codigo,
                orgId,
                motivo || 'Cancelada por cliente'
            );

            ResponseHelper.success(res, resultado, 'Cita cancelada exitosamente');

        } catch (error) {
            logger.error('Error cancelando cita:', {
                error: error.message,
                codigo: req.params.codigo
            });
            ResponseHelper.error(res, error.message, 400);
        }
    }
}

module.exports = CitaAIController;