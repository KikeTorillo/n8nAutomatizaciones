// Modelo de Servicios - CRUD multi-tenant con RLS directo

const { getDb } = require('../config/database');

class ServicioModel {

    static async crear(servicioData) {
        const db = await getDb();

        try {
            await db.query('BEGIN');
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', servicioData.organizacion_id.toString()]);

            // 1. Crear el servicio
            const query = `
                INSERT INTO servicios (
                    organizacion_id, plantilla_servicio_id, nombre, descripcion, categoria,
                    subcategoria, duracion_minutos, precio, precio_minimo, precio_maximo,
                    requiere_preparacion_minutos, tiempo_limpieza_minutos, max_clientes_simultaneos,
                    color_servicio, configuracion_especifica, tags, tipos_profesional_autorizados, activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                RETURNING id, organizacion_id, plantilla_servicio_id, nombre, descripcion, categoria,
                         subcategoria, duracion_minutos, precio, precio_minimo, precio_maximo,
                         requiere_preparacion_minutos, tiempo_limpieza_minutos, max_clientes_simultaneos,
                         color_servicio, configuracion_especifica, tags, tipos_profesional_autorizados,
                         activo, creado_en, actualizado_en
            `;

            const values = [
                servicioData.organizacion_id,
                servicioData.plantilla_servicio_id || null,
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
                    SELECT p.id, p.nombre_completo, p.email, p.tipo_profesional, p.especialidades
                    FROM profesionales p
                    JOIN servicios_profesionales sp ON p.id = sp.profesional_id
                    WHERE sp.servicio_id = $1 AND sp.activo = true
                    ORDER BY p.nombre_completo
                `;
                const profesionalesResult = await db.query(profesionalesQuery, [servicio.id]);
                servicio.profesionales = profesionalesResult.rows;
            }

            await db.query('COMMIT');
            return servicio;

        } catch (error) {
            await db.query('ROLLBACK');

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
                if (error.detail.includes('plantilla_servicio_id')) {
                    throw new Error('La plantilla de servicio especificada no existe');
                }
            }
            throw error;
        } finally {
            db.release();
        }
    }

    static async obtenerPorId(id, organizacion_id) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

            const query = `
                SELECT s.*,
                       ps.nombre as plantilla_nombre,
                       ps.categoria as plantilla_categoria,
                       COUNT(sp.profesional_id) as total_profesionales_asignados
                FROM servicios s
                LEFT JOIN plantillas_servicios ps ON s.plantilla_servicio_id = ps.id
                LEFT JOIN servicios_profesionales sp ON s.id = sp.servicio_id AND sp.activo = true
                WHERE s.id = $1
                GROUP BY s.id, ps.nombre, ps.categoria
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;

        } catch (error) {
            throw error;
        } finally {
            db.release();
        }
    }

    static async listar(organizacion_id, filtros = {}, paginacion = {}) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

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
                       ps.nombre as plantilla_nombre,
                       ps.categoria as plantilla_categoria,
                       COUNT(sp.profesional_id) as total_profesionales_asignados
                FROM servicios s
                LEFT JOIN plantillas_servicios ps ON s.plantilla_servicio_id = ps.id
                LEFT JOIN servicios_profesionales sp ON s.id = sp.servicio_id AND sp.activo = true
                ${whereClause}
                GROUP BY s.id, ps.nombre, ps.categoria
                ORDER BY s.${orden} ${direccion}
                LIMIT $${parametroIndex} OFFSET $${parametroIndex + 1}
            `;

            valores.push(limite, offset);

            const queryTotal = `
                SELECT COUNT(DISTINCT s.id) as total
                FROM servicios s
                LEFT JOIN plantillas_servicios ps ON s.plantilla_servicio_id = ps.id
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

        } catch (error) {
            throw error;
        } finally {
            db.release();
        }
    }

    static async actualizar(id, servicioData, organizacion_id) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

            const camposPermitidos = [
                'plantilla_servicio_id', 'nombre', 'descripcion', 'categoria', 'subcategoria',
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
                RETURNING id, organizacion_id, plantilla_servicio_id, nombre, descripcion, categoria,
                         subcategoria, duracion_minutos, precio, precio_minimo, precio_maximo,
                         requiere_preparacion_minutos, tiempo_limpieza_minutos, max_clientes_simultaneos,
                         color_servicio, configuracion_especifica, tags, tipos_profesional_autorizados,
                         activo, creado_en, actualizado_en
            `;

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
                if (error.detail.includes('plantilla_servicio_id')) {
                    throw new Error('La plantilla de servicio especificada no existe');
                }
            }
            throw error;
        } finally {
            db.release();
        }
    }

    static async eliminar(id, organizacion_id) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

            const query = `
                UPDATE servicios
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rowCount > 0;

        } catch (error) {
            throw error;
        } finally {
            db.release();
        }
    }

    static async eliminarPermanente(id, organizacion_id) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

            const query = `DELETE FROM servicios WHERE id = $1`;
            const result = await db.query(query, [id]);
            return result.rowCount > 0;

        } catch (error) {
            if (error.code === '23503') {
                throw new Error('No se puede eliminar el servicio porque tiene citas asociadas');
            }
            throw error;
        } finally {
            db.release();
        }
    }

    static async asignarProfesional(servicio_id, profesional_id, configuracion = {}, organizacion_id) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

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
        } finally {
            db.release();
        }
    }

    static async desasignarProfesional(servicio_id, profesional_id, organizacion_id) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

            const query = `
                UPDATE servicios_profesionales
                SET activo = false, actualizado_en = NOW()
                WHERE servicio_id = $1 AND profesional_id = $2
            `;

            const result = await db.query(query, [servicio_id, profesional_id]);
            return result.rowCount > 0;

        } catch (error) {
            throw error;
        } finally {
            db.release();
        }
    }

    static async obtenerProfesionales(servicio_id, organizacion_id, solo_activos = true) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

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

        } catch (error) {
            throw error;
        } finally {
            db.release();
        }
    }

    static async obtenerServiciosPorProfesional(profesional_id, organizacion_id, solo_activos = true) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

            const condicionActivo = solo_activos ? 'AND sp.activo = true AND s.activo = true' : '';

            const query = `
                SELECT s.*,
                       sp.precio_personalizado,
                       sp.duracion_personalizada,
                       sp.notas_especiales,
                       sp.activo as asignacion_activa,
                       COALESCE(sp.precio_personalizado, s.precio) as precio_efectivo,
                       COALESCE(sp.duracion_personalizada, s.duracion_minutos) as duracion_efectiva,
                       ps.nombre as plantilla_nombre
                FROM servicios s
                JOIN servicios_profesionales sp ON s.id = sp.servicio_id
                LEFT JOIN plantillas_servicios ps ON s.plantilla_servicio_id = ps.id
                WHERE sp.profesional_id = $1 ${condicionActivo}
                ORDER BY s.categoria, s.nombre
            `;

            const result = await db.query(query, [profesional_id]);
            return result.rows;

        } catch (error) {
            throw error;
        } finally {
            db.release();
        }
    }

    static async buscar(termino, organizacion_id, opciones = {}) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

            const limite = opciones.limite || 10;
            const condicionActivo = opciones.solo_activos !== false ? 'AND s.activo = true' : '';

            const query = `
                SELECT s.*,
                       ps.nombre as plantilla_nombre,
                       ts_rank(to_tsvector('spanish', s.nombre || ' ' || COALESCE(s.descripcion, '') || ' ' ||
                                         COALESCE(s.categoria, '') || ' ' || COALESCE(s.subcategoria, '')),
                              plainto_tsquery('spanish', $1)) as relevancia
                FROM servicios s
                LEFT JOIN plantillas_servicios ps ON s.plantilla_servicio_id = ps.id
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

        } catch (error) {
            throw error;
        } finally {
            db.release();
        }
    }

    static async obtenerEstadisticas(organizacion_id) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

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
                    COUNT(*) FILTER (WHERE s.plantilla_servicio_id IS NOT NULL) as servicios_con_plantilla,
                    COUNT(DISTINCT sp.profesional_id) as profesionales_con_servicios
                FROM servicios s
                LEFT JOIN servicios_profesionales sp ON s.id = sp.servicio_id AND sp.activo = true
                WHERE s.organizacion_id = $1
            `;

            const result = await db.query(query, [organizacion_id]);
            return result.rows[0];

        } catch (error) {
            throw error;
        } finally {
            db.release();
        }
    }

    // Combina datos de plantilla con configuración personalizada
    static async crearDesdeePlantilla(organizacion_id, plantilla_id, configuracion_personalizada = {}) {
        const db = await getDb();

        try {
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

            const queryPlantilla = `
                SELECT * FROM plantillas_servicios
                WHERE id = $1 AND estado = 'activa'
            `;
            const resultPlantilla = await db.query(queryPlantilla, [plantilla_id]);

            if (resultPlantilla.rows.length === 0) {
                throw new Error('Plantilla de servicio no encontrada o inactiva');
            }

            const plantilla = resultPlantilla.rows[0];

            // Combinar datos de plantilla con configuración personalizada
            const servicioData = {
                organizacion_id,
                plantilla_servicio_id: plantilla_id,
                nombre: configuracion_personalizada.nombre || plantilla.nombre,
                descripcion: configuracion_personalizada.descripcion || plantilla.descripcion,
                categoria: configuracion_personalizada.categoria || plantilla.categoria,
                subcategoria: configuracion_personalizada.subcategoria || plantilla.subcategoria,
                duracion_minutos: configuracion_personalizada.duracion_minutos || plantilla.duracion_estimada_minutos,
                precio: configuracion_personalizada.precio || plantilla.precio_sugerido,
                precio_minimo: configuracion_personalizada.precio_minimo || plantilla.precio_minimo,
                precio_maximo: configuracion_personalizada.precio_maximo || plantilla.precio_maximo,
                configuracion_especifica: {
                    ...plantilla.configuracion_adicional,
                    ...configuracion_personalizada.configuracion_especifica
                },
                tags: configuracion_personalizada.tags || plantilla.tags || [],
                tipos_profesional_autorizados: configuracion_personalizada.tipos_profesional_autorizados || plantilla.tipos_profesional_compatibles,
                ...configuracion_personalizada
            };

            return await this.crear(servicioData);

        } catch (error) {
            throw error;
        } finally {
            db.release();
        }
    }

}

module.exports = ServicioModel;
