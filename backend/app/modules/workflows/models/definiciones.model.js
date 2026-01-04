/**
 * ====================================================================
 * MODEL - WORKFLOW DEFINICIONES
 * ====================================================================
 *
 * Operaciones CRUD para definiciones de workflows.
 * Incluye gestión de pasos y transiciones en transacciones atómicas.
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const logger = require('../../../utils/logger');

class WorkflowDefinicionesModel {

    // ========================================================================
    // CREAR WORKFLOW
    // ========================================================================

    /**
     * Crear nueva definición de workflow con pasos y transiciones
     */
    static async crear(data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[WorkflowDefinicionesModel.crear] Iniciando creación', {
                codigo: data.codigo,
                entidad_tipo: data.entidad_tipo,
                total_pasos: data.pasos?.length,
                total_transiciones: data.transiciones?.length
            });

            // Verificar que no exista un workflow con el mismo código
            const existeQuery = await db.query(
                `SELECT id FROM workflow_definiciones
                 WHERE organizacion_id = $1 AND codigo = $2`,
                [organizacionId, data.codigo]
            );

            if (existeQuery.rows.length > 0) {
                throw new Error(`Ya existe un workflow con el código "${data.codigo}"`);
            }

            // 1. Crear definición
            const defQuery = `
                INSERT INTO workflow_definiciones (
                    organizacion_id,
                    codigo,
                    nombre,
                    descripcion,
                    entidad_tipo,
                    condicion_activacion,
                    prioridad,
                    activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const defResult = await db.query(defQuery, [
                organizacionId,
                data.codigo,
                data.nombre,
                data.descripcion || null,
                data.entidad_tipo,
                data.condicion_activacion ? JSON.stringify(data.condicion_activacion) : null,
                data.prioridad || 0,
                data.activo || false
            ]);

            const workflow = defResult.rows[0];
            const workflowId = workflow.id;

            // Mapa para relacionar código de paso con ID generado
            const pasoIdsPorCodigo = {};

            // 2. Crear pasos
            for (const paso of data.pasos) {
                // Combinar config con posiciones visuales
                const configCompleto = {
                    ...(paso.config || {}),
                    _visual: {
                        posicion_x: paso.posicion_x || 0,
                        posicion_y: paso.posicion_y || 0
                    }
                };

                const pasoQuery = `
                    INSERT INTO workflow_pasos (
                        workflow_id,
                        codigo,
                        nombre,
                        descripcion,
                        tipo,
                        config,
                        orden
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id, codigo
                `;

                const pasoResult = await db.query(pasoQuery, [
                    workflowId,
                    paso.codigo,
                    paso.nombre,
                    paso.descripcion || null,
                    paso.tipo,
                    JSON.stringify(configCompleto),
                    paso.orden
                ]);

                pasoIdsPorCodigo[paso.codigo] = pasoResult.rows[0].id;
            }

            // 3. Crear transiciones (usando los IDs reales)
            for (const trans of data.transiciones) {
                const origenId = pasoIdsPorCodigo[trans.paso_origen_codigo];
                const destinoId = pasoIdsPorCodigo[trans.paso_destino_codigo];

                if (!origenId || !destinoId) {
                    throw new Error(
                        `Transición inválida: paso origen "${trans.paso_origen_codigo}" o destino "${trans.paso_destino_codigo}" no existe`
                    );
                }

                const transQuery = `
                    INSERT INTO workflow_transiciones (
                        workflow_id,
                        paso_origen_id,
                        paso_destino_id,
                        etiqueta,
                        condicion,
                        orden
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `;

                await db.query(transQuery, [
                    workflowId,
                    origenId,
                    destinoId,
                    trans.etiqueta,
                    trans.condicion ? JSON.stringify(trans.condicion) : null,
                    trans.orden
                ]);
            }

            logger.info('[WorkflowDefinicionesModel.crear] Workflow creado exitosamente', {
                workflow_id: workflowId,
                pasos_creados: Object.keys(pasoIdsPorCodigo).length
            });

            // Retornar workflow completo
            return await this.obtenerPorId(workflowId, organizacionId);
        });
    }

    // ========================================================================
    // ACTUALIZAR WORKFLOW
    // ========================================================================

    /**
     * Actualizar definición de workflow
     */
    static async actualizar(id, data, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[WorkflowDefinicionesModel.actualizar] Iniciando', {
                workflow_id: id
            });

            // Verificar que existe y está en borrador
            const checkQuery = await db.query(
                `SELECT id, activo FROM workflow_definiciones
                 WHERE id = $1 AND organizacion_id = $2`,
                [id, organizacionId]
            );

            if (checkQuery.rows.length === 0) {
                throw new Error('Workflow no encontrado');
            }

            if (checkQuery.rows[0].activo) {
                throw new Error('No se puede editar un workflow publicado. Despublícalo primero.');
            }

            // Actualizar campos básicos de la definición
            const updates = [];
            const values = [];
            let paramCounter = 1;

            if (data.nombre !== undefined) {
                updates.push(`nombre = $${paramCounter}`);
                values.push(data.nombre);
                paramCounter++;
            }

            if (data.descripcion !== undefined) {
                updates.push(`descripcion = $${paramCounter}`);
                values.push(data.descripcion);
                paramCounter++;
            }

            if (data.condicion_activacion !== undefined) {
                updates.push(`condicion_activacion = $${paramCounter}`);
                values.push(data.condicion_activacion ? JSON.stringify(data.condicion_activacion) : null);
                paramCounter++;
            }

            if (data.prioridad !== undefined) {
                updates.push(`prioridad = $${paramCounter}`);
                values.push(data.prioridad);
                paramCounter++;
            }

            if (updates.length > 0) {
                updates.push(`actualizado_en = NOW()`);
                values.push(id);

                const updateQuery = `
                    UPDATE workflow_definiciones
                    SET ${updates.join(', ')}
                    WHERE id = $${paramCounter}
                `;

                await db.query(updateQuery, values);
            }

            // Si vienen pasos y transiciones, reemplazar
            if (data.pasos && data.transiciones) {
                // Eliminar transiciones existentes
                await db.query(
                    'DELETE FROM workflow_transiciones WHERE workflow_id = $1',
                    [id]
                );

                // Eliminar pasos existentes
                await db.query(
                    'DELETE FROM workflow_pasos WHERE workflow_id = $1',
                    [id]
                );

                // Crear nuevos pasos
                const pasoIdsPorCodigo = {};

                for (const paso of data.pasos) {
                    // Combinar config con posiciones visuales
                    const configCompleto = {
                        ...(paso.config || {}),
                        _visual: {
                            posicion_x: paso.posicion_x || 0,
                            posicion_y: paso.posicion_y || 0
                        }
                    };

                    const pasoQuery = `
                        INSERT INTO workflow_pasos (
                            workflow_id,
                            codigo,
                            nombre,
                            descripcion,
                            tipo,
                            config,
                            orden
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING id, codigo
                    `;

                    const pasoResult = await db.query(pasoQuery, [
                        id,
                        paso.codigo,
                        paso.nombre,
                        paso.descripcion || null,
                        paso.tipo,
                        JSON.stringify(configCompleto),
                        paso.orden
                    ]);

                    pasoIdsPorCodigo[paso.codigo] = pasoResult.rows[0].id;
                }

                // Crear nuevas transiciones
                for (const trans of data.transiciones) {
                    const origenId = pasoIdsPorCodigo[trans.paso_origen_codigo];
                    const destinoId = pasoIdsPorCodigo[trans.paso_destino_codigo];

                    if (!origenId || !destinoId) {
                        throw new Error(
                            `Transición inválida: paso "${trans.paso_origen_codigo}" → "${trans.paso_destino_codigo}"`
                        );
                    }

                    await db.query(`
                        INSERT INTO workflow_transiciones (
                            workflow_id,
                            paso_origen_id,
                            paso_destino_id,
                            etiqueta,
                            condicion,
                            orden
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        id,
                        origenId,
                        destinoId,
                        trans.etiqueta,
                        trans.condicion ? JSON.stringify(trans.condicion) : null,
                        trans.orden
                    ]);
                }
            }

            logger.info('[WorkflowDefinicionesModel.actualizar] Completado', { workflow_id: id });

            return await this.obtenerPorId(id, organizacionId);
        });
    }

    // ========================================================================
    // ELIMINAR WORKFLOW
    // ========================================================================

    /**
     * Eliminar workflow (solo si no tiene instancias activas)
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[WorkflowDefinicionesModel.eliminar] Iniciando', { workflow_id: id });

            // Verificar existencia
            const checkQuery = await db.query(
                `SELECT id, codigo, nombre FROM workflow_definiciones
                 WHERE id = $1 AND organizacion_id = $2`,
                [id, organizacionId]
            );

            if (checkQuery.rows.length === 0) {
                throw new Error('Workflow no encontrado');
            }

            const workflow = checkQuery.rows[0];

            // Verificar que no tenga instancias en progreso
            const instanciasQuery = await db.query(
                `SELECT COUNT(*) as total FROM workflow_instancias
                 WHERE workflow_id = $1 AND estado = 'en_progreso'`,
                [id]
            );

            if (parseInt(instanciasQuery.rows[0].total) > 0) {
                throw new Error('No se puede eliminar: hay instancias en progreso');
            }

            // Eliminar en cascada: transiciones → pasos → definición
            await db.query('DELETE FROM workflow_transiciones WHERE workflow_id = $1', [id]);
            await db.query('DELETE FROM workflow_pasos WHERE workflow_id = $1', [id]);
            await db.query('DELETE FROM workflow_definiciones WHERE id = $1', [id]);

            logger.info('[WorkflowDefinicionesModel.eliminar] Workflow eliminado', {
                workflow_id: id,
                codigo: workflow.codigo
            });

            return workflow;
        });
    }

    // ========================================================================
    // DUPLICAR WORKFLOW
    // ========================================================================

    /**
     * Duplicar un workflow existente
     */
    static async duplicar(id, nuevoCodigo, nuevoNombre, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[WorkflowDefinicionesModel.duplicar] Iniciando', { workflow_id: id });

            // Obtener workflow original
            const original = await this.obtenerPorId(id, organizacionId);

            if (!original) {
                throw new Error('Workflow no encontrado');
            }

            // Generar código y nombre si no se proporcionan
            const codigo = nuevoCodigo || `${original.codigo}_copia`;
            const nombre = nuevoNombre || `${original.nombre} (copia)`;

            // Verificar que el nuevo código no exista
            const existeQuery = await db.query(
                `SELECT id FROM workflow_definiciones
                 WHERE organizacion_id = $1 AND codigo = $2`,
                [organizacionId, codigo]
            );

            if (existeQuery.rows.length > 0) {
                throw new Error(`Ya existe un workflow con el código "${codigo}"`);
            }

            // Preparar datos para crear
            const datosNuevo = {
                codigo,
                nombre,
                descripcion: original.descripcion,
                entidad_tipo: original.entidad_tipo,
                condicion_activacion: original.condicion_activacion,
                prioridad: original.prioridad,
                activo: false,  // Siempre inicia como borrador
                pasos: original.pasos.map(p => {
                    // Extraer posiciones del campo config._visual
                    const visual = p.config?._visual || {};
                    const { _visual, ...configSinVisual } = p.config || {};
                    return {
                        codigo: p.codigo,
                        nombre: p.nombre,
                        descripcion: p.descripcion,
                        tipo: p.tipo,
                        config: configSinVisual,
                        orden: p.orden,
                        posicion_x: visual.posicion_x || 0,
                        posicion_y: visual.posicion_y || 0
                    };
                }),
                transiciones: original.transiciones.map(t => ({
                    paso_origen_codigo: original.pasos.find(p => p.id === t.paso_origen_id)?.codigo,
                    paso_destino_codigo: original.pasos.find(p => p.id === t.paso_destino_id)?.codigo,
                    etiqueta: t.etiqueta,
                    condicion: t.condicion,
                    orden: t.orden
                }))
            };

            // Crear el duplicado usando el método crear
            return await this.crear(datosNuevo, organizacionId);
        });
    }

    // ========================================================================
    // PUBLICAR / DESPUBLICAR
    // ========================================================================

    /**
     * Cambiar estado de publicación
     */
    static async cambiarEstadoPublicacion(id, activo, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            logger.info('[WorkflowDefinicionesModel.cambiarEstadoPublicacion]', {
                workflow_id: id,
                activo
            });

            // Verificar existencia
            const checkQuery = await db.query(
                `SELECT id, activo, entidad_tipo FROM workflow_definiciones
                 WHERE id = $1 AND organizacion_id = $2`,
                [id, organizacionId]
            );

            if (checkQuery.rows.length === 0) {
                throw new Error('Workflow no encontrado');
            }

            const workflow = checkQuery.rows[0];

            if (workflow.activo === activo) {
                throw new Error(`El workflow ya está ${activo ? 'publicado' : 'despublicado'}`);
            }

            // Si se va a publicar, validar que tenga estructura correcta
            if (activo) {
                const validacion = await this.validarEstructura(id, organizacionId);
                if (!validacion.valido) {
                    throw new Error(`No se puede publicar: ${validacion.errores.join(', ')}`);
                }
            }

            // Actualizar estado
            await db.query(
                `UPDATE workflow_definiciones
                 SET activo = $1, actualizado_en = NOW()
                 WHERE id = $2`,
                [activo, id]
            );

            logger.info('[WorkflowDefinicionesModel.cambiarEstadoPublicacion] Completado', {
                workflow_id: id,
                activo
            });

            return await this.obtenerPorId(id, organizacionId);
        });
    }

    // ========================================================================
    // VALIDACIÓN
    // ========================================================================

    /**
     * Validar estructura del workflow
     */
    static async validarEstructura(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const errores = [];

            // Obtener pasos
            const pasosResult = await db.query(
                'SELECT * FROM workflow_pasos WHERE workflow_id = $1 ORDER BY orden',
                [id]
            );
            const pasos = pasosResult.rows;

            // Obtener transiciones
            const transResult = await db.query(
                'SELECT * FROM workflow_transiciones WHERE workflow_id = $1',
                [id]
            );
            const transiciones = transResult.rows;

            // 1. Debe tener exactamente 1 nodo inicio
            const nodosInicio = pasos.filter(p => p.tipo === 'inicio');
            if (nodosInicio.length === 0) {
                errores.push('Falta nodo de inicio');
            } else if (nodosInicio.length > 1) {
                errores.push('Solo puede haber un nodo de inicio');
            }

            // 2. Debe tener al menos 1 nodo fin
            const nodosFin = pasos.filter(p => p.tipo === 'fin');
            if (nodosFin.length === 0) {
                errores.push('Falta al menos un nodo de fin');
            }

            // 3. Todos los nodos deben estar conectados
            const nodosConectados = new Set();
            transiciones.forEach(t => {
                nodosConectados.add(t.paso_origen_id);
                nodosConectados.add(t.paso_destino_id);
            });

            const nodosHuerfanos = pasos.filter(p => !nodosConectados.has(p.id));
            if (nodosHuerfanos.length > 0) {
                errores.push(`Nodos sin conexión: ${nodosHuerfanos.map(n => n.nombre).join(', ')}`);
            }

            // 4. Nodos condición deben tener exactamente 2 salidas (sí/no)
            const nodosCondicion = pasos.filter(p => p.tipo === 'condicion');
            for (const nodo of nodosCondicion) {
                const salidasCondicion = transiciones.filter(t => t.paso_origen_id === nodo.id);
                if (salidasCondicion.length !== 2) {
                    errores.push(`Nodo condición "${nodo.nombre}" debe tener exactamente 2 salidas`);
                }
            }

            // 5. Nodos aprobación deben tener config de aprobadores
            const nodosAprobacion = pasos.filter(p => p.tipo === 'aprobacion');
            for (const nodo of nodosAprobacion) {
                const config = nodo.config || {};
                if (!config.aprobadores || config.aprobadores.length === 0) {
                    errores.push(`Nodo "${nodo.nombre}" no tiene aprobadores configurados`);
                }
            }

            return {
                valido: errores.length === 0,
                errores,
                estadisticas: {
                    total_pasos: pasos.length,
                    total_transiciones: transiciones.length,
                    nodos_inicio: nodosInicio.length,
                    nodos_fin: nodosFin.length,
                    nodos_aprobacion: nodosAprobacion.length,
                    nodos_condicion: nodosCondicion.length
                }
            };
        });
    }

    // ========================================================================
    // CONSULTAS
    // ========================================================================

    /**
     * Obtener workflow por ID con pasos y transiciones
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener definición
            const defQuery = `
                SELECT * FROM workflow_definiciones
                WHERE id = $1 AND organizacion_id = $2
            `;

            const defResult = await db.query(defQuery, [id, organizacionId]);

            if (defResult.rows.length === 0) {
                return null;
            }

            const definicion = defResult.rows[0];

            // Obtener pasos
            const pasosQuery = `
                SELECT * FROM workflow_pasos
                WHERE workflow_id = $1
                ORDER BY orden
            `;

            const pasosResult = await db.query(pasosQuery, [id]);

            // Obtener transiciones
            const transicionesQuery = `
                SELECT
                    wt.*,
                    wp_origen.codigo AS paso_origen_codigo,
                    wp_origen.nombre AS paso_origen_nombre,
                    wp_destino.codigo AS paso_destino_codigo,
                    wp_destino.nombre AS paso_destino_nombre
                FROM workflow_transiciones wt
                JOIN workflow_pasos wp_origen ON wp_origen.id = wt.paso_origen_id
                JOIN workflow_pasos wp_destino ON wp_destino.id = wt.paso_destino_id
                WHERE wt.workflow_id = $1
                ORDER BY wt.orden
            `;

            const transicionesResult = await db.query(transicionesQuery, [id]);

            return {
                ...definicion,
                pasos: pasosResult.rows,
                transiciones: transicionesResult.rows
            };
        });
    }

    /**
     * Listar workflows con estadísticas
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let whereConditions = ['wd.organizacion_id = $1'];
            let values = [organizacionId];
            let paramCounter = 2;

            if (filtros.entidad_tipo) {
                whereConditions.push(`wd.entidad_tipo = $${paramCounter}`);
                values.push(filtros.entidad_tipo);
                paramCounter++;
            }

            if (filtros.activo !== undefined) {
                whereConditions.push(`wd.activo = $${paramCounter}`);
                values.push(filtros.activo);
                paramCounter++;
            }

            if (filtros.busqueda) {
                whereConditions.push(`(wd.nombre ILIKE $${paramCounter} OR wd.codigo ILIKE $${paramCounter})`);
                values.push(`%${filtros.busqueda}%`);
                paramCounter++;
            }

            const query = `
                SELECT
                    wd.*,
                    (SELECT COUNT(*) FROM workflow_pasos WHERE workflow_id = wd.id) AS total_pasos,
                    (SELECT COUNT(*) FROM workflow_transiciones WHERE workflow_id = wd.id) AS total_transiciones,
                    (SELECT COUNT(*) FROM workflow_instancias WHERE workflow_id = wd.id AND estado = 'en_progreso') AS instancias_activas,
                    (SELECT COUNT(*) FROM workflow_instancias WHERE workflow_id = wd.id) AS total_instancias
                FROM workflow_definiciones wd
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY wd.entidad_tipo, wd.activo DESC, wd.prioridad DESC, wd.nombre
            `;

            const result = await db.query(query, values);
            return result.rows;
        });
    }
}

module.exports = WorkflowDefinicionesModel;
