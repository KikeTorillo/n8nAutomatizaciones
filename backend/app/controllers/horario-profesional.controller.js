const HorarioProfesionalModel = require('../database/horario-profesional.model');
const { ResponseHelper } = require('../utils/helpers');
const { asyncHandler } = require('../middleware');

class HorarioProfesionalController {

    /**
     * Crear nuevo horario para un profesional
     * POST /api/v1/horarios-profesionales
     */
    static crear = asyncHandler(async (req, res) => {
        const {
            profesional_id,
            dia_semana,
            hora_inicio,
            hora_fin,
            zona_horaria,
            tipo_horario,
            nombre_horario,
            descripcion,
            permite_citas,
            duracion_slot_minutos,
            precio_premium,
            permite_descuentos,
            fecha_inicio,
            fecha_fin,
            motivo_vigencia,
            capacidad_maxima,
            configuracion_especial,
            prioridad
        } = req.body;

        const organizacionId = req.tenant.organizacionId;

        const horario = await HorarioProfesionalModel.crear({
            organizacion_id: organizacionId,
            profesional_id,
            dia_semana,
            hora_inicio,
            hora_fin,
            zona_horaria,
            tipo_horario,
            nombre_horario,
            descripcion,
            permite_citas,
            duracion_slot_minutos,
            precio_premium,
            permite_descuentos,
            fecha_inicio,
            fecha_fin,
            motivo_vigencia,
            capacidad_maxima,
            configuracion_especial,
            prioridad
        }, {
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, horario, 'Horario creado exitosamente', 201);
    });

    /**
     * Crear horarios semanales estándar (Lunes-Viernes)
     * POST /api/v1/horarios-profesionales/semanales-estandar
     */
    static crearSemanalesEstandar = asyncHandler(async (req, res) => {
        const {
            profesional_id,
            dias,
            hora_inicio,
            hora_fin,
            tipo_horario,
            nombre_horario,
            duracion_slot_minutos,
            fecha_inicio
        } = req.body;

        const organizacionId = req.tenant.organizacionId;

        const horarios = await HorarioProfesionalModel.crearHorariosSemanalesEstandar(
            profesional_id,
            organizacionId,
            {
                dias,
                hora_inicio,
                hora_fin,
                tipo_horario,
                nombre_horario,
                duracion_slot_minutos,
                fecha_inicio
            },
            {
                usuario_id: req.user.id
            }
        );

        return ResponseHelper.success(res, {
            horarios_creados: horarios.length,
            horarios
        }, `${horarios.length} horarios creados exitosamente`, 201);
    });

    /**
     * Listar horarios de un profesional
     * GET /api/v1/horarios-profesionales?profesional_id=X
     */
    static listar = asyncHandler(async (req, res) => {
        const {
            profesional_id,
            dia_semana,
            tipo_horario,
            solo_permite_citas,
            incluir_inactivos,
            fecha_vigencia,
            limite,
            offset
        } = req.query;

        const organizacionId = req.tenant.organizacionId;

        if (!profesional_id) {
            return ResponseHelper.error(res, 'El parámetro profesional_id es requerido', 400);
        }

        const resultado = await HorarioProfesionalModel.obtenerPorProfesional({
            organizacion_id: organizacionId,
            profesional_id: parseInt(profesional_id),
            dia_semana: dia_semana !== undefined ? parseInt(dia_semana) : undefined,
            tipo_horario,
            solo_permite_citas: solo_permite_citas === 'true',
            incluir_inactivos: incluir_inactivos === 'true',
            fecha_vigencia,
            limite: limite ? parseInt(limite) : undefined,
            offset: offset ? parseInt(offset) : undefined
        });

        return ResponseHelper.success(res, resultado, 'Horarios obtenidos exitosamente');
    });

    /**
     * Obtener horario por ID
     * GET /api/v1/horarios-profesionales/:id
     */
    static obtenerPorId = asyncHandler(async (req, res) => {
        const horarioId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;

        const horario = await HorarioProfesionalModel.obtenerPorId(horarioId, organizacionId);

        if (!horario) {
            return ResponseHelper.error(res, 'Horario no encontrado', 404);
        }

        return ResponseHelper.success(res, horario, 'Horario obtenido exitosamente');
    });

    /**
     * Actualizar horario
     * PUT /api/v1/horarios-profesionales/:id
     */
    static actualizar = asyncHandler(async (req, res) => {
        const horarioId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;

        const {
            dia_semana,
            hora_inicio,
            hora_fin,
            zona_horaria,
            tipo_horario,
            nombre_horario,
            descripcion,
            permite_citas,
            duracion_slot_minutos,
            precio_premium,
            permite_descuentos,
            fecha_inicio,
            fecha_fin,
            motivo_vigencia,
            capacidad_maxima,
            configuracion_especial,
            activo,
            prioridad
        } = req.body;

        const horarioActualizado = await HorarioProfesionalModel.actualizar(
            horarioId,
            organizacionId,
            {
                dia_semana,
                hora_inicio,
                hora_fin,
                zona_horaria,
                tipo_horario,
                nombre_horario,
                descripcion,
                permite_citas,
                duracion_slot_minutos,
                precio_premium,
                permite_descuentos,
                fecha_inicio,
                fecha_fin,
                motivo_vigencia,
                capacidad_maxima,
                configuracion_especial,
                activo,
                prioridad
            },
            {
                usuario_id: req.user.id
            }
        );

        return ResponseHelper.success(res, horarioActualizado, 'Horario actualizado exitosamente');
    });

    /**
     * Eliminar horario (soft delete)
     * DELETE /api/v1/horarios-profesionales/:id
     */
    static eliminar = asyncHandler(async (req, res) => {
        const horarioId = parseInt(req.params.id);
        const organizacionId = req.tenant.organizacionId;

        const resultado = await HorarioProfesionalModel.eliminar(horarioId, organizacionId, {
            usuario_id: req.user.id
        });

        return ResponseHelper.success(res, resultado, 'Horario eliminado exitosamente');
    });

    /**
     * Validar si profesional tiene horarios configurados
     * GET /api/v1/horarios-profesionales/validar/:profesional_id
     */
    static validarConfiguracion = asyncHandler(async (req, res) => {
        const profesionalId = parseInt(req.params.profesional_id);
        const organizacionId = req.tenant.organizacionId;

        const validacion = await HorarioProfesionalModel.validarProfesionalTieneHorarios(
            profesionalId,
            organizacionId
        );

        return ResponseHelper.success(res, validacion, 'Validación completada');
    });
}

module.exports = HorarioProfesionalController;
