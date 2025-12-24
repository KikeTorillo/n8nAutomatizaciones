/**
 * WorkflowAdapter - Adaptador para integración de workflows
 *
 * Proporciona una interfaz limpia para que otros módulos interactúen
 * con el sistema de workflows sin acoplamiento directo.
 *
 * Características:
 * - Lazy loading del WorkflowEngine (solo carga si se usa)
 * - Verificación de módulo activo
 * - Interfaz simplificada
 *
 * @module services/workflowAdapter
 */

const logger = require('../utils/logger');

// Cache del WorkflowEngine (lazy loaded)
let _workflowEngine = null;

/**
 * Obtener instancia del WorkflowEngine (lazy load)
 * @returns {Object|null} WorkflowEngine o null si no disponible
 */
function getWorkflowEngine() {
    if (_workflowEngine === null) {
        try {
            const { WorkflowEngine } = require('../modules/workflows/services');
            _workflowEngine = WorkflowEngine;
            logger.debug('[WorkflowAdapter] WorkflowEngine cargado exitosamente');
        } catch (error) {
            logger.warn('[WorkflowAdapter] WorkflowEngine no disponible:', error.message);
            _workflowEngine = false; // Marcar como no disponible
        }
    }
    return _workflowEngine || null;
}

/**
 * Evaluar si una entidad requiere aprobación según workflows configurados
 *
 * @param {string} tipoEntidad - Tipo de entidad (ej: 'orden_compra')
 * @param {number} entidadId - ID de la entidad
 * @param {Object} contexto - Datos de contexto para evaluación (ej: { total: 5000 })
 * @param {number} usuarioId - ID del usuario que ejecuta la acción
 * @param {number} organizacionId - ID de la organización
 * @returns {Promise<Object|null>} Workflow aplicable o null si no requiere aprobación
 */
async function evaluarRequiereAprobacion(tipoEntidad, entidadId, contexto, usuarioId, organizacionId) {
    const engine = getWorkflowEngine();

    if (!engine) {
        logger.debug('[WorkflowAdapter] Workflows no disponible, sin aprobación requerida');
        return null;
    }

    try {
        return await engine.evaluarRequiereAprobacion(
            tipoEntidad,
            entidadId,
            contexto,
            usuarioId,
            organizacionId
        );
    } catch (error) {
        logger.error('[WorkflowAdapter] Error evaluando aprobación:', error);
        // En caso de error, no bloquear el flujo
        return null;
    }
}

/**
 * Iniciar un workflow para una entidad
 *
 * @param {number} workflowId - ID del workflow a iniciar
 * @param {string} tipoEntidad - Tipo de entidad
 * @param {number} entidadId - ID de la entidad
 * @param {Object} metadata - Datos adicionales para el workflow
 * @param {number} usuarioId - ID del usuario solicitante
 * @param {number} organizacionId - ID de la organización
 * @param {Object} [dbClient] - Cliente de BD para transacciones (opcional)
 * @returns {Promise<Object>} Resultado de iniciar el workflow
 */
async function iniciarWorkflow(workflowId, tipoEntidad, entidadId, metadata, usuarioId, organizacionId, dbClient = null) {
    const engine = getWorkflowEngine();

    if (!engine) {
        throw new Error('Sistema de workflows no disponible');
    }

    return await engine.iniciarWorkflow(
        workflowId,
        tipoEntidad,
        entidadId,
        metadata,
        usuarioId,
        organizacionId,
        dbClient
    );
}

/**
 * Verificar si el módulo de workflows está disponible
 * @returns {boolean}
 */
function isAvailable() {
    return getWorkflowEngine() !== null;
}

module.exports = {
    evaluarRequiereAprobacion,
    iniciarWorkflow,
    isAvailable
};
