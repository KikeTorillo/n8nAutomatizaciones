/**
 * @fileoverview Controller de Usuarios Ubicaciones
 * @description Endpoints para gestión de asignación de ubicaciones a usuarios
 * @version 1.0.0
 * @date Enero 2026
 */

const UsuariosUbicacionesModel = require('../models/usuariosUbicaciones.model');
const { ResponseHelper, RolHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

class UsuariosUbicacionesController {

  /**
   * Obtener ubicaciones asignadas a un usuario
   * GET /usuarios/:id/ubicaciones
   */
  static obtenerUbicaciones = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar permisos: admin/propietario o el propio usuario
    const esAdmin = RolHelper.esRolAdministrativo(req.user);
    const esPropioUsuario = parseInt(id) === req.user.id;

    if (!esAdmin && !esPropioUsuario) {
      return ResponseHelper.error(res, 'No tienes permisos para ver las ubicaciones de este usuario', 403);
    }

    const ubicaciones = await UsuariosUbicacionesModel.obtenerPorUsuario(
      parseInt(id),
      req.tenant.organizacionId
    );

    return ResponseHelper.success(res, ubicaciones, 'Ubicaciones del usuario obtenidas exitosamente');
  });

  /**
   * Asignar ubicación a usuario
   * POST /usuarios/:id/ubicaciones
   */
  static asignarUbicacion = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Solo propietario o mayor (nivel >= 80) pueden asignar ubicaciones
    if (!RolHelper.tieneNivelMinimo(req.user, 80)) {
      return ResponseHelper.error(res, 'No tienes permisos para asignar ubicaciones', 403);
    }

    const asignacion = await UsuariosUbicacionesModel.asignar(
      parseInt(id),
      req.body,
      req.tenant.organizacionId
    );

    return ResponseHelper.success(res, asignacion, 'Ubicación asignada exitosamente', 201);
  });

  /**
   * Actualizar permisos de asignación de ubicación
   * PATCH /usuarios/:id/ubicaciones/:ubicacionId
   */
  static actualizarAsignacion = asyncHandler(async (req, res) => {
    const { id, ubicacionId } = req.params;

    // Solo propietario o mayor (nivel >= 80) pueden actualizar asignaciones
    if (!RolHelper.tieneNivelMinimo(req.user, 80)) {
      return ResponseHelper.error(res, 'No tienes permisos para modificar asignaciones de ubicaciones', 403);
    }

    const asignacion = await UsuariosUbicacionesModel.actualizar(
      parseInt(id),
      parseInt(ubicacionId),
      req.body,
      req.tenant.organizacionId
    );

    return ResponseHelper.success(res, asignacion, 'Asignación de ubicación actualizada exitosamente');
  });

  /**
   * Desasignar ubicación de usuario
   * DELETE /usuarios/:id/ubicaciones/:ubicacionId
   */
  static desasignarUbicacion = asyncHandler(async (req, res) => {
    const { id, ubicacionId } = req.params;

    // Solo propietario o mayor (nivel >= 80) pueden desasignar ubicaciones
    if (!RolHelper.tieneNivelMinimo(req.user, 80)) {
      return ResponseHelper.error(res, 'No tienes permisos para desasignar ubicaciones', 403);
    }

    const resultado = await UsuariosUbicacionesModel.desasignar(
      parseInt(id),
      parseInt(ubicacionId),
      req.tenant.organizacionId
    );

    return ResponseHelper.success(res, resultado, 'Ubicación desasignada exitosamente');
  });

  /**
   * Obtener ubicaciones disponibles para asignar a un usuario
   * GET /usuarios/:id/ubicaciones-disponibles
   */
  static obtenerDisponibles = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Solo propietario o mayor (nivel >= 80) pueden ver ubicaciones disponibles
    if (!RolHelper.tieneNivelMinimo(req.user, 80)) {
      return ResponseHelper.error(res, 'No tienes permisos para ver ubicaciones disponibles', 403);
    }

    const ubicaciones = await UsuariosUbicacionesModel.obtenerDisponibles(
      parseInt(id),
      req.tenant.organizacionId
    );

    return ResponseHelper.success(res, ubicaciones, 'Ubicaciones disponibles obtenidas exitosamente');
  });
}

module.exports = UsuariosUbicacionesController;
