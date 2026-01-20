// Modelo de Servicios - CRUD multi-tenant con RLS

const RLSContextManager = require('../../../utils/rlsContextManager');
const {
    PlanLimitExceededError,
    DuplicateResourceError,
    InvalidProfessionalsError,
    ResourceInUseError
} = require('../../../utils/errors');
const { ErrorHelper } = require('../../../utils/helpers');

class ServicioModel {

    /**
     * Crear nuevo servicio
     * @param {number} organizacionId
     * @param {Object} data
     * @returns {Object}
     */
    static async crear(organizacionId, data) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // 1. Crear el servicio
            const query = `
                INSERT INTO servicios (
                    organizacion_id, nombre, descripcion, categoria,
                    subcategoria, duracion_minutos, precio, precio_minimo, precio_maximo,
                    requiere_preparacion_minutos, tiempo_limpieza_minutos, max_clientes_simultaneos,
                    color_servicio, configuracion_especifica, tags, activo, imagen_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING id, organizacion_id, nombre, descripcion, categoria,
                         subcategoria, duracion_minutos, precio, precio_minimo, precio_maximo,
                         requiere_preparacion_minutos, tiempo_limpieza_minutos, max_clientes_simultaneos,
                         color_servicio, configuracion_especifica, tags,
                         activo, imagen_url, creado_en, actualizado_en
            `;

            const values = [
                organizacionId,
                data.nombre,
                data.descripcion || null,
                data.categoria || null,
                data.subcategoria || null,
                data.duracion_minutos,
                data.precio,
                data.precio_minimo || null,
                data.precio_maximo || null,
                data.requiere_preparacion_minutos || 0,
                data.tiempo_limpieza_minutos || 5,
                data.max_clientes_simultaneos || 1,
                data.color_servicio || '#e74c3c',
                data.configuracion_especifica || {},
                data.tags || [],
                data.activo !== undefined ? data.activo : true,
                data.imagen_url || null
            ];

            try {
                const result = await db.query(query, values);
                const servicio = result.rows[0];

                // 2. Asociar profesionales si se proporcionan
                if (data.profesionales_ids && Array.isArray(data.profesionales_ids) && data.profesionales_ids.length > 0) {
                    // Validar que los profesionales existen y pertenecen a la organización
                    const validarProfesionalesQuery = `
                        SELECT id FROM profesionales
                        WHERE id = ANY($1::int[])
                          AND organizacion_id = $2
                          AND activo = true
                    `;
                    const profesionalesValidos = await db.query(validarProfesionalesQuery, [
                        data.profesionales_ids,
                        organizacionId
                    ]);

                    if (profesionalesValidos.rows.length !== data.profesionales_ids.length) {
                        ErrorHelper.throwValidation('Uno o más profesionales no existen o no pertenecen a esta organización');
                    }

                    // Asociar cada profesional al servicio
                    const asociarQuery = `
                        INSERT INTO servicios_profesionales (servicio_id, profesional_id, activo)
                        VALUES ($1, $2, true)
                    `;

                    for (const profesionalId of data.profesionales_ids) {
                        await db.query(asociarQuery, [servicio.id, profesionalId]);
                    }

                    // Obtener profesionales asociados para la respuesta
                    const profesionalesQuery = `
                        SELECT p.id, p.nombre_completo, p.email
                        FROM profesionales p
                        JOIN servicios_profesionales sp ON p.id = sp.profesional_id
                        WHERE sp.servicio_id = $1 AND sp.activo = true
                        ORDER BY p.nombre_completo
                    `;
                    const profesionalesResult = await db.query(profesionalesQuery, [servicio.id]);
                    servicio.profesionales = profesionalesResult.rows;
                }

                return servicio;

            } catch (error) {
                if (error.code === '23505') {
                    throw new DuplicateResourceError('Servicio', 'nombre');
                }
                if (error.code === '23514') {
                    ErrorHelper.throwValidation('Error de validación en los datos del servicio');
                }
                if (error.code === '23503') {
                    if (error.detail?.includes('organizacion_id')) {
                        ErrorHelper.throwIfNotFound(null, 'Organización');
                    }
                }
                throw error;
            }
        });
    }

    /**
     * Crea múltiples servicios en una transacción (ALL or NONE)
     * Pre-valida límite del plan ANTES de crear cualquier registro
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Array<Object>} servicios - Array de servicios a crear
     * @returns {Promise<Array>} - Servicios creados con profesionales asignados
     *
     * @throws {Error} - Si se excede el límite del plan (403)
     * @throws {Error} - Si hay nombres duplicados (409)
     * @throws {Error} - Si faltan datos requeridos (400)
     */
    static async crearBulk(organizacionId, servicios) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // ========== 1. PRE-VALIDAR LÍMITE DEL PLAN (ANTES DE CREAR) ==========
            const cantidadACrear = servicios.length;

            const verificarResult = await db.query(
                `SELECT verificar_limite_plan($1, $2, $3) as puede_crear`,
                [organizacionId, 'servicios', cantidadACrear]
            );

            if (!verificarResult.rows[0]?.puede_crear) {
                // Obtener detalles del plan para mensaje de error
                const detallesQuery = `
                    SELECT
                        ps.limite_servicios as limite,
                        m.uso_servicios as uso_actual,
                        ps.nombre_plan
                    FROM subscripciones s
                    JOIN planes_subscripcion ps ON s.plan_id = ps.id
                    LEFT JOIN metricas_uso_organizacion m ON m.organizacion_id = s.organizacion_id
                    WHERE s.organizacion_id = $1 AND s.activa = true
                `;
                const detalles = await db.query(detallesQuery, [organizacionId]);
                const { limite, uso_actual, nombre_plan } = detalles.rows[0] || {};

                throw new PlanLimitExceededError(
                    'servicios',
                    limite || 0,
                    uso_actual || 0,
                    nombre_plan || 'actual'
                );
            }

            // ========== 2. VALIDAR NOMBRES ÚNICOS DENTRO DEL BATCH ==========
            const nombresEnBatch = servicios.map(s => s.nombre.toLowerCase().trim());
            const nombresDuplicadosEnBatch = nombresEnBatch.filter(
                (nombre, index) => nombresEnBatch.indexOf(nombre) !== index
            );

            if (nombresDuplicadosEnBatch.length > 0) {
                throw new DuplicateResourceError(
                    'Servicio',
                    'nombre',
                    [...new Set(nombresDuplicadosEnBatch)].join(', ')
                );
            }

            // ========== 3. VALIDAR NOMBRES ÚNICOS EN LA BD ==========
            const nombresExistentesQuery = `
                SELECT nombre
                FROM servicios
                WHERE organizacion_id = $1 AND nombre = ANY($2::text[])
            `;
            const nombresExistentes = await db.query(nombresExistentesQuery, [
                organizacionId,
                servicios.map(s => s.nombre.trim())
            ]);

            if (nombresExistentes.rows.length > 0) {
                const duplicados = nombresExistentes.rows.map(r => r.nombre);
                throw new DuplicateResourceError(
                    'Servicio',
                    'nombre',
                    duplicados.join(', ')
                );
            }

            // ========== 4. CREAR TODOS LOS SERVICIOS ==========
            const serviciosCreados = [];

            for (const servicioData of servicios) {
                const query = `
                    INSERT INTO servicios (
                        organizacion_id, nombre, descripcion, categoria,
                        subcategoria, duracion_minutos, precio, precio_minimo, precio_maximo,
                        requiere_preparacion_minutos, tiempo_limpieza_minutos, max_clientes_simultaneos,
                        color_servicio, configuracion_especifica, tags, activo, imagen_url
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                    RETURNING id, organizacion_id, nombre, descripcion, categoria,
                             subcategoria, duracion_minutos, precio, precio_minimo, precio_maximo,
                             requiere_preparacion_minutos, tiempo_limpieza_minutos, max_clientes_simultaneos,
                             color_servicio, configuracion_especifica, tags,
                             activo, imagen_url, creado_en, actualizado_en
                `;

                const values = [
                    organizacionId,
                    servicioData.nombre.trim(),
                    servicioData.descripcion?.trim() || null,
                    servicioData.categoria?.trim() || null,
                    servicioData.subcategoria?.trim() || null,
                    servicioData.duracion_minutos,
                    servicioData.precio,
                    servicioData.precio_minimo || null,
                    servicioData.precio_maximo || null,
                    servicioData.requiere_preparacion_minutos || 0,
                    servicioData.tiempo_limpieza_minutos || 5,
                    servicioData.max_clientes_simultaneos || 1,
                    servicioData.color_servicio || '#e74c3c',
                    servicioData.configuracion_especifica || {},
                    servicioData.tags || [],
                    servicioData.activo !== undefined ? servicioData.activo : true,
                    servicioData.imagen_url || null
                ];

                const result = await db.query(query, values);
                serviciosCreados.push(result.rows[0]);
            }

            // ========== 5. ASIGNAR PROFESIONALES SI SE PROPORCIONAN ==========
            for (let i = 0; i < serviciosCreados.length; i++) {
                const servicio = serviciosCreados[i];
                const profesionalesAsignados = servicios[i].profesionales_asignados || [];

                if (profesionalesAsignados.length > 0) {
                    // Validar que los profesionales existen
                    const validarProfesionalesQuery = `
                        SELECT id FROM profesionales
                        WHERE id = ANY($1::int[])
                          AND organizacion_id = $2
                          AND activo = true
                    `;
                    const profesionalesValidos = await db.query(validarProfesionalesQuery, [
                        profesionalesAsignados,
                        organizacionId
                    ]);

                    if (profesionalesValidos.rows.length !== profesionalesAsignados.length) {
                        ErrorHelper.throwValidation(
                            `Servicio "${servicio.nombre}": Uno o más profesionales no existen o están inactivos`
                        );
                    }

                    // Asociar profesionales
                    const asociarQuery = `
                        INSERT INTO servicios_profesionales (servicio_id, profesional_id, activo)
                        VALUES ($1, $2, true)
                    `;

                    for (const profesionalId of profesionalesAsignados) {
                        await db.query(asociarQuery, [servicio.id, profesionalId]);
                    }
                }
            }

            // ========== 6. OBTENER DATOS ENRIQUECIDOS CON JOIN ==========
            const idsCreados = serviciosCreados.map(s => s.id);
            const serviciosEnriquecidosQuery = `
                SELECT
                    s.*,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', p.id,
                                'nombre_completo', p.nombre_completo,
                                'email', p.email
                            )
                        ) FILTER (WHERE p.id IS NOT NULL),
                        '[]'::json
                    ) as profesionales_asignados
                FROM servicios s
                LEFT JOIN servicios_profesionales sp ON s.id = sp.servicio_id AND sp.activo = true
                LEFT JOIN profesionales p ON sp.profesional_id = p.id
                WHERE s.id = ANY($1::int[])
                GROUP BY s.id
                ORDER BY s.id
            `;

            const serviciosEnriquecidos = await db.query(serviciosEnriquecidosQuery, [idsCreados]);

            return serviciosEnriquecidos.rows;
        });
    }

    /**
     * Obtener servicio por ID
     * @param {number} organizacionId
     * @param {number} id
     * @returns {Object|null}
     */
    static async buscarPorId(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT s.*,
                       COUNT(sp.profesional_id) as total_profesionales_asignados
                FROM servicios s
                LEFT JOIN servicios_profesionales sp ON s.id = sp.servicio_id AND sp.activo = true
                WHERE s.id = $1
                GROUP BY s.id
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    static async listar(organizacion_id, filtros = {}, paginacion = {}) {
        return await RLSContextManager.query(organizacion_id, async (db) => {
            const pagina = Math.max(1, parseInt(paginacion.pagina) || 1);
            const limite = Math.min(100, Math.max(1, parseInt(paginacion.limite) || 20));
            const offset = (pagina - 1) * limite;

            // Validación whitelist para ORDER BY (prevención SQL injection)
            const CAMPOS_ORDEN_PERMITIDOS = ['nombre', 'precio', 'duracion_minutos', 'creado_en', 'categoria', 'activo'];
            const orden = CAMPOS_ORDEN_PERMITIDOS.includes(paginacion.orden) ? paginacion.orden : 'nombre';
            const direccion = paginacion.direccion?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            // Construir condiciones WHERE dinámicamente
            const condiciones = ['s.organizacion_id = $1'];
            const valores = [organizacion_id];
            let parametroIndex = 2;

            // Usar != null para descartar tanto null como undefined
            if (filtros.activo != null) {
                condiciones.push(`s.activo = $${parametroIndex}`);
                valores.push(filtros.activo);
                parametroIndex++;
            }

            if (filtros.categoria) {
                condiciones.push(`s.categoria ILIKE $${parametroIndex}`);
                valores.push(`%${filtros.categoria}%`);
                parametroIndex++;
            }

            if (filtros.busqueda) {
                condiciones.push(`(
                    s.nombre ILIKE $${parametroIndex} OR
                    s.descripcion ILIKE $${parametroIndex} OR
                    s.categoria ILIKE $${parametroIndex} OR
                    s.subcategoria ILIKE $${parametroIndex}
                )`);
                valores.push(`%${filtros.busqueda}%`);
                parametroIndex++;
            }

            if (filtros.tags && Array.isArray(filtros.tags) && filtros.tags.length > 0) {
                condiciones.push(`s.tags && $${parametroIndex}`);
                valores.push(filtros.tags);
                parametroIndex++;
            }

            // FIX: Usar != null para verificar tanto null como undefined
            if (filtros.precio_min != null) {
                condiciones.push(`s.precio >= $${parametroIndex}`);
                valores.push(filtros.precio_min);
                parametroIndex++;
            }

            if (filtros.precio_max != null) {
                condiciones.push(`s.precio <= $${parametroIndex}`);
                valores.push(filtros.precio_max);
                parametroIndex++;
            }

            const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

            const queryServicios = `
                SELECT s.*,
                       COUNT(sp.profesional_id) as total_profesionales_asignados
                FROM servicios s
                LEFT JOIN servicios_profesionales sp ON s.id = sp.servicio_id AND sp.activo = true
                ${whereClause}
                GROUP BY s.id
                ORDER BY s.${orden} ${direccion}
                LIMIT $${parametroIndex} OFFSET $${parametroIndex + 1}
            `;

            valores.push(limite, offset);

            const queryTotal = `
                SELECT COUNT(DISTINCT s.id) as total
                FROM servicios s
                LEFT JOIN servicios_profesionales sp ON s.id = sp.servicio_id AND sp.activo = true
                ${whereClause}
            `;

            const valoresTotal = valores.slice(0, -2);

            const [resultServicios, resultTotal] = await Promise.all([
                db.query(queryServicios, valores),
                db.query(queryTotal, valoresTotal)
            ]);

            const total = parseInt(resultTotal.rows[0].total);
            const totalPaginas = Math.ceil(total / limite);

            return {
                servicios: resultServicios.rows,
                paginacion: {
                    pagina_actual: pagina,
                    total_paginas: totalPaginas,
                    total_elementos: total,
                    elementos_por_pagina: limite,
                    tiene_anterior: pagina > 1,
                    tiene_siguiente: pagina < totalPaginas
                },
                filtros_aplicados: filtros
            };
        });
    }

    /**
     * Actualizar servicio
     * @param {number} organizacionId
     * @param {number} id
     * @param {Object} data
     * @returns {Object|null}
     */
    static async actualizar(organizacionId, id, data) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposPermitidos = [
                'nombre', 'descripcion', 'categoria', 'subcategoria',
                'duracion_minutos', 'precio', 'precio_minimo', 'precio_maximo',
                'requiere_preparacion_minutos', 'tiempo_limpieza_minutos', 'max_clientes_simultaneos',
                'color_servicio', 'configuracion_especifica', 'tags', 'activo', 'imagen_url'
            ];

            const setClauses = [];
            const valores = [id];
            let parametroIndex = 2;

            for (const [campo, valor] of Object.entries(data)) {
                if (camposPermitidos.includes(campo) && valor !== undefined) {
                    setClauses.push(`${campo} = $${parametroIndex}`);
                    valores.push(valor);
                    parametroIndex++;
                }
            }

            if (setClauses.length === 0) {
                ErrorHelper.throwValidation('No hay campos válidos para actualizar');
            }

            const query = `
                UPDATE servicios
                SET ${setClauses.join(', ')}, actualizado_en = NOW()
                WHERE id = $1
                RETURNING id, organizacion_id, nombre, descripcion, categoria,
                         subcategoria, duracion_minutos, precio, precio_minimo, precio_maximo,
                         requiere_preparacion_minutos, tiempo_limpieza_minutos, max_clientes_simultaneos,
                         color_servicio, configuracion_especifica, tags,
                         activo, creado_en, actualizado_en
            `;

            try {
                const result = await db.query(query, valores);
                return result.rows[0] || null;
            } catch (error) {
                if (error.code === '23505') {
                    ErrorHelper.throwConflict('Ya existe un servicio con ese nombre en la organización');
                }
                if (error.code === '23514') {
                    ErrorHelper.throwValidation('Error de validación en los datos del servicio');
                }
                if (error.code === '23503') {
                    // Foreign key violation
                }
                throw error;
            }
        });
    }

    /**
     * Eliminar servicio (soft delete)
     * @param {number} organizacionId
     * @param {number} id
     * @returns {boolean}
     */
    static async eliminar(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE servicios
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rowCount > 0;
        });
    }

    /**
     * Eliminar servicio permanentemente
     * @param {number} organizacionId
     * @param {number} id
     * @returns {boolean}
     */
    static async eliminarPermanente(organizacionId, id) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `DELETE FROM servicios WHERE id = $1`;

            try {
                const result = await db.query(query, [id]);
                return result.rowCount > 0;
            } catch (error) {
                if (error.code === '23503') {
                    throw new ResourceInUseError('Servicio', 'citas');
                }
                throw error;
            }
        });
    }

    /**
     * Asignar profesional a servicio
     * @param {number} organizacionId
     * @param {number} servicioId
     * @param {number} profesionalId
     * @param {Object} configuracion
     * @returns {Object}
     */
    static async asignarProfesional(organizacionId, servicioId, profesionalId, configuracion = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                INSERT INTO servicios_profesionales (
                    servicio_id, profesional_id, precio_personalizado,
                    duracion_personalizada, notas_especiales, activo
                ) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (servicio_id, profesional_id)
                DO UPDATE SET
                    precio_personalizado = EXCLUDED.precio_personalizado,
                    duracion_personalizada = EXCLUDED.duracion_personalizada,
                    notas_especiales = EXCLUDED.notas_especiales,
                    activo = EXCLUDED.activo,
                    actualizado_en = NOW()
                RETURNING id, servicio_id, profesional_id, precio_personalizado,
                         duracion_personalizada, notas_especiales, activo, creado_en, actualizado_en
            `;

            const values = [
                servicioId,
                profesionalId,
                configuracion.precio_personalizado || null,
                configuracion.duracion_personalizada || null,
                configuracion.notas_especiales || null,
                configuracion.activo !== undefined ? configuracion.activo : true
            ];

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                if (error.code === '23503') {
                    if (error.detail.includes('servicio_id')) {
                        ErrorHelper.throwIfNotFound(null, 'Servicio');
                    }
                    if (error.detail.includes('profesional_id')) {
                        ErrorHelper.throwIfNotFound(null, 'Profesional');
                    }
                }
                throw error;
            }
        });
    }

    /**
     * Desasignar profesional de servicio
     * @param {number} organizacionId
     * @param {number} servicioId
     * @param {number} profesionalId
     * @returns {boolean}
     */
    static async desasignarProfesional(organizacionId, servicioId, profesionalId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE servicios_profesionales
                SET activo = false, actualizado_en = NOW()
                WHERE servicio_id = $1 AND profesional_id = $2
            `;

            const result = await db.query(query, [servicioId, profesionalId]);
            return result.rowCount > 0;
        });
    }

    /**
     * Obtener profesionales de un servicio
     * @param {number} organizacionId
     * @param {number} servicioId
     * @param {boolean} soloActivos
     * @returns {Array}
     */
    static async obtenerProfesionales(organizacionId, servicioId, soloActivos = true) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const condicionActivo = soloActivos ? 'AND sp.activo = true AND p.activo = true' : '';

            const query = `
                SELECT p.*,
                       sp.precio_personalizado,
                       sp.duracion_personalizada,
                       sp.notas_especiales,
                       sp.activo as asignacion_activa,
                       sp.creado_en as fecha_asignacion,
                       sp.actualizado_en as fecha_actualizacion_asignacion
                FROM profesionales p
                JOIN servicios_profesionales sp ON p.id = sp.profesional_id
                WHERE sp.servicio_id = $1 ${condicionActivo}
                ORDER BY p.nombre_completo
            `;

            const result = await db.query(query, [servicioId]);
            return result.rows;
        });
    }

    /**
     * Obtener servicios de un profesional
     * @param {number} organizacionId
     * @param {number} profesionalId
     * @param {boolean} soloActivos
     * @returns {Array}
     */
    static async obtenerServiciosPorProfesional(organizacionId, profesionalId, soloActivos = true) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const condicionActivo = soloActivos ? 'AND sp.activo = true AND s.activo = true' : '';

            const query = `
                SELECT s.*,
                       sp.precio_personalizado,
                       sp.duracion_personalizada,
                       sp.notas_especiales,
                       sp.activo as asignacion_activa,
                       COALESCE(sp.precio_personalizado, s.precio) as precio_efectivo,
                       COALESCE(sp.duracion_personalizada, s.duracion_minutos) as duracion_efectiva
                FROM servicios s
                JOIN servicios_profesionales sp ON s.id = sp.servicio_id
                WHERE sp.profesional_id = $1 ${condicionActivo}
                ORDER BY s.categoria, s.nombre
            `;

            const result = await db.query(query, [profesionalId]);
            return result.rows;
        });
    }

    static async buscar(termino, organizacion_id, opciones = {}) {
        return await RLSContextManager.query(organizacion_id, async (db) => {
            const limite = opciones.limite || 10;
            const condicionActivo = opciones.solo_activos !== false ? 'AND s.activo = true' : '';

            const query = `
                SELECT s.*,
                       ts_rank(to_tsvector('spanish', s.nombre || ' ' || COALESCE(s.descripcion, '') || ' ' ||
                                         COALESCE(s.categoria, '') || ' ' || COALESCE(s.subcategoria, '')),
                              plainto_tsquery('spanish', $1)) as relevancia
                FROM servicios s
                WHERE s.organizacion_id = $2
                AND to_tsvector('spanish', s.nombre || ' ' || COALESCE(s.descripcion, '') || ' ' ||
                               COALESCE(s.categoria, '') || ' ' || COALESCE(s.subcategoria, ''))
                    @@ plainto_tsquery('spanish', $1)
                ${condicionActivo}
                ORDER BY relevancia DESC, s.nombre
                LIMIT $3
            `;

            const result = await db.query(query, [termino, organizacion_id, limite]);
            return result.rows;
        });
    }

    static async obtenerEstadisticas(organizacion_id) {
        return await RLSContextManager.query(organizacion_id, async (db) => {
            const query = `
                SELECT
                    COUNT(*) as total_servicios,
                    COUNT(*) FILTER (WHERE s.activo = true) as servicios_activos,
                    COUNT(*) FILTER (WHERE s.activo = false) as servicios_inactivos,
                    COUNT(DISTINCT s.categoria) FILTER (WHERE s.categoria IS NOT NULL) as total_categorias,
                    AVG(s.precio) as precio_promedio,
                    MIN(s.precio) as precio_minimo,
                    MAX(s.precio) as precio_maximo,
                    AVG(s.duracion_minutos) as duracion_promedio,
                    COUNT(DISTINCT sp.profesional_id) as profesionales_con_servicios
                FROM servicios s
                LEFT JOIN servicios_profesionales sp ON s.id = sp.servicio_id AND sp.activo = true
                WHERE s.organizacion_id = $1
            `;

            const result = await db.query(query, [organizacion_id]);
            return result.rows[0];
        });
    }

    // =====================================================================
    // PRECIOS MULTI-MONEDA (Fase 4)
    // =====================================================================

    /**
     * Guarda precios en múltiples monedas para un servicio
     * Usa UPSERT para insertar o actualizar precios existentes
     *
     * @param {number} servicioId - ID del servicio
     * @param {Array} preciosMoneda - Array de objetos { moneda, precio, precio_minimo?, precio_maximo? }
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} - Precios guardados
     */
    static async guardarPreciosMoneda(servicioId, preciosMoneda, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            const preciosGuardados = [];

            for (const precioData of preciosMoneda) {
                const query = `
                    INSERT INTO precios_servicio_moneda (
                        servicio_id, moneda, precio, precio_minimo, precio_maximo,
                        organizacion_id, activo
                    ) VALUES ($1, $2, $3, $4, $5, $6, true)
                    ON CONFLICT (servicio_id, moneda)
                    DO UPDATE SET
                        precio = EXCLUDED.precio,
                        precio_minimo = EXCLUDED.precio_minimo,
                        precio_maximo = EXCLUDED.precio_maximo,
                        activo = true,
                        actualizado_en = NOW()
                    RETURNING id, servicio_id, moneda, precio, precio_minimo, precio_maximo, activo
                `;

                const values = [
                    servicioId,
                    precioData.moneda,
                    precioData.precio,
                    precioData.precio_minimo || null,
                    precioData.precio_maximo || null,
                    organizacionId
                ];

                const result = await db.query(query, values);
                preciosGuardados.push(result.rows[0]);
            }

            return preciosGuardados;
        });
    }

    /**
     * Obtiene los precios en múltiples monedas de un servicio
     *
     * @param {number} servicioId - ID del servicio
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} - Array de precios con info de moneda
     */
    static async obtenerPreciosMoneda(servicioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    psm.id,
                    psm.moneda,
                    psm.precio,
                    psm.precio_minimo,
                    psm.precio_maximo,
                    m.nombre as moneda_nombre,
                    m.simbolo as moneda_simbolo,
                    m.decimales as moneda_decimales
                FROM precios_servicio_moneda psm
                JOIN monedas m ON psm.moneda = m.codigo
                WHERE psm.servicio_id = $1 AND psm.activo = true
                ORDER BY m.orden
            `;

            const result = await db.query(query, [servicioId]);
            return result.rows;
        });
    }

    /**
     * Elimina (desactiva) un precio multi-moneda específico
     *
     * @param {number} servicioId - ID del servicio
     * @param {string} moneda - Código de moneda
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<boolean>} - true si se eliminó
     */
    static async eliminarPrecioMoneda(servicioId, moneda, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE precios_servicio_moneda
                SET activo = false, actualizado_en = NOW()
                WHERE servicio_id = $1 AND moneda = $2
            `;

            const result = await db.query(query, [servicioId, moneda]);
            return result.rowCount > 0;
        });
    }

    // =====================================================================
    // ROUND-ROBIN: ORDEN DE PROFESIONALES (Ene 2026)
    // =====================================================================

    /**
     * Obtiene profesionales de un servicio con orden de rotación
     * Incluye el campo orden_rotacion para UI de drag & drop
     *
     * @param {number} servicioId - ID del servicio
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} - Profesionales con orden
     */
    static async obtenerProfesionalesConOrden(servicioId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    p.id,
                    p.nombre_completo,
                    p.email,
                    p.foto_url,
                    p.calificacion_promedio,
                    sp.precio_personalizado,
                    sp.duracion_personalizada,
                    sp.orden_rotacion,
                    sp.activo as asignacion_activa
                FROM profesionales p
                JOIN servicios_profesionales sp ON p.id = sp.profesional_id
                WHERE sp.servicio_id = $1
                  AND sp.activo = true
                  AND p.activo = true
                ORDER BY sp.orden_rotacion ASC, p.id ASC
            `;

            const result = await db.query(query, [servicioId]);
            return result.rows;
        });
    }

    /**
     * Actualiza el orden de rotación de profesionales para un servicio
     * Usado por UI drag & drop para definir prioridad de asignación
     *
     * @param {number} servicioId - ID del servicio
     * @param {Array<{profesional_id: number, orden: number}>} ordenArray - Array con nuevo orden
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} - Profesionales actualizados con nuevo orden
     */
    static async actualizarOrdenProfesionales(servicioId, ordenArray, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Validar que el servicio existe
            const servicioCheck = await db.query(
                'SELECT id FROM servicios WHERE id = $1 AND organizacion_id = $2',
                [servicioId, organizacionId]
            );

            ErrorHelper.throwIfNotFound(servicioCheck.rows[0], 'Servicio');

            // Validar que todos los profesionales están asignados al servicio
            const profesionalesIds = ordenArray.map(item => item.profesional_id);
            const profesionalesValidos = await db.query(
                `SELECT profesional_id FROM servicios_profesionales
                 WHERE servicio_id = $1 AND profesional_id = ANY($2) AND activo = true`,
                [servicioId, profesionalesIds]
            );

            if (profesionalesValidos.rows.length !== profesionalesIds.length) {
                const idsValidos = profesionalesValidos.rows.map(r => r.profesional_id);
                const idsInvalidos = profesionalesIds.filter(id => !idsValidos.includes(id));
                ErrorHelper.throwValidation(`Profesionales no asignados al servicio: ${idsInvalidos.join(', ')}`);
            }

            // Actualizar orden para cada profesional
            for (const item of ordenArray) {
                await db.query(
                    `UPDATE servicios_profesionales
                     SET orden_rotacion = $1, actualizado_en = NOW()
                     WHERE servicio_id = $2 AND profesional_id = $3`,
                    [item.orden, servicioId, item.profesional_id]
                );
            }

            // Retornar lista actualizada
            const query = `
                SELECT
                    p.id,
                    p.nombre_completo,
                    p.email,
                    sp.orden_rotacion
                FROM profesionales p
                JOIN servicios_profesionales sp ON p.id = sp.profesional_id
                WHERE sp.servicio_id = $1 AND sp.activo = true
                ORDER BY sp.orden_rotacion ASC, p.id ASC
            `;

            const result = await db.query(query, [servicioId]);
            return result.rows;
        });
    }

    /**
     * Obtiene estadísticas de asignaciones servicio-profesional
     * Calcula métricas de servicios sin profesionales y viceversa
     *
     * @param {number} organizacion_id - ID de la organización
     * @returns {Promise<object>} - Estadísticas de asignaciones
     *
     * ⚠️ NOTA DE PERFORMANCE:
     * - Query usa CTEs para legibilidad
     * - Optimizado con COUNT FILTER en lugar de múltiples queries
     * - Para organizaciones con >1000 registros, considerar cache
     */
    static async obtenerEstadisticasAsignaciones(organizacion_id) {
        return await RLSContextManager.query(organizacion_id, async (db) => {
            const query = `
                WITH servicios_stats AS (
                    SELECT
                        s.id as servicio_id,
                        s.activo as servicio_activo,
                        COUNT(sp.id) FILTER (WHERE sp.activo = true) as profesionales_asignados
                    FROM servicios s
                    LEFT JOIN servicios_profesionales sp ON s.id = sp.servicio_id
                    WHERE s.organizacion_id = $1
                    GROUP BY s.id, s.activo
                ),
                profesionales_stats AS (
                    SELECT
                        p.id as profesional_id,
                        p.activo as profesional_activo,
                        COUNT(sp.id) FILTER (WHERE sp.activo = true) as servicios_asignados
                    FROM profesionales p
                    LEFT JOIN servicios_profesionales sp ON p.id = sp.profesional_id
                    WHERE p.organizacion_id = $1
                    GROUP BY p.id, p.activo
                )
                SELECT
                    -- Servicios
                    (SELECT COUNT(*) FROM servicios_stats) as total_servicios,
                    (SELECT COUNT(*) FROM servicios_stats WHERE servicio_activo = true) as servicios_activos,
                    (SELECT COUNT(*) FROM servicios_stats
                     WHERE servicio_activo = true AND profesionales_asignados = 0) as servicios_sin_profesional,

                    -- Profesionales
                    (SELECT COUNT(*) FROM profesionales_stats) as total_profesionales,
                    (SELECT COUNT(*) FROM profesionales_stats WHERE profesional_activo = true) as profesionales_activos,
                    (SELECT COUNT(*) FROM profesionales_stats
                     WHERE profesional_activo = true AND servicios_asignados = 0) as profesionales_sin_servicio,

                    -- Asignaciones
                    (SELECT COUNT(*) FROM servicios_profesionales
                     WHERE activo = true) as total_asignaciones_activas
            `;

            const result = await db.query(query, [organizacion_id]);

            // Convertir BigInt a Number para JSON serialization
            const stats = result.rows[0];
            return {
                total_servicios: parseInt(stats.total_servicios),
                servicios_activos: parseInt(stats.servicios_activos),
                servicios_sin_profesional: parseInt(stats.servicios_sin_profesional),
                total_profesionales: parseInt(stats.total_profesionales),
                profesionales_activos: parseInt(stats.profesionales_activos),
                profesionales_sin_servicio: parseInt(stats.profesionales_sin_servicio),
                total_asignaciones_activas: parseInt(stats.total_asignaciones_activas)
            };
        });
    }

}


module.exports = ServicioModel;
