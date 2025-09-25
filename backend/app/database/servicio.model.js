/**
 * @fileoverview Modelo de Servicios para sistema multi-tenant SaaS
 * @description Maneja operaciones CRUD de servicios con RLS, validaciones automáticas y relaciones con profesionales
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const { getDb } = require('../config/database');

/**
 * Modelo Servicio - Operaciones de base de datos para servicios
 * @class ServicioModel
 */
class ServicioModel {

    /**
     * Crear un nuevo servicio con validaciones automáticas
     * @param {Object} servicioData - Datos del servicio
     * @param {number} servicioData.organizacion_id - ID de la organización (requerido)
     * @param {number} [servicioData.plantilla_servicio_id] - ID de plantilla para herencia
     * @param {string} servicioData.nombre - Nombre del servicio (requerido)
     * @param {string} [servicioData.descripcion] - Descripción detallada
     * @param {string} [servicioData.categoria] - Categoría principal
     * @param {string} [servicioData.subcategoria] - Subcategoría específica
     * @param {number} servicioData.duracion_minutos - Duración en minutos (requerido)
     * @param {number} servicioData.precio - Precio base (requerido)
     * @param {number} [servicioData.precio_minimo] - Precio mínimo permitido
     * @param {number} [servicioData.precio_maximo] - Precio máximo permitido
     * @param {number} [servicioData.requiere_preparacion_minutos] - Tiempo de preparación
     * @param {number} [servicioData.tiempo_limpieza_minutos] - Tiempo de limpieza
     * @param {number} [servicioData.max_clientes_simultaneos] - Máximo clientes simultáneos
     * @param {string} [servicioData.color_servicio] - Color hex para calendario
     * @param {Object} [servicioData.configuracion_especifica] - Configuración JSON específica
     * @param {Array} [servicioData.tags] - Etiquetas para búsqueda
     * @param {Array} [servicioData.tipos_profesional_autorizados] - Tipos de profesional autorizados
     * @param {boolean} [servicioData.activo] - Si el servicio está activo
     * @returns {Promise<Object>} Servicio creado
     * @throws {Error} Si hay errores de validación
     */
    static async crear(servicioData) {
        const db = await getDb();

        try {
            // Configurar contexto RLS multi-tenant
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', servicioData.organizacion_id.toString()]);

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
            return result.rows[0];

        } catch (error) {
            if (error.code === '23505') { // Duplicate key
                throw new Error('Ya existe un servicio con ese nombre en la organización');
            }
            if (error.code === '23514') { // Check constraint
                throw new Error('Error de validación en los datos del servicio');
            }
            if (error.code === '23503') { // Foreign key violation
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

    /**
     * Obtener servicio por ID con validación multi-tenant
     * @param {number} id - ID del servicio
     * @param {number} organizacion_id - ID de la organización para RLS
     * @returns {Promise<Object|null>} Servicio encontrado o null
     */
    static async obtenerPorId(id, organizacion_id) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
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

    /**
     * Listar servicios de una organización con filtros y paginación
     * @param {number} organizacion_id - ID de la organización
     * @param {Object} [filtros] - Filtros opcionales
     * @param {boolean} [filtros.activo] - Filtrar por estado activo
     * @param {string} [filtros.categoria] - Filtrar por categoría
     * @param {string} [filtros.busqueda] - Búsqueda por texto
     * @param {Array} [filtros.tags] - Filtrar por tags
     * @param {number} [filtros.precio_min] - Precio mínimo
     * @param {number} [filtros.precio_max] - Precio máximo
     * @param {Object} [paginacion] - Configuración de paginación
     * @param {number} [paginacion.pagina] - Número de página (default: 1)
     * @param {number} [paginacion.limite] - Elementos por página (default: 20)
     * @param {string} [paginacion.orden] - Campo de ordenamiento (default: 'nombre')
     * @param {string} [paginacion.direccion] - Dirección ASC|DESC (default: 'ASC')
     * @returns {Promise<Object>} Resultado con servicios y metadatos de paginación
     */
    static async listar(organizacion_id, filtros = {}, paginacion = {}) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

            // Configurar paginación
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

            // Query principal con JOIN a plantillas y conteo de profesionales
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

            // Query para contar total
            const queryTotal = `
                SELECT COUNT(DISTINCT s.id) as total
                FROM servicios s
                LEFT JOIN plantillas_servicios ps ON s.plantilla_servicio_id = ps.id
                LEFT JOIN servicios_profesionales sp ON s.id = sp.servicio_id AND sp.activo = true
                ${whereClause}
            `;

            const valoresTotal = valores.slice(0, -2); // Remover limite y offset para el conteo

            // Ejecutar ambas queries
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

    /**
     * Actualizar un servicio existente
     * @param {number} id - ID del servicio a actualizar
     * @param {Object} servicioData - Datos a actualizar
     * @param {number} organizacion_id - ID de la organización para RLS
     * @returns {Promise<Object|null>} Servicio actualizado o null si no existe
     */
    static async actualizar(id, servicioData, organizacion_id) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

            // Construir SET clause dinámicamente
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
            if (error.code === '23505') { // Duplicate key
                throw new Error('Ya existe un servicio con ese nombre en la organización');
            }
            if (error.code === '23514') { // Check constraint
                throw new Error('Error de validación en los datos del servicio');
            }
            if (error.code === '23503') { // Foreign key violation
                if (error.detail.includes('plantilla_servicio_id')) {
                    throw new Error('La plantilla de servicio especificada no existe');
                }
            }
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * Eliminar un servicio (soft delete - marcar como inactivo)
     * @param {number} id - ID del servicio a eliminar
     * @param {number} organizacion_id - ID de la organización para RLS
     * @returns {Promise<boolean>} true si se eliminó correctamente
     */
    static async eliminar(id, organizacion_id) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
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

    /**
     * Eliminar permanentemente un servicio (hard delete)
     * @param {number} id - ID del servicio a eliminar
     * @param {number} organizacion_id - ID de la organización para RLS
     * @returns {Promise<boolean>} true si se eliminó correctamente
     */
    static async eliminarPermanente(id, organizacion_id) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

            const query = `DELETE FROM servicios WHERE id = $1`;
            const result = await db.query(query, [id]);
            return result.rowCount > 0;

        } catch (error) {
            if (error.code === '23503') { // Foreign key violation
                throw new Error('No se puede eliminar el servicio porque tiene citas asociadas');
            }
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * Asignar un profesional a un servicio
     * @param {number} servicio_id - ID del servicio
     * @param {number} profesional_id - ID del profesional
     * @param {Object} [configuracion] - Configuración personalizada
     * @param {number} [configuracion.precio_personalizado] - Precio específico del profesional
     * @param {number} [configuracion.duracion_personalizada] - Duración específica del profesional
     * @param {string} [configuracion.notas_especiales] - Notas específicas
     * @param {boolean} [configuracion.activo] - Si la asignación está activa
     * @param {number} organizacion_id - ID de la organización para RLS
     * @returns {Promise<Object>} Relación servicio-profesional creada
     */
    static async asignarProfesional(servicio_id, profesional_id, configuracion = {}, organizacion_id) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
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
            if (error.code === '23503') { // Foreign key violation
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

    /**
     * Desasignar un profesional de un servicio
     * @param {number} servicio_id - ID del servicio
     * @param {number} profesional_id - ID del profesional
     * @param {number} organizacion_id - ID de la organización para RLS
     * @returns {Promise<boolean>} true si se desasignó correctamente
     */
    static async desasignarProfesional(servicio_id, profesional_id, organizacion_id) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
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

    /**
     * Obtener profesionales asignados a un servicio
     * @param {number} servicio_id - ID del servicio
     * @param {number} organizacion_id - ID de la organización para RLS
     * @param {boolean} [solo_activos] - Solo profesionales activos (default: true)
     * @returns {Promise<Array>} Lista de profesionales con su configuración específica
     */
    static async obtenerProfesionales(servicio_id, organizacion_id, solo_activos = true) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
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

    /**
     * Obtener servicios de un profesional
     * @param {number} profesional_id - ID del profesional
     * @param {number} organizacion_id - ID de la organización para RLS
     * @param {boolean} [solo_activos] - Solo servicios activos (default: true)
     * @returns {Promise<Array>} Lista de servicios con configuración específica del profesional
     */
    static async obtenerServiciosPorProfesional(profesional_id, organizacion_id, solo_activos = true) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
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

    /**
     * Buscar servicios con búsqueda full-text
     * @param {string} termino - Término de búsqueda
     * @param {number} organizacion_id - ID de la organización para RLS
     * @param {Object} [opciones] - Opciones adicionales
     * @param {number} [opciones.limite] - Límite de resultados (default: 10)
     * @param {boolean} [opciones.solo_activos] - Solo servicios activos (default: true)
     * @returns {Promise<Array>} Lista de servicios que coinciden con la búsqueda
     */
    static async buscar(termino, organizacion_id, opciones = {}) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
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

    /**
     * Obtener estadísticas de servicios para una organización
     * @param {number} organizacion_id - ID de la organización
     * @returns {Promise<Object>} Estadísticas de servicios
     */
    static async obtenerEstadisticas(organizacion_id) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

            const query = `
                SELECT 
                    COUNT(*) as total_servicios,
                    COUNT(*) FILTER (WHERE activo = true) as servicios_activos,
                    COUNT(*) FILTER (WHERE activo = false) as servicios_inactivos,
                    COUNT(DISTINCT categoria) FILTER (WHERE categoria IS NOT NULL) as total_categorias,
                    AVG(precio) as precio_promedio,
                    MIN(precio) as precio_minimo,
                    MAX(precio) as precio_maximo,
                    AVG(duracion_minutos) as duracion_promedio,
                    COUNT(*) FILTER (WHERE plantilla_servicio_id IS NOT NULL) as servicios_con_plantilla,
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

    /**
     * Crear servicio desde plantilla
     * @param {number} organizacion_id - ID de la organización
     * @param {number} plantilla_id - ID de la plantilla de servicio
     * @param {Object} [configuracion_personalizada] - Configuración específica que sobrescribe la plantilla
     * @returns {Promise<Object>} Servicio creado desde plantilla
     */
    static async crearDesdeePlantilla(organizacion_id, plantilla_id, configuracion_personalizada = {}) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacion_id.toString()]);

            // Primero obtener la plantilla
            const queryPlantilla = `
                SELECT * FROM plantillas_servicios
                WHERE id = $1 AND estado = 'activa'
            `;
            const resultPlantilla = await db.query(queryPlantilla, [plantilla_id]);

            if (resultPlantilla.rows.length === 0) {
                throw new Error('Plantilla de servicio no encontrada o inactiva');
            }

            const plantilla = resultPlantilla.rows[0];

            // Crear servicio combinando datos de plantilla y configuración personalizada
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

    /**
     * 🤖 CRÍTICO PARA IA: Búsqueda inteligente de servicios con múltiples algoritmos
     * Esta función es ESENCIAL para que la IA pueda encontrar servicios durante conversaciones
     * @param {string} termino - Término de búsqueda (puede ser parcial, coloquial, etc.)
     * @param {number} organizacionId - ID de la organización
     * @param {Object} opciones - Opciones de búsqueda inteligente
     * @param {number} opciones.profesional_id - ID del profesional específico (filtro)
     * @param {string} opciones.categoria - Filtro por categoría específica
     * @param {Array<number>} opciones.rango_precio - [min, max] precio
     * @param {Array<number>} opciones.rango_duracion - [min, max] minutos
     * @param {boolean} opciones.incluir_inactivos - Incluir servicios inactivos
     * @param {number} opciones.limite - Límite de resultados (default: 15)
     * @param {string} opciones.tipo_busqueda - 'exacta' | 'fuzzy' | 'semantica' | 'automatica'
     * @returns {Promise<Object>} Servicios encontrados con scoring de relevancia
     */
    static async busquedaInteligente(termino, organizacionId, opciones = {}) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)', ['app.current_tenant_id', organizacionId.toString()]);

            const {
                profesional_id = null,
                categoria = null,
                rango_precio = null,
                rango_duracion = null,
                incluir_inactivos = false,
                limite = 15,
                tipo_busqueda = 'automatica'
            } = opciones;

            const logger = require('../utils/logger');
            logger.info('[ServicioModel.busquedaInteligente] Iniciando búsqueda', {
                termino: termino,
                organizacion_id: organizacionId,
                tipo_busqueda: tipo_busqueda,
                opciones: opciones
            });

            // Normalizar término de búsqueda
            const terminoNormalizado = termino.toLowerCase().trim();
            const terminoSinAcentos = this.removerAcentos(terminoNormalizado);

            // Construir query base con múltiples algoritmos de puntuación
            let query = `
                WITH busqueda_servicios AS (
                    SELECT s.*,
                           ps.nombre as plantilla_nombre,
                           ps.tags as plantilla_tags,
                           -- Puntuación por coincidencia exacta (peso más alto)
                           CASE
                               WHEN LOWER(s.nombre) = $1 THEN 1.0
                               WHEN LOWER(s.nombre) LIKE $1 || '%' THEN 0.9
                               WHEN LOWER(s.nombre) LIKE '%' || $1 || '%' THEN 0.8
                               ELSE 0.0
                           END as score_nombre_exacto,

                           -- Puntuación por similaridad fonética/textual
                           GREATEST(
                               similarity(LOWER(s.nombre), $1),
                               similarity(LOWER(COALESCE(s.descripcion, '')), $1),
                               similarity(LOWER(COALESCE(s.categoria, '')), $1),
                               similarity(LOWER(COALESCE(s.subcategoria, '')), $1)
                           ) as score_similaridad,

                           -- Puntuación por full-text search (PostgreSQL nativo)
                           COALESCE(
                               ts_rank_cd(
                                   to_tsvector('spanish', s.nombre || ' ' || COALESCE(s.descripcion, '') || ' ' ||
                                              COALESCE(s.categoria, '') || ' ' || COALESCE(s.subcategoria, '') || ' ' ||
                                              COALESCE(array_to_string(s.tags, ' '), '')),
                                   plainto_tsquery('spanish', $1)
                               ), 0.0
                           ) as score_fulltext,

                           -- Puntuación por tags y palabras clave
                           CASE
                               WHEN s.tags IS NOT NULL AND array_to_string(s.tags, ' ') ILIKE '%' || $1 || '%' THEN 0.7
                               WHEN ps.tags IS NOT NULL AND array_to_string(ps.tags, ' ') ILIKE '%' || $1 || '%' THEN 0.6
                               ELSE 0.0
                           END as score_tags,

                           -- Puntuación por búsquedas semánticas/sinónimos comunes
                           ${this.generarScoreSinonimos(terminoNormalizado)} as score_sinonimos,

                           -- Información adicional para filtros
                           CASE WHEN sp.profesional_id IS NOT NULL THEN true ELSE false END as tiene_profesionales_asignados

                    FROM servicios s
                    LEFT JOIN plantillas_servicios ps ON s.plantilla_servicio_id = ps.id
                    LEFT JOIN servicios_profesionales sp ON s.id = sp.servicio_id AND sp.activo = true
                    WHERE s.organizacion_id = $2
            `;

            const queryParams = [terminoNormalizado, organizacionId];
            let paramCounter = 3;

            // Aplicar filtros dinámicos
            if (!incluir_inactivos) {
                query += ` AND s.activo = true`;
            }

            if (profesional_id) {
                query += ` AND sp.profesional_id = $${paramCounter}`;
                queryParams.push(profesional_id);
                paramCounter++;
            }

            if (categoria) {
                query += ` AND s.categoria ILIKE $${paramCounter}`;
                queryParams.push(`%${categoria}%`);
                paramCounter++;
            }

            if (rango_precio && rango_precio.length === 2) {
                query += ` AND s.precio BETWEEN $${paramCounter} AND $${paramCounter + 1}`;
                queryParams.push(rango_precio[0], rango_precio[1]);
                paramCounter += 2;
            }

            if (rango_duracion && rango_duracion.length === 2) {
                query += ` AND s.duracion_minutos BETWEEN $${paramCounter} AND $${paramCounter + 1}`;
                queryParams.push(rango_duracion[0], rango_duracion[1]);
                paramCounter += 2;
            }

            // Continuar con scoring y agrupación
            query += `
                ), scoring_final AS (
                    SELECT *,
                           -- Calcular puntuación combinada usando pesos inteligentes
                           GREATEST(
                               score_nombre_exacto * 10.0,     -- Peso máximo para coincidencias exactas
                               score_similaridad * 7.0,        -- Alto peso para similaridad
                               score_fulltext * 5.0,           -- Peso medio para full-text
                               score_tags * 4.0,               -- Peso para tags
                               score_sinonimos * 3.0           -- Peso para sinónimos
                           ) as puntuacion_final,

                           -- Calcular confianza de la coincidencia
                           CASE
                               WHEN score_nombre_exacto >= 0.8 THEN 'muy_alta'
                               WHEN score_nombre_exacto >= 0.5 OR score_similaridad >= 0.7 THEN 'alta'
                               WHEN score_similaridad >= 0.4 OR score_fulltext > 0.3 THEN 'media'
                               WHEN score_tags > 0.0 OR score_sinonimos > 0.0 THEN 'baja'
                               ELSE 'muy_baja'
                           END as confianza_match

                    FROM busqueda_servicios
                    WHERE (
                        score_nombre_exacto > 0.0 OR
                        score_similaridad > 0.2 OR
                        score_fulltext > 0.1 OR
                        score_tags > 0.0 OR
                        score_sinonimos > 0.0
                    )
                )
                SELECT
                    id, organizacion_id, nombre, descripcion, categoria, subcategoria,
                    duracion_minutos, precio, precio_minimo, precio_maximo,
                    tags, tipos_profesional_autorizados, activo,
                    plantilla_nombre, tiene_profesionales_asignados,
                    puntuacion_final, confianza_match,
                    score_nombre_exacto, score_similaridad, score_fulltext, score_tags, score_sinonimos,
                    creado_en, actualizado_en
                FROM scoring_final
                WHERE puntuacion_final > 0.5  -- Filtrar resultados con puntuación mínima
                ORDER BY puntuacion_final DESC, nombre ASC
                LIMIT $${paramCounter}
            `;

            queryParams.push(limite);

            // Ejecutar búsqueda principal
            const result = await db.query(query, queryParams);

            // Enriquecer resultados con metadata adicional
            const serviciosEncontrados = result.rows.map(servicio => ({
                ...servicio,
                puntuacion: parseFloat(servicio.puntuacion_final),
                match_breakdown: {
                    nombre_exacto: parseFloat(servicio.score_nombre_exacto),
                    similaridad: parseFloat(servicio.score_similaridad),
                    fulltext: parseFloat(servicio.score_fulltext),
                    tags: parseFloat(servicio.score_tags),
                    sinonimos: parseFloat(servicio.score_sinonimos)
                },
                recomendacion: servicio.confianza_match
            }));

            // Obtener también sugerencias si hay pocos resultados
            let sugerencias = [];
            if (serviciosEncontrados.length < 3) {
                sugerencias = await this.obtenerSugerenciasServicios(organizacionId, terminoNormalizado, 5);
            }

            const respuesta = {
                termino_busqueda: {
                    original: termino,
                    normalizado: terminoNormalizado,
                    sin_acentos: terminoSinAcentos
                },
                algoritmo_usado: tipo_busqueda,
                estadisticas: {
                    total_encontrados: serviciosEncontrados.length,
                    con_alta_confianza: serviciosEncontrados.filter(s => ['muy_alta', 'alta'].includes(s.confianza_match)).length,
                    puntuacion_maxima: serviciosEncontrados.length > 0 ? Math.max(...serviciosEncontrados.map(s => s.puntuacion)) : 0
                },
                servicios: serviciosEncontrados,
                sugerencias: sugerencias,
                filtros_aplicados: {
                    profesional_id,
                    categoria,
                    rango_precio,
                    rango_duracion,
                    incluye_inactivos: incluir_inactivos
                }
            };

            logger.info('[ServicioModel.busquedaInteligente] Búsqueda completada', {
                termino: termino,
                servicios_encontrados: serviciosEncontrados.length,
                mejor_puntuacion: respuesta.estadisticas.puntuacion_maxima,
                con_alta_confianza: respuesta.estadisticas.con_alta_confianza
            });

            return respuesta;

        } catch (error) {
            const logger = require('../utils/logger');
            logger.error('[ServicioModel.busquedaInteligente] Error:', {
                error: error.message,
                termino: termino,
                organizacion_id: organizacionId
            });
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * Generar scoring para sinónimos y términos semánticamente relacionados
     * @param {string} termino - Término normalizado
     * @returns {string} SQL CASE statement para scoring de sinónimos
     */
    static generarScoreSinonimos(termino) {
        // Diccionario de sinónimos común para servicios de belleza/salud
        const sinonimos = {
            'corte': ['cortar', 'tijera', 'cabello', 'pelo'],
            'barba': ['bigote', 'facial', 'afeitado', 'rasurado'],
            'manicure': ['manicura', 'uñas', 'manos', 'cutícula'],
            'pedicure': ['pedicura', 'pies', 'uñas pies'],
            'masaje': ['relajante', 'terapeutico', 'contractura', 'tension'],
            'facial': ['cara', 'rostro', 'limpieza facial', 'tratamiento facial'],
            'depilacion': ['depilado', 'cera', 'laser'],
            'tinte': ['color', 'coloracion', 'mechas', 'rayitos'],
            'peinado': ['estilo', 'styling', 'brushing'],
            'cejas': ['delineado cejas', 'microblading', 'henna'],
            'consulta': ['cita', 'revision', 'evaluacion'],
            'limpieza': ['higiene', 'profilaxis', 'pulido']
        };

        let caseClauses = [];

        for (const [palabra, relacionadas] of Object.entries(sinonimos)) {
            if (termino.includes(palabra)) {
                const condiciones = relacionadas.map(rel =>
                    `LOWER(s.nombre || ' ' || COALESCE(s.descripcion, '')) LIKE '%${rel}%'`
                ).join(' OR ');
                caseClauses.push(`WHEN (${condiciones}) THEN 0.6`);
            }

            // También buscar en sentido inverso
            if (relacionadas.some(rel => termino.includes(rel))) {
                caseClauses.push(`WHEN LOWER(s.nombre || ' ' || COALESCE(s.descripcion, '')) LIKE '%${palabra}%' THEN 0.6`);
            }
        }

        if (caseClauses.length === 0) {
            return '0.0';
        }

        return `CASE ${caseClauses.join(' ')} ELSE 0.0 END`;
    }

    /**
     * Obtener sugerencias de servicios populares cuando hay pocos resultados
     * @param {number} organizacionId - ID de la organización
     * @param {string} termino - Término de búsqueda original
     * @param {number} limite - Número de sugerencias
     * @returns {Promise<Array>} Lista de servicios sugeridos
     */
    static async obtenerSugerenciasServicios(organizacionId, termino, limite = 5) {
        const db = await getDb();

        try {
            const query = `
                SELECT s.id, s.nombre, s.categoria, s.precio, s.duracion_minutos,
                       COUNT(sp.profesional_id) as profesionales_disponibles
                FROM servicios s
                LEFT JOIN servicios_profesionales sp ON s.id = sp.servicio_id AND sp.activo = true
                WHERE s.organizacion_id = $1 AND s.activo = true
                GROUP BY s.id, s.nombre, s.categoria, s.precio, s.duracion_minutos
                ORDER BY profesionales_disponibles DESC, s.nombre ASC
                LIMIT $2
            `;

            const result = await db.query(query, [organizacionId, limite]);
            return result.rows;

        } catch (error) {
            return []; // Fallar silenciosamente para sugerencias
        } finally {
            db.release();
        }
    }

    /**
     * Utilidad para remover acentos de texto
     * @param {string} texto - Texto con acentos
     * @returns {string} Texto sin acentos
     */
    static removerAcentos(texto) {
        return texto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }
}

module.exports = ServicioModel;