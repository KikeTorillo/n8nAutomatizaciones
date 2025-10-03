/** Modelo de Cliente - Operaciones CRUD con RLS multi-tenant */

const { getDb } = require('../config/database');
const logger = require('../utils/logger');

class ClienteModel {

    /**
     * Crear cliente
     * @throws {Error} Constraint violations (email/teléfono duplicado, formato inválido)
     */
    static async crear(clienteData) {
        const client = await getDb();

        try {
            await client.query('BEGIN');

            // Configurar contexto RLS multi-tenant
            await client.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', clienteData.organizacion_id.toString()]);

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

            await client.query('COMMIT');
            return result.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
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

    /** Obtener cliente por ID */
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

    /** Listar clientes con paginación y filtros */
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

            const camposValidos = ['nombre', 'email', 'telefono', 'creado_en', 'actualizado_en'];
            const ordenValido = ['ASC', 'DESC'].includes(orden.toUpperCase()) ? orden.toUpperCase() : 'ASC';
            const campoOrden = camposValidos.includes(ordenPor) ? ordenPor : 'nombre';

            // Configurar contexto RLS
            await client.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            // Construir WHERE dinámico
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

            // Query principal con paginación
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
                client.query(countQuery, queryParams.slice(0, -2))
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
     * Actualizar cliente
     * @throws {Error} Constraint violations (email/teléfono duplicado)
     */
    static async actualizar(id, clienteData, organizacionId) {
        const client = await getDb();

        try {
            await client.query('BEGIN');

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

            await client.query('COMMIT');
            return result.rows.length > 0 ? result.rows[0] : null;

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('[ClienteModel.actualizar] Error:', error);

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

    /** Eliminar cliente (soft delete) */
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

    /** Buscar clientes por término (full-text search) */
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

    /** Obtener estadísticas de clientes */
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

    /** 🤖 CRÍTICO IA: Buscar cliente por teléfono (fuzzy search + normalización) */
    static async buscarPorTelefono(telefono, organizacionId, opciones = {}) {
        const client = await getDb();

        try {
            // Configurar contexto RLS
            await client.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const {
                exacto = false,
                incluir_inactivos = false,
                crear_si_no_existe = false
            } = opciones;

            // Normalizar teléfono - remover espacios, guiones, paréntesis
            const telefonoNormalizado = telefono
                .replace(/[\s\-\(\)\+]/g, '')
                .replace(/^52/, '') // Remover código de país México si existe
                .replace(/^1/, '');  // Remover código de país USA si existe

            logger.info('[ClienteModel.buscarPorTelefono] Iniciando búsqueda', {
                telefono_original: telefono,
                telefono_normalizado: telefonoNormalizado,
                organizacion_id: organizacionId,
                opciones: opciones
            });

            // Construir query base
            let baseQuery = `
                SELECT
                    id, organizacion_id, nombre, email, telefono,
                    fecha_nacimiento, profesional_preferido_id,
                    notas_especiales, alergias, direccion, como_conocio,
                    activo, marketing_permitido, creado_en, actualizado_en,
                    -- Calcular similaridad del teléfono
                    CASE
                        WHEN REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '(', '') = $1 THEN 1.0
                        WHEN REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '(', '') LIKE '%' || $1 || '%' THEN 0.8
                        WHEN similarity(REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '(', ''), $1) > 0.3 THEN
                            similarity(REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '(', ''), $1)
                        ELSE 0.0
                    END as similaridad_telefono
                FROM clientes
                WHERE organizacion_id = $2
            `;

            const queryParams = [telefonoNormalizado, organizacionId];

            // Agregar filtros
            if (!incluir_inactivos) {
                baseQuery += ` AND activo = true`;
            }

            if (exacto) {
                // Búsqueda exacta con múltiples variantes
                baseQuery += ` AND (
                    REPLACE(REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '(', ''), ')', '') = $1
                    OR REPLACE(REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '(', ''), ')', '') LIKE '%' || $1
                    OR $1 LIKE '%' || REPLACE(REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '(', ''), ')', '') || '%'
                )`;
            } else {
                // Búsqueda fuzzy más permisiva
                baseQuery += ` AND (
                    REPLACE(REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '(', ''), ')', '') = $1
                    OR REPLACE(REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '(', ''), ')', '') LIKE '%' || $1 || '%'
                    OR $1 LIKE '%' || REPLACE(REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '(', ''), ')', '') || '%'
                    OR similarity(REPLACE(REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '(', ''), ')', ''), $1) > 0.3
                )`;
            }

            baseQuery += `
                ORDER BY similaridad_telefono DESC, creado_en DESC
                LIMIT 5
            `;

            const result = await client.query(baseQuery, queryParams);

            // Preparar respuesta base
            let respuesta = {
                encontrado: result.rows.length > 0,
                total_coincidencias: result.rows.length,
                busqueda: {
                    telefono_original: telefono,
                    telefono_normalizado: telefonoNormalizado,
                    tipo_busqueda: exacto ? 'exacta' : 'fuzzy',
                    incluye_inactivos: incluir_inactivos
                },
                cliente: null,
                coincidencias_adicionales: [],
                accion_realizada: null
            };

            if (result.rows.length > 0) {
                // Cliente principal (mejor coincidencia)
                const mejorCoincidencia = result.rows[0];

                respuesta.cliente = {
                    ...mejorCoincidencia,
                    coincidencia: {
                        similaridad: parseFloat(mejorCoincidencia.similaridad_telefono),
                        es_exacta: mejorCoincidencia.similaridad_telefono === 1.0,
                        confianza: mejorCoincidencia.similaridad_telefono >= 0.8 ? 'alta' :
                                 mejorCoincidencia.similaridad_telefono >= 0.5 ? 'media' : 'baja'
                    }
                };

                // Coincidencias adicionales (si hay más de una)
                if (result.rows.length > 1) {
                    respuesta.coincidencias_adicionales = result.rows.slice(1).map(cliente => ({
                        id: cliente.id,
                        nombre: cliente.nombre,
                        telefono: cliente.telefono,
                        email: cliente.email,
                        activo: cliente.activo,
                        similaridad: parseFloat(cliente.similaridad_telefono)
                    }));
                }

                respuesta.accion_realizada = 'cliente_encontrado';

                logger.info('[ClienteModel.buscarPorTelefono] Cliente encontrado', {
                    cliente_id: mejorCoincidencia.id,
                    nombre: mejorCoincidencia.nombre,
                    similaridad: mejorCoincidencia.similaridad_telefono,
                    total_coincidencias: result.rows.length
                });

            } else if (crear_si_no_existe) {
                // Crear cliente básico con el teléfono
                try {
                    const clienteNuevo = await this.crear({
                        organizacion_id: organizacionId,
                        nombre: `Cliente ${telefonoNormalizado}`, // Nombre temporal
                        telefono: telefono, // Usar teléfono original
                        email: null,
                        notas_especiales: `Cliente creado automáticamente por IA desde teléfono ${telefono}`,
                        como_conocio: 'automatico_ia',
                        activo: true,
                        marketing_permitido: false
                    });

                    respuesta.encontrado = true;
                    respuesta.cliente = {
                        ...clienteNuevo,
                        coincidencia: {
                            similaridad: 1.0,
                            es_exacta: true,
                            confianza: 'alta',
                            creado_automaticamente: true
                        }
                    };
                    respuesta.accion_realizada = 'cliente_creado_automaticamente';

                    logger.info('[ClienteModel.buscarPorTelefono] Cliente creado automáticamente', {
                        cliente_id: clienteNuevo.id,
                        telefono: telefono,
                        organizacion_id: organizacionId
                    });

                } catch (createError) {
                    logger.error('[ClienteModel.buscarPorTelefono] Error creando cliente automáticamente', {
                        error: createError.message,
                        telefono: telefono
                    });

                    respuesta.accion_realizada = 'error_creacion_automatica';
                    respuesta.error = createError.message;
                }
            } else {
                respuesta.accion_realizada = 'cliente_no_encontrado';
                logger.info('[ClienteModel.buscarPorTelefono] Cliente no encontrado', {
                    telefono_normalizado: telefonoNormalizado,
                    organizacion_id: organizacionId
                });
            }

            return respuesta;

        } catch (error) {
            logger.error('[ClienteModel.buscarPorTelefono] Error:', {
                error: error.message,
                telefono: telefono,
                organizacion_id: organizacionId
            });
            throw error;
        } finally {
            client.release();
        }
    }

    /** 🤖 COMPLEMENTARIO IA: Buscar cliente por nombre (fuzzy search) */
    static async buscarPorNombre(nombre, organizacionId, limite = 10) {
        const client = await getDb();

        try {
            // Configurar contexto RLS
            await client.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const nombreNormalizado = nombre.trim().toLowerCase();

            const query = `
                SELECT
                    id, nombre, email, telefono, activo,
                    profesional_preferido_id, creado_en,
                    -- Calcular similaridad de nombre usando múltiples métodos
                    GREATEST(
                        similarity(LOWER(nombre), $1),
                        CASE
                            WHEN LOWER(nombre) LIKE '%' || $1 || '%' THEN 0.7
                            WHEN $1 LIKE '%' || LOWER(nombre) || '%' THEN 0.6
                            ELSE 0.0
                        END
                    ) as similaridad_nombre,
                    -- Indicar si es coincidencia exacta
                    CASE
                        WHEN LOWER(nombre) = $1 THEN true
                        ELSE false
                    END as coincidencia_exacta
                FROM clientes
                WHERE organizacion_id = $2
                  AND activo = true
                  AND (
                    similarity(LOWER(nombre), $1) > 0.2
                    OR LOWER(nombre) LIKE '%' || $1 || '%'
                    OR $1 LIKE '%' || LOWER(nombre) || '%'
                  )
                ORDER BY similaridad_nombre DESC, coincidencia_exacta DESC, nombre ASC
                LIMIT $3
            `;

            const result = await client.query(query, [nombreNormalizado, organizacionId, limite]);

            // Enriquecer resultados con metadata
            const clientes = result.rows.map(cliente => ({
                ...cliente,
                confianza: cliente.similaridad_nombre >= 0.7 ? 'alta' :
                          cliente.similaridad_nombre >= 0.4 ? 'media' : 'baja',
                similaridad: parseFloat(cliente.similaridad_nombre)
            }));

            logger.info('[ClienteModel.buscarPorNombre] Búsqueda completada', {
                nombre_busqueda: nombre,
                organizacion_id: organizacionId,
                resultados_encontrados: clientes.length,
                mejor_similaridad: clientes.length > 0 ? clientes[0].similaridad : 0
            });

            return clientes;

        } catch (error) {
            logger.error('[ClienteModel.buscarPorNombre] Error:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ClienteModel;