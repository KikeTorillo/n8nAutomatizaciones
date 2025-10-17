const RLSContextManager = require('../utils/rlsContextManager');

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
                    organizacion_id, nombre_completo, email, telefono, fecha_nacimiento,
                    documento_identidad, tipo_profesional, licencias_profesionales,
                    años_experiencia, idiomas, color_calendario, biografia, foto_url,
                    configuracion_horarios, configuracion_servicios, comision_porcentaje,
                    salario_base, forma_pago, activo, disponible_online, fecha_ingreso
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                RETURNING id, organizacion_id, nombre_completo, email, telefono, fecha_nacimiento,
                         documento_identidad, tipo_profesional, licencias_profesionales,
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
                profesionalData.fecha_ingreso
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
                    if (error.constraint && error.constraint.includes('tipo_profesional')) {
                        throw new Error('Tipo de profesional incompatible con la industria de la organización');
                    }
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

    static async buscarPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT p.id, p.organizacion_id, p.nombre_completo, p.email, p.telefono,
                       p.fecha_nacimiento, p.documento_identidad, p.tipo_profesional,
                       p.licencias_profesionales, p.años_experiencia,
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
        });
    }

    static async listarPorOrganizacion(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                activo = null,
                disponible_online = null,
                tipo_profesional = null,
                busqueda = null,
                limite = 50,
                offset = 0
            } = filtros;

            let query = `
                SELECT p.id, p.organizacion_id, p.nombre_completo, p.email, p.telefono,
                       p.fecha_nacimiento, p.documento_identidad, p.tipo_profesional,
                       p.licencias_profesionales, p.años_experiencia,
                       p.idiomas, p.color_calendario, p.biografia, p.foto_url,
                       p.configuracion_horarios, p.configuracion_servicios,
                       p.comision_porcentaje, p.salario_base, p.forma_pago,
                       p.activo, p.disponible_online, p.fecha_ingreso, p.fecha_salida,
                       p.motivo_inactividad, p.calificacion_promedio,
                       p.total_citas_completadas, p.total_clientes_atendidos,
                       p.creado_en, p.actualizado_en
                FROM profesionales p
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
                'nombre_completo', 'email', 'telefono', 'fecha_nacimiento',
                'documento_identidad', 'tipo_profesional', 'licencias_profesionales',
                'años_experiencia', 'idiomas', 'color_calendario', 'biografia',
                'foto_url', 'configuracion_horarios', 'configuracion_servicios',
                'comision_porcentaje', 'salario_base', 'forma_pago', 'activo',
                'disponible_online', 'fecha_salida', 'motivo_inactividad'
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
                         fecha_nacimiento, documento_identidad, tipo_profesional,
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

    static async buscarPorTipo(organizacionId, tipoProfesional, soloActivos = true) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let query = `
                SELECT p.id, p.organizacion_id, p.nombre_completo, p.email, p.telefono,
                       p.fecha_nacimiento, p.documento_identidad, p.tipo_profesional,
                       p.licencias_profesionales, p.años_experiencia,
                       p.idiomas, p.color_calendario, p.biografia, p.foto_url,
                       p.configuracion_horarios, p.configuracion_servicios,
                       p.comision_porcentaje, p.salario_base, p.forma_pago,
                       p.activo, p.disponible_online, p.fecha_ingreso,
                       p.calificacion_promedio, p.total_citas_completadas,
                       p.total_clientes_atendidos, p.creado_en, p.actualizado_en
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
        });
    }

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
                    COUNT(DISTINCT tipo_profesional) as tipos_profesionales_diferentes,
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

}

module.exports = ProfesionalModel;
