const RLSContextManager = require('../../../utils/rlsContextManager');
const { PlanLimitExceededError, DuplicateResourceError } = require('../../../utils/errors');
const { ErrorHelper, LimitesHelper } = require('../../../utils/helpers');

class ProfesionalModel {

    static async crear(organizacionId, data) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            if (data.email) {
                const emailDisponible = await this.validarEmailDisponible(
                    data.email,
                    organizacionId,
                    null,
                    db
                );
                if (!emailDisponible) {
                    ErrorHelper.throwConflict('Ya existe un profesional con ese email en la organización');
                }
            }

            const query = `
                INSERT INTO profesionales (
                    organizacion_id, codigo, nombre_completo, email, telefono, foto_url,
                    fecha_nacimiento, documento_identidad, genero, direccion, estado_civil,
                    contacto_emergencia_nombre, contacto_emergencia_telefono,
                    estado, tipo_contratacion,
                    supervisor_id, departamento_id, puesto_id,
                    fecha_ingreso, licencias_profesionales,
                    años_experiencia, idiomas, disponible_online, color_calendario,
                    biografia, configuracion_horarios, configuracion_servicios,
                    salario_base, forma_pago,
                    usuario_id, activo,
                    -- Fase 1: Campos adicionales
                    numero_pasaporte, numero_seguro_social, nacionalidad,
                    lugar_nacimiento_ciudad, lugar_nacimiento_pais,
                    email_privado, telefono_privado, distancia_casa_trabajo_km,
                    hijos_dependientes, zona_horaria, responsable_rrhh_id,
                    codigo_nip, id_credencial,
                    -- GAP vs Odoo 19: Nuevos campos (Ene 2026)
                    categoria_pago_id, motivo_salida_id, fecha_baja,
                    ubicacion_lunes_id, ubicacion_martes_id, ubicacion_miercoles_id,
                    ubicacion_jueves_id, ubicacion_viernes_id, ubicacion_sabado_id,
                    ubicacion_domingo_id
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19,
                    $20, $21, $22, $23, $24, $25, $26, $27, $28,
                    $29, $30, $31, $32, $33, $34, $35, $36, $37,
                    $38, $39, $40, $41, $42, $43, $44, $45, $46,
                    $47, $48, $49, $50, $51, $52, $53, $54
                )
                RETURNING *
            `;

            const values = [
                organizacionId,
                data.codigo || null,
                data.nombre_completo,
                data.email || null,
                data.telefono || null,
                data.foto_url || null,
                data.fecha_nacimiento || null,
                data.documento_identidad || null,
                data.genero || 'no_especificado',
                data.direccion || null,
                data.estado_civil || null,
                data.contacto_emergencia_nombre || null,
                data.contacto_emergencia_telefono || null,
                data.estado || 'activo',
                data.tipo_contratacion || 'tiempo_completo',
                data.supervisor_id || null,
                data.departamento_id || null,
                data.puesto_id || null,
                data.fecha_ingreso || null,
                data.licencias_profesionales || {},
                data.años_experiencia || 0,
                data.idiomas || ['es'],
                data.disponible_online !== undefined ? data.disponible_online : false,
                data.color_calendario || '#753572',
                data.biografia || null,
                data.configuracion_horarios || {},
                data.configuracion_servicios || {},
                data.salario_base || null,
                data.forma_pago || 'comision',
                data.usuario_id || null,
                data.activo !== undefined ? data.activo : true,
                // Fase 1: Campos adicionales
                data.numero_pasaporte || null,
                data.numero_seguro_social || null,
                data.nacionalidad || null,
                data.lugar_nacimiento_ciudad || null,
                data.lugar_nacimiento_pais || null,
                data.email_privado || null,
                data.telefono_privado || null,
                data.distancia_casa_trabajo_km || null,
                data.hijos_dependientes || 0,
                data.zona_horaria || 'America/Mexico_City',
                data.responsable_rrhh_id || null,
                data.codigo_nip || null,
                data.id_credencial || null,
                // GAP vs Odoo 19: Nuevos campos (Ene 2026)
                data.categoria_pago_id || null,
                data.motivo_salida_id || null,
                data.fecha_baja || null,
                data.ubicacion_lunes_id || null,
                data.ubicacion_martes_id || null,
                data.ubicacion_miercoles_id || null,
                data.ubicacion_jueves_id || null,
                data.ubicacion_viernes_id || null,
                data.ubicacion_sabado_id || null,
                data.ubicacion_domingo_id || null
            ];

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                if (error.code === '23505') {
                    if (error.constraint && error.constraint.includes('email')) {
                        ErrorHelper.throwConflict('Ya existe un profesional con ese email en la organización');
                    }
                    if (error.constraint && error.constraint.includes('telefono')) {
                        ErrorHelper.throwConflict('Ya existe un profesional con ese teléfono en la organización');
                    }
                    ErrorHelper.throwConflict('El profesional ya existe con esos datos únicos');
                }
                if (error.code === '23514') {
                    if (error.constraint && error.constraint.includes('fecha_nacimiento')) {
                        ErrorHelper.throwValidation('El profesional debe ser mayor de 18 años');
                    }
                    if (error.constraint && error.constraint.includes('años_experiencia')) {
                        ErrorHelper.throwValidation('Los años de experiencia deben estar entre 0 y 70');
                    }
                    if (error.constraint && error.constraint.includes('calificacion_promedio')) {
                        ErrorHelper.throwValidation('La calificación debe estar entre 1.00 y 5.00');
                    }
                    if (error.constraint && error.constraint.includes('color_calendario')) {
                        ErrorHelper.throwValidation('El color debe ser un código hexadecimal válido');
                    }
                    ErrorHelper.throwValidation('Los datos del profesional no cumplen las validaciones requeridas');
                }
                if (error.code === '23503') {
                    if (error.constraint && error.constraint.includes('organizacion')) {
                        ErrorHelper.throwValidation('La organización especificada no existe');
                    }
                    ErrorHelper.throwValidation('Error de referencia en los datos del profesional');
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
            // Usa tablas nuevas: suscripciones_org, planes_suscripcion_org
            const cantidadACrear = profesionales.length;
            await LimitesHelper.verificarLimiteOLanzar(organizacionId, 'profesionales', cantidadACrear, db);

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
                    ErrorHelper.throwValidation(`Emails duplicados en la solicitud: ${emailsDuplicados.join(', ')}`);
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
                    ErrorHelper.throwConflict(`Los siguientes emails ya están en uso: ${emails}`);
                }
            }

            // 3. Crear todos los profesionales usando batch INSERT con UNNEST
            // Preparar arrays paralelos para inserción masiva
            const nombres = [];
            const emails = [];
            const telefonos = [];
            const colores = [];
            const fechasNacimiento = [];
            const documentos = [];
            const licencias = [];
            const experiencias = [];
            const idiomasArr = [];
            const biografias = [];
            const fotos = [];
            const serviciosPorIndice = []; // Para mapear después con profesionales creados

            for (const prof of profesionales) {
                nombres.push(prof.nombre_completo);
                emails.push(prof.email || null);
                telefonos.push(prof.telefono || null);
                colores.push(prof.color_calendario || '#753572');
                fechasNacimiento.push(prof.fecha_nacimiento || null);
                documentos.push(prof.documento_identidad || null);
                licencias.push(JSON.stringify(prof.licencias_profesionales || {}));
                experiencias.push(prof.años_experiencia || 0);
                idiomasArr.push(prof.idiomas || ['es']);
                biografias.push(prof.biografia || null);
                fotos.push(prof.foto_url || null);
                serviciosPorIndice.push(prof.servicios_asignados || []);
            }

            // Batch INSERT con UNNEST - de N queries a 1 query
            const batchInsertQuery = `
                INSERT INTO profesionales (
                    organizacion_id, nombre_completo, email, telefono,
                    color_calendario, activo, disponible_online,
                    fecha_nacimiento, documento_identidad,
                    licencias_profesionales, años_experiencia, idiomas, biografia, foto_url
                )
                SELECT
                    $1,
                    unnest($2::text[]),
                    unnest($3::text[]),
                    unnest($4::text[]),
                    unnest($5::text[]),
                    TRUE,
                    TRUE,
                    unnest($6::date[]),
                    unnest($7::text[]),
                    unnest($8::jsonb[]),
                    unnest($9::integer[]),
                    unnest($10::text[][]),
                    unnest($11::text[]),
                    unnest($12::text[])
                RETURNING id, organizacion_id, nombre_completo, email, telefono, fecha_nacimiento,
                         documento_identidad, color_calendario,
                         activo, disponible_online, creado_en, actualizado_en
            `;

            let profesionalesCreados;
            try {
                const result = await db.query(batchInsertQuery, [
                    organizacionId,
                    nombres,
                    emails,
                    telefonos,
                    colores,
                    fechasNacimiento,
                    documentos,
                    licencias,
                    experiencias,
                    idiomasArr,
                    biografias,
                    fotos
                ]);
                profesionalesCreados = result.rows;
            } catch (error) {
                // Manejar errores de constraint específicos
                if (error.code === '23514') {
                    ErrorHelper.throwValidation('Los datos de uno o más profesionales no cumplen las validaciones requeridas');
                }
                if (error.code === '23503') {
                    ErrorHelper.throwValidation('Error de referencia en los datos de profesionales');
                }
                throw error;
            }

            // 4. Asignar servicios en batch si hay alguno
            const serviciosAInsertar = [];
            profesionalesCreados.forEach((prof, index) => {
                const servicios = serviciosPorIndice[index];
                if (servicios && servicios.length > 0) {
                    servicios.forEach(servicioId => {
                        serviciosAInsertar.push({ profesionalId: prof.id, servicioId });
                    });
                }
            });

            if (serviciosAInsertar.length > 0) {
                const profesionalIds = serviciosAInsertar.map(s => s.profesionalId);
                const servicioIds = serviciosAInsertar.map(s => s.servicioId);

                // Batch INSERT de servicios - de N*M queries a 1 query
                const serviciosBatchQuery = `
                    INSERT INTO servicios_profesionales (profesional_id, servicio_id, activo)
                    SELECT unnest($1::integer[]), unnest($2::integer[]), TRUE
                    ON CONFLICT (profesional_id, servicio_id) DO NOTHING
                `;
                await db.query(serviciosBatchQuery, [profesionalIds, servicioIds]);
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

    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT p.id, p.organizacion_id, p.nombre_completo, p.email, p.telefono,
                       p.fecha_nacimiento, p.documento_identidad,
                       p.licencias_profesionales, p.años_experiencia,
                       p.idiomas, p.color_calendario, p.biografia, p.foto_url,
                       p.configuracion_horarios, p.configuracion_servicios,
                       p.salario_base, p.forma_pago,
                       p.activo, p.disponible_online, p.fecha_ingreso, p.fecha_salida,
                       p.motivo_inactividad, p.calificacion_promedio,
                       p.total_citas_completadas, p.total_clientes_atendidos,
                       p.usuario_id,
                       -- Dic 2025: Campos de clasificación y jerarquía
                       p.codigo, p.estado, p.tipo_contratacion,
                       p.supervisor_id, p.departamento_id, p.puesto_id,
                       p.genero, p.estado_civil, p.direccion,
                       p.contacto_emergencia_nombre, p.contacto_emergencia_telefono,
                       p.creado_en, p.actualizado_en,
                       -- Fase 1: Campos adicionales
                       p.numero_pasaporte, p.numero_seguro_social, p.nacionalidad,
                       p.lugar_nacimiento_ciudad, p.lugar_nacimiento_pais,
                       p.email_privado, p.telefono_privado, p.distancia_casa_trabajo_km,
                       p.hijos_dependientes, p.zona_horaria, p.responsable_rrhh_id,
                       p.codigo_nip, p.id_credencial,
                       -- GAP vs Odoo 19: Nuevos campos (Ene 2026)
                       p.categoria_pago_id, p.motivo_salida_id, p.fecha_baja,
                       p.ubicacion_lunes_id, p.ubicacion_martes_id, p.ubicacion_miercoles_id,
                       p.ubicacion_jueves_id, p.ubicacion_viernes_id, p.ubicacion_sabado_id,
                       p.ubicacion_domingo_id,
                       o.nombre_comercial as organizacion_nombre, o.categoria_id,
                       u.nombre as usuario_nombre, u.email as usuario_email, rol.codigo as usuario_rol,
                       -- Dic 2025: JOINs para nombres de relaciones
                       sup.nombre_completo as supervisor_nombre,
                       d.nombre as departamento_nombre,
                       pu.nombre as puesto_nombre,
                       rrhh.nombre as responsable_rrhh_nombre,
                       COUNT(sp.servicio_id) as total_servicios_asignados
                FROM profesionales p
                JOIN organizaciones o ON p.organizacion_id = o.id
                LEFT JOIN usuarios u ON p.usuario_id = u.id
                LEFT JOIN roles rol ON rol.id = u.rol_id
                LEFT JOIN profesionales sup ON p.supervisor_id = sup.id
                LEFT JOIN departamentos d ON p.departamento_id = d.id
                LEFT JOIN puestos pu ON p.puesto_id = pu.id
                LEFT JOIN usuarios rrhh ON p.responsable_rrhh_id = rrhh.id
                LEFT JOIN servicios_profesionales sp ON p.id = sp.profesional_id AND sp.activo = true
                WHERE p.id = $1 AND p.organizacion_id = $2
                GROUP BY p.id, o.id, u.id, rol.id, sup.id, d.id, pu.id, rrhh.id
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

    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                activo = null,
                disponible_online = null,
                busqueda = null,
                modulo = null, // Filtrar por módulo habilitado: 'agendamiento', 'pos', 'inventario'
                con_usuario = null, // Filtrar profesionales con/sin usuario vinculado
                // Dic 2025: Filtros de clasificación y jerarquía
                estado = null,
                tipo_contratacion = null,
                departamento_id = null,
                puesto_id = null,
                supervisor_id = null,
                // Filtro para supervisores (Dic 2025): usar rol_usuario
                rol_usuario = null, // Filtrar por rol del usuario vinculado (admin, propietario, empleado)
                // Ene 2026: Paginación
                page = 1,
                limite = 20,
                offset = null // Si se pasa offset directo, usarlo; si no, calcular desde page
            } = filtros;

            // Calcular offset desde page si no se pasa directamente
            const calculatedOffset = offset !== null ? offset : (parseInt(page) - 1) * parseInt(limite);
            const limitNum = parseInt(limite);

            // Construir WHERE clause (reutilizable para COUNT y SELECT)
            let whereClause = ` WHERE p.organizacion_id = $1`;
            const values = [organizacionId];
            let contador = 2;

            if (activo !== null) {
                whereClause += ` AND p.activo = $${contador}`;
                values.push(activo);
                contador++;
            }

            if (disponible_online !== null) {
                whereClause += ` AND p.disponible_online = $${contador}`;
                values.push(disponible_online);
                contador++;
            }

            if (busqueda) {
                whereClause += ` AND (p.nombre_completo ILIKE $${contador} OR p.email ILIKE $${contador})`;
                values.push(`%${busqueda}%`);
                contador++;
            }

            // Filtrar por módulo habilitado - DEPRECADO
            if (modulo) {
                console.warn('DEPRECADO: Filtro por modulo ya no usa modulos_acceso. Usar sistema de permisos normalizado.');
            }

            // Filtrar por usuario vinculado (Nov 2025)
            if (con_usuario === true) {
                whereClause += ` AND p.usuario_id IS NOT NULL`;
            } else if (con_usuario === false) {
                whereClause += ` AND p.usuario_id IS NULL`;
            }

            // Dic 2025: Filtro por rol del usuario vinculado (para supervisores)
            // FASE 7: Usa rol.codigo en vez de u.rol
            if (rol_usuario) {
                if (Array.isArray(rol_usuario)) {
                    whereClause += ` AND rol.codigo = ANY($${contador}::text[])`;
                    values.push(rol_usuario);
                } else {
                    whereClause += ` AND rol.codigo = $${contador}`;
                    values.push(rol_usuario);
                }
                contador++;
            }

            if (estado) {
                whereClause += ` AND p.estado = $${contador}`;
                values.push(estado);
                contador++;
            }

            if (tipo_contratacion) {
                whereClause += ` AND p.tipo_contratacion = $${contador}`;
                values.push(tipo_contratacion);
                contador++;
            }

            // Dic 2025: Filtros de jerarquía
            if (departamento_id) {
                whereClause += ` AND p.departamento_id = $${contador}`;
                values.push(departamento_id);
                contador++;
            }

            if (puesto_id) {
                whereClause += ` AND p.puesto_id = $${contador}`;
                values.push(puesto_id);
                contador++;
            }

            if (supervisor_id) {
                whereClause += ` AND p.supervisor_id = $${contador}`;
                values.push(supervisor_id);
                contador++;
            }

            // Query de conteo total (Ene 2026: para paginación)
            const countQuery = `
                SELECT COUNT(DISTINCT p.id) as total
                FROM profesionales p
                LEFT JOIN usuarios u ON p.usuario_id = u.id
                ${whereClause}
            `;
            const countResult = await db.query(countQuery, values);
            const total = parseInt(countResult.rows[0].total) || 0;

            // Query principal con datos
            const dataQuery = `
                SELECT p.id, p.organizacion_id, p.nombre_completo, p.email, p.telefono,
                       p.fecha_nacimiento, p.documento_identidad,
                       p.licencias_profesionales, p.años_experiencia,
                       p.idiomas, p.color_calendario, p.biografia, p.foto_url,
                       p.configuracion_horarios, p.configuracion_servicios,
                       p.salario_base, p.forma_pago,
                       p.activo, p.disponible_online, p.fecha_ingreso, p.fecha_salida,
                       p.motivo_inactividad, p.calificacion_promedio,
                       p.total_citas_completadas, p.total_clientes_atendidos,
                       p.usuario_id,
                       -- Dic 2025: Campos de clasificación y jerarquía
                       p.codigo, p.estado, p.tipo_contratacion,
                       p.supervisor_id, p.departamento_id, p.puesto_id,
                       p.creado_en, p.actualizado_en,
                       u.nombre as usuario_nombre, u.email as usuario_email, rol.codigo as usuario_rol,
                       -- Dic 2025: JOINs para nombres de relaciones
                       d.nombre as departamento_nombre,
                       pu.nombre as puesto_nombre,
                       COUNT(sp.servicio_id) as total_servicios_asignados
                FROM profesionales p
                LEFT JOIN usuarios u ON p.usuario_id = u.id
                LEFT JOIN roles rol ON rol.id = u.rol_id
                LEFT JOIN departamentos d ON p.departamento_id = d.id
                LEFT JOIN puestos pu ON p.puesto_id = pu.id
                LEFT JOIN servicios_profesionales sp ON p.id = sp.profesional_id AND sp.activo = true
                ${whereClause}
                GROUP BY p.id, u.id, rol.id, d.id, pu.id
                ORDER BY p.nombre_completo ASC
                LIMIT $${contador} OFFSET $${contador + 1}
            `;

            const dataValues = [...values, limitNum, calculatedOffset];
            const result = await db.query(dataQuery, dataValues);

            // Convertir total_servicios_asignados de string a number
            const profesionales = result.rows.map(row => ({
                ...row,
                total_servicios_asignados: parseInt(row.total_servicios_asignados, 10) || 0
            }));

            // Calcular información de paginación
            const currentPage = Math.floor(calculatedOffset / limitNum) + 1;
            const totalPages = Math.ceil(total / limitNum);

            return {
                profesionales,
                paginacion: {
                    page: currentPage,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNext: calculatedOffset + limitNum < total,
                    hasPrev: calculatedOffset > 0
                }
            };
        });
    }

    static async actualizar(organizacionId, id, data) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            if (data.email) {
                const emailDisponible = await this.validarEmailDisponible(
                    data.email,
                    organizacionId,
                    id,
                    db
                );
                if (!emailDisponible) {
                    ErrorHelper.throwConflict('Ya existe un profesional con ese email en la organización');
                }
            }

            const camposPermitidos = [
                // Identificación
                'codigo', 'nombre_completo', 'email', 'telefono', 'foto_url',
                // Información personal
                'fecha_nacimiento', 'documento_identidad', 'genero', 'direccion',
                'estado_civil', 'contacto_emergencia_nombre', 'contacto_emergencia_telefono',
                // Fase 1: Campos personales adicionales
                'numero_pasaporte', 'numero_seguro_social', 'nacionalidad',
                'lugar_nacimiento_ciudad', 'lugar_nacimiento_pais',
                'email_privado', 'telefono_privado', 'distancia_casa_trabajo_km',
                'hijos_dependientes',
                // Clasificación laboral
                'estado', 'tipo_contratacion',
                // Jerarquía
                'supervisor_id', 'departamento_id', 'puesto_id',
                // Fechas laborales
                'fecha_ingreso', 'fecha_baja', 'motivo_baja',
                // Información profesional
                'licencias_profesionales', 'años_experiencia', 'idiomas',
                // Configuración de agendamiento
                'disponible_online', 'color_calendario', 'biografia',
                'configuracion_horarios', 'configuracion_servicios',
                // Compensación (Info contractual - HR/Nómina)
                'salario_base', 'forma_pago',
                // Vinculación con usuario
                'usuario_id',
                // Fase 1: Configuración de sistema
                'zona_horaria', 'responsable_rrhh_id', 'codigo_nip', 'id_credencial',
                // Legacy
                'activo', 'fecha_salida', 'motivo_inactividad',
                // GAP vs Odoo 19: Nuevos campos (Ene 2026)
                'categoria_pago_id', 'motivo_salida_id',
                'ubicacion_lunes_id', 'ubicacion_martes_id', 'ubicacion_miercoles_id',
                'ubicacion_jueves_id', 'ubicacion_viernes_id', 'ubicacion_sabado_id',
                'ubicacion_domingo_id'
                // NOTA: modulos_acceso eliminado - usar sistema de permisos normalizado
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
                ErrorHelper.throwValidation('No hay campos válidos para actualizar');
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
                         salario_base, forma_pago,
                         activo, disponible_online, fecha_ingreso, fecha_salida,
                         motivo_inactividad, calificacion_promedio,
                         total_citas_completadas, total_clientes_atendidos,
                         codigo, estado, tipo_contratacion,
                         supervisor_id, departamento_id, puesto_id,
                         genero, estado_civil, direccion,
                         contacto_emergencia_nombre, contacto_emergencia_telefono,
                         numero_pasaporte, numero_seguro_social, nacionalidad,
                         lugar_nacimiento_ciudad, lugar_nacimiento_pais,
                         email_privado, telefono_privado, distancia_casa_trabajo_km,
                         hijos_dependientes, zona_horaria, responsable_rrhh_id,
                         codigo_nip, id_credencial,
                         categoria_pago_id, motivo_salida_id, fecha_baja,
                         ubicacion_lunes_id, ubicacion_martes_id, ubicacion_miercoles_id,
                         ubicacion_jueves_id, ubicacion_viernes_id, ubicacion_sabado_id,
                         ubicacion_domingo_id,
                         actualizado_en
            `;

            valores.push(id, organizacionId);

            const result = await db.query(query, valores);

            ErrorHelper.throwIfNotFound(result.rows[0], 'Profesional');
            return result.rows[0];
        });
    }

    static async cambiarEstado(organizacionId, id, activo, motivoInactividad = null) {
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

            ErrorHelper.throwIfNotFound(result.rows[0], 'Profesional');
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

            ErrorHelper.throwIfNotFound(result.rows[0], 'Profesional');
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

    static async eliminar(organizacionId, id, motivo = 'Eliminado por administrador') {
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
                    ErrorHelper.throwConflict(`El usuario ya está vinculado al profesional "${checkResult.rows[0].nombre_completo}"`);
                }
            }

            const query = `
                UPDATE profesionales
                SET usuario_id = $1, actualizado_en = NOW()
                WHERE id = $2 AND organizacion_id = $3
                RETURNING id, nombre_completo, usuario_id, actualizado_en
            `;

            const result = await db.query(query, [usuarioId, profesionalId, organizacionId]);

            ErrorHelper.throwIfNotFound(result.rows[0], 'Profesional');
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
            // FASE 7: Usa rol.codigo en vez de u.rol
            const query = `
                SELECT u.id, u.nombre, u.email, rol.codigo as rol_codigo
                FROM usuarios u
                LEFT JOIN roles rol ON rol.id = u.rol_id
                LEFT JOIN profesionales p ON u.id = p.usuario_id AND p.activo = TRUE
                WHERE u.organizacion_id = $1
                    AND u.activo = TRUE
                    AND p.id IS NULL
                    AND rol.codigo IN ('empleado', 'admin', 'gerente')
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
