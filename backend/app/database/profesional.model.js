/**
 * @fileoverview Modelo de Profesional para sistema multi-tenant SaaS
 * @description Maneja operaciones CRUD de profesionales con RLS y validaciones automáticas
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const { getDb } = require('../config/database');

/**
 * Modelo Profesional - Operaciones de base de datos para profesionales
 * @class ProfesionalModel
 */
class ProfesionalModel {

    /**
     * Crear un nuevo profesional con validaciones automáticas
     * @param {Object} profesionalData - Datos del profesional
     * @param {number} profesionalData.organizacion_id - ID de la organización (requerido)
     * @param {string} profesionalData.nombre_completo - Nombre completo del profesional
     * @param {string} profesionalData.email - Email del profesional (único por organización)
     * @param {string} profesionalData.telefono - Teléfono de contacto
     * @param {Date} [profesionalData.fecha_nacimiento] - Fecha de nacimiento
     * @param {string} [profesionalData.documento_identidad] - Documento de identidad
     * @param {string} profesionalData.tipo_profesional - Tipo según industria (ENUM)
     * @param {Array} [profesionalData.especialidades] - Array de especialidades
     * @param {Object} [profesionalData.licencias_profesionales] - Licencias y certificaciones
     * @param {number} [profesionalData.años_experiencia] - Años de experiencia
     * @param {Array} [profesionalData.idiomas] - Idiomas que habla
     * @param {string} [profesionalData.color_calendario] - Color hex para calendario
     * @param {string} [profesionalData.biografia] - Descripción profesional
     * @param {string} [profesionalData.foto_url] - URL de foto de perfil
     * @param {Object} [profesionalData.configuracion_horarios] - Horarios personalizados
     * @param {Object} [profesionalData.configuracion_servicios] - Configuración de servicios
     * @param {number} [profesionalData.comision_porcentaje] - Porcentaje de comisión
     * @param {number} [profesionalData.salario_base] - Salario base mensual
     * @param {string} [profesionalData.forma_pago] - Forma de pago (comision, salario, mixto)
     * @param {boolean} [profesionalData.activo] - Si el profesional está activo
     * @param {boolean} [profesionalData.disponible_online] - Disponible para agendamiento online
     * @param {Date} [profesionalData.fecha_ingreso] - Fecha de contratación
     * @returns {Promise<Object>} Profesional creado
     * @throws {Error} Si hay errores de validación o industria incompatible
     */
    static async crear(profesionalData) {
        const db = await getDb();

        try {
            // Configurar contexto RLS multi-tenant
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', profesionalData.organizacion_id.toString()]);

            const query = `
                INSERT INTO profesionales (
                    organizacion_id, nombre_completo, email, telefono, fecha_nacimiento,
                    documento_identidad, tipo_profesional, especialidades, licencias_profesionales,
                    años_experiencia, idiomas, color_calendario, biografia, foto_url,
                    configuracion_horarios, configuracion_servicios, comision_porcentaje,
                    salario_base, forma_pago, activo, disponible_online, fecha_ingreso
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
                RETURNING id, organizacion_id, nombre_completo, email, telefono, fecha_nacimiento,
                         documento_identidad, tipo_profesional, especialidades, licencias_profesionales,
                         años_experiencia, idiomas, color_calendario, biografia, foto_url,
                         configuracion_horarios, configuracion_servicios, comision_porcentaje,
                         salario_base, forma_pago, activo, disponible_online, fecha_ingreso,
                         calificacion_promedio, total_citas_completadas, total_clientes_atendidos,
                         creado_en, actualizado_en
            `;

            const values = [
                profesionalData.organizacion_id,
                profesionalData.nombre_completo,
                profesionalData.email || null,
                profesionalData.telefono || null,
                profesionalData.fecha_nacimiento || null,
                profesionalData.documento_identidad || null,
                profesionalData.tipo_profesional,
                profesionalData.especialidades || [],
                profesionalData.licencias_profesionales || {},
                profesionalData.años_experiencia || 0,
                profesionalData.idiomas || ['es'],
                profesionalData.color_calendario || '#3498db',
                profesionalData.biografia || null,
                profesionalData.foto_url || null,
                profesionalData.configuracion_horarios || {},
                profesionalData.configuracion_servicios || {},
                profesionalData.comision_porcentaje || 0.00,
                profesionalData.salario_base || null,
                profesionalData.forma_pago || 'comision',
                profesionalData.activo !== undefined ? profesionalData.activo : true,
                profesionalData.disponible_online !== undefined ? profesionalData.disponible_online : true,
                profesionalData.fecha_ingreso || new Date()
            ];

            const result = await db.query(query, values);
            return result.rows[0];

        } catch (error) {
            if (error.code === '23505') { // Duplicate key
                throw new Error('Ya existe un profesional con ese email en la organización');
            }
            if (error.code === '23514') { // Check constraint
                throw new Error('Tipo de profesional incompatible con la industria de la organización');
            }
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * Buscar profesional por ID con contexto RLS
     * @param {number} id - ID del profesional
     * @param {number} organizacionId - ID de la organización (para RLS)
     * @returns {Promise<Object|null>} Profesional encontrado o null
     */
    static async buscarPorId(id, organizacionId) {
        const db = await getDb();

        try {
            // Configurar contexto RLS multi-tenant
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            const query = `
                SELECT p.id, p.organizacion_id, p.nombre_completo, p.email, p.telefono,
                       p.fecha_nacimiento, p.documento_identidad, p.tipo_profesional,
                       p.especialidades, p.licencias_profesionales, p.años_experiencia,
                       p.idiomas, p.color_calendario, p.biografia, p.foto_url,
                       p.configuracion_horarios, p.configuracion_servicios,
                       p.comision_porcentaje, p.salario_base, p.forma_pago,
                       p.activo, p.disponible_online, p.fecha_ingreso, p.fecha_salida,
                       p.motivo_inactividad, p.calificacion_promedio,
                       p.total_citas_completadas, p.total_clientes_atendidos,
                       p.creado_en, p.actualizado_en,
                       o.nombre_comercial as organizacion_nombre, o.tipo_industria as industria
                FROM profesionales p
                JOIN organizaciones o ON p.organizacion_id = o.id
                WHERE p.id = $1 AND p.organizacion_id = $2
            `;

            const result = await db.query(query, [id, organizacionId]);
            return result.rows[0] || null;
        } finally {
            db.release();
        }
    }

    /**
     * Listar profesionales por organización con filtros
     * @param {number} organizacionId - ID de la organización
     * @param {Object} [filtros] - Filtros opcionales
     * @param {boolean} [filtros.activo] - Solo profesionales activos
     * @param {boolean} [filtros.disponible_online] - Solo disponibles online
     * @param {string} [filtros.tipo_profesional] - Filtrar por tipo
     * @param {string} [filtros.busqueda] - Búsqueda por nombre o email
     * @param {number} [filtros.limite] - Límite de resultados
     * @param {number} [filtros.offset] - Offset para paginación
     * @returns {Promise<Array>} Lista de profesionales
     */
    static async listarPorOrganizacion(organizacionId, filtros = {}) {
        const db = await getDb();

        try {
            // Configurar contexto RLS multi-tenant
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            const {
                activo = null,
                disponible_online = null,
                tipo_profesional = null,
                busqueda = null,
                limite = 50,
                offset = 0
            } = filtros;

            let query = `
                SELECT p.id, p.nombre_completo, p.email, p.telefono,
                       p.tipo_profesional, p.especialidades, p.años_experiencia,
                       p.color_calendario, p.biografia, p.foto_url,
                       p.comision_porcentaje, p.salario_base, p.forma_pago,
                       p.activo, p.disponible_online, p.fecha_ingreso,
                       p.calificacion_promedio, p.total_citas_completadas,
                       p.total_clientes_atendidos, p.creado_en, p.actualizado_en
                FROM profesionales p
                WHERE p.organizacion_id = $1
            `;

            const values = [organizacionId];
            let contador = 2;

            // Aplicar filtros dinámicos
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

            if (tipo_profesional) {
                query += ` AND p.tipo_profesional = $${contador}`;
                values.push(tipo_profesional);
                contador++;
            }

            if (busqueda) {
                query += ` AND (p.nombre_completo ILIKE $${contador} OR p.email ILIKE $${contador})`;
                values.push(`%${busqueda}%`);
                contador++;
            }

            query += ` ORDER BY p.nombre_completo ASC LIMIT $${contador} OFFSET $${contador + 1}`;
            values.push(limite, offset);

            const result = await db.query(query, values);
            return result.rows;
        } finally {
            db.release();
        }
    }

    /**
     * Actualizar profesional
     * @param {number} id - ID del profesional
     * @param {number} organizacionId - ID de la organización (para RLS)
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object>} Profesional actualizado
     * @throws {Error} Si el profesional no existe o no se puede actualizar
     */
    static async actualizar(id, organizacionId, datos) {
        const db = await getDb();

        try {
            // Configurar contexto RLS multi-tenant
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            const camposPermitidos = [
                'nombre_completo', 'email', 'telefono', 'fecha_nacimiento',
                'documento_identidad', 'especialidades', 'licencias_profesionales',
                'años_experiencia', 'idiomas', 'color_calendario', 'biografia',
                'foto_url', 'configuracion_horarios', 'configuracion_servicios',
                'comision_porcentaje', 'salario_base', 'forma_pago', 'activo',
                'disponible_online', 'fecha_salida', 'motivo_inactividad'
            ];

            const campos = [];
            const valores = [];
            let contador = 1;

            // Construir query dinámico solo con campos permitidos
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
                         tipo_profesional, especialidades, años_experiencia,
                         color_calendario, biografia, activo, disponible_online,
                         calificacion_promedio, total_citas_completadas,
                         total_clientes_atendidos, actualizado_en
            `;

            valores.push(id, organizacionId);

            const result = await db.query(query, valores);

            if (result.rows.length === 0) {
                throw new Error('Profesional no encontrado en la organización');
            }

            return result.rows[0];
        } finally {
            db.release();
        }
    }

    /**
     * Activar/Desactivar profesional
     * @param {number} id - ID del profesional
     * @param {number} organizacionId - ID de la organización (para RLS)
     * @param {boolean} activo - Estado activo
     * @param {string} [motivoInactividad] - Motivo de inactividad si se desactiva
     * @returns {Promise<Object>} Profesional actualizado
     */
    static async cambiarEstado(id, organizacionId, activo, motivoInactividad = null) {
        const db = await getDb();

        try {
            // Configurar contexto RLS multi-tenant
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

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
        } finally {
            db.release();
        }
    }

    /**
     * Buscar profesionales por tipo en una organización
     * @param {number} organizacionId - ID de la organización
     * @param {string} tipoProfesional - Tipo de profesional (ENUM)
     * @param {boolean} [soloActivos] - Solo profesionales activos
     * @returns {Promise<Array>} Lista de profesionales del tipo especificado
     */
    static async buscarPorTipo(organizacionId, tipoProfesional, soloActivos = true) {
        const db = await getDb();

        try {
            // Configurar contexto RLS multi-tenant
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            let query = `
                SELECT p.id, p.nombre_completo, p.email, p.telefono,
                       p.tipo_profesional, p.especialidades, p.años_experiencia,
                       p.color_calendario, p.biografia, p.foto_url,
                       p.calificacion_promedio, p.total_citas_completadas,
                       p.disponible_online, p.activo
                FROM profesionales p
                WHERE p.organizacion_id = $1 AND p.tipo_profesional = $2
            `;

            const values = [organizacionId, tipoProfesional];

            if (soloActivos) {
                query += ' AND p.activo = TRUE';
            }

            query += ' ORDER BY p.calificacion_promedio DESC, p.nombre_completo ASC';

            const result = await db.query(query, values);
            return result.rows;
        } finally {
            db.release();
        }
    }

    /**
     * Actualizar métricas de profesional (citas completadas, clientes atendidos)
     * @param {number} id - ID del profesional
     * @param {number} organizacionId - ID de la organización (para RLS)
     * @param {Object} metricas - Métricas a actualizar
     * @param {number} [metricas.citas_completadas_incremento] - Incremento en citas completadas
     * @param {number} [metricas.nuevos_clientes] - Incremento en clientes únicos atendidos
     * @param {number} [metricas.nueva_calificacion] - Nueva calificación promedio
     * @returns {Promise<Object>} Profesional con métricas actualizadas
     */
    static async actualizarMetricas(id, organizacionId, metricas) {
        const db = await getDb();

        try {
            // Configurar contexto RLS multi-tenant
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

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
        } finally {
            db.release();
        }
    }

    /**
     * Obtener estadísticas de profesionales por organización
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Estadísticas de profesionales
     */
    static async obtenerEstadisticas(organizacionId) {
        const db = await getDb();

        try {
            // Configurar contexto RLS multi-tenant
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            const query = `
                SELECT
                    COUNT(*) as total_profesionales,
                    COUNT(*) FILTER (WHERE activo = TRUE) as profesionales_activos,
                    COUNT(*) FILTER (WHERE disponible_online = TRUE AND activo = TRUE) as disponibles_online,
                    AVG(calificacion_promedio) FILTER (WHERE activo = TRUE) as calificacion_promedio_general,
                    SUM(total_citas_completadas) as total_citas_organizacion,
                    SUM(total_clientes_atendidos) as total_clientes_organizacion,
                    COUNT(DISTINCT tipo_profesional) as tipos_profesionales_diferentes,
                    AVG(años_experiencia) FILTER (WHERE activo = TRUE) as experiencia_promedio
                FROM profesionales
                WHERE organizacion_id = $1
            `;

            const result = await db.query(query, [organizacionId]);
            return result.rows[0];
        } finally {
            db.release();
        }
    }

    /**
     * Eliminar profesional (soft delete - cambiar a inactivo)
     * @param {number} id - ID del profesional
     * @param {number} organizacionId - ID de la organización (para RLS)
     * @param {string} [motivo] - Motivo de eliminación
     * @returns {Promise<boolean>} True si se eliminó exitosamente
     */
    static async eliminar(id, organizacionId, motivo = 'Eliminado por administrador') {
        const db = await getDb();

        try {
            // Configurar contexto RLS multi-tenant
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            // Soft delete: cambiar a inactivo en lugar de eliminar registro
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
        } finally {
            db.release();
        }
    }

    /**
     * Validar disponibilidad de email en organización
     * @param {string} email - Email a validar
     * @param {number} organizacionId - ID de la organización
     * @param {number} [excluirId] - ID del profesional a excluir (para actualizaciones)
     * @returns {Promise<boolean>} True si el email está disponible
     */
    static async validarEmailDisponible(email, organizacionId, excluirId = null) {
        const db = await getDb();

        try {
            // Configurar contexto RLS multi-tenant
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            let query = `
                SELECT COUNT(*) as count
                FROM profesionales
                WHERE email = $1 AND organizacion_id = $2
            `;

            const values = [email, organizacionId];

            if (excluirId) {
                query += ' AND id != $3';
                values.push(excluirId);
            }

            const result = await db.query(query, values);
            return parseInt(result.rows[0].count) === 0;
        } finally {
            db.release();
        }
    }

    /**
     * 🤖 CRÍTICO PARA IA: Generar horarios automáticamente para profesional
     * @param {number} profesionalId - ID del profesional
     * @param {number} organizacionId - ID de la organización
     * @param {Object} configuracion - Configuración de horarios
     * @param {string} configuracion.zona_horaria - Zona horaria (ej: 'America/Mexico_City')
     * @param {Object} configuracion.horarios_base - Horarios por día de semana
     * @param {number} configuracion.duracion_slot_minutos - Duración de cada slot en minutos (15, 30, 60)
     * @param {Array<string>} configuracion.dias_laborables - Días que labora ['lunes', 'martes', ...]
     * @param {string} configuracion.tipo_generacion - 'semanal' | 'mensual'
     * @param {Date} configuracion.fecha_inicio - Fecha de inicio de generación
     * @param {Date} configuracion.fecha_fin - Fecha de fin de generación
     * @returns {Promise<Object>} Resumen de horarios generados
     */
    static async generarHorarios(profesionalId, organizacionId, configuracion) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            // Configurar contexto RLS multi-tenant
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            const {
                zona_horaria = 'America/Mexico_City',
                horarios_base = {},
                duracion_slot_minutos = 30,
                dias_laborables = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
                tipo_generacion = 'semanal',
                fecha_inicio,
                fecha_fin
            } = configuracion;

            // Validar que el profesional existe
            const profesionalQuery = `
                SELECT id, nombre_completo, tipo_profesional, activo
                FROM profesionales
                WHERE id = $1 AND organizacion_id = $2 AND activo = true
            `;
            const profesionalResult = await db.query(profesionalQuery, [profesionalId, organizacionId]);

            if (profesionalResult.rows.length === 0) {
                throw new Error('Profesional no encontrado o inactivo');
            }

            const profesional = profesionalResult.rows[0];

            // Configurar horarios base por defecto si no se proporcionan
            const horariosDefecto = {
                lunes: { inicio: '09:00', fin: '18:00', descansos: [{ inicio: '13:00', fin: '14:00' }] },
                martes: { inicio: '09:00', fin: '18:00', descansos: [{ inicio: '13:00', fin: '14:00' }] },
                miercoles: { inicio: '09:00', fin: '18:00', descansos: [{ inicio: '13:00', fin: '14:00' }] },
                jueves: { inicio: '09:00', fin: '18:00', descansos: [{ inicio: '13:00', fin: '14:00' }] },
                viernes: { inicio: '09:00', fin: '17:00', descansos: [{ inicio: '13:00', fin: '14:00' }] },
                sabado: { inicio: '09:00', fin: '14:00', descansos: [] },
                domingo: null // No labora domingos por defecto
            };

            const horariosFinales = { ...horariosDefecto, ...horarios_base };

            // Función para generar slots de tiempo
            const generarSlots = (inicio, fin, duracionMinutos, descansos = []) => {
                const slots = [];
                const inicioMinutos = this.timeToMinutes(inicio);
                const finMinutos = this.timeToMinutes(fin);

                for (let minutos = inicioMinutos; minutos < finMinutos; minutos += duracionMinutos) {
                    const horaSlot = this.minutesToTime(minutos);
                    const horaFinSlot = this.minutesToTime(minutos + duracionMinutos);

                    // Verificar si el slot NO está en horario de descanso
                    const enDescanso = descansos.some(descanso => {
                        const inicioDescanso = this.timeToMinutes(descanso.inicio);
                        const finDescanso = this.timeToMinutes(descanso.fin);
                        return minutos >= inicioDescanso && minutos < finDescanso;
                    });

                    if (!enDescanso) {
                        slots.push({
                            hora_inicio: horaSlot,
                            hora_fin: horaFinSlot,
                            duracion_minutos: duracionMinutos
                        });
                    }
                }

                return slots;
            };

            // Calcular fechas de generación
            const fechaInicioDate = fecha_inicio ? new Date(fecha_inicio) : new Date();
            const fechaFinDate = fecha_fin ? new Date(fecha_fin) :
                new Date(fechaInicioDate.getTime() + (tipo_generacion === 'semanal' ? 7 : 30) * 24 * 60 * 60 * 1000);

            let horariosCreados = 0;
            let diasProcesados = 0;
            const resumenPorDia = {};

            // Generar horarios día por día
            for (let fecha = new Date(fechaInicioDate); fecha <= fechaFinDate; fecha.setDate(fecha.getDate() + 1)) {
                const nombreDia = this.obtenerNombreDia(fecha.getDay());

                if (!dias_laborables.includes(nombreDia)) {
                    continue; // Saltar días no laborables
                }

                const horarioDia = horariosFinales[nombreDia];
                if (!horarioDia) {
                    continue; // Saltar días sin configuración
                }

                diasProcesados++;

                // Verificar si ya existen horarios para este día
                const existenQuery = `
                    SELECT COUNT(*) as count
                    FROM horarios_profesionales
                    WHERE profesional_id = $1 AND fecha = $2
                `;
                const existenResult = await db.query(existenQuery, [profesionalId, fecha.toISOString().split('T')[0]]);

                if (parseInt(existenResult.rows[0].count) > 0) {
                    continue; // Saltar si ya existen horarios
                }

                // Generar slots para este día
                const slots = generarSlots(
                    horarioDia.inicio,
                    horarioDia.fin,
                    duracion_slot_minutos,
                    horarioDia.descansos || []
                );

                // Insertar horarios base del profesional
                const insertBaseQuery = `
                    INSERT INTO horarios_profesionales (
                        profesional_id, organizacion_id, dia_semana, fecha,
                        hora_inicio, hora_fin, disponible,
                        tipo_horario, configuracion_especial,
                        creado_en, actualizado_en
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                `;

                await db.query(insertBaseQuery, [
                    profesionalId, organizacionId, nombreDia, fecha.toISOString().split('T')[0],
                    horarioDia.inicio, horarioDia.fin, true,
                    'regular',
                    JSON.stringify({
                        slots_generados: slots.length,
                        duracion_slot: duracion_slot_minutos,
                        descansos: horarioDia.descansos || [],
                        zona_horaria: zona_horaria,
                        generado_automaticamente: true
                    })
                ]);

                // Insertar slots de disponibilidad
                for (const slot of slots) {
                    const slotDateTime = new Date(`${fecha.toISOString().split('T')[0]}T${slot.hora_inicio}:00`);

                    const insertSlotQuery = `
                        INSERT INTO horarios_disponibilidad (
                            profesional_id, organizacion_id, fecha_hora_inicio, fecha_hora_fin,
                            duracion_minutos, estado, reservado_hasta,
                            creado_en, actualizado_en
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                    `;

                    const fechaHoraFin = new Date(slotDateTime.getTime() + duracion_slot_minutos * 60000);

                    await db.query(insertSlotQuery, [
                        profesionalId, organizacionId, slotDateTime, fechaHoraFin,
                        duracion_slot_minutos, 'disponible', null
                    ]);

                    horariosCreados++;
                }

                // Registrar resumen del día
                resumenPorDia[fecha.toISOString().split('T')[0]] = {
                    dia_semana: nombreDia,
                    slots_creados: slots.length,
                    hora_inicio: horarioDia.inicio,
                    hora_fin: horarioDia.fin,
                    descansos: horarioDia.descansos?.length || 0
                };
            }

            await db.query('COMMIT');

            const logger = require('../utils/logger');
            logger.info('Horarios generados automáticamente para profesional', {
                profesional_id: profesionalId,
                organizacion_id: organizacionId,
                nombre_profesional: profesional.nombre_completo,
                periodo: `${fechaInicioDate.toISOString().split('T')[0]} a ${fechaFinDate.toISOString().split('T')[0]}`,
                dias_procesados: diasProcesados,
                slots_creados: horariosCreados,
                duracion_slot: duracion_slot_minutos
            });

            return {
                profesional: {
                    id: profesionalId,
                    nombre: profesional.nombre_completo,
                    tipo: profesional.tipo_profesional
                },
                generacion: {
                    tipo: tipo_generacion,
                    fecha_inicio: fechaInicioDate.toISOString().split('T')[0],
                    fecha_fin: fechaFinDate.toISOString().split('T')[0],
                    zona_horaria: zona_horaria,
                    duracion_slot_minutos: duracion_slot_minutos
                },
                resultado: {
                    dias_procesados: diasProcesados,
                    slots_disponibles_creados: horariosCreados,
                    promedio_slots_por_dia: diasProcesados > 0 ? Math.round(horariosCreados / diasProcesados) : 0
                },
                configuracion: {
                    dias_laborables: dias_laborables,
                    horarios_aplicados: horariosFinales
                },
                resumen_por_dia: resumenPorDia,
                mensaje: `Se generaron ${horariosCreados} slots de disponibilidad en ${diasProcesados} días para ${profesional.nombre_completo}`
            };

        } catch (error) {
            await db.query('ROLLBACK');
            const logger = require('../utils/logger');
            logger.error('Error generando horarios automáticamente', {
                profesional_id: profesionalId,
                organizacion_id: organizacionId,
                error: error.message
            });
            throw new Error(`Error al generar horarios: ${error.message}`);
        } finally {
            db.release();
        }
    }

    /**
     * Utilidades para manejo de horarios
     */
    static timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    static minutesToTime(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    static obtenerNombreDia(diaNumero) {
        const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        return dias[diaNumero];
    }
}

module.exports = ProfesionalModel;