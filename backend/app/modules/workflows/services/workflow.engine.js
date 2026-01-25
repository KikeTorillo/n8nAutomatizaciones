/**
 * ====================================================================
 * SERVICE - WORKFLOW ENGINE
 * ====================================================================
 *
 * Motor de workflows de aprobación.
 * Funciones principales:
 * - Evaluar si una entidad requiere aprobación
 * - Iniciar instancia de workflow
 * - Procesar decisiones (aprobar/rechazar)
 * - Ejecutar acciones finales
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const notificacionAdapter = require('../../../services/notificacionAdapter');
const logger = require('../../../utils/logger');

class WorkflowEngine {

    // ========================================================================
    // EVALUACIÓN Y ACTIVACIÓN
    // ========================================================================

    /**
     * Evalúa si una entidad requiere aprobación según los workflows configurados
     * @param {string} entidadTipo - Tipo de entidad (ej: 'orden_compra')
     * @param {number} entidadId - ID de la entidad
     * @param {object} datosEntidad - Datos de la entidad (ej: {total: 5000})
     * @param {number} usuarioId - Usuario que inicia la acción
     * @param {number} organizacionId - ID de la organización
     * @returns {object|null} - Workflow que aplica o null si no requiere aprobación
     */
    static async evaluarRequiereAprobacion(entidadTipo, entidadId, datosEntidad, usuarioId, organizacionId) {
        // Usar query con organizacionId para que RLS funcione correctamente
        return await RLSContextManager.query(organizacionId, async (db) => {
            logger.info('[WorkflowEngine.evaluarRequiereAprobacion] Evaluando', {
                entidad_tipo: entidadTipo,
                entidad_id: entidadId,
                usuario_id: usuarioId,
                organizacion_id: organizacionId
            });

            // Obtener sucursal del usuario (prioridad: gerente, luego cualquier activa)
            const sucursalQuery = await db.query(
                `SELECT sucursal_id FROM usuarios_sucursales
                 WHERE usuario_id = $1 AND activo = true
                 ORDER BY es_gerente DESC
                 LIMIT 1`,
                [usuarioId]
            );
            const sucursalId = sucursalQuery.rows[0]?.sucursal_id || 1;

            // Buscar workflows activos para este tipo de entidad
            const workflowsQuery = await db.query(
                `SELECT id, codigo, nombre, condicion_activacion
                 FROM workflow_definiciones
                 WHERE organizacion_id = $1
                   AND entidad_tipo = $2
                   AND activo = true
                 ORDER BY id`,
                [organizacionId, entidadTipo]
            );

            if (workflowsQuery.rows.length === 0) {
                logger.info('[WorkflowEngine.evaluarRequiereAprobacion] No hay workflows configurados');
                return null;
            }

            // Evaluar cada workflow
            for (const workflow of workflowsQuery.rows) {
                const condicion = workflow.condicion_activacion;

                // Evaluar condición usando función SQL
                const evalQuery = await db.query(
                    `SELECT evaluar_condicion_workflow($1, $2, $3, $4) as resultado`,
                    [
                        JSON.stringify(condicion),
                        JSON.stringify(datosEntidad),
                        usuarioId,
                        sucursalId
                    ]
                );

                const resultado = evalQuery.rows[0]?.resultado;

                logger.info('[WorkflowEngine.evaluarRequiereAprobacion] Evaluación de condición', {
                    workflow_id: workflow.id,
                    workflow_codigo: workflow.codigo,
                    condicion,
                    datos_entidad: datosEntidad,
                    resultado
                });

                if (resultado === true) {
                    logger.info('[WorkflowEngine.evaluarRequiereAprobacion] Workflow aplicable encontrado', {
                        workflow_id: workflow.id,
                        workflow_nombre: workflow.nombre
                    });
                    return workflow;
                }
            }

            logger.info('[WorkflowEngine.evaluarRequiereAprobacion] Ningún workflow aplica');
            return null;
        });
    }

    /**
     * Inicia una instancia de workflow para una entidad
     *
     * @param {number} workflowId - ID del workflow a iniciar
     * @param {string} entidadTipo - Tipo de entidad (ej: 'orden_compra')
     * @param {number} entidadId - ID de la entidad
     * @param {object} datosContexto - Snapshot de datos para contexto
     * @param {number} usuarioId - Usuario que inicia
     * @param {number} organizacionId - ID de la organización
     * @param {object} dbExterno - Conexión de BD existente (opcional, para transacciones anidadas)
     * @returns {object} - Instancia creada
     *
     * @example
     * // Llamada independiente (crea su propia transacción)
     * await WorkflowEngine.iniciarWorkflow(wfId, 'orden_compra', 1, {}, userId, orgId);
     *
     * @example
     * // Llamada dentro de transacción existente (reutiliza conexión)
     * await RLSContextManager.transaction(orgId, async (db) => {
     *     await db.query('UPDATE ordenes_compra SET estado = $1 WHERE id = $2', ['pendiente', id]);
     *     await WorkflowEngine.iniciarWorkflow(wfId, 'orden_compra', id, {}, userId, orgId, db);
     * });
     */
    static async iniciarWorkflow(workflowId, entidadTipo, entidadId, datosContexto, usuarioId, organizacionId, dbExterno = null) {
        // Función que contiene la lógica real
        const ejecutar = async (db) => {
            logger.info('[WorkflowEngine.iniciarWorkflow] Iniciando workflow', {
                workflow_id: workflowId,
                entidad_tipo: entidadTipo,
                entidad_id: entidadId,
                usuario_id: usuarioId
            });

            // Obtener paso inicial
            const pasoInicialQuery = await db.query(
                `SELECT obtener_paso_inicial($1) as paso_id`,
                [workflowId]
            );

            const pasoInicialId = pasoInicialQuery.rows[0]?.paso_id;

            if (!pasoInicialId) {
                throw new Error('El workflow no tiene paso inicial configurado');
            }

            // Obtener siguiente paso (de inicio a aprobación)
            const siguientePasoQuery = await db.query(
                `SELECT obtener_siguiente_paso($1, 'siguiente') as paso_id`,
                [pasoInicialId]
            );

            const pasoAprobacionId = siguientePasoQuery.rows[0]?.paso_id;

            if (!pasoAprobacionId) {
                throw new Error('El workflow no tiene paso de aprobación configurado');
            }

            // Obtener config del paso de aprobación para timeout
            const pasoConfigQuery = await db.query(
                `SELECT config FROM workflow_pasos WHERE id = $1`,
                [pasoAprobacionId]
            );

            const pasoConfig = pasoConfigQuery.rows[0]?.config || {};
            const timeoutHoras = pasoConfig.timeout_horas || 72;

            // Crear instancia
            const instanciaQuery = `
                INSERT INTO workflow_instancias (
                    organizacion_id,
                    workflow_id,
                    entidad_tipo,
                    entidad_id,
                    paso_actual_id,
                    estado,
                    contexto,
                    iniciado_por,
                    fecha_limite
                ) VALUES (
                    $1, $2, $3, $4, $5, 'en_progreso', $6, $7,
                    NOW() + ($8 || ' hours')::INTERVAL
                )
                RETURNING *
            `;

            const instanciaResult = await db.query(instanciaQuery, [
                organizacionId,
                workflowId,
                entidadTipo,
                entidadId,
                pasoAprobacionId,
                JSON.stringify(datosContexto || {}),
                usuarioId,
                timeoutHoras
            ]);

            const instancia = instanciaResult.rows[0];

            // Registrar en historial: inicio
            await db.query(
                `INSERT INTO workflow_historial (
                    instancia_id, paso_id, accion, usuario_id, datos
                ) VALUES ($1, $2, 'iniciado', $3, $4)`,
                [
                    instancia.id,
                    pasoInicialId,
                    usuarioId,
                    JSON.stringify({
                        mensaje: 'Workflow iniciado',
                        paso_destino: pasoAprobacionId
                    })
                ]
            );

            logger.info('[WorkflowEngine.iniciarWorkflow] Workflow iniciado', {
                instancia_id: instancia.id,
                paso_actual: pasoAprobacionId
            });

            // Notificar a aprobadores
            await this._notificarAprobadores(instancia, organizacionId, db);

            return instancia;
        };

        // Si recibimos conexión externa, usarla (estamos dentro de transacción padre)
        // Si no, crear nuestra propia transacción
        if (dbExterno) {
            return await ejecutar(dbExterno);
        }
        return await RLSContextManager.transaction(organizacionId, ejecutar);
    }

    // ========================================================================
    // ACCIONES DE APROBACIÓN
    // ========================================================================

    /**
     * Aprobar una instancia de workflow
     */
    static async aprobar(instanciaId, usuarioId, comentario, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[WorkflowEngine.aprobar] Procesando aprobación', {
                instancia_id: instanciaId,
                usuario_id: usuarioId
            });

            // Verificar permisos
            const puedeAprobarQuery = await db.query(
                `SELECT puede_aprobar_workflow($1, $2) as puede`,
                [instanciaId, usuarioId]
            );

            if (!puedeAprobarQuery.rows[0]?.puede) {
                throw new Error('No tienes permiso para aprobar esta solicitud');
            }

            // Obtener instancia actual
            const instanciaQuery = await db.query(
                `SELECT wi.*, wp.config as paso_config
                 FROM workflow_instancias wi
                 JOIN workflow_pasos wp ON wp.id = wi.paso_actual_id
                 WHERE wi.id = $1 AND wi.estado = 'en_progreso'`,
                [instanciaId]
            );

            if (instanciaQuery.rows.length === 0) {
                throw new Error('Instancia no encontrada o ya fue procesada');
            }

            const instancia = instanciaQuery.rows[0];

            // Obtener siguiente paso (aprobar)
            const siguientePasoQuery = await db.query(
                `SELECT obtener_siguiente_paso($1, 'aprobar') as paso_id`,
                [instancia.paso_actual_id]
            );

            const siguientePasoId = siguientePasoQuery.rows[0]?.paso_id;

            // Verificar tipo del siguiente paso
            let nuevoEstado = 'en_progreso';
            let pasoFinalConfig = null;

            if (siguientePasoId) {
                const tipoPasoQuery = await db.query(
                    `SELECT tipo, config FROM workflow_pasos WHERE id = $1`,
                    [siguientePasoId]
                );

                if (tipoPasoQuery.rows[0]?.tipo === 'fin') {
                    nuevoEstado = 'aprobado';
                    pasoFinalConfig = tipoPasoQuery.rows[0].config;
                }
            } else {
                // Sin transición definida, marcar como aprobado
                nuevoEstado = 'aprobado';
            }

            // Actualizar instancia (actualizado_en se actualiza por trigger)
            // Nota: usar $5 separado para evitar error "inconsistent types" de PostgreSQL
            const updateQuery = `
                UPDATE workflow_instancias
                SET
                    paso_actual_id = COALESCE($1, paso_actual_id),
                    estado = $2,
                    resultado = $3,
                    completado_en = CASE WHEN $5 != 'en_progreso' THEN NOW() ELSE NULL END
                WHERE id = $4
                RETURNING *
            `;

            const resultado = await db.query(updateQuery, [
                siguientePasoId,
                nuevoEstado,
                JSON.stringify({ decision: 'aprobado', comentario, aprobado_por: usuarioId }),
                instanciaId,
                nuevoEstado  // $5 - duplicado para el CASE
            ]);

            // Registrar en historial
            await db.query(
                `INSERT INTO workflow_historial (
                    instancia_id, paso_id, accion, usuario_id, comentario, datos
                ) VALUES ($1, $2, 'aprobado', $3, $4, $5)`,
                [
                    instanciaId,
                    instancia.paso_actual_id,
                    usuarioId,
                    comentario,
                    JSON.stringify({ estado_anterior: 'en_progreso', estado_nuevo: nuevoEstado })
                ]
            );

            logger.info('[WorkflowEngine.aprobar] Aprobación procesada', {
                instancia_id: instanciaId,
                nuevo_estado: nuevoEstado
            });

            // Si se completó, ejecutar acción final
            if (nuevoEstado === 'aprobado' && pasoFinalConfig) {
                await this._ejecutarAccionFinal(instancia, pasoFinalConfig, db);
            }

            // Si sigue en progreso y hay siguiente paso, notificar a nuevos aprobadores (multi-nivel)
            if (nuevoEstado === 'en_progreso' && siguientePasoId) {
                const instanciaActualizada = resultado.rows[0];
                logger.info('[WorkflowEngine.aprobar] Avanzando a siguiente nivel de aprobación', {
                    instancia_id: instanciaId,
                    paso_anterior: instancia.paso_actual_id,
                    paso_nuevo: siguientePasoId
                });
                await this._notificarAprobadores(instanciaActualizada, organizacionId, db);
            }

            // Notificar al solicitante
            await this._notificarSolicitante(instancia, 'aprobado', usuarioId, comentario, organizacionId);

            return resultado.rows[0];
        });
    }

    /**
     * Rechazar una instancia de workflow
     */
    static async rechazar(instanciaId, usuarioId, motivo, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[WorkflowEngine.rechazar] Procesando rechazo', {
                instancia_id: instanciaId,
                usuario_id: usuarioId
            });

            // Verificar permisos
            const puedeAprobarQuery = await db.query(
                `SELECT puede_aprobar_workflow($1, $2) as puede`,
                [instanciaId, usuarioId]
            );

            if (!puedeAprobarQuery.rows[0]?.puede) {
                throw new Error('No tienes permiso para rechazar esta solicitud');
            }

            // Obtener instancia actual
            const instanciaQuery = await db.query(
                `SELECT * FROM workflow_instancias
                 WHERE id = $1 AND estado = 'en_progreso'`,
                [instanciaId]
            );

            if (instanciaQuery.rows.length === 0) {
                throw new Error('Instancia no encontrada o ya fue procesada');
            }

            const instancia = instanciaQuery.rows[0];

            // Actualizar instancia (actualizado_en se actualiza por trigger)
            const updateQuery = `
                UPDATE workflow_instancias
                SET
                    estado = 'rechazado',
                    resultado = $1,
                    completado_en = NOW()
                WHERE id = $2
                RETURNING *
            `;

            const resultado = await db.query(updateQuery, [
                JSON.stringify({ decision: 'rechazado', motivo, rechazado_por: usuarioId }),
                instanciaId
            ]);

            // Registrar en historial
            await db.query(
                `INSERT INTO workflow_historial (
                    instancia_id, paso_id, accion, usuario_id, comentario, datos
                ) VALUES ($1, $2, 'rechazado', $3, $4, $5)`,
                [
                    instanciaId,
                    instancia.paso_actual_id,
                    usuarioId,
                    motivo,
                    JSON.stringify({ estado_anterior: 'en_progreso', estado_nuevo: 'rechazado' })
                ]
            );

            // Revertir estado de la entidad
            await this._revertirEntidad(instancia, db);

            logger.info('[WorkflowEngine.rechazar] Rechazo procesado', {
                instancia_id: instanciaId
            });

            // Notificar al solicitante
            await this._notificarSolicitante(instancia, 'rechazado', usuarioId, motivo, organizacionId);

            return resultado.rows[0];
        });
    }

    // ========================================================================
    // MÉTODOS PRIVADOS
    // ========================================================================

    /**
     * Notificar a los aprobadores de una nueva solicitud
     */
    static async _notificarAprobadores(instancia, organizacionId, db) {
        try {
            // Obtener configuración del paso para verificar si es tipo supervisor
            const pasoConfigQuery = await db.query(
                `SELECT config FROM workflow_pasos WHERE id = $1`,
                [instancia.paso_actual_id]
            );

            const pasoConfig = pasoConfigQuery.rows[0]?.config || {};
            const esTipoSupervisor = pasoConfig.aprobadores_tipo === 'supervisor';

            // Obtener aprobadores del paso actual
            // Para tipo supervisor, pasamos iniciado_por como tercer parámetro
            const aprobadoresQuery = await db.query(
                `SELECT * FROM obtener_aprobadores_paso($1, $2, $3)`,
                [instancia.paso_actual_id, organizacionId, esTipoSupervisor ? instancia.iniciado_por : null]
            );

            let aprobadores = aprobadoresQuery.rows;

            // Si es tipo supervisor y no hay aprobadores, usar fallback_rol
            if (aprobadores.length === 0 && esTipoSupervisor) {
                const fallbackRol = pasoConfig.supervisor_config?.fallback_rol;

                if (fallbackRol) {
                    logger.info('[WorkflowEngine._notificarAprobadores] Usando fallback_rol', {
                        instancia_id: instancia.id,
                        fallback_rol: fallbackRol
                    });

                    // Obtener usuarios con el rol de fallback (Ene 2026: JOIN con tabla roles)
                    const fallbackQuery = await db.query(
                        `SELECT u.id as usuario_id, COALESCE(u.nombre, u.email) as nombre, u.email, FALSE as es_delegado
                         FROM usuarios u
                         JOIN roles r ON u.rol_id = r.id
                         WHERE u.organizacion_id = $1
                           AND u.activo = true
                           AND r.codigo = $2`,
                        [organizacionId, fallbackRol]
                    );
                    aprobadores = fallbackQuery.rows;
                } else {
                    logger.error('[WorkflowEngine._notificarAprobadores] El usuario no tiene supervisor y no hay fallback_rol configurado', {
                        instancia_id: instancia.id,
                        iniciado_por: instancia.iniciado_por
                    });
                }
            }

            if (aprobadores.length === 0) {
                logger.warn('[WorkflowEngine._notificarAprobadores] Sin aprobadores configurados', {
                    instancia_id: instancia.id,
                    paso_id: instancia.paso_actual_id
                });
                return;
            }

            // Obtener datos de la entidad para el mensaje
            let tituloEntidad = `Solicitud #${instancia.entidad_id}`;
            let montoEntidad = '';

            if (instancia.entidad_tipo === 'orden_compra') {
                const ocQuery = await db.query(
                    `SELECT folio, total FROM ordenes_compra WHERE id = $1`,
                    [instancia.entidad_id]
                );
                if (ocQuery.rows.length > 0) {
                    tituloEntidad = `Orden de Compra ${ocQuery.rows[0].folio}`;
                    montoEntidad = ` por $${parseFloat(ocQuery.rows[0].total).toLocaleString('es-MX')}`;
                }
            }

            // Crear notificaciones
            const usuarioIds = aprobadores.map(a => a.usuario_id);

            await notificacionAdapter.crearMasiva({
                organizacionId,
                usuarioIds,
                tipo: 'aprobacion_pendiente',
                categoria: 'sistema',
                titulo: 'Nueva solicitud de aprobación',
                mensaje: `${tituloEntidad}${montoEntidad} requiere tu aprobación`,
                nivel: 'warning',
                icono: 'check-circle',
                accionUrl: `/aprobaciones/${instancia.id}`
            });

            logger.info('[WorkflowEngine._notificarAprobadores] Notificaciones enviadas', {
                instancia_id: instancia.id,
                total_aprobadores: aprobadores.length
            });

        } catch (error) {
            logger.error('[WorkflowEngine._notificarAprobadores] Error al notificar', {
                error: error.message,
                instancia_id: instancia.id
            });
        }
    }

    /**
     * Notificar al solicitante sobre el resultado
     */
    static async _notificarSolicitante(instancia, resultado, aprobadorId, comentario, organizacionId) {
        try {
            if (!instancia.iniciado_por) return;

            // Obtener nombre del aprobador
            const aprobadorQuery = await RLSContextManager.withBypass(async (db) => {
                return await db.query(
                    `SELECT nombre FROM usuarios WHERE id = $1`,
                    [aprobadorId]
                );
            });
            const nombreAprobador = aprobadorQuery.rows[0]?.nombre || 'Un administrador';

            // Obtener datos de la entidad
            let tituloEntidad = `Solicitud #${instancia.entidad_id}`;

            if (instancia.entidad_tipo === 'orden_compra') {
                const ocQuery = await RLSContextManager.withBypass(async (db) => {
                    return await db.query(
                        `SELECT folio FROM ordenes_compra WHERE id = $1`,
                        [instancia.entidad_id]
                    );
                });
                if (ocQuery.rows.length > 0) {
                    tituloEntidad = `Orden de Compra ${ocQuery.rows[0].folio}`;
                }
            }

            const esAprobado = resultado === 'aprobado';

            await notificacionAdapter.crear({
                organizacionId,
                usuarioId: instancia.iniciado_por,
                tipo: esAprobado ? 'aprobacion_completada' : 'aprobacion_rechazada',
                categoria: 'sistema',
                titulo: esAprobado ? 'Solicitud aprobada' : 'Solicitud rechazada',
                mensaje: `${tituloEntidad} fue ${esAprobado ? 'aprobada' : 'rechazada'} por ${nombreAprobador}${comentario ? `: "${comentario}"` : ''}`,
                nivel: esAprobado ? 'success' : 'error',
                icono: esAprobado ? 'check-circle' : 'x-circle',
                accionUrl: instancia.entidad_tipo === 'orden_compra'
                    ? `/inventario/ordenes-compra/${instancia.entidad_id}`
                    : null,
                entidadTipo: instancia.entidad_tipo,
                entidadId: instancia.entidad_id
            });

        } catch (error) {
            logger.error('[WorkflowEngine._notificarSolicitante] Error al notificar', {
                error: error.message,
                instancia_id: instancia.id
            });
        }
    }

    /**
     * Ejecutar acción final del workflow (ej: cambiar estado de entidad)
     */
    static async _ejecutarAccionFinal(instancia, pasoConfig, db) {
        try {
            const accion = pasoConfig.accion;

            if (accion === 'cambiar_estado' && pasoConfig.estado_nuevo) {
                if (instancia.entidad_tipo === 'orden_compra') {
                    await db.query(
                        `UPDATE ordenes_compra
                         SET estado = $1, enviada_en = NOW(), actualizado_en = NOW()
                         WHERE id = $2`,
                        [pasoConfig.estado_nuevo, instancia.entidad_id]
                    );

                    logger.info('[WorkflowEngine._ejecutarAccionFinal] Estado de OC actualizado', {
                        orden_id: instancia.entidad_id,
                        nuevo_estado: pasoConfig.estado_nuevo
                    });
                }
            }
        } catch (error) {
            logger.error('[WorkflowEngine._ejecutarAccionFinal] Error', {
                error: error.message,
                instancia_id: instancia.id
            });
            throw error;
        }
    }

    /**
     * Revertir entidad cuando se rechaza el workflow
     */
    static async _revertirEntidad(instancia, db) {
        try {
            if (instancia.entidad_tipo === 'orden_compra') {
                // Volver a estado borrador
                await db.query(
                    `UPDATE ordenes_compra
                     SET estado = 'borrador', actualizado_en = NOW()
                     WHERE id = $1`,
                    [instancia.entidad_id]
                );

                logger.info('[WorkflowEngine._revertirEntidad] OC revertida a borrador', {
                    orden_id: instancia.entidad_id
                });
            }
        } catch (error) {
            logger.error('[WorkflowEngine._revertirEntidad] Error', {
                error: error.message,
                instancia_id: instancia.id
            });
        }
    }
}

module.exports = WorkflowEngine;
