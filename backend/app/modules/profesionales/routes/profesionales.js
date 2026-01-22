const express = require('express');
const ProfesionalController = require('../controllers/profesional.controller');
const DocumentoEmpleadoController = require('../controllers/documento.controller');
const CuentaBancariaController = require('../controllers/cuenta-bancaria.controller');
const ExperienciaController = require('../controllers/experiencia.controller');
const EducacionController = require('../controllers/educacion.controller');
const { HabilidadEmpleadoController } = require('../controllers/habilidad.controller');
const OnboardingController = require('../controllers/onboarding.controller');
const { auth, tenant, rateLimiting, validation, subscription, storage } = require('../../../middleware');
const schemas = require('../schemas/profesional.schemas');
const onboardingSchemas = require('../schemas/onboarding.schemas');

const router = express.Router();

// ========== Rutas Bulk ==========

router.post('/bulk-create',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    // NO agregar checkResourceLimit aquí - se valida dentro del método bulkCrear
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.bulkCrear),
    ProfesionalController.bulkCrear
);

// ========== Rutas Admin ==========

router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.crear),
    ProfesionalController.crear
);

router.get('/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerEstadisticas),
    ProfesionalController.obtenerEstadisticas
);

router.post('/validar-email',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.validarEmail),
    ProfesionalController.validarEmail
);

router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizar),
    ProfesionalController.actualizar
);

router.patch('/:id/estado',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.cambiarEstado),
    ProfesionalController.cambiarEstado
);

router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.eliminar),
    ProfesionalController.eliminar
);

// ========== Rutas Modelo Unificado Profesional-Usuario (Nov 2025) ==========

// Obtener usuarios disponibles para vincular (sin profesional asignado)
router.get('/usuarios-disponibles',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    ProfesionalController.obtenerUsuariosDisponibles
);

// Listar profesionales por módulo habilitado
router.get('/por-modulo/:modulo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.listarPorModulo),
    ProfesionalController.listarPorModulo
);

// Buscar profesional vinculado a un usuario
router.get('/por-usuario/:usuarioId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.buscarPorUsuario),
    ProfesionalController.buscarPorUsuario
);

// Vincular/desvincular usuario a profesional
router.patch('/:id/vincular-usuario',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.vincularUsuario),
    ProfesionalController.vincularUsuario
);

// Actualizar módulos habilitados para un profesional
router.patch('/:id/modulos',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarModulos),
    ProfesionalController.actualizarModulos
);

// ========== Rutas Autenticadas ==========
// Ruta /tipo/:tipoId eliminada - usar GET / con filtro de categorías

router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.listar),
    ProfesionalController.listar
);

router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerPorId),
    ProfesionalController.obtenerPorId
);

router.patch('/:id/metricas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarMetricas),
    ProfesionalController.actualizarMetricas
);

// ========== Rutas Jerarquía Organizacional (Dic 2025) ==========

// Obtener subordinados de un profesional
router.get('/:id/subordinados',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerSubordinados),
    ProfesionalController.obtenerSubordinados
);

// Obtener cadena de supervisores de un profesional
router.get('/:id/supervisores',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerSupervisores),
    ProfesionalController.obtenerSupervisores
);

// ========== Rutas Categorías de Profesional (Dic 2025) ==========

// Obtener categorías de un profesional
router.get('/:id/categorias',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerCategoriasProfesional),
    ProfesionalController.obtenerCategorias
);

// Asignar categoría a un profesional
router.post('/:id/categorias',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.asignarCategoria),
    ProfesionalController.asignarCategoria
);

// Eliminar categoría de un profesional
router.delete('/:id/categorias/:categoriaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.eliminarCategoria),
    ProfesionalController.eliminarCategoria
);

// Sincronizar categorías de un profesional (reemplaza todas)
router.put('/:id/categorias',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.sincronizarCategorias),
    ProfesionalController.sincronizarCategorias
);

// ========== Rutas Documentos de Empleado (Enero 2026) ==========

// Listar documentos de un profesional
router.get('/:id/documentos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.listarDocumentos),
    DocumentoEmpleadoController.listar
);

// Crear documento con archivo (FormData)
router.post('/:id/documentos',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    storage.checkStorageLimit,
    storage.uploadSingle,
    storage.validateFileSize,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.crearDocumento),
    DocumentoEmpleadoController.crear
);

// Obtener documento específico
router.get('/:id/documentos/:docId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerDocumento),
    DocumentoEmpleadoController.obtenerPorId
);

// Actualizar metadata de documento
router.put('/:id/documentos/:docId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarDocumento),
    DocumentoEmpleadoController.actualizar
);

// Eliminar documento (soft delete)
router.delete('/:id/documentos/:docId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.eliminarDocumento),
    DocumentoEmpleadoController.eliminar
);

// Verificar/desverificar documento
router.patch('/:id/documentos/:docId/verificar',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.verificarDocumento),
    DocumentoEmpleadoController.verificar
);

// Obtener URL firmada temporal para descarga
router.get('/:id/documentos/:docId/presigned',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerUrlPresigned),
    DocumentoEmpleadoController.obtenerUrlPresigned
);

// Reemplazar archivo de documento
router.post('/:id/documentos/:docId/reemplazar-archivo',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    storage.checkStorageLimit,
    storage.uploadSingle,
    storage.validateFileSize,
    rateLimiting.apiRateLimit,
    DocumentoEmpleadoController.reemplazarArchivo
);

// ========== Rutas Cuentas Bancarias (Fase 1 - Enero 2026) ==========

// Listar cuentas bancarias de un profesional
router.get('/:id/cuentas-bancarias',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.listarCuentasBancarias),
    CuentaBancariaController.listar
);

// Crear cuenta bancaria
router.post('/:id/cuentas-bancarias',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.crearCuentaBancaria),
    CuentaBancariaController.crear
);

// Obtener cuenta bancaria específica
router.get('/:id/cuentas-bancarias/:cuentaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerCuentaBancaria),
    CuentaBancariaController.obtenerPorId
);

// Actualizar cuenta bancaria
router.put('/:id/cuentas-bancarias/:cuentaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarCuentaBancaria),
    CuentaBancariaController.actualizar
);

// Eliminar cuenta bancaria (soft delete)
router.delete('/:id/cuentas-bancarias/:cuentaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.eliminarCuentaBancaria),
    CuentaBancariaController.eliminar
);

// Establecer cuenta como principal
router.patch('/:id/cuentas-bancarias/:cuentaId/principal',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.establecerCuentaPrincipal),
    CuentaBancariaController.establecerPrincipal
);

// ========== Rutas Experiencia Laboral (Fase 4 - Enero 2026) ==========

// Listar experiencias de un profesional
router.get('/:id/experiencia',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.listarExperiencia),
    ExperienciaController.listar
);

// Obtener empleo actual
router.get('/:id/experiencia/actual',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ExperienciaController.obtenerEmpleoActual
);

// Crear experiencia
router.post('/:id/experiencia',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.crearExperiencia),
    ExperienciaController.crear
);

// Reordenar experiencias
router.patch('/:id/experiencia/reordenar',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.reordenarExperiencia),
    ExperienciaController.reordenar
);

// Obtener experiencia específica
router.get('/:id/experiencia/:expId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerExperiencia),
    ExperienciaController.obtenerPorId
);

// Actualizar experiencia
router.put('/:id/experiencia/:expId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarExperiencia),
    ExperienciaController.actualizar
);

// Eliminar experiencia
router.delete('/:id/experiencia/:expId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.eliminarExperiencia),
    ExperienciaController.eliminar
);

// ========== Rutas Educación Formal (Fase 4 - Enero 2026) ==========

// Listar educación de un profesional
router.get('/:id/educacion',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.listarEducacion),
    EducacionController.listar
);

// Obtener estudios en curso
router.get('/:id/educacion/en-curso',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    EducacionController.obtenerEnCurso
);

// Crear educación
router.post('/:id/educacion',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.crearEducacion),
    EducacionController.crear
);

// Reordenar educación
router.patch('/:id/educacion/reordenar',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.reordenarEducacion),
    EducacionController.reordenar
);

// Obtener educación específica
router.get('/:id/educacion/:eduId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerEducacion),
    EducacionController.obtenerPorId
);

// Actualizar educación
router.put('/:id/educacion/:eduId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarEducacion),
    EducacionController.actualizar
);

// Eliminar educación
router.delete('/:id/educacion/:eduId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.eliminarEducacion),
    EducacionController.eliminar
);

// ========== Rutas Habilidades de Empleado (Fase 4 - Enero 2026) ==========

// Listar habilidades de un profesional
router.get('/:id/habilidades',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.listarHabilidadesEmpleado),
    HabilidadEmpleadoController.listar
);

// Asignar habilidad
router.post('/:id/habilidades',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.asignarHabilidad),
    HabilidadEmpleadoController.asignar
);

// Asignar múltiples habilidades (batch)
router.post('/:id/habilidades/batch',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    HabilidadEmpleadoController.asignarBatch
);

// Obtener habilidad específica del empleado
router.get('/:id/habilidades/:habEmpId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.obtenerHabilidadEmpleado),
    HabilidadEmpleadoController.obtenerPorId
);

// Actualizar habilidad del empleado
router.put('/:id/habilidades/:habEmpId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarHabilidadEmpleado),
    HabilidadEmpleadoController.actualizar
);

// Verificar habilidad
router.patch('/:id/habilidades/:habEmpId/verificar',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.verificarHabilidadEmpleado),
    HabilidadEmpleadoController.verificar
);

// Eliminar habilidad del empleado
router.delete('/:id/habilidades/:habEmpId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.eliminarHabilidadEmpleado),
    HabilidadEmpleadoController.eliminar
);

// ========== Rutas Onboarding de Empleado (Fase 5 - Enero 2026) ==========

// Aplicar plantilla de onboarding a un profesional
router.post('/:id/onboarding/aplicar',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(onboardingSchemas.aplicarPlantilla),
    OnboardingController.aplicarPlantilla
);

// Obtener progreso de onboarding de un profesional
router.get('/:id/onboarding/progreso',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(onboardingSchemas.obtenerProgreso),
    OnboardingController.obtenerProgreso
);

// Marcar tarea de onboarding como completada/pendiente
router.patch('/:id/onboarding/progreso/:tareaId',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validation.validate(onboardingSchemas.marcarTarea),
    OnboardingController.marcarTarea
);

// Eliminar todo el progreso de onboarding de un profesional
router.delete('/:id/onboarding',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    auth.requireAdminRole,
    rateLimiting.apiRateLimit,
    validation.validate(onboardingSchemas.eliminarProgreso),
    OnboardingController.eliminarProgreso
);

module.exports = router;
