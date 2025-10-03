/**
 * Controller Operacional de Citas - Operaciones críticas del negocio
 * Check-in, start service, complete, walk-ins, dashboard, métricas
 */

const CitaModel = require('../../database/citas');
const logger = require('../../utils/logger');
const { ResponseHelper } = require('../../utils/helpers');

class CitaOperacionalController {

    // ===================================================================
    // 🏥 MÉTODOS OPERACIONALES CRÍTICOS
    // ===================================================================

    /**
     * Registrar llegada del cliente (check-in)
     * Actualiza hora_llegada y cambia estado a 'en_curso'
     */
    static async checkIn(req, res) {
        try {
            const citaId = parseInt(req.params.id);
            const { notas_llegada } = req.body;
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            // Validar que la cita existe y pertenece a la organización
            const citaExistente = await CitaModel.obtenerPorId(citaId, organizacionId);
            if (!citaExistente) {
                return ResponseHelper.error(res, 'Cita no encontrada', 404);
            }

            // Validar estado actual
            if (!['pendiente', 'confirmada'].includes(citaExistente.estado)) {
                return ResponseHelper.error(res,
                    `No se puede hacer check-in. Estado actual: ${citaExistente.estado}`,
                    400
                );
            }

            // Realizar check-in
            const resultado = await CitaModel.checkIn(citaId, {
                notas_llegada,
                usuario_id: req.user.id,
                ip_origen: req.ip
            }, organizacionId);

            logger.info('Check-in realizado exitosamente', {
                cita_id: citaId,
                usuario_id: req.user.id,
                organizacion_id: organizacionId,
                hora_llegada: resultado.hora_llegada,
                ip: req.ip
            });

            ResponseHelper.success(res, resultado, 'Check-in registrado exitosamente');

        } catch (error) {
            logger.error('Error en check-in de cita', {
                error: error.message,
                stack: error.stack,
                cita_id: req.params.id,
                usuario_id: req.user.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, error.message || 'Error interno del servidor', 500);
        }
    }

    /**
     * Iniciar servicio (profesional empieza atención)
     * Actualiza hora_inicio_real y cambia estado a 'en_curso'
     */
    static async startService(req, res) {
        try {
            const citaId = parseInt(req.params.id);
            const { notas_inicio } = req.body;
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            // Validar que la cita existe
            const citaExistente = await CitaModel.obtenerPorId(citaId, organizacionId);
            if (!citaExistente) {
                return ResponseHelper.error(res, 'Cita no encontrada', 404);
            }

            // Validar estado actual y autorización del profesional
            if (!['confirmada', 'en_curso'].includes(citaExistente.estado)) {
                return ResponseHelper.error(res,
                    `No se puede iniciar servicio. Estado actual: ${citaExistente.estado}`,
                    400
                );
            }

            // Validar que el profesional puede iniciar esta cita
            if (req.user.rol === 'empleado' && citaExistente.profesional_id !== req.user.profesional_id) {
                return ResponseHelper.error(res, 'No autorizado para esta cita', 403);
            }

            // Iniciar servicio
            const resultado = await CitaModel.startService(citaId, {
                notas_inicio,
                usuario_id: req.user.id,
                ip_origen: req.ip
            }, organizacionId);

            logger.info('Servicio iniciado exitosamente', {
                cita_id: citaId,
                profesional_id: citaExistente.profesional_id,
                usuario_id: req.user.id,
                organizacion_id: organizacionId,
                hora_inicio_real: resultado.hora_inicio_real,
                ip: req.ip
            });

            ResponseHelper.success(res, resultado, 'Servicio iniciado exitosamente');

        } catch (error) {
            logger.error('Error al iniciar servicio', {
                error: error.message,
                stack: error.stack,
                cita_id: req.params.id,
                usuario_id: req.user.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, error.message || 'Error interno del servidor', 500);
        }
    }

    /**
     * Completar servicio y finalizar cita
     * Actualiza hora_fin_real, precio_final_real y cambia estado a 'completada'
     */
    static async complete(req, res) {
        try {
            const citaId = parseInt(req.params.id);
            const { notas_finalizacion, precio_final_real, metodo_pago } = req.body;
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            // Validar que la cita existe
            const citaExistente = await CitaModel.obtenerPorId(citaId, organizacionId);
            if (!citaExistente) {
                return ResponseHelper.error(res, 'Cita no encontrada', 404);
            }

            // Validar estado actual
            if (citaExistente.estado !== 'en_curso') {
                return ResponseHelper.error(res,
                    `No se puede completar servicio. Estado actual: ${citaExistente.estado}`,
                    400
                );
            }

            // Validar autorización del profesional
            if (req.user.rol === 'empleado' && citaExistente.profesional_id !== req.user.profesional_id) {
                return ResponseHelper.error(res, 'No autorizado para esta cita', 403);
            }

            // Completar servicio
            const resultado = await CitaModel.complete(citaId, {
                notas_finalizacion,
                precio_final_real: precio_final_real || citaExistente.precio_final,
                metodo_pago,
                usuario_id: req.user.id,
                ip_origen: req.ip
            }, organizacionId);

            logger.info('Servicio completado exitosamente', {
                cita_id: citaId,
                profesional_id: citaExistente.profesional_id,
                usuario_id: req.user.id,
                organizacion_id: organizacionId,
                precio_final: resultado.precio_final,
                metodo_pago: resultado.metodo_pago,
                hora_fin_real: resultado.hora_fin_real,
                ip: req.ip
            });

            ResponseHelper.success(res, resultado, 'Servicio completado exitosamente');

        } catch (error) {
            logger.error('Error al completar servicio', {
                error: error.message,
                stack: error.stack,
                cita_id: req.params.id,
                usuario_id: req.user.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, error.message || 'Error interno del servidor', 500);
        }
    }

    /**
     * Reagendar cita a nueva fecha/hora
     * Cambia fecha, horarios y mantiene estado pendiente
     */
    static async reagendar(req, res) {
        try {
            const citaId = parseInt(req.params.id);
            const { nueva_fecha, nueva_hora_inicio, nueva_hora_fin, motivo_reagenda } = req.body;
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            // Validar que la cita existe
            const citaExistente = await CitaModel.obtenerPorId(citaId, organizacionId);
            if (!citaExistente) {
                return ResponseHelper.error(res, 'Cita no encontrada', 404);
            }

            // Validar que se puede reagendar
            if (['completada', 'cancelada', 'no_asistio'].includes(citaExistente.estado)) {
                return ResponseHelper.error(res,
                    `No se puede reagendar. Estado actual: ${citaExistente.estado}`,
                    400
                );
            }

            // Validar autorización para reagendar
            if (req.user.rol === 'cliente' && citaExistente.cliente_id !== req.user.cliente_id) {
                return ResponseHelper.error(res, 'No autorizado para reagendar esta cita', 403);
            }

            // Reagendar cita
            const resultado = await CitaModel.reagendar(citaId, {
                nueva_fecha,
                nueva_hora_inicio,
                nueva_hora_fin,
                motivo_reagenda,
                usuario_id: req.user.id,
                ip_origen: req.ip
            }, organizacionId);

            logger.info('Cita reagendada exitosamente', {
                cita_id: citaId,
                fecha_anterior: citaExistente.fecha_cita,
                fecha_nueva: nueva_fecha,
                usuario_id: req.user.id,
                organizacion_id: organizacionId,
                motivo: motivo_reagenda,
                ip: req.ip
            });

            ResponseHelper.success(res, resultado, 'Cita reagendada exitosamente');

        } catch (error) {
            logger.error('Error al reagendar cita', {
                error: error.message,
                stack: error.stack,
                cita_id: req.params.id,
                usuario_id: req.user.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, error.message || 'Error interno del servidor', 500);
        }
    }

    // ===================================================================
    // 📊 MÉTODOS DE DASHBOARD OPERACIONAL
    // ===================================================================

    /**
     * Vista completa del día actual para recepción
     * Incluye todas las citas, cola de espera y métricas del día
     */
    static async dashboardToday(req, res) {
        try {
            const { profesional_id } = req.query;
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            // Obtener dashboard del día
            const dashboard = await CitaModel.obtenerDashboardToday(organizacionId, profesional_id);

            logger.info('Dashboard del día consultado', {
                usuario_id: req.user.id,
                organizacion_id: organizacionId,
                profesional_id: profesional_id || 'todos',
                total_citas: dashboard.citas.length,
                ip: req.ip
            });

            ResponseHelper.success(res, dashboard, 'Dashboard obtenido exitosamente');

        } catch (error) {
            logger.error('Error al obtener dashboard del día', {
                error: error.message,
                stack: error.stack,
                usuario_id: req.user.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, error.message || 'Error interno del servidor', 500);
        }
    }

    /**
     * Cola de espera en tiempo real
     */
    static async colaEspera(req, res) {
        try {
            const { profesional_id } = req.query;
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            // Obtener cola de espera
            const cola = await CitaModel.obtenerColaEspera(organizacionId, profesional_id);

            ResponseHelper.success(res, cola, 'Cola de espera obtenida exitosamente');

        } catch (error) {
            logger.error('Error al obtener cola de espera', {
                error: error.message,
                stack: error.stack,
                usuario_id: req.user.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, error.message || 'Error interno del servidor', 500);
        }
    }

    /**
     * Métricas operacionales en tiempo real
     */
    static async metricasTiempoReal(req, res) {
        try {
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            // Obtener métricas
            const metricas = await CitaModel.obtenerMetricasTiempoReal(organizacionId);

            ResponseHelper.success(res, metricas, 'Métricas obtenidas exitosamente');

        } catch (error) {
            logger.error('Error al obtener métricas en tiempo real', {
                error: error.message,
                stack: error.stack,
                usuario_id: req.user.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, error.message || 'Error interno del servidor', 500);
        }
    }

    // ===================================================================
    // 🚶 MÉTODOS WALK-IN
    // ===================================================================

    /**
     * Crear cita inmediata para cliente walk-in
     * Patrón Enterprise: usa hora_inicio_real para tracking real
     */
    static async crearWalkIn(req, res) {
        try {
            const {
                cliente_id,
                profesional_id,
                servicio_id,
                nombre_cliente,
                tiempo_espera_aceptado,
                notas_walk_in
            } = req.body;
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            // Crear cita walk-in
            const cita = await CitaModel.crearWalkIn({
                cliente_id,
                profesional_id,
                servicio_id,
                nombre_cliente,
                tiempo_espera_aceptado,
                notas_walk_in,
                usuario_creador_id: req.user.id,
                ip_origen: req.ip
            }, organizacionId);

            logger.info('Cita walk-in creada exitosamente', {
                cita_id: cita.id,
                codigo_cita: cita.codigo_cita,
                cliente_id,
                profesional_id,
                servicio_id,
                usuario_id: req.user.id,
                organizacion_id: organizacionId,
                ip: req.ip
            });

            ResponseHelper.success(res, cita, 'Cita walk-in creada exitosamente', 201);

        } catch (error) {
            logger.error('Error al crear cita walk-in', {
                error: error.message,
                stack: error.stack,
                datos_cita: req.body,
                usuario_id: req.user.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, error.message || 'Error interno del servidor', 500);
        }
    }

    /**
     * Consultar disponibilidad inmediata para walk-ins
     */
    static async disponibilidadInmediata(req, res) {
        try {
            const { servicio_id, profesional_id } = req.query;
            const organizacionId = req.tenant.organizacionId; // Del middleware tenant

            // Consultar disponibilidad
            const disponibilidad = await CitaModel.consultarDisponibilidadInmediata(
                parseInt(servicio_id),
                profesional_id ? parseInt(profesional_id) : null,
                organizacionId
            );

            ResponseHelper.success(res, disponibilidad, 'Disponibilidad consultada exitosamente');

        } catch (error) {
            logger.error('Error al consultar disponibilidad inmediata', {
                error: error.message,
                stack: error.stack,
                servicio_id: req.query.servicio_id,
                profesional_id: req.query.profesional_id,
                usuario_id: req.user.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, error.message || 'Error interno del servidor', 500);
        }
    }
}

module.exports = CitaOperacionalController;