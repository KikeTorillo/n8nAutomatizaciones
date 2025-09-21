/**
 * @fileoverview Modelo de Cliente para sistema multi-tenant SaaS
 * @description Maneja operaciones CRUD de clientes con RLS automático y validaciones
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const { getDb } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modelo Cliente - Operaciones de base de datos para clientes
 * Implementa diseño normalizado sin campos calculados para garantizar consistencia
 * @class ClienteModel
 */
class ClienteModel {

    /**
     * Crear un nuevo cliente con validaciones automáticas
     * @param {Object} clienteData - Datos del cliente
     * @param {number} clienteData.organizacion_id - ID de la organización (requerido)
     * @param {string} clienteData.nombre - Nombre completo del cliente
     * @param {string} [clienteData.email] - Email del cliente (único por organización)
     * @param {string} clienteData.telefono - Teléfono de contacto (único por organización)
     * @param {Date} [clienteData.fecha_nacimiento] - Fecha de nacimiento
     * @param {number} [clienteData.profesional_preferido_id] - ID del profesional preferido
     * @param {string} [clienteData.notas_especiales] - Notas especiales del cliente
     * @param {string} [clienteData.alergias] - Información médica de alergias
     * @param {string} [clienteData.direccion] - Dirección del cliente
     * @param {string} [clienteData.como_conocio] - Canal de adquisición
     * @param {boolean} [clienteData.activo=true] - Si el cliente está activo
     * @param {boolean} [clienteData.marketing_permitido=true] - Consent para marketing
     * @returns {Promise<Object>} Cliente creado
     * @throws {Error} Si hay errores de validación o constraints únicos
     */
    static async crear(clienteData) {
        const client = await getDb();

        try {
            // Configurar contexto RLS multi-tenant
            await client.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', clienteData.organizacion_id.toString()]);

            logger.info(`[ClienteModel.crear] Creando cliente para organización ${clienteData.organizacion_id}`);

            const query = `
                INSERT INTO clientes (
                    organizacion_id, nombre, email, telefono, fecha_nacimiento,
                    profesional_preferido_id, notas_especiales, alergias,
                    direccion, como_conocio, activo, marketing_permitido
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING
                    id, organizacion_id, nombre, email, telefono, fecha_nacimiento,
                    profesional_preferido_id, notas_especiales, alergias,
                    direccion, como_conocio, activo, marketing_permitido,
                    creado_en, actualizado_en
            `;

            const values = [
                clienteData.organizacion_id,
                clienteData.nombre,
                clienteData.email || null,
                clienteData.telefono,
                clienteData.fecha_nacimiento || null,
                clienteData.profesional_preferido_id || null,
                clienteData.notas_especiales || null,
                clienteData.alergias || null,
                clienteData.direccion || null,
                clienteData.como_conocio || null,
                clienteData.activo !== undefined ? clienteData.activo : true,
                clienteData.marketing_permitido !== undefined ? clienteData.marketing_permitido : true
            ];

            const result = await client.query(query, values);

            logger.info(`[ClienteModel.crear] Cliente creado exitosamente con ID: ${result.rows[0].id}`);
            return result.rows[0];

        } catch (error) {
            logger.error('[ClienteModel.crear] Error al crear cliente:', error);

            // Manejo específico de errores de constraints
            if (error.code === '23505') { // Unique violation
                if (error.constraint === 'unique_email_por_org') {
                    throw new Error(`El email ${clienteData.email} ya está registrado en esta organización`);
                }
                if (error.constraint === 'unique_telefono_por_org') {
                    throw new Error(`El teléfono ${clienteData.telefono} ya está registrado en esta organización`);
                }
            }

            // Manejo de errores de validación CHECK
            if (error.code === '23514') { // Check violation
                if (error.constraint === 'valid_email') {
                    throw new Error('El formato del email no es válido');
                }
                if (error.constraint === 'valid_telefono') {
                    throw new Error('El formato del teléfono no es válido');
                }
                if (error.constraint === 'valid_fecha_nacimiento') {
                    throw new Error('La fecha de nacimiento no es válida (debe ser mayor a 5 años)');
                }
            }

            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtener cliente por ID con contexto multi-tenant
     * @param {number} id - ID del cliente
     * @param {number} organizacionId - ID de la organización para RLS
     * @returns {Promise<Object|null>} Cliente encontrado o null
     */
    static async obtenerPorId(id, organizacionId) {
        const client = await getDb();

        try {
            // Configurar contexto RLS
            await client.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const query = `
                SELECT
                    id, organizacion_id, nombre, email, telefono, fecha_nacimiento,
                    profesional_preferido_id, notas_especiales, alergias,
                    direccion, como_conocio, activo, marketing_permitido,
                    creado_en, actualizado_en
                FROM clientes
                WHERE id = $1 AND activo = true
            `;

            const result = await client.query(query, [id]);
            return result.rows[0] || null;

        } catch (error) {
            logger.error('[ClienteModel.obtenerPorId] Error:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Listar clientes con paginación y filtros
     * @param {Object} options - Opciones de consulta
     * @param {number} options.organizacionId - ID de la organización
     * @param {number} [options.page=1] - Página actual
     * @param {number} [options.limit=20] - Elementos por página
     * @param {string} [options.busqueda] - Término de búsqueda (nombre, email, teléfono)
     * @param {boolean} [options.activos=true] - Solo clientes activos
     * @param {boolean} [options.marketing] - Filtrar por consent de marketing
     * @param {string} [options.ordenPor='nombre'] - Campo para ordenar
     * @param {string} [options.orden='ASC'] - Dirección del orden
     * @returns {Promise<Object>} Objeto con clientes y metadatos de paginación
     */
    static async listar(options = {}) {
        const client = await getDb();

        try {
            const {
                organizacionId,
                page = 1,
                limit = 20,
                busqueda,
                activos = true,
                marketing,
                ordenPor = 'nombre',
                orden = 'ASC'
            } = options;

            // Whitelist de campos válidos para ordenamiento (SEGURIDAD)
            const camposValidos = ['nombre', 'email', 'telefono', 'creado_en', 'actualizado_en'];
            const ordenValido = ['ASC', 'DESC'].includes(orden.toUpperCase()) ? orden.toUpperCase() : 'ASC';
            const campoOrden = camposValidos.includes(ordenPor) ? ordenPor : 'nombre';

            // Configurar contexto RLS
            await client.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            // Construir WHERE dinámico (SIN organizacion_id - RLS lo maneja automáticamente)
            let whereConditions = [];
            let queryParams = [];
            let paramIndex = 1;

            if (activos !== undefined) {
                whereConditions.push(`activo = $${paramIndex}`);
                queryParams.push(activos);
                paramIndex++;
            }

            if (marketing !== undefined) {
                whereConditions.push(`marketing_permitido = $${paramIndex}`);
                queryParams.push(marketing);
                paramIndex++;
            }

            if (busqueda) {
                whereConditions.push(`(
                    nombre ILIKE $${paramIndex} OR
                    email ILIKE $${paramIndex} OR
                    telefono ILIKE $${paramIndex}
                )`);
                queryParams.push(`%${busqueda}%`);
                paramIndex++;
            }

            const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

            // Query principal con paginación (ORDER BY seguro)
            const offset = (page - 1) * limit;
            const query = `
                SELECT
                    id, organizacion_id, nombre, email, telefono, fecha_nacimiento,
                    profesional_preferido_id, notas_especiales, alergias,
                    direccion, como_conocio, activo, marketing_permitido,
                    creado_en, actualizado_en
                FROM clientes
                ${whereClause}
                ORDER BY ${campoOrden} ${ordenValido}
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(limit, offset);

            // Query para contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM clientes
                ${whereClause}
            `;

            const [clientesResult, countResult] = await Promise.all([
                client.query(query, queryParams),
                client.query(countQuery, queryParams.slice(0, -2)) // Sin limit y offset para count
            ]);

            const total = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(total / limit);

            return {
                clientes: clientesResult.rows,
                paginacion: {
                    paginaActual: page,
                    totalPaginas: totalPages,
                    totalElementos: total,
                    elementosPorPagina: limit,
                    tieneAnterior: page > 1,
                    tieneSiguiente: page < totalPages
                }
            };

        } catch (error) {
            logger.error('[ClienteModel.listar] Error:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Actualizar cliente existente
     * @param {number} id - ID del cliente
     * @param {Object} clienteData - Datos a actualizar
     * @param {number} organizacionId - ID de la organización para RLS
     * @returns {Promise<Object|null>} Cliente actualizado o null si no existe
     */
    static async actualizar(id, clienteData, organizacionId) {
        const client = await getDb();

        try {
            // Configurar contexto RLS
            await client.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            // Construir SET dinámico para campos actualizables
            const camposActualizables = [
                'nombre', 'email', 'telefono', 'fecha_nacimiento',
                'profesional_preferido_id', 'notas_especiales', 'alergias',
                'direccion', 'como_conocio', 'activo', 'marketing_permitido'
            ];

            const setClauses = [];
            const queryParams = [id];
            let paramIndex = 2;

            for (const campo of camposActualizables) {
                if (clienteData.hasOwnProperty(campo)) {
                    setClauses.push(`${campo} = $${paramIndex}`);
                    queryParams.push(clienteData[campo]);
                    paramIndex++;
                }
            }

            if (setClauses.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            // Agregar timestamp de actualización
            setClauses.push(`actualizado_en = CURRENT_TIMESTAMP`);

            // CORREGIDO: WHERE con parámetros seguros (RLS maneja organizacion_id automáticamente)
            const query = `
                UPDATE clientes
                SET ${setClauses.join(', ')}
                WHERE id = $1
                RETURNING
                    id, organizacion_id, nombre, email, telefono, fecha_nacimiento,
                    profesional_preferido_id, notas_especiales, alergias,
                    direccion, como_conocio, activo, marketing_permitido,
                    creado_en, actualizado_en
            `;

            const result = await client.query(query, queryParams);

            if (result.rows.length === 0) {
                logger.warn(`[ClienteModel.actualizar] Cliente ${id} no encontrado en organización ${organizacionId}`);
                return null;
            }

            logger.info(`[ClienteModel.actualizar] Cliente ${id} actualizado exitosamente`);
            return result.rows[0];

        } catch (error) {
            logger.error('[ClienteModel.actualizar] Error:', error);

            // Manejo específico de errores de constraints (mismo que en crear)
            if (error.code === '23505') {
                if (error.constraint === 'unique_email_por_org') {
                    throw new Error(`El email ${clienteData.email} ya está registrado en esta organización`);
                }
                if (error.constraint === 'unique_telefono_por_org') {
                    throw new Error(`El teléfono ${clienteData.telefono} ya está registrado en esta organización`);
                }
            }

            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Eliminar cliente (soft delete - cambiar activo a false)
     * @param {number} id - ID del cliente
     * @param {number} organizacionId - ID de la organización para RLS
     * @returns {Promise<boolean>} true si se eliminó, false si no existe
     */
    static async eliminar(id, organizacionId) {
        const client = await getDb();

        try {
            // Configurar contexto RLS
            await client.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const query = `
                UPDATE clientes
                SET activo = false, actualizado_en = CURRENT_TIMESTAMP
                WHERE id = $1 AND activo = true
                RETURNING id
            `;

            const result = await client.query(query, [id]);

            if (result.rows.length === 0) {
                logger.warn(`[ClienteModel.eliminar] Cliente ${id} no encontrado en organización ${organizacionId}`);
                return false;
            }

            logger.info(`[ClienteModel.eliminar] Cliente ${id} eliminado (soft delete) exitosamente`);
            return true;

        } catch (error) {
            logger.error('[ClienteModel.eliminar] Error:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Buscar clientes por término de búsqueda con full-text search
     * @param {string} termino - Término de búsqueda
     * @param {number} organizacionId - ID de la organización
     * @param {number} [limit=10] - Límite de resultados
     * @returns {Promise<Array>} Lista de clientes encontrados
     */
    static async buscar(termino, organizacionId, limit = 10) {
        const client = await getDb();

        try {
            // Configurar contexto RLS
            await client.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const query = `
                SELECT
                    id, nombre, email, telefono,
                    ts_rank(to_tsvector('spanish', nombre), plainto_tsquery('spanish', $1)) as relevancia
                FROM clientes
                WHERE activo = true
                AND to_tsvector('spanish', nombre) @@ plainto_tsquery('spanish', $1)
                ORDER BY relevancia DESC, nombre ASC
                LIMIT $2
            `;

            const result = await client.query(query, [termino, limit]);
            return result.rows;

        } catch (error) {
            logger.error('[ClienteModel.buscar] Error:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtener estadísticas de clientes por organización
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Estadísticas de clientes
     */
    static async obtenerEstadisticas(organizacionId) {
        const client = await getDb();

        try {
            // Configurar contexto RLS
            await client.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const query = `
                SELECT
                    COUNT(*) as total_clientes,
                    COUNT(*) FILTER (WHERE activo = true) as clientes_activos,
                    COUNT(*) FILTER (WHERE activo = false) as clientes_inactivos,
                    COUNT(*) FILTER (WHERE marketing_permitido = true AND activo = true) as clientes_marketing,
                    COUNT(*) FILTER (WHERE email IS NOT NULL) as clientes_con_email,
                    COUNT(*) FILTER (WHERE profesional_preferido_id IS NOT NULL) as clientes_con_preferencia
                FROM clientes
            `;

            const result = await client.query(query);
            return result.rows[0];

        } catch (error) {
            logger.error('[ClienteModel.obtenerEstadisticas] Error:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ClienteModel;