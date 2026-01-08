/**
 * IncapacidadesModel - Enero 2026
 * Gestión de incapacidades médicas con integración a bloqueos
 * Módulo de Profesionales - Gap vs Odoo 19
 */
const RLSContextManager = require('../../../utils/rlsContextManager');
const {
    TIPOS_INCAPACIDAD_CONFIG,
    ESTADOS_INCAPACIDAD,
    ERRORES_INCAPACIDAD,
    DEFAULTS,
    PAGINACION,
} = require('../constants/incapacidades.constants');

class IncapacidadesModel {

    /**
     * Crea una nueva incapacidad y genera el bloqueo automáticamente
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {Object} data - Datos de la incapacidad
     * @param {number} usuarioId - ID del usuario que registra
     * @returns {Promise<Object>} Incapacidad creada con bloqueo
     */
    static async crear(organizacionId, profesionalId, data, usuarioId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const {
                folio_imss,
                tipo_incapacidad,
                fecha_inicio,
                fecha_fin,
                dias_autorizados,
                documento_url,
                documento_nombre,
                medico_nombre,
                unidad_medica,
                diagnostico,
                incapacidad_origen_id,
                es_prorroga,
                notas_internas,
            } = data;

            // 1. Validar que el profesional exista
            const profesionalQuery = await db.query(
                `SELECT id, nombre_completo, estado FROM profesionales
                 WHERE id = $1 AND organizacion_id = $2`,
                [profesionalId, organizacionId]
            );

            if (profesionalQuery.rows.length === 0) {
                throw new Error(ERRORES_INCAPACIDAD.PROFESIONAL_NO_ENCONTRADO);
            }

            const profesional = profesionalQuery.rows[0];

            // 2. Validar folio IMSS único
            const folioQuery = await db.query(
                `SELECT id FROM incapacidades
                 WHERE organizacion_id = $1 AND folio_imss = $2`,
                [organizacionId, folio_imss]
            );

            if (folioQuery.rows.length > 0) {
                throw new Error(ERRORES_INCAPACIDAD.FOLIO_DUPLICADO);
            }

            // 3. Verificar solapamiento con otra incapacidad activa
            const solapamientoQuery = await db.query(
                `SELECT verificar_solapamiento_incapacidad($1, $2, $3, $4) as hay_solapamiento`,
                [organizacionId, profesionalId, fecha_inicio, fecha_fin]
            );

            if (solapamientoQuery.rows[0].hay_solapamiento) {
                throw new Error(ERRORES_INCAPACIDAD.SOLAPAMIENTO);
            }

            // 4. Si es prórroga, validar incapacidad origen
            if (es_prorroga && incapacidad_origen_id) {
                const origenQuery = await db.query(
                    `SELECT id, estado FROM incapacidades
                     WHERE id = $1 AND organizacion_id = $2`,
                    [incapacidad_origen_id, organizacionId]
                );

                if (origenQuery.rows.length === 0) {
                    throw new Error(ERRORES_INCAPACIDAD.PRORROGA_SIN_ORIGEN);
                }

                // La incapacidad origen puede estar activa o finalizada
            }

            // 5. Obtener configuración del tipo de incapacidad
            const tipoConfig = TIPOS_INCAPACIDAD_CONFIG[tipo_incapacidad];
            const porcentajePago = tipoConfig?.porcentajePago || null;
            const diaInicioPago = tipoConfig?.diaInicioPago || null;

            // 6. Obtener tipo de bloqueo 'incapacidad'
            const tipoBloqueoQuery = await db.query(
                `SELECT id FROM tipos_bloqueo
                 WHERE codigo = $1 AND (organizacion_id IS NULL OR organizacion_id = $2)
                 LIMIT 1`,
                [DEFAULTS.CODIGO_TIPO_BLOQUEO, organizacionId]
            );

            let tipoBloqueoId = tipoBloqueoQuery.rows[0]?.id;

            // Si no existe, crearlo
            if (!tipoBloqueoId) {
                const crearTipoQuery = await db.query(
                    `INSERT INTO tipos_bloqueo (
                        organizacion_id, codigo, nombre, descripcion, color, icono,
                        es_sistema, permite_todo_el_dia, permite_horario_especifico
                    ) VALUES (
                        NULL, 'incapacidad', 'Incapacidad Médica',
                        'Incapacidad médica IMSS', '#DC2626', 'HeartPulse',
                        true, true, false
                    )
                    ON CONFLICT DO NOTHING
                    RETURNING id`,
                    []
                );

                if (crearTipoQuery.rows.length > 0) {
                    tipoBloqueoId = crearTipoQuery.rows[0].id;
                } else {
                    // Intentar obtener de nuevo
                    const retryQuery = await db.query(
                        `SELECT id FROM tipos_bloqueo WHERE codigo = 'incapacidad' LIMIT 1`
                    );
                    tipoBloqueoId = retryQuery.rows[0]?.id;
                }

                if (!tipoBloqueoId) {
                    throw new Error(ERRORES_INCAPACIDAD.TIPO_BLOQUEO_NO_ENCONTRADO);
                }
            }

            // 7. Crear bloqueo en bloqueos_horarios
            const tituloBloqueo = `Incapacidad - ${profesional.nombre_completo}`;
            const descripcionBloqueo = `${tipoConfig?.label || tipo_incapacidad}: Folio IMSS ${folio_imss}`;

            const bloqueoQuery = await db.query(
                `INSERT INTO bloqueos_horarios (
                    organizacion_id, profesional_id, tipo_bloqueo_id,
                    titulo, descripcion,
                    fecha_inicio, fecha_fin,
                    hora_inicio, hora_fin,
                    auto_generado, origen_bloqueo,
                    creado_por
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL, true, $8, $9)
                RETURNING id`,
                [
                    organizacionId,
                    profesionalId,
                    tipoBloqueoId,
                    tituloBloqueo,
                    descripcionBloqueo,
                    fecha_inicio,
                    fecha_fin,
                    DEFAULTS.ORIGEN_BLOQUEO,
                    usuarioId,
                ]
            );

            const bloqueoId = bloqueoQuery.rows[0].id;

            // 8. Crear registro de incapacidad
            const insertQuery = `
                INSERT INTO incapacidades (
                    organizacion_id, profesional_id,
                    folio_imss, tipo_incapacidad,
                    fecha_inicio, fecha_fin, dias_autorizados,
                    documento_url, documento_nombre,
                    medico_nombre, unidad_medica, diagnostico,
                    bloqueo_id,
                    porcentaje_pago, dia_inicio_pago,
                    incapacidad_origen_id, es_prorroga,
                    notas_internas,
                    estado, creado_por
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
                )
                RETURNING *
            `;

            const incapacidadResult = await db.query(insertQuery, [
                organizacionId,
                profesionalId,
                folio_imss,
                tipo_incapacidad,
                fecha_inicio,
                fecha_fin,
                dias_autorizados,
                documento_url || null,
                documento_nombre || null,
                medico_nombre || null,
                unidad_medica || null,
                diagnostico || null,
                bloqueoId,
                porcentajePago,
                diaInicioPago,
                incapacidad_origen_id || null,
                es_prorroga || false,
                notas_internas || null,
                ESTADOS_INCAPACIDAD.ACTIVA,
                usuarioId,
            ]);

            const incapacidad = incapacidadResult.rows[0];

            // 9. Actualizar estado del profesional a 'incapacidad'
            await db.query(
                `UPDATE profesionales SET estado = 'incapacidad', actualizado_en = NOW()
                 WHERE id = $1 AND organizacion_id = $2`,
                [profesionalId, organizacionId]
            );

            // 10. Registrar evento de auditoría (con SAVEPOINT por si falla)
            try {
                await db.query('SAVEPOINT audit_incapacidad');
                await db.query(
                    `INSERT INTO eventos_sistema (
                        organizacion_id, tipo_evento, tabla_afectada, registro_id,
                        datos_nuevos, usuario_id, descripcion
                    ) VALUES ($1, 'INSERT', 'incapacidades', $2, $3, $4, $5)`,
                    [
                        organizacionId,
                        incapacidad.id,
                        JSON.stringify({
                            folio_imss,
                            tipo_incapacidad,
                            profesional_id: profesionalId,
                            bloqueo_id: bloqueoId,
                        }),
                        usuarioId,
                        `Incapacidad registrada: ${folio_imss} - ${profesional.nombre_completo}`,
                    ]
                );
                await db.query('RELEASE SAVEPOINT audit_incapacidad');
            } catch (auditError) {
                await db.query('ROLLBACK TO SAVEPOINT audit_incapacidad');
                console.warn('Error en auditoría de incapacidad (no crítico):', auditError.message);
            }

            return {
                ...incapacidad,
                profesional_nombre: profesional.nombre_completo,
                bloqueo_id: bloqueoId,
            };
        });
    }

    /**
     * Lista incapacidades con filtros y paginación
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros de búsqueda
     * @returns {Promise<Object>} { data, total, page, limit, totalPages }
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                profesional_id,
                estado,
                tipo_incapacidad,
                fecha_inicio,
                fecha_fin,
                es_prorroga,
                page = 1,
                limite = PAGINACION.LIMITE_DEFAULT,
                orden = 'creado_en',
                direccion = 'desc',
            } = filtros;

            let whereClause = 'i.organizacion_id = $1';
            const values = [organizacionId];
            let contador = 2;

            if (profesional_id) {
                whereClause += ` AND i.profesional_id = $${contador}`;
                values.push(profesional_id);
                contador++;
            }

            if (estado) {
                whereClause += ` AND i.estado = $${contador}`;
                values.push(estado);
                contador++;
            }

            if (tipo_incapacidad) {
                whereClause += ` AND i.tipo_incapacidad = $${contador}`;
                values.push(tipo_incapacidad);
                contador++;
            }

            if (fecha_inicio) {
                whereClause += ` AND i.fecha_inicio >= $${contador}`;
                values.push(fecha_inicio);
                contador++;
            }

            if (fecha_fin) {
                whereClause += ` AND i.fecha_fin <= $${contador}`;
                values.push(fecha_fin);
                contador++;
            }

            if (es_prorroga !== undefined) {
                whereClause += ` AND i.es_prorroga = $${contador}`;
                values.push(es_prorroga);
                contador++;
            }

            // Contar total
            const countResult = await db.query(
                `SELECT COUNT(*) as total FROM incapacidades i WHERE ${whereClause}`,
                values
            );
            const total = parseInt(countResult.rows[0].total);

            // Validar columna de ordenamiento
            const columnasValidas = ['fecha_inicio', 'fecha_fin', 'creado_en', 'dias_autorizados'];
            const ordenColumna = columnasValidas.includes(orden) ? orden : 'creado_en';
            const ordenDir = direccion === 'asc' ? 'ASC' : 'DESC';

            // Obtener datos paginados
            const offset = (page - 1) * limite;
            const dataQuery = `
                SELECT
                    i.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    p.codigo as profesional_codigo,
                    d.nombre as departamento_nombre,
                    uc.nombre as creado_por_nombre
                FROM incapacidades i
                JOIN profesionales p ON p.id = i.profesional_id
                LEFT JOIN departamentos d ON d.id = p.departamento_id
                LEFT JOIN usuarios uc ON uc.id = i.creado_por
                WHERE ${whereClause}
                ORDER BY i.${ordenColumna} ${ordenDir}
                LIMIT $${contador} OFFSET $${contador + 1}
            `;
            values.push(limite, offset);

            const dataResult = await db.query(dataQuery, values);

            return {
                data: dataResult.rows,
                total,
                page,
                limit: limite,
                totalPages: Math.ceil(total / limite),
            };
        });
    }

    /**
     * Lista incapacidades del profesional autenticado
     */
    static async listarMisIncapacidades(organizacionId, profesionalId, filtros = {}) {
        return await this.listar(organizacionId, {
            ...filtros,
            profesional_id: profesionalId,
        });
    }

    /**
     * Obtiene una incapacidad por ID
     */
    static async obtenerPorId(organizacionId, incapacidadId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    i.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    p.codigo as profesional_codigo,
                    p.foto_url as profesional_foto,
                    d.nombre as departamento_nombre,
                    pu.nombre as puesto_nombre,
                    uc.nombre as creado_por_nombre,
                    ua.nombre as actualizado_por_nombre,
                    io.codigo as incapacidad_origen_codigo,
                    io.folio_imss as incapacidad_origen_folio
                FROM incapacidades i
                JOIN profesionales p ON p.id = i.profesional_id
                LEFT JOIN departamentos d ON d.id = p.departamento_id
                LEFT JOIN puestos pu ON pu.id = p.puesto_id
                LEFT JOIN usuarios uc ON uc.id = i.creado_por
                LEFT JOIN usuarios ua ON ua.id = i.actualizado_por
                LEFT JOIN incapacidades io ON io.id = i.incapacidad_origen_id
                WHERE i.id = $1 AND i.organizacion_id = $2
            `;

            const result = await db.query(query, [incapacidadId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualiza campos editables de una incapacidad
     */
    static async actualizar(organizacionId, incapacidadId, data, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposPermitidos = [
                'documento_url', 'documento_nombre',
                'medico_nombre', 'unidad_medica', 'diagnostico',
                'notas_internas',
            ];

            const campos = [];
            const valores = [];
            let contador = 1;

            for (const [campo, valor] of Object.entries(data)) {
                if (camposPermitidos.includes(campo) && valor !== undefined) {
                    campos.push(`${campo} = $${contador}`);
                    valores.push(valor);
                    contador++;
                }
            }

            if (campos.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            campos.push(`actualizado_en = NOW()`);
            campos.push(`actualizado_por = $${contador}`);
            valores.push(usuarioId);
            contador++;

            const query = `
                UPDATE incapacidades
                SET ${campos.join(', ')}
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                RETURNING *
            `;

            valores.push(incapacidadId, organizacionId);

            const result = await db.query(query, valores);

            if (result.rows.length === 0) {
                throw new Error(ERRORES_INCAPACIDAD.NO_ENCONTRADA);
            }

            return result.rows[0];
        });
    }

    /**
     * Finaliza anticipadamente una incapacidad
     */
    static async finalizar(organizacionId, incapacidadId, usuarioId, data = {}) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Obtener incapacidad
            const incapacidad = await this.obtenerPorId(organizacionId, incapacidadId);

            if (!incapacidad) {
                throw new Error(ERRORES_INCAPACIDAD.NO_ENCONTRADA);
            }

            if (incapacidad.estado !== ESTADOS_INCAPACIDAD.ACTIVA) {
                throw new Error(ERRORES_INCAPACIDAD.YA_FINALIZADA);
            }

            // Actualizar incapacidad
            const updateQuery = `
                UPDATE incapacidades
                SET estado = $1,
                    notas_internas = COALESCE($2, notas_internas),
                    actualizado_en = NOW(),
                    actualizado_por = $3
                WHERE id = $4 AND organizacion_id = $5
                RETURNING *
            `;

            const result = await db.query(updateQuery, [
                ESTADOS_INCAPACIDAD.FINALIZADA,
                data.notas_internas || null,
                usuarioId,
                incapacidadId,
                organizacionId,
            ]);

            // Verificar si hay otra incapacidad activa del profesional
            const otrasActivasQuery = await db.query(
                `SELECT contar_incapacidades_activas($1, $2) as cantidad`,
                [organizacionId, incapacidad.profesional_id]
            );

            const otrasActivas = parseInt(otrasActivasQuery.rows[0].cantidad) || 0;

            // Si no hay otras activas, restaurar estado del profesional
            if (otrasActivas === 0) {
                await db.query(
                    `UPDATE profesionales SET estado = 'activo', actualizado_en = NOW()
                     WHERE id = $1 AND organizacion_id = $2`,
                    [incapacidad.profesional_id, organizacionId]
                );
            }

            return result.rows[0];
        });
    }

    /**
     * Cancela una incapacidad y elimina el bloqueo
     */
    static async cancelar(organizacionId, incapacidadId, usuarioId, motivoCancelacion) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Obtener incapacidad
            const incapacidad = await this.obtenerPorId(organizacionId, incapacidadId);

            if (!incapacidad) {
                throw new Error(ERRORES_INCAPACIDAD.NO_ENCONTRADA);
            }

            if (incapacidad.estado === ESTADOS_INCAPACIDAD.CANCELADA) {
                throw new Error(ERRORES_INCAPACIDAD.YA_CANCELADA);
            }

            // Eliminar bloqueo asociado
            if (incapacidad.bloqueo_id) {
                await db.query(
                    `DELETE FROM bloqueos_horarios WHERE id = $1 AND organizacion_id = $2`,
                    [incapacidad.bloqueo_id, organizacionId]
                );
            }

            // Actualizar incapacidad
            const updateQuery = `
                UPDATE incapacidades
                SET estado = $1,
                    motivo_cancelacion = $2,
                    actualizado_en = NOW(),
                    actualizado_por = $3
                WHERE id = $4 AND organizacion_id = $5
                RETURNING *
            `;

            const result = await db.query(updateQuery, [
                ESTADOS_INCAPACIDAD.CANCELADA,
                motivoCancelacion,
                usuarioId,
                incapacidadId,
                organizacionId,
            ]);

            // Verificar si hay otra incapacidad activa del profesional
            const otrasActivasQuery = await db.query(
                `SELECT contar_incapacidades_activas($1, $2) as cantidad`,
                [organizacionId, incapacidad.profesional_id]
            );

            const otrasActivas = parseInt(otrasActivasQuery.rows[0].cantidad) || 0;

            // Si no hay otras activas, restaurar estado del profesional
            if (otrasActivas === 0) {
                await db.query(
                    `UPDATE profesionales SET estado = 'activo', actualizado_en = NOW()
                     WHERE id = $1 AND organizacion_id = $2`,
                    [incapacidad.profesional_id, organizacionId]
                );
            }

            return result.rows[0];
        });
    }

    /**
     * Crea una prórroga para una incapacidad existente
     */
    static async crearProrroga(organizacionId, incapacidadOrigenId, data, usuarioId) {
        // Obtener incapacidad origen
        const incapacidadOrigen = await this.obtenerPorId(organizacionId, incapacidadOrigenId);

        if (!incapacidadOrigen) {
            throw new Error(ERRORES_INCAPACIDAD.PRORROGA_SIN_ORIGEN);
        }

        // Crear nueva incapacidad como prórroga
        return await this.crear(organizacionId, incapacidadOrigen.profesional_id, {
            ...data,
            tipo_incapacidad: incapacidadOrigen.tipo_incapacidad,
            incapacidad_origen_id: incapacidadOrigenId,
            es_prorroga: true,
        }, usuarioId);
    }

    /**
     * Obtiene estadísticas de incapacidades
     */
    static async obtenerEstadisticas(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const { anio, departamento_id, tipo_incapacidad } = filtros;

            let whereClause = 'i.organizacion_id = $1';
            const values = [organizacionId];
            let contador = 2;

            if (anio) {
                whereClause += ` AND EXTRACT(YEAR FROM i.fecha_inicio) = $${contador}`;
                values.push(anio);
                contador++;
            }

            if (departamento_id) {
                whereClause += ` AND p.departamento_id = $${contador}`;
                values.push(departamento_id);
                contador++;
            }

            if (tipo_incapacidad) {
                whereClause += ` AND i.tipo_incapacidad = $${contador}`;
                values.push(tipo_incapacidad);
                contador++;
            }

            const query = `
                SELECT
                    COUNT(*) as total_incapacidades,
                    COUNT(*) FILTER (WHERE i.estado = 'activa') as activas,
                    COUNT(*) FILTER (WHERE i.estado = 'finalizada') as finalizadas,
                    COUNT(*) FILTER (WHERE i.estado = 'cancelada') as canceladas,
                    SUM(i.dias_autorizados) as total_dias,
                    AVG(i.dias_autorizados)::DECIMAL(10,2) as promedio_dias,
                    COUNT(DISTINCT i.profesional_id) as profesionales_afectados,
                    COUNT(*) FILTER (WHERE i.tipo_incapacidad = 'enfermedad_general') as por_enfermedad,
                    COUNT(*) FILTER (WHERE i.tipo_incapacidad = 'maternidad') as por_maternidad,
                    COUNT(*) FILTER (WHERE i.tipo_incapacidad = 'riesgo_trabajo') as por_riesgo
                FROM incapacidades i
                JOIN profesionales p ON p.id = i.profesional_id
                WHERE ${whereClause}
            `;

            const result = await db.query(query, values);
            return result.rows[0];
        });
    }

    /**
     * Obtiene incapacidades activas de un profesional
     */
    static async obtenerActivasPorProfesional(organizacionId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT i.*
                FROM incapacidades i
                WHERE i.organizacion_id = $1
                  AND i.profesional_id = $2
                  AND i.estado = 'activa'
                ORDER BY i.fecha_inicio DESC
            `;

            const result = await db.query(query, [organizacionId, profesionalId]);
            return result.rows;
        });
    }
}

module.exports = IncapacidadesModel;
