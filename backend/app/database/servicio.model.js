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
}

module.exports = ServicioModel;