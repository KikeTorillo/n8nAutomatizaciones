/**
 * ====================================================================
 * MODELO CLIENTE - MÓDULO CORE
 * ====================================================================
 *
 * Modelo de Cliente como módulo Core compartido (patrón Odoo/Salesforce).
 * Los clientes son un recurso transversal usado por:
 * - Agendamiento (citas)
 * - POS (ventas)
 * - Marketplace (reseñas)
 * - Chatbots (identificación)
 *
 * Migrado desde modules/agendamiento a modules/core (Nov 2025)
 * ====================================================================
 */

const RLSContextManager = require('../../../utils/rlsContextManager');

class ClienteModel {

    static async crear(clienteData) {
        return await RLSContextManager.query(clienteData.organizacion_id, async (db) => {
            const query = `
                INSERT INTO clientes (
                    organizacion_id, nombre, email, telefono, telegram_chat_id, whatsapp_phone,
                    fecha_nacimiento, profesional_preferido_id, notas_especiales, alergias,
                    como_conocio, activo, marketing_permitido, foto_url, lista_precios_id,
                    tipo, rfc, razon_social, calle, colonia, ciudad, estado_id, codigo_postal, pais_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
                RETURNING
                    id, organizacion_id, nombre, email, telefono, telegram_chat_id, whatsapp_phone,
                    fecha_nacimiento, profesional_preferido_id, notas_especiales, alergias,
                    como_conocio, activo, marketing_permitido, foto_url, lista_precios_id,
                    tipo, rfc, razon_social, calle, colonia, ciudad, estado_id, codigo_postal, pais_id,
                    creado_en, actualizado_en
            `;

            const values = [
                clienteData.organizacion_id,
                clienteData.nombre,
                clienteData.email || null,
                clienteData.telefono || null,
                clienteData.telegram_chat_id || null,
                clienteData.whatsapp_phone || null,
                clienteData.fecha_nacimiento || null,
                clienteData.profesional_preferido_id || null,
                clienteData.notas_especiales || null,
                clienteData.alergias || null,
                clienteData.como_conocio || null,
                clienteData.activo !== undefined ? clienteData.activo : true,
                clienteData.marketing_permitido !== undefined ? clienteData.marketing_permitido : true,
                clienteData.foto_url || null,
                clienteData.lista_precios_id || null,
                // Nuevos campos Ene 2026
                clienteData.tipo || 'persona',
                clienteData.rfc || null,
                clienteData.razon_social || null,
                clienteData.calle || null,
                clienteData.colonia || null,
                clienteData.ciudad || null,
                clienteData.estado_id || null,
                clienteData.codigo_postal || null,
                clienteData.pais_id || 1  // Default: México
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
                    if (error.constraint === 'unique_telegram_por_org') {
                        throw new Error(`El Telegram chat ID ${clienteData.telegram_chat_id} ya está registrado en esta organización`);
                    }
                    if (error.constraint === 'unique_whatsapp_por_org') {
                        throw new Error(`El número de WhatsApp ${clienteData.whatsapp_phone} ya está registrado en esta organización`);
                    }
                    if (error.constraint === 'unique_rfc_por_org') {
                        throw new Error(`El RFC ${clienteData.rfc} ya está registrado en esta organización`);
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
                    if (error.constraint === 'valid_tipo') {
                        throw new Error('El tipo de cliente debe ser "persona" o "empresa"');
                    }
                    if (error.constraint === 'valid_rfc') {
                        throw new Error('El formato del RFC no es válido (debe ser RFC mexicano válido)');
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
                    c.id, c.organizacion_id, c.nombre, c.email, c.telefono, c.telegram_chat_id, c.whatsapp_phone,
                    c.fecha_nacimiento, c.profesional_preferido_id, c.notas_especiales, c.alergias,
                    c.como_conocio, c.activo, c.marketing_permitido, c.foto_url, c.lista_precios_id,
                    c.tipo, c.rfc, c.razon_social,
                    c.calle, c.colonia, c.ciudad, c.estado_id, c.codigo_postal, c.pais_id,
                    c.creado_en, c.actualizado_en,
                    lp.codigo as lista_precios_codigo,
                    lp.nombre as lista_precios_nombre,
                    e.nombre as estado_nombre,
                    e.codigo as estado_codigo,
                    p.nombre as pais_nombre,
                    p.codigo_alfa2 as pais_codigo,
                    get_cliente_etiquetas(c.id) as etiquetas
                FROM clientes c
                LEFT JOIN listas_precios lp ON lp.id = c.lista_precios_id
                LEFT JOIN estados e ON e.id = c.estado_id
                LEFT JOIN paises p ON p.id = c.pais_id
                WHERE c.id = $1
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
            tipo,  // Filtro: 'persona' o 'empresa'
            etiqueta_ids,  // Filtro por etiquetas (Ene 2026)
            ordenPor = 'nombre',
            orden = 'ASC'
        } = options;

        return await RLSContextManager.query(organizacionId, async (db) => {
            const camposValidos = ['nombre', 'email', 'telefono', 'tipo', 'creado_en', 'actualizado_en'];
            const ordenValido = ['ASC', 'DESC'].includes(orden.toUpperCase()) ? orden.toUpperCase() : 'ASC';
            const campoOrden = camposValidos.includes(ordenPor) ? ordenPor : 'nombre';

            let whereConditions = [];
            let queryParams = [];
            let paramIndex = 1;

            if (activos !== undefined) {
                whereConditions.push(`c.activo = $${paramIndex}`);
                queryParams.push(activos);
                paramIndex++;
            }

            if (marketing !== undefined) {
                whereConditions.push(`c.marketing_permitido = $${paramIndex}`);
                queryParams.push(marketing);
                paramIndex++;
            }

            // Filtro por tipo de cliente (Ene 2026)
            if (tipo && ['persona', 'empresa'].includes(tipo)) {
                whereConditions.push(`c.tipo = $${paramIndex}`);
                queryParams.push(tipo);
                paramIndex++;
            }

            // Filtro por etiquetas (Ene 2026 - Fase 2)
            if (etiqueta_ids && etiqueta_ids.length > 0) {
                whereConditions.push(`c.id IN (
                    SELECT ce.cliente_id FROM cliente_etiquetas ce
                    WHERE ce.etiqueta_id = ANY($${paramIndex})
                )`);
                queryParams.push(etiqueta_ids);
                paramIndex++;
            }

            if (busqueda) {
                whereConditions.push(`(
                    c.nombre ILIKE $${paramIndex} OR
                    c.email ILIKE $${paramIndex} OR
                    c.telefono ILIKE $${paramIndex} OR
                    c.rfc ILIKE $${paramIndex}
                )`);
                queryParams.push(`%${busqueda}%`);
                paramIndex++;
            }

            const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
            const offset = (page - 1) * limit;

            const query = `
                SELECT
                    c.id, c.organizacion_id, c.nombre, c.email, c.telefono, c.fecha_nacimiento,
                    c.profesional_preferido_id, c.notas_especiales, c.alergias,
                    c.como_conocio, c.activo, c.marketing_permitido, c.foto_url,
                    c.tipo, c.rfc, c.razon_social,
                    c.calle, c.colonia, c.ciudad, c.estado_id, c.codigo_postal, c.pais_id,
                    c.creado_en, c.actualizado_en,
                    e.nombre as estado_nombre,
                    get_cliente_etiquetas(c.id) as etiquetas,
                    COUNT(citas.id) as total_citas,
                    MAX(citas.fecha_cita) as ultima_cita
                FROM clientes c
                LEFT JOIN citas ON c.id = citas.cliente_id
                LEFT JOIN estados e ON e.id = c.estado_id
                ${whereClause}
                GROUP BY c.id, c.organizacion_id, c.nombre, c.email, c.telefono, c.fecha_nacimiento,
                    c.profesional_preferido_id, c.notas_especiales, c.alergias,
                    c.como_conocio, c.activo, c.marketing_permitido, c.foto_url,
                    c.tipo, c.rfc, c.razon_social,
                    c.calle, c.colonia, c.ciudad, c.estado_id, c.codigo_postal, c.pais_id,
                    c.creado_en, c.actualizado_en, e.nombre
                ORDER BY c.${campoOrden} ${ordenValido}
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            queryParams.push(limit, offset);

            const countQuery = `
                SELECT COUNT(DISTINCT c.id) as total
                FROM clientes c
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
                'como_conocio', 'activo', 'marketing_permitido', 'foto_url',
                'lista_precios_id',
                // Nuevos campos Ene 2026
                'tipo', 'rfc', 'razon_social',
                'calle', 'colonia', 'ciudad', 'estado_id', 'codigo_postal', 'pais_id'
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
                    como_conocio, activo, marketing_permitido, foto_url,
                    lista_precios_id, tipo, rfc, razon_social,
                    calle, colonia, ciudad, estado_id, codigo_postal, pais_id,
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
                    if (error.constraint === 'unique_rfc_por_org') {
                        throw new Error(`El RFC ${clienteData.rfc} ya está registrado en esta organización`);
                    }
                }

                if (error.code === '23514') {
                    if (error.constraint === 'valid_tipo') {
                        throw new Error('El tipo de cliente debe ser "persona" o "empresa"');
                    }
                    if (error.constraint === 'valid_rfc') {
                        throw new Error('El formato del RFC no es válido (debe ser RFC mexicano válido)');
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

    static async buscar(termino, organizacionId, limit = 10, tipo = 'nombre') {
        return await RLSContextManager.query(organizacionId, async (db) => {
            let query;
            let queryParams;

            switch (tipo) {
                case 'telegram_chat_id':
                    query = `
                        SELECT
                            id, nombre, email, telefono, telegram_chat_id, whatsapp_phone
                        FROM clientes
                        WHERE activo = true
                        AND telegram_chat_id = $1
                        LIMIT 1
                    `;
                    queryParams = [termino];
                    break;

                case 'whatsapp_phone':
                    query = `
                        SELECT
                            id, nombre, email, telefono, telegram_chat_id, whatsapp_phone
                        FROM clientes
                        WHERE activo = true
                        AND whatsapp_phone = $1
                        LIMIT 1
                    `;
                    queryParams = [termino];
                    break;

                case 'telefono':
                    const telefonoNormalizado = termino.replace(/[\s\-\(\)\+]/g, '');
                    query = `
                        SELECT
                            id, nombre, email, telefono, telegram_chat_id, whatsapp_phone
                        FROM clientes
                        WHERE activo = true
                        AND REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '+', '') LIKE $1
                        LIMIT $2
                    `;
                    queryParams = [`%${telefonoNormalizado}%`, limit];
                    break;

                case 'nombre':
                default:
                    query = `
                        SELECT
                            id, nombre, email, telefono, telegram_chat_id, whatsapp_phone,
                            ts_rank(to_tsvector('spanish', nombre), plainto_tsquery('spanish', $1)) as relevancia
                        FROM clientes
                        WHERE activo = true
                        AND to_tsvector('spanish', nombre) @@ plainto_tsquery('spanish', $1)
                        ORDER BY relevancia DESC, nombre ASC
                        LIMIT $2
                    `;
                    queryParams = [termino, limit];
                    break;
            }

            const result = await db.query(query, queryParams);
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

    /**
     * Obtener estadísticas detalladas de un cliente específico (Vista 360°)
     * @param {number} id - ID del cliente
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Estadísticas completas del cliente
     */
    static async obtenerEstadisticasCliente(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                WITH cliente_citas AS (
                    SELECT
                        COUNT(*) as total_citas,
                        COUNT(*) FILTER (WHERE estado = 'completada') as citas_completadas,
                        COUNT(*) FILTER (WHERE estado = 'cancelada') as citas_canceladas,
                        COUNT(*) FILTER (WHERE estado = 'no_asistio') as citas_no_asistio,
                        MIN(fecha_cita) as primera_cita,
                        MAX(fecha_cita) as ultima_cita,
                        COALESCE(SUM(precio_total), 0) as total_gastado_citas
                    FROM citas
                    WHERE cliente_id = $1
                ),
                cliente_ventas AS (
                    SELECT
                        COUNT(*) as total_compras,
                        COALESCE(SUM(total), 0) as total_gastado_pos,
                        MAX(fecha_venta) as ultima_compra
                    FROM ventas_pos
                    WHERE cliente_id = $1 AND estado = 'completada'
                ),
                servicios_frecuentes AS (
                    SELECT
                        s.nombre as servicio,
                        COUNT(*) as veces
                    FROM citas c
                    JOIN citas_servicios cs ON c.id = cs.cita_id
                    JOIN servicios s ON cs.servicio_id = s.id
                    WHERE c.cliente_id = $1 AND c.estado = 'completada'
                    GROUP BY s.id, s.nombre
                    ORDER BY veces DESC
                    LIMIT 5
                )
                SELECT
                    cc.*,
                    cv.total_compras,
                    cv.total_gastado_pos,
                    cv.ultima_compra,
                    (cc.total_gastado_citas + cv.total_gastado_pos) as total_lifetime_value,
                    COALESCE(
                        (SELECT json_agg(json_build_object('servicio', servicio, 'veces', veces))
                         FROM servicios_frecuentes),
                        '[]'::json
                    ) as servicios_frecuentes
                FROM cliente_citas cc
                CROSS JOIN cliente_ventas cv
            `;

            const result = await db.query(query, [id]);
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
                    notas_especiales, alergias, como_conocio,
                    tipo, rfc, razon_social,
                    calle, colonia, ciudad, estado_id, codigo_postal, pais_id,
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
