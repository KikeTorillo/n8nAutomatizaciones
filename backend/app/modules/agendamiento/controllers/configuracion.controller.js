/**
 * ====================================================================
 * CONFIGURACIÓN AGENDAMIENTO CONTROLLER
 * ====================================================================
 *
 * Endpoints para gestionar configuración del módulo de agendamiento.
 * La configuración se almacena en organizaciones.metadata.agendamiento
 *
 * @module configuracion.controller
 * @since Enero 2026
 */

const { asyncHandler } = require('../../../middleware');
const { ResponseHelper } = require('../../../utils/helpers');
const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class ConfiguracionAgendamientoController {

    /**
     * Obtiene la configuración de agendamiento de la organización
     * GET /api/v1/agendamiento/configuracion
     */
    static obtener = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const config = await RLSContextManager.query(organizacionId, async (db) => {
            const result = await db.query(
                `SELECT COALESCE(metadata->'agendamiento', '{}'::jsonb) as config
                 FROM organizaciones WHERE id = $1`,
                [organizacionId]
            );
            return result.rows[0]?.config || {};
        });

        // Valores por defecto si no existen
        const configConDefaults = {
            round_robin_habilitado: false,
            verificar_disponibilidad: true,
            ...config
        };

        return ResponseHelper.success(
            res,
            configConDefaults,
            'Configuración de agendamiento obtenida exitosamente'
        );
    });

    /**
     * Actualiza la configuración de agendamiento de la organización
     * PUT /api/v1/agendamiento/configuracion
     * @body { round_robin_habilitado?: boolean, verificar_disponibilidad?: boolean, ... }
     */
    static actualizar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const nuevaConfig = req.body;

        // Campos permitidos para actualizar
        const camposPermitidos = [
            'round_robin_habilitado',
            'verificar_disponibilidad'
        ];

        // Filtrar solo campos permitidos
        const configFiltrada = {};
        for (const campo of camposPermitidos) {
            if (nuevaConfig[campo] !== undefined) {
                configFiltrada[campo] = nuevaConfig[campo];
            }
        }

        if (Object.keys(configFiltrada).length === 0) {
            return ResponseHelper.error(res, 'No hay campos válidos para actualizar', 400);
        }

        // Usar withBypass porque organizaciones tiene WITH CHECK restrictivo
        const configActualizada = await RLSContextManager.withBypass(async (db) => {
            // Obtener configuración actual
            const currentResult = await db.query(
                `SELECT COALESCE(metadata, '{}'::jsonb) as metadata
                 FROM organizaciones WHERE id = $1`,
                [organizacionId]
            );
            const currentMetadata = currentResult.rows[0]?.metadata || {};
            const currentAgendamiento = currentMetadata.agendamiento || {};

            // Merge con nueva configuración
            const nuevaAgendamiento = {
                ...currentAgendamiento,
                ...configFiltrada
            };

            // Actualizar metadata
            const newMetadata = {
                ...currentMetadata,
                agendamiento: nuevaAgendamiento
            };

            await db.query(
                `UPDATE organizaciones
                 SET metadata = $1, actualizado_en = NOW()
                 WHERE id = $2`,
                [JSON.stringify(newMetadata), organizacionId]
            );

            logger.info('[ConfiguracionAgendamiento.actualizar] Configuración actualizada', {
                organizacion_id: organizacionId,
                cambios: configFiltrada
            });

            return nuevaAgendamiento;
        }, { useTransaction: true });

        // Valores por defecto para respuesta
        const configConDefaults = {
            round_robin_habilitado: false,
            verificar_disponibilidad: true,
            ...configActualizada
        };

        return ResponseHelper.success(
            res,
            configConDefaults,
            'Configuración de agendamiento actualizada exitosamente'
        );
    });

    /**
     * Toggle rápido para round-robin
     * POST /api/v1/agendamiento/configuracion/round-robin/toggle
     */
    static toggleRoundRobin = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Usar withBypass porque organizaciones tiene WITH CHECK restrictivo
        const resultado = await RLSContextManager.withBypass(async (db) => {
            // Obtener estado actual
            const currentResult = await db.query(
                `SELECT COALESCE(metadata->'agendamiento'->>'round_robin_habilitado', 'false') as estado
                 FROM organizaciones WHERE id = $1`,
                [organizacionId]
            );
            const estadoActual = currentResult.rows[0]?.estado === 'true';
            const nuevoEstado = !estadoActual;

            // Actualizar - Primero asegura que exista el key agendamiento
            await db.query(
                `UPDATE organizaciones
                 SET metadata = jsonb_set(
                     jsonb_set(
                         COALESCE(metadata, '{}'::jsonb),
                         '{agendamiento}',
                         COALESCE(metadata->'agendamiento', '{}'::jsonb),
                         true
                     ),
                     '{agendamiento,round_robin_habilitado}',
                     $1::jsonb,
                     true
                 ),
                 actualizado_en = NOW()
                 WHERE id = $2`,
                [JSON.stringify(nuevoEstado), organizacionId]
            );

            logger.info('[ConfiguracionAgendamiento.toggleRoundRobin] Round-robin toggled', {
                organizacion_id: organizacionId,
                estado_anterior: estadoActual,
                nuevo_estado: nuevoEstado
            });

            return {
                round_robin_habilitado: nuevoEstado,
                estado_anterior: estadoActual
            };
        }, { useTransaction: true });

        return ResponseHelper.success(
            res,
            resultado,
            `Round-Robin ${resultado.round_robin_habilitado ? 'activado' : 'desactivado'} exitosamente`
        );
    });
}

module.exports = ConfiguracionAgendamientoController;
