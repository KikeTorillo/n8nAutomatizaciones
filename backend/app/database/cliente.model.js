/** Modelo de Cliente - Operaciones CRUD con RLS multi-tenant */

const RLSContextManager = require('../utils/rlsContextManager');

class ClienteModel {

    static async crear(clienteData) {
        return await RLSContextManager.query(clienteData.organizacion_id, async (db) => {
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

            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (error) {
                if (error.code === '23505') {
                    if (error.constraint === 'unique_email_por_org') {
                        throw new Error(`El email ${clienteData.email} ya está registrado en esta organización`);
                    }
                    if (error.constraint === 'unique_telefono_por_org') {
                        throw new Error(`El teléfono ${clienteData.telefono} ya está registrado en esta organización`);
                    }
                }

                if (error.code === '23514') {
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
            }
        });
    }

    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    id, organizacion_id, nombre, email, telefono, fecha_nacimiento,
                    profesional_preferido_id, notas_especiales, alergias,
                    direccion, como_conocio, activo, marketing_permitido,
                    creado_en, actualizado_en
                FROM clientes
                WHERE id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    static async listar(options = {}) {
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

        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposValidos = ['nombre', 'email', 'telefono', 'creado_en', 'actualizado_en'];
            const ordenValido = ['ASC', 'DESC'].includes(orden.toUpperCase()) ? orden.toUpperCase() : 'ASC';
            const campoOrden = camposValidos.includes(ordenPor) ? ordenPor : 'nombre';

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

            const countQuery = `
                SELECT COUNT(*) as total
                FROM clientes
                ${whereClause}
            `;

            const [clientesResult, countResult] = await Promise.all([
                db.query(query, queryParams),
                db.query(countQuery, queryParams.slice(0, -2))
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
        });
    }

    static async actualizar(id, clienteData, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
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

            try {
                const result = await db.query(query, queryParams);
                return result.rows.length > 0 ? result.rows[0] : null;
            } catch (error) {
                if (error.code === '23505') {
                    if (error.constraint === 'unique_email_por_org') {
                        throw new Error(`El email ${clienteData.email} ya está registrado en esta organización`);
                    }
                    if (error.constraint === 'unique_telefono_por_org') {
                        throw new Error(`El teléfono ${clienteData.telefono} ya está registrado en esta organización`);
                    }
                }

                throw error;
            }
        });
    }

    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE clientes
                SET activo = false, actualizado_en = CURRENT_TIMESTAMP
                WHERE id = $1 AND activo = true
                RETURNING id
            `;

            const result = await db.query(query, [id]);
            return result.rows.length > 0;
        });
    }

    static async buscar(termino, organizacionId, limit = 10) {
        return await RLSContextManager.query(organizacionId, async (db) => {
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

            const result = await db.query(query, [termino, limit]);
            return result.rows;
        });
    }

    static async obtenerEstadisticas(organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
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

            const result = await db.query(query);
            return result.rows[0];
        });
    }

    /** 🤖 IA: Buscar cliente por teléfono (fuzzy search + normalización) */
    static async buscarPorTelefono(telefono, organizacionId, opciones = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                exacto = false,
                incluir_inactivos = false,
                crear_si_no_existe = false
            } = opciones;

            const telefonoNormalizado = telefono
                .replace(/[\s\-\(\)\+]/g, '')
                .replace(/^52/, '')
                .replace(/^1/, '');

            let baseQuery = `
                SELECT
                    id, organizacion_id, nombre, email, telefono,
                    fecha_nacimiento, profesional_preferido_id,
                    notas_especiales, alergias, direccion, como_conocio,
                    activo, marketing_permitido, creado_en, actualizado_en,
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

            if (!incluir_inactivos) {
                baseQuery += ` AND activo = true`;
            }

            if (exacto) {
                baseQuery += ` AND (
                    REPLACE(REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '(', ''), ')', '') = $1
                    OR REPLACE(REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '(', ''), ')', '') LIKE '%' || $1
                    OR $1 LIKE '%' || REPLACE(REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '(', ''), ')', '') || '%'
                )`;
            } else {
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

            const result = await db.query(baseQuery, queryParams);

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

            } else if (crear_si_no_existe) {
                try {
                    // ✅ Llamar a this.crear() - cada método maneja su propia conexión
                    const clienteNuevo = await this.crear({
                        organizacion_id: organizacionId,
                        nombre: `Cliente ${telefonoNormalizado}`,
                        telefono: telefono,
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

                } catch (createError) {
                    respuesta.accion_realizada = 'error_creacion_automatica';
                    respuesta.error = createError.message;
                }
            } else {
                respuesta.accion_realizada = 'cliente_no_encontrado';
            }

            return respuesta;
        });
    }

    /** 🤖 IA: Buscar cliente por nombre (fuzzy search) */
    static async buscarPorNombre(nombre, organizacionId, limite = 10) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const nombreNormalizado = nombre.trim().toLowerCase();

            const query = `
                SELECT
                    id, nombre, email, telefono, activo,
                    profesional_preferido_id, creado_en,
                    GREATEST(
                        similarity(LOWER(nombre), $1),
                        CASE
                            WHEN LOWER(nombre) LIKE '%' || $1 || '%' THEN 0.7
                            WHEN $1 LIKE '%' || LOWER(nombre) || '%' THEN 0.6
                            ELSE 0.0
                        END
                    ) as similaridad_nombre,
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

            const result = await db.query(query, [nombreNormalizado, organizacionId, limite]);

            return result.rows.map(cliente => ({
                ...cliente,
                confianza: cliente.similaridad_nombre >= 0.7 ? 'alta' :
                          cliente.similaridad_nombre >= 0.4 ? 'media' : 'baja',
                similaridad: parseFloat(cliente.similaridad_nombre)
            }));
        });
    }
}

module.exports = ClienteModel;
