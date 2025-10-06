const CitaModel = require('../../database/citas');
const logger = require('../../utils/logger');
const { ResponseHelper, OrganizacionHelper } = require('../../utils/helpers');
const { asyncHandler } = require('../../middleware');

class CitaAIController {

    static crearAutomatica = asyncHandler(async (req, res) => {
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

        const orgId = parseInt(organizacion_id);
        const servId = parseInt(servicio_id);

        const { valida } = await OrganizacionHelper.validarOrganizacionActiva(orgId);

        if (!valida) {
            logger.warn('Intento de creación automática de cita con organización inválida', {
                organizacion_id: orgId,
                telefono_cliente: telefono_cliente,
                ip: req.ip
            });

            return ResponseHelper.error(res, 'Organización no encontrada o inactiva', 404);
        }

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

        return ResponseHelper.success(res, respuestaIA, 'Cita creada automáticamente', 201);
    });

    static buscarPorTelefono = asyncHandler(async (req, res) => {
        const { telefono, organizacion_id, estados, incluir_historicas } = req.query;
        const orgId = parseInt(organizacion_id);

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

        return ResponseHelper.success(res, respuestaIA, 'Citas encontradas');
    });

    static modificarAutomatica = asyncHandler(async (req, res) => {
        const { codigo } = req.params;
        const { nueva_fecha, nuevo_turno, nuevo_servicio_id, motivo, organizacion_id } = req.body;
        const orgId = parseInt(organizacion_id);

        const { valida } = await OrganizacionHelper.validarOrganizacionActiva(orgId);

        if (!valida) {
            logger.warn('Intento de modificación con organización inválida', {
                organizacion_id: orgId,
                codigo_cita: codigo,
                ip: req.ip
            });

            return ResponseHelper.error(res, 'Organización no encontrada o inactiva', 404);
        }

        const cambios = {
            ...(nueva_fecha && { nueva_fecha }),
            ...(nuevo_turno && { nuevo_turno }),
            ...(nuevo_servicio_id && { nuevo_servicio_id: parseInt(nuevo_servicio_id) }),
            ...(motivo && { motivo })
        };

        const resultado = await CitaModel.modificarAutomatica(codigo, cambios, orgId);

        return ResponseHelper.success(res, resultado, 'Cita modificada exitosamente');
    });

    static cancelarAutomatica = asyncHandler(async (req, res) => {
        const { codigo } = req.params;
        const { organizacion_id, motivo } = req.body;
        const orgId = parseInt(organizacion_id);

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

        return ResponseHelper.success(res, resultado, 'Cita cancelada exitosamente');
    });
}

module.exports = CitaAIController;
