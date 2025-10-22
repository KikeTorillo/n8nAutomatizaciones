// Modelo de Servicios - CRUD multi-tenant con RLS

const RLSContextManager = require('../utils/rlsContextManager');

class ServicioModel {

    static async crear(servicioData) {
        return await RLSContextManager.transaction(servicioData.organizacion_id, async (db) => {
            // 1. Crear el servicio
            const query = `
                INSERT INTO servicios (
                    organizacion_id, nombre, descripcion, categoria,
                    subcategoria, duracion_minutos, precio, precio_minimo, precio_maximo,
                    requiere_preparacion_minutos, tiempo_limpieza_minutos, max_clientes_simultaneos,
                    color_servicio, configuracion_especifica, tags, tipos_profesional_autorizados, activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING id, organizacion_id, nombre, descripcion, categoria,
                         subcategoria, duracion_minutos, precio, precio_minimo, precio_maximo,
                         requiere_preparacion_minutos, tiempo_limpieza_minutos, max_clientes_simultaneos,
                         color_servicio, configuracion_especifica, tags, tipos_profesional_autorizados,
                         activo, creado_en, actualizado_en
            `;

            const values = [
                servicioData.organizacion_id,
                servicioData.nombre,
                servicioData.descripcion || null,
                servicioData.categoria || null,
                servicioData.subcategoria || null,
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
                servicioData.tipos_profesional_autorizados || null,
                servicioData.activo !== undefined ? servicioData.activo : true
            ];

            try {
                const result = await db.query(query, values);
                const servicio = result.rows[0];

                // 2. Asociar profesionales si se proporcionan
                if (servicioData.profesionales_ids && Array.isArray(servicioData.profesionales_ids) && servicioData.profesionales_ids.length > 0) {
                    // Validar que los profesionales existen y pertenecen a la organización
                    const validarProfesionalesQuery = `
                        SELECT id FROM profesionales
                        WHERE id = ANY($1::int[])
                          AND organizacion_id = $2
                          AND activo = true
                    `;
                    const profesionalesValidos = await db.query(validarProfesionalesQuery, [
                        servicioData.profesionales_ids,
                        servicioData.organizacion_id
                    ]);

                    if (profesionalesValidos.rows.length !== servicioData.profesionales_ids.length) {
                        throw new Error('Uno o más profesionales no existen o no pertenecen a esta organización');
                    }

                    // Asociar cada profesional al servicio
                    const asociarQuery = `
                        INSERT INTO servicios_profesionales (servicio_id, profesional_id, activo)
                        VALUES ($1, $2, true)
                    `;

                    for (const profesionalId of servicioData.profesionales_ids) {
                        await db.query(asociarQuery, [servicio.id, profesionalId]);
                    }

                    // Obtener profesionales asociados para la respuesta
                    const profesionalesQuery = `
                        SELECT p.id, p.nombre_completo, p.email, p.tipo_profesional_id
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
                    throw new Error('Ya existe un servicio con ese nombre en la organización');
                }
                if (error.code === '23514') {
                    throw new Error('Error de validación en los datos del servicio');
                }
                if (error.code === '23503') {
                    if (error.detail.includes('organizacion_id')) {
                        throw new Error('La organización especificada no existe');
                    }
                }
                throw error;
            }
        });
    }

    static async obtenerPorId(id, organizacion_id) {
        return await RLSContextManager.query(organizacion_id, async (db) => {
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
            const orden = paginacion.orden || 'nombre';
            const direccion = (paginacion.direccion || 'ASC').toUpperCase();

            // Construir condiciones WHERE dinámicamente
            const condiciones = ['s.organizacion_id = $1'];
            const valores = [organizacion_id];
            let parametroIndex = 2;

            if (filtros.activo !== undefined) {
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

            if (filtros.precio_min !== undefined) {
                condiciones.push(`s.precio >= $${parametroIndex}`);
                valores.push(filtros.precio_min);
                parametroIndex++;
            }

            if (filtros.precio_max !== undefined) {
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

    static async actualizar(id, servicioData, organizacion_id) {
        return await RLSContextManager.query(organizacion_id, async (db) => {
            const camposPermitidos = [
                'nombre', 'descripcion', 'categoria', 'subcategoria',
                'duracion_minutos', 'precio', 'precio_minimo', 'precio_maximo',
                'requiere_preparacion_minutos', 'tiempo_limpieza_minutos', 'max_clientes_simultaneos',
                'color_servicio', 'configuracion_especifica', 'tags', 'tipos_profesional_autorizados', 'activo'
            ];

            const setClauses = [];
            const valores = [id];
            let parametroIndex = 2;

            for (const [campo, valor] of Object.entries(servicioData)) {
                if (camposPermitidos.includes(campo) && valor !== undefined) {
                    setClauses.push(`${campo} = $${parametroIndex}`);
                    valores.push(valor);
                    parametroIndex++;
                }
            }

            if (setClauses.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            const query = `
                UPDATE servicios
                SET ${setClauses.join(', ')}, actualizado_en = NOW()
                WHERE id = $1
                RETURNING id, organizacion_id, nombre, descripcion, categoria,
                         subcategoria, duracion_minutos, precio, precio_minimo, precio_maximo,
                         requiere_preparacion_minutos, tiempo_limpieza_minutos, max_clientes_simultaneos,
                         color_servicio, configuracion_especifica, tags, tipos_profesional_autorizados,
                         activo, creado_en, actualizado_en
            `;

            try {
                const result = await db.query(query, valores);
                return result.rows[0] || null;
            } catch (error) {
                if (error.code === '23505') {
                    throw new Error('Ya existe un servicio con ese nombre en la organización');
                }
                if (error.code === '23514') {
                    throw new Error('Error de validación en los datos del servicio');
                }
                if (error.code === '23503') {
                    // Foreign key violation
                }
                throw error;
            }
        });
    }

    static async eliminar(id, organizacion_id) {
        return await RLSContextManager.query(organizacion_id, async (db) => {
            const query = `
                UPDATE servicios
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rowCount > 0;
        });
    }

    static async eliminarPermanente(id, organizacion_id) {
        return await RLSContextManager.query(organizacion_id, async (db) => {
            const query = `DELETE FROM servicios WHERE id = $1`;

            try {
                const result = await db.query(query, [id]);
                return result.rowCount > 0;
            } catch (error) {
                if (error.code === '23503') {
                    throw new Error('No se puede eliminar el servicio porque tiene citas asociadas');
                }
                throw error;
            }
        });
    }

    static async asignarProfesional(servicio_id, profesional_id, configuracion = {}, organizacion_id) {
        return await RLSContextManager.query(organizacion_id, async (db) => {
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
                servicio_id,
                profesional_id,
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
                        throw new Error('El servicio especificado no existe');
                    }
                    if (error.detail.includes('profesional_id')) {
                        throw new Error('El profesional especificado no existe');
                    }
                }
                throw error;
            }
        });
    }

    static async desasignarProfesional(servicio_id, profesional_id, organizacion_id) {
        return await RLSContextManager.query(organizacion_id, async (db) => {
            const query = `
                UPDATE servicios_profesionales
                SET activo = false, actualizado_en = NOW()
                WHERE servicio_id = $1 AND profesional_id = $2
            `;

            const result = await db.query(query, [servicio_id, profesional_id]);
            return result.rowCount > 0;
        });
    }

    static async obtenerProfesionales(servicio_id, organizacion_id, solo_activos = true) {
        return await RLSContextManager.query(organizacion_id, async (db) => {
            const condicionActivo = solo_activos ? 'AND sp.activo = true AND p.activo = true' : '';

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

            const result = await db.query(query, [servicio_id]);
            return result.rows;
        });
    }

    static async obtenerServiciosPorProfesional(profesional_id, organizacion_id, solo_activos = true) {
        return await RLSContextManager.query(organizacion_id, async (db) => {
            const condicionActivo = solo_activos ? 'AND sp.activo = true AND s.activo = true' : '';

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

            const result = await db.query(query, [profesional_id]);
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
