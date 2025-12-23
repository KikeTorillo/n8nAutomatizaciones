const RLSContextManager = require('../../../utils/rlsContextManager');

class ProfesionalModel {

    static async crear(profesionalData) {
        return await RLSContextManager.query(profesionalData.organizacion_id, async (db) => {
            if (profesionalData.email) {
                const emailDisponible = await this.validarEmailDisponible(
                    profesionalData.email,
                    profesionalData.organizacion_id,
                    null,
                    db
                );
                if (!emailDisponible) {
                    throw new Error('Ya existe un profesional con ese email en la organización');
                }
            }

            const query = `
                INSERT INTO profesionales (
                    organizacion_id, codigo, nombre_completo, email, telefono, foto_url,
                    fecha_nacimiento, documento_identidad, genero, direccion, estado_civil,
                    contacto_emergencia_nombre, contacto_emergencia_telefono,
                    tipo, estado, tipo_contratacion,
                    supervisor_id, departamento_id, puesto_id,
                    fecha_ingreso, licencias_profesionales,
                    años_experiencia, idiomas, disponible_online, color_calendario,
                    biografia, configuracion_horarios, configuracion_servicios,
                    salario_base, comision_porcentaje, forma_pago,
                    usuario_id, activo
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                    $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                    $31, $32, $33
                )
                RETURNING *
            `;

            const values = [
                profesionalData.organizacion_id,
                profesionalData.codigo || null,
                profesionalData.nombre_completo,
                profesionalData.email || null,
                profesionalData.telefono || null,
                profesionalData.foto_url || null,
                profesionalData.fecha_nacimiento || null,
                profesionalData.documento_identidad || null,
                profesionalData.genero || 'no_especificado',
                profesionalData.direccion || null,
                profesionalData.estado_civil || null,
                profesionalData.contacto_emergencia_nombre || null,
                profesionalData.contacto_emergencia_telefono || null,
                profesionalData.tipo || 'operativo',
                profesionalData.estado || 'activo',
                profesionalData.tipo_contratacion || 'tiempo_completo',
                profesionalData.supervisor_id || null,
                profesionalData.departamento_id || null,
                profesionalData.puesto_id || null,
                profesionalData.fecha_ingreso || null,
                profesionalData.licencias_profesionales || {},
                profesionalData.años_experiencia || 0,
                profesionalData.idiomas || ['es'],
                profesionalData.disponible_online !== undefined ? profesionalData.disponible_online : false,
                profesionalData.color_calendario || '#753572',
                profesionalData.biografia || null,
                profesionalData.configuracion_horarios || {},
                profesionalData.configuracion_servicios || {},
                profesionalData.salario_base || null,
                profesionalData.comision_porcentaje || 0,
                profesionalData.forma_pago || 'comision',
                profesionalData.usuario_id || null,
                profesionalData.activo !== undefined ? profesionalData.activo : true
            ];

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                if (error.code === '23505') {
                    if (error.constraint && error.constraint.includes('email')) {
                        throw new Error('Ya existe un profesional con ese email en la organización');
                    }
                    if (error.constraint && error.constraint.includes('telefono')) {
                        throw new Error('Ya existe un profesional con ese teléfono en la organización');
                    }
                    throw new Error('El profesional ya existe con esos datos únicos');
                }
                if (error.code === '23514') {
                    if (error.constraint && error.constraint.includes('fecha_nacimiento')) {
                        throw new Error('El profesional debe ser mayor de 18 años');
                    }
                    if (error.constraint && error.constraint.includes('años_experiencia')) {
                        throw new Error('Los años de experiencia deben estar entre 0 y 70');
                    }
                    if (error.constraint && error.constraint.includes('calificacion_promedio')) {
                        throw new Error('La calificación debe estar entre 1.00 y 5.00');
                    }
                    if (error.constraint && error.constraint.includes('comision_porcentaje')) {
                        throw new Error('La comisión debe estar entre 0% y 100%');
                    }
                    if (error.constraint && error.constraint.includes('color_calendario')) {
                        throw new Error('El color debe ser un código hexadecimal válido');
                    }
                    throw new Error('Los datos del profesional no cumplen las validaciones requeridas');
                }
                if (error.code === '23503') {
                    if (error.constraint && error.constraint.includes('organizacion')) {
                        throw new Error('La organización especificada no existe');
                    }
                    throw new Error('Error de referencia en los datos del profesional');
                }
                throw error;
            }
        });
    }

    /**
     * Crea múltiples profesionales en una transacción atómica
     * @param {number} organizacionId - ID de la organización
     * @param {Array} profesionales - Array de profesionales a crear
     * @returns {Promise<Array>} Profesionales creados con IDs
     */
    static async crearBulk(organizacionId, profesionales) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // 1. Pre-validación: Verificar límite del plan ANTES de crear
            const cantidadACrear = profesionales.length;
            const verificarQuery = `SELECT verificar_limite_plan($1, $2, $3) as puede_crear`;
            const verificarResult = await db.query(verificarQuery, [
                organizacionId,
                'profesionales',
                cantidadACrear
            ]);

            if (!verificarResult.rows[0]?.puede_crear) {
                // Obtener detalles del límite para mensaje de error
                const detallesQuery = `
                    SELECT
                        ps.limite_profesionales as limite,
                        m.uso_profesionales as uso_actual,
                        ps.nombre_plan
                    FROM subscripciones s
                    JOIN planes_subscripcion ps ON s.plan_id = ps.id
                    LEFT JOIN metricas_uso_organizacion m ON m.organizacion_id = s.organizacion_id
                    WHERE s.organizacion_id = $1 AND s.activa = true
                `;
                const detalles = await db.query(detallesQuery, [organizacionId]);
                const { limite, uso_actual, nombre_plan } = detalles.rows[0] || {};

                throw new Error(
                    `No se pueden crear ${cantidadACrear} profesionales. ` +
                    `Límite del plan ${nombre_plan}: ${limite} (uso actual: ${uso_actual || 0})`
                );
            }

            // 2. Pre-validación: Verificar emails únicos (si se proporcionan)
            const emailsAValidar = profesionales
                .filter(p => p.email && p.email.trim() !== '')
                .map(p => p.email.toLowerCase().trim());

            if (emailsAValidar.length > 0) {
                // Verificar emails duplicados dentro del batch
                const emailsDuplicados = emailsAValidar.filter((email, index) =>
                    emailsAValidar.indexOf(email) !== index
                );
                if (emailsDuplicados.length > 0) {
                    throw new Error(`Emails duplicados en la solicitud: ${emailsDuplicados.join(', ')}`);
                }

                // Verificar emails existentes en BD
                const emailsQuery = `
                    SELECT email
                    FROM profesionales
                    WHERE organizacion_id = $1
                        AND email = ANY($2)
                        AND activo = TRUE
                `;
                const emailsExistentes = await db.query(emailsQuery, [
                    organizacionId,
                    emailsAValidar
                ]);

                if (emailsExistentes.rows.length > 0) {
                    const emails = emailsExistentes.rows.map(r => r.email).join(', ');
                    throw new Error(`Los siguientes emails ya están en uso: ${emails}`);
                }
            }

            // 3. Crear todos los profesionales
            const profesionalesCreados = [];

            for (const prof of profesionales) {
                const insertQuery = `
                    INSERT INTO profesionales (
                        organizacion_id, nombre_completo, email, telefono,
                        color_calendario,
                        activo, disponible_online, fecha_nacimiento, documento_identidad,
                        licencias_profesionales, años_experiencia, idiomas, biografia, foto_url
                    ) VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING id, organizacion_id, nombre_completo, email, telefono, fecha_nacimiento,
                             documento_identidad, color_calendario,
                             activo, disponible_online, creado_en, actualizado_en
                `;

                const values = [
                    organizacionId,
                    prof.nombre_completo,
                    prof.email || null,
                    prof.telefono || null,
                    prof.color_calendario || '#753572',
                    prof.fecha_nacimiento || null,
                    prof.documento_identidad || null,
                    prof.licencias_profesionales || {},
                    prof.años_experiencia || 0,
                    prof.idiomas || ['es'],
                    prof.biografia || null,
                    prof.foto_url || null
                ];

                try {
                    const result = await db.query(insertQuery, values);
                    const profesionalCreado = result.rows[0];

                    // 4. Asignar servicios si se proporcionan
                    if (prof.servicios_asignados && prof.servicios_asignados.length > 0) {
                        for (const servicioId of prof.servicios_asignados) {
                            const servicioQuery = `
                                INSERT INTO servicios_profesionales (
                                    profesional_id, servicio_id, activo
                                ) VALUES ($1, $2, TRUE)
                                ON CONFLICT (profesional_id, servicio_id) DO NOTHING
                            `;
                            await db.query(servicioQuery, [profesionalCreado.id, servicioId]);
                        }
                    }

                    profesionalesCreados.push(profesionalCreado);

                } catch (error) {
                    // Manejar errores de constraint específicos
                    if (error.code === '23514') {
                        throw new Error(`Los datos del profesional "${prof.nombre_completo}" no cumplen las validaciones requeridas`);
                    }
                    if (error.code === '23503') {
                        throw new Error(`Error de referencia en los datos del profesional "${prof.nombre_completo}"`);
                    }
                    throw error;
                }
            }

            // 5. Retornar con conteo de servicios
            const idsCreados = profesionalesCreados.map(p => p.id);
            const queryFinal = `
                SELECT p.*,
                       COUNT(sp.servicio_id) as total_servicios_asignados
                FROM profesionales p
                LEFT JOIN servicios_profesionales sp ON p.id = sp.profesional_id AND sp.activo = true
                WHERE p.id = ANY($1)
                GROUP BY p.id
                ORDER BY p.id
            `;

            const finalResult = await db.query(queryFinal, [idsCreados]);
            return finalResult.rows;
        });
    }

    static async buscarPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT p.id, p.organizacion_id, p.nombre_completo, p.email, p.telefono,
                       p.fecha_nacimiento, p.documento_identidad,
                       p.licencias_profesionales, p.años_experiencia,
                       p.idiomas, p.color_calendario, p.biografia, p.foto_url,
                       p.configuracion_horarios, p.configuracion_servicios,
                       p.comision_porcentaje, p.salario_base, p.forma_pago,
                       p.activo, p.disponible_online, p.fecha_ingreso, p.fecha_salida,
                       p.motivo_inactividad, p.calificacion_promedio,
                       p.total_citas_completadas, p.total_clientes_atendidos,
                       p.usuario_id,
                       p.creado_en, p.actualizado_en,
                       o.nombre_comercial as organizacion_nombre, o.categoria_id,
                       u.nombre as usuario_nombre, u.email as usuario_email,
                       COUNT(sp.servicio_id) as total_servicios_asignados
                FROM profesionales p
                JOIN organizaciones o ON p.organizacion_id = o.id
                LEFT JOIN usuarios u ON p.usuario_id = u.id
                LEFT JOIN servicios_profesionales sp ON p.id = sp.profesional_id AND sp.activo = true
                WHERE p.id = $1 AND p.organizacion_id = $2
                GROUP BY p.id, o.id, u.id
            `;

            const result = await db.query(query, [id, organizacionId]);
            const profesional = result.rows[0];

            if (profesional) {
                // Convertir total_servicios_asignados de string a number
                profesional.total_servicios_asignados = parseInt(profesional.total_servicios_asignados, 10) || 0;
            }

            return profesional || null;
        });
    }

    static async listarPorOrganizacion(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                activo = null,
                disponible_online = null,
                busqueda = null,
                modulo = null, // Filtrar por módulo habilitado: 'agendamiento', 'pos', 'inventario'
                con_usuario = null, // Filtrar profesionales con/sin usuario vinculado
                // Dic 2025: Filtros de clasificación y jerarquía
                tipo = null, // puede ser string o array
                estado = null,
                tipo_contratacion = null,
                departamento_id = null,
                puesto_id = null,
                supervisor_id = null,
                limite = 50,
                offset = 0
            } = filtros;

            let query = `
                SELECT p.id, p.organizacion_id, p.nombre_completo, p.email, p.telefono,
                       p.fecha_nacimiento, p.documento_identidad,
                       p.licencias_profesionales, p.años_experiencia,
                       p.idiomas, p.color_calendario, p.biografia, p.foto_url,
                       p.configuracion_horarios, p.configuracion_servicios,
                       p.comision_porcentaje, p.salario_base, p.forma_pago,
                       p.activo, p.disponible_online, p.fecha_ingreso, p.fecha_salida,
                       p.motivo_inactividad, p.calificacion_promedio,
                       p.total_citas_completadas, p.total_clientes_atendidos,
                       p.usuario_id,
                       p.creado_en, p.actualizado_en,
                       u.nombre as usuario_nombre, u.email as usuario_email,
                       COUNT(sp.servicio_id) as total_servicios_asignados
                FROM profesionales p
                LEFT JOIN usuarios u ON p.usuario_id = u.id
                LEFT JOIN servicios_profesionales sp ON p.id = sp.profesional_id AND sp.activo = true
                WHERE p.organizacion_id = $1
            `;

            const values = [organizacionId];
            let contador = 2;

            if (activo !== null) {
                query += ` AND p.activo = $${contador}`;
                values.push(activo);
                contador++;
            }

            if (disponible_online !== null) {
                query += ` AND p.disponible_online = $${contador}`;
                values.push(disponible_online);
                contador++;
            }

            if (busqueda) {
                query += ` AND (p.nombre_completo ILIKE $${contador} OR p.email ILIKE $${contador})`;
                values.push(`%${busqueda}%`);
                contador++;
            }

            // Filtrar por módulo habilitado - DEPRECADO
            // Los permisos ahora se gestionan via sistema normalizado (permisos_catalogo, permisos_rol)
            // TODO: Implementar filtro usando obtener_permiso() cuando sea necesario
            if (modulo) {
                console.warn('DEPRECADO: Filtro por modulo ya no usa modulos_acceso. Usar sistema de permisos normalizado.');
            }

            // Filtrar por usuario vinculado (Nov 2025)
            if (con_usuario === true) {
                query += ` AND p.usuario_id IS NOT NULL`;
            } else if (con_usuario === false) {
                query += ` AND p.usuario_id IS NULL`;
            }

            // Dic 2025: Filtros de clasificación organizacional
            if (tipo) {
                // tipo puede ser string o array
                // Nota: tipo es ENUM tipo_empleado, cast a text para comparar con array
                if (Array.isArray(tipo)) {
                    query += ` AND p.tipo::text = ANY($${contador}::text[])`;
                    values.push(tipo);
                } else {
                    query += ` AND p.tipo = $${contador}`;
                    values.push(tipo);
                }
                contador++;
            }

            if (estado) {
                query += ` AND p.estado = $${contador}`;
                values.push(estado);
                contador++;
            }

            if (tipo_contratacion) {
                query += ` AND p.tipo_contratacion = $${contador}`;
                values.push(tipo_contratacion);
                contador++;
            }

            // Dic 2025: Filtros de jerarquía
            if (departamento_id) {
                query += ` AND p.departamento_id = $${contador}`;
                values.push(departamento_id);
                contador++;
            }

            if (puesto_id) {
                query += ` AND p.puesto_id = $${contador}`;
                values.push(puesto_id);
                contador++;
            }

            if (supervisor_id) {
                query += ` AND p.supervisor_id = $${contador}`;
                values.push(supervisor_id);
                contador++;
            }

            query += ` GROUP BY p.id, u.id ORDER BY p.nombre_completo ASC LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limite, offset);

            const result = await db.query(query, values);

            // Convertir total_servicios_asignados de string a number
            return result.rows.map(row => ({
                ...row,
                total_servicios_asignados: parseInt(row.total_servicios_asignados, 10) || 0
            }));
        });
    }

    static async actualizar(id, organizacionId, datos) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            if (datos.email) {
                const emailDisponible = await this.validarEmailDisponible(
                    datos.email,
                    organizacionId,
                    id,
                    db
                );
                if (!emailDisponible) {
                    throw new Error('Ya existe un profesional con ese email en la organización');
                }
            }

            const camposPermitidos = [
                // Identificación
                'codigo', 'nombre_completo', 'email', 'telefono', 'foto_url',
                // Información personal
                'fecha_nacimiento', 'documento_identidad', 'genero', 'direccion',
                'estado_civil', 'contacto_emergencia_nombre', 'contacto_emergencia_telefono',
                // Clasificación organizacional
                'tipo', 'estado', 'tipo_contratacion',
                // Jerarquía
                'supervisor_id', 'departamento_id', 'puesto_id',
                // Fechas laborales
                'fecha_ingreso', 'fecha_baja', 'motivo_baja',
                // Información profesional
                'licencias_profesionales', 'años_experiencia', 'idiomas',
                // Configuración de agendamiento
                'disponible_online', 'color_calendario', 'biografia',
                'configuracion_horarios', 'configuracion_servicios',
                // Compensación
                'salario_base', 'comision_porcentaje', 'forma_pago',
                // Vinculación con usuario
                'usuario_id',
                // Legacy
                'activo', 'fecha_salida', 'motivo_inactividad'
                // NOTA: modulos_acceso eliminado - usar sistema de permisos normalizado
            ];

            const campos = [];
            const valores = [];
            let contador = 1;

            for (const [campo, valor] of Object.entries(datos)) {
                if (camposPermitidos.includes(campo) && valor !== undefined) {
                    campos.push(`${campo} = $${contador}`);
                    valores.push(valor);
                    contador++;
                }
            }

            if (campos.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            const query = `
                UPDATE profesionales
                SET ${campos.join(', ')}, actualizado_en = NOW()
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                RETURNING id, organizacion_id, nombre_completo, email, telefono,
                         fecha_nacimiento, documento_identidad,
                         licencias_profesionales, años_experiencia,
                         idiomas, color_calendario, biografia, foto_url,
                         configuracion_horarios, configuracion_servicios,
                         comision_porcentaje, salario_base, forma_pago,
                         activo, disponible_online, fecha_ingreso, fecha_salida,
                         motivo_inactividad, calificacion_promedio,
                         total_citas_completadas, total_clientes_atendidos, actualizado_en
            `;

            valores.push(id, organizacionId);

            const result = await db.query(query, valores);

            if (result.rows.length === 0) {
                throw new Error('Profesional no encontrado en la organización');
            }

            return result.rows[0];
        });
    }

    static async cambiarEstado(id, organizacionId, activo, motivoInactividad = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE profesionales
                SET activo = $1,
                    motivo_inactividad = $2,
                    fecha_salida = CASE WHEN $1 = FALSE THEN CURRENT_DATE ELSE NULL END,
                    actualizado_en = NOW()
                WHERE id = $3 AND organizacion_id = $4
                RETURNING id, nombre_completo, activo, motivo_inactividad,
                         fecha_ingreso, fecha_salida, actualizado_en
            `;

            const result = await db.query(query, [activo, motivoInactividad, id, organizacionId]);

            if (result.rows.length === 0) {
                throw new Error('Profesional no encontrado en la organización');
            }

            return result.rows[0];
        });
    }

    // Método buscarPorTipo eliminado - usar listarPorOrganizacion con filtro de categorías

    static async actualizarMetricas(id, organizacionId, metricas) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                citas_completadas_incremento = 0,
                nuevos_clientes = 0,
                nueva_calificacion = null
            } = metricas;

            let query = `
                UPDATE profesionales
                SET total_citas_completadas = total_citas_completadas + $1,
                    total_clientes_atendidos = total_clientes_atendidos + $2
            `;

            const values = [citas_completadas_incremento, nuevos_clientes];
            let contador = 3;

            if (nueva_calificacion !== null) {
                query += `, calificacion_promedio = $${contador}`;
                values.push(nueva_calificacion);
                contador++;
            }

            query += `, actualizado_en = NOW()
                WHERE id = $${contador} AND organizacion_id = $${contador + 1}
                RETURNING id, nombre_completo, calificacion_promedio,
                         total_citas_completadas, total_clientes_atendidos,
                         actualizado_en
            `;

            values.push(id, organizacionId);

            const result = await db.query(query, values);

            if (result.rows.length === 0) {
                throw new Error('Profesional no encontrado en la organización');
            }

            return result.rows[0];
        });
    }

    static async obtenerEstadisticas(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    COUNT(*) as total_profesionales,
                    COUNT(*) FILTER (WHERE activo = TRUE) as profesionales_activos,
                    COUNT(*) FILTER (WHERE disponible_online = TRUE AND activo = TRUE) as disponibles_online,
                    AVG(calificacion_promedio) FILTER (WHERE activo = TRUE) as calificacion_promedio_general,
                    SUM(total_citas_completadas) as total_citas_organizacion,
                    SUM(total_clientes_atendidos) as total_clientes_organizacion,
                    AVG(años_experiencia) FILTER (WHERE activo = TRUE) as experiencia_promedio
                FROM profesionales
                WHERE organizacion_id = $1
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows[0];
        });
    }

    static async eliminar(id, organizacionId, motivo = 'Eliminado por administrador') {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE profesionales
                SET activo = FALSE,
                    disponible_online = FALSE,
                    fecha_salida = CURRENT_DATE,
                    motivo_inactividad = $1,
                    actualizado_en = NOW()
                WHERE id = $2 AND organizacion_id = $3
            `;

            const result = await db.query(query, [motivo, id, organizacionId]);
            return result.rowCount > 0;
        });
    }

    static async validarEmailDisponible(email, organizacionId, excluirId = null, dbConnection = null) {
        // Si se proporciona dbConnection, usarla directamente (ya está en contexto RLS)
        if (dbConnection) {
            let query = `
                SELECT COUNT(*) as count
                FROM profesionales
                WHERE email = $1 AND organizacion_id = $2 AND activo = TRUE
            `;

            const values = [email, organizacionId];

            if (excluirId) {
                query += ' AND id != $3';
                values.push(excluirId);
            }

            const result = await dbConnection.query(query, values);
            return parseInt(result.rows[0].count) === 0;
        }

        // Si no hay dbConnection, crear una nueva con RLS
        return await RLSContextManager.query(organizacionId, async (db) => {
            let query = `
                SELECT COUNT(*) as count
                FROM profesionales
                WHERE email = $1 AND organizacion_id = $2 AND activo = TRUE
            `;

            const values = [email, organizacionId];

            if (excluirId) {
                query += ' AND id != $3';
                values.push(excluirId);
            }

            const result = await db.query(query, values);
            return parseInt(result.rows[0].count) === 0;
        });
    }

    // ====================================================================
    // MÉTODOS PARA MODELO UNIFICADO PROFESIONAL-USUARIO (Nov 2025)
    // ====================================================================

    /**
     * Busca un profesional por su usuario_id vinculado
     * Usado para auto-asignación en POS
     * @param {number} usuarioId - ID del usuario
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} Profesional o null
     */
    static async buscarPorUsuario(usuarioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT p.id, p.organizacion_id, p.nombre_completo, p.email, p.telefono,
                       p.usuario_id,
                       p.activo, p.disponible_online
                FROM profesionales p
                WHERE p.usuario_id = $1 AND p.organizacion_id = $2 AND p.activo = TRUE
            `;

            const result = await db.query(query, [usuarioId, organizacionId]);
            return result.rows[0] || null;
        });
    }

    /**
     * Vincula o desvincula un usuario a un profesional
     * @param {number} profesionalId - ID del profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number|null} usuarioId - ID del usuario (null para desvincular)
     * @returns {Promise<Object>} Profesional actualizado
     */
    static async vincularUsuario(profesionalId, organizacionId, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Si se va a vincular, verificar que el usuario no esté vinculado a otro profesional
            if (usuarioId) {
                const checkQuery = `
                    SELECT id, nombre_completo
                    FROM profesionales
                    WHERE usuario_id = $1 AND organizacion_id = $2 AND id != $3 AND activo = TRUE
                `;
                const checkResult = await db.query(checkQuery, [usuarioId, organizacionId, profesionalId]);

                if (checkResult.rows.length > 0) {
                    throw new Error(`El usuario ya está vinculado al profesional "${checkResult.rows[0].nombre_completo}"`);
                }
            }

            const query = `
                UPDATE profesionales
                SET usuario_id = $1, actualizado_en = NOW()
                WHERE id = $2 AND organizacion_id = $3
                RETURNING id, nombre_completo, usuario_id, actualizado_en
            `;

            const result = await db.query(query, [usuarioId, profesionalId, organizacionId]);

            if (result.rows.length === 0) {
                throw new Error('Profesional no encontrado en la organización');
            }

            return result.rows[0];
        });
    }

    /**
     * @deprecated Los permisos ahora se gestionan via sistema normalizado
     * Usar permisos_catalogo, permisos_rol, permisos_usuario_sucursal
     * Ver: sql/nucleo/11-tablas-permisos.sql, sql/nucleo/12-funciones-permisos.sql
     */
    static async actualizarModulos(profesionalId, organizacionId, modulosAcceso) {
        console.warn('DEPRECADO: actualizarModulos() ya no es válido. Usar sistema de permisos normalizado.');
        throw new Error('Método deprecado. Los permisos se gestionan via permisos_catalogo/permisos_rol/permisos_usuario_sucursal');
    }

    /**
     * @deprecated Los permisos ahora se gestionan via sistema normalizado
     * Para obtener usuarios con un permiso específico, usar:
     * SELECT u.* FROM usuarios u
     * WHERE tiene_permiso(u.id, sucursal_id, 'pos.acceso') = true
     */
    static async listarPorModulo(organizacionId, modulo, soloActivos = true) {
        console.warn('DEPRECADO: listarPorModulo() ya no es válido. Usar sistema de permisos normalizado.');
        throw new Error('Método deprecado. Usar función SQL tiene_permiso() para filtrar por permisos');
    }

    /**
     * Obtiene usuarios disponibles para vincular (sin profesional asignado)
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} Lista de usuarios disponibles
     */
    static async obtenerUsuariosDisponibles(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT u.id, u.nombre, u.email, u.rol
                FROM usuarios u
                LEFT JOIN profesionales p ON u.id = p.usuario_id AND p.activo = TRUE
                WHERE u.organizacion_id = $1
                    AND u.activo = TRUE
                    AND p.id IS NULL
                    AND u.rol IN ('empleado', 'admin', 'propietario')
                ORDER BY u.nombre ASC
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows;
        });
    }

    // ====================================================================
    // MÉTODOS PARA JERARQUÍA ORGANIZACIONAL (Dic 2025)
    // ====================================================================

    /**
     * Lista profesionales por estado laboral
     */
    static async listarPorEstado(organizacionId, estado, limite = 50, offset = 0) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT p.*,
                       d.nombre as departamento_nombre,
                       pu.nombre as puesto_nombre,
                       sup.nombre_completo as supervisor_nombre
                FROM profesionales p
                LEFT JOIN departamentos d ON p.departamento_id = d.id
                LEFT JOIN puestos pu ON p.puesto_id = pu.id
                LEFT JOIN profesionales sup ON p.supervisor_id = sup.id
                WHERE p.organizacion_id = $1 AND p.estado = $2
                ORDER BY p.nombre_completo
                LIMIT $3 OFFSET $4
            `;
            const result = await db.query(query, [organizacionId, estado, limite, offset]);
            return result.rows;
        });
    }

    /**
     * Lista profesionales por departamento
     */
    static async listarPorDepartamento(organizacionId, departamentoId, soloActivos = true) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let query = `
                SELECT p.*,
                       pu.nombre as puesto_nombre,
                       sup.nombre_completo as supervisor_nombre
                FROM profesionales p
                LEFT JOIN puestos pu ON p.puesto_id = pu.id
                LEFT JOIN profesionales sup ON p.supervisor_id = sup.id
                WHERE p.organizacion_id = $1 AND p.departamento_id = $2
            `;

            if (soloActivos) {
                query += ` AND p.estado = 'activo'`;
            }

            query += ` ORDER BY p.nombre_completo`;

            const result = await db.query(query, [organizacionId, departamentoId]);
            return result.rows;
        });
    }

    /**
     * Obtiene subordinados directos e indirectos usando función SQL
     */
    static async obtenerSubordinados(organizacionId, profesionalId, maxNivel = 10) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT p.*, s.nivel,
                       d.nombre as departamento_nombre,
                       pu.nombre as puesto_nombre
                FROM get_subordinados($1, $2) s
                JOIN profesionales p ON s.profesional_id = p.id
                LEFT JOIN departamentos d ON p.departamento_id = d.id
                LEFT JOIN puestos pu ON p.puesto_id = pu.id
                WHERE p.organizacion_id = $3
                ORDER BY s.nivel, p.nombre_completo
            `;
            const result = await db.query(query, [profesionalId, maxNivel, organizacionId]);
            return result.rows;
        });
    }

    /**
     * Obtiene la cadena de supervisores hacia arriba
     */
    static async obtenerCadenaSupervisores(organizacionId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT p.*, s.nivel,
                       d.nombre as departamento_nombre,
                       pu.nombre as puesto_nombre
                FROM get_cadena_supervisores($1) s
                JOIN profesionales p ON s.profesional_id = p.id
                LEFT JOIN departamentos d ON p.departamento_id = d.id
                LEFT JOIN puestos pu ON p.puesto_id = pu.id
                WHERE p.organizacion_id = $2
                ORDER BY s.nivel
            `;
            const result = await db.query(query, [profesionalId, organizacionId]);
            return result.rows;
        });
    }

    /**
     * Valida que asignar supervisor no cree ciclo
     */
    static async validarSupervisorSinCiclo(organizacionId, profesionalId, nuevoSupervisorId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `SELECT validar_supervisor_sin_ciclo($1, $2) as valido`;
            const result = await db.query(query, [profesionalId, nuevoSupervisorId]);
            return result.rows[0]?.valido || false;
        });
    }

    // ====================================================================
    // MÉTODOS PARA CATEGORÍAS DE PROFESIONAL (Dic 2025)
    // ====================================================================

    /**
     * Obtiene las categorías asignadas a un profesional
     */
    static async obtenerCategorias(organizacionId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT c.*, pc.fecha_asignacion, pc.notas
                FROM profesionales_categorias pc
                JOIN categorias_profesional c ON pc.categoria_id = c.id
                WHERE pc.profesional_id = $1 AND c.organizacion_id = $2
                ORDER BY c.tipo_categoria, c.orden, c.nombre
            `;
            const result = await db.query(query, [profesionalId, organizacionId]);
            return result.rows;
        });
    }

    /**
     * Asigna una categoría a un profesional
     */
    static async asignarCategoria(organizacionId, profesionalId, categoriaId, notas = null) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO profesionales_categorias (profesional_id, categoria_id, notas)
                VALUES ($1, $2, $3)
                ON CONFLICT (profesional_id, categoria_id) DO UPDATE SET notas = $3
                RETURNING *
            `;
            const result = await db.query(query, [profesionalId, categoriaId, notas]);
            return result.rows[0];
        });
    }

    /**
     * Elimina una categoría de un profesional
     */
    static async eliminarCategoria(organizacionId, profesionalId, categoriaId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                DELETE FROM profesionales_categorias
                WHERE profesional_id = $1 AND categoria_id = $2
                RETURNING *
            `;
            const result = await db.query(query, [profesionalId, categoriaId]);
            return result.rowCount > 0;
        });
    }

    /**
     * Sincroniza categorías de un profesional (reemplaza todas)
     */
    static async sincronizarCategorias(organizacionId, profesionalId, categoriaIds) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Eliminar categorías actuales
            await db.query(
                'DELETE FROM profesionales_categorias WHERE profesional_id = $1',
                [profesionalId]
            );

            // Insertar nuevas categorías
            if (categoriaIds && categoriaIds.length > 0) {
                const insertQuery = `
                    INSERT INTO profesionales_categorias (profesional_id, categoria_id)
                    SELECT $1, unnest($2::integer[])
                `;
                await db.query(insertQuery, [profesionalId, categoriaIds]);
            }

            // Retornar categorías actualizadas
            return await this.obtenerCategorias(organizacionId, profesionalId);
        });
    }

}

module.exports = ProfesionalModel;
