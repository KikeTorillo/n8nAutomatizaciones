/**
 * ====================================================================
 * RUTAS DE CLIENTES - MÓDULO CORE
 * ====================================================================
 *
 * Rutas para gestión de Clientes como módulo Core compartido.
 * Siguiendo el patrón Odoo/Salesforce donde Clientes es transversal.
 *
 * Migrado desde modules/agendamiento/routes (Nov 2025)
 * ====================================================================
 */

const express = require('express');
const ClienteController = require('../controllers/cliente.controller');
const EtiquetaClienteController = require('../controllers/etiqueta.controller');
const ActividadClienteController = require('../controllers/actividad.controller');
const DocumentoClienteController = require('../controllers/documento.controller');
const OportunidadController = require('../controllers/oportunidad.controller');
const { auth, tenant, validation, rateLimiting, subscription, storage } = require('../../../middleware');
const clienteSchemas = require('../schemas/cliente.schemas');
const etiquetaSchemas = require('../schemas/etiqueta.schemas');
const actividadSchemas = require('../schemas/actividad.schemas');
const documentoSchemas = require('../schemas/documento.schemas');
const oportunidadSchemas = require('../schemas/oportunidad.schemas');

const router = express.Router();

// ===================================================================
// CRUD BÁSICO
// ===================================================================

/**
 * POST /api/v1/clientes
 * Crear nuevo cliente
 */
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    subscription.checkActiveSubscription,
    subscription.checkResourceLimit('clientes'),
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.crear),
    ClienteController.crear
);

/**
 * GET /api/v1/clientes
 * Listar clientes con paginación y filtros
 */
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.listar),
    ClienteController.listar
);

// ===================================================================
// ESTADÍSTICAS Y BÚSQUEDAS (antes de :id para evitar conflictos)
// ===================================================================

/**
 * GET /api/v1/clientes/estadisticas
 * Estadísticas generales de clientes de la organización
 */
router.get('/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    validation.validate(clienteSchemas.obtenerEstadisticas),
    ClienteController.obtenerEstadisticas
);

/**
 * GET /api/v1/clientes/buscar-telefono
 * Búsqueda fuzzy por teléfono (para chatbots y walk-in)
 */
router.get('/buscar-telefono',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.buscarPorTelefono),
    ClienteController.buscarPorTelefono
);

/**
 * GET /api/v1/clientes/buscar-nombre
 * Búsqueda fuzzy por nombre (para chatbots)
 */
router.get('/buscar-nombre',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.buscarPorNombre),
    ClienteController.buscarPorNombre
);

/**
 * GET /api/v1/clientes/buscar
 * Búsqueda general (nombre, email, teléfono)
 */
router.get('/buscar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.buscar),
    ClienteController.buscar
);

/**
 * POST /api/v1/clientes/importar-csv
 * Importar clientes desde CSV (masivo)
 */
router.post('/importar-csv',
    auth.authenticateToken,
    tenant.setTenantContext,
    subscription.checkActiveSubscription,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin']),
    validation.validate(clienteSchemas.importarCSV),
    ClienteController.importarCSV
);

// ===================================================================
// GESTIÓN DE ETIQUETAS (Fase 2 - Ene 2026)
// IMPORTANTE: Estas rutas DEBEN ir ANTES de /:id para evitar conflictos
// ===================================================================

/**
 * GET /api/v1/clientes/etiquetas
 * Listar etiquetas de la organización
 */
router.get('/etiquetas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(etiquetaSchemas.listar),
    EtiquetaClienteController.listar
);

/**
 * POST /api/v1/clientes/etiquetas
 * Crear nueva etiqueta
 */
router.post('/etiquetas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    validation.validate(etiquetaSchemas.crear),
    EtiquetaClienteController.crear
);

/**
 * GET /api/v1/clientes/etiquetas/:etiquetaId
 * Obtener etiqueta por ID
 */
router.get('/etiquetas/:etiquetaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(etiquetaSchemas.obtenerPorId),
    EtiquetaClienteController.obtenerPorId
);

/**
 * PUT /api/v1/clientes/etiquetas/:etiquetaId
 * Actualizar etiqueta
 */
router.put('/etiquetas/:etiquetaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    validation.validate(etiquetaSchemas.actualizar),
    EtiquetaClienteController.actualizar
);

/**
 * DELETE /api/v1/clientes/etiquetas/:etiquetaId
 * Eliminar etiqueta
 */
router.delete('/etiquetas/:etiquetaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin']),
    validation.validate(etiquetaSchemas.eliminar),
    EtiquetaClienteController.eliminar
);

// ===================================================================
// OPERACIONES POR ID
// ===================================================================

/**
 * GET /api/v1/clientes/:id
 * Obtener cliente por ID
 */
router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.obtenerPorId),
    ClienteController.obtenerPorId
);

/**
 * GET /api/v1/clientes/:id/estadisticas
 * Vista 360° del cliente - Estadísticas detalladas (CRM)
 */
router.get('/:id/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.obtenerEstadisticasCliente),
    ClienteController.obtenerEstadisticasCliente
);

/**
 * PUT /api/v1/clientes/:id
 * Actualizar cliente
 */
router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.actualizar),
    ClienteController.actualizar
);

/**
 * PATCH /api/v1/clientes/:id/estado
 * Cambiar estado activo/inactivo
 */
router.patch('/:id/estado',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    validation.validate(clienteSchemas.cambiarEstado),
    ClienteController.cambiarEstado
);

/**
 * DELETE /api/v1/clientes/:id
 * Eliminar cliente (soft delete)
 */
router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin']),
    validation.validate(clienteSchemas.eliminar),
    ClienteController.eliminar
);

// ===================================================================
// ETIQUETAS DE CLIENTE (Fase 2 - Ene 2026)
// ===================================================================

/**
 * GET /api/v1/clientes/:clienteId/etiquetas
 * Obtener etiquetas de un cliente
 */
router.get('/:clienteId/etiquetas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(etiquetaSchemas.obtenerEtiquetasCliente),
    EtiquetaClienteController.obtenerEtiquetasCliente
);

/**
 * POST /api/v1/clientes/:clienteId/etiquetas
 * Asignar etiquetas a un cliente (reemplaza existentes)
 */
router.post('/:clienteId/etiquetas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(etiquetaSchemas.asignarEtiquetas),
    EtiquetaClienteController.asignarEtiquetas
);

/**
 * POST /api/v1/clientes/:clienteId/etiquetas/:etiquetaId
 * Agregar una etiqueta a un cliente
 */
router.post('/:clienteId/etiquetas/:etiquetaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(etiquetaSchemas.agregarEtiqueta),
    EtiquetaClienteController.agregarEtiqueta
);

/**
 * DELETE /api/v1/clientes/:clienteId/etiquetas/:etiquetaId
 * Quitar una etiqueta de un cliente
 */
router.delete('/:clienteId/etiquetas/:etiquetaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(etiquetaSchemas.quitarEtiqueta),
    EtiquetaClienteController.quitarEtiqueta
);

// ===================================================================
// ACTIVIDADES Y TIMELINE (Fase 4A - Ene 2026)
// ===================================================================

/**
 * GET /api/v1/clientes/:clienteId/actividades
 * Listar actividades de un cliente
 */
router.get('/:clienteId/actividades',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.listar),
    ActividadClienteController.listar
);

/**
 * GET /api/v1/clientes/:clienteId/timeline
 * Obtener timeline unificado (actividades + citas + ventas)
 */
router.get('/:clienteId/timeline',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.timeline),
    ActividadClienteController.obtenerTimeline
);

/**
 * GET /api/v1/clientes/:clienteId/actividades/conteo
 * Contar actividades por tipo
 */
router.get('/:clienteId/actividades/conteo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.conteo),
    ActividadClienteController.contarActividades
);

/**
 * POST /api/v1/clientes/:clienteId/actividades
 * Crear nueva actividad (nota, llamada, tarea, email)
 */
router.post('/:clienteId/actividades',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.crear),
    ActividadClienteController.crear
);

/**
 * GET /api/v1/clientes/:clienteId/actividades/:actividadId
 * Obtener actividad por ID
 */
router.get('/:clienteId/actividades/:actividadId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.obtenerPorId),
    ActividadClienteController.obtenerPorId
);

/**
 * PUT /api/v1/clientes/:clienteId/actividades/:actividadId
 * Actualizar actividad
 */
router.put('/:clienteId/actividades/:actividadId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.actualizar),
    ActividadClienteController.actualizar
);

/**
 * DELETE /api/v1/clientes/:clienteId/actividades/:actividadId
 * Eliminar actividad
 */
router.delete('/:clienteId/actividades/:actividadId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.eliminar),
    ActividadClienteController.eliminar
);

/**
 * PATCH /api/v1/clientes/:clienteId/actividades/:actividadId/completar
 * Marcar tarea como completada
 */
router.patch('/:clienteId/actividades/:actividadId/completar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(actividadSchemas.marcarCompletada),
    ActividadClienteController.marcarCompletada
);

// ===================================================================
// DOCUMENTOS DE CLIENTE (Fase 4B - Ene 2026)
// ===================================================================

/**
 * GET /api/v1/clientes/documentos/tipos
 * Obtener tipos de documento disponibles
 * NOTA: Esta ruta debe ir ANTES de /:clienteId para evitar conflictos
 */
router.get('/documentos/tipos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    DocumentoClienteController.obtenerTipos
);

/**
 * GET /api/v1/clientes/documentos/por-vencer
 * Listar documentos por vencer de la organización
 */
router.get('/documentos/por-vencer',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(documentoSchemas.porVencer),
    DocumentoClienteController.listarPorVencer
);

/**
 * GET /api/v1/clientes/:clienteId/documentos
 * Listar documentos de un cliente
 */
router.get('/:clienteId/documentos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(documentoSchemas.listar),
    DocumentoClienteController.listar
);

/**
 * GET /api/v1/clientes/:clienteId/documentos/conteo
 * Contar documentos de un cliente
 */
router.get('/:clienteId/documentos/conteo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(documentoSchemas.conteo),
    DocumentoClienteController.contarDocumentos
);

/**
 * POST /api/v1/clientes/:clienteId/documentos
 * Crear documento (con o sin archivo)
 */
router.post('/:clienteId/documentos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    storage.createUploadSingle('archivo'),
    validation.validate(documentoSchemas.crear),
    DocumentoClienteController.crear
);

/**
 * GET /api/v1/clientes/:clienteId/documentos/:documentoId
 * Obtener documento por ID
 */
router.get('/:clienteId/documentos/:documentoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(documentoSchemas.obtenerPorId),
    DocumentoClienteController.obtenerPorId
);

/**
 * GET /api/v1/clientes/:clienteId/documentos/:documentoId/presigned
 * Obtener URL presigned para descargar
 */
router.get('/:clienteId/documentos/:documentoId/presigned',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(documentoSchemas.presigned),
    DocumentoClienteController.obtenerPresigned
);

/**
 * PUT /api/v1/clientes/:clienteId/documentos/:documentoId
 * Actualizar documento
 */
router.put('/:clienteId/documentos/:documentoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(documentoSchemas.actualizar),
    DocumentoClienteController.actualizar
);

/**
 * DELETE /api/v1/clientes/:clienteId/documentos/:documentoId
 * Eliminar documento
 */
router.delete('/:clienteId/documentos/:documentoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(documentoSchemas.eliminar),
    DocumentoClienteController.eliminar
);

/**
 * PATCH /api/v1/clientes/:clienteId/documentos/:documentoId/verificar
 * Verificar/desverificar documento
 */
router.patch('/:clienteId/documentos/:documentoId/verificar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    validation.validate(documentoSchemas.verificar),
    DocumentoClienteController.verificar
);

/**
 * POST /api/v1/clientes/:clienteId/documentos/:documentoId/archivo
 * Subir/reemplazar archivo de un documento existente
 */
router.post('/:clienteId/documentos/:documentoId/archivo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    storage.createUploadSingle('archivo'),
    validation.validate(documentoSchemas.subirArchivo),
    DocumentoClienteController.subirArchivo
);

// ===================================================================
// CRÉDITO / FIADO (Ene 2026)
// ===================================================================

/**
 * GET /api/v1/clientes/credito/con-saldo
 * Listar clientes con saldo pendiente (cobranza)
 * NOTA: Esta ruta debe ir ANTES de /:id
 */
router.get('/credito/con-saldo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    ClienteController.listarClientesConSaldo
);

/**
 * GET /api/v1/clientes/:id/credito
 * Obtener estado de crédito de un cliente
 */
router.get('/:id/credito',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.obtenerPorId),
    ClienteController.obtenerEstadoCredito
);

/**
 * PATCH /api/v1/clientes/:id/credito
 * Habilitar/deshabilitar crédito
 */
router.patch('/:id/credito',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    validation.validate(clienteSchemas.actualizarCredito),
    ClienteController.actualizarConfigCredito
);

/**
 * POST /api/v1/clientes/:id/credito/suspender
 * Suspender crédito
 */
router.post('/:id/credito/suspender',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    validation.validate(clienteSchemas.suspenderCredito),
    ClienteController.suspenderCredito
);

/**
 * POST /api/v1/clientes/:id/credito/reactivar
 * Reactivar crédito suspendido
 */
router.post('/:id/credito/reactivar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    validation.validate(clienteSchemas.obtenerPorId),
    ClienteController.reactivarCredito
);

/**
 * POST /api/v1/clientes/:id/credito/abono
 * Registrar abono a la cuenta del cliente
 */
router.post('/:id/credito/abono',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager', 'empleado']),
    validation.validate(clienteSchemas.registrarAbono),
    ClienteController.registrarAbono
);

/**
 * GET /api/v1/clientes/:id/credito/movimientos
 * Listar movimientos de crédito
 */
router.get('/:id/credito/movimientos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.listarMovimientosCredito),
    ClienteController.listarMovimientosCredito
);

// ===================================================================
// OPORTUNIDADES B2B (Fase 5 - Ene 2026)
// ===================================================================

/**
 * GET /api/v1/clientes/:clienteId/oportunidades
 * Listar oportunidades de un cliente
 */
router.get('/:clienteId/oportunidades',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validateQuery(oportunidadSchemas.listarOportunidadesQuerySchema),
    OportunidadController.listarPorCliente
);

/**
 * POST /api/v1/clientes/:clienteId/oportunidades
 * Crear oportunidad para un cliente
 */
router.post('/:clienteId/oportunidades',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validateBody(oportunidadSchemas.oportunidadSchema),
    OportunidadController.crear
);

/**
 * GET /api/v1/clientes/:clienteId/oportunidades/estadisticas
 * Estadísticas de oportunidades del cliente
 */
router.get('/:clienteId/oportunidades/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    OportunidadController.obtenerEstadisticasCliente
);

module.exports = router;
