/**
 * @fileoverview Rutas del Super Administrador
 * @description Endpoints para gestión global del sistema SaaS
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const express = require('express');
const SuperAdminController = require('../controllers/superadmin.controller');
const { auth, rateLimiting } = require('../../../middleware');

const router = express.Router();

// ====================================================================
// PROTEGER TODAS LAS RUTAS
// ====================================================================
// Todas las rutas requieren:
// 1. Autenticación JWT válida
// 2. Rol super_admin
// ====================================================================

router.use(auth.authenticateToken);
router.use(auth.requireRole(['super_admin']));

// ====================================================================
// DASHBOARD GLOBAL
// ====================================================================
/**
 * GET /api/v1/superadmin/dashboard
 *
 * Dashboard con métricas globales del sistema:
 * - Organizaciones activas/totales
 * - Usuarios totales
 * - Citas del mes
 * - Revenue mensual
 * - Top 10 organizaciones
 *
 * @requires rol: super_admin
 * @returns {Object} Métricas globales y top organizaciones
 */
router.get('/dashboard',
    rateLimiting.apiRateLimit,
    SuperAdminController.dashboard
);

// ====================================================================
// GESTIÓN DE ORGANIZACIONES
// ====================================================================
/**
 * GET /api/v1/superadmin/organizaciones
 *
 * Listar todas las organizaciones con filtros avanzados
 *
 * Query params:
 * - page: Número de página (default: 1)
 * - limit: Registros por página (default: 20, max: 100)
 * - busqueda: Búsqueda por nombre o email
 * - plan: Filtrar por plan (trial, basico, profesional, custom)
 * - estado: Filtrar por estado (activa, trial, morosa, suspendida)
 * - orden: Campo para ordenar (fecha_registro, nombre_comercial, uso_citas_mes_actual)
 * - direccion: ASC o DESC
 *
 * @requires rol: super_admin
 * @returns {Object} Lista paginada de organizaciones con métricas
 */
router.get('/organizaciones',
    rateLimiting.apiRateLimit,
    SuperAdminController.listarOrganizaciones
);

// ====================================================================
// GESTIÓN DE PLANES
// ====================================================================
/**
 * GET /api/v1/superadmin/planes
 *
 * Listar todos los planes con contador de organizaciones activas
 *
 * @requires rol: super_admin
 * @returns {Object} Lista de planes con métricas de uso
 */
router.get('/planes',
    rateLimiting.apiRateLimit,
    SuperAdminController.listarPlanes
);

/**
 * PUT /api/v1/superadmin/planes/:id
 *
 * Actualizar límites y configuración de un plan
 *
 * Body (todos opcionales):
 * - nombre_plan: string
 * - descripcion: string
 * - precio_mensual: number
 * - precio_anual: number
 * - limite_profesionales: number
 * - limite_clientes: number
 * - limite_servicios: number
 * - limite_usuarios: number
 * - limite_citas_mes: number
 * - funciones_habilitadas: object
 * - activo: boolean
 *
 * @requires rol: super_admin
 * @returns {Object} Plan actualizado
 */
router.put('/planes/:id',
    rateLimiting.heavyOperationRateLimit,
    SuperAdminController.actualizarPlan
);

// ====================================================================
// NOTA: Rutas de suspender/reactivar/cambiar plan de organizaciones
// ya existen en /api/v1/organizaciones con protección super_admin
//
// NOTA: Rutas de marketplace (perfiles, activar, analytics)
// están en /api/v1/marketplace con protección super_admin
// ====================================================================

module.exports = router;
